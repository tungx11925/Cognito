import { db } from '../db';

export class StudyService {
  async getStats(userId: number) {
    const [
      totalTimeResult,
      sessionsCountResult,
      documentCountResult,
      flashcardsCountResult,
      userRes,
      totalReviewsResult,
      totalNotesResult,
      chartResult
    ] = await Promise.all([
      db.query('SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds FROM study_sessions WHERE user_id = $1', [userId]),
      db.query('SELECT COUNT(*) as count FROM study_sessions WHERE user_id = $1', [userId]),
      db.query('SELECT COUNT(*) as count FROM documents WHERE user_id = $1', [userId]),
      db.query(`SELECT COUNT(*) as count FROM flashcards f JOIN flashcard_decks d ON f.deck_id = d.id WHERE d.user_id = $1`, [userId]),
      db.query('SELECT streak FROM users WHERE id = $1', [userId]),
      db.query(`SELECT COALESCE(SUM(repetitions), 0) as count FROM flashcards f JOIN flashcard_decks d ON f.deck_id = d.id WHERE d.user_id = $1`, [userId]),
      db.query('SELECT COUNT(*) as count FROM notes WHERE user_id = $1', [userId]),
      db.query(`
        WITH days AS (
          SELECT generate_series(
            (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - INTERVAL '6 days',
            (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
            INTERVAL '1 day'
          )::date AS day
        )
        SELECT
          d.day,
          COALESCE(uda.active_seconds, 0) as active_seconds,
          EXTRACT(DOW FROM d.day)::int as dow
        FROM days d
        LEFT JOIN user_daily_activity uda
          ON uda.activity_date = d.day AND uda.user_id = $1
        ORDER BY d.day ASC
      `, [userId])
    ]);

    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const chartData = chartResult.rows.map((row: any) => ({
      day: dayNames[row.dow],
      minutes: Math.round(Number(row.active_seconds) / 60)
    }));

    return {
      total_study_minutes: Math.round(Number(totalTimeResult.rows[0].total_seconds) / 60),
      total_sessions: Number(sessionsCountResult.rows[0].count),
      total_documents: Number(documentCountResult.rows[0].count),
      total_flashcards: Number(flashcardsCountResult.rows[0].count),
      streak: userRes.rows[0]?.streak || 0,
      total_reviews: Number(totalReviewsResult.rows[0].count),
      total_notes: Number(totalNotesResult.rows[0].count),
      chart_data: chartData
    };
  }

  async activePing(userId: number, seconds: number) {
    const d = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

    const result = await db.query(
      `INSERT INTO user_daily_activity (user_id, activity_date, active_seconds)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, activity_date)
       DO UPDATE SET active_seconds = user_daily_activity.active_seconds + $3
       RETURNING active_seconds`,
      [userId, dateStr, seconds]
    );

    return result.rows[0].active_seconds;
  }

  async createStudySession(userId: number, documentId: number, durationSeconds: number) {
    const result = await db.query(
      'INSERT INTO study_sessions (user_id, document_id, duration_seconds) VALUES ($1, $2, $3) RETURNING *',
      [userId, documentId, durationSeconds]
    );
    return result.rows[0];
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
