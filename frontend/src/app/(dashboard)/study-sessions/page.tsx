"use client";

import React from 'react';
import { useStudy } from '../../../context/StudyContext';

export default function StudySessionsPage() {
  const { analyticsData } = useStudy();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-black text-[#0D2B24] tracking-tight">Thống kê Học tập & Hiệu suất</h2>
        <p className="text-xs text-[#0D2B24]/50 font-semibold mt-0.5">Biểu đồ tiến trình, thời gian tích lũy và số giờ học tập trung.</p>
      </div>

      {/* Aggregate Widgets */}
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

      {/* Weekly Progress Chart */}
      <div className="bg-white border border-[#0D2B24]/10 rounded-3xl p-6.5 shadow-sm">
        <div className="mb-6">
          <h3 className="text-sm font-black text-[#0D2B24]">Biểu đồ tiến trình tuần này</h3>
          <p className="text-xs text-[#0D2B24]/50 font-semibold mt-0.5">Thời gian học tập trung (phút) được ghi nhận tự động theo ngày.</p>
        </div>

        <div className="space-y-4">
          {(analyticsData.chart_data.length > 0 ? analyticsData.chart_data : [
            { day: 'Thứ 2', minutes: 30 },
            { day: 'Thứ 3', minutes: 45 },
            { day: 'Thứ 4', minutes: 20 },
            { day: 'Thứ 5', minutes: 60 },
            { day: 'Thứ 6', minutes: 15 },
            { day: 'Thứ 7', minutes: 40 },
            { day: 'Chủ Nhật', minutes: 50 },
          ]).map((bar, idx) => (
            <div key={idx} className="flex items-center gap-4 text-xs font-semibold">
              <span className="w-16 text-[#0D2B24]/60 text-left font-bold">{bar.day}</span>
              <div className="flex-1 bg-[#FAF8F5] h-6 rounded-full overflow-hidden border border-[#0D2B24]/10">
                <div 
                  style={{ width: `${Math.min(100, (bar.minutes / 80) * 100)}%` }}
                  className="h-full bg-[#0D2B24] rounded-full flex items-center justify-end pr-2 transition-all duration-500 shadow-sm"
                >
                  <span className="text-[8px] font-black text-white font-sans">{bar.minutes}m</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#0D2B24]/10 pt-5 mt-6 flex justify-between text-[10px] text-[#0D2B24]/40 font-black tracking-wide uppercase">
          <span>MỤC TIÊU HÀNG TUẦN: 350 PHÚT HỌC TẬP</span>
          <span className="text-[#0D2B24]">Đã hoàn thành 75% chỉ tiêu</span>
        </div>
      </div>

    </div>
  );
}
