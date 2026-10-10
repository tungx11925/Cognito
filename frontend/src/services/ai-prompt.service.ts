import { apiFetch } from './api';

export interface PromptTemplateItem {
  id: number;
  user_id: number | null;
  title: string;
  prompt_text: string;
  category: string;
  is_system: boolean;
  created_at: string;
}

export interface PromptHistoryItem {
  id: number;
  user_id: number;
  document_id: number | null;
  prompt_text: string;
  context_mode: 'document' | 'general';
  scope: string;
  is_pinned: boolean;
  created_at: string;
}

export const getPromptTemplates = (): Promise<PromptTemplateItem[]> => {
  return apiFetch('/ai/prompts/templates', { method: 'GET' });
};

export const createPromptTemplate = (data: {
  title: string;
  prompt_text: string;
  category?: string;
}): Promise<PromptTemplateItem> => {
  return apiFetch('/ai/prompts/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const deletePromptTemplate = (id: number): Promise<{ message: string }> => {
  return apiFetch(`/ai/prompts/templates/${id}`, { method: 'DELETE' });
};

export const getPromptHistory = (documentId?: number): Promise<PromptHistoryItem[]> => {
  const query = documentId ? `?document_id=${documentId}` : '';
  return apiFetch(`/ai/prompts/history${query}`, { method: 'GET' });
};

export const addPromptHistory = (data: {
  document_id?: number | null;
  prompt_text: string;
  context_mode?: 'document' | 'general';
  scope?: string;
  is_pinned?: boolean;
}): Promise<PromptHistoryItem> => {
  return apiFetch('/ai/prompts/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const togglePinPromptHistory = (id: number): Promise<PromptHistoryItem> => {
  return apiFetch(`/ai/prompts/history/${id}/pin`, { method: 'PUT' });
};

export const deletePromptHistory = (id: number): Promise<{ message: string }> => {
  return apiFetch(`/ai/prompts/history/${id}`, { method: 'DELETE' });
};
