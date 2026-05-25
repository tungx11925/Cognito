import { apiFetch } from './api';

export const getCourses = () => apiFetch('/courses');
