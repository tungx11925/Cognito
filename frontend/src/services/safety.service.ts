import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type ReportTargetType = 'resource' | 'comment' | 'user' | 'message';
export type ReportReason =
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'COPYRIGHT_VIOLATION'
  | 'HARASSMENT'
  | 'FALSE_INFORMATION'
  | 'OTHER';

export type ModerationAction = 'KEEP' | 'HIDE' | 'REMOVE' | 'WARN' | 'SUSPEND';

export interface BlockedUserItem {
  block_id: number;
  blocked_id: number;
  name: string;
  avatar_url: string | null;
  email: string;
  reason: string | null;
  created_at: string;
}

export interface ContentReportItem {
  id: number;
  reporter_id: number;
  reporter_name?: string;
  reporter_email?: string;
  target_type: ReportTargetType;
  target_id: number;
  target_title?: string;
  target_author_name?: string;
  reason: ReportReason;
  details: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  action_taken?: ModerationAction | null;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  moderation_notes?: string | null;
  created_at: string;
}

export interface ModerationStats {
  pendingReports: number;
  pendingReportsCount: number;
  hiddenResources: number;
  hiddenResourcesCount: number;
  suspendedUsers: number;
  suspendedUsersCount: number;
  recentActions: number;
  recentActionsCount: number;
}

export interface ModerationHistoryItem {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_email: string;
  action: ModerationAction;
  target_type: ReportTargetType;
  target_id: number;
  report_id: number | null;
  reason: string;
  notes: string | null;
  created_at: string;
}

export const safetyService = {
  // ─── USER SAFETY APIS ───
  blockUser: async (userId: number, reason?: string) => {
    return await apiFetch(`/api/community/blocks/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ reason }),
    });
  },

  unblockUser: async (userId: number) => {
    return await apiFetch(`/api/community/blocks/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  getBlockedUsers: async () => {
    return await apiFetch('/api/community/blocks', {
      headers: getAuthHeaders(),
    });
  },

  reportContent: async (
    targetTypeOrInput: ReportTargetType | { targetType: ReportTargetType; targetId: number; reason: ReportReason; details?: string },
    targetId?: number,
    reason?: ReportReason,
    details?: string
  ) => {
    let payload: { targetType: ReportTargetType; targetId: number; reason: ReportReason; details?: string };
    if (typeof targetTypeOrInput === 'object') {
      payload = targetTypeOrInput;
    } else {
      payload = {
        targetType: targetTypeOrInput,
        targetId: targetId!,
        reason: reason!,
        details,
      };
    }

    return await apiFetch('/api/community/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
  },

  getMyReports: async () => {
    return await apiFetch('/api/community/my-reports', {
      headers: getAuthHeaders(),
    });
  },

  // ─── ADMIN MODERATION APIS ───
  getModerationStats: async () => {
    return await apiFetch('/api/admin/moderation/stats', {
      headers: getAuthHeaders(),
    });
  },

  getModerationReports: async (params?: {
    status?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.targetType && params.targetType !== 'ALL') query.set('targetType', params.targetType);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return await apiFetch(`/api/admin/moderation/reports?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
  },

  applyModerationAction: async (
    reportId: number,
    action: ModerationAction,
    reason: string,
    notes?: string
  ) => {
    return await apiFetch(`/api/admin/moderation/reports/${reportId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ action, reason, notes }),
    });
  },

  getModerationHistory: async (page: number = 1, limit: number = 20) => {
    return await apiFetch(`/api/admin/moderation/history?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
  },

  suspendUser: async (userId: number, reason: string, notes?: string) => {
    return await apiFetch(`/api/admin/moderation/users/${userId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ reason, notes }),
    });
  },

  unsuspendUser: async (userId: number) => {
    return await apiFetch(`/api/admin/moderation/users/${userId}/unsuspend`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },
};
