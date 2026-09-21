import { db } from '../db';
import { AppError } from '../utils/AppError';

class AssignmentAttemptRepository {
  async createAttempt(assignmentId: string, studentId: number) {
    const res = await db.query(
      `INSERT INTO assignment_attempts (assignment_id, student_id, status)
       VALUES ($1, $2, 'IN_PROGRESS') RETURNING *`,
      [assignmentId, studentId]
    );
    return res.rows[0];
  }

  async getAttempt(attemptId: string, studentId: number) {
    const res = await db.query(
      `SELECT * FROM assignment_attempts WHERE id = $1 AND student_id = $2`,
      [attemptId, studentId]
    );
    return res.rows[0];
  }

  async finishAttempt(attemptId: string, studentId: number, score: number) {
    const res = await db.query(
      `UPDATE assignment_attempts 
       SET status = 'SUBMITTED', end_time = NOW(), score = $1
       WHERE id = $2 AND student_id = $3 RETURNING *`,
      [score, attemptId, studentId]
    );
    return res.rows[0];
  }

  async saveAnswers(attemptId: string, answers: { question_id: number; selected_option: any; is_correct: boolean }[]) {
    if (answers.length === 0) return;
    
    // Xóa câu trả lời cũ của các question_id này (để giả lập UPSERT)
    const questionIds = answers.map(a => a.question_id);
    const placeholders = questionIds.map((_, i) => `$${i + 2}`).join(', ');
    await db.query(
      `DELETE FROM attempt_answers WHERE attempt_id = $1 AND question_id IN (${placeholders})`,
      [attemptId, ...questionIds]
    );

    // Chèn câu trả lời mới
    const values = answers.map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`).join(', ');
    const params = [attemptId];
    for (const ans of answers) {
      params.push(ans.question_id.toString(), JSON.stringify(ans.selected_option), ans.is_correct ? 'true' : 'false');
    }

    await db.query(
      `INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct)
       VALUES ${values}`,
      params
    );
  }

  async getAttemptCount(assignmentId: string, studentId: number) {
    const res = await db.query(
      `SELECT COUNT(*) as count FROM assignment_attempts 
       WHERE assignment_id = $1 AND student_id = $2 AND status != 'ABANDONED'`,
      [assignmentId, studentId]
    );
    return parseInt(res.rows[0].count);
  }

  async getStudentAttempts(assignmentId: string, studentId: number) {
    const res = await db.query(
      `SELECT * FROM assignment_attempts 
       WHERE assignment_id = $1 AND student_id = $2 
       ORDER BY start_time DESC`,
      [assignmentId, studentId]
    );
    return res.rows;
  }
}

export const assignmentAttemptRepository = new AssignmentAttemptRepository();
