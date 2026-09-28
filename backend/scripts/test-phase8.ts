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

async function runPhase8Tests() {
  console.log('========================================================');
  console.log('    COGNITO PHASE 8: QUIZ / TEST SYSTEM TEST SUITE      ');
  console.log('========================================================\n');

  let testUserAId: number | null = null;
  let testUserBId: number | null = null;
  let testSetId: number | null = null;
  let draftSetBId: number | null = null;

  try {
    // ─────────────────────────────────────────────────────────────
    // Setup test users & test sets
    // ─────────────────────────────────────────────────────────────
    await db.query(
      `DELETE FROM users WHERE email IN ('phase8_studentA@example.com', 'phase8_studentB@example.com') OR phone IN ('0987658001', '0987658002')`
    );

    const regA = await axios.post(`${API_BASE}/auth/register`, {
      email: 'phase8_studentA@example.com',
      password: 'Password123!',
      name: 'Phase8 Student User A',
      phone: '0987658001',
    });
    const tokenA = regA.data.accessToken || regA.data.token;
    testUserAId = regA.data.user.id;
    const headersA = { Authorization: `Bearer ${tokenA}` };

    const regB = await axios.post(`${API_BASE}/auth/register`, {
      email: 'phase8_studentB@example.com',
      password: 'Password123!',
      name: 'Phase8 Student User B',
      phone: '0987658002',
    });
    const tokenB = regB.data.accessToken || regB.data.token;
    testUserBId = regB.data.user.id;
    const headersB = { Authorization: `Bearer ${tokenB}` };

    console.log(`[Setup] User A ID: ${testUserAId}, User B ID: ${testUserBId}\n`);

    // Tạo 1 bộ đề hoàn chỉnh của User A gồm 4 câu hỏi: MULTIPLE_CHOICE, TRUE_FALSE, FILL_BLANK, ESSAY
    const tsRes = await db.query(
      `INSERT INTO test_sets (created_by, name, total_questions, total_score, is_active, status)
       VALUES ($1, 'Đề thi trắc nghiệm & tự luận Sinh học 12', 4, 10.0, true, 'APPROVED')
       RETURNING id`,
      [testUserAId]
    );
    testSetId = tsRes.rows[0].id;

    // Chèn 4 câu hỏi với các loại câu hỏi khác nhau
    const q1 = await db.query(
      `INSERT INTO questions (test_set_id, type, content, score, options, correct_answer, explanation, difficulty, status)
       VALUES ($1, 'MULTIPLE_CHOICE', 'Quá trình nhân đôi ADN diễn ra ở pha nào của chu kỳ tế bào?', 2.5,
               $2, $3, 'Pha S là pha nhân đôi ADN và nhân đôi nhiễm sắc thể.', 'easy', 'APPROVED')
       RETURNING id`,
      [testSetId, JSON.stringify({ A: 'Pha G1', B: 'Pha S', C: 'Pha G2', D: 'Pha M' }), JSON.stringify('B')]
    );
    const q1Id = q1.rows[0].id;

    const q2 = await db.query(
      `INSERT INTO questions (test_set_id, type, content, score, options, correct_answer, explanation, difficulty, status)
       VALUES ($1, 'TRUE_FALSE', 'Tất cả các loài sinh vật trên Trái Đất đều sử dụng chung một mã di truyền (tính phổ biến)?', 2.5,
               $2, $3, 'Mã di truyền có tính phổ biến, hầu hết các loài đều dùng chung một bộ mã.', 'medium', 'APPROVED')
       RETURNING id`,
      [testSetId, JSON.stringify({ A: 'Đúng', B: 'Sai' }), JSON.stringify('A')]
    );
    const q2Id = q2.rows[0].id;

    const q3 = await db.query(
      `INSERT INTO questions (test_set_id, type, content, score, correct_answer, explanation, difficulty, status)
       VALUES ($1, 'FILL_BLANK', 'Enzim chính tham gia xúc tác quá trình tổng hợp chuỗi polipeptit trong dịch mã là enzim gì?', 2.5,
               $2, 'ARN polimeraza hoặc peptidil transferaza', 'hard', 'APPROVED')
       RETURNING id`,
      [testSetId, JSON.stringify(['peptidil transferaza', 'ribozim', 'peptidyl transferase'])]
    );
    const q3Id = q3.rows[0].id;

    const q4 = await db.query(
      `INSERT INTO questions (test_set_id, type, content, score, correct_answer, explanation, difficulty, status)
       VALUES ($1, 'ESSAY', 'Hãy trình bày ngắn gọn ý nghĩa của đột biến gen đối với tiến hóa và chọn giống.', 2.5,
               $2,
               'Đột biến gen làm xuất hiện các alen mới, tạo nên sự đa dạng di truyền.', 'hard', 'APPROVED')
       RETURNING id`,
      [testSetId, JSON.stringify('Đột biến gen cung cấp nguồn nguyên liệu sơ cấp dồi dào cho tiến hóa và chọn giống.')]
    );
    const q4Id = q4.rows[0].id;

    // Tạo 1 bộ đề DRAFT của User B (để test quyền truy cập)
    const draftB = await db.query(
      `INSERT INTO test_sets (created_by, name, total_questions, total_score, is_active, status)
       VALUES ($1, 'Đề thi nội bộ User B (Draft Private)', 1, 5.0, false, 'DRAFT')
       RETURNING id`,
      [testUserBId]
    );
    draftSetBId = draftB.rows[0].id;
    await db.query(
      `INSERT INTO questions (test_set_id, type, content, score, correct_answer, status)
       VALUES ($1, 'ESSAY', 'Bí mật riêng của User B', 5.0, $2, 'DRAFT')`,
      [draftSetBId, JSON.stringify('Secret')]
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 1: Bắt đầu làm bài thi (Start Quiz) & Bảo mật dữ liệu
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: Start Quiz & Anti-Cheat Payload Sanitization ---');
    const startRes = await axios.post(
      `${API_BASE}/quizzes/start`,
      { testSetId },
      { headers: headersA }
    );

    assert(startRes.status === 201, 'POST /quizzes/start trả về HTTP 201 Created');
    assert(startRes.data.attempt && startRes.data.attempt.status === 'IN_PROGRESS', 'Lượt làm bài có trạng thái IN_PROGRESS');
    assert(startRes.data.attempt.totalQuestions === 4, 'Tổng số câu hỏi của bài thi là 4');
    assert(startRes.data.attempt.totalScore === 10, 'Tổng điểm tối đa là 10.0');
    assert(Array.isArray(startRes.data.questions) && startRes.data.questions.length === 4, 'Trả về danh sách 4 câu hỏi');

    // BẢO MẬT: Kiểm tra tuyệt đối không rò rỉ đáp án hoặc lời giải
    for (const q of startRes.data.questions) {
      assert(q.correct_answer === undefined && q.correctAnswer === undefined, `Câu hỏi #${q.id} KHÔNG chứa correct_answer`);
      assert(q.explanation === undefined, `Câu hỏi #${q.id} KHÔNG chứa explanation`);
      assert(q.content !== undefined, `Câu hỏi #${q.id} chứa nội dung đề bài`);
    }

    const attempt1Id = startRes.data.attempt.id;
    console.log(`[Suite 1] Attempt 1 ID created: ${attempt1Id}\n`);

    // ─────────────────────────────────────────────────────────────
    // SUITE 2: Kiểm soát quyền truy cập (Access Control)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 2: Access Control & Authorization Checks ---');
    let forbiddenCaught = false;
    try {
      // User A cố tình truy cập bộ đề DRAFT private của User B
      await axios.post(
        `${API_BASE}/quizzes/start`,
        { testSetId: draftSetBId },
        { headers: headersA }
      );
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        forbiddenCaught = true;
      }
    }
    assert(forbiddenCaught, 'User A không được phép làm đề thi DRAFT riêng tư của User B (HTTP 403 Forbidden)');

    let notFoundCaught = false;
    try {
      await axios.post(
        `${API_BASE}/quizzes/start`,
        { testSetId: 99999999 },
        { headers: headersA }
      );
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        notFoundCaught = true;
      }
    }
    assert(notFoundCaught, 'Truy cập bộ đề không tồn tại trả về HTTP 404 Not Found\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 3: Nộp bài thi 100% đúng (Server-Side Grading 10.0/10.0)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 3: Submit Quiz (100% Correct - Full Score 10.0) ---');
    const submitPayload1 = {
      answers: [
        { questionId: q1Id, answer: 'B' }, // Đúng
        { questionId: q2Id, answer: 'A' }, // Đúng (hoặc 'Đúng')
        { questionId: q3Id, answer: 'peptidil transferaza' }, // Đúng
        { questionId: q4Id, answer: 'Đột biến gen làm xuất hiện các alen mới có lợi cho tiến hóa.' }, // Tự luận > 5 ký tự
      ],
      durationSeconds: 125,
    };

    const submitRes1 = await axios.post(
      `${API_BASE}/quizzes/attempts/${attempt1Id}/submit`,
      submitPayload1,
      { headers: headersA }
    );

    assert(submitRes1.status === 200, 'POST /submit trả về HTTP 200 OK');
    assert(submitRes1.data.attempt.score === 10, 'Chấm điểm Server-side: Đạt 10.0/10.0 điểm');
    assert(submitRes1.data.attempt.percentage === 100, 'Tỷ lệ chính xác 100%');
    assert(submitRes1.data.attempt.correctCount === 4, 'Đúng 4/4 câu hỏi');
    assert(submitRes1.data.attempt.status === 'SUBMITTED', 'Trạng thái attempt chuyển sang SUBMITTED');
    assert(submitRes1.data.attempt.durationSeconds === 125, 'Thời gian làm bài được lưu chuẩn xác: 125 giây');

    // Kiểm tra lưu vết Activity & Streak
    const studyDateCheck = await db.query(
      `SELECT * FROM user_study_dates WHERE user_id = $1 AND study_date = CURRENT_DATE`,
      [testUserAId]
    );
    assert(studyDateCheck.rows.length > 0, 'Streak học tập được ghi nhận tự động vào user_study_dates');

    const activityCheck = await db.query(
      `SELECT * FROM learning_activities WHERE user_id = $1 AND activity_type = 'take_quiz'`,
      [testUserAId]
    );
    assert(activityCheck.rows.length > 0, 'Ghi nhận lịch sử hoạt động vào learning_activities\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 4: Chống nộp bài trùng lặp (Anti-Double Submit)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 4: Anti-Double Submission Protection ---');
    let doubleSubmitCaught = false;
    try {
      await axios.post(
        `${API_BASE}/quizzes/attempts/${attempt1Id}/submit`,
        submitPayload1,
        { headers: headersA }
      );
    } catch (err: any) {
      if (err.response && err.response.status === 400) {
        doubleSubmitCaught = true;
      }
    }
    assert(doubleSubmitCaught, 'Không thể nộp lại bài thi đã SUBMITTED (Khóa lượt làm bài, HTTP 400)\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 5: Làm bài lần 2 có câu sai (Partial Score & Mistakes Detection)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 5: Partial Score Grading & Mistakes Detection ---');
    const startRes2 = await axios.post(
      `${API_BASE}/quizzes/start`,
      { testSetId },
      { headers: headersA }
    );
    const attempt2Id = startRes2.data.attempt.id;

    // Nộp: Câu 1 SAI (chọn A thay vì B), Câu 2 ĐÚNG (A), Câu 3 SAI (gõ bừa), Câu 4 ĐÚNG
    const submitPayload2 = {
      answers: [
        { questionId: q1Id, answer: 'A' }, // SAI
        { questionId: q2Id, answer: 'A' }, // ĐÚNG
        { questionId: q3Id, answer: 'sai hoàn toàn' }, // SAI
        { questionId: q4Id, answer: 'Tự luận trả lời đầy đủ ý nghĩa tiến hóa' }, // ĐÚNG
      ],
      durationSeconds: 80,
    };

    const submitRes2 = await axios.post(
      `${API_BASE}/quizzes/attempts/${attempt2Id}/submit`,
      submitPayload2,
      { headers: headersA }
    );

    assert(submitRes2.data.attempt.score === 5, 'Điểm awarded chuẩn xác: 5.0/10.0 (2 câu đúng x 2.5đ)');
    assert(submitRes2.data.attempt.correctCount === 2, 'Số câu đúng là 2/4');
    assert(submitRes2.data.attempt.percentage === 50, 'Tỷ lệ chính xác 50%');

    // Kiểm tra chi tiết câu trả lời trả về sau khi nộp
    const q1Ans = submitRes2.data.answers.find((a: any) => a.question_id === q1Id);
    assert(q1Ans && q1Ans.is_correct === false, 'Câu 1 được đánh dấu là SAI');
    assert(q1Ans.explanation.includes('Pha S'), 'Trả về giải thích chi tiết cho câu 1 sau khi nộp');

    const q2Ans = submitRes2.data.answers.find((a: any) => a.question_id === q2Id);
    assert(q2Ans && q2Ans.is_correct === true, 'Câu 2 được đánh dấu là ĐÚNG\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 6: Xem kết quả chi tiết & Xem danh sách câu sai (Review Mistakes)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 6: Result Breakdown & Review Mistakes Endpoints ---');
    const resultRes = await axios.get(
      `${API_BASE}/quizzes/attempts/${attempt2Id}`,
      { headers: headersA }
    );
    assert(resultRes.status === 200, 'GET /attempts/:id trả về chi tiết kết quả');
    assert(resultRes.data.attempt.score === 5, 'Attempt score khớp với lượt nộp');
    assert(resultRes.data.answers.length === 4, 'Đầy đủ 4 câu hỏi kèm đáp án');

    const mistakesRes = await axios.get(
      `${API_BASE}/quizzes/attempts/${attempt2Id}/mistakes`,
      { headers: headersA }
    );
    assert(mistakesRes.status === 200, 'GET /attempts/:id/mistakes trả về HTTP 200');
    assert(mistakesRes.data.totalMistakes === 2, 'Lọc chính xác 2 câu làm sai');
    assert(mistakesRes.data.mistakes.every((m: any) => m.is_correct === false), 'Mọi câu trong danh sách mistakes đều có is_correct = false\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 7: Chế độ 1-click làm lại các câu sai (Retry Mistakes)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 7: One-Click Retry Mistakes Mode ---');
    const retryRes = await axios.post(
      `${API_BASE}/quizzes/start`,
      {
        testSetId,
        isRetryMistakes: true,
        previousAttemptId: attempt2Id,
      },
      { headers: headersA }
    );

    assert(retryRes.status === 201, 'Khởi tạo phòng thi ôn tập câu sai thành công');
    assert(retryRes.data.isRetryMistakes === true, 'isRetryMistakes = true');
    assert(retryRes.data.attempt.totalQuestions === 2, 'Tổng số câu thi mới chỉ bao gồm 2 câu đã làm sai trước đó');
    assert(retryRes.data.questions.length === 2, 'Danh sách câu hỏi chỉ gồm 2 câu sai');
    const retryQuestionIds = retryRes.data.questions.map((q: any) => q.id);
    assert(retryQuestionIds.includes(q1Id) && retryQuestionIds.includes(q3Id), 'Bao gồm chính xác câu 1 và câu 3');
    assert(!retryQuestionIds.includes(q2Id) && !retryQuestionIds.includes(q4Id), 'Không lặp lại các câu 2 và 4 đã làm đúng');

    // Nộp bài thi ôn lại câu sai (lần này trả lời đúng cả 2 câu)
    const retryAttemptId = retryRes.data.attempt.id;
    const retrySubmitRes = await axios.post(
      `${API_BASE}/quizzes/attempts/${retryAttemptId}/submit`,
      {
        answers: [
          { questionId: q1Id, answer: 'B' },
          { questionId: q3Id, answer: 'peptidil transferaza' },
        ],
        durationSeconds: 45,
      },
      { headers: headersA }
    );

    assert(retrySubmitRes.data.attempt.score === 5, 'Chấm điểm bộ câu sai: Đạt tối đa 5.0 điểm');
    assert(retrySubmitRes.data.attempt.percentage === 100, 'Tỷ lệ chính xác lần làm lại là 100%\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 8: Lịch sử làm bài thi (Quiz History)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 8: User Quiz History ---');
    const historyRes = await axios.get(
      `${API_BASE}/quizzes/history?limit=10`,
      { headers: headersA }
    );

    assert(historyRes.status === 200, 'GET /quizzes/history trả về HTTP 200');
    assert(Array.isArray(historyRes.data.attempts), 'Danh sách attempts là một mảng');
    assert(historyRes.data.total >= 3, 'User A có ít nhất 3 lượt làm bài đã lưu');
    const firstHistory = historyRes.data.attempts[0];
    assert(firstHistory.testSetName !== undefined, 'Bao gồm tên bộ đề thi');
    assert(firstHistory.percentage !== undefined, 'Bao gồm phần trăm điểm số');
    console.log(`[Suite 8] Quiz history count: ${historyRes.data.total}\n`);

    console.log('========================================================');
    console.log('  ALL 8 TEST SUITES FOR PHASE 8 PASSED FLAWLESSLY!     ');
    console.log('========================================================\n');
  } catch (err: any) {
    console.error('\x1b[31m[ERROR IN TEST RUNNER]\x1b[0m', err.response?.data || err.message);
    process.exit(1);
  } finally {
    // Cleanup test records
    console.log('[Cleanup] Cleaning up Phase 8 test data...');
    if (testSetId) {
      await db.query(`DELETE FROM questions WHERE test_set_id = $1`, [testSetId]);
      await db.query(`DELETE FROM test_sets WHERE id = $1`, [testSetId]);
    }
    if (draftSetBId) {
      await db.query(`DELETE FROM questions WHERE test_set_id = $1`, [draftSetBId]);
      await db.query(`DELETE FROM test_sets WHERE id = $1`, [draftSetBId]);
    }
    if (testUserAId || testUserBId) {
      await db.query(`DELETE FROM users WHERE email IN ('phase8_studentA@example.com', 'phase8_studentB@example.com')`);
    }
    console.log('[Cleanup] Done.\n');
    await db.end();
  }
}

runPhase8Tests().catch((err) => {
  console.error('Fatal error running Phase 8 tests:', err);
  process.exit(1);
});
