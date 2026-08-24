"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Zap, Shield, Crown, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PremiumPreviewPage() {
  const [loadingDemo, setLoadingDemo] = useState(false);

  const features = [
    { text: "Không giới hạn câu hỏi trợ lý AI", icon: <Sparkles size={16} className="text-amber-500 animate-pulse" /> },
    { text: "Tạo Flashcards tự động từ tài liệu", icon: <Zap size={16} className="text-amber-500" /> },
    { text: "Lưu trữ đám mây lên đến 50GB", icon: <Shield size={16} className="text-amber-500" /> },
    { text: "Hỗ trợ ưu tiên 24/7 từ chuyên gia", icon: <Crown size={16} className="text-amber-500" /> }
  ];

  // Calculate next billing date
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);
  const formattedBillingDate = nextBillingDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#0d1a14] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Crown size={16} className="text-amber-600 fill-amber-500/10" />
            <span className="text-xs font-black text-amber-700 uppercase tracking-widest">Premium Preview Mode</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1a3d28] tracking-tight">
            So sánh Giao diện Premium
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base font-medium max-w-xl mx-auto">
            Xem trước giao diện của Pop-up Premium ở trạng thái Chưa mua (quảng cáo 49K) và Đã mua (kích hoạt quyền lợi) được hiển thị song song.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link 
              href="/library" 
              className="inline-flex items-center gap-1 text-xs font-black text-[#1a3d28] hover:underline"
            >
              Quay lại thư viện <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Side by Side Display Container */}
        <div className="grid md:grid-cols-2 gap-8 items-start justify-center max-w-4xl mx-auto">
          
          {/* 1. CHƯA MUA (NORMAL USER VIEW) */}
          <div className="flex flex-col items-center">
            <div className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Trạng thái: Chưa mua (Normal User)
            </div>
            
            <div className="w-full overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200/80 relative">
              <div className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/80 bg-black/10 hover:bg-black/20 transition-colors cursor-pointer">
                <X size={16} />
              </div>

              {/* Header */}
              <div className="bg-gradient-to-br from-[#1a3d28] to-[#2c6e49] px-6 pt-10 pb-8 text-center relative overflow-hidden">
                <div className="absolute -top-4 -right-4 p-4 opacity-10 rotate-12">
                  <Crown size={140} />
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30">
                    <Crown size={28} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black text-white mb-1 tracking-tight">Nâng cấp Premium</h2>
                  <p className="text-emerald-100/90 text-xs font-medium">Trải nghiệm không giới hạn AI, lưu trữ và hơn thế nữa.</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-[#f5f3ee] rounded-xl p-5 border border-amber-100 shadow-sm mb-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600" />
                  <h3 className="text-xs font-black text-[#0d1a14] uppercase tracking-wider mb-4">Quyền lợi đặc quyền</h3>
                  <ul className="space-y-3">
                    {features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <div className="w-5.5 h-5.5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Special Promotion Pricing */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 mb-5 flex flex-col items-center relative overflow-hidden">
                  <div className="absolute -top-2 -right-6 bg-red-500 text-white font-black text-[8px] uppercase px-6 py-1.5 rotate-12 shadow-sm tracking-wider">
                    Ưu đãi lớn
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400 line-through">99.000 VNĐ</span>
                    <span className="bg-red-100 text-red-600 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                      Tiết kiệm 50%
                    </span>
                  </div>
                  <div className="flex items-end justify-center gap-1.5">
                    <span className="text-2xl font-black text-[#1a3d28] tracking-tight">49.000</span>
                    <span className="text-xs font-bold text-gray-500 mb-1">VNĐ / tháng</span>
                  </div>
                  <p className="text-[9px] text-amber-700 font-bold mt-1.5">Áp dụng duy nhất trong tháng này</p>
                </div>

                <button
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all flex justify-center items-center gap-2 cursor-default"
                  style={{ 
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
                  }}
                >
                  <Sparkles size={16} className="animate-pulse" />
                  Nâng cấp ngay với 49K
                </button>
                
                <p className="text-center text-[10px] text-gray-400 mt-4 font-semibold">
                  Bạn có thể hủy bất kỳ lúc nào. Không phí ẩn.
                </p>
              </div>
            </div>
          </div>

          {/* 2. ĐÃ MUA (PREMIUM ACTIVE VIEW) */}
          <div className="flex flex-col items-center">
            <div className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Trạng thái: Đã kích hoạt (Premium User)
            </div>

            <div className="w-full overflow-hidden rounded-2xl bg-white shadow-xl border border-emerald-200/80 relative">
              <div className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/80 bg-black/10 hover:bg-black/20 transition-colors cursor-pointer">
                <X size={16} />
              </div>

              {/* Header */}
              <div className="bg-gradient-to-br from-[#1a3d28] to-[#122c1d] px-6 pt-10 pb-8 text-center relative overflow-hidden">
                <div className="absolute -top-4 -right-4 p-4 opacity-15 rotate-12 text-amber-400">
                  <Crown size={140} className="fill-amber-400/20" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center mb-3 shadow-xl border-2 border-white/50 animate-bounce">
                    <Crown size={32} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black text-white mb-1 tracking-tight flex items-center gap-2">
                    Premium Active
                  </h2>
                  <div className="bg-amber-500/20 border border-amber-500/30 px-3 py-0.5 rounded-full text-amber-300 text-[10px] font-black uppercase tracking-widest mt-1">
                    Đã sở hữu
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-[#f5f3ee] rounded-xl p-5 border border-emerald-100 shadow-sm mb-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <h3 className="text-xs font-black text-[#0d1a14] uppercase tracking-wider mb-4 text-emerald-700">Quyền lợi đang hoạt động</h3>
                  <ul className="space-y-3">
                    {features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <div className="w-5.5 h-5.5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Package Details */}
                <div className="bg-[#f5f3ee] rounded-xl p-5 border border-gray-200/60 shadow-sm mb-5">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Thông tin gói đăng ký</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-500">Giá gói:</span>
                      <span className="font-black text-[#1a3d28]">49.000 VNĐ / tháng</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-2.5">
                      <span className="font-bold text-gray-500 flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        Ngày gia hạn tiếp:
                      </span>
                      <span className="font-black text-gray-800">{formattedBillingDate}</span>
                    </div>
                  </div>
                </div>

                <button
                  className="w-full py-3 rounded-xl bg-[#1a3d28] text-white font-bold text-sm transition-all flex justify-center items-center gap-2 cursor-default"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
