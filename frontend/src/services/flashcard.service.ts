import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const getDecks = () => apiFetch('/flashcards/decks', {
    method: 'GET',
    headers: getAuthHeaders()
});

export const getDeckById = (id: number) => apiFetch(`/flashcards/decks/${id}`, {
    method: 'GET',
    headers: getAuthHeaders()
});

export const createDeck = (name: string, description: string, is_public: boolean = false) => apiFetch('/flashcards/decks', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, is_public })
});

export const updateDeck = (id: number, data: { name?: string, description?: string, is_public?: boolean }) => apiFetch(`/flashcards/decks/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

export const deleteDeck = (id: number) => apiFetch(`/flashcards/decks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
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

export const updateFlashcard = (id: number, front: string, back: string) => apiFetch(`/flashcards/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ front, back })
});

export const deleteFlashcard = (id: number) => apiFetch(`/flashcards/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
});

export const reviewFlashcard = (id: number, difficulty: 'again' | 'hard' | 'good' | 'easy') => apiFetch(`/flashcards/review/${id}`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty })
});

export const generateFlashcardsFromNote = (note_content: string, deck_id?: number, document_id?: number) => apiFetch('/ai/generate-flashcards-from-note', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_content, deck_id, document_id })
});
