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

export async function runPhase10Tests() {
  console.log('========================================================');
  console.log('    COGNITO PHASE 10: LEARNING ACTIVITY + GOAL + PROGRESS ');
  console.log('========================================================\n');

  let testUserId: number | null = null;
  let testUserToken = '';
  let authHeaders = { Authorization: '' };

  try {
    // ─────────────────────────────────────────────────────────────
    // Setup test user
    // ─────────────────────────────────────────────────────────────
    const testEmail = 'phase10_student@example.com';
    const testPhone = '0987650010';

    await db.query(`DELETE FROM users WHERE email = $1 OR phone = $2`, [testEmail, testPhone]);

    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      email: testEmail,
      password: 'Password123!',
      name: 'Phase 10 Learner',
      phone: testPhone,
    });

    testUserToken = regRes.data.accessToken || regRes.data.token;
    testUserId = regRes.data.user.id;
    authHeaders = { Authorization: `Bearer ${testUserToken}` };

    console.log(`[SETUP] Registered test user id=${testUserId} (${testEmail})\n`);

    // ─────────────────────────────────────────────────────────────
    // SUITE 1: Clean User & Zero Fake Data (Authentic Initial State)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: Zero Fake Data (Authentic Initial State) ---');

    const summaryRes1 = await axios.get(`${API_BASE}/progress/summary`, { headers: authHeaders });
    const s1 = summaryRes1.data;

    assert(summaryRes1.status === 200, 'GET /api/progress/summary returns 200 OK');
    assert(s1.total_study_minutes === 0, `User mới tinh có total_study_minutes = 0 (thực tế: ${s1.total_study_minutes}, không hardcode 185)`);
    assert(s1.total_activities === 0, `User mới tinh có total_activities = 0 (thực tế: ${s1.total_activities}, không hardcode 12)`);
    assert(s1.total_quizzes_completed === 0, `User mới tinh có total_quizzes_completed = 0`);
    assert(s1.total_flashcards_reviewed === 0, `User mới tinh có total_flashcards_reviewed = 0`);
    assert(s1.streak.currentStreak === 0, `User mới tinh có streak.currentStreak = 0 (không hardcode 12)`);
    assert(s1.streak.studiedToday === false, `User mới tinh có streak.studiedToday = false`);
    assert(Array.isArray(s1.daily_goals) && s1.daily_goals.length === 0, `User mới tinh có danh sách daily_goals rỗng`);
    assert(Array.isArray(s1.recent_activities) && s1.recent_activities.length === 0, `User mới tinh có danh sách recent_activities rỗng`);
    assert(s1.weekly_chart.length === 7, `weekly_chart có đủ 7 ngày`);
    const allZeroMinutes = s1.weekly_chart.every((c: any) => c.minutes === 0);
    assert(allZeroMinutes, `Tất cả các ngày trong tuần của user mới đều có số phút học = 0`);

    const streakRes1 = await axios.get(`${API_BASE}/progress/streak`, { headers: authHeaders });
    assert(streakRes1.status === 200, 'GET /api/progress/streak returns 200 OK');
    assert(streakRes1.data.currentStreak === 0, `API /streak trả về currentStreak = 0 cho user mới`);
    assert(streakRes1.data.studiedToday === false, `API /streak trả về studiedToday = false`);

    console.log('\n--- SUITE 2: Idempotent Activity Logging ---');

    const testIdempotencyKey = `quiz_attempt:p10_test_${Date.now()}`;
    const activityPayload = {
      activity_type: 'take_quiz',
      entity_type: 'test_set',
      entity_id: 101,
      duration_seconds: 150,
      subject: 'Toán học',
      details: { score: 9.5, correctCount: 9, totalQuestions: 10 },
      idempotency_key: testIdempotencyKey,
    };

    // Lần gọi 1: Tạo mới
    const logRes1 = await axios.post(`${API_BASE}/learning-activities`, activityPayload, { headers: authHeaders });
    assert(logRes1.status === 201, `Ghi nhận activity lần đầu trả về 201 Created`);
    assert(logRes1.data.isNew === true, `isNew = true cho hoạt động ghi mới`);
    assert(logRes1.data.activity.idempotency_key === testIdempotencyKey, `idempotency_key được lưu đúng`);
    assert(logRes1.data.activity.duration_seconds === 150, `duration_seconds lưu đúng 150s`);

    // Lần gọi 2: Lặp lại cùng payload & idempotency_key
    const logRes2 = await axios.post(`${API_BASE}/learning-activities`, activityPayload, { headers: authHeaders });
    assert(logRes2.status === 200, `Ghi nhận activity lặp lại trả về 200 OK (idempotent, không ném lỗi 500)`);
    assert(logRes2.data.isNew === false, `isNew = false cho hoạt động trùng lặp`);
    assert(logRes2.data.activity.id === logRes1.data.activity.id, `Trả về đúng ID của bản ghi ban đầu`);

    // Kiểm tra trực tiếp trong DB
    const dbCountRes = await db.query(
      `SELECT COUNT(*) as count FROM learning_activities WHERE user_id = $1 AND idempotency_key = $2`,
      [testUserId, testIdempotencyKey]
    );
    assert(parseInt(dbCountRes.rows[0].count, 10) === 1, `DB chỉ lưu đúng DUY NHẤT 1 bản ghi (không nhân đôi dữ liệu)`);

    console.log('\n--- SUITE 3: Learning Goals CRUD & Dynamic Progress Calculation ---');

    // 1. Tạo mục tiêu học 60 phút mỗi ngày
    const createGoalRes = await axios.post(
      `${API_BASE}/learning-goals`,
      {
        title: 'Học Java mỗi ngày',
        subject: 'Java',
        target_type: 'study_time_minutes',
        target_value: 60,
        period: 'daily',
      },
      { headers: authHeaders }
    );
    assert(createGoalRes.status === 201, `POST /learning-goals trả về 201 Created`);
    const goalId = createGoalRes.data.id;
    assert(createGoalRes.data.title === 'Học Java mỗi ngày', `Tiêu đề mục tiêu đúng`);
    assert(createGoalRes.data.target_value === 60, `Target value đúng`);

    // 2. Danh sách mục tiêu khi chưa có hoạt động Java nào hôm nay
    const goalsListRes1 = await axios.get(`${API_BASE}/learning-goals`, { headers: authHeaders });
    const goalItem1 = goalsListRes1.data.find((g: any) => g.id === goalId);
    assert(goalItem1 !== undefined, `Mục tiêu vừa tạo xuất hiện trong danh sách`);
    assert(goalItem1.current_value === 0, `current_value ban đầu = 0 phút`);
    assert(goalItem1.progress_percentage === 0, `progress_percentage ban đầu = 0%`);
    assert(goalItem1.is_completed === false, `is_completed = false`);

    // 3. Ghi nhận 30 phút học Java (1800 giây)
    await axios.post(
      `${API_BASE}/learning-activities`,
      {
        activity_type: 'read_doc',
        entity_type: 'document',
        entity_id: 202,
        duration_seconds: 1800,
        subject: 'Java',
        details: { docTitle: 'Lập trình hướng đối tượng Java' },
      },
      { headers: authHeaders }
    );

    // 4. Kiểm tra lại tiến độ mục tiêu -> Phải đạt đúng 30 phút (50%)
    const goalsListRes2 = await axios.get(`${API_BASE}/learning-goals`, { headers: authHeaders });
    const goalItem2 = goalsListRes2.data.find((g: any) => g.id === goalId);
    assert(goalItem2.current_value === 30, `current_value cập nhật đúng 30 phút sau khi đọc tài liệu Java`);
    assert(goalItem2.progress_percentage === 50, `progress_percentage cập nhật đúng 50%`);
    assert(goalItem2.is_completed === false, `is_completed = false (chưa đủ 60 phút)`);

    // 5. Ghi nhận thêm 35 phút làm bài quiz môn Java (2100 giây)
    await axios.post(
      `${API_BASE}/learning-activities`,
      {
        activity_type: 'take_quiz',
        entity_type: 'test_set',
        entity_id: 303,
        duration_seconds: 2100,
        subject: 'Java',
        details: { score: 10, totalQuestions: 15 },
      },
      { headers: authHeaders }
    );

    // 6. Kiểm tra lại tiến độ mục tiêu -> 30 + 35 = 65 phút -> Đạt 100% & Completed!
    const goalsListRes3 = await axios.get(`${API_BASE}/learning-goals`, { headers: authHeaders });
    const goalItem3 = goalsListRes3.data.find((g: any) => g.id === goalId);
    assert(goalItem3.current_value === 65, `current_value = 65 phút (30m doc + 35m quiz)`);
    assert(goalItem3.progress_percentage === 100, `progress_percentage = 100%`);
    assert(goalItem3.is_completed === true, `is_completed = true (đã hoàn thành mục tiêu ngày)`);

    // 7. Cập nhật mục tiêu nâng chỉ tiêu lên 120 phút
    const updateGoalRes = await axios.put(
      `${API_BASE}/learning-goals/${goalId}`,
      { target_value: 120 },
      { headers: authHeaders }
    );
    assert(updateGoalRes.status === 200, `PUT /learning-goals/:id trả về 200 OK`);
    assert(updateGoalRes.data.target_value === 120, `Cập nhật target_value = 120 thành công`);

    // 8. Xóa mục tiêu
    const deleteGoalRes = await axios.delete(`${API_BASE}/learning-goals/${goalId}`, { headers: authHeaders });
    assert(deleteGoalRes.status === 200, `DELETE /learning-goals/:id trả về 200 OK`);
    const goalsListRes4 = await axios.get(`${API_BASE}/learning-goals`, { headers: authHeaders });
    assert(!goalsListRes4.data.some((g: any) => g.id === goalId), `Mục tiêu đã bị xóa khỏi danh sách`);

    console.log('\n--- SUITE 4: StudyStreak Single Source of Truth & Zero users.streak Dependency ---');

    // 1. Kiểm tra streak hiện tại từ API thật
    const streakRes4 = await axios.get(`${API_BASE}/progress/streak`, { headers: authHeaders });
    assert(streakRes4.data.currentStreak >= 1, `currentStreak >= 1 do hôm nay user đã có hoạt động học`);
    assert(streakRes4.data.studiedToday === true, `studiedToday = true`);

    // 2. Thử thay đổi trực tiếp trường users.streak = 999 vào DB
    await db.query(`UPDATE users SET streak = 999 WHERE id = $1`, [testUserId]);

    // 3. Gọi lại API streak & progress/summary -> PHẢI KHÔNG BỊ ẢNH HƯỞNG BỞI SỐ 999
    const streakResCheck = await axios.get(`${API_BASE}/progress/streak`, { headers: authHeaders });
    assert(
      streakResCheck.data.currentStreak !== 999,
      `API /progress/streak KHÔNG đọc từ users.streak (kết quả ${streakResCheck.data.currentStreak} !== 999)`
    );
    assert(
      streakResCheck.data.currentStreak === 1,
      `currentStreak tính toán độc lập và chính xác = 1 từ lịch sử hoạt động thật`
    );

    const summaryResCheck = await axios.get(`${API_BASE}/progress/summary`, { headers: authHeaders });
    assert(
      summaryResCheck.data.streak.currentStreak !== 999,
      `summary.streak.currentStreak KHÔNG bị giả mạo bởi users.streak (kết quả !== 999)`
    );

    // 4. Kiểm tra chuỗi liên tiếp nhiều ngày: thêm điểm danh ngày hôm qua và hôm kia vào user_study_dates
    await db.query(
      `INSERT INTO user_study_dates (user_id, study_date)
       VALUES 
         ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - INTERVAL '1 day'),
         ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - INTERVAL '2 days')
       ON CONFLICT (user_id, study_date) DO NOTHING`,
      [testUserId]
    );

    const streakRes3Days = await axios.get(`${API_BASE}/progress/streak`, { headers: authHeaders });
    assert(
      streakRes3Days.data.currentStreak === 3,
      `currentStreak tính toán chuẩn xác = 3 ngày liên tiếp (hôm nay + hôm qua + hôm kia)`
    );
    assert(
      streakRes3Days.data.longestStreak >= 3,
      `longestStreak cập nhật chuẩn xác >= 3`
    );

    console.log('\n--- SUITE 5: Aggregated Progress Summary Real Metrics ---');

    const finalSummaryRes = await axios.get(`${API_BASE}/progress/summary`, { headers: authHeaders });
    const fs = finalSummaryRes.data;

    // Tổng thời gian: 150s (quiz) + 1800s (doc) + 2100s (quiz) = 4050s = ~68 phút
    const expectedMinutes = Math.round(4050 / 60);
    assert(
      Math.abs(fs.total_study_minutes - expectedMinutes) <= 1,
      `total_study_minutes tính chính xác từ tổng duration các activities (~${expectedMinutes} phút)`
    );
    assert(
      fs.total_activities >= 3,
      `total_activities >= 3 bản ghi hoạt động thật`
    );
    assert(
      fs.total_quizzes_completed >= 2,
      `total_quizzes_completed >= 2 lượt làm trắc nghiệm`
    );
    assert(
      fs.recent_activities.length >= 3,
      `recent_activities ghi nhận chi tiết các hành động vừa thực hiện`
    );

    console.log('\n========================================================');
    console.log('    ✅ ALL PHASE 10 VERIFICATION SUITES PASSED (5/5)   ');
    console.log('========================================================\n');
  } catch (err: any) {
    console.error('\x1b[31m[ERROR IN PHASE 10 TEST EXECUTION]:\x1b[0m', err.response?.data || err.message);
    process.exit(1);
  } finally {
    if (testUserId) {
      await db.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
    }
  }
}

if (require.main === module) {
  runPhase10Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
