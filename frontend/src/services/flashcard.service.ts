import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const getDecks = () => apiFetch('/flashcards/decks', {
    method: 'GET',
    headers: getAuthHeaders()
});

export const createDeck = (name: string, description: string) => apiFetch('/flashcards/decks', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
});

export const getDueFlashcards = (deckId: number) => apiFetch(`/flashcards/decks/${deckId}/review`, {
    method: 'GET',
    headers: getAuthHeaders()
});

export const getAllFlashcards = (deckId: number) => apiFetch(`/flashcards/decks/${deckId}/cards`, {
    method: 'GET',
    headers: getAuthHeaders()
});

export const createFlashcard = (deck_id: number, front: string, back: string, document_id?: number) => apiFetch('/flashcards', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ deck_id, front, back, document_id })
});

export const reviewFlashcard = (id: number, difficulty: 'again' | 'hard' | 'good' | 'easy') => apiFetch(`/flashcards/review/${id}`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty })
});
