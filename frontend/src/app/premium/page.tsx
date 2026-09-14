"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Sparkles, Zap, Shield, CheckCircle2, 
  Calendar, ChevronDown, ChevronUp, ArrowRight, 
  HelpCircle, Star, Award, Check 
} from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { useRouter } from 'next/navigation';

export default function PremiumPage() {
  const { 
    isAuthenticated, 
    activeUser, 
    upgradePremium, 
    showLoginModal, 
    setShowLoginModal,
    globalMessage,
    triggerMessage
  } = useStudy();
  
  const router = useRouter();
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const isPremium = activeUser?.role === 'premium' || activeUser?.role === 'admin';

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
      q: "Gói Premium giá 49K áp dụng trong bao lâu?",
      a: "Giá ưu đãi 49.000 VNĐ/tháng áp dụng trọn đời khi bạn duy trì gói. Chu kỳ thanh toán sẽ tự động diễn ra sau mỗi 30 ngày kể từ ngày kích hoạt nâng cấp thành công."
    },
    {
      q: "Tôi có thể hủy gói đăng ký bất cứ lúc nào không?",
      a: "Hoàn toàn được. Bạn có thể hủy gói Premium bất cứ lúc nào trong phần Cài đặt tài khoản. Sau khi hủy, bạn vẫn giữ nguyên quyền lợi Premium cho đến khi hết hạn chu kỳ thanh toán hiện tại."
    },
    {
      q: "Làm thế nào để thanh toán nâng cấp?",
      a: "Hiện tại Cognito hỗ trợ nâng cấp trực tiếp qua số dư Ví học tập hoặc liên kết cổng thanh toán nội địa MoMo, chuyển khoản ngân hàng QR Code cực kỳ bảo mật và nhanh chóng."
    },
    {
      q: "Sự khác biệt lớn nhất giữa gói Free và gói Premium là gì?",
      a: "Gói Free giới hạn 10 câu hỏi AI mỗi ngày và dung lượng lưu trữ 1GB. Gói Premium mở khóa hoàn toàn mọi giới hạn câu hỏi AI, tự động tạo Flashcards không giới hạn số lượng và nâng cấp dung lượng lưu trữ lên tới 50GB."
    }
  ];

  const handleUpgradeClick = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setLoadingUpgrade(true);
    const success = await upgradePremium();
    setLoadingUpgrade(false);
    if (success) {
      triggerMessage("Nâng cấp tài khoản Premium thành công! 🎉", "success");
    }
  };

  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);
  const formattedBillingDate = nextBillingDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#0d1a14] flex flex-col relative overflow-x-hidden">
      
      {/* Toast Notification */}
      {globalMessage.text && (
        <div className={`fixed top-6 right-6 z-[99999] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 border transition-all duration-300 ${
          globalMessage.type === 'success' 
            ? 'bg-white text-emerald-700 border-emerald-200' 
            : 'bg-white text-rose-700 border-rose-200'
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
        
        {/* 1. HERO SECTION (Spotify Premium Style but Green/Beige Theme) */}
        <section className="bg-gradient-to-br from-[#1a3d28] via-[#1d472f] to-[#255c3c] text-white py-16 sm:py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_45%)]" />
          
          <div className="max-w-5xl mx-auto relative z-10 grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-6 text-left">
              
              {isPremium ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest">
                  <Crown size={12} className="fill-amber-400/20" /> Gói Premium đang hoạt động
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-black uppercase tracking-widest">
                  Ưu đãi 50% tháng này
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
                Học tập không giới hạn.<br/>Chỉ với <span className="text-amber-400">49.000đ</span>.
              </h1>
              
              <p className="text-base sm:text-lg text-emerald-100/90 max-w-xl font-medium">
                Mở khóa tối đa sức mạnh học tập của bạn với AI thông minh, Flashcard tự động tạo, lưu trữ đám mây 50GB cùng hàng loạt đặc quyền VIP khác.
              </p>

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
                      onClick={handleUpgradeClick}
                      disabled={loadingUpgrade}
                      className="px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-[#1a3d28] font-black text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25 flex items-center gap-2"
                    >
                      {loadingUpgrade ? (
                        <div className="w-5 h-5 border-2 border-[#1a3d28]/30 border-t-[#1a3d28] rounded-full animate-spin" />
                      ) : (
                        <>Nâng cấp ngay với 49K</>
                      )}
                    </button>
                    
                    <a 
                      href="#plans" 
                      className="px-8 py-4 rounded-full border border-white/30 text-white font-bold text-base transition-all hover:bg-white/10 hover:border-white active:scale-95 flex items-center justify-center"
                    >
                      Xem các gói cước
                    </a>
                  </>
                )}
              </div>
              
              {!isPremium && (
                <p className="text-xs text-emerald-200/70 font-semibold">
                  *Áp dụng điều khoản. Giá gốc 99K. Hủy đăng ký bất kỳ lúc nào.
                </p>
              )}
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
                  <span className="text-3xl font-black text-white tracking-tight">PREMIUM</span>
                  <span className="text-[10px] text-emerald-200/60 font-bold mt-2">Dẫn đầu hiệu suất học</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. VALUE PROPOSITION SECTION ("Tại sao nâng cấp lên Premium?") */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-black text-[#1a3d28] tracking-tight mb-3">
            Tại sao nên nâng cấp lên Premium?
          </h2>
          <p className="text-gray-500 text-sm sm:text-base font-medium max-w-xl mx-auto mb-12">
            Cognito Premium mang lại những lợi ích vượt trội để biến việc tự học thành trải nghiệm dễ dàng, nhanh chóng và thông minh hơn.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {features.map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -6 }}
                className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-md shadow-gray-200/40 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1a3d28] text-base mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3. PRICING PLANS SECTION (Miễn Phí vs Premium) */}
        <section id="plans" className="bg-[#ebd9cc]/40 py-20 px-6 border-t border-b border-gray-200/40">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-black text-[#1a3d28] tracking-tight mb-3">
              Chọn gói Premium của bạn
            </h2>
            <p className="text-gray-500 text-sm sm:text-base font-medium max-w-xl mx-auto mb-14">
              Không giới hạn học tập. Lựa chọn linh hoạt, hủy gói bất kỳ lúc nào ngay trên website của bạn.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch justify-center">
              
              {/* FREE PLAN */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 flex flex-col justify-between relative text-left">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-wider mb-4">
                    Gói miễn phí
                  </div>
                  <h3 className="text-2xl font-black text-[#1a3d28] tracking-tight">Cognito Free</h3>
                  <div className="flex items-end gap-1.5 mt-3 mb-6">
                    <span className="text-4xl font-black text-[#1a3d28]">0đ</span>
                    <span className="text-xs font-bold text-gray-500 mb-1">/ tháng</span>
                  </div>
                  
                  <hr className="border-gray-100 my-5" />
                  
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-xs text-gray-600 font-semibold">
                      <Check size={16} className="text-[#1a3d28] shrink-0 mt-0.5" />
                      <span>Giới hạn 10 câu hỏi trợ lý AI mỗi ngày</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-600 font-semibold">
                      <Check size={16} className="text-[#1a3d28] shrink-0 mt-0.5" />
                      <span>Tạo Flashcards thủ công từ tài liệu</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-600 font-semibold">
                      <Check size={16} className="text-[#1a3d28] shrink-0 mt-0.5" />
                      <span>Lưu trữ đám mây tối đa 1GB</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-400 font-semibold line-through">
                      <Check size={16} className="text-gray-300 shrink-0 mt-0.5" />
                      <span>Không giới hạn câu hỏi AI</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <button 
                    disabled={true}
                    className="w-full py-3.5 rounded-full border-2 border-gray-200 text-gray-400 font-black text-sm text-center cursor-default bg-gray-50"
                  >
                    Gói hiện tại của bạn
                  </button>
                </div>
              </div>

              {/* PREMIUM PLAN */}
              <div className="bg-white rounded-3xl border-2 border-amber-500 shadow-2xl p-8 flex flex-col justify-between relative text-left">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-amber-500 text-white font-black text-[9px] uppercase px-4 py-1.5 rounded-full shadow-md tracking-widest">
                  Phổ biến nhất
                </div>
                
                <div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-black uppercase tracking-wider mb-4">
                    <Crown size={10} className="fill-amber-600/10" /> Gói cá nhân Premium
                  </div>
                  <h3 className="text-2xl font-black text-[#1a3d28] tracking-tight">Cognito Premium</h3>
                  
                  <div className="mt-3 mb-6">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-gray-400 line-through">99.000đ</span>
                      <span className="bg-red-100 text-red-600 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                        Giảm 50%
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-black text-[#1a3d28]">49.000đ</span>
                      <span className="text-xs font-bold text-gray-500 mb-1">/ tháng</span>
                    </div>
                  </div>

                  <hr className="border-gray-100 my-5" />

                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 font-bold">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Không giới hạn câu hỏi trợ lý AI</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 font-bold">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Tạo Flashcards tự động chỉ với 1 click</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 font-bold">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Lưu trữ đám mây dung lượng 50GB</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-700 font-bold">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Hỗ trợ ưu tiên 24/7 từ chuyên gia</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  {isPremium ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-3 text-center text-xs font-bold">
                      <div className="flex justify-center items-center gap-1.5">
                        <Check size={14} className="text-emerald-600" />
                        Tài khoản Premium đang bật
                      </div>
                      <div className="text-[10px] text-emerald-600/80 font-semibold mt-1">
                        Ngày gia hạn tiếp theo: {formattedBillingDate}
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={handleUpgradeClick}
                      disabled={loadingUpgrade}
                      className="w-full py-4 rounded-full text-white font-black text-sm text-center shadow-lg transition-all hover:scale-[1.02] active:scale-98 flex justify-center items-center gap-2"
                      style={{ 
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
                      }}
                    >
                      {loadingUpgrade ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Nâng cấp ngay với 49.000đ</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. FAQ SECTION (Accordion dropdown list) */}
        <section className="py-20 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#1a3d28] tracking-tight mb-3">
              Những câu hỏi thường gặp
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">
              Bạn có câu hỏi? Chúng tôi có câu trả lời về gói dịch vụ Cognito Premium.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-extrabold text-sm sm:text-base text-[#1a3d28] tracking-tight pr-4">
                    {faq.q}
                  </span>
                  <div className="shrink-0 text-gray-400">
                    {activeFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-xs sm:text-sm text-gray-500 font-semibold leading-relaxed border-t border-gray-50/60 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
