const DEFAULT_API_BASE_URL = '/api';
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

/**
 * Migrate xóa key 'token' cũ trong localStorage khi khởi động (Spec 3.4)
 * Cookie HttpOnly là nguồn sự thật duy nhất cho phiên người dùng.
 */
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('token')) {
      console.log('[AUTH_FE] Migrated: removed legacy localStorage token in favor of HttpOnly cookie');
      localStorage.removeItem('token');
    }
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Backward-compatible helper for test scripts / external headers.
 * Trả về empty object vì HttpOnly cookie tự động đính kèm qua credentials: 'include'.
 */
export const getAuthHeaders = (): Record<string, string> => {
  return {};
};

/**
 * Backward-compatible helper for legacy components checking token existence.
 * Returns non-null when running in browser since authentication uses HttpOnly cookie.
 */
export const getValidToken = (): string | null => {
  return typeof window !== 'undefined' ? 'cookie-session' : null;
};

// Single-flight refresh token lock (Spec 3.2)
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function executeRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      console.log('[AUTH_FE] Session refreshed successfully via HttpOnly cookie');
      return true;
    }

    console.warn('[AUTH_FE] Refresh token rejected with status:', res.status);
    return false;
  } catch (err) {
    console.warn('[AUTH_FE] Network failure during refresh token:', err);
    // Network failure does NOT invalidate session — do not logout
    return false;
  }
}

function handleSessionExpired() {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname + window.location.search;
  try {
    if (currentPath && !currentPath.includes('/login') && !currentPath.includes('/register')) {
      sessionStorage.setItem('cognito_return_url', currentPath);
    }
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent('cognito:session_expired', {
      detail: {
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
        returnUrl: currentPath,
      },
    })
  );
}

export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<any> => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Ở client (browser): dùng relative path /api (same-origin qua Next.js rewrite proxy)
  // Ở server (SSR / Node.js fetch): cần absolute URL để tránh lỗi relative fetch
  let baseUrl = API_BASE_URL;
  if (typeof window === 'undefined' && baseUrl.startsWith('/')) {
    baseUrl = `http://localhost:5000${baseUrl}`;
  }

  const finalUrl = normalizedEndpoint.startsWith('/api/')
    ? `${baseUrl.replace(/\/api$/, '')}${normalizedEndpoint}`
    : `${baseUrl}${normalizedEndpoint}`;

  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include', // Luôn gửi cookie HttpOnly phiên làm việc
  };

  // Đảm bảo FormData không bị set cứng Content-Type
  if (fetchOptions.body instanceof FormData && fetchOptions.headers) {
    if (typeof (fetchOptions.headers as any).delete === 'function') {
      (fetchOptions.headers as any).delete('Content-Type');
      (fetchOptions.headers as any).delete('content-type');
    } else if (typeof fetchOptions.headers === 'object') {
      const headersCopy = { ...(fetchOptions.headers as Record<string, string>) };
      delete headersCopy['Content-Type'];
      delete headersCopy['content-type'];
      fetchOptions.headers = headersCopy;
    }
  }

  const reqMethod = fetchOptions.method || 'GET';
  const isDebugApi = process.env.NEXT_PUBLIC_DEBUG_API === 'true';
  if (isDebugApi) {
    console.log(`[API_REQ] ${reqMethod} ${finalUrl}`);
  }

  try {
    let res = await fetch(finalUrl, fetchOptions);
    const contentType = res.headers.get('content-type') || '';
    if (isDebugApi) {
      console.log(`[API_RES] ${finalUrl} status=${res.status} type=${contentType}`);
    }

    // Bypass refresh logic for auth endpoints
    const isAuthEndpoint =
      normalizedEndpoint.includes('/auth/login') ||
      normalizedEndpoint.includes('/auth/register') ||
      normalizedEndpoint.includes('/auth/refresh') ||
      normalizedEndpoint.includes('/auth/google') ||
      normalizedEndpoint.includes('/auth/verify-2fa');

    // Handle 401 Unauthorized according to Spec 3.2
    if (res.status === 401 && !isAuthEndpoint) {
      console.warn(`[AUTH_FE] 401 received from ${normalizedEndpoint}. Initiating single-flight refresh...`);

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = executeRefreshToken().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const refreshSuccess = await refreshPromise;

      if (refreshSuccess) {
        // Retry the original request once
        res = await fetch(finalUrl, fetchOptions);
      } else {
        // Refresh failed -> Session expired. Notify user & save returnUrl
        console.warn(`[AUTH_FE] Refresh failed. Session expired for request: ${normalizedEndpoint}`);
        handleSessionExpired();
      }
    }

    // Kiểm tra content-type: Nếu không phải JSON, không gọi .json() để tránh văng cú pháp HTML
    const finalContentType = res.headers.get('content-type') || '';
    if (finalContentType.toLowerCase().includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || data.message || `Lỗi máy chủ (${res.status})`, ...data };
      }
      return data;
    } else {
      const text = await res.text();
      const snippet = text.slice(0, 120).replace(/\s+/g, ' ');
      const htmlErrorMsg = `Server trả về HTML (status ${res.status}) tại URL ${finalUrl}: ${snippet}`;
      console.error('[API_HTML_RESPONSE]', htmlErrorMsg);
      return { 
        error: `Server trả về HTML (status ${res.status}) tại URL ${finalUrl}`,
        status: res.status,
        url: finalUrl,
        details: text 
      };
    }
  } catch (error: any) {
    // Network errors do not log out
    console.error(`[API_NET_ERROR] ${finalUrl}:`, error?.message);
    return { error: error.message || 'Lỗi kết nối mạng', url: finalUrl };
  }
};
