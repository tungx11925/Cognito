import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export interface NoteItem {
  id: number;
  user_id: number;
  document_id: number | null;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  document_title?: string | null;
}

export const getNotes = (params?: { q?: string; document_id?: number }): Promise<{ success: boolean; notes: NoteItem[] }> => {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.append('q', params.q);
  if (params?.document_id) searchParams.append('document_id', params.document_id.toString());
  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiFetch(`/notes${queryStr}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

export const getNotesByDocument = (docId: string | number): Promise<NoteItem[]> =>
  apiFetch(`/notes/document/${docId}`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
  });

export const getNoteById = (id: number): Promise<{ success: boolean; note: NoteItem }> =>
  apiFetch(`/notes/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

export const createNote = (data: { document_id?: number | null; title?: string; content: string }): Promise<{ success: boolean; note: NoteItem }> =>
  apiFetch('/notes', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const saveNote = (data: { document_id?: number | null; title?: string; content: string }): Promise<{ success: boolean; note: NoteItem }> =>
  createNote(data);

export const updateNote = (id: number, data: { title?: string; content?: string; document_id?: number | null }): Promise<{ success: boolean; note: NoteItem }> =>
  apiFetch(`/notes/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const deleteNote = (id: number): Promise<{ success: boolean; message: string; id: number }> =>
  apiFetch(`/notes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
