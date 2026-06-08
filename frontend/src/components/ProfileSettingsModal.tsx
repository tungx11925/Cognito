"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStudy } from '../context/StudyContext';
import { 
  User, Mail, Shield, Calendar, Edit3, Save, 
  Clock, BookOpen, CreditCard, Award, X,
  Bell, Brain
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center"
      style={{
        background: value ? "#1a3d28" : "#e5e7eb",
        justifyContent: value ? "flex-end" : "flex-start",
      }}
    >
      <motion.div
        layout
        className="w-4.5 h-4.5 rounded-full bg-white shadow-sm"
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export function ProfileSettingsModal() {
  const { 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    profileModalTab, 
    setProfileModalTab,
    activeUser, 
    setActiveUser, 
    triggerMessage, 
    analyticsData 
  } = useStudy();

  const [name, setName] = useState(activeUser?.name || '');
  const [email, setEmail] = useState(activeUser?.email || '');
  const [role, setRole] = useState(activeUser?.role || 'student');
  const [createdAt, setCreatedAt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Settings tab states
  const [notifs, setNotifs] = useState({ daily: true, streak: true, newCards: false });
  const [algo, setAlgo] = useState({ ai: true, adaptive: true });

  // Sync state with activeUser when modal opens
  useEffect(() => {
    if (isProfileModalOpen && activeUser) {
      setName(activeUser.name || '');
      setEmail(activeUser.email || '');
      setRole(activeUser.role || 'student');
      
      const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
          if (res.ok) {
            const data = await res.json();
            setName(data.name || '');
            setEmail(data.email || '');
            setRole(data.role || 'student');
            if (data.created_at) {
              const date = new Date(data.created_at);
              setCreatedAt(date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }));
            }
          } else {
            setCreatedAt('Tháng 1 năm 2026');
          }
        } catch (e) {
          setCreatedAt('Tháng 1 năm 2026');
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [isProfileModalOpen, activeUser]);

  if (!isProfileModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      triggerMessage("Vui lòng điền đầy đủ họ tên và email", "error");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name, email })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role
        });
        triggerMessage("Cập nhật thông tin tài khoản thành công!", "success");
        setIsEditing(false);
      } else {
        const errData = await res.json();
        triggerMessage(errData.error || "Không thể cập nhật hồ sơ", "error");
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối máy chủ", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getRank = (minutes: number) => {
    if (minutes >= 500) return { title: 'Học giả Uyên bác', color: '#b45309', bg: '#fef3c7' };
    if (minutes >= 200) return { title: 'Trí thức Tiên phong', color: '#1d4ed8', bg: '#dbeafe' };
    return { title: 'Học viên Chăm chỉ', color: '#047857', bg: '#d1fae5' };
  };

  const rank = getRank(analyticsData.total_study_minutes || 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsProfileModalOpen(false)}
        className="absolute inset-0 bg-[#0D2B24]/40 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row max-h-[90vh] z-10 text-left"
      >
        {/* Close Button */}
        <button 
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-20 p-1 rounded-lg hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        {/* Sidebar Left: User Basic Info & Tabs */}
        <div className="w-full md:w-80 bg-[#FAF8F5] p-6 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between">
          <div className="space-y-6">
            {/* User Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="w-18 h-18 rounded-full flex items-center justify-center text-white mb-3 font-bold text-2xl shadow-sm"
                style={{ background: "linear-gradient(135deg, #1a3d28, #2a5c3e)" }}>
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h3 className="font-bold text-gray-900 leading-snug">{name || 'Đang tải...'}</h3>
              <p className="text-xs text-gray-500 truncate w-full max-w-[220px]">{email}</p>
              <div className="px-2.5 py-0.5 mt-2 rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: rank.bg, color: rank.color }}>
                {rank.title}
              </div>
            </div>

            {/* Tabs List */}
            <div className="space-y-1">
              <button 
                onClick={() => setProfileModalTab('profile')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                  profileModalTab === 'profile' 
                    ? 'bg-[#1a3d28] text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User size={14} />
                <span>Trang cá nhân</span>
              </button>

              <button 
                onClick={() => setProfileModalTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                  profileModalTab === 'settings' 
                    ? 'bg-[#1a3d28] text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Brain size={14} />
                <span>Cài đặt hệ thống</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 font-medium text-center mt-6">
            Tham gia vào {createdAt || '...'}
          </div>
        </div>

        {/* Content Right: Tab Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto min-h-[350px]">
          {profileModalTab === 'profile' ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-1">Thông tin cá nhân</h4>
                <p className="text-xs text-gray-400">Xem thống kê kết quả và cập nhật thông tin tài khoản của bạn</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#FAF8F5] rounded-xl p-3 border border-gray-100 text-center">
                  <Clock size={16} className="text-emerald-800 mx-auto mb-1" />
                  <div className="text-base font-black text-gray-800">{analyticsData.total_study_minutes || 0}</div>
                  <div className="text-[9px] text-gray-500 font-semibold">Phút học</div>
                </div>

                <div className="bg-[#FAF8F5] rounded-xl p-3 border border-gray-100 text-center">
                  <Award size={16} className="text-emerald-800 mx-auto mb-1" />
                  <div className="text-base font-black text-gray-800">{analyticsData.total_sessions || 0}</div>
                  <div className="text-[9px] text-gray-500 font-semibold">Phiên học</div>
                </div>

                <div className="bg-[#FAF8F5] rounded-xl p-3 border border-gray-100 text-center">
                  <BookOpen size={16} className="text-emerald-800 mx-auto mb-1" />
                  <div className="text-base font-black text-gray-800">{analyticsData.total_documents || 0}</div>
                  <div className="text-[9px] text-gray-500 font-semibold">Tài liệu</div>
                </div>

                <div className="bg-[#FAF8F5] rounded-xl p-3 border border-gray-100 text-center">
                  <CreditCard size={16} className="text-emerald-800 mx-auto mb-1" />
                  <div className="text-base font-black text-gray-800">{analyticsData.total_flashcards || 0}</div>
                  <div className="text-[9px] text-gray-500 font-semibold">Thẻ nhớ</div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Chi tiết tài khoản</h5>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Edit3 size={11} /> Sửa thông tin
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Họ và Tên</label>
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 focus:border-[#1a3d28] rounded-xl outline-none text-xs text-gray-800 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Email liên hệ</label>
                      <div className="relative">
                        <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 focus:border-[#1a3d28] rounded-xl outline-none text-xs text-gray-800 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3d28] hover:bg-[#1a3d28]/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Save size={11} /> {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setName(activeUser?.name || '');
                          setEmail(activeUser?.email || '');
                          setIsEditing(false);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-[#FAF8F5]/50 p-3 rounded-xl border border-gray-100/30 flex justify-between items-center">
                      <div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">Họ và Tên</div>
                        <div className="text-xs font-semibold text-gray-800 mt-0.5">{name}</div>
                      </div>
                    </div>

                    <div className="bg-[#FAF8F5]/50 p-3 rounded-xl border border-gray-100/30 flex justify-between items-center">
                      <div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">Email liên hệ</div>
                        <div className="text-xs font-semibold text-gray-800 mt-0.5">{email}</div>
                      </div>
                    </div>

                    <div className="bg-[#FAF8F5]/50 p-3 rounded-xl border border-gray-100/30">
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Bản quyền tài khoản</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-gray-600 font-semibold">Tài khoản miễn phí (Scholar Edition)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-1">Cài đặt hệ thống</h4>
                <p className="text-xs text-gray-400">Điều chỉnh cấu hình nhắc nhở và thuật toán học tập AI của bạn</p>
              </div>

              {/* Toggles Sections */}
              <div className="space-y-5">
                {/* Section 1: Notifications */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <Bell size={12} />
                    <span>Thông báo nhắc nhở</span>
                  </div>

                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-gray-800">Nhắc nhở ôn tập hàng ngày</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Nhận thông báo khi có flashcards đến hạn</div>
                      </div>
                      <Toggle value={notifs.daily} onChange={() => setNotifs(prev => ({ ...prev, daily: !prev.daily }))} />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100/60">
                      <div>
                        <div className="text-xs font-semibold text-gray-800">Cảnh báo chuỗi học tập (Streak)</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Thông báo trước khi chuỗi học tập của bạn bị mất</div>
                      </div>
                      <Toggle value={notifs.streak} onChange={() => setNotifs(prev => ({ ...prev, streak: !prev.streak }))} />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100/60">
                      <div>
                        <div className="text-xs font-semibold text-gray-800">Đề xuất thẻ học mới từ AI</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Đề xuất các flashcard hữu ích dựa trên tiến trình của bạn</div>
                      </div>
                      <Toggle value={notifs.newCards} onChange={() => setNotifs(prev => ({ ...prev, newCards: !prev.newCards }))} />
                    </div>
                  </div>
                </div>

                {/* Section 2: SRS Algorithm */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <Brain size={12} />
                    <span>Thuật toán Lặp lại ngắt quãng (SRS)</span>
                  </div>

                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-gray-800">Lên lịch nâng cao bằng AI</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Sử dụng mô hình ML tối ưu thời gian ôn tập</div>
                      </div>
                      <Toggle value={algo.ai} onChange={() => setAlgo(prev => ({ ...prev, ai: !prev.ai }))} />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100/60">
                      <div>
                        <div className="text-xs font-semibold text-gray-800">Độ khó thích ứng tự động</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Tự động tăng/giảm độ khó tùy theo tỷ lệ trả lời đúng</div>
                      </div>
                      <Toggle value={algo.adaptive} onChange={() => setAlgo(prev => ({ ...prev, adaptive: !prev.adaptive }))} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
