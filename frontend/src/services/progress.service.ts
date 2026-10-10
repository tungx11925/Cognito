import { apiFetch } from './api';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  studiedToday: boolean;
  studyDates: string[];
}

export interface LearningGoal {
  id: number;
  user_id: number;
  title: string;
  subject?: string | null;
  target_type: 'study_time_minutes' | 'quizzes_completed' | 'flashcards_reviewed' | 'documents_read';
  target_value: number;
  period: 'daily' | 'weekly';
  is_active: boolean;
  current_value: number;
  progress_percentage: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningActivity {
  id: number;
  user_id: number;
  activity_type: string;
  entity_type?: string | null;
  entity_id?: number | null;
  duration_seconds: number;
  subject?: string | null;
  details: Record<string, any>;
  idempotency_key?: string | null;
  created_at: string;
}

export interface ProgressSummary {
  streak: StreakData;
  daily_goals: LearningGoal[];
  total_study_minutes: number;
  total_activities: number;
  total_quizzes_completed: number;
  total_flashcards_reviewed: number;
  total_documents_read: number;
  total_notes: number;
  weekly_chart: Array<{
    date: string;
    day: string;
    minutes: number;
    quizzes_count: number;
    activities_count: number;
  }>;
  recent_activities: LearningActivity[];
}

export const progressService = {
  async getSummary(): Promise<ProgressSummary> {
    const data = await apiFetch('/progress/summary');
    if (data?.error) {
      throw new Error(data.error || 'Không thể tải dữ liệu tiến độ học tập');
    }
    return data;
  },

  async getStreak(): Promise<StreakData> {
    const data = await apiFetch('/progress/streak');
    if (data?.error) {
      throw new Error(data.error || 'Không thể tải chuỗi ngày học');
    }
    return data;
  },

  async listActivities(params: { limit?: number; offset?: number; activityType?: string; subject?: string } = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    if (params.activityType) query.append('activity_type', params.activityType);
    if (params.subject) query.append('subject', params.subject);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const data = await apiFetch(`/learning-activities${queryString}`);
    if (data?.error) {
      throw new Error(data.error || 'Không thể tải nhật ký hoạt động');
    }
    return data;
  },

  async logActivity(data: {
    activity_type: string;
    entity_type?: string;
    entity_id?: number;
    duration_seconds?: number;
    subject?: string;
    details?: Record<string, any>;
    idempotency_key?: string;
  }) {
    const res = await apiFetch('/learning-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res?.error) {
      throw new Error(res.error || 'Không thể ghi nhận hoạt động học');
    }
    return res;
  },

  async listGoals(): Promise<LearningGoal[]> {
    const data = await apiFetch('/learning-goals');
    if (data?.error) {
      throw new Error(data.error || 'Không thể tải mục tiêu học tập');
    }
    return data;
  },

  async createGoal(data: {
    title: string;
    subject?: string;
    target_type: 'study_time_minutes' | 'quizzes_completed' | 'flashcards_reviewed' | 'documents_read';
    target_value: number;
    period?: 'daily' | 'weekly';
  }): Promise<LearningGoal> {
    const res = await apiFetch('/learning-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res?.error) {
      throw new Error(res.error || 'Không thể tạo mục tiêu');
    }
    return res;
  },

  async updateGoal(id: number, data: Partial<LearningGoal>): Promise<LearningGoal> {
    const res = await apiFetch(`/learning-goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res?.error) {
      throw new Error(res.error || 'Không thể cập nhật mục tiêu');
    }
    return res;
  },

  async deleteGoal(id: number): Promise<{ success: boolean; id: number }> {
    const res = await apiFetch(`/learning-goals/${id}`, {
      method: 'DELETE',
    });
    if (res?.error) {
      throw new Error(res.error || 'Không thể xóa mục tiêu');
    }
    return res;
  },
};
