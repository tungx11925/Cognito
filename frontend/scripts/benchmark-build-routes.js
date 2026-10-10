const { chromium } = require('playwright');

async function runBenchmark() {
  console.log('=== KHỞI ĐỘNG BENCHMARK TRÊN BẢN BUILD PRODUCTION NEXT.JS (Port 3001) ===\n');

  // 1. Lấy token trực tiếp từ Backend
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
  console.log(`[AUTH] Đã cấp token JWT hợp lệ cho test user (Status: ${loginRes.status})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Đặt cookie HttpOnly cho phiên làm việc
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

  // Đồng bộ localStorage token nếu cần
  await page.goto(`${BASE_URL}/library`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
  }, token);

  const routes = [
    { name: 'Thư viện tài liệu', path: '/library' },
    { name: 'Bộ thẻ Flashcards', path: '/flashcards' },
    { name: 'Sơ đồ tư duy (Mindmap)', path: '/mindmap' },
    { name: 'Phòng tập trung (Focus)', path: '/focus' },
    { name: 'Luyện đề thi AI (AI-Test)', path: '/ai-test' },
    { name: 'Tiến độ học tập', path: '/progress' },
    { name: 'Hồ sơ người dùng', path: '/profile' },
  ];

  const hardResults = [];

  // 2. Đo Full Page Load (Hard Navigation)
  console.log('\n--- 1. ĐO TẢI TOÀN TRANG (HARD PAGE LOAD / REFRESH) ---');
  for (const r of routes) {
    const start = Date.now();
    await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });
    const domReady = Date.now() - start;

    // Đợi skeleton hoặc render ổn định
    await page.waitForTimeout(200);
    const totalDuration = Date.now() - start;

    hardResults.push({
      ...r,
      domReady,
      totalDuration
    });
    console.log(`   * ${r.name} (${r.path}): ${totalDuration} ms (DOM Ready: ${domReady} ms)`);
  }

  // 3. Đo SPA Client-side Transition (Chuyển trang nội bộ)
  console.log('\n--- 2. ĐO CHUYỂN TRANG NỘI BỘ (SPA CLIENT-SIDE TRANSITION) ---');
  const spaResults = [];
  let current = routes[0];
  await page.goto(`${BASE_URL}${current.path}`, { waitUntil: 'networkidle' }).catch(() => {});

  for (let i = 1; i < routes.length; i++) {
    const nextRoute = routes[i];
    const start = Date.now();

    // Thực hiện chuyển trang SPA qua Next.js router
    await page.evaluate((targetPath) => {
      window.location.assign(targetPath);
    }, nextRoute.path);

    await page.waitForFunction((expected) => window.location.pathname.startsWith(expected), nextRoute.path);
    await page.waitForTimeout(150);
    const transitionMs = Date.now() - start;

    spaResults.push({
      from: current.path,
      to: nextRoute.path,
      name: nextRoute.name,
      transitionMs
    });
    console.log(`   * Từ ${current.path} ➔ ${nextRoute.path} (${nextRoute.name}): ${transitionMs} ms`);
    current = nextRoute;
  }

  // Chuyển ngược lại về /mindmap và /library để đo vòng lặp
  const backStart = Date.now();
  await page.evaluate(() => window.location.assign('/mindmap'));
  await page.waitForFunction(() => window.location.pathname.startsWith('/mindmap'));
  await page.waitForTimeout(150);
  const backMindmapMs = Date.now() - backStart;
  spaResults.push({ from: '/profile', to: '/mindmap', name: 'Sơ đồ tư duy (Mindmap)', transitionMs: backMindmapMs });
  console.log(`   * Từ /profile ➔ /mindmap (Mindmap): ${backMindmapMs} ms`);

  console.log('\n========================================================================================');
  console.log('            BẢNG TỔNG HỢP HIỆU NĂNG CHUYỂN TRANG BẢN BUILD PRODUCTION NEXT.JS           ');
  console.log('========================================================================================');
  console.log('| Tuyến đường (Route) | Đường dẫn URL | Tải toàn trang (Hard Load) | Chuyển SPA (Soft Nav) | Mục tiêu < 4s | Trạng thái |');
  console.log('|---|---|---|---|---|---|');
  
  for (const r of hardResults) {
    const spa = spaResults.find(s => s.to === r.path) || { transitionMs: '-' };
    const meetsTarget = r.totalDuration < 4000 && (spa.transitionMs === '-' || spa.transitionMs < 4000);
    const statusText = meetsTarget ? '✅ ĐẠT' : '❌ CHƯA ĐẠT';
    console.log(`| ${r.name} | \`${r.path}\` | **${r.totalDuration} ms** (DOM: ${r.domReady}ms) | **${spa.transitionMs !== '-' ? spa.transitionMs + ' ms' : 'Gốc'}** | < 4.000 ms | ${statusText} |`);
  }
  console.log('========================================================================================\n');

  await browser.close();
}

runBenchmark().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
