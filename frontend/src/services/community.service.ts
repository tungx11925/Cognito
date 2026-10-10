import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type ResourceType = 'document' | 'test_set' | 'mindmap' | 'flashcard_deck';
export type FeedTab = 'recent' | 'popular' | 'saved';

export interface CommunityResourceItem {
  id: number;
  user_id: number;
  resource_type: ResourceType;
  resource_id: number;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  views: number;
  likes: number;
  forks: number;
  save_count?: number;
  is_reshare: boolean;
  original_resource_id: number | null;
  original_author_id: number | null;
  reshare_note: string | null;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  author_role: string | null;
  original_author_name?: string | null;
  original_author_avatar?: string | null;
  is_liked: boolean;
  is_saved: boolean;
  study_url: string;
  is_available: boolean;
  availability_status: 'AVAILABLE' | 'UNAVAILABLE';
  comment_count?: number;
}

export interface CommunityCommentItem {
  id: number;
  resource_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
  replies?: CommunityCommentItem[];
}

export interface CommunityFeedResponse {
  tab: FeedTab;
  category?: string;
  resourceType?: string;
  search?: string;
  total: number;
  limit: number;
  offset: number;
  items: CommunityResourceItem[];
}

export interface PersonalResourcesResponse {
  documents: Array<{ id: number; title: string; category?: string; created_at: string }>;
  quizzes: Array<{ id: number; name: string; created_at: string }>;
  mindmaps: Array<{ id: number; title: string; created_at: string }>;
  flashcardDecks: Array<{ id: number; name: string; created_at: string }>;
}

export const getCommunityFeed = async (params: {
  tab?: FeedTab;
  category?: string;
  resourceType?: ResourceType | '';
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<CommunityFeedResponse> => {
  const queryParams = new URLSearchParams();
  if (params.tab) queryParams.set('tab', params.tab);
  if (params.category && params.category !== 'all') queryParams.set('category', params.category);
  if (params.resourceType) queryParams.set('resourceType', params.resourceType);
  if (params.search && params.search.trim()) queryParams.set('search', params.search.trim());
  if (params.limit) queryParams.set('limit', String(params.limit));
  if (params.offset) queryParams.set('offset', String(params.offset));

  const url = `/community/feed?${queryParams.toString()}`;
  const data: any = await apiFetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (data && Array.isArray(data.resources) && !data.items) {
    data.items = data.resources;
  }
  return data;
};

export const getResourceDetail = async (id: number): Promise<{ resource: CommunityResourceItem; error?: string }> => {
  return apiFetch(`/community/resources/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

export const publishResource = async (payload: {
  resourceType: ResourceType;
  resourceId: number;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  visibility?: 'PUBLIC' | 'PRIVATE';
}): Promise<{ message: string; resource: CommunityResourceItem; error?: string }> => {
  return apiFetch('/community/publish', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

export const unpublishResource = async (id: number): Promise<{ success: boolean; message: string; error?: string }> => {
  return apiFetch(`/community/resources/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
};

export const toggleLikeResource = async (id: number): Promise<{ liked: boolean; likes: number; error?: string }> => {
  return apiFetch(`/community/resources/${id}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
};

export const toggleSaveResource = async (id: number): Promise<{ saved: boolean; forks: number; error?: string }> => {
  return apiFetch(`/community/resources/${id}/save`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
};

export const reshareCommunityResource = async (
  id: number,
  reshareNote?: string
): Promise<{ message: string; resource: CommunityResourceItem; error?: string }> => {
  return apiFetch(`/community/resources/${id}/reshare`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reshareNote: reshareNote || '' }),
  });
};

export const listResourceComments = async (
  resourceId: number
): Promise<{ comments: CommunityCommentItem[]; error?: string }> => {
  return apiFetch(`/community/resources/${resourceId}/comments`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

export const addResourceComment = async (
  resourceId: number,
  content: string,
  parentId?: number
): Promise<{ message: string; comment: CommunityCommentItem; error?: string }> => {
  return apiFetch(`/community/resources/${resourceId}/comments`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, parentId: parentId || null }),
  });
};

export const deleteResourceComment = async (commentId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/community/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
};

export const getUserPersonalResources = async (): Promise<PersonalResourcesResponse | { error: string }> => {
  return apiFetch('/community/my-resources', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};
