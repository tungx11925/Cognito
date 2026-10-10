import { apiFetch } from './api';

export const login = (data: any) => apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

export const googleLogin = (token: string) => apiFetch('/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
});

export const register = (data: any) => apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

export const refreshToken = (token?: string) => apiFetch('/auth/refresh', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
});

export const getMe = (token?: string) => apiFetch('/auth/me', {
    method: 'GET',
    headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
});

export const logout = () => apiFetch('/auth/logout', {
    method: 'POST'
});

