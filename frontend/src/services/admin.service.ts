import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// 1. Dashboard Platform Stats
export const getAdminStats = () => apiFetch('/admin/stats', {
  method: 'GET',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});

// 2. Users Management
export interface UserQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  tier?: string;
}

export const getAdminUsers = (params?: UserQueryParams) => {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.page) q.append('page', params.page.toString());
  if (params?.limit) q.append('limit', params.limit.toString());
  if (params?.role && params.role !== 'all') q.append('role', params.role);
  if (params?.status && params.status !== 'all') q.append('status', params.status);
  if (params?.tier && params.tier !== 'all') q.append('tier', params.tier);
  
  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return apiFetch(`/admin/users${queryStr}`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
  });
};

export const getAdminUserDetails = (id: number) => apiFetch(`/admin/users/${id}/details`, {
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

export const deleteAdminUser = (id: number) => apiFetch(`/admin/users/${id}`, {
  method: 'DELETE',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});

export const warnAdminUser = (id: number, message: string) => apiFetch(`/admin/users/${id}/warn`, {
  method: 'POST',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
  body: JSON.stringify({ message })
});

export const suspendAdminUser = (id: number, reason: string, notes?: string) => apiFetch(`/admin/users/${id}/suspend`, {
  method: 'POST',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
  body: JSON.stringify({ reason, notes })
});

export const unsuspendAdminUser = (id: number) => apiFetch(`/admin/users/${id}/unsuspend`, {
  method: 'POST',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});

// 3. Subscriptions & Revenue Management
export interface SubscriptionsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  plan?: string;
}

export const getAdminSubscriptions = (params?: SubscriptionsQueryParams) => {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.page) q.append('page', params.page.toString());
  if (params?.limit) q.append('limit', params.limit.toString());
  if (params?.status && params.status !== 'ALL') q.append('status', params.status);
  if (params?.plan && params.plan !== 'ALL') q.append('plan', params.plan);

  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return apiFetch(`/admin/subscriptions${queryStr}`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
  });
};

export const syncAdminSubscriptions = () => apiFetch('/admin/subscriptions/sync', {
  method: 'POST',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});

export const cancelAdminSubscription = (id: number) => apiFetch(`/admin/subscriptions/${id}/cancel`, {
  method: 'POST',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});

export interface OrdersQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  gateway?: string;
}

export const getAdminOrders = (params?: OrdersQueryParams) => {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.page) q.append('page', params.page.toString());
  if (params?.limit) q.append('limit', params.limit.toString());
  if (params?.status && params.status !== 'ALL') q.append('status', params.status);
  if (params?.gateway && params.gateway !== 'ALL') q.append('gateway', params.gateway);

  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return apiFetch(`/admin/orders${queryStr}`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
  });
};

// 4. Documents Management (Safe Metadata)
export const getAdminDocuments = (search?: string, page?: number, limit?: number, visibility?: string) => {
  const q = new URLSearchParams();
  if (search) q.append('search', search);
  if (page) q.append('page', page.toString());
  if (limit) q.append('limit', limit.toString());
  if (visibility && visibility !== 'all') q.append('visibility', visibility);

  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return apiFetch(`/admin/documents${queryStr}`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
  });
};

export const deleteAdminDocument = (id: number) => apiFetch(`/admin/documents/${id}`, {
  method: 'DELETE',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
});
