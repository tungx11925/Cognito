import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const chatWithAI = (
    document_id?: number | null, 
    message: string = '', 
    history?: any[], 
    images?: string[] | string,
    context_mode?: 'GENERAL' | 'DOCUMENT_CONTEXT'
) => {
    const imagesPayload = Array.isArray(images) ? images : (images ? [images] : []);
    return apiFetch('/ai/chat', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            document_id: document_id || undefined, 
            message, 
            history, 
            images: imagesPayload,
            image: imagesPayload[0] || undefined,
            context_mode: context_mode || (document_id ? 'DOCUMENT_CONTEXT' : 'GENERAL'),
        })
    });
};

export const generateQuiz = (document_id: number) => apiFetch('/ai/generate-quiz', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id })
});

export const generateMindmap = (document_id: number, force_regenerate?: boolean) => apiFetch('/ai/generate-mindmap', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id, force_regenerate })
});

export const getCachedMindmap = (document_id: number) => apiFetch(`/ai/mindmap/${document_id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
});

