import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const authJson = () => ({ ...getAuthHeaders(), ...JSON_HEADERS });

// ── Config ──────────────────────────────────────────
export const getAIConfig = (configKey: string) =>
  apiFetch(`/api/ai-configs/${encodeURIComponent(configKey)}`, { headers: getAuthHeaders() });

export const updateAIConfig = (configKey: string, data: Record<string, any>) =>
  apiFetch(`/api/ai-configs/${encodeURIComponent(configKey)}`, {
    method: 'PUT',
    headers: authJson(),
    body: JSON.stringify(data),
  });

// ── User Resources ───────────────────────────────────
export const getMyDocuments = () =>
  apiFetch('/api/ai-test/my-documents', { headers: getAuthHeaders() });

export const getMyDecks = () =>
  apiFetch('/api/ai-test/my-decks', { headers: getAuthHeaders() });

export const getDeckContent = (deckId: number) =>
  apiFetch(`/api/ai-test/deck-content/${deckId}`, { headers: getAuthHeaders() });

export const getDocumentContent = (docId: number) =>
  apiFetch(`/api/ai-test/document-content/${docId}`, { headers: getAuthHeaders() });

// ── Test Sets ────────────────────────────────────────
export const getTestSets = () =>
  apiFetch('/api/test-sets', { headers: getAuthHeaders() });

export const generateTestSet = (payload: {
  configKey: string;
  documentContent: string;
  name?: string;
}) =>
  apiFetch('/api/test-sets/generate', {
    method: 'POST',
    headers: authJson(),
    body: JSON.stringify(payload),
  });

export const toggleTestSetStatus = (id: number, is_active: boolean) =>
  apiFetch(`/api/test-sets/${id}/status`, {
    method: 'PATCH',
    headers: authJson(),
    body: JSON.stringify({ is_active }),
  });

export const deleteTestSet = (id: number) =>
  apiFetch(`/api/test-sets/${id}`, { method: 'DELETE', headers: getAuthHeaders() });

// ── Questions ────────────────────────────────────────
export const getQuestions = (testSetId: number) =>
  apiFetch(`/api/questions/test-sets/${testSetId}`, { headers: getAuthHeaders() });

export const bulkUpdateQuestions = (questions: any[]) =>
  apiFetch('/api/questions/bulk-update', {
    method: 'PUT',
    headers: authJson(),
    body: JSON.stringify({ questions }),
  });
