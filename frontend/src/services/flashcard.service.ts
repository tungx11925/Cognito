import { apiFetch } from './api';

export const getDecks = () => apiFetch('/flashcards/decks', {
    method: 'GET'
});

export const getDeckById = (id: number) => apiFetch(`/flashcards/decks/${id}`, {
    method: 'GET'
});

export const getPublicDecks = () => apiFetch('/flashcards/community/decks', {
    method: 'GET'
});

export const createDeck = (name: string, description: string, is_public: boolean = false) => apiFetch('/flashcards/decks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, is_public })
});

export const updateDeck = (id: number, data: { name?: string, description?: string, is_public?: boolean }) => apiFetch(`/flashcards/decks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

export const deleteDeck = (id: number) => apiFetch(`/flashcards/decks/${id}`, {
    method: 'DELETE'
});

export const getDueFlashcards = (deckId: number) => apiFetch(`/flashcards/decks/${deckId}/review`, {
    method: 'GET'
});

export const getAllFlashcards = (deckId: number) => apiFetch(`/flashcards/decks/${deckId}/cards`, {
    method: 'GET'
});

export const createFlashcard = (deck_id: number, front: string, back: string, document_id?: number) => apiFetch('/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deck_id, front, back, document_id })
});

export const updateFlashcard = (id: number, front: string, back: string) => apiFetch(`/flashcards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ front, back })
});

export const deleteFlashcard = (id: number) => apiFetch(`/flashcards/${id}`, {
    method: 'DELETE'
});

export const reviewFlashcard = (id: number, difficulty: 'again' | 'hard' | 'good' | 'easy') => apiFetch(`/flashcards/review/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty })
});

export const toggleStarFlashcard = (id: number, is_starred: boolean) => apiFetch(`/flashcards/${id}/star`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_starred })
});

export const forkDeck = (deckId: number) => apiFetch(`/flashcards/decks/${deckId}/fork`, {
    method: 'POST'
});

export const getMatchLeaderboard = (deckId: number) => apiFetch(`/flashcards/decks/${deckId}/match-leaderboard`, {
    method: 'GET'
});

export const postMatchLeaderboard = (deckId: number, time_ms: number) => apiFetch(`/flashcards/decks/${deckId}/match-leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time_ms })
});

/**
 * Sinh Flashcard tự động từ tài liệu bằng AI (Hỗ trợ .pdf, .docx, .txt, .xlsx, .csv)
 */
export const generateFlashcardsFromFile = async (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return apiFetch('/flashcards/generate-from-file', {
        method: 'POST',
        body: formData,
    });
};

export const getDeckStudySettings = (deckId: number) => apiFetch(`/flashcards/decks/${deckId}/settings`, {
    method: 'GET'
});

export const saveDeckStudySettings = (deckId: number, settings: {
    shuffle_cards?: boolean;
    front_display?: 'term' | 'definition';
    starred_only?: boolean;
    difficult_only?: boolean;
    auto_tts?: boolean;
}) => apiFetch(`/flashcards/decks/${deckId}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
});

export const uploadFlashcardImage = async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    return apiFetch('/flashcards/upload-image', {
        method: 'POST',
        body: formData,
    });
};

export const createDeckWithBatch = (deckData: {
    name: string;
    description?: string;
    category?: string;
    visibility?: 'private' | 'link' | 'public';
    is_public?: boolean;
    cards: Array<{
        front: string;
        back: string;
        position?: number;
        term_image_url?: string | null;
        definition_image_url?: string | null;
    }>;
}) => apiFetch('/flashcards/decks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deckData)
});

export const updateDeckWithBatch = (deckId: number, deckData: {
    name?: string;
    description?: string;
    category?: string;
    visibility?: 'private' | 'link' | 'public';
    is_public?: boolean;
    cards?: Array<{
        id?: number;
        front: string;
        back: string;
        position?: number;
        term_image_url?: string | null;
        definition_image_url?: string | null;
    }>;
}) => apiFetch(`/flashcards/decks/${deckId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deckData)
});

