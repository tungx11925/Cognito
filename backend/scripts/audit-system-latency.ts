/**
 * SYSTEM AUDIT & END-TO-END LATENCY BENCHMARK
 * Kiểm tra toàn bộ 11 chức năng hệ thống & đo lường tốc độ phản hồi (ms)
 */

import axios from 'axios';
import { db } from '../src/db';

const API_URL = process.env.API_URL || 'http://localhost:5000';

interface LatencyResult {
  domain: string;
  feature: string;
  method: string;
  endpoint: string;
  status: number;
  latencyMs: number;
  rating: string;
}

const results: LatencyResult[] = [];

function rateLatency(ms: number): string {
  if (ms < 50) return '⚡ Siêu nhanh (<50ms)';
  if (ms < 150) return '🟢 Mượt mà (<150ms)';
  if (ms < 300) return '🟡 Tốt (<300ms)';
  return '🔴 Cần lưu ý (>300ms)';
}

async function benchmark(
  domain: string,
  feature: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  headers?: any
) {
  const start = Date.now();
  try {
    const res = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data,
      headers,
      timeout: 10000,
    });
    const latencyMs = Date.now() - start;
    results.push({
      domain,
      feature,
      method,
      endpoint,
      status: res.status,
      latencyMs,
      rating: rateLatency(latencyMs),
    });
    return res;
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const status = err.response?.status || 500;
    results.push({
      domain,
      feature,
      method,
      endpoint,
      status,
      latencyMs,
      rating: `❌ Error ${status}`,
    });
    throw err;
  }
}

async function runAudit() {
  console.log('\n========================================================================');
  console.log('       COGNITO SYSTEM-WIDE HEALTH & LATENCY BENCHMARK AUDIT             ');
  console.log('========================================================================\n');

  const ts = Date.now();
  const testEmail = `audit_perf_${ts}@test.local`;
  const adminEmail = `audit_admin_${ts}@test.local`;

  // 1. SETUP TEST USERS
  console.log('[1/11] 🔐 Đang kiểm tra Domain AUTHENTICATION & USER...');
  const regUserRes = await benchmark(
    'AUTH',
    'Đăng ký tài khoản mới (Register)',
    'POST',
    '/api/auth/register',
    {
      name: `Audit Tester ${ts}`,
      email: testEmail,
      password: 'Password123!',
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
    }
  );

  const userToken = regUserRes.data.token;
  const userId = regUserRes.data.user.id;
  const userHeaders = { Authorization: `Bearer ${userToken}`, 'x-internal-test': 'true' };

  await benchmark('AUTH', 'Đăng nhập mật khẩu (Login)', 'POST', '/api/auth/login', {
    email: testEmail,
    password: 'Password123!',
  });

  await benchmark('AUTH', 'Lấy thông tin cá nhân (Get Profile)', 'GET', '/api/auth/me', undefined, userHeaders);

  await benchmark(
    'USER',
    'Cập nhật hồ sơ (Update Profile)',
    'PUT',
    '/api/auth/profile',
    { name: `Audit Tester Updated ${ts}` },
    userHeaders
  );

  // Setup Admin user
  const regAdminRes = await axios.post(`${API_URL}/api/auth/register`, {
    name: `Admin Tester ${ts}`,
    email: adminEmail,
    password: 'Password123!',
    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
  });
  const adminId = regAdminRes.data.user.id;
  await db.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [adminId]);
  const adminLoginRes = await axios.post(`${API_URL}/api/auth/login`, {
    email: adminEmail,
    password: 'Password123!',
  });
  const adminHeaders = { Authorization: `Bearer ${adminLoginRes.data.token}`, 'x-internal-test': 'true' };

  // 2. DOCUMENT MANAGEMENT
  console.log('[2/11] 📄 Đang kiểm tra Domain DOCUMENT MANAGEMENT...');
  await benchmark('DOCUMENT', 'Danh sách tài liệu phân trang', 'GET', '/api/documents?page=1&limit=10', undefined, userHeaders);

  const createDocRes = await benchmark(
    'DOCUMENT',
    'Tải lên/Tạo mới tài liệu (Create Document)',
    'POST',
    '/api/documents',
    {
      title: 'Tài Liệu Ôn Tập Benchmark',
      description: 'Mô tả tài liệu benchmark',
      category: 'Toán học',
      docUrl: 'data:text/plain;charset=utf-8,Tai%20lieu%20on%20tap%20benchmark',
      solutionText: 'Nội dung kiến thức cốt lõi phục vụ benchmark hiệu năng hệ thống.',
      visibility: 'private',
    },
    userHeaders
  );
  const docId = createDocRes.data.id;

  await db.query(
    `INSERT INTO document_chunks (document_id, chunk_index, content, token_count)
     VALUES ($1, 0, 'Nội dung kiến thức cốt lõi phục vụ benchmark hiệu năng hệ thống.', 20)`,
    [docId]
  );

  await benchmark('DOCUMENT', 'Chi tiết tài liệu (Document Details)', 'GET', `/api/documents/${docId}`, undefined, userHeaders);

  // 3. QUIZ & TEST SYSTEM
  console.log('[3/11] 📝 Đang kiểm tra Domain QUIZ & EXAM SYSTEM...');
  await benchmark('QUIZ', 'Danh sách bộ đề thi (Test Sets)', 'GET', '/api/test-sets?page=1&limit=10', undefined, userHeaders);

  const tsDb = await db.query(
    `INSERT INTO test_sets (created_by, name, total_questions, total_score, is_active, status, visibility)
     VALUES ($1, 'Đề thi Benchmark Hiệu Năng', 1, 5.0, true, 'APPROVED', 'private')
     RETURNING id`,
    [userId]
  );
  const testSetId = tsDb.rows[0].id;

  const qDb = await db.query(
    `INSERT INTO questions (test_set_id, type, content, score, options, correct_answer, explanation, difficulty, status)
     VALUES ($1, 'MULTIPLE_CHOICE', 'Câu hỏi benchmark 1?', 5.0,
             $2, $3, 'Giải thích câu hỏi', 'easy', 'APPROVED')
     RETURNING id`,
    [testSetId, JSON.stringify({ A: 'Đáp án A', B: 'Đáp án B', C: 'Đáp án C', D: 'Đáp án D' }), JSON.stringify('A')]
  );

  await benchmark('QUIZ', 'Chi tiết đề thi & Câu hỏi', 'GET', `/api/test-sets/${testSetId}`, undefined, userHeaders);

  const attemptRes = await benchmark(
    'QUIZ',
    'Khởi tạo lượt thi (Start Quiz)',
    'POST',
    '/api/quizzes/start',
    { testSetId },
    userHeaders
  );
  const attemptId = attemptRes.data.attempt.id;

  await benchmark(
    'QUIZ',
    'Nộp bài & Chấm điểm tự động (Submit Quiz)',
    'POST',
    `/api/quizzes/attempts/${attemptId}/submit`,
    {
      answers: [{ questionId: qDb.rows[0].id, answer: 'A' }],
      durationSeconds: 15,
    },
    userHeaders
  );

  await benchmark('QUIZ', 'Chi tiết kết quả lượt thi (Attempt Result)', 'GET', `/api/quizzes/attempts/${attemptId}`, undefined, userHeaders);
  await benchmark('QUIZ', 'Lịch sử làm bài thi (Quiz History)', 'GET', '/api/quizzes/history', undefined, userHeaders);

  // 4. NOTES & WORKSPACE
  console.log('[4/11] 📓 Đang kiểm tra Domain NOTES & WORKSPACE...');
  await benchmark('NOTES', 'Danh sách ghi chú (List Notes)', 'GET', '/api/notes', undefined, userHeaders);
  await benchmark(
    'NOTES',
    'Tạo ghi chú mới (Create Note)',
    'POST',
    '/api/notes',
    { title: 'Ghi chú Benchmark', content: 'Nội dung ghi chú ôn thi', documentId: docId },
    userHeaders
  );
  await benchmark('MINDMAP', 'Danh sách sơ đồ tư duy (List Mindmaps)', 'GET', '/api/mindmaps', undefined, userHeaders);
  await benchmark('FLASHCARD', 'Danh sách bộ thẻ nhớ (List Decks)', 'GET', '/api/flashcards/decks', undefined, userHeaders);

  // 5. COMMUNITY ECOSYSTEM
  console.log('[5/11] 🌐 Đang kiểm tra Domain COMMUNITY ECOSYSTEM...');
  await benchmark('COMMUNITY', 'Bảng tin công khai (Community Feed)', 'GET', '/api/community/feed?page=1&limit=10', undefined, userHeaders);
  await benchmark('COMMUNITY', 'Tìm kiếm bài đăng (Search Community)', 'GET', '/api/community/feed?search=Benchmark&page=1&limit=10', undefined, userHeaders);
  await benchmark('COMMUNITY', 'Tài nguyên cá nhân (My Resources)', 'GET', '/api/community/my-resources', undefined, userHeaders);

  // 6. MESSAGING
  console.log('[6/11] 💬 Đang kiểm tra Domain DIRECT MESSAGING...');
  await benchmark('MESSAGING', 'Danh sách hội thoại (Conversations)', 'GET', '/api/messages/conversations', undefined, userHeaders);
  await benchmark('MESSAGING', 'Số tin nhắn chưa đọc (Unread Count)', 'GET', '/api/messages/unread-count', undefined, userHeaders);

  // 7. FOCUS & PROGRESS
  console.log('[7/11] ⏱️ Đang kiểm tra Domain FOCUS MODE & PROGRESS...');
  await benchmark('FOCUS', 'Phiên tập trung hoạt động (Active Focus)', 'GET', '/api/focus/active', undefined, userHeaders);
  await benchmark('FOCUS', 'Thống kê phiên tập trung (Focus Stats)', 'GET', '/api/study-sessions/stats', undefined, userHeaders);
  await benchmark('PROGRESS', 'Tiến độ học tập tổng quan (Progress Summary)', 'GET', '/api/progress/summary', undefined, userHeaders);
  await benchmark('PROGRESS', 'Chuỗi ngày học tập (Learning Streak)', 'GET', '/api/progress/streak', undefined, userHeaders);
  await benchmark('PROGRESS', 'Bảng xếp hạng (Leaderboard)', 'GET', '/api/leaderboard?type=weekly', undefined, userHeaders);
  await benchmark('PROGRESS', 'Mục tiêu học tập (Learning Goals)', 'GET', '/api/learning-goals', undefined, userHeaders);

  // 8. NOTIFICATIONS
  console.log('[8/11] 🔔 Đang kiểm tra Domain NOTIFICATIONS...');
  await benchmark('NOTIFICATION', 'Danh sách thông báo (Notifications)', 'GET', '/api/notifications?page=1&limit=10', undefined, userHeaders);
  await benchmark('NOTIFICATION', 'Số thông báo chưa đọc (Unread Count)', 'GET', '/api/notifications/unread-count', undefined, userHeaders);

  // 9. PREMIUM & PAYMENT
  console.log('[9/11] 💳 Đang kiểm tra Domain PREMIUM & PAYMENT...');
  await benchmark('PREMIUM', 'Danh mục gói cước (Plans Catalog)', 'GET', '/api/payment/plans', undefined, userHeaders);
  await benchmark('PREMIUM', 'Kiểm tra hạn mức & quyền lợi (Entitlements)', 'GET', '/api/payment/entitlements', undefined, userHeaders);

  // 10. UNIFIED SEARCH
  console.log('[10/11] 🔍 Đang kiểm tra Domain UNIFIED SEARCH...');
  await benchmark('SEARCH', 'Tìm kiếm toàn diện (Unified Search)', 'GET', '/api/search?q=Benchmark&page=1&limit=10', undefined, userHeaders);
  await benchmark('SEARCH', 'Gợi ý từ khóa tìm kiếm (Suggestions)', 'GET', '/api/search/suggestions?q=Bench', undefined, userHeaders);

  // 11. ADMIN DASHBOARD & STATS
  console.log('[11/11] 👑 Đang kiểm tra Domain ADMIN DASHBOARD...');
  await benchmark('ADMIN', 'Thống kê tổng quan hệ thống (Admin Stats Cache)', 'GET', '/api/admin/stats', undefined, adminHeaders);
  await benchmark('ADMIN', 'Danh sách quản lý người dùng (Admin Users)', 'GET', '/api/admin/users?page=1&limit=10', undefined, adminHeaders);
  await benchmark('ADMIN', 'Lịch sử thanh toán & Đơn hàng (Admin Orders)', 'GET', '/api/admin/orders?page=1&limit=10', undefined, adminHeaders);
  await benchmark('ADMIN', 'Quản lý gói đăng ký (Admin Subscriptions)', 'GET', '/api/admin/subscriptions?page=1&limit=10', undefined, adminHeaders);

  // CLEANUP TEST DATA
  console.log('\n[Dọn dẹp] Dọn sạch dữ liệu benchmark tạm thời...');
  await db.query(`DELETE FROM users WHERE id IN ($1, $2)`, [userId, adminId]);

  // IN BẢNG KẾT QUẢ ĐO LƯỜNG TỐC ĐỘ PHẢN HỒI
  console.log('\n========================================================================================');
  console.log('                 BẢNG ĐO LƯỜNG TỐC ĐỘ PHẢN HỒI CHI TIẾT (RESPONSE TIME)                  ');
  console.log('========================================================================================');
  console.log(
    'Domain'.padEnd(14) +
    'Chức Năng'.padEnd(44) +
    'Method & Endpoint'.padEnd(38) +
    'HTTP'.padEnd(6) +
    'Độ Trễ'.padEnd(10) +
    'Đánh Giá Trải Nghiệm'
  );
  console.log('----------------------------------------------------------------------------------------');

  let totalMs = 0;
  for (const r of results) {
    totalMs += r.latencyMs;
    const ep = `${r.method} ${r.endpoint.split('?')[0]}`;
    console.log(
      r.domain.padEnd(14) +
      r.feature.padEnd(44) +
      ep.padEnd(38) +
      r.status.toString().padEnd(6) +
      `${r.latencyMs}ms`.padEnd(10) +
      r.rating
    );
  }
  console.log('----------------------------------------------------------------------------------------');
  const avgMs = Math.round(totalMs / results.length);
  console.log(`🏆 TỔNG CỘNG: ${results.length}/${results.length} Chức Năng Hoạt Động Hoàn Hảo (100% OK)`);
  console.log(`⏱️ ĐỘ TRỄ TRUNG BÌNH TOÀN HỆ THỐNG: ${avgMs}ms / request (Chuẩn mượt mà: <100ms)`);
  console.log('========================================================================================\n');
}

runAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Audit Error:', err?.message || err);
    process.exit(1);
  });
