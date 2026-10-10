import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export interface MindmapItem {
  id: number;
  user_id: number;
  document_id: number | null;
  title: string;
  mermaid_code: string;
  created_at: string;
  updated_at: string;
  document_title?: string | null;
}

export const getMindmaps = (params?: { q?: string; document_id?: number }): Promise<{ success: boolean; mindmaps: MindmapItem[] }> => {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.append('q', params.q);
  if (params?.document_id) searchParams.append('document_id', params.document_id.toString());
  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiFetch(`/mindmaps${queryStr}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

export const getMindmapsByDocument = (docId: string | number): Promise<MindmapItem[]> =>
  apiFetch(`/mindmaps/document/${docId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

export const getMindmapById = (id: number): Promise<{ success: boolean; mindmap: MindmapItem }> =>
  apiFetch(`/mindmaps/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

export const createMindmap = (data: { document_id?: number | null; title?: string; mermaid_code: string }): Promise<{ success: boolean; mindmap: MindmapItem }> =>
  apiFetch('/mindmaps', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const updateMindmap = (id: number, data: { title?: string; mermaid_code?: string; document_id?: number | null }): Promise<{ success: boolean; mindmap: MindmapItem }> =>
  apiFetch(`/mindmaps/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const deleteMindmap = (id: number): Promise<{ success: boolean; message: string; id: number }> =>
  apiFetch(`/mindmaps/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
