const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

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
    const res = await fetch(`${API_BASE_URL}/progress/summary`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Không thể tải dữ liệu tiến độ học tập');
    }
    return res.json();
  },

  async getStreak(): Promise<StreakData> {
    const res = await fetch(`${API_BASE_URL}/progress/streak`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Không thể tải chuỗi ngày học');
    }
    return res.json();
  },

  async listActivities(params: { limit?: number; offset?: number; activityType?: string; subject?: string } = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    if (params.activityType) query.append('activity_type', params.activityType);
    if (params.subject) query.append('subject', params.subject);

    const res = await fetch(`${API_BASE_URL}/learning-activities?${query.toString()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Không thể tải nhật ký hoạt động');
    }
    return res.json();
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
    const res = await fetch(`${API_BASE_URL}/learning-activities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể ghi nhận hoạt động học');
    }
    return res.json();
  },

  async listGoals(): Promise<LearningGoal[]> {
    const res = await fetch(`${API_BASE_URL}/learning-goals`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Không thể tải mục tiêu học tập');
    }
    return res.json();
  },

  async createGoal(data: {
    title: string;
    subject?: string;
    target_type: 'study_time_minutes' | 'quizzes_completed' | 'flashcards_reviewed' | 'documents_read';
    target_value: number;
    period?: 'daily' | 'weekly';
  }): Promise<LearningGoal> {
    const res = await fetch(`${API_BASE_URL}/learning-goals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể tạo mục tiêu');
    }
    return res.json();
  },

  async updateGoal(id: number, data: Partial<LearningGoal>): Promise<LearningGoal> {
    const res = await fetch(`${API_BASE_URL}/learning-goals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể cập nhật mục tiêu');
    }
    return res.json();
  },

  async deleteGoal(id: number): Promise<{ success: boolean; id: number }> {
    const res = await fetch(`${API_BASE_URL}/learning-goals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể xóa mục tiêu');
    }
    return res.json();
  },
};
