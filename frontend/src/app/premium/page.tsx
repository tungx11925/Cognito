"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Sparkles, Zap, Shield, CheckCircle2, 
  ChevronDown, ChevronUp, ArrowRight, 
  Check, AlertTriangle, Calendar, RefreshCcw, Loader2, X
} from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { useRouter } from 'next/navigation';
import { 
  paymentService, 
  SubscriptionPlan, 
  UserSubscriptionInfo 
} from '@/services/payment.service';

export default function PremiumPage() {
  const { 
    isAuthenticated, 
    activeUser, 
    setShowLoginModal,
    globalMessage,
    triggerMessage
  } = useStudy();
  
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSub, setUserSub] = useState<UserSubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Fetch plans and user subscription info
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const fetchedPlans = await paymentService.getPlans();
        if (isMounted) setPlans(fetchedPlans);

        if (isAuthenticated) {
          const subInfo = await paymentService.getMySubscription();
          if (isMounted) setUserSub(subInfo);
        }
      } catch (err: any) {
        console.error('Error loading subscription info:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const isPremium = userSub?.is_premium || activeUser?.role === 'admin';
  const currentSub = userSub?.subscription;

  const features = [
    { 
      title: "Học tập không giới hạn AI", 
      desc: "Trò chuyện, đặt câu hỏi giải thích tài liệu với trợ lý AI 24/7 mà không lo hết lượt.", 
      icon: <Sparkles size={24} className="text-amber-500" /> 
    },
    { 
      title: "Tạo Flashcards tự động", 
      desc: "Chuyển hóa tài liệu ôn tập thành bộ câu hỏi ghi nhớ thông minh chỉ với 1 lượt click chuột.", 
      icon: <Zap size={24} className="text-amber-500" /> 
    },
    { 
      title: "Lưu trữ đám mây 50GB", 
      desc: "Không gian lưu trữ rộng lớn cho mọi giáo trình, tài liệu PDF, hình ảnh và bài giảng của bạn.", 
      icon: <Shield size={24} className="text-amber-500" /> 
    },
    { 
      title: "Hỗ trợ ưu tiên 24/7", 
      desc: "Được hỗ trợ nhanh nhất từ đội ngũ kỹ thuật và chuyên gia học tập bất cứ lúc nào bạn cần.", 
      icon: <Crown size={24} className="text-amber-500" /> 
    }
  ];

  const faqs = [
    {
      q: "Gói Pro tính chu kỳ và thanh toán như thế nào?",
      a: "Bạn có thể lựa chọn gói Pro Tháng (99.000 VNĐ/tháng) hoặc Pro Năm (899.000 VNĐ/năm — tiết kiệm 25%). Đơn hàng thanh toán được bảo mật qua cổng đối tác chuẩn mã hóa HMAC-SHA256."
    },
    {
      q: "Tôi có thể hủy gia hạn gói bất cứ lúc nào không?",
      a: "Hoàn toàn được. Bạn có thể bấm 'Hủy tự động gia hạn' bất cứ lúc nào. Sau khi hủy, toàn bộ đặc quyền Premium vẫn được bảo lưu trọn vẹn đến hết chu kỳ đã thanh toán."
    },
    {
      q: "Điều gì xảy ra nếu gia hạn thanh toán thất bại?",
      a: "Hệ thống sẽ chuyển gói sang trạng thái Quá Hạn (PAST_DUE) với thời gian ân hạn 3 ngày (Grace Period). Trong thời gian này, bạn vẫn sử dụng được bình thường và có thể hoàn tất thanh toán để duy trì gói mà không bị gián đoạn."
    },
    {
      q: "Sự khác biệt lớn nhất giữa gói Free và gói Pro là gì?",
      a: "Gói Free giới hạn 10 câu hỏi AI/ngày và 20 tài liệu lưu trữ. Gói Pro mở khóa hoàn toàn mọi giới hạn hỏi AI, hỗ trợ tạo Flashcard & Mindmap tự động, dung lượng lưu trữ 50GB cùng tài liệu lên đến 200 trang."
    }
  ];

  const handleCheckoutClick = async (planCode: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setCheckoutLoading(planCode);
    try {
      const checkoutRes = await paymentService.createCheckout(planCode);
      if (checkoutRes.checkoutUrl) {
        // Safe redirect to checkout (PayOS link or internal Sandbox simulator)
        if (checkoutRes.checkoutUrl.startsWith('http')) {
          window.location.href = checkoutRes.checkoutUrl;
        } else {
          router.push(checkoutRes.checkoutUrl);
        }
      }
    } catch (err: any) {
      triggerMessage(err.message || 'Lỗi khi tạo đơn thanh toán', 'error');
      setCheckoutLoading(null);
    }
  };

  const handleCancelAutoRenew = async () => {
    setCancelling(true);
    try {
      const res = await paymentService.cancelSubscription();
      triggerMessage(res.message, 'success');
      setShowCancelModal(false);
      // Reload sub info
      const updated = await paymentService.getMySubscription();
      setUserSub(updated);
    } catch (err: any) {
      triggerMessage(err.message || 'Lỗi khi hủy gia hạn', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-[#0B0F17] text-[#0d1a14] dark:text-zinc-100 flex flex-col relative overflow-x-hidden transition-colors duration-300">
      {/* Toast Notification */}
      {globalMessage.text && (
        <div className={`fixed top-6 right-6 z-[99999] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 border transition-all duration-300 ${
          globalMessage.type === 'success' 
            ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
            : 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* Global Navbar */}
      <Navbar 
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />

      {/* Main Body */}
      <div className="flex-1 pt-14">
        
        {/* 1. HERO SECTION */}
        <section className="bg-gradient-to-br from-[#1a3d28] via-[#1d472f] to-[#255c3c] text-white py-16 sm:py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_45%)]" />
          
          <div className="max-w-5xl mx-auto relative z-10 grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-6 text-left">
              
              {isPremium ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest">
                  <Crown size={12} className="fill-amber-400/20" /> Gói Premium đang hoạt động
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest">
                  Nâng tầm học tập cùng AI
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
                Học tập không giới hạn.<br/>Chỉ từ <span className="text-amber-400">99.000đ</span>.
              </h1>
              
              <p className="text-base sm:text-lg text-emerald-100/90 max-w-xl font-medium">
                Mở khóa tối đa năng suất với trợ lý AI thông minh, Flashcard & Sơ đồ tư duy tự động, lưu trữ đám mây 50GB cùng hàng loạt đặc quyền VIP.
              </p>

              {/* Status Banner for Existing Subscriber */}
              {isPremium && currentSub && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs space-y-2 max-w-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Crown size={14} /> Gói hiện tại: {currentSub.plan_name || 'Cognito Pro'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      currentSub.status === 'ACTIVE' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : currentSub.status === 'CANCELLED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {currentSub.status === 'ACTIVE' ? 'Đang hoạt động' : currentSub.status === 'CANCELLED' ? 'Đã hủy gia hạn' : 'Quá hạn (Ân hạn)'}
                    </span>
                  </div>

                  <p className="text-emerald-100/80">
                    Thời hạn quyền lợi: <span className="font-bold text-white">{formatDate(currentSub.end_date)}</span>
                  </p>

                  {currentSub.status === 'CANCELLED' && (
                    <p className="text-amber-200/90 text-[11px] font-medium">
                      * Bạn đã hủy gia hạn tự động. Bạn vẫn có thể dùng toàn quyền Pro đến ngày {formatDate(currentSub.end_date)}.
                    </p>
                  )}

                  {currentSub.status === 'ACTIVE' && currentSub.auto_renew && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="text-[11px] text-emerald-200/70 hover:text-white underline font-semibold transition-colors"
                      >
                        Hủy tự động gia hạn chu kỳ sau
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-2">
                {isPremium ? (
                  <button 
                    onClick={() => router.push('/library')}
                    className="px-8 py-4 rounded-full bg-white text-[#1a3d28] font-black text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/25 flex items-center gap-2"
                  >
                    Vào Thư viện học ngay <ArrowRight size={18} />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleCheckoutClick('PRO_MONTHLY')}
                      disabled={Boolean(checkoutLoading)}
                      className="px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-[#1a3d28] font-black text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25 flex items-center gap-2 disabled:opacity-60"
                    >
                      {checkoutLoading === 'PRO_MONTHLY' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Nâng cấp gói Pro ngay</>
                      )}
                    </button>
                    
                    <a 
                      href="#plans" 
                      className="px-8 py-4 rounded-full border border-white/30 text-white font-bold text-base transition-all hover:bg-white/10 hover:border-white active:scale-95 flex items-center justify-center"
                    >
                      So sánh bảng giá
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Premium Gold Medallion Art */}
            <div className="md:col-span-5 flex justify-center">
              <motion.div 
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-0.5 shadow-2xl shadow-amber-500/20 relative flex items-center justify-center"
              >
                <div className="absolute inset-2 rounded-full border border-white/20 border-dashed animate-spin-slow" />
                <div className="w-full h-full rounded-full bg-[#153020] flex flex-col items-center justify-center text-center p-6 select-none">
                  <Crown size={52} className="text-amber-400 fill-amber-400/10 mb-3 animate-pulse" />
                  <span className="text-xs font-black text-amber-500 tracking-widest uppercase mb-1">Cognito VIP</span>
                  <span className="text-3xl font-black text-white tracking-tight">PRO</span>
                  <span className="text-[10px] text-emerald-200/60 font-bold mt-2">Dẫn đầu hiệu suất học</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. VALUE PROPOSITION SECTION */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-black text-[#1a3d28] dark:text-zinc-100 tracking-tight mb-3">
            Tại sao nên nâng cấp lên Cognito Pro?
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base font-medium max-w-xl mx-auto mb-12">
            Cognito Pro mang lại những lợi ích vượt trội để biến việc tự học thành trải nghiệm dễ dàng, nhanh chóng và thông minh hơn.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {features.map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -6 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-md shadow-gray-200/40 dark:shadow-none relative overflow-hidden flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mb-5 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1a3d28] dark:text-zinc-100 text-base mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-semibold">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3. PRICING PLANS SECTION */}
        <section id="plans" className="bg-[#ebd9cc]/40 dark:bg-zinc-900/40 py-20 px-6 border-t border-b border-gray-200/40 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-black text-[#1a3d28] dark:text-zinc-100 tracking-tight mb-3">
              Chọn gói cước phù hợp với bạn
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base font-medium max-w-xl mx-auto mb-14">
              Lựa chọn linh hoạt giữa gói tháng hoặc năm. Hủy tự động gia hạn bất cứ lúc nào.
            </p>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch justify-center">
              
              {/* PLAN 1: FREE */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl p-7 flex flex-col justify-between relative text-left">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-wider mb-4">
                    Gói miễn phí
                  </div>
                  <h3 className="text-xl font-black text-[#1a3d28] dark:text-zinc-100 tracking-tight">Cognito Free</h3>
                  <div className="flex items-end gap-1 mt-3 mb-6">
                    <span className="text-3xl font-black text-[#1a3d28] dark:text-zinc-100">0đ</span>
                    <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-1">/ tháng</span>
                  </div>
                  
                  <hr className="border-gray-100 dark:border-zinc-800 my-5" />
                  
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-zinc-300 font-semibold">
                      <Check size={16} className="text-[#1a3d28] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Giới hạn 10 câu hỏi trợ lý AI / ngày</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-zinc-300 font-semibold">
                      <Check size={16} className="text-[#1a3d28] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Tạo Flashcards thủ công từ tài liệu</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-zinc-300 font-semibold">
                      <Check size={16} className="text-[#1a3d28] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Lưu trữ tối đa 20 tài liệu (tối đa 30 trang)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-400 dark:text-zinc-500 font-semibold line-through">
                      <Check size={16} className="text-gray-300 dark:text-zinc-600 shrink-0 mt-0.5" />
                      <span>Không giới hạn câu hỏi trợ lý AI</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <button 
                    disabled={true}
                    className="w-full py-3.5 rounded-full border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 font-bold text-xs text-center cursor-default bg-gray-50 dark:bg-zinc-800/60"
                  >
                    {!isPremium ? 'Gói hiện tại của bạn' : 'Gói mặc định'}
                  </button>
                </div>
              </div>

              {/* PLAN 2: PRO MONTHLY */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border-2 border-amber-500 shadow-2xl p-7 flex flex-col justify-between relative text-left">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-amber-500 text-white font-black text-[9px] uppercase px-3 py-1 rounded-full shadow-md tracking-widest">
                  Phổ biến nhất
                </div>
                
                <div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider mb-4">
                    <Crown size={10} className="fill-amber-600/10" /> Gói Pro Tháng
                  </div>
                  <h3 className="text-xl font-black text-[#1a3d28] dark:text-zinc-100 tracking-tight">Cognito Pro</h3>
                  
                  <div className="mt-3 mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black text-[#1a3d28] dark:text-zinc-100">99.000đ</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-1">/ tháng</span>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-zinc-800 my-5" />

                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-200 font-bold">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Không giới hạn câu hỏi trợ lý AI</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-200 font-bold">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Tự động tạo Flashcards & Sơ đồ tư duy</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-200 font-bold">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Tài liệu lên đến 200 trang</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-200 font-bold">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Ưu tiên tốc độ phản hồi AI</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  {isPremium && currentSub?.plan_code === 'PRO_MONTHLY' ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl p-3 text-center text-xs font-bold">
                      <div className="flex justify-center items-center gap-1">
                        <Check size={14} /> Gói bạn đang dùng
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleCheckoutClick('PRO_MONTHLY')}
                      disabled={Boolean(checkoutLoading)}
                      className="w-full py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-[#1a3d28] font-black text-xs text-center shadow-lg transition-all hover:scale-[1.02] active:scale-98 flex justify-center items-center gap-2 disabled:opacity-60"
                    >
                      {checkoutLoading === 'PRO_MONTHLY' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Đăng ký gói Tháng</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* PLAN 3: PRO YEARLY */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl p-7 flex flex-col justify-between relative text-left hover:border-emerald-500 transition-colors">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-600 text-white font-black text-[9px] uppercase px-3 py-1 rounded-full shadow-md tracking-widest">
                  Tiết kiệm 25%
                </div>

                <div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-4">
                    <Sparkles size={10} className="text-emerald-600 dark:text-emerald-400" /> Gói Pro 1 Năm
                  </div>
                  <h3 className="text-xl font-black text-[#1a3d28] dark:text-zinc-100 tracking-tight">Cognito Pro Năm</h3>
                  
                  <div className="mt-3 mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black text-[#1a3d28] dark:text-zinc-100">899.000đ</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-1">/ năm</span>
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      Chỉ ~74.900đ / tháng
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-zinc-800 my-5" />

                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-200 font-bold">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Mọi tính năng của gói Pro Tháng</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-200 font-bold">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Tiết kiệm 25% chi phí so với gói tháng</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-200 font-bold">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Huy hiệu VIP Pro trên hồ sơ cộng đồng</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-zinc-200 font-bold">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Hỗ trợ kỹ thuật 24/7 trực tiếp</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  {isPremium && currentSub?.plan_code === 'PRO_YEARLY' ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl p-3 text-center text-xs font-bold">
                      <div className="flex justify-center items-center gap-1">
                        <Check size={14} /> Gói bạn đang dùng
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleCheckoutClick('PRO_YEARLY')}
                      disabled={Boolean(checkoutLoading)}
                      className="w-full py-3.5 rounded-full bg-[#1a3d28] dark:bg-emerald-600 hover:bg-[#255c3c] dark:hover:bg-emerald-500 text-white font-black text-xs text-center shadow-lg transition-all hover:scale-[1.02] active:scale-98 flex justify-center items-center gap-2 disabled:opacity-60"
                    >
                      {checkoutLoading === 'PRO_YEARLY' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Đăng ký gói Năm</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. FAQ SECTION */}
        <section className="py-20 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#1a3d28] dark:text-zinc-100 tracking-tight mb-3">
              Những câu hỏi thường gặp
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">
              Bạn có thắc mắc về thanh toán và gói dịch vụ? Chúng tôi luôn sẵn sàng hỗ trợ.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-extrabold text-sm sm:text-base text-[#1a3d28] dark:text-zinc-100 tracking-tight pr-4">
                    {faq.q}
                  </span>
                  <div className="shrink-0 text-gray-400 dark:text-zinc-400">
                    {activeFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-5 text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-medium leading-relaxed border-t border-gray-100 dark:border-zinc-800 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Confirmation Modal for Cancelling Auto-Renewal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 border border-transparent dark:border-zinc-800"
            >
              <button
                onClick={() => setShowCancelModal(false)}
                className="absolute top-5 right-5 text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 rounded-2xl flex items-center justify-center text-amber-700 dark:text-amber-400">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 className="text-xl font-black text-[#1a3d28] dark:text-zinc-100">Xác nhận hủy tự động gia hạn?</h3>
                <p className="text-gray-500 dark:text-zinc-400 text-xs font-medium mt-2 leading-relaxed">
                  Khi xác nhận hủy gia hạn, bạn vẫn giữ nguyên toàn bộ đặc quyền Cognito Pro cho đến hết chu kỳ ngày{' '}
                  <span className="font-bold text-gray-800 dark:text-zinc-200">{formatDate(currentSub?.end_date)}</span>. Hệ thống sẽ không tự động trừ phí trong chu kỳ tiếp theo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 rounded-full border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
                >
                  Giữ lại gói
                </button>
                <button
                  onClick={handleCancelAutoRenew}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy gia hạn'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
