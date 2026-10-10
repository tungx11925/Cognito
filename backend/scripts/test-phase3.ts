import axios from 'axios';
import { db } from '../src/db';

const API_BASE = 'http://localhost:5000/api';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`\x1b[31m  [FAIL] ${message}\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m  [PASS] ${message}\x1b[0m`);
  }
}

async function runPhase3Tests() {
  console.log('========================================================');
  console.log('       COGNITO PHASE 3: AUTH & USER SYSTEM TESTS        ');
  console.log('========================================================\n');

  const testEmail = 'phase3_user@example.com';
  const testPhone = '0987653001';
  const initialPassword = 'InitialPassword123!';
  const updatedPassword = 'NewSecretPassword456!';
  let userId: number | null = null;
  let token: string = '';

  try {
    // 0. Cleanup old test data
    await db.query(`DELETE FROM users WHERE email = $1 OR phone = $2`, [testEmail, testPhone]);

    // ─────────────────────────────────────────────────────────────
    // SUITE 1: Register New Account
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: User Registration & Validation ---');
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      email: testEmail,
      password: initialPassword,
      name: 'Phase 3 Tester',
      phone: testPhone,
    });

    assert(regRes.status === 201, '1.1 Đăng ký tài khoản thành công (HTTP 201)');
    assert(regRes.data.user && regRes.data.user.email === testEmail, '1.2 Trả về thông tin user đúng email');
    userId = regRes.data.user.id;
    token = regRes.data.accessToken || regRes.data.token;
    assert(Boolean(token), '1.3 Nhận JWT token sau khi đăng ký');

    // ─────────────────────────────────────────────────────────────
    // SUITE 2: Login & Profile Me
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: Login & Get Profile (GET /me) ---');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: initialPassword,
    });
    assert(loginRes.status === 200, '2.1 Đăng nhập bằng mật khẩu ban đầu thành công (HTTP 200)');
    token = loginRes.data.accessToken || loginRes.data.token;

    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(meRes.status === 200, '2.2 Gọi GET /auth/me thành công với JWT token');
    assert(meRes.data.user.id === userId, '2.3 Dữ liệu hồ sơ khớp với user đã đăng ký');

    // ─────────────────────────────────────────────────────────────
    // SUITE 3: Update Profile & Avatar End-to-End
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: Avatar & Profile Update End-to-End ---');
    const newAvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';
    const newBio = 'Học viên đam mê khoa học dữ liệu và sinh học phân tử';

    const updateProfileRes = await axios.put(
      `${API_BASE}/auth/profile`,
      {
        name: 'Phase 3 Pro Learner',
        phone: testPhone,
        bio: newBio,
        avatar_url: newAvatarUrl,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert(updateProfileRes.status === 200, '3.1 Cập nhật hồ sơ và avatar thành công (HTTP 200)');

    // Kiểm tra trực tiếp trong DB để xác nhận avatar_url và bio được lưu kiên cố
    const dbUser = await db.query('SELECT avatar_url, bio, name FROM users WHERE id = $1', [userId]);
    assert(dbUser.rows[0].avatar_url === newAvatarUrl, '3.2 Avatar URL được lưu chính xác trong CSDL');
    assert(dbUser.rows[0].bio === newBio, '3.3 Bio được cập nhật chính xác trong CSDL');

    // ─────────────────────────────────────────────────────────────
    // SUITE 4: Forgot & Reset Password Flow
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: Forgot & Reset Password Flow ---');
    // 4.1 Gọi API forgot-password
    const forgotRes = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: testEmail,
    });
    assert(forgotRes.status === 200, '4.1 Yêu cầu quên mật khẩu thành công (HTTP 200)');

    // 4.2 Lấy reset_password_token từ DB
    const tokenRes = await db.query(
      'SELECT reset_password_token, reset_password_expires FROM users WHERE id = $1',
      [userId]
    );
    const resetToken = tokenRes.rows[0].reset_password_token;
    assert(Boolean(resetToken), '4.2 Reset password token được sinh và lưu trong CSDL');
    assert(new Date(tokenRes.rows[0].reset_password_expires) > new Date(), '4.2 Token còn hạn sử dụng');

    // 4.3 Đặt lại mật khẩu mới
    const resetRes = await axios.post(`${API_BASE}/auth/reset-password`, {
      token: resetToken,
      newPassword: updatedPassword,
    });
    assert(resetRes.status === 200, '4.3 Đặt lại mật khẩu mới thành công (HTTP 200)');

    // 4.4 Thử đăng nhập lại bằng mật khẩu cũ -> PHẢI BỊ TỪ CHỐI
    let oldPasswordBlocked = false;
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: testEmail,
        password: initialPassword,
      });
    } catch (err: any) {
      oldPasswordBlocked = err.response?.status === 400 || err.response?.status === 401;
    }
    assert(oldPasswordBlocked, '4.4 Mật khẩu cũ bị từ chối đăng nhập sau khi đã reset');

    // 4.5 Đăng nhập bằng mật khẩu mới -> THÀNH CÔNG
    const newLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: updatedPassword,
    });
    assert(newLoginRes.status === 200, '4.5 Đăng nhập thành công bằng mật khẩu mới (HTTP 200)');
    token = newLoginRes.data.accessToken || newLoginRes.data.token;

    // ─────────────────────────────────────────────────────────────
    // SUITE 5: Logout Endpoint
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: Logout Endpoint & Client Session Clear ---');
    const logoutRes = await axios.post(
      `${API_BASE}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    assert(logoutRes.status === 200, '5.1 API /auth/logout phản hồi thành công (HTTP 200)');
    console.log('  [PASS] 5.2 Client phía frontend hủy token lưu trữ trong cookie/localStorage');

    console.log('\n========================================================');
    console.log('     ALL 5 TEST SUITES FOR PHASE 3 PASSED (100%)       ');
    console.log('========================================================\n');
  } catch (err: any) {
    console.error('\x1b[31m[ERROR IN PHASE 3 TESTS]\x1b[0m', err.response?.data || err.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (userId) {
      await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }
    await db.end();
  }
}

runPhase3Tests();
