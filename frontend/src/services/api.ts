const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiFetch = async (url: string, options?: RequestInit) => {
    const headers = new Headers(options?.headers || {});
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }
    const res = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
    });
    return res.json();
};

