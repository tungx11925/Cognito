import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Ping backend with accumulated active study seconds (updates daily activity and task progress).
 */
export const pingActiveStudyTime = async (seconds: number) => {
  if (seconds <= 0) return;
  return apiFetch('/study-sessions/active-ping', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ seconds }),
  });
};

/**
 * Record a completed study session in the backend DB (updates streak & study_sessions).
 */
export const createStudySession = async (durationSeconds: number, documentId?: number) => {
  return apiFetch('/study-sessions', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      duration_seconds: durationSeconds,
      ...(documentId ? { document_id: documentId } : {}),
    }),
  });
};
