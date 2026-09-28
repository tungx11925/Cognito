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
  let publicApprovedSetId: number | null = null;

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
      name: 'Phase8 User A',
      phone: '0987658001',
    });
    const tokenA = regA.data.accessToken || regA.data.token;
    testUserAId = regA.data.user.id;
    const headersA = { Authorization: `Bearer ${tokenA}` };

    const regB = await axios.post(`${API_BASE}/auth/register`, {
      email: 'phase8_studentB@example.com',
      password: 'Password123!',
      name: 'Phase8 User B',
      phone: '0987658002',
    });
    const tokenB = regB.data.accessToken || regB.data.token;
    testUserBId = regB.data.user.id;
    const headersB = { Authorization: `Bearer ${tokenB}` };

    console.log(`[Setup] User A ID: ${testUserAId}, User B ID: ${testUserBId}\n`);

    // 1. Tạo 1 bộ đề riêng tư (visibility = 'private', status = 'APPROVED') của User A
    // Gồm 5 câu: MULTIPLE_CHOICE, TRUE_FALSE, FILL_BLANK, ESSAY, và NO_ANSWER (correct_answer = null)
    const tsRes = await db.query(
      `INSERT INTO test_sets (created_by, name, total_questions, total_score, is_active, status, visibility)
       VALUES ($1, 'Đề thi trắc nghiệm & tự luận Sinh học 12 (Riêng tư)', 5, 12.5, true, 'APPROVED', 'private')
       RETURNING id`,
      [testUserAId]
    );
    testSetId = tsRes.rows[0].id;

    // Chèn 5 câu hỏi
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
               $2, 'peptidil transferaza', 'hard', 'APPROVED')
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

    // Câu 5: Câu hỏi chưa có đáp án chính thức (correct_answer = null / Phase 7 NOT SET)
    const q5 = await db.query(
      `INSERT INTO questions (test_set_id, type, content, score, correct_answer, explanation, difficulty, status)
       VALUES ($1, 'FILL_BLANK', 'Dự đoán biến dị tổ hợp phát sinh trong quần thể giao phối ngẫu nhiên (chưa có đáp án chính thức)', 2.5,
               NULL, 'Câu hỏi này chưa được thiết lập đáp án chính thức.', 'hard', 'APPROVED')
       RETURNING id`,
      [testSetId]
    );
    const q5Id = q5.rows[0].id;

    // 2. Tạo 1 bộ đề DRAFT của User B (để test quyền truy cập)
    const draftB = await db.query(
      `INSERT INTO test_sets (created_by, name, total_questions, total_score, is_active, status, visibility)
       VALUES ($1, 'Đề thi nội bộ User B (Draft Private)', 1, 5.0, false, 'DRAFT', 'private')
       RETURNING id`,
      [testUserBId]
    );
    draftSetBId = draftB.rows[0].id;
    await db.query(
      `INSERT INTO questions (test_set_id, type, content, score, correct_answer, status)
       VALUES ($1, 'ESSAY', 'Bí mật riêng của User B', 5.0, $2, 'DRAFT')`,
      [draftSetBId, JSON.stringify('Secret')]
    );

    // 3. Tạo 1 bộ đề CÔNG KHAI (visibility = 'public', status = 'APPROVED') của User A
    const pubRes = await db.query(
      `INSERT INTO test_sets (created_by, name, total_questions, total_score, is_active, status, visibility)
       VALUES ($1, 'Đề thi Cộng đồng Công khai', 1, 10.0, true, 'APPROVED', 'public')
       RETURNING id`,
      [testUserAId]
    );
    publicApprovedSetId = pubRes.rows[0].id;
    await db.query(
      `INSERT INTO questions (test_set_id, type, content, score, options, correct_answer, status)
       VALUES ($1, 'MULTIPLE_CHOICE', '1 + 1 bằng mấy?', 10.0, $2, $3, 'APPROVED')`,
      [publicApprovedSetId, JSON.stringify({ A: '1', B: '2' }), JSON.stringify('B')]
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 1: Bắt đầu làm bài thi & Chống rò rỉ đề (Start Quiz & Sanitization)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: Start Quiz & Anti-Cheat Payload Sanitization ---');
    const startRes = await axios.post(
      `${API_BASE}/quizzes/start`,
      { testSetId },
      { headers: headersA }
    );

    assert(startRes.status === 201, 'POST /quizzes/start trả về HTTP 201 Created');
    assert(startRes.data.attempt && startRes.data.attempt.status === 'IN_PROGRESS', 'Lượt làm bài có trạng thái IN_PROGRESS');
    assert(startRes.data.attempt.totalQuestions === 5, 'Tổng số câu hỏi của bài thi là 5');
    assert(startRes.data.attempt.totalScore === 12.5, 'Tổng điểm tối đa là 12.5');
    assert(Array.isArray(startRes.data.questions) && startRes.data.questions.length === 5, 'Trả về danh sách 5 câu hỏi');

    // BẢO MẬT: Bóc bỏ hoàn toàn correct_answer và explanation khi bắt đầu làm bài
    for (const q of startRes.data.questions) {
      assert(q.correct_answer === undefined && q.correctAnswer === undefined, `Câu hỏi #${q.id} KHÔNG chứa correct_answer`);
      assert(q.explanation === undefined, `Câu hỏi #${q.id} KHÔNG chứa explanation`);
      assert(q.content !== undefined, `Câu hỏi #${q.id} chứa nội dung đề bài`);
    }

    const attempt1Id = startRes.data.attempt.id;
    console.log(`[Suite 1] Attempt 1 ID created: ${attempt1Id}\n`);

    // ─────────────────────────────────────────────────────────────
    // SUITE 2: Phân định rõ ràng APPROVED != Public (Access Control)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 2: Test Set Access Control (APPROVED Private vs Public) ---');
    
    // Test 2.1: User B cố làm đề APPROVED nhưng PRIVATE của User A -> BẮT BUỘC 403
    let approvedPrivateBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/quizzes/start`,
        { testSetId }, // Đề của User A: status APPROVED nhưng visibility = 'private'
        { headers: headersB }
      );
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        approvedPrivateBlocked = true;
      }
    }
    assert(
      approvedPrivateBlocked,
      'User B bị CHẶN khi cố làm đề thi APPROVED nhưng PRIVATE của User A (HTTP 403 Forbidden - APPROVED != Public)'
    );

    // Test 2.2: User A cố tình làm đề DRAFT private của User B -> BẮT BUỘC 403
    let draftBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/quizzes/start`,
        { testSetId: draftSetBId },
        { headers: headersA }
      );
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        draftBlocked = true;
      }
    }
    assert(draftBlocked, 'User A không được phép làm đề thi DRAFT riêng tư của User B (HTTP 403 Forbidden)');

    // Test 2.3: User B ĐƯỢC PHÉP làm đề khi và chỉ khi đề ở chế độ PUBLIC VÀ APPROVED
    const pubStartRes = await axios.post(
      `${API_BASE}/quizzes/start`,
      { testSetId: publicApprovedSetId },
      { headers: headersB }
    );
    assert(pubStartRes.status === 201, 'User B làm được đề thi khi đề ở chế độ PUBLIC VÀ APPROVED (HTTP 201 Created)');

    // Test 2.4: Bộ đề không tồn tại -> 404
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
    // SUITE 3: Chống gian lận khi bài thi đang IN_PROGRESS (Anti-Leak)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 3: Anti-Cheat & Answer Leak Prevention (IN_PROGRESS) ---');

    // Test 3.1: Gọi GET /attempts/:id khi đang IN_PROGRESS PHẢI BỊ CHẶN (HTTP 400)
    let inProgressLeakBlocked = false;
    try {
      await axios.get(
        `${API_BASE}/quizzes/attempts/${attempt1Id}`,
        { headers: headersA }
      );
    } catch (err: any) {
      if (err.response && err.response.status === 400) {
        inProgressLeakBlocked = true;
      }
    }
    assert(
      inProgressLeakBlocked,
      'Chặn đứng xem kết quả/đáp án khi attempt đang IN_PROGRESS (Anti-cheat: HTTP 400 Bad Request)'
    );

    // Test 3.2: Gọi GET /mistakes khi đang IN_PROGRESS PHẢI BỊ CHẶN (HTTP 400)
    let inProgressMistakesBlocked = false;
    try {
      await axios.get(
        `${API_BASE}/quizzes/attempts/${attempt1Id}/mistakes`,
        { headers: headersA }
      );
    } catch (err: any) {
      if (err.response && err.response.status === 400) {
        inProgressMistakesBlocked = true;
      }
    }
    assert(inProgressMistakesBlocked, 'Chặn đứng xem mistakes khi attempt đang IN_PROGRESS (HTTP 400 Bad Request)\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 4: Bảo vệ cấp Attempt chống IDOR
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 4: Attempt-Level IDOR Protection ---');

    // Test 4.1: User B cố tình nộp bài thi cho attempt của User A -> HTTP 403
    let idorSubmitBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/quizzes/attempts/${attempt1Id}/submit`,
        { answers: [] },
        { headers: headersB }
      );
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        idorSubmitBlocked = true;
      }
    }
    assert(idorSubmitBlocked, 'User B bị CHẶN khi cố tình nộp bài thi cho attempt của User A (IDOR: HTTP 403 Forbidden)');

    // Test 4.2: User B cố tình xem attempt của User A -> HTTP 403
    let idorViewBlocked = false;
    try {
      await axios.get(
        `${API_BASE}/quizzes/attempts/${attempt1Id}`,
        { headers: headersB }
      );
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        idorViewBlocked = true;
      }
    }
    assert(idorViewBlocked, 'User B bị CHẶN khi cố tình xem attempt của User A (IDOR: HTTP 403 Forbidden)\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 5: Chấm điểm tự luận chống nội dung vô nghĩa (Essay Anti-Gibberish)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 5: Essay Scoring Anti-Gibberish Protection ---');

    // User A nộp:
    // Q1: MC - Chọn 'B' (Đúng -> +2.5đ)
    // Q2: TF - Chọn 'A' (Đúng -> +2.5đ)
    // Q3: Fill blank - 'peptidil transferaza' (Đúng -> +2.5đ)
    // Q4: Essay - Gõ chuỗi ký tự vô nghĩa rất dài (60+ ký tự)
    // Q5: Fill blank không có đáp án - Gõ text bất kỳ
    const gibberishEssay = 'asdkjhf asdkfjh sadkfjhasdf kjhasdf kjashdf kjashdfkjahsdfkjahsdfkjahsdf 1234567890 vô nghĩa dài';
    const submitPayload1 = {
      answers: [
        { questionId: q1Id, answer: 'B' },
        { questionId: q2Id, answer: 'A' },
        { questionId: q3Id, answer: 'peptidil transferaza' },
        { questionId: q4Id, answer: gibberishEssay },
        { questionId: q5Id, answer: 'Đáp án phỏng đoán của học viên' },
      ],
      durationSeconds: 999999, // Client cố tình gửi số giả mạo 999999
    };

    const submitRes1 = await axios.post(
      `${API_BASE}/quizzes/attempts/${attempt1Id}/submit`,
      submitPayload1,
      { headers: headersA }
    );

    assert(submitRes1.status === 200, 'POST /submit trả về HTTP 200 OK');

    // KIỂM TRA ĐẶC TẢ: Tự luận vô nghĩa dài TUYỆT ĐỐI KHÔNG được cộng điểm
    const essayAns = submitRes1.data.answers.find((a: any) => a.question_id === q4Id);
    assert(essayAns && essayAns.is_correct === false, 'Câu tự luận vô nghĩa KHÔNG được tính là đúng (is_correct = false)');
    assert(essayAns && Number(essayAns.score_awarded) === 0, 'Câu tự luận vô nghĩa được chấm 0.0 điểm (score_awarded = 0)');

    // Tổng điểm tự động awarded đúng bằng 7.5 (chỉ 3 câu trắc nghiệm/khách quan được cộng)
    assert(Number(submitRes1.data.attempt.score) === 7.5, 'Tổng điểm đạt 7.5/12.5 (3 câu khách quan đúng x 2.5đ, câu tự luận 0đ)');
    assert(submitRes1.data.attempt.correctCount === 3, 'Số câu đúng chính xác là 3 câu khách quan');
    assert(submitRes1.data.attempt.status === 'SUBMITTED', 'Trạng thái attempt chuyển sang SUBMITTED\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 6: Xử lý câu hỏi chưa có đáp án (correct_answer = null)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 6: Unset Correct Answer Handling (correct_answer = null) ---');
    const unsetAns = submitRes1.data.answers.find((a: any) => a.question_id === q5Id);
    assert(unsetAns && unsetAns.is_correct === false, 'Câu hỏi chưa có đáp án chính thức KHÔNG được tính điểm (is_correct = false)');
    assert(unsetAns && Number(unsetAns.score_awarded) === 0, 'Điểm câu hỏi chưa có đáp án là 0.0 (không cộng điểm ảo)');
    console.log('[Suite 6] Verified no ghost score awarded for unset answer questions\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 7: Server tính toán duration_seconds độc lập
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 7: Server-side Independent Duration Calculation ---');
    assert(
      submitRes1.data.attempt.durationSeconds >= 0 && submitRes1.data.attempt.durationSeconds < 60,
      `duration_seconds do Server tính toán chuẩn xác (${submitRes1.data.attempt.durationSeconds}s), từ chối số giả 999999 từ client\n`
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 8: Chống nộp bài trùng lặp (Anti-Double Submit)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 8: Anti-Double Submission Protection ---');
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
    // SUITE 9: Xem kết quả chi tiết & Xem danh sách câu sai (Review Mistakes)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 9: Result Breakdown & Review Mistakes (Post-Submission) ---');
    const resultRes = await axios.get(
      `${API_BASE}/quizzes/attempts/${attempt1Id}`,
      { headers: headersA }
    );
    assert(resultRes.status === 200, 'GET /attempts/:id thành công sau khi đã nộp bài (HTTP 200)');
    assert(Number(resultRes.data.attempt.score) === 7.5, 'Attempt score khớp với lượt nộp (7.5)');
    assert(resultRes.data.answers.length === 5, 'Đầy đủ 5 câu hỏi kèm đáp án đối chiếu');

    const mistakesRes = await axios.get(
      `${API_BASE}/quizzes/attempts/${attempt1Id}/mistakes`,
      { headers: headersA }
    );
    assert(mistakesRes.status === 200, 'GET /attempts/:id/mistakes trả về HTTP 200');
    assert(mistakesRes.data.totalMistakes === 2, 'Lọc chính xác 2 câu chưa đạt điểm (câu tự luận + câu chưa có đáp án)');
    assert(mistakesRes.data.mistakes.every((m: any) => m.is_correct === false), 'Mọi câu trong danh sách mistakes đều có is_correct = false\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 10: Chế độ 1-click làm lại các câu sai (Retry Mistakes)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 10: One-Click Retry Mistakes Mode ---');
    const retryRes = await axios.post(
      `${API_BASE}/quizzes/start`,
      {
        testSetId,
        isRetryMistakes: true,
        previousAttemptId: attempt1Id,
      },
      { headers: headersA }
    );

    assert(retryRes.status === 201, 'Khởi tạo phòng thi ôn tập câu sai thành công');
    assert(retryRes.data.isRetryMistakes === true, 'isRetryMistakes = true');
    assert(retryRes.data.attempt.totalQuestions === 2, 'Tổng số câu thi mới chỉ bao gồm 2 câu chưa đạt điểm');
    assert(retryRes.data.questions.length === 2, 'Danh sách câu hỏi chỉ gồm 2 câu cần ôn tập');
    console.log('[Suite 10] Retry mistakes room initialized with exact missed questions\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 11: Lịch sử làm bài, Learning Activities & Ghi nhận Study Dates
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 11: Quiz History, Learning Activity & Study Streak Tracking ---');
    const historyRes = await axios.get(
      `${API_BASE}/quizzes/history?limit=10`,
      { headers: headersA }
    );

    assert(historyRes.status === 200, 'GET /quizzes/history trả về HTTP 200');
    assert(Array.isArray(historyRes.data.attempts), 'Danh sách attempts là một mảng');
    assert(historyRes.data.total >= 2, 'User A có ít nhất 2 lượt làm bài đã lưu');
    const firstHistory = historyRes.data.attempts[0];
    assert(firstHistory.testSetName !== undefined, 'Bao gồm tên bộ đề thi');
    assert(firstHistory.percentage !== undefined, 'Bao gồm phần trăm điểm số');

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

    console.log('========================================================');
    console.log('  ALL 11 TEST SUITES FOR PHASE 8 PASSED FLAWLESSLY!    ');
    console.log('========================================================\n');
  } catch (err: any) {
    console.error('\x1b[31m[ERROR IN TEST RUNNER]\x1b[0m', err.response?.data || err.message);
    process.exit(1);
  } finally {
    // Cleanup test records
    console.log('[Cleanup] Cleaning up Phase 8 test data...');
    const testSetIdsToDelete = [testSetId, draftSetBId, publicApprovedSetId].filter(Boolean);
    if (testSetIdsToDelete.length > 0) {
      await db.query(`DELETE FROM questions WHERE test_set_id = ANY($1::int[])`, [testSetIdsToDelete]);
      await db.query(`DELETE FROM test_sets WHERE id = ANY($1::int[])`, [testSetIdsToDelete]);
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
