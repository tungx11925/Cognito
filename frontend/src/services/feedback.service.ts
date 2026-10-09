import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export interface FeedbackSubmission {
  rating: number;
  category: string;
  comment: string;
  user_name?: string;
  user_email?: string;
  page_url?: string;
}

export interface FeedbackItem {
  id: number;
  user_id?: number | null;
  user_name: string;
  user_email?: string | null;
  rating: number;
  category: string;
  comment: string;
  page_url?: string | null;
  created_at: string;
  account_username?: string | null;
  avatar_url?: string | null;
}

export interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  satisfactionRate: number;
  distribution: Record<number, number>;
  categoryCounts: Record<string, number>;
}

// User submits feedback
export const submitFeedback = async (data: FeedbackSubmission) => {
  const res = await apiFetch('/feedback', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (res && res.error) {
    throw new Error(res.error);
  }
  return res;
};

// Admin gets all feedbacks and analytics
export const getAdminFeedbacks = async (): Promise<{ success: boolean; stats: FeedbackStats; feedbacks: FeedbackItem[] }> => {
  const res = await apiFetch('/admin/feedbacks', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (res && res.error) {
    throw new Error(res.error);
  }
  return res;
};

// Admin deletes a feedback
export const deleteAdminFeedback = async (id: number) => {
  const res = await apiFetch(`/admin/feedbacks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (res && res.error) {
    throw new Error(res.error);
  }
  return res;
};
