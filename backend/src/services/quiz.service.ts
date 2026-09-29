import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface SubmitAnswerItem {
  questionId: number;
  answer: any;
}

export interface StartQuizOptions {
  isRetryMistakes?: boolean;
  previousAttemptId?: number;
}

export class QuizService {
  /**
   * Bắt đầu một lượt làm bài thi cá nhân (Start Quiz)
   * BẢO MẬT: Bóc bỏ hoàn toàn correct_answer và explanation trước khi trả về cho client
   */
  async startQuiz(userId: number, testSetId: number, options: StartQuizOptions = {}) {
    // 1. Kiểm tra bộ đề tồn tại và trạng thái
    const tsRes = await db.query(
      `SELECT id, name, total_questions, total_score, is_active, created_by, status, visibility
       FROM test_sets
       WHERE id = $1`,
      [testSetId]
    );

    if (tsRes.rows.length === 0) {
      throw new AppError('Bộ đề thi không tồn tại', 404);
    }

    const testSet = tsRes.rows[0];

    // Người dùng chỉ được làm bài nếu là chủ sở hữu HOẶC bộ đề ở chế độ công khai (visibility === 'public')
    const isOwner = testSet.created_by === userId;
    const isPublic = testSet.visibility === 'public';

    if (!isOwner && !isPublic) {
      throw new AppError('Bạn không có quyền truy cập bộ đề thi này', 403);
    }

    // Nếu là người ngoài truy cập đề public thì đề PHẢI là APPROVED và active
    if (!isOwner && (testSet.status !== 'APPROVED' || !testSet.is_active)) {
      throw new AppError('Bộ đề thi chưa sẵn sàng để làm bài', 403);
    }

    let questions: any[] = [];

    // 2. Nếu là chế độ "Làm lại câu sai" (Retry Mistakes)
    if (options.isRetryMistakes && options.previousAttemptId) {
      const prevAttemptRes = await db.query(
        `SELECT id, user_id, test_set_id FROM quiz_attempts WHERE id = $1 AND user_id = $2`,
        [options.previousAttemptId, userId]
      );
      if (prevAttemptRes.rows.length === 0) {
        throw new AppError('Không tìm thấy lượt làm bài trước đó để ôn lại câu sai', 404);
      }

      const mistakesRes = await db.query(
        `SELECT q.id, q.type, q.content, q.score, q.options, q.difficulty
         FROM quiz_attempt_answers qaa
         JOIN questions q ON q.id = qaa.question_id
         WHERE qaa.attempt_id = $1 AND qaa.is_correct = false AND q.type != 'ESSAY'
         ORDER BY q.id ASC`,
        [options.previousAttemptId]
      );

      if (mistakesRes.rows.length === 0) {
        throw new AppError('Bạn không có câu sai nào trong bài thi này!', 400);
      }

      questions = mistakesRes.rows;
    } else {
      // Chế độ thông thường: Lấy tất cả câu hỏi của bộ đề
      const qRes = await db.query(
        `SELECT id, type, content, score, options, difficulty
         FROM questions
         WHERE test_set_id = $1
         ORDER BY id ASC`,
        [testSetId]
      );

      if (qRes.rows.length === 0) {
        throw new AppError('Bộ đề thi chưa có câu hỏi nào để làm bài', 400);
      }

      questions = qRes.rows;
    }

    const totalQuestions = questions.length;
    const totalScore = options.isRetryMistakes
      ? questions.reduce((sum, q) => sum + (Number(q.score) || 1.0), 0)
      : (Number(testSet.total_score) || questions.reduce((sum, q) => sum + (Number(q.score) || 1.0), 0));

    // 3. Khởi tạo bản ghi lượt làm bài (Attempt)
    const attemptRes = await db.query(
      `INSERT INTO quiz_attempts (user_id, test_set_id, title, total_questions, total_score, score, correct_count, status, started_at)
       VALUES ($1, $2, $3, $4, $5, 0, 0, 'IN_PROGRESS', CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, testSetId, testSet.name || 'Bài thi', totalQuestions, totalScore]
    );

    const attempt = attemptRes.rows[0];

    // 4. BẢO MẬT TUYỆT ĐỐI: Bóc bỏ hoàn toàn đáp án đúng và lời giải khỏi payload trả về
    const sanitizedQuestions = questions.map((q, idx) => ({
      index: idx + 1,
      id: q.id,
      type: q.type,
      content: q.content,
      score: Number(q.score) || 1.0,
      options: q.options || undefined,
      difficulty: q.difficulty || 'medium',
    }));

    return {
      attempt: {
        id: attempt.id,
        testSetId: attempt.test_set_id,
        totalQuestions: attempt.total_questions,
        totalScore: Number(attempt.total_score),
        status: attempt.status,
        startedAt: attempt.started_at,
      },
      testSet: {
        id: testSet.id,
        name: testSet.name,
      },
      isRetryMistakes: !!options.isRetryMistakes,
      questions: sanitizedQuestions,
    };
  }

  /**
   * Nộp bài thi và chấm điểm Server-Side (Submit Quiz)
   * KHÔNG tính điểm ở frontend. Backend đối chiếu đáp án từ cơ sở dữ liệu và tính điểm chuẩn xác.
   */
  async submitQuiz(userId: number, attemptId: number, userAnswers: SubmitAnswerItem[], durationSeconds: number = 0) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Kiểm tra Attempt tồn tại và quyền sở hữu
      const attRes = await client.query(
        `SELECT qa.*, ts.name as test_set_name
         FROM quiz_attempts qa
         JOIN test_sets ts ON ts.id = qa.test_set_id
         WHERE qa.id = $1
         FOR UPDATE`,
        [attemptId]
      );

      if (attRes.rows.length === 0) {
        throw new AppError('Không tìm thấy lượt làm bài thi', 404);
      }

      const attempt = attRes.rows[0];
      if (attempt.user_id !== userId) {
        throw new AppError('Bạn không có quyền nộp bài thi cho lượt làm bài này', 403);
      }

      if (attempt.status === 'SUBMITTED') {
        throw new AppError('Bài thi này đã được nộp trước đó, không thể nộp lại.', 400);
      }

      // Tính thời gian làm bài chính xác từ server (từ lúc started_at đến nay)
      const startedAtMs = new Date(attempt.started_at).getTime();
      const serverDurationSeconds = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));

      // 2. Lấy toàn bộ câu hỏi gốc kèm đáp án đúng từ Database
      const qRes = await client.query(
        `SELECT id, type, content, score, options, correct_answer, explanation
         FROM questions
         WHERE test_set_id = $1`,
        [attempt.test_set_id]
      );

      const questionMap = new Map<number, any>();
      for (const q of qRes.rows) {
        questionMap.set(q.id, q);
      }

      // Map câu trả lời của user theo questionId
      const answerMap = new Map<number, any>();
      if (Array.isArray(userAnswers)) {
        for (const ua of userAnswers) {
          if (ua && ua.questionId) {
            answerMap.set(Number(ua.questionId), ua.answer);
          }
        }
      }

      let totalAwardedScore = 0;
      let correctCount = 0;
      let gradableTotalScore = 0;
      const detailedAnswers: any[] = [];

      // 3. Duyệt và chấm điểm từng câu hỏi
      for (const [qId, q] of questionMap.entries()) {
        const uAns = answerMap.get(qId);
        const qScore = Number(q.score) || 1.0;
        let isCorrect: boolean | null = false;

        // Trích xuất đáp án chuẩn
        let targetAns: any = q.correct_answer;
        if (typeof targetAns === 'string') {
          try {
            targetAns = JSON.parse(targetAns);
          } catch {
            // Chuỗi đơn
          }
        }

        const isGradable = Boolean(targetAns && q.type !== 'ESSAY');
        if (isGradable) {
          gradableTotalScore += qScore;
        }

        if (!targetAns) {
          // Câu hỏi không có đáp án chính thức (Phase 7 NOT SET)
          // Đánh dấu is_correct = null (UNGRADED), không tính đúng/sai và không cộng điểm
          isCorrect = null;
        } else if (q.type === 'ESSAY') {
          // Câu tự luận (ESSAY): Tuyệt đối KHÔNG tự động chấm điểm qua độ dài chuỗi (tránh điểm ảo cho nội dung vô nghĩa)
          // Đánh dấu is_correct = null (UNGRADED), điểm awarded = 0. Cung cấp câu trả lời của người dùng và đáp án mẫu để tự đối chiếu
          isCorrect = null;
        } else if (uAns !== undefined && uAns !== null && uAns !== '') {
          if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
            const cleanUser = String(uAns).trim().toUpperCase();
            const cleanTarget = String(targetAns).trim().toUpperCase();
            // Chuẩn hóa Đúng/Sai
            const normUser = cleanUser === 'TRUE' || cleanUser === 'ĐÚNG' ? 'A' : cleanUser === 'FALSE' || cleanUser === 'SAI' ? 'B' : cleanUser;
            const normTarget = cleanTarget === 'TRUE' || cleanTarget === 'ĐÚNG' ? 'A' : cleanTarget === 'FALSE' || cleanTarget === 'SAI' ? 'B' : cleanTarget;
            isCorrect = normUser === normTarget || cleanUser === cleanTarget;
          } else if (q.type === 'FILL_BLANK') {
            const cleanUser = String(uAns).trim().toLowerCase();
            if (Array.isArray(targetAns)) {
              isCorrect = targetAns.some(a => String(a).trim().toLowerCase() === cleanUser);
            } else {
              isCorrect = String(targetAns).trim().toLowerCase() === cleanUser;
            }
          }
        } else {
          // Bỏ trống câu hỏi khách quan
          isCorrect = false;
        }

        const scoreAwarded = isCorrect === true ? qScore : 0;
        if (isCorrect === true) {
          correctCount++;
          totalAwardedScore += scoreAwarded;
        }

        // Lưu câu trả lời vào quiz_attempt_answers (is_correct có thể là null với câu UNGRADED)
        const ansInsert = await client.query(
          `INSERT INTO quiz_attempt_answers (attempt_id, question_id, user_answer, is_correct, score_awarded, explanation)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            attemptId,
            qId,
            uAns !== undefined ? JSON.stringify(uAns) : null,
            isCorrect,
            scoreAwarded,
            q.explanation || null,
          ]
        );

        detailedAnswers.push({
          ...ansInsert.rows[0],
          questionContent: q.content,
          options: q.options,
          correctAnswer: q.correct_answer,
          type: q.type,
          maxScore: qScore,
        });
      }

      // 4. Cập nhật bảng quiz_attempts với mẫu số total_score chuẩn xác (chỉ tính câu hỏi có thể chấm điểm)
      const finalGradableTotalScore = gradableTotalScore > 0 ? gradableTotalScore : (Number(attempt.total_score) || 1);
      const updatedAttemptRes = await client.query(
        `UPDATE quiz_attempts
         SET score = $1,
             total_score = $2,
             correct_count = $3,
             duration_seconds = $4,
             status = 'SUBMITTED',
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [totalAwardedScore, finalGradableTotalScore, correctCount, serverDurationSeconds, attemptId]
      );

      const finalAttempt = updatedAttemptRes.rows[0];

      // 5. Ghi nhận Activity & Học tập
      try {
        await client.query(
          `INSERT INTO learning_activities (user_id, activity_type, entity_type, entity_id, duration_seconds, details, idempotency_key)
           VALUES ($1, 'take_quiz', 'test_set', $2, $3, $4, $5)
           ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING`,
          [
            userId,
            attempt.test_set_id,
            serverDurationSeconds,
            JSON.stringify({
              attemptId,
              score: totalAwardedScore,
              correctCount,
              totalQuestions: attempt.total_questions,
            }),
            `quiz_attempt:${attemptId}`,
          ]
        );

        // Cập nhật streak học tập theo múi giờ UTC+7
        await client.query(
          `INSERT INTO user_study_dates (user_id, study_date)
           VALUES ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)
           ON CONFLICT (user_id, study_date) DO NOTHING`,
          [userId]
        );
      } catch (actErr) {
        console.warn('Learning activity log non-fatal error:', actErr);
      }

      await client.query('COMMIT');

      // Mẫu số chuẩn để tính tỷ lệ chính xác (percentage): Chỉ tính trên tổng điểm các câu hỏi khách quan có thể chấm được
      const maxPossibleScore = gradableTotalScore > 0 ? gradableTotalScore : (Number(finalAttempt.total_score) || 1);
      const percentage = Math.round((totalAwardedScore / maxPossibleScore) * 100);

      return {
        attempt: {
          id: finalAttempt.id,
          testSetId: finalAttempt.test_set_id,
          testSetName: attempt.test_set_name,
          score: Number(finalAttempt.score),
          totalScore: Number(finalAttempt.total_score),
          gradableTotalScore,
          percentage,
          correctCount: finalAttempt.correct_count,
          totalQuestions: finalAttempt.total_questions,
          durationSeconds: finalAttempt.duration_seconds,
          status: finalAttempt.status,
          startedAt: finalAttempt.started_at,
          completedAt: finalAttempt.completed_at,
        },
        answers: detailedAnswers,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Xem kết quả chi tiết của một lượt làm bài (Result)
   */
  async getAttemptResult(userId: number, attemptId: number) {
    const attRes = await db.query(
      `SELECT qa.*, ts.name as test_set_name
       FROM quiz_attempts qa
       JOIN test_sets ts ON ts.id = qa.test_set_id
       WHERE qa.id = $1`,
      [attemptId]
    );

    if (attRes.rows.length === 0) {
      throw new AppError('Không tìm thấy kết quả bài thi', 404);
    }

    const attempt = attRes.rows[0];

    if (attempt.user_id !== userId) {
      throw new AppError('Bạn không có quyền xem kết quả bài thi này', 403);
    }

    // BẢO MẬT ANTI-CHEAT: Nếu lượt làm bài vẫn còn IN_PROGRESS, TUYỆT ĐỐI KHÔNG trả về đáp án và giải thích
    if (attempt.status === 'IN_PROGRESS') {
      throw new AppError('Bài thi đang diễn ra và chưa được nộp. Không thể xem đáp án và giải thích.', 400);
    }

    const ansRes = await db.query(
      `SELECT qaa.*, q.content as question_content, q.options as question_options,
              q.correct_answer as question_correct_answer, q.explanation as question_explanation,
              q.type as question_type, q.score as question_max_score
       FROM quiz_attempt_answers qaa
       JOIN questions q ON q.id = qaa.question_id
       WHERE qaa.attempt_id = $1
       ORDER BY qaa.id ASC`,
      [attemptId]
    );

    let gradableScore = 0;
    for (const ans of ansRes.rows) {
      if (ans.question_type !== 'ESSAY' && ans.question_correct_answer) {
        gradableScore += Number(ans.question_max_score) || 0;
      }
    }
    const maxScore = gradableScore > 0 ? gradableScore : (Number(attempt.total_score) || 1);
    const percentage = Math.round((Number(attempt.score) / maxScore) * 100);

    return {
      attempt: {
        id: attempt.id,
        testSetId: attempt.test_set_id,
        testSetName: attempt.test_set_name,
        score: Number(attempt.score),
        totalScore: Number(attempt.total_score),
        gradableTotalScore: gradableScore,
        percentage,
        correctCount: attempt.correct_count,
        totalQuestions: attempt.total_questions,
        durationSeconds: attempt.duration_seconds,
        status: attempt.status,
        startedAt: attempt.started_at,
        completedAt: attempt.completed_at,
      },
      answers: ansRes.rows,
    };
  }

  /**
   * Xem riêng các câu làm sai để ôn tập (Review Mistakes)
   */
  async getAttemptMistakes(userId: number, attemptId: number) {
    const attRes = await db.query(
      `SELECT qa.*, ts.name as test_set_name
       FROM quiz_attempts qa
       JOIN test_sets ts ON ts.id = qa.test_set_id
       WHERE qa.id = $1`,
      [attemptId]
    );

    if (attRes.rows.length === 0) {
      throw new AppError('Không tìm thấy lượt làm bài thi', 404);
    }

    const attempt = attRes.rows[0];

    if (attempt.user_id !== userId) {
      throw new AppError('Bạn không có quyền xem danh sách câu sai của bài thi này', 403);
    }

    if (attempt.status === 'IN_PROGRESS') {
      throw new AppError('Bài thi đang diễn ra và chưa được nộp.', 400);
    }

    const mistakesRes = await db.query(
      `SELECT qaa.*, q.content as question_content, q.options as question_options,
              q.correct_answer as question_correct_answer, q.explanation as question_explanation,
              q.type as question_type, q.score as question_max_score
       FROM quiz_attempt_answers qaa
       JOIN questions q ON q.id = qaa.question_id
       WHERE qaa.attempt_id = $1 AND qaa.is_correct = false AND q.type != 'ESSAY'
       ORDER BY qaa.id ASC`,
      [attemptId]
    );

    return {
      attemptId,
      testSetId: attRes.rows[0].test_set_id,
      testSetName: attRes.rows[0].test_set_name,
      totalMistakes: mistakesRes.rows.length,
      mistakes: mistakesRes.rows,
    };
  }

  /**
   * Lịch sử làm bài thi của người dùng
   */
  async listUserHistory(userId: number, limit: number = 20, offset: number = 0) {
    const res = await db.query(
      `SELECT qa.*, ts.name as test_set_name
       FROM quiz_attempts qa
       JOIN test_sets ts ON ts.id = qa.test_set_id
       WHERE qa.user_id = $1
       ORDER BY qa.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countRes = await db.query(
      `SELECT COUNT(*) FROM quiz_attempts WHERE user_id = $1`,
      [userId]
    );

    return {
      attempts: res.rows.map(a => ({
        id: a.id,
        testSetId: a.test_set_id,
        testSetName: a.test_set_name,
        score: Number(a.score),
        totalScore: Number(a.total_score),
        percentage: Math.round((Number(a.score) / (Number(a.total_score) || 1)) * 100),
        correctCount: a.correct_count,
        totalQuestions: a.total_questions,
        durationSeconds: a.duration_seconds,
        status: a.status,
        startedAt: a.started_at,
        completedAt: a.completed_at,
      })),
      total: parseInt(countRes.rows[0].count, 10),
    };
  }
}

export const quizService = new QuizService();
