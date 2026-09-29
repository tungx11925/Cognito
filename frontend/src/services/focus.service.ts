const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface FocusSession {
  id: number;
  user_id: number;
  document_id: number | null;
  quiz_id: number | null;
  learning_goal_id: number | null;
  target_duration_seconds: number;
  actual_duration_seconds: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'INTERRUPTED' | 'CANCELLED';
  started_at: string;
  ended_at: string | null;
  distraction_count: number;
  focus_score: number;
  interrupt_token?: string;
  document_title?: string;
  quiz_title?: string;
}

export interface FocusSummary {
  sessionId: number;
  status: 'COMPLETED' | 'INTERRUPTED' | 'CANCELLED';
  targetDurationSeconds: number;
  actualFocusSeconds: number;
  actualFocusMinutes: number;
  distractionCount: number;
  focusScore: number;
  streak?: number;
  documentId?: number | null;
  quizId?: number | null;
  learningGoalId?: number | null;
  documentTitle?: string;
  quizTitle?: string;
}

export const focusService = {
  async startSession(params: {
    target_duration_seconds?: number;
    document_id?: number | null;
    quiz_id?: number | null;
    learning_goal_id?: number | null;
  }): Promise<FocusSession> {
    const res = await fetch(`${API_BASE_URL}/focus/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi bắt đầu phiên tập trung');
    return data;
  },

  async getActiveSession(): Promise<{ activeSession: FocusSession | null }> {
    const res = await fetch(`${API_BASE_URL}/focus/active`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi lấy phiên đang chạy');
    return data;
  },

  async recordDistraction(
    id: number,
    params: {
      event_type: 'TAB_SWITCH' | 'PAGE_BLUR' | 'PAGE_HIDDEN' | 'IDLE' | 'RETURNED';
      duration_seconds?: number;
      details?: Record<string, any>;
    }
  ): Promise<{ sessionId: number; eventType: string; distractionCount: number }> {
    const res = await fetch(`${API_BASE_URL}/focus/${id}/distraction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi ghi nhận xao nhãng');
    return data;
  },

  async pingActive(id: number, seconds: number): Promise<{ active_seconds: number; status: string }> {
    const res = await fetch(`${API_BASE_URL}/focus/${id}/ping`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ seconds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi ping thời gian');
    return data;
  },

  async finishSession(
    id: number,
    params: {
      status: 'COMPLETED' | 'INTERRUPTED' | 'CANCELLED';
      actual_duration_seconds: number;
    }
  ): Promise<{ session: FocusSession; summary: FocusSummary }> {
    const res = await fetch(`${API_BASE_URL}/focus/${id}/finish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi kết thúc phiên tập trung');
    return data;
  },

  async interruptSession(
    id: number,
    actualDurationSeconds?: number
  ): Promise<{ session: FocusSession; summary: FocusSummary }> {
    const res = await fetch(`${API_BASE_URL}/focus/${id}/interrupt`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ actual_duration_seconds: actualDurationSeconds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi ngắt phiên tập trung');
    return data;
  },

  async getSessionSummary(id: number): Promise<{
    session: FocusSession;
    events: any[];
    summary: FocusSummary;
  }> {
    const res = await fetch(`${API_BASE_URL}/focus/${id}/summary`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải báo cáo phiên tập trung');
    return data;
  },
};
