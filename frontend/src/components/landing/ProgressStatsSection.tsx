"use client";

import { motion } from "framer-motion";
import { Clock, Flame, Target } from "lucide-react";

export function ProgressStatsSection() {
  return (
    <section id="progress-stats" className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f5f3ee 0%, #ebe7de 100%)" }}>
      {/* Background elegant dots pattern */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ 
          backgroundImage: "radial-gradient(#1a3d28 1.5px, transparent 1.5px)", 
          backgroundSize: "28px 28px" 
        }} 
      />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ color: "#1a3d28" }}>
            HỆ THỐNG THEO DÕI TIẾN TRÌNH
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "#0d1a14", fontFamily: "'Playfair Display', serif" }}>
            Hệ thống Bento theo dõi bài học
          </h2>
          <p style={{ color: "#4a5a52" }}>
            Xem tiến độ phân tích chi tiết được gói gọn trong thiết kế thẻ lưới tối giản và đẹp mắt.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Card 1: Hour Metrics (Left) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-4 bg-white border-2 border-[#1a3d28] rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a3d28] flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Thời gian học tập</span>
              <h3 className="text-[#1a3d28] text-xl font-bold flex items-center gap-1.5">
                <Clock size={18} className="text-[#1a3d28]" /> 12h 45m
              </h3>
            </div>
            <div className="py-6 flex justify-center">
              {/* Animated Progress Circle */}
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" stroke="#f1f5f9" />
                  <motion.circle 
                    cx="50" cy="50" r="40" fill="none" strokeWidth="8" stroke="#1a3d28" 
                    strokeDasharray="251" 
                    initial={{ strokeDashoffset: 251 }}
                    whileInView={{ strokeDashoffset: 62 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-[#1a3d28] leading-none">75%</span>
                  <span className="text-[8px] text-[#1a3d28]/60 font-bold uppercase tracking-wider mt-0.5">Target</span>
                </div>
              </div>
            </div>
            <span className="text-xs text-[#1a3d28]/70 font-semibold block text-center">Mục tiêu học 15 giờ trong tuần này</span>
          </motion.div>

          {/* Card 2 & 3: Streaks and Mastery (Right/Bento Columns) */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Streak card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-amber-50 border-2 border-[#1a3d28] rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a3d28] flex flex-col justify-between relative overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="absolute top-2 right-2 text-amber-200 scale-150">
                <Flame size={72} strokeWidth={1} fill="currentColor" className="opacity-20" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">Học liên tục</span>
                <h3 className="text-amber-900 text-4xl font-extrabold flex items-baseline gap-1.5">
                  12 <span className="text-xs font-semibold text-amber-700">ngày liên tiếp</span>
                </h3>
              </div>
              <div className="flex gap-1.5 mt-6 z-10">
                {[...Array(7)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      i < 5 ? "bg-amber-400 text-amber-900 shadow-sm border-2 border-[#1a3d28]" : "bg-slate-200 text-slate-400 border-2 border-slate-300"
                    }`}
                  >
                    {i === 4 ? "🔥" : i + 1}
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-amber-900/70 font-semibold block mt-2">Duy trì ôn tập mỗi ngày để củng cố trí nhớ!</span>
            </motion.div>

            {/* Target Mastery card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#1a3d28] text-[#f5f3ee] border-2 border-[#1a3d28] rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(26,61,40,0.5)] flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200"
            >
              <div>
                <span className="text-[10px] opacity-75 uppercase tracking-widest block mb-1">Mức độ thông thạo</span>
                <h3 className="text-xl font-bold flex items-center gap-1.5">
                  <Target size={18} className="text-emerald-300" />
                  Đạt 92% Thẻ
                </h3>
              </div>
              <div className="py-4 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Giải tích 12</span>
                  <span>95%</span>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "95%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-emerald-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs font-bold pt-2">
                  <span>Toán học Đại cương</span>
                  <span>80%</span>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "80%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-emerald-400 rounded-full"
                  />
                </div>
              </div>
              <span className="text-[10px] text-white/50 block">Được phân tích từ kết quả đánh giá Flashcard</span>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}
