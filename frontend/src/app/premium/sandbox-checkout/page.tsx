"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, ArrowRight, Loader2, CreditCard } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';
import { Navbar } from '@/components/landing/Navbar';
import { useStudy } from '@/context/StudyContext';

function SandboxCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, activeUser, setShowLoginModal } = useStudy();

  const orderCode = searchParams.get('orderCode');
  const amount = searchParams.get('amount') || '99000';
  const plan = searchParams.get('plan') || 'PRO_MONTHLY';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulatePayment = async () => {
    if (!orderCode) {
      setError('Thiếu orderCode');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payment/sandbox/simulate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi mô phỏng thanh toán sandbox');
      }

      // Webhook with genuine HMAC-SHA256 signature was processed by backend!
      // Now redirect to return page to display verified results from DB
      router.push(`/premium/return?orderCode=${orderCode}`);
    } catch (err: any) {
      setError(err.message || 'Lỗi mô phỏng thanh toán');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-[#0B0F17] text-[#0d1a14] dark:text-zinc-100 flex flex-col">
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />

      <div className="flex-1 flex items-center justify-center p-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-2xl p-8 max-w-lg w-full space-y-6 text-center"
        >
          <div className="w-16 h-16 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <CreditCard size={32} />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
              <ShieldCheck size={14} className="text-amber-600 dark:text-amber-400" /> Cổng Thanh Toán Sandbox Test
            </div>
            <h2 className="text-2xl font-black text-[#1a3d28] dark:text-zinc-100">Xác nhận Đơn hàng Thử nghiệm</h2>
            <p className="text-gray-500 dark:text-zinc-400 text-xs font-medium mt-1">
              Môi trường an toàn — Tuyệt đối không trừ tiền thật. Dữ liệu chữ ký Webhook HMAC-SHA256 sẽ được kiểm tra toàn vẹn.
            </p>
          </div>

          <div className="bg-[#f7f6f2] dark:bg-zinc-800/60 rounded-2xl p-5 text-sm space-y-3 text-left border border-gray-200/60 dark:border-zinc-700/60">
            <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
              <span>Mã đơn hàng:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">#{orderCode || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
              <span>Gói dịch vụ:</span>
              <span className="font-bold text-[#1a3d28] dark:text-emerald-400">
                {plan === 'PRO_YEARLY' ? 'Cognito Pro (1 Năm)' : 'Cognito Pro (1 Tháng)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
              <span>Số tiền thanh toán:</span>
              <span className="font-black text-amber-600 dark:text-amber-400 text-base">
                {Number(amount).toLocaleString('vi-VN')} VND
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
              <span>Phương thức mô phỏng:</span>
              <span className="font-semibold text-gray-700 dark:text-zinc-300">HMAC-SHA256 Signed Webhook</span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs text-left font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleSimulatePayment}
              disabled={loading}
              className="w-full py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Mô phỏng Thanh toán Thành công <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              onClick={() => router.push('/premium')}
              className="w-full py-3 rounded-full border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 font-bold text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
            >
              Hủy bỏ và quay lại
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SandboxCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3ee] dark:bg-[#0B0F17] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      }
    >
      <SandboxCheckoutContent />
    </Suspense>
  );
}
