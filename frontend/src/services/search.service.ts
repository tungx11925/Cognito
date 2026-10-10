import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export interface SearchParams {
  q?: string;
  tab?: 'all' | 'documents' | 'community' | 'question_sets' | 'profiles';
  category?: string;
  type?: string;
  sort?: 'relevance' | 'latest' | 'popular';
  page?: number;
  limit?: number;
  onlyMine?: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'document' | 'community' | 'question_set';
}

export const searchApi = {
  search: async (params: SearchParams) => {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.tab) query.append('tab', params.tab);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.onlyMine) query.append('onlyMine', 'true');

    return apiFetch(`/search?${query.toString()}`, {
      method: 'GET',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    });
  },

  getSuggestions: async (q: string): Promise<{ success: boolean; data: SearchSuggestion[] }> => {
    if (!q || !q.trim()) return { success: true, data: [] };
    return apiFetch(`/search/suggestions?q=${encodeURIComponent(q.trim())}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
