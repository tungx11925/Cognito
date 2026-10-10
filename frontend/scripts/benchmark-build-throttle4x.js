const { chromium } = require('playwright');

async function runBenchmark() {
  console.log('=== KHỞI ĐỘNG BENCHMARK BẢN BUILD VỚI CPU THROTTLE 4X (ĐÃ ĐĂNG NHẬP) ===\n');

  // 1. Đăng nhập qua BE để lấy token
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test_login_user@cognito.test',
      password: 'Password123!'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  if (!token) {
    console.error('Đăng nhập thất bại:', loginData);
    process.exit(1);
  }
  console.log(`[AUTH] Đã đăng nhập người dùng thành công (ID: ${loginData.user?.id})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Đặt cookie HttpOnly
  await context.addCookies([
    {
      name: 'token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }
  ]);

  const page = await context.newPage();
  const BASE_URL = 'http://localhost:3001';

  // Định nghĩa các route và hàm kiểm tra dữ liệu hiển thị thực tế (Data Rendered / Content Visible)
  const routes = [
    { 
      name: 'Thư viện tài liệu', 
      path: '/library',
      checkReady: async (p) => {
        await p.locator('h1, h2, h3, button, div').filter({ hasText: /Tài liệu|Thư viện/i }).first().waitFor({ state: 'visible', timeout: 10000 });
      }
    },
    { 
      name: 'Bộ thẻ Flashcards', 
      path: '/flashcards',
      checkReady: async (p) => {
        await p.locator('h1, h2, h3, button, div').filter({ hasText: /Flashcards|Bộ thẻ/i }).first().waitFor({ state: 'visible', timeout: 10000 });
      }
    },
    { 
      name: 'Sơ đồ tư duy (Mindmap)', 
      path: '/mindmap',
      checkReady: async (p) => {
        await p.locator('h1, h2, h3, button, div').filter({ hasText: /Mindmap|Sơ đồ tư duy/i }).first().waitFor({ state: 'visible', timeout: 10000 });
      }
    },
    { 
      name: 'Phòng tập trung (Focus)', 
      path: '/focus',
      checkReady: async (p) => {
        await p.locator('h1, h2, h3, button, div').filter({ hasText: /Tập trung|Bắt đầu|Pomodoro/i }).first().waitFor({ state: 'visible', timeout: 10000 });
      }
    },
    { 
      name: 'Luyện đề thi AI (AI-Test)', 
      path: '/ai-test',
      checkReady: async (p) => {
        await p.locator('h1, h2, h3, button, div').filter({ hasText: /Bài tập AI|Tạo đề mới/i }).first().waitFor({ state: 'visible', timeout: 10000 });
      }
    },
    { 
      name: 'Tiến độ học tập', 
      path: '/progress',
      checkReady: async (p) => {
        await p.locator('h1, h2, h3, div').filter({ hasText: /Tiến độ|Streak|học tập/i }).first().waitFor({ state: 'visible', timeout: 10000 });
      }
    },
    { 
      name: 'Hồ sơ người dùng', 
      path: '/profile',
      checkReady: async (p) => {
        await p.locator('h1, h2, h3, div').filter({ hasText: /Hồ sơ|Thông tin|test_login_user/i }).first().waitFor({ state: 'visible', timeout: 10000 });
      }
    },
  ];

  // Warm-up nhẹ server để load module vào RAM
  console.log('[WARMUP] Đang tải trước các trang để khởi tạo module...');
  for (const r of routes) {
    await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  }
  console.log('[WARMUP] Hoàn tất warm-up!\n');

  // Kích hoạt CPU Throttling Rate: 4x qua CDP
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  console.log('[PERF] Đã kích hoạt Chrome CPU Throttling Rate: 4x (Mô phỏng máy yếu / mobile)\n');

  const hardResults = [];

  // --- PHẦN 1: TẢI TOÀN TRANG (HARD LOAD) VỚI CPU THROTTLE 4X ---
  console.log('--- 1. TẢI TOÀN TRANG (HARD LOAD) TÍNH TỚI LÚC DỮ LIỆU HIỂN THỊ (CPU 4X) ---');
  for (const r of routes) {
    const start = Date.now();
    await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });
    const domReady = Date.now() - start;

    // Chờ tới khi dữ liệu hiển thị thực tế
    await r.checkReady(page);
    const dataRendered = Date.now() - start;

    hardResults.push({
      ...r,
      domReady,
      dataRendered
    });
    console.log(`   * ${r.name} (${r.path}): Dữ liệu hiển thị trong ${dataRendered} ms (DOM Ready: ${domReady} ms)`);
  }

  // --- PHẦN 2: CHUYỂN TRANG NỘI BỘ (SPA TRANSITION) VỚI CPU THROTTLE 4X ---
  console.log('\n--- 2. CHUYỂN TRANG NỘI BỘ (SPA SOFT NAVIGATION) TÍNH TỚI LÚC DỮ LIỆU HIỂN THỊ (CPU 4X) ---');
  const spaResults = [];
  let current = routes[0];
  await page.goto(`${BASE_URL}${current.path}`);
  await current.checkReady(page);

  for (let i = 1; i < routes.length; i++) {
    const nextRoute = routes[i];
    const start = Date.now();

    // Thực hiện chuyển trang SPA
    await page.evaluate((targetPath) => {
      window.location.assign(targetPath);
    }, nextRoute.path);

    // Chờ dữ liệu hiển thị của trang đích
    await nextRoute.checkReady(page);
    const transitionMs = Date.now() - start;

    spaResults.push({
      from: current.path,
      to: nextRoute.path,
      name: nextRoute.name,
      transitionMs
    });
    console.log(`   * Chuyển ${current.path} ➔ ${nextRoute.path} (${nextRoute.name}): Dữ liệu hiển thị trong ${transitionMs} ms`);
    current = nextRoute;
  }

  // Đo thêm chặng quay lại /mindmap từ /profile
  const backStart = Date.now();
  await page.evaluate(() => window.location.assign('/mindmap'));
  await routes[2].checkReady(page);
  const backMindmapMs = Date.now() - backStart;
  spaResults.push({ from: '/profile', to: '/mindmap', name: 'Sơ đồ tư duy (Mindmap)', transitionMs: backMindmapMs });
  console.log(`   * Chuyển /profile ➔ /mindmap (Mindmap): Dữ liệu hiển thị trong ${backMindmapMs} ms`);

  console.log('\n========================================================================================================');
  console.log('         BẢNG TỔNG HỢP HIỆU NĂNG BẢN BUILD KHI ĐÃ ĐĂNG NHẬP + CPU THROTTLE 4X (DỮ LIỆU HIỂN THỊ)        ');
  console.log('========================================================================================================');
  console.log('| Tuyến đường (Route) | Đường dẫn URL | Tải toàn trang (Hard Load) | Chuyển SPA (Soft Nav) | Mục tiêu < 4s | Trạng thái |');
  console.log('|---|---|---|---|---|---|');
  
  for (const r of hardResults) {
    const spa = spaResults.find(s => s.to === r.path) || { transitionMs: '-' };
    const meetsTarget = r.dataRendered < 4000 && (spa.transitionMs === '-' || spa.transitionMs < 4000);
    const statusText = meetsTarget ? '✅ ĐẠT' : '❌ CHƯA ĐẠT';
    console.log(`| ${r.name} | \`${r.path}\` | **${r.dataRendered} ms** (DOM: ${r.domReady}ms) | **${spa.transitionMs !== '-' ? spa.transitionMs + ' ms' : 'Gốc'}** | < 4.000 ms | ${statusText} |`);
  }
  console.log('========================================================================================================\n');

  await browser.close();
}

runBenchmark().catch(err => {
  console.error('Lỗi benchmark:', err);
  process.exit(1);
});
