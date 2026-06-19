import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const getAdminStats = () => apiFetch('/admin/stats', {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});

export const getAdminUsers = (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiFetch(`/admin/users${query}`, {
        method: 'GET',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
};

export const deleteAdminUser = (id: number) => apiFetch(`/admin/users/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});

export const getAdminDocuments = (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiFetch(`/admin/documents${query}`, {
        method: 'GET',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
};

export const deleteAdminDocument = (id: number) => apiFetch(`/admin/documents/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});

export const getAdminTransactions = () => apiFetch('/admin/transactions', {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});

export const createAdminUser = (userData: any) => apiFetch('/admin/users', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
});

export const updateAdminUser = (id: number, userData: any) => apiFetch(`/admin/users/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
});
