import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const authJson = () => ({ ...getAuthHeaders(), ...JSON_HEADERS });

// ── Config ──────────────────────────────────────────
export const getAIConfig = (configKey: string) =>
  apiFetch(`/ai-configs/${encodeURIComponent(configKey)}`, { headers: getAuthHeaders() });

export const updateAIConfig = (configKey: string, data: Record<string, any>) =>
  apiFetch(`/ai-configs/${encodeURIComponent(configKey)}`, {
    method: 'PUT',
    headers: authJson(),
    body: JSON.stringify(data),
  });

// ── User Resources ───────────────────────────────────
export const getMyDocuments = () =>
  apiFetch('/ai-test/my-documents', { headers: getAuthHeaders() });

export const getMyDecks = () =>
  apiFetch('/ai-test/my-decks', { headers: getAuthHeaders() });

export const getDeckContent = (deckId: number) =>
  apiFetch(`/ai-test/deck-content/${deckId}`, { headers: getAuthHeaders() });

export const getDocumentContent = (docId: number) =>
  apiFetch(`/ai-test/document-content/${docId}`, { headers: getAuthHeaders() });

// ── Test Sets ────────────────────────────────────────
export const getTestSets = () =>
  apiFetch('/test-sets', { headers: getAuthHeaders() });

export const generateTestSet = (payload: {
  configKey: string;
  documentContent: string;
  name?: string;
}) =>
  apiFetch('/test-sets/generate', {
    method: 'POST',
    headers: authJson(),
    body: JSON.stringify(payload),
  });

export const toggleTestSetStatus = (id: number, is_active: boolean) =>
  apiFetch(`/test-sets/${id}/status`, {
    method: 'PATCH',
    headers: authJson(),
    body: JSON.stringify({ is_active }),
  });

export const deleteTestSet = (id: number) =>
  apiFetch(`/test-sets/${id}`, { method: 'DELETE', headers: getAuthHeaders() });

// ── Questions ────────────────────────────────────────
export const getQuestions = (testSetId: number) =>
  apiFetch(`/questions/test-sets/${testSetId}`, { headers: getAuthHeaders() });

export const bulkUpdateQuestions = (questions: any[]) =>
  apiFetch('/questions/bulk-update', {
    method: 'PUT',
    headers: authJson(),
    body: JSON.stringify({ questions }),
  });

// ── Question Generator (model AI + trọng tâm từ khoá + Preview → Approve) ──
export const getAIModels = () =>
  apiFetch('/ai/models', { headers: getAuthHeaders() });

export const getAITemplates = () =>
  apiFetch('/ai/templates', { headers: getAuthHeaders() });

export const getDocumentKeywords = (docId: number) =>
  apiFetch(`/documents/${docId}/keywords`, { headers: getAuthHeaders() });

export interface GenerateQuestionsPayload {
  sourceIds?: number[];
  textContent?: string;
  focusKeywords?: string[];
  audienceLevel: 'weak' | 'medium' | 'advanced';
  questionType: 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'ESSAY' | 'TRUE_FALSE' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  quantity: number;
  templateId: string;
  modelId?: number;
  customInstruction?: string;
  mode: 'practice' | 'exam';
  name?: string;
  configKey?: string;
}

export const generateQuestions = (payload: GenerateQuestionsPayload) =>
  apiFetch('/questions/generate', {
    method: 'POST',
    headers: authJson(),
    body: JSON.stringify(payload),
  });

export const updateQuestion = (id: number, data: Record<string, any>) =>
  apiFetch(`/questions/${id}`, {
    method: 'PATCH',
    headers: authJson(),
    body: JSON.stringify(data),
  });

export const deleteQuestion = (id: number) =>
  apiFetch(`/questions/${id}`, { method: 'DELETE', headers: getAuthHeaders() });

export const approveTestSet = (testSetId: number) =>
  apiFetch(`/test-sets/${testSetId}/approve`, {
    method: 'POST',
    headers: authJson(),
  });

export const getTestSetDetail = (testSetId: number) =>
  apiFetch(`/test-sets/${testSetId}`, { headers: getAuthHeaders() });

