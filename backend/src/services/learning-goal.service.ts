import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface CreateGoalParams {
  title: string;
  subject?: string | null;
  targetType: 'study_time_minutes' | 'quizzes_completed' | 'flashcards_reviewed' | 'documents_read';
  targetValue: number;
  period?: 'daily' | 'weekly';
}

export interface UpdateGoalParams {
  title?: string;
  subject?: string | null;
  targetType?: 'study_time_minutes' | 'quizzes_completed' | 'flashcards_reviewed' | 'documents_read';
  targetValue?: number;
  period?: 'daily' | 'weekly';
  isActive?: boolean;
}

export class LearningGoalService {
  /**
   * Tạo mục tiêu học tập mới
   */
  async createGoal(userId: number, params: CreateGoalParams) {
    const {
      title,
      subject = null,
      targetType,
      targetValue,
      period = 'daily',
    } = params;

    if (!title || title.trim().length === 0) {
      throw new AppError('Tiêu đề mục tiêu không được để trống', 400);
    }

    if (!['study_time_minutes', 'quizzes_completed', 'flashcards_reviewed', 'documents_read'].includes(targetType)) {
      throw new AppError('Loại mục tiêu không hợp lệ', 400);
    }

    if (!targetValue || targetValue <= 0) {
      throw new AppError('Chỉ tiêu mục tiêu phải lớn hơn 0', 400);
    }

    const res = await db.query(
      `INSERT INTO learning_goals (user_id, title, subject, target_type, target_value, period, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [userId, title.trim(), subject ? subject.trim() : null, targetType, targetValue, period]
    );

    return res.rows[0];
  }

  /**
   * Lấy danh sách mục tiêu và tính toán tiến độ thực tế theo múi giờ Asia/Ho_Chi_Minh
   */
  async listGoals(userId: number) {
    const goalsRes = await db.query(
      `SELECT * FROM learning_goals WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [userId]
    );

    const goalsWithProgress = await Promise.all(
      goalsRes.rows.map(async (goal) => {
        let currentValue = 0;
        const isWeekly = goal.period === 'weekly';

        // Xây dựng điều kiện thời gian theo múi giờ Việt Nam
        const dateCondition = isWeekly
          ? `(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= date_trunc('week', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')`
          : `(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`;

        const subjectFilter = goal.subject ? `%${goal.subject}%` : null;

        if (goal.target_type === 'study_time_minutes') {
          const valRes = await db.query(
            `SELECT COALESCE(SUM(duration_seconds), 0) / 60 as minutes
             FROM learning_activities
             WHERE user_id = $1
               AND ${dateCondition}
               AND ($2::text IS NULL OR subject ILIKE $2 OR details->>'subject' ILIKE $2)`,
            [userId, subjectFilter]
          );
          currentValue = Math.round(Number(valRes.rows[0]?.minutes || 0));
        } else if (goal.target_type === 'quizzes_completed') {
          const valRes = await db.query(
            `SELECT COUNT(*) as count
             FROM learning_activities
             WHERE user_id = $1
               AND activity_type = 'take_quiz'
               AND ${dateCondition}
               AND ($2::text IS NULL OR subject ILIKE $2 OR details->>'subject' ILIKE $2)`,
            [userId, subjectFilter]
          );
          currentValue = Number(valRes.rows[0]?.count || 0);
        } else if (goal.target_type === 'flashcards_reviewed') {
          const valRes = await db.query(
            `SELECT COUNT(*) as count
             FROM learning_activities
             WHERE user_id = $1
               AND activity_type = 'study_flashcards'
               AND ${dateCondition}
               AND ($2::text IS NULL OR subject ILIKE $2 OR details->>'subject' ILIKE $2)`,
            [userId, subjectFilter]
          );
          currentValue = Number(valRes.rows[0]?.count || 0);
        } else if (goal.target_type === 'documents_read') {
          const valRes = await db.query(
            `SELECT COUNT(*) as count
             FROM learning_activities
             WHERE user_id = $1
               AND activity_type = 'read_doc'
               AND ${dateCondition}
               AND ($2::text IS NULL OR subject ILIKE $2 OR details->>'subject' ILIKE $2)`,
            [userId, subjectFilter]
          );
          currentValue = Number(valRes.rows[0]?.count || 0);
        }

        const targetValue = goal.target_value;
        const progressPercentage = Math.min(100, Math.round((currentValue / targetValue) * 100));
        const isCompleted = currentValue >= targetValue;

        return {
          ...goal,
          current_value: currentValue,
          progress_percentage: progressPercentage,
          is_completed: isCompleted,
        };
      })
    );

    return goalsWithProgress;
  }

  /**
   * Cập nhật mục tiêu học tập
   */
  async updateGoal(userId: number, goalId: number, params: UpdateGoalParams) {
    const existing = await db.query(
      `SELECT * FROM learning_goals WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (existing.rows.length === 0) {
      throw new AppError('Không tìm thấy mục tiêu hoặc bạn không có quyền', 404);
    }

    const current = existing.rows[0];
    const title = params.title !== undefined ? params.title.trim() : current.title;
    const subject = params.subject !== undefined ? params.subject : current.subject;
    const targetType = params.targetType || current.target_type;
    const targetValue = params.targetValue !== undefined ? params.targetValue : current.target_value;
    const period = params.period || current.period;
    const isActive = params.isActive !== undefined ? params.isActive : current.is_active;

    if (!['study_time_minutes', 'quizzes_completed', 'flashcards_reviewed', 'documents_read'].includes(targetType)) {
      throw new AppError('Loại mục tiêu không hợp lệ', 400);
    }

    if (targetValue <= 0) {
      throw new AppError('Chỉ tiêu mục tiêu phải lớn hơn 0', 400);
    }

    const updateRes = await db.query(
      `UPDATE learning_goals
       SET title = $1, subject = $2, target_type = $3, target_value = $4, period = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, subject, targetType, targetValue, period, isActive, goalId, userId]
    );

    return updateRes.rows[0];
  }

  /**
   * Xóa mục tiêu học tập
   */
  async deleteGoal(userId: number, goalId: number) {
    const res = await db.query(
      `DELETE FROM learning_goals WHERE id = $1 AND user_id = $2 RETURNING id`,
      [goalId, userId]
    );

    if (res.rows.length === 0) {
      throw new AppError('Không tìm thấy mục tiêu hoặc bạn không có quyền', 404);
    }

    return { success: true, id: goalId };
  }
}

export const learningGoalService = new LearningGoalService();
