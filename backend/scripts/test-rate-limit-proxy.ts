import assert from 'assert';
import http from 'http';
import bcrypt from 'bcryptjs';
import { db } from '../src/db';

function request(options: http.RequestOptions, body?: string): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode || 0, body: parsed, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function loginUser(email: string, pass: string): Promise<string> {
  const payload = JSON.stringify({ email, password: pass });
  const res = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, payload);
  if (!res.body?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

export async function runRateLimitProxyTests() {
  console.log('========================================================================');
  console.log('   TEST: RATE LIMITING BEHIND PROXY (USER-BASED & IP-BASED ISOLATION)   ');
  console.log('========================================================================\n');

  const proxyIp = '198.51.100.88'; // Same proxy IP for both users
  console.log(`Giả lập Proxy IP: ${proxyIp}`);

  // Tạo 2 user độc lập cho bài test
  const password = 'Password123!';
  const hash = await bcrypt.hash(password, 10);
  const ts = Date.now();
  const emailA = `ratelimit_user_a_${ts}@cognito.test`;
  const emailB = `ratelimit_user_b_${ts}@cognito.test`;

  await db.query(
    'INSERT INTO users (email, name, password, phone, role) VALUES ($1, $2, $3, $4, $5)',
    [emailA, 'User A', hash, `091${Math.floor(1000000 + Math.random() * 9000000)}`, 'user']
  );
  await db.query(
    'INSERT INTO users (email, name, password, phone, role) VALUES ($1, $2, $3, $4, $5)',
    [emailB, 'User B', hash, `092${Math.floor(1000000 + Math.random() * 9000000)}`, 'user']
  );

  // 1. Login User A & User B
  const tokenA = await loginUser(emailA, password);
  const tokenB = await loginUser(emailB, password);
  console.log(`✓ Đã tạo và đăng nhập 2 user: User A (${emailA}) và User B (${emailB})\n`);

  // 2. User A gửi liên tiếp 5 requests tới /api/auth/security/rate-limit-auth-probe (limit = 5)
  console.log('--- BƯỚC 1: User A gửi 5 requests qua Proxy IP ---');
  for (let i = 1; i <= 5; i++) {
    const res = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/security/rate-limit-auth-probe',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Forwarded-For': proxyIp
      }
    });
    assert.strictEqual(res.status, 200, `User A request ${i} phải trả về 200`);
    console.log(`  User A request ${i}: Status 200 OK`);
  }

  // 3. Request thứ 6 của User A phải bị chặn 429
  console.log('\n--- BƯỚC 2: User A gửi request thứ 6 (Vượt hạn mức) ---');
  const resA6 = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/security/rate-limit-auth-probe',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenA}`,
      'X-Forwarded-For': proxyIp
    }
  });
  console.log(`  User A request 6: Status ${resA6.status} | Body:`, resA6.body);
  assert.strictEqual(resA6.status, 429, 'User A request thứ 6 phải bị chặn với status 429');
  assert.ok(resA6.body?.error?.includes('tài khoản của bạn'), 'Thông báo lỗi phải chỉ rõ tài khoản người dùng');
  console.log('  ✓ User A đã bị chặn 429 chính xác!');

  // 4. User B gửi request TỪ CÙNG PROXY IP -> Phải thành công 200 OK (KHÔNG CHIA CHUNG HẠN MỨC)
  console.log('\n--- BƯỚC 3: User B gửi request từ CÙNG PROXY IP (Kiểm tra cách ly) ---');
  const resB1 = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/security/rate-limit-auth-probe',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenB}`,
      'X-Forwarded-For': proxyIp
    }
  });
  console.log(`  User B request 1: Status ${resB1.status} | Body:`, resB1.body);
  assert.strictEqual(resB1.status, 200, 'User B KHÔNG ĐƯỢC bị chặn (phải trả về 200 OK)');
  console.log('  ✓ User B nhận 200 OK — Hai user hoàn toàn KHÔNG chia sẻ chung quota rate limit!');

  // 5. Kiểm tra unauthenticated rate limit (chưa đăng nhập -> dùng IP thật sau proxy)
  console.log('\n--- BƯỚC 4: Kiểm tra Route chưa xác thực (dùng IP thật) ---');
  const unauthIp = `203.0.113.${Math.floor(10 + Math.random() * 200)}`;
  for (let i = 1; i <= 5; i++) {
    const res = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/security/rate-limit-probe',
      method: 'GET',
      headers: { 'X-Forwarded-For': unauthIp }
    });
    assert.strictEqual(res.status, 200, `Unauthenticated request ${i} phải trả về 200`);
  }
  const resUnauthBlocked = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/security/rate-limit-probe',
    method: 'GET',
    headers: { 'X-Forwarded-For': unauthIp }
  });
  console.log(`  Unauthenticated request 6: Status ${resUnauthBlocked.status} | Body:`, resUnauthBlocked.body);
  assert.strictEqual(resUnauthBlocked.status, 429, 'Unauthenticated request thứ 6 phải bị chặn với 429');
  assert.ok(resUnauthBlocked.body?.error?.includes('địa chỉ IP này'), 'Thông báo lỗi phải chỉ rõ địa chỉ IP');
  console.log('  ✓ Unauthenticated limiter khóa theo IP thật chính xác!');

  // Cleanup test users
  await db.query('DELETE FROM users WHERE email IN ($1, $2)', [emailA, emailB]);

  console.log('\n========================================================================');
  console.log('  ✅ TẤT CẢ CÁC KIỂM THỬ RATE LIMIT SAU PROXY ĐÃ ĐẠT 100%               ');
  console.log('========================================================================\n');
}

if (require.main === module) {
  runRateLimitProxyTests()
    .then(() => db.end())
    .catch(err => {
      console.error('Test failed:', err);
      db.end();
      process.exit(1);
    });
}
