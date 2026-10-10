import { db } from '../db';
import { getVietnamDateString } from '../utils/date.util';
import { AppError } from '../utils/AppError';

export interface LogActivityParams {
  activityType: 'read_doc' | 'take_quiz' | 'study_flashcards' | 'focus_session' | 'create_note' | 'question_practice' | 'community_study' | string;
  entityType?: 'document' | 'test_set' | 'deck' | 'flashcard' | 'session' | 'note' | string;
  entityId?: number | null;
  durationSeconds?: number;
  subject?: string | null;
  details?: Record<string, any>;
  idempotencyKey?: string | null;
  createdAt?: Date;
}

export class LearningActivityService {
  /**
   * Ghi nhận hoạt động học tập thực tế (Idempotent).
   * Nếu có idempotencyKey đã tồn tại -> Trả về bản ghi cũ, isNew = false, không ghi trùng lặp.
   */
  async logActivity(userId: number, params: LogActivityParams) {
    const {
      activityType,
      entityType = null,
      entityId = null,
      durationSeconds = 0,
      subject = null,
      details = {},
      idempotencyKey = null,
      createdAt,
    } = params;

    // Chặn khai khống thời gian (> 4 giờ cho 1 hoạt động đơn lẻ)
    if (durationSeconds < 0 || durationSeconds > 14400) {
      throw new AppError('Thời lượng hoạt động không hợp lệ hoặc vượt quá giới hạn tối đa 4 giờ (14400 giây)', 400);
    }

    // Chặn khai khống phiên tập trung hoặc bài thi từ client trực tiếp
    if (activityType === 'focus_session' && !idempotencyKey?.startsWith('focus_session:')) {
      throw new AppError('Hoạt động phiên tập trung (focus_session) chỉ được ghi nhận thông qua Focus Engine (/api/focus)', 403);
    }
    if (activityType === 'take_quiz' && !idempotencyKey?.startsWith('quiz_attempt:')) {
      throw new AppError('Hoạt động làm bài thi (take_quiz) chỉ được ghi nhận thông qua nộp bài kiểm tra (/api/quizzes/submit)', 403);
    }

    const insertRes = await db.query(
      `INSERT INTO learning_activities (
         user_id, activity_type, entity_type, entity_id, duration_seconds, subject, details, idempotency_key, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP))
       ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
       RETURNING *`,
      [
        userId,
        activityType,
        entityType,
        entityId,
        Math.max(0, Math.round(durationSeconds)),
        subject,
        JSON.stringify(details),
        idempotencyKey,
        createdAt ? new Date(createdAt) : null,
      ]
    );

    if (insertRes.rows.length === 0 && idempotencyKey) {
      // Đã tồn tại bản ghi với idempotencyKey này
      const existingRes = await db.query(
        'SELECT * FROM learning_activities WHERE user_id = $1 AND idempotency_key = $2',
        [userId, idempotencyKey]
      );
      return { activity: existingRes.rows[0], isNew: false };
    }

    const activity = insertRes.rows[0];

    // Cập nhật ngày học vào user_study_dates theo múi giờ Việt Nam UTC+7
    try {
      await db.query(
        `INSERT INTO user_study_dates (user_id, study_date)
         VALUES ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)
         ON CONFLICT (user_id, study_date) DO NOTHING`,
        [userId]
      );

      // Nếu có thời gian học, cập nhật user_daily_activity
      if (durationSeconds > 0) {
        const todayStr = getVietnamDateString(new Date());
        await db.query(
          `INSERT INTO user_daily_activity (user_id, activity_date, active_seconds)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, activity_date)
           DO UPDATE SET active_seconds = user_daily_activity.active_seconds + $3`,
          [userId, todayStr, Math.round(durationSeconds)]
        );
      }
    } catch (syncErr) {
      console.warn('Sync activity side-effects non-fatal error:', syncErr);
    }

    return { activity, isNew: true };
  }

  /**
   * Lấy danh sách lịch sử hoạt động học tập có phân trang và lọc
   */
  async listActivities(
    userId: number,
    options: {
      limit?: number;
      offset?: number;
      activityType?: string;
      subject?: string;
    } = {}
  ) {
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = Math.max(0, options.offset || 0);

    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];

    if (options.activityType) {
      values.push(options.activityType);
      conditions.push(`activity_type = $${values.length}`);
    }

    if (options.subject) {
      values.push(`%${options.subject}%`);
      conditions.push(`(subject ILIKE $${values.length} OR details->>'subject' ILIKE $${values.length})`);
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await db.query(
      `SELECT COUNT(*) as total FROM learning_activities WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const listRes = await db.query(
      `SELECT * FROM learning_activities 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return {
      activities: listRes.rows,
      total,
      limit,
      offset,
    };
  }
}

export const learningActivityService = new LearningActivityService();
