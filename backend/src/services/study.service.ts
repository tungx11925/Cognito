import { db } from '../db';
import { getVietnamDateString } from '../utils/date.util';
import { progressService } from './progress.service';

export class StudyService {
  async getStats(userId: number) {
    const summary = await progressService.getProgressSummary(userId);

    return {
      total_study_minutes: summary.total_study_minutes,
      total_sessions: summary.total_activities,
      total_documents: summary.total_documents_read,
      total_flashcards: summary.total_flashcards_reviewed,
      streak: summary.streak.currentStreak,
      total_reviews: summary.total_flashcards_reviewed,
      total_notes: summary.total_notes,
      chart_data: summary.weekly_chart.map((c: any) => ({
        day: c.day,
        minutes: c.minutes,
      })),
      goals: summary.daily_goals,
      recent_activities: summary.recent_activities,
      streak_details: summary.streak,
    };
  }

  async activePing(userId: number, seconds: number) {
    // Determine VN timezone date (UTC+7)
    const dateStr = getVietnamDateString(new Date());

    const result = await db.query(
      `INSERT INTO user_daily_activity (user_id, activity_date, active_seconds)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, activity_date)
       DO UPDATE SET active_seconds = user_daily_activity.active_seconds + $3
       RETURNING active_seconds`,
      [userId, dateStr, seconds]
    );

    await db.query(
      `INSERT INTO user_study_dates (user_id, study_date)
       VALUES ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)
       ON CONFLICT (user_id, study_date) DO NOTHING`,
      [userId]
    );

    return result.rows[0].active_seconds;
  }

  async createStudySession(userId: number, documentId: number, durationSeconds: number) {
    // 1. Kiểm tra xem người dùng có đang có phiên Focus nào đang chạy cho tài liệu này không
    // Nếu có, thời lượng được quản lý bởi Focus Session, không tạo phiên read_doc độc lập trùng lặp
    const activeFocus = await db.query(
      `SELECT id FROM study_sessions 
       WHERE user_id = $1 AND document_id = $2 AND status = 'IN_PROGRESS' 
       ORDER BY started_at DESC LIMIT 1`,
      [userId, documentId]
    );
    if (activeFocus.rows.length > 0) {
      return activeFocus.rows[0];
    }

    const result = await db.query(
      'INSERT INTO study_sessions (user_id, document_id, duration_seconds) VALUES ($1, $2, $3) RETURNING *',
      [userId, documentId, durationSeconds]
    );
    const session = result.rows[0];

    try {
      await db.query(
        `INSERT INTO learning_activities (user_id, activity_type, entity_type, entity_id, duration_seconds, details, idempotency_key)
         VALUES ($1, 'read_doc', 'document', $2, $3, $4, $5)
         ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING`,
        [userId, documentId, durationSeconds, JSON.stringify({ sessionId: session.id }), `study_session:${session.id}`]
      );

      await db.query(
        `INSERT INTO user_study_dates (user_id, study_date)
         VALUES ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)
         ON CONFLICT (user_id, study_date) DO NOTHING`,
        [userId]
      );
    } catch (actErr) {
      console.warn('Session activity log non-fatal error:', actErr);
    }

    return session;
  }

  async getNotesByDocument(userId: number, documentId: number) {
    const docCheck = await db.query('SELECT id FROM documents WHERE id = $1 AND user_id = $2', [documentId, userId]);
    if (docCheck.rows.length === 0) return null;

    const result = await db.query(
      'SELECT * FROM notes WHERE document_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [documentId, userId]
    );
    return result.rows;
  }

  async upsertNote(userId: number, documentId: number, title: string, content: string) {
    const docCheck = await db.query('SELECT id FROM documents WHERE id = $1 AND user_id = $2', [documentId, userId]);
    if (docCheck.rows.length === 0) throw new Error('Access denied');
    
    const checkExist = await db.query(
      'SELECT id FROM notes WHERE user_id = $1 AND document_id = $2',
      [userId, documentId]
    );

    let result;
    if (checkExist.rows.length > 0) {
      result = await db.query(
        'UPDATE notes SET title = $1, content = $2, created_at = current_timestamp WHERE id = $3 RETURNING *',
        [title || 'Ghi chú học tập', content, checkExist.rows[0].id]
      );
    } else {
      result = await db.query(
        'INSERT INTO notes (user_id, document_id, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, documentId, title || 'Ghi chú học tập', content]
      );
    }
    return result.rows[0];
  }
}

export const studyService = new StudyService();
