'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';

/**
 * Danh sách route công khai không bắt buộc đăng nhập (Spec 3.14):
 * - / (landing page có modal login / register / forgot-password)
 * - /home
 * - /search (tìm kiếm)
 * - /reset-password (đặt lại mật khẩu)
 * - /not-found, /404 (trang báo lỗi)
 * - /shared/[token] (tài liệu công khai được chia sẻ)
 * - /profile/[userId] (public profile của người dùng khác)
 */
export const PUBLIC_ROUTES = [
  '/',
  '/search',
  '/community',
  '/reset-password',
  '/not-found',
  '/404',
];

/**
 * Danh sách route con riêng tư dưới /profile/ bắt buộc phải đăng nhập (bảo vệ tuyệt đối):
 * - /profile (trang cá nhân của chính mình)
 * - /profile/
 * - /profile/edit, /profile/settings, /profile/security, /profile/account, v.v.
 */
export const PRIVATE_PROFILE_SUBROUTES = [
  'edit',
  'settings',
  'security',
  'activity',
  'account',
  'billing',
  'notifications',
  'password',
];

export const isPublicRoute = (pathname: string | null): boolean => {
  if (!pathname) return true;
  const cleanPath = pathname.split('?')[0].split('#')[0];
  if (PUBLIC_ROUTES.includes(cleanPath)) return true;
  if (cleanPath.startsWith('/shared/')) return true;

  // Xử lý route /profile
  if (cleanPath === '/profile' || cleanPath === '/profile/') {
    return false; // Trang profile cá nhân phải bảo vệ
  }

  if (cleanPath.startsWith('/profile/')) {
    const sub = cleanPath.substring('/profile/'.length).replace(/\/+$/, '');
    if (!sub) return false;

    // Nếu có thêm cấp con (ví dụ /profile/123/edit, /profile/settings/notifications) -> bảo vệ
    if (sub.includes('/')) return false;

    // Nếu thuộc danh sách route con riêng tư -> bảo vệ
    if (PRIVATE_PROFILE_SUBROUTES.includes(sub.toLowerCase())) return false;

    // Chỉ /profile/[userId] dạng số/ID là công khai (ví dụ: /profile/10038, /profile/usr_123)
    if (/^\d+$/.test(sub)) return true;
    if (/^[a-zA-Z0-9_-]{1,64}$/.test(sub)) return true;

    return false;
  }
  return false;
};

/**
 * Hàm kiểm tra và lấy returnUrl an toàn — CHỈ chấp nhận đường dẫn nội bộ:
 * - Loại bỏ toàn bộ ký tự điều khiển (\t, \n, \r, ASCII 0x00-0x1F, 0x7F) trước khi kiểm tra (Item 5).
 * - Bắt đầu bằng "/", KHÔNG bắt đầu bằng "//", KHÔNG chứa ký tự "\" (chặn cả /\ và \),
 * - KHÔNG chứa "://", xóa khỏi sessionStorage sau khi dùng.
 */
export const getSafeReturnUrl = (fallback = '/home'): string => {
  if (typeof window === 'undefined') return fallback;
  let rawUrl: string | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    rawUrl = params.get('returnUrl');
    if (!rawUrl) {
      rawUrl = sessionStorage.getItem('cognito_return_url');
    }
    sessionStorage.removeItem('cognito_return_url');
  } catch (e) {}

  if (rawUrl && typeof rawUrl === 'string') {
    // Loại bỏ toàn bộ ký tự điều khiển (\t, \n, \r, ASCII 0x00-0x1F và 0x7F) trước khi kiểm tra
    const sanitized = rawUrl.replace(/[\t\n\r\x00-\x1F\x7F]/g, '').trim();
    if (
      sanitized.startsWith('/') &&
      !sanitized.startsWith('//') &&
      !sanitized.includes('\\') &&
      !sanitized.includes('://')
    ) {
      return sanitized;
    }
  }
  return fallback;
};

/**
 * RouteGuard dùng chung cho toàn bộ các route cần đăng nhập (Spec 3.14).
 * Khi người dùng chưa đăng nhập truy cập route được bảo vệ,
 * lưu returnUrl an toàn và chuyển hướng về trang chủ / mở modal đăng nhập.
 */
export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useStudy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isPublicRoute(pathname)) {
      if (typeof window !== 'undefined') {
        const fullPath = window.location.pathname + window.location.search;
        if (fullPath.startsWith('/') && !fullPath.startsWith('//') && !fullPath.includes('\\')) {
          try {
            sessionStorage.setItem('cognito_return_url', fullPath);
          } catch (e) {}
          router.push(`/?returnUrl=${encodeURIComponent(fullPath)}`);
        } else {
          router.push('/');
        }
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  return <>{children}</>;
};

export default RouteGuard;
