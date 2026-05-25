const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiFetch = async (url: string, options?: RequestInit) => {
    const res = await fetch(`${API_BASE_URL}${url}`, options);
    return res.json();
};
