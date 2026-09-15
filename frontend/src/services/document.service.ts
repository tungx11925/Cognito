import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Upload a document file to the backend (→ Cloudinary).
 * Uses XHR in the modal component for progress tracking;
 * this helper is kept for simple use-cases without progress.
 */
export const uploadDocument = (formData: FormData) => apiFetch('/documents/upload', {
    method: 'POST',
    headers: { ...getAuthHeaders() }, // No Content-Type — browser sets multipart boundary
    body: formData,
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

/** Trạng thái pipeline xử lý tài liệu: UPLOADING → PROCESSING → INDEXING → READY/FAILED */
export interface DocumentProcessingStatus {
    id: number;
    status: 'UPLOADING' | 'PROCESSING' | 'INDEXING' | 'READY' | 'FAILED';
    processing_error?: string | null;
    processed_at?: string | null;
    chunk_count?: number;
}

export const getDocumentStatus = (id: string | number) => apiFetch(`/documents/${id}/status`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
});

export const reprocessDocument = (id: string | number) => apiFetch(`/documents/${id}/reprocess`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
});

export const deleteDocument = (id: string | number) => apiFetch(`/documents/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
});
