import { db } from '../db';
import { streakService } from './streak.service';
import { learningGoalService } from './learning-goal.service';

export class ProgressService {
  /**
   * Báo cáo thống kê tiến độ học tập tổng hợp từ dữ liệu thật 100%.
   * Tuyệt đối không chứa số liệu giả, hardcode hoặc fake data.
   */
  async getProgressSummary(userId: number) {
    const [
      streakData,
      goals,
      timeRes,
      quizzesRes,
      flashcardsRes,
      documentsRes,
      notesRes,
      chartRes,
      recentRes,
    ] = await Promise.all([
      streakService.calculateUserStreak(userId),
      learningGoalService.listGoals(userId),
      db.query(
        `SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds, COUNT(*) as total_activities 
         FROM learning_activities WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*) as count 
         FROM learning_activities 
         WHERE user_id = $1 AND activity_type = 'take_quiz'`,
        [userId]
      ),
      db.query(
        `SELECT COALESCE(SUM(repetitions), 0) as count 
         FROM flashcards f 
         JOIN flashcard_decks d ON f.deck_id = d.id 
         WHERE d.user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*) as count FROM documents WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*) as count FROM notes WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `WITH days AS (
           SELECT generate_series(
             (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - INTERVAL '6 days',
             (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
             INTERVAL '1 day'
           )::date AS day
         )
         SELECT
           d.day::text as day_str,
           COALESCE(SUM(la.duration_seconds), 0) as total_seconds,
           COUNT(la.id) FILTER (WHERE la.activity_type = 'take_quiz') as quizzes_count,
           COUNT(la.id) as activities_count,
           EXTRACT(DOW FROM d.day)::int as dow
         FROM days d
         LEFT JOIN learning_activities la
           ON (la.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = d.day AND la.user_id = $1
         GROUP BY d.day
         ORDER BY d.day ASC`,
        [userId]
      ),
      db.query(
        `SELECT * FROM learning_activities 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      ),
    ]);

    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const weeklyChart = chartRes.rows.map((row: any) => ({
      date: row.day_str,
      day: dayNames[row.dow],
      minutes: Math.round(Number(row.total_seconds) / 60),
      quizzes_count: Number(row.quizzes_count || 0),
      activities_count: Number(row.activities_count || 0),
    }));

    return {
      streak: streakData,
      daily_goals: goals,
      total_study_minutes: Math.round(Number(timeRes.rows[0]?.total_seconds || 0) / 60),
      total_activities: Number(timeRes.rows[0]?.total_activities || 0),
      total_quizzes_completed: Number(quizzesRes.rows[0]?.count || 0),
      total_flashcards_reviewed: Number(flashcardsRes.rows[0]?.count || 0),
      total_documents_read: Number(documentsRes.rows[0]?.count || 0),
      total_notes: Number(notesRes.rows[0]?.count || 0),
      weekly_chart: weeklyChart,
      recent_activities: recentRes.rows,
    };
  }
}

export const progressService = new ProgressService();
