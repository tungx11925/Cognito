import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const getLectures = () => apiFetch('/lectures', {
  method: 'GET',
  headers: getAuthHeaders()
});

export const getLectureById = (id: string | number) => apiFetch(`/lectures/${id}`, {
  method: 'GET',
  headers: getAuthHeaders()
});

export const uploadLecture = async (formData: FormData) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch('/api/lectures/upload', {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData
  });
  return await res.json();
};

export const updateSlide = (lectureId: number, slideId: number, data: any) => apiFetch(`/lectures/${lectureId}/slides/${slideId}`, {
  method: 'PUT',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

export const deleteLecture = (id: number) => apiFetch(`/lectures/${id}`, {
  method: 'DELETE',
  headers: getAuthHeaders()
});
