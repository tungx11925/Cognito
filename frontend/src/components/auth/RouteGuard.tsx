'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';

/**
 * Danh sách route công khai không bắt buộc đăng nhập:
 * - / (landing page có modal login / register / forgot-password)
 * - /home (landing page)
 * - /reset-password (đặt lại mật khẩu)
 * - /not-found, /404 (trang báo lỗi)
 * - /shared/[token] (tài liệu chia sẻ công khai)
 */
export const PUBLIC_ROUTES = [
  '/',
  '/home',
  '/reset-password',
  '/not-found',
  '/404',
];

export const isPublicRoute = (pathname: string | null): boolean => {
  if (!pathname) return true;
  const cleanPath = pathname.split('?')[0].split('#')[0];
  if (PUBLIC_ROUTES.includes(cleanPath)) return true;
  if (cleanPath.startsWith('/shared/')) return true;
  return false;
};

/**
 * Hàm kiểm tra và lấy returnUrl an toàn — CHỈ chấp nhận đường dẫn nội bộ:
 * - Mặc định chuyển về /library (Không gian học tập) nếu không có returnUrl cụ thể.
 * - Loại bỏ toàn bộ ký tự điều khiển trước khi kiểm tra.
 * - Bắt đầu bằng "/", KHÔNG bắt đầu bằng "//", KHÔNG chứa ký tự "\", KHÔNG chứa "://".
 */
export const getSafeReturnUrl = (fallback = '/library'): string => {
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
    const sanitized = rawUrl.replace(/[\t\n\r\x00-\x1F\x7F]/g, '').trim();
    if (
      sanitized.startsWith('/') &&
      !sanitized.startsWith('//') &&
      !sanitized.includes('\\') &&
      !sanitized.includes('://')
    ) {
      // Tránh lặp vô hạn về chính trang chủ nếu returnUrl là / hoặc /home
      if (sanitized === '/' || sanitized === '/home') {
        return fallback;
      }
      return sanitized;
    }
  }
  return fallback;
};

/**
 * RouteGuard bảo vệ tuyệt đối tất cả chức năng trên web:
 * Người dùng bắt buộc phải đăng nhập mới được truy cập các tính năng.
 * Khi chưa đăng nhập, lập tức chuyển hướng về trang chủ và kích hoạt modal đăng nhập.
 */
export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, setShowLoginModal, triggerMessage } = useStudy();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isPublic) {
      if (typeof window !== 'undefined') {
        const fullPath = window.location.pathname + window.location.search;
        if (fullPath.startsWith('/') && !fullPath.startsWith('//') && !fullPath.includes('\\')) {
          try {
            sessionStorage.setItem('cognito_return_url', fullPath);
          } catch (e) {}
          router.replace(`/?returnUrl=${encodeURIComponent(fullPath)}`);
        } else {
          router.replace('/');
        }
        setShowLoginModal(true);
        triggerMessage('Vui lòng đăng nhập để sử dụng tính năng này', 'error');
      }
    }
  }, [isAuthenticated, loading, isPublic, router, setShowLoginModal, triggerMessage]);

  if (!isPublic) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f3ee] dark:bg-[#0B0F17]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#1a3d28]/20 border-t-[#1a3d28] rounded-full animate-spin dark:border-emerald-400/20 dark:border-t-emerald-400"></div>
            <p className="text-xs font-semibold text-stone-500 dark:text-zinc-400">Đang kiểm tra đăng nhập...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Chặn hoàn toàn việc render giao diện chức năng khi chưa đăng nhập
      return null;
    }
  }

  return <>{children}</>;
};

export default RouteGuard;
