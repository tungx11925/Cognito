import { db } from '../db';
import { PoolClient } from 'pg';

export interface CreateQuizAttemptInput {
  userId: number;
  testSetId: number;
  totalQuestions: number;
  totalScore: number;
}

export interface SaveAttemptAnswerInput {
  attemptId: number;
  questionId: number;
  userAnswer: any;
  isCorrect: boolean;
  scoreAwarded: number;
  explanation?: string | null;
}

export class QuizAttemptRepository {
  async createAttempt(input: CreateQuizAttemptInput, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `INSERT INTO quiz_attempts (user_id, test_set_id, total_questions, total_score, status, started_at)
       VALUES ($1, $2, $3, $4, 'IN_PROGRESS', CURRENT_TIMESTAMP)
       RETURNING *`,
      [input.userId, input.testSetId, input.totalQuestions, input.totalScore]
    );
    return res.rows[0];
  }

  async getAttemptById(attemptId: number, userId: number, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `SELECT qa.*, ts.name as test_set_name
       FROM quiz_attempts qa
       JOIN test_sets ts ON ts.id = qa.test_set_id
       WHERE qa.id = $1 AND qa.user_id = $2`,
      [attemptId, userId]
    );
    return res.rows[0] || null;
  }

  async getAttemptAnswers(attemptId: number, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `SELECT qaa.*, q.content as question_content, q.options as question_options,
              q.correct_answer as question_correct_answer, q.type as question_type,
              q.score as question_max_score
       FROM quiz_attempt_answers qaa
       JOIN questions q ON q.id = qaa.question_id
       WHERE qaa.attempt_id = $1
       ORDER BY qaa.id ASC`,
      [attemptId]
    );
    return res.rows;
  }

  async saveAttemptAnswer(input: SaveAttemptAnswerInput, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `INSERT INTO quiz_attempt_answers (attempt_id, question_id, user_answer, is_correct, score_awarded, explanation)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.attemptId,
        input.questionId,
        JSON.stringify(input.userAnswer),
        input.isCorrect,
        input.scoreAwarded,
        input.explanation || null,
      ]
    );
    return res.rows[0];
  }

  async completeAttempt(attemptId: number, userId: number, data: {
    score: number;
    correctCount: number;
    durationSeconds: number;
  }, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `UPDATE quiz_attempts SET
         score = $1,
         correct_count = $2,
         duration_seconds = $3,
         status = 'SUBMITTED',
         completed_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [data.score, data.correctCount, data.durationSeconds, attemptId, userId]
    );
    return res.rows[0];
  }

  async listUserAttempts(userId: number, limit: number = 20, offset: number = 0, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `SELECT qa.*, ts.name as test_set_name
       FROM quiz_attempts qa
       JOIN test_sets ts ON ts.id = qa.test_set_id
       WHERE qa.user_id = $1
       ORDER BY qa.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return res.rows;
  }

  async getMistakesByAttempt(attemptId: number, userId: number, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `SELECT qaa.*, q.content as question_content, q.options as question_options,
              q.correct_answer as question_correct_answer, q.explanation as question_explanation,
              q.type as question_type
       FROM quiz_attempt_answers qaa
       JOIN quiz_attempts qa ON qa.id = qaa.attempt_id
       JOIN questions q ON q.id = qaa.question_id
       WHERE qaa.attempt_id = $1 AND qa.user_id = $2 AND qaa.is_correct = false
       ORDER BY qaa.id ASC`,
      [attemptId, userId]
    );
    return res.rows;
  }
}

export const quizAttemptRepository = new QuizAttemptRepository();
