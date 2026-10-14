import axios from 'axios';
import { db } from '../src/db';
import { calculateQuizEvaluation } from '../src/services/quiz.service';
import { normalizeAIQuestions, buildQuizUserPrompt, AIQuizGenerationOutputSchema } from '../src/utils/quiz-system-prompt';

const API_BASE = 'http://localhost:5000/api';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`\x1b[31m  [FAIL] ${message}\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m  [PASS] ${message}\x1b[0m`);
  }
}

async function runQuizOptimizationTests() {
  console.log('================================================================');
  console.log('    COGNITO AI QUIZ OPTIMIZATION: VERIFICATION TEST SUITE       ');
  console.log('================================================================\n');

  let testUserId: number | null = null;
  let createdSetId: number | null = null;

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: Unit Test Scoring Algorithm & Evaluation Labels
    // ─────────────────────────────────────────────────────────────
    console.log('[TEST 1] Testing calculateQuizEvaluation algorithm...');

    // 10/10 correct
    const eval10 = calculateQuizEvaluation(10, 10);
    assert(eval10.score10 === 10, '10/10 questions must equal 10.0 score10');
    assert(eval10.accuracyPercent === 100, '10/10 questions must equal 100% accuracy');
    assert(eval10.evaluationLabel === 'Nắm tốt nội dung trong bài', '10/10 label must be "Nắm tốt nội dung trong bài"');

    // 8/10 correct (80%)
    const eval8 = calculateQuizEvaluation(8, 10);
    assert(eval8.score10 === 8.0, '8/10 questions must equal 8.0 score10');
    assert(eval8.accuracyPercent === 80, '8/10 questions must equal 80% accuracy');
    assert(eval8.evaluationLabel === 'Khá vững', '8/10 label must be "Khá vững"');

    // 6/10 correct (60%)
    const eval6 = calculateQuizEvaluation(6, 10);
    assert(eval6.score10 === 6.0, '6/10 questions must equal 6.0 score10');
    assert(eval6.accuracyPercent === 60, '6/10 questions must equal 60% accuracy');
    assert(eval6.evaluationLabel === 'Cần ôn thêm', '6/10 label must be "Cần ôn thêm"');

    // 4/10 correct (40%)
    const eval4 = calculateQuizEvaluation(4, 10);
    assert(eval4.score10 === 4.0, '4/10 questions must equal 4.0 score10');
    assert(eval4.accuracyPercent === 40, '4/10 questions must equal 40% accuracy');
    assert(eval4.evaluationLabel === 'Cần ôn lại', '4/10 label must be "Cần ôn lại"');

    // 1/3 correct (33.33% -> 3.3 and 33%)
    const eval1_3 = calculateQuizEvaluation(1, 3);
    assert(eval1_3.score10 === 3.3, '1/3 questions must round to 3.3 score10');
    assert(eval1_3.accuracyPercent === 33, '1/3 questions must round to 33% accuracy');
    assert(eval1_3.evaluationLabel === 'Cần ôn lại', '1/3 label must be "Cần ôn lại"');

    // 0/5 correct (0%)
    const eval0 = calculateQuizEvaluation(0, 5);
    assert(eval0.score10 === 0, '0/5 questions must equal 0 score10');
    assert(eval0.accuracyPercent === 0, '0/5 questions must equal 0% accuracy');
    assert(eval0.evaluationLabel === 'Cần ôn lại', '0/5 label must be "Cần ôn lại"');

    // 0/0 questions edge case
    const evalZeroTotal = calculateQuizEvaluation(0, 0);
    assert(evalZeroTotal.score10 === 0, '0/0 questions handles division by zero safely');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Prompt Builder & Normalization Unit Test
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Testing System Prompt & Normalization...');

    const prompt = buildQuizUserPrompt({
      documentText: 'Một đoạn văn bản mẫu về cấu trúc dữ liệu và giải thuật.',
      quantity: 5,
      difficulty: 'medium',
      customPrompt: 'Tập trung vào mảng và danh sách liên kết',
    });
    assert(prompt.includes('5 câu hỏi trắc nghiệm'), 'User prompt contains correct quantity');
    assert(prompt.includes('ĐỘ KHÓ YÊU CẦU: Trung bình'), 'User prompt contains correct difficulty');
    assert(prompt.includes('Tập trung vào mảng và danh sách liên kết'), 'User prompt includes custom prompt');

    // Test Schema & Normalization with various AI outputs (e.g. lowercase correct answer, extra options)
    const rawAiOutput = {
      questions: [
        {
          question: 'Cấu trúc dữ liệu nào hoạt động theo nguyên tắc LIFO?',
          options: {
            A: 'Hàng đợi (Queue)',
            B: 'Ngăn xếp (Stack)',
            C: 'Cây nhị phân (Binary Tree)',
            D: 'Đồ thị (Graph)',
          },
          correctAnswer: 'b', // lowercase test
          explanation: 'Ngăn xếp (Stack) hoạt động theo nguyên lý Last In First Out.',
          difficulty: 'EASY',
        },
      ],
    };

    const parsed = AIQuizGenerationOutputSchema.parse(rawAiOutput);
    const normalized = normalizeAIQuestions(parsed.questions);
    assert(normalized.length === 1, 'Normalized 1 question');
    assert(normalized[0].correctAnswer === 'B', 'Correct answer normalized to uppercase B');
    assert(Object.keys(normalized[0].options).length === 4, 'Has 4 options A, B, C, D');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: User Setup & API Authentication
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Setting up test user for API tests...');
    await db.query(`DELETE FROM users WHERE email = 'quiz_opt_tester@example.com'`);

    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      email: 'quiz_opt_tester@example.com',
      password: 'Password123!',
      name: 'Quiz Opt Tester',
      phone: '0981112233',
    });
    const token = regRes.data.accessToken || regRes.data.token;
    testUserId = regRes.data.user.id;
    const authHeaders = { Authorization: `Bearer ${token}` };
    assert(!!token, 'Created test user and obtained auth token');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Document Length & Sufficiency Validation (< 30 words)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 4] Testing document sufficiency rejection (< 30 words)...');

    // 4A: Very short text (< 30 words)
    try {
      await axios.post(
        `${API_BASE}/questions/generate`,
        {
          textContent: 'Đây là đoạn văn bản quá ngắn chỉ có vài từ để kiểm tra validation.',
          quantity: 10,
        },
        { headers: authHeaders }
      );
      assert(false, 'Should have failed with HTTP 400 for short text');
    } catch (err: any) {
      assert(err.response?.status === 400, 'Rejection returned HTTP 400');
      assert(
        err.response?.data?.error?.includes('30 từ') || err.response?.data?.message?.includes('30 từ'),
        'Rejection message clearly states at least 30 words are required'
      );
    }

    // 4B: Whitespace or empty text
    try {
      await axios.post(
        `${API_BASE}/questions/generate`,
        {
          textContent: '          ',
          quantity: 5,
        },
        { headers: authHeaders }
      );
      assert(false, 'Should have failed with HTTP 400 for whitespace text');
    } catch (err: any) {
      assert(err.response?.status === 400, 'Whitespace text returned HTTP 400');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Quiz Attempt Lifecycle, Anti-Cheat, & Score Calculation
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 5] Testing Quiz Attempt Lifecycle & Score Calculation via API...');

    // Insert a valid test set directly into database with 5 MCQs
    const tsInsert = await db.query(
      `INSERT INTO test_sets (created_by, name, total_questions, total_score, is_active, status, visibility)
       VALUES ($1, 'Bài kiểm tra tối ưu hóa API', 5, 5.0, true, 'APPROVED', 'private')
       RETURNING id`,
      [testUserId]
    );
    createdSetId = tsInsert.rows[0].id;

    // Insert 5 questions
    const q1 = await db.query(
      `INSERT INTO questions (test_set_id, content, type, options, correct_answer, score, explanation, difficulty, status)
       VALUES ($1, 'Thủ đô của Việt Nam là gì?', 'MULTIPLE_CHOICE', $2, $3, 1.0, 'Hà Nội là thủ đô của Việt Nam.', 'EASY', 'APPROVED')
       RETURNING id`,
      [createdSetId, JSON.stringify({ A: 'Hà Nội', B: 'TP.HCM', C: 'Đà Nẵng', D: 'Huế' }), JSON.stringify('A')]
    );
    const q2 = await db.query(
      `INSERT INTO questions (test_set_id, content, type, options, correct_answer, score, explanation, difficulty, status)
       VALUES ($1, 'Số nguyên tố chẵn duy nhất là?', 'MULTIPLE_CHOICE', $2, $3, 1.0, 'Số 2 là số nguyên tố chẵn duy nhất.', 'EASY', 'APPROVED')
       RETURNING id`,
      [createdSetId, JSON.stringify({ A: '0', B: '2', C: '4', D: '6' }), JSON.stringify('B')]
    );
    const q3 = await db.query(
      `INSERT INTO questions (test_set_id, content, type, options, correct_answer, score, explanation, difficulty, status)
       VALUES ($1, 'Công thức phân tử của nước là gì?', 'MULTIPLE_CHOICE', $2, $3, 1.0, 'Nước có công thức phân tử là H2O.', 'EASY', 'APPROVED')
       RETURNING id`,
      [createdSetId, JSON.stringify({ A: 'CO2', B: 'H2O', C: 'O2', D: 'NaCl' }), JSON.stringify('B')]
    );
    const q4 = await db.query(
      `INSERT INTO questions (test_set_id, content, type, options, correct_answer, score, explanation, difficulty, status)
       VALUES ($1, 'Mặt trời mọc ở hướng nào?', 'MULTIPLE_CHOICE', $2, $3, 1.0, 'Mặt trời mọc ở hướng Đông.', 'EASY', 'APPROVED')
       RETURNING id`,
      [createdSetId, JSON.stringify({ A: 'Đông', B: 'Tây', C: 'Nam', D: 'Bắc' }), JSON.stringify('A')]
    );
    const q5 = await db.query(
      `INSERT INTO questions (test_set_id, content, type, options, correct_answer, score, explanation, difficulty, status)
       VALUES ($1, '1 byte bằng bao nhiêu bit?', 'MULTIPLE_CHOICE', $2, $3, 1.0, '1 byte = 8 bit.', 'EASY', 'APPROVED')
       RETURNING id`,
      [createdSetId, JSON.stringify({ A: '4', B: '8', C: '16', D: '32' }), JSON.stringify('B')]
    );

    const questionIds = [q1.rows[0].id, q2.rows[0].id, q3.rows[0].id, q4.rows[0].id, q5.rows[0].id];

    // 5A: Start Quiz Attempt
    const startRes = await axios.post(`${API_BASE}/quizzes/start`, { testSetId: createdSetId }, { headers: authHeaders });
    assert(startRes.status === 201, 'Start quiz returned HTTP 201 Created');
    const attempt = startRes.data.attempt;
    const questions = startRes.data.questions;
    assert(attempt.status === 'IN_PROGRESS', 'Attempt status is IN_PROGRESS');
    assert(questions.length === 5, 'Returned 5 questions');

    // Anti-cheat verification: ensure correct_answer and explanation are NOT returned during quiz
    for (const q of questions) {
      assert(q.correct_answer === undefined || q.correct_answer === null, `Question ${q.id} does not leak correct_answer`);
      assert(q.explanation === undefined || q.explanation === null, `Question ${q.id} does not leak explanation`);
    }

    // 5B: Submit Quiz with 4 correct out of 5 (80% -> 8.0/10 -> "Khá vững")
    // Answers:
    // q1: A (Correct)
    // q2: B (Correct)
    // q3: B (Correct)
    // q4: A (Correct)
    // q5: C (Wrong - correct is B)
    const submitPayload = {
      answers: [
        { questionId: questionIds[0], answer: 'A' },
        { questionId: questionIds[1], answer: 'B' },
        { questionId: questionIds[2], answer: 'B' },
        { questionId: questionIds[3], answer: 'A' },
        { questionId: questionIds[4], answer: 'C' }, // intentionally wrong
      ],
      timeSpent: 120,
    };

    const submitRes = await axios.post(`${API_BASE}/quizzes/attempts/${attempt.id}/submit`, submitPayload, { headers: authHeaders });
    assert(submitRes.status === 200, 'Submit quiz returned HTTP 200');
    const submittedAttempt = submitRes.data.attempt;
    assert(submittedAttempt.status === 'SUBMITTED', 'Attempt marked SUBMITTED');

    // Verify 10-point scale and accuracy percent
    assert(submittedAttempt.score10 === 8.0, `score10 is exactly 8.0 (got ${submittedAttempt.score10})`);
    assert(submittedAttempt.accuracyPercent === 80, `accuracyPercent is exactly 80% (got ${submittedAttempt.accuracyPercent})`);
    assert(submittedAttempt.evaluationLabel === 'Khá vững', `evaluationLabel is "Khá vững" (got ${submittedAttempt.evaluationLabel})`);

    // Verify answers detail now reveals correct answers & explanations
    assert(Array.isArray(submitRes.data.answers), 'Returned answer reviews');
    assert(submitRes.data.answers.length === 5, 'Returned 5 answer evaluations');
    const wrongAnswer = submitRes.data.answers.find((a: any) => a.question_id === questionIds[4]);
    assert(wrongAnswer.is_correct === false, 'Question 5 correctly marked as false');
    assert(wrongAnswer.correctAnswer === 'B' || wrongAnswer.correct_answer === 'B', 'Question 5 reveals correct answer B');
    assert(!!wrongAnswer.explanation, 'Question 5 reveals explanation');

    // 5C: Anti-re-submission test
    try {
      await axios.post(`${API_BASE}/quizzes/attempts/${attempt.id}/submit`, submitPayload, { headers: authHeaders });
      assert(false, 'Should reject re-submission of already COMPLETED attempt');
    } catch (err: any) {
      assert(err.response?.status === 400, 'Re-submission returned HTTP 400 Bad Request');
    }

    // 5D: Query Attempt Result endpoint
    const resultRes = await axios.get(`${API_BASE}/quizzes/attempts/${attempt.id}`, { headers: authHeaders });
    assert(resultRes.status === 200, 'Get attempt result returned HTTP 200');
    const resultAttempt = resultRes.data.attempt;
    assert(resultAttempt.score10 === 8.0, 'Stored score10 verified on fetch');
    assert(resultAttempt.accuracyPercent === 80, 'Stored accuracyPercent verified on fetch');
    assert(resultAttempt.evaluationLabel === 'Khá vững', 'Stored evaluationLabel verified on fetch');

    console.log('\n================================================================');
    console.log('    ✓ ALL AI QUIZ OPTIMIZATION TESTS PASSED SUCCESSFULLY!       ');
    console.log('================================================================\n');
  } catch (error: any) {
    console.error('\n[FATAL ERROR]:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    // Cleanup test data
    if (createdSetId) {
      await db.query(`DELETE FROM quiz_attempts WHERE test_set_id = $1`, [createdSetId]);
      await db.query(`DELETE FROM questions WHERE test_set_id = $1`, [createdSetId]);
      await db.query(`DELETE FROM test_sets WHERE id = $1`, [createdSetId]);
    }
    if (testUserId) {
      await db.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
    }
    await db.end();
  }
}

runQuizOptimizationTests();
