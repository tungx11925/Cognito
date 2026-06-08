import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const uploadDocument = (formData: FormData) => apiFetch('/documents/upload', {
    method: 'POST',
    headers: { ...getAuthHeaders() }, // Do NOT set Content-Type, browser sets multipart boundary automatically
    body: formData
});

export const getDocuments = (search?: string, category?: string) => {
    let url = '/documents?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    
    return apiFetch(url, {
        method: 'GET',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    });
};

export const getDocumentById = (id: string | number) => apiFetch(`/documents/${id}`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
});
