import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface ChatUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  headline: string | null;
  is_suspended?: boolean;
}

export interface ConversationItem {
  id: number;
  last_message_text: string | null;
  last_message_at: string;
  last_sender_id: number | null;
  unread_count: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
  other_user: ChatUser;
  is_blocked: boolean;
}

export interface MessageItem {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender: {
    id: number;
    name: string;
    avatar_url: string | null;
  };
}

export const getConversations = async (): Promise<{ conversations?: ConversationItem[]; error?: string }> => {
  return apiFetch('/messages/conversations', {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
};

export const startConversation = async (
  recipientId: number
): Promise<{ conversation?: ConversationItem; error?: string }> => {
  return apiFetch('/messages/conversations', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipient_id: recipientId }),
  });
};

export const getConversationDetails = async (
  conversationId: number
): Promise<{ conversation?: ConversationItem; error?: string }> => {
  return apiFetch(`/messages/conversations/${conversationId}`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
};

export const getMessages = async (
  conversationId: number,
  limit: number = 50,
  beforeId?: number
): Promise<{ messages?: MessageItem[]; error?: string }> => {
  let url = `/messages/conversations/${conversationId}/messages?limit=${limit}`;
  if (beforeId) url += `&before_id=${beforeId}`;

  return apiFetch(url, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
};

export const sendMessage = async (
  conversationId: number,
  content: string
): Promise<{ message?: MessageItem; error?: string }> => {
  return apiFetch(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
};

export const markAsRead = async (
  conversationId: number
): Promise<{ success?: boolean; readCount?: number; error?: string }> => {
  return apiFetch(`/messages/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
};

export const getUnreadCount = async (): Promise<{ total_unread?: number; error?: string }> => {
  return apiFetch('/messages/unread-count', {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
};
