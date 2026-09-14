import { db } from '../db';
import { getVietnamDateString } from '../utils/date.util';

class ActivityRepository {
  async logStudyDate(userId: number, dateStr: string) {
    await db.query(
      'INSERT INTO user_study_dates (user_id, study_date) VALUES ($1, $2) ON CONFLICT (user_id, study_date) DO NOTHING',
      [userId, dateStr]
    );
  }

  async getStudyDates(userId: number) {
    const datesRes = await db.query(
      'SELECT study_date FROM user_study_dates WHERE user_id = $1 ORDER BY study_date DESC',
      [userId]
    );
    return datesRes.rows;
  }

  async resetStreak(userId: number) {
    await db.query('UPDATE users SET streak = 0 WHERE id = $1', [userId]);
  }

  async updateStreak(userId: number, streak: number) {
    await db.query(
      'UPDATE users SET streak = $1, last_study_date = CURRENT_TIMESTAMP WHERE id = $2',
      [streak, userId]
    );
  }

  async getDailyTasks(userId: number, dateStr: string) {
    const checkRes = await db.query(
      'SELECT * FROM user_daily_tasks WHERE user_id = $1 AND activity_date = $2',
      [userId, dateStr]
    );
    return checkRes.rows;
  }

  async createDailyTask(userId: number, dateStr: string, task: any) {
    const res = await db.query(
      `INSERT INTO user_daily_tasks (user_id, activity_date, task_type, title, description, target_value, current_value, completed, is_notified)
       VALUES ($1, $2, $3, $4, $5, $6, 0, false, false)
       ON CONFLICT (user_id, activity_date, task_type) DO NOTHING
       RETURNING *`,
      [userId, dateStr, task.type, task.title, task.description, task.target]
    );
    return res.rows[0];
  }

  async incrementTaskProgress(userId: number, dateStr: string, taskType: string, incrementValue: number) {
    const res = await db.query(
      `UPDATE user_daily_tasks
       SET current_value = LEAST(current_value + $1, target_value)
       WHERE user_id = $2 AND activity_date = $3 AND task_type = $4
       RETURNING *`,
      [incrementValue, userId, dateStr, taskType]
    );
    return res.rows[0];
  }

  async markTaskCompleted(taskId: number) {
    const res = await db.query(
      `UPDATE user_daily_tasks
       SET completed = true, is_notified = true
       WHERE id = $1
       RETURNING *`,
      [taskId]
    );
    return res.rows[0];
  }
}

export const activityRepository = new ActivityRepository();
