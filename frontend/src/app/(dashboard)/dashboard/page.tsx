"use client";

import React from 'react';
import { useStudy } from '../../../context/StudyContext';
import Link from 'next/link';

export default function DashboardPage() {
  const {
    activeUser,
    analyticsData,
    documents,
    decks,
    handleOpenWorkspace
  } = useStudy();

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-[#0D2B24] rounded-3xl p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="text-[9px] font-black tracking-wider uppercase text-emerald-400 bg-white/10 px-2.5 py-1 rounded-full">Scholar Dashboard</span>
          <h2 className="text-2xl md:text-3xl font-serif-elegant font-bold leading-tight">
            Chào mừng trở lại, {activeUser.name}!
          </h2>
          <p className="text-xs text-white/70 leading-relaxed max-w-lg">
            Hôm nay bạn đang có chỉ tiêu học tập 50 phút. Hệ thống ghi nhận bạn đã hoàn thành 75% mục tiêu của tuần này. Hãy tiếp tục ôn tập nhé!
          </p>
          <div className="flex gap-3 pt-4">
            <Link 
              href="/flashcards"
              className="bg-white hover:bg-slate-100 text-[#0D2B24] font-black text-xs px-5 py-3 rounded-xl transition shadow-sm"
            >
              Ôn tập Flashcards
            </Link>
            <Link 
              href="/library"
              className="bg-transparent hover:bg-white/5 border border-white/20 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition"
            >
              Thư viện tài liệu
            </Link>
          </div>
        </div>
      </div>

      {/* Aggregate Widgets grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Thời gian học tập', value: `${analyticsData.total_study_minutes} phút`, desc: 'Tích lũy từ tất cả các phiên' },
          { title: 'Số phiên đếm giờ', value: `${analyticsData.total_sessions} phiên`, desc: 'Đã hoàn thành tập trung' },
          { title: 'Tài liệu học tập', value: `${analyticsData.total_documents} tài liệu`, desc: 'Lưu trong thư viện' },
          { title: 'Bộ thẻ Flashcards', value: `${analyticsData.total_flashcards} thẻ`, desc: 'Tự động hóa bằng AI' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-[#0D2B24]/10 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-[#0D2B24]/50 uppercase tracking-wider">{item.title}</p>
            <h3 className="text-2xl font-black text-[#0D2B24] mt-2 leading-none">{item.value}</h3>
            <p className="text-[10px] text-[#0D2B24]/40 mt-2.5 font-semibold leading-none">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Left Recent Docs, Right Quick Due Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Library Documents (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0D2B24] uppercase tracking-wider">Tài liệu mới nhất</h3>
            <Link href="/library" className="text-xs font-bold text-[#0D2B24]/60 hover:text-[#0D2B24]">
              Xem tất cả
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white border border-[#0D2B24]/10 rounded-3xl p-12 text-center text-[#0D2B24]/50 text-xs">
              Thư viện của bạn chưa có tài liệu nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.slice(0, 4).map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-white border border-[#0D2B24]/10 hover:border-[#0D2B24]/20 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[8px] font-black px-2 py-0.5 bg-[#0D2B24]/5 border border-[#0D2B24]/10 rounded-full text-[#0D2B24]/70">
                      {doc.category}
                    </span>
                    <h4 className="text-xs font-bold text-[#0D2B24] mt-2 truncate">{doc.title}</h4>
                    <p className="text-[10px] text-[#0D2B24]/60 mt-1 line-clamp-2 leading-relaxed">
                      {doc.description || 'Chưa có mô tả.'}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-[#0D2B24]/5 mt-4 flex justify-between items-center">
                    <span className="text-[9px] text-[#0D2B24]/40 font-semibold">
                      {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <Link
                      href="/ai-lab"
                      onClick={() => handleOpenWorkspace(doc)}
                      className="text-[#0D2B24] font-black text-[10px] hover:underline"
                    >
                      Bắt đầu học
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: High Priority Review Decks (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0D2B24] uppercase tracking-wider">Cần ôn tập ngay</h3>
            <Link href="/flashcards" className="text-xs font-bold text-[#0D2B24]/60 hover:text-[#0D2B24]">
              Xem tất cả
            </Link>
          </div>

          {decks.length === 0 ? (
            <div className="bg-white border border-[#0D2B24]/10 rounded-3xl p-12 text-center text-[#0D2B24]/50 text-xs">
              Chưa có bộ thẻ ghi nhớ nào được tạo.
            </div>
          ) : (
            <div className="space-y-4">
              {decks.slice(0, 3).map((deck) => (
                <div 
                  key={deck.id}
                  className="bg-white border border-[#0D2B24]/10 hover:border-[#0D2B24]/20 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm group"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#0D2B24] truncate">{deck.name}</h4>
                    <p className="text-[10px] text-[#0D2B24]/50 mt-0.5">
                      {deck.id % 2 === 0 ? '🔥 42 thẻ cần ôn tập' : '✅ Đã hoàn thành'}
                    </p>
                  </div>
                  <Link
                    href="/flashcards"
                    className="p-2 bg-[#FAF8F5] group-hover:bg-[#0D2B24] text-[#0D2B24] group-hover:text-white rounded-xl border border-[#0D2B24]/10 group-hover:border-[#0D2B24] transition-all shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
