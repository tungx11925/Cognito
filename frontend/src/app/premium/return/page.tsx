"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import { paymentService, PaymentOrderStatus } from '@/services/payment.service';
import { Navbar } from '@/components/landing/Navbar';
import { useStudy } from '@/context/StudyContext';

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, activeUser, setShowLoginModal } = useStudy();

  const orderCode = searchParams.get('orderCode');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<PaymentOrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!orderCode) {
      setError('Không tìm thấy mã đơn hàng cần xác thực');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const verifyOrder = async () => {
      try {
        // ALWAYS query backend database status. NEVER trust URL parameters like ?status=PAID.
        const orderData = await paymentService.getOrderStatus(orderCode);
        if (!isMounted) return;

        setOrder(orderData);

        if (orderData.status === 'COMPLETED') {
          setLoading(false);
        } else if (orderData.status === 'PENDING' && retryCount < 5) {
          // Webhook might be processing in flight, retry poll up to 5 times
          timer = setTimeout(() => {
            if (isMounted) setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Lỗi tra cứu đơn hàng từ hệ thống');
        setLoading(false);
      }
    };

    verifyOrder();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderCode, retryCount]);

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xl p-8 max-w-lg w-full text-center space-y-6"
        >
          {loading ? (
            <div className="py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
              <h2 className="text-2xl font-black text-[#1a3d28] dark:text-zinc-100">Đang xác thực thanh toán...</h2>
              <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">
                Hệ thống đang kiểm tra chữ ký xác thực từ cổng thanh toán. Vui lòng không đóng trình duyệt.
              </p>
            </div>
          ) : error || !order || order.status !== 'COMPLETED' ? (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                <XCircle size={36} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-rose-700 dark:text-rose-400">Thanh toán chưa hoàn tất</h2>
                <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium mt-2">
                  {error ||
                    (order?.status === 'PENDING'
                      ? 'Đơn hàng đang chờ thanh toán hoặc chưa nhận được webhook hợp lệ.'
                      : 'Đơn hàng thanh toán đã bị hủy hoặc không thành công.')}
                </p>
              </div>

              {order && (
                <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-2xl p-4 text-xs space-y-2 text-left text-gray-600 dark:text-zinc-400 font-semibold border border-gray-100 dark:border-zinc-700/60">
                  <div className="flex justify-between">
                    <span>Mã đơn hàng:</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-zinc-200">#{order.order_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trạng thái:</span>
                    <span className="uppercase font-bold text-rose-600 dark:text-rose-400">{order.status}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => router.push('/premium')}
                  className="px-6 py-3 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Quay lại chọn gói
                </button>
                <button
                  onClick={() => setRetryCount(0)}
                  className="px-6 py-3 rounded-full bg-[#1a3d28] dark:bg-emerald-600 text-white font-bold text-sm hover:bg-[#255c3c] dark:hover:bg-emerald-500 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Kiểm tra lại
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold mb-3">
                  <ShieldCheck size={14} /> Chữ ký xác thực hợp lệ
                </div>
                <h2 className="text-3xl font-black text-[#1a3d28] dark:text-zinc-100">Kích hoạt Premium thành công!</h2>
                <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium mt-1">
                  Chúc mừng bạn! Tài khoản Cognito Pro của bạn đã được nâng cấp và sẵn sàng sử dụng.
                </p>
              </div>

              <div className="bg-[#fcfbf9] dark:bg-zinc-800/60 rounded-2xl p-5 text-sm space-y-3 text-left border border-gray-200/80 dark:border-zinc-700/60">
                <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                  <span>Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">#{order.order_code}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                  <span>Gói đăng ký:</span>
                  <span className="font-bold text-[#1a3d28] dark:text-emerald-400">{order.plan_name || order.plan_code || 'Cognito Pro'}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                  <span>Số tiền thanh toán:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    {Number(order.amount).toLocaleString('vi-VN')} {order.currency || 'VND'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                  <span>Cổng thanh toán:</span>
                  <span className="font-semibold text-gray-700 dark:text-zinc-300">{order.payment_gateway}</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/library')}
                className="w-full py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-[#1a3d28] font-black text-base transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98"
              >
                Bắt đầu học tập ngay <ArrowRight size={18} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3ee] dark:bg-[#0B0F17] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
