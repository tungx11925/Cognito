import { apiFetch } from './api';

export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications?: NotificationItem[];
  total?: number;
  unreadCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  error?: string;
}

export interface UnreadCountResponse {
  unreadCount?: number;
  error?: string;
}

export interface NotificationActionResponse {
  success?: boolean;
  notification?: NotificationItem;
  updatedCount?: number;
  message?: string;
  error?: string;
}

export async function getNotifications(params: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
} = {}): Promise<NotificationsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.unreadOnly) query.set('unreadOnly', 'true');

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/notifications${queryString}`);
}

export async function getUnreadNotificationCount(): Promise<UnreadCountResponse> {
  return apiFetch('/notifications/unread-count');
}

export async function markNotificationAsRead(id: number): Promise<NotificationActionResponse> {
  return apiFetch(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead(): Promise<NotificationActionResponse> {
  return apiFetch('/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function deleteNotification(id: number): Promise<NotificationActionResponse> {
  return apiFetch(`/notifications/${id}`, {
    method: 'DELETE',
  });
}

export async function getNotificationStreamTicket(): Promise<{ ticket?: string; error?: string }> {
  return apiFetch('/notifications/stream-ticket', {
    method: 'POST',
  });
}
