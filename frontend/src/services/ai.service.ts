import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const chatWithAI = (document_id: number, message: string, history?: any[]) => apiFetch('/ai/chat', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id, message, history })
});

export const generateQuiz = (document_id: number) => apiFetch('/ai/generate-quiz', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id })
});

export const generateFlashcards = (document_id: number, deck_id?: number) => apiFetch('/ai/generate-flashcards', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id, deck_id })
});
