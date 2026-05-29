"use client";

import React, { useState } from 'react';
import { useStudy } from '../../../context/StudyContext';

export default function SettingsPage() {
  const { activeUser, triggerMessage } = useStudy();
  const [name, setName] = useState(activeUser.name);
  const [email, setEmail] = useState(activeUser.email);
  const [srsInterval, setSrsInterval] = useState('6');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerMessage("Đã lưu cấu hình tài khoản thành công!");
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-lg font-black text-[#0D2B24] tracking-tight">Cấu hình Hệ thống</h2>
        <p className="text-xs text-[#0D2B24]/50 font-semibold mt-0.5">Quản lý cài đặt tài khoản học tập và tham số ghi nhớ của bạn.</p>
      </div>

      <div className="bg-white border border-[#0D2B24]/10 rounded-3xl p-6.5 shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          <h3 className="text-xs font-black text-[#0D2B24] uppercase tracking-wider border-b border-[#0D2B24]/5 pb-2">Thông tin Cá nhân</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Họ và Tên</label>
              <input 
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Email</label>
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition"
              />
            </div>
          </div>

          <h3 className="text-xs font-black text-[#0D2B24] uppercase tracking-wider border-b border-[#0D2B24]/5 pb-2 pt-4">Tham số Spaced Repetition (SRS)</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Khoảng cách lặp mặc định cho mức Tốt (Good)</label>
              <select
                value={srsInterval}
                onChange={e => setSrsInterval(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition"
              >
                <option value="4">4 ngày</option>
                <option value="6">6 ngày (Khuyên dùng)</option>
                <option value="8">8 ngày</option>
                <option value="10">10 ngày</option>
              </select>
              <p className="text-[10px] text-[#0D2B24]/40 font-semibold mt-1">
                Thuật toán SuperMemo SM-2 sẽ tự động nhân tỉ lệ dựa trên phản hồi của bạn.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#0D2B24]/10 flex justify-end">
            <button
              type="submit"
              className="bg-[#0D2B24] text-white font-black text-xs px-6 py-3 rounded-xl hover:bg-[#0D2B24]/90 transition shadow-sm"
            >
              Lưu cấu hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
