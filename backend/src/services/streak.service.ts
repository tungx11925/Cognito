import { db } from '../db';
import { getVietnamDateString } from '../utils/date.util';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  studiedToday: boolean;
  studyDates: string[];
}

export class StreakService {
  /**
   * Tính toán chuỗi ngày học liên tiếp (Single Source of Truth)
   * Tuyệt đối không đọc trường streak trong bảng users.
   * Dữ liệu hợp nhất từ learning_activities thật và user_study_dates theo múi giờ Asia/Ho_Chi_Minh (UTC+7).
   */
  async calculateUserStreak(userId: number): Promise<StreakInfo> {
    const datesRes = await db.query(
      `SELECT DISTINCT study_date::text AS study_date FROM (
         SELECT study_date FROM user_study_dates WHERE user_id = $1
         UNION
         SELECT (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS study_date 
         FROM learning_activities WHERE user_id = $1
       ) all_dates 
       ORDER BY study_date DESC`,
      [userId]
    );

    const dates: string[] = datesRes.rows.map(r => {
      if (typeof r.study_date === 'string') {
        return r.study_date.split('T')[0];
      }
      const d = new Date(r.study_date);
      return getVietnamDateString(d);
    });

    const now = new Date();
    const todayStr = getVietnamDateString(now);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getVietnamDateString(yesterday);

    const studiedToday = dates.includes(todayStr);

    let currentStreak = 0;
    let checkDate: Date | null = null;

    if (studiedToday) {
      checkDate = new Date(now);
    } else if (dates.includes(yesterdayStr)) {
      checkDate = new Date(yesterday);
    }

    if (checkDate) {
      while (true) {
        const checkStr = getVietnamDateString(checkDate);
        if (dates.includes(checkStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Tính toán chuỗi học dài nhất (longest streak) trong toàn bộ lịch sử
    let longest = 0;
    let temp = 0;
    let prevDate: Date | null = null;
    const sortedAsc = [...dates].sort();

    for (const dStr of sortedAsc) {
      const [y, m, d] = dStr.split('-').map(Number);
      const cur = new Date(Date.UTC(y, m - 1, d));
      if (!prevDate) {
        temp = 1;
      } else {
        const diffDays = Math.round((cur.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          temp++;
        } else if (diffDays > 1) {
          temp = 1;
        }
      }
      if (temp > longest) longest = temp;
      prevDate = cur;
    }

    const longestStreak = Math.max(longest, currentStreak);

    return {
      currentStreak,
      longestStreak,
      studiedToday,
      studyDates: dates,
    };
  }
}

export const streakService = new StreakService();
