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

export async function runPhase11Tests() {
  console.log('========================================================');
  console.log('         COGNITO PHASE 11: FOCUS MODE INTEGRATION       ');
  console.log('========================================================\n');

  let testUser1Id: number | null = null;
  let testUser1Token = '';
  let authHeaders1 = { Authorization: '' };

  let testUser2Id: number | null = null;
  let testUser2Token = '';
  let authHeaders2 = { Authorization: '' };

  try {
    // ─────────────────────────────────────────────────────────────
    // Setup test users
    // ─────────────────────────────────────────────────────────────
    const email1 = 'phase11_focus_user1@example.com';
    const email2 = 'phase11_focus_user2@example.com';
    await db.query(`DELETE FROM users WHERE email IN ($1, $2)`, [email1, email2]);

    const reg1 = await axios.post(`${API_BASE}/auth/register`, {
      email: email1,
      password: 'Password123!',
      name: 'Focus Student 1',
      phone: `0981${Math.floor(100000 + Math.random() * 900000)}`,
    });
    testUser1Id = reg1.data.user.id;
    testUser1Token = reg1.data.accessToken || reg1.data.token;
    authHeaders1 = { Authorization: `Bearer ${testUser1Token}` };

    const reg2 = await axios.post(`${API_BASE}/auth/register`, {
      email: email2,
      password: 'Password123!',
      name: 'Focus Student 2',
      phone: `0982${Math.floor(100000 + Math.random() * 900000)}`,
    });
    testUser2Id = reg2.data.user.id;
    testUser2Token = reg2.data.accessToken || reg2.data.token;
    authHeaders2 = { Authorization: `Bearer ${testUser2Token}` };

    console.log(`[SETUP] Registered test users: User1=${testUser1Id}, User2=${testUser2Id}\n`);

    // ─────────────────────────────────────────────────────────────
    // SUITE 1: Standalone Focus Session Lifecycle (Start, Ping, Finish)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: Standalone Focus Session Lifecycle ---');

    // 1.1 Start standalone session (25 mins = 1500s)
    const startRes1 = await axios.post(
      `${API_BASE}/focus/start`,
      { target_duration_seconds: 1500 },
      { headers: authHeaders1 }
    );
    assert(startRes1.status === 201, 'POST /api/focus/start trả về 201 Created');
    assert(startRes1.data.status === 'IN_PROGRESS', 'Session ban đầu có status = IN_PROGRESS');
    assert(startRes1.data.target_duration_seconds === 1500, 'target_duration_seconds đúng 1500s');
    const sessionId1 = startRes1.data.id;

    // 1.2 Get Active Session
    const activeRes1 = await axios.get(`${API_BASE}/focus/active`, { headers: authHeaders1 });
    assert(activeRes1.status === 200, 'GET /api/focus/active trả về 200 OK');
    assert(activeRes1.data.activeSession?.id === sessionId1, 'activeSession trả về đúng session vừa tạo');

    // 1.3 Ping active seconds (30s)
    const pingRes = await axios.post(
      `${API_BASE}/focus/${sessionId1}/ping`,
      { seconds: 30 },
      { headers: authHeaders1 }
    );
    assert(pingRes.status === 200, 'POST /api/focus/:id/ping trả về 200 OK');

    // 1.4 Finish session successfully (COMPLETED, actual = 1500s)
    const finishRes1 = await axios.post(
      `${API_BASE}/focus/${sessionId1}/finish`,
      {
        status: 'COMPLETED',
        actual_duration_seconds: 1500,
      },
      { headers: authHeaders1 }
    );
    assert(finishRes1.status === 200, 'POST /api/focus/:id/finish trả về 200 OK');
    assert(finishRes1.data.summary.status === 'COMPLETED', 'Summary status = COMPLETED');
    assert(finishRes1.data.summary.focusScore === 100, 'Hoàn thành đủ thời gian, 0 xao nhãng -> Focus Score = 100');
    assert(finishRes1.data.summary.actualFocusSeconds === 1500, 'actualFocusSeconds = 1500s');

    // 1.5 Active session should now be null
    const activeRes2 = await axios.get(`${API_BASE}/focus/active`, { headers: authHeaders1 });
    assert(activeRes2.data.activeSession === null, 'Sau khi hoàn thành, activeSession = null');

    // ─────────────────────────────────────────────────────────────
    // SUITE 2: Entry Points Integration (Document & Quiz)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: Entry Points Integration (Document & Quiz) ---');

    // 2.1 Tạo tài liệu cho User 1
    const docRes = await db.query(
      `INSERT INTO documents (user_id, title, doc_url, category, file_type)
       VALUES ($1, 'Tài liệu Giải tích 1', 'https://example.com/gt1.pdf', 'Toán học', 'pdf')
       RETURNING id`,
      [testUser1Id]
    );
    const docId = docRes.rows[0].id;

    // 2.2 Tạo đề thi cho User 1
    const quizRes = await db.query(
      `INSERT INTO test_sets (name, total_questions, created_by)
       VALUES ('Đề thi thử Giải tích 1', 10, $1)
       RETURNING id`,
      [testUser1Id]
    );
    const quizId = quizRes.rows[0].id;

    // 2.3 Start session from Document Viewer
    const startFromDoc = await axios.post(
      `${API_BASE}/focus/start`,
      { target_duration_seconds: 1800, document_id: docId },
      { headers: authHeaders1 }
    );
    assert(startFromDoc.status === 201, 'Bắt đầu Focus từ Document Viewer thành công');
    assert(startFromDoc.data.document_id === docId, 'document_id được gắn chính xác vào Focus Session');
    const sessionDocId = startFromDoc.data.id;

    // Finish session from doc
    await axios.post(
      `${API_BASE}/focus/${sessionDocId}/finish`,
      { status: 'COMPLETED', actual_duration_seconds: 1800 },
      { headers: authHeaders1 }
    );

    // 2.4 Start session from Quiz
    const startFromQuiz = await axios.post(
      `${API_BASE}/focus/start`,
      { target_duration_seconds: 1200, quiz_id: quizId },
      { headers: authHeaders1 }
    );
    assert(startFromQuiz.status === 201, 'Bắt đầu Focus từ Quiz thành công');
    assert(startFromQuiz.data.quiz_id === quizId, 'quiz_id được gắn chính xác vào Focus Session');
    const sessionQuizId = startFromQuiz.data.id;

    await axios.post(
      `${API_BASE}/focus/${sessionQuizId}/finish`,
      { status: 'COMPLETED', actual_duration_seconds: 1200 },
      { headers: authHeaders1 }
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 3: Distraction Detection & Focus Score Penalty
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: Distraction Detection & Focus Score Penalty ---');

    const startDistract = await axios.post(
      `${API_BASE}/focus/start`,
      { target_duration_seconds: 1500 },
      { headers: authHeaders1 }
    );
    const sessionDistractId = startDistract.data.id;

    // Ghi nhận sự kiện chuyển tab (TAB_SWITCH)
    const dist1 = await axios.post(
      `${API_BASE}/focus/${sessionDistractId}/distraction`,
      {
        event_type: 'TAB_SWITCH',
        duration_seconds: 15,
        details: { signal: 'visibilitychange' },
      },
      { headers: authHeaders1 }
    );
    assert(dist1.status === 200, 'Ghi nhận TAB_SWITCH thành công');
    assert(dist1.data.distractionCount === 1, 'distractionCount tăng lên 1');

    // Ghi nhận sự kiện mất focus (PAGE_BLUR)
    const dist2 = await axios.post(
      `${API_BASE}/focus/${sessionDistractId}/distraction`,
      {
        event_type: 'PAGE_BLUR',
        duration_seconds: 10,
        details: { signal: 'blur' },
      },
      { headers: authHeaders1 }
    );
    assert(dist2.status === 200, 'Ghi nhận PAGE_BLUR thành công');
    assert(dist2.data.distractionCount === 2, 'distractionCount tăng lên 2');

    // Ghi nhận sự kiện ẩn trang (PAGE_HIDDEN)
    const dist3 = await axios.post(
      `${API_BASE}/focus/${sessionDistractId}/distraction`,
      {
        event_type: 'PAGE_HIDDEN',
        duration_seconds: 20,
      },
      { headers: authHeaders1 }
    );
    assert(dist3.data.distractionCount === 3, 'distractionCount tăng lên 3');

    // Kết thúc phiên: 1500s nhưng có 3 lần xao nhãng -> Penalty = 3 * 5 = 15 điểm -> Score = 85
    const finishDistract = await axios.post(
      `${API_BASE}/focus/${sessionDistractId}/finish`,
      {
        status: 'COMPLETED',
        actual_duration_seconds: 1500,
      },
      { headers: authHeaders1 }
    );
    assert(finishDistract.data.summary.distractionCount === 3, 'distractionCount được tổng kết chính xác = 3');
    assert(finishDistract.data.summary.focusScore === 85, `Focus Score bị trừ tương ứng (100 - 15 = 85, thực tế: ${finishDistract.data.summary.focusScore})`);

    // ─────────────────────────────────────────────────────────────
    // SUITE 4: Interrupted & Cancelled States
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: Interrupted & Cancelled States ---');

    // 4.1 CANCELLED session -> Focus Score = 0
    const startCancel = await axios.post(
      `${API_BASE}/focus/start`,
      { target_duration_seconds: 1500 },
      { headers: authHeaders1 }
    );
    const sessionCancelId = startCancel.data.id;

    const finishCancel = await axios.post(
      `${API_BASE}/focus/${sessionCancelId}/finish`,
      { status: 'CANCELLED', actual_duration_seconds: 200 },
      { headers: authHeaders1 }
    );
    assert(finishCancel.data.summary.status === 'CANCELLED', 'Status = CANCELLED');
    assert(finishCancel.data.summary.focusScore === 0, 'Phiên CANCELLED có Focus Score = 0');

    // 4.2 Tự động chuyển INTERRUPTED khi mở phiên mới đè lên phiên đang chạy
    const startInt1 = await axios.post(
      `${API_BASE}/focus/start`,
      { target_duration_seconds: 1500 },
      { headers: authHeaders1 }
    );
    const sessionInt1Id = startInt1.data.id;

    // Bắt đầu phiên khác ngay sau đó
    const startInt2 = await axios.post(
      `${API_BASE}/focus/start`,
      { target_duration_seconds: 1500 },
      { headers: authHeaders1 }
    );
    const sessionInt2Id = startInt2.data.id;

    // Kiểm tra sessionInt1Id trong DB phải chuyển thành INTERRUPTED
    const dbIntCheck = await db.query(`SELECT status FROM study_sessions WHERE id = $1`, [sessionInt1Id]);
    assert(dbIntCheck.rows[0].status === 'INTERRUPTED', 'Phiên cũ tự động được đánh dấu là INTERRUPTED khi mở phiên mới');

    await axios.post(
      `${API_BASE}/focus/${sessionInt2Id}/finish`,
      { status: 'COMPLETED', actual_duration_seconds: 1500 },
      { headers: authHeaders1 }
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 5: Auto-Logging to learning_activities & Streak Sync
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: Auto-Logging to learning_activities & Streak Sync ---');

    // Kiểm tra bản ghi learning_activities của sessionDistractId
    const actCheck = await db.query(
      `SELECT * FROM learning_activities WHERE user_id = $1 AND idempotency_key = $2`,
      [testUser1Id, `focus_session:${sessionDistractId}`]
    );
    assert(actCheck.rows.length === 1, `Focus Session tự động sinh duy nhất 1 bản ghi learning_activities`);
    assert(actCheck.rows[0].activity_type === 'focus_session', `activity_type đúng 'focus_session'`);
    assert(actCheck.rows[0].duration_seconds === 1500, `duration_seconds đúng 1500s`);
    assert(actCheck.rows[0].details.focusScore === 85, `Details lưu đúng focusScore = 85`);

    // Kiểm tra streak của User 1
    const streakCheck = await axios.get(`${API_BASE}/progress/streak`, { headers: authHeaders1 });
    assert(streakCheck.data.currentStreak >= 1, `Chuỗi Streak của User 1 tăng lên >= 1`);
    assert(streakCheck.data.studiedToday === true, `studiedToday = true`);

    // ─────────────────────────────────────────────────────────────
    // SUITE 6: IDOR Protection & Authorization
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 6: IDOR Protection & Authorization ---');

    // 6.1 Chặn User 2 ghi nhận xao nhãng vào phiên của User 1
    try {
      await axios.post(
        `${API_BASE}/focus/${sessionDistractId}/distraction`,
        { event_type: 'TAB_SWITCH' },
        { headers: authHeaders2 }
      );
      assert(false, 'Chặn User 2 can thiệp session của User 1 thất bại');
    } catch (err: any) {
      assert(err.response?.status === 403 || err.response?.status === 404, 'User 2 bị từ chối với HTTP 403/404 khi can thiệp session của User 1');
    }

    // 6.2 Chặn User 2 kết thúc phiên của User 1
    try {
      await axios.post(
        `${API_BASE}/focus/${sessionDistractId}/finish`,
        { status: 'COMPLETED', actual_duration_seconds: 1500 },
        { headers: authHeaders2 }
      );
      assert(false, 'Chặn User 2 kết thúc session của User 1 thất bại');
    } catch (err: any) {
      assert(err.response?.status === 404 || err.response?.status === 403, 'User 2 bị từ chối với HTTP 404 khi kết thúc session của User 1');
    }

    // 6.3 Chặn User 2 xem summary phiên của User 1
    try {
      await axios.get(`${API_BASE}/focus/${sessionDistractId}/summary`, { headers: authHeaders2 });
      assert(false, 'Chặn User 2 xem summary thất bại');
    } catch (err: any) {
      assert(err.response?.status === 404, 'User 2 bị từ chối với HTTP 404 khi xem summary session của User 1');
    }

    // 6.4 Chặn User 2 bắt đầu phiên gắn vào tài liệu riêng tư của User 1
    try {
      await axios.post(
        `${API_BASE}/focus/start`,
        { target_duration_seconds: 1500, document_id: docId },
        { headers: authHeaders2 }
      );
      assert(false, 'Chặn User 2 gắn document riêng tư của User 1 thất bại');
    } catch (err: any) {
      assert(err.response?.status === 403, 'User 2 bị từ chối với HTTP 403 khi gắn document riêng tư của User 1');
    }

    console.log('\n========================================================');
    console.log('    ✅ ALL PHASE 11 INTEGRATION TESTS PASSED (6/6)     ');
    console.log('========================================================\n');
  } catch (err: any) {
    console.error('\x1b[31m[ERROR IN PHASE 11 TEST EXECUTION]:\x1b[0m', err.response?.data || err.message || err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    if (testUser1Id) await db.query(`DELETE FROM users WHERE id = $1`, [testUser1Id]);
    if (testUser2Id) await db.query(`DELETE FROM users WHERE id = $1`, [testUser2Id]);
  }
}

if (require.main === module) {
  runPhase11Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
