import { assignmentAttemptRepository } from '../repositories/assignment-attempt.repository';
import { assignmentRepository } from '../repositories/assignment.repository';
import { AppError } from '../utils/AppError';
import { db } from '../db';

class AssignmentAttemptService {
  async startAttempt(assignmentId: string, studentId: number) {
    const assignment = await assignmentRepository.getById(assignmentId);
    if (!assignment) throw new AppError('Không tìm thấy bài tập', 404);

    // First check if there's an IN_PROGRESS attempt
    const inProgressRes = await db.query(
      `SELECT * FROM assignment_attempts WHERE assignment_id = $1 AND student_id = $2 AND status = 'IN_PROGRESS' ORDER BY start_time DESC LIMIT 1`,
      [assignmentId, studentId]
    );
    let attempt;
    
    if (inProgressRes.rows.length > 0) {
      attempt = inProgressRes.rows[0];
    } else {
      // Check attempt limits
      if (assignment.attempt_limit) {
        const count = await assignmentAttemptRepository.getAttemptCount(assignmentId, studentId);
        if (count >= assignment.attempt_limit) {
          throw new AppError('Đã hết số lần làm bài', 403);
        }
      }
      attempt = await assignmentAttemptRepository.createAttempt(assignmentId, studentId);
    }

    // Optionally check start_date and due_date
    if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
      throw new AppError('Bài tập đã hết hạn', 403);
    }
    
    // @ts-ignore
    if (assignment.start_date && new Date() < new Date(assignment.start_date)) {
      throw new AppError('Chưa đến thời gian làm bài', 403);
    }

    // Fetch questions without correct answers
    let questions = [];
    if (assignment.test_set_id) {
      const qRes = await db.query(
        'SELECT id, type, content, options, score FROM questions WHERE test_set_id = $1 ORDER BY id ASC',
        [assignment.test_set_id]
      );
      questions = qRes.rows;
    }

    // Fetch existing answers if attempt is IN_PROGRESS
    let existingAnswers = [];
    if (attempt.status === 'IN_PROGRESS') {
       const ansRes = await db.query(
          'SELECT question_id, selected_option FROM attempt_answers WHERE attempt_id = $1',
          [attempt.id]
       );
       existingAnswers = ansRes.rows;
    }

    return {
      attempt,
      assignment,
      questions,
      existingAnswers
    };
  }

  async saveAnswersOnly(attemptId: string, studentId: number, answers: { question_id: number; selected_option: any }[]) {
    const attempt = await assignmentAttemptRepository.getAttempt(attemptId, studentId);
    if (!attempt) throw new AppError('Không tìm thấy lượt làm bài', 404);
    if (attempt.status !== 'IN_PROGRESS') throw new AppError('Lượt làm bài đã kết thúc', 400);

    const assignment = await assignmentRepository.getById(attempt.assignment_id);
    if (!assignment || !assignment.test_set_id) throw new AppError('Bài tập không hợp lệ', 400);

    const questionsRes = await db.query(
      'SELECT id, correct_answer FROM questions WHERE test_set_id = $1',
      [assignment.test_set_id]
    );

    const questions = questionsRes.rows;
    const saveAnswers = [];

    for (const ans of answers) {
      const q = questions.find(x => x.id === ans.question_id);
      if (q) {
        let is_correct = false;
        if (Array.isArray(q.correct_answer)) {
           is_correct = JSON.stringify(q.correct_answer) === JSON.stringify(ans.selected_option);
        } else if (typeof q.correct_answer === 'object' && q.correct_answer !== null) {
          is_correct = q.correct_answer.text === ans.selected_option || JSON.stringify(q.correct_answer) === JSON.stringify(ans.selected_option);
        } else {
           is_correct = q.correct_answer === ans.selected_option;
        }

        saveAnswers.push({
          question_id: ans.question_id,
          selected_option: ans.selected_option,
          is_correct
        });
      }
    }

    await assignmentAttemptRepository.saveAnswers(attemptId, saveAnswers);
    return { success: true };
  }

  async submitAttempt(attemptId: string, studentId: number, answers: { question_id: number; selected_option: any }[]) {
    const attempt = await assignmentAttemptRepository.getAttempt(attemptId, studentId);
    if (!attempt) throw new AppError('Không tìm thấy lượt làm bài', 404);
    if (attempt.status !== 'IN_PROGRESS') throw new AppError('Lượt làm bài đã kết thúc', 400);

    const assignment = await assignmentRepository.getById(attempt.assignment_id);
    if (!assignment || !assignment.test_set_id) throw new AppError('Bài tập không hợp lệ', 400);

    // Score calculation
    const questionsRes = await db.query(
      'SELECT id, correct_answer, score FROM questions WHERE test_set_id = $1',
      [assignment.test_set_id]
    );

    const questions = questionsRes.rows;
    let totalScore = 0;
    const saveAnswers = [];

    for (const ans of answers) {
      const q = questions.find(x => x.id === ans.question_id);
      if (q) {
        // Compare logically (simplistic for multiple choice, JSON stringify for others)
        let is_correct = false;
        
        // For array correct_answer
        if (Array.isArray(q.correct_answer)) {
           is_correct = JSON.stringify(q.correct_answer) === JSON.stringify(ans.selected_option);
        } else if (typeof q.correct_answer === 'object' && q.correct_answer !== null) {
          is_correct = q.correct_answer.text === ans.selected_option || JSON.stringify(q.correct_answer) === JSON.stringify(ans.selected_option);
        } else {
           is_correct = q.correct_answer === ans.selected_option;
        }

        if (is_correct) totalScore += parseFloat(q.score || '1.0');

        saveAnswers.push({
          question_id: ans.question_id,
          selected_option: ans.selected_option,
          is_correct
        });
      }
    }

    await assignmentAttemptRepository.saveAnswers(attemptId, saveAnswers);
    return assignmentAttemptRepository.finishAttempt(attemptId, studentId, totalScore);
  }
}

export const assignmentAttemptService = new AssignmentAttemptService();
