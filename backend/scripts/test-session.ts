import { db } from '../src/db';
import bcrypt from 'bcryptjs';
import http from 'http';
import { spawnSync } from 'child_process';
import path from 'path';
import { signToken } from '../src/utils/jwt';

function httpRequest(options: http.RequestOptions, bodyBuffer: Buffer | null = null): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  data: any;
}> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const full = Buffer.concat(chunks).toString('utf-8');
        let json: any = null;
        try { json = JSON.parse(full); } catch (e) {}
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          data: json || full
        });
      });
    });
    req.on('error', reject);
    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

async function runSessionTests() {
  console.log('========================================================================');
  console.log('      COGNITO PHASE 38B: SESSION LIFECYCLE & TOKEN SECURITY SUITE       ');
  console.log('========================================================================\n');

  let passed = 0;
  const assert = (cond: boolean, msg: string) => {
    if (cond) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  };

  const testEmail = `session_test_${Date.now()}@cognito.test`;
  const password = 'Password123!';
  const hash = await bcrypt.hash(password, 10);
  const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Tạo user thử nghiệm
  const userRes = await db.query(
    'INSERT INTO users (email, name, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [testEmail, 'Session Test User', hash, phone, 'user']
  );
  const userId = userRes.rows[0].id;

  try {
    // SUITE 1: Đăng nhập và nhận HttpOnly Cookie
    console.log('--- SUITE 1: Login & HttpOnly Cookie Issuance ---');
    const loginPayload = JSON.stringify({ email: testEmail, password });
    const loginRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload)
      }
    }, Buffer.from(loginPayload));

    assert(loginRes.statusCode === 200, '1.1 POST /api/auth/login trả về HTTP 200');
    assert(!!loginRes.data?.token, '1.2 Login response trả về JWT token');
    const setCookie = loginRes.headers['set-cookie'] || [];
    assert(setCookie.some(c => c.includes('token=') && c.includes('HttpOnly')), '1.3 Set-Cookie header chứa token với thuộc tính HttpOnly');

    const token = loginRes.data.token;
    const sessionCookie = `token=${token}`;

    // SUITE 2: Gọi /auth/me qua Cookie xác thực
    console.log('\n--- SUITE 2: Authenticated User Session Verification ---');
    const meRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    assert(meRes.statusCode === 200, '2.1 GET /api/auth/me qua HttpOnly cookie trả về HTTP 200');
    assert(meRes.data?.user?.email === testEmail, '2.2 Thông tin người dùng trả về chính xác email');

    // SUITE 3: Phân định mã lỗi (403 không hủy phiên)
    console.log('\n--- SUITE 3: Error Code Differentiation (Non-Logout on 403) ---');
    const forbiddenRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/users', // User thường gọi route Admin
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    assert(forbiddenRes.statusCode === 403, '3.1 User thường gọi Admin bị chặn với HTTP 403 Forbidden');
    assert(forbiddenRes.data?.code === 'FORBIDDEN', '3.2 Mã code lỗi trả về chính xác FORBIDDEN');

    const checkMeAfter403 = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    assert(checkMeAfter403.statusCode === 200, '3.3 Session người dùng vẫn tồn tại 100% sau khi gặp HTTP 403');

    // SUITE 4: Token Refresh cơ chế Single-Flight
    console.log('\n--- SUITE 4: Refresh Token Capability ---');
    const refreshRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/refresh',
      method: 'POST',
      headers: { 'Cookie': sessionCookie }
    });
    assert(refreshRes.statusCode === 200, '4.1 POST /api/auth/refresh trả về HTTP 200');
    assert(!!refreshRes.data?.token, '4.2 Token mới được cấp thành công qua refresh endpoint');

    // SUITE 5: Xử lý tài khoản bị đình chỉ (Suspended -> 403 ACCOUNT_SUSPENDED)
    console.log('\n--- SUITE 5: Suspended User Handling (403 ACCOUNT_SUSPENDED) ---');
    await db.query('UPDATE users SET is_suspended = true, suspension_reason = $1 WHERE id = $2', [
      'Vi phạm điều khoản cộng đồng thử nghiệm',
      userId
    ]);
    const suspendedRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    assert(suspendedRes.statusCode === 403, '5.1 Tài khoản bị suspended trả về HTTP 403');
    assert(suspendedRes.data?.code === 'ACCOUNT_SUSPENDED', '5.2 Mã lỗi chính xác là ACCOUNT_SUSPENDED');
    assert(suspendedRes.data?.error?.includes('đình chỉ'), '5.3 Thông báo lỗi nêu rõ tài khoản đã bị đình chỉ');
    // Khôi phục lại trạng thái bình thường
    await db.query('UPDATE users SET is_suspended = false, suspension_reason = null WHERE id = $1', [userId]);

    // SUITE 6: DB Error trong middleware -> Trả về 5xx, không bao giờ trả 401
    console.log('\n--- SUITE 6: Middleware Error Safety (DB Error -> 5xx, never 401) ---');
    // Sinh token hợp lệ về mặt mã hóa nhưng mang id vượt ngưỡng integer của DB để gây lỗi truy vấn DB
    const overflowToken = signToken({ id: 9999999999999999, email: 'overflow@test.com', role: 'user' });
    const dbErrorRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${overflowToken}` }
    });
    assert(dbErrorRes.statusCode === 500, '6.1 Lỗi DB trong middleware xác thực trả về HTTP 500');
    assert(dbErrorRes.data?.code === 'INTERNAL_ERROR', '6.2 Mã lỗi trả về là INTERNAL_ERROR, tuyệt đối không trả 401');

    // SUITE 7: Server Boot Protection (Thiếu JWT_SECRET -> từ chối khởi động)
    console.log('\n--- SUITE 7: Server Boot Guard (Missing JWT_SECRET -> Reject Startup) ---');
    const bootProc = spawnSync(
      process.execPath,
      [path.resolve(__dirname, 'test-boot-missing-secret.js')],
      {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf-8'
      }
    );
    assert(bootProc.status !== 0, '7.1 Server từ chối boot (exit code != 0) khi thiếu JWT_SECRET_KEY');
    assert(
      (bootProc.stderr || bootProc.stdout || '').includes('Missing required environment variables') ||
      (bootProc.stderr || bootProc.stdout || '').includes('JWT_SECRET_KEY'),
      '7.2 Thông báo lỗi nêu rõ thiếu biến môi trường JWT_SECRET_KEY'
    );

    // SUITE 8: Mã lỗi 429 Too Many Requests không làm mất phiên
    console.log('\n--- SUITE 8: Rate Limit 429 Does Not Invalidate Session ---');
    let hit429 = false;
    for (let i = 0; i < 8; i++) {
      const probeRes = await httpRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/security/rate-limit-probe',
        method: 'GET'
      });
      if (probeRes.statusCode === 429) {
        hit429 = true;
        break;
      }
    }
    assert(hit429, '8.1 Kích hoạt thành công mã lỗi 429 Too Many Requests từ probe');
    // Kiểm tra session người dùng sau khi gặp 429
    const meAfter429 = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    assert(meAfter429.statusCode === 200, '8.2 Gặp 429 không làm mất phiên: /auth/me trả về 200 OK');
    assert(meAfter429.data?.user?.email === testEmail, '8.3 Dữ liệu phiên người dùng vẫn giữ nguyên vẹn 100%');

    // SUITE 9: Đăng xuất và dọn dẹp Cookie
    console.log('\n--- SUITE 9: Logout & Cookie Invalidation ---');
    const logoutRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { 'Cookie': sessionCookie }
    });
    assert(logoutRes.statusCode === 200, '9.1 POST /api/auth/logout trả về HTTP 200');
    const logoutCookies = logoutRes.headers['set-cookie'] || [];
    assert(logoutCookies.some(c => c.includes('Expires=') || c.includes('Max-Age=0') || c.includes('token=;')), '9.2 Set-Cookie xóa phiên cookie thành công');

    // SUITE 10: Token bị thu hồi do logout -> 401 TOKEN_REVOKED
    console.log('\n--- SUITE 10: Revoked / Blacklisted Token Handling (401 TOKEN_REVOKED) ---');
    const revokedRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(revokedRes.statusCode === 401, '10.1 Token đã logout bị từ chối với HTTP 401');
    assert(revokedRes.data?.code === 'TOKEN_REVOKED', '10.2 Mã lỗi trả về chính xác là TOKEN_REVOKED');
    assert(revokedRes.data?.error?.includes('vô hiệu hóa'), '10.3 Thông báo giải thích rõ token đã bị vô hiệu hóa do đăng xuất');

    console.log('\n========================================================================');
    console.log(`  🎉 HOÀN THÀNH TOÀN BỘ ${passed} ASSERTIONS KIỂM ĐỊNH PHIÊN BẢN 38B!    `);
    console.log('========================================================================\n');
  } finally {
    // Dọn dẹp test user
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
  }
}

runSessionTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Session test failure:', err);
    process.exit(1);
  });
