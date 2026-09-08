"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Clock, Brain, Crown, Medal, 
  Sparkles, ChevronRight, User, Shield, RefreshCw,
  TrendingUp, Award, ArrowLeft, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import RegisterModal from '@/components/auth/RegisterModal';

interface LeaderboardUser {
  rank: number;
  id: number;
  name: string;
  avatar_url?: string;
  role?: string;
  streak: number;
  score: number;
  unit: string;
  total_days_studied?: number;
  total_active_seconds?: number;
  tasks_completed?: number;
  test_sets_count?: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardPage() {
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    triggerMessage,
  } = useStudy();
  const router = useRouter();

  const [category, setCategory] = useState<'streak' | 'quiz' | 'study_time'>('streak');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardUser | null>(null);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/leaderboard?category=${category}&period=${period}&limit=50`, {
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setCurrentUserRank(data.currentUserRank || null);
        setTotalParticipants(data.totalParticipants || 0);
      } else {
        toast.error('Không thể tải bảng xếp hạng lúc này');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [category, period]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const remainingUsers = leaderboard.slice(3);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'streak': return 'Chuỗi Streak 🔥';
      case 'quiz': return 'Điểm Quiz & Bài tập 🧠';
      case 'study_time': return 'Thời gian học tập ⏱️';
      default: return 'Thành tích';
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-gray-900 flex flex-col font-sans pb-28">
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a2e1c]/10 text-[#1a2e1c] text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Bảng Vàng Vinh Danh Toàn Hệ Thống
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1a2e1c] tracking-tight flex items-center gap-2">
              Bảng Xếp Hạng Học Viên
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Vinh danh những nỗ lực học tập và thành tích xuất sắc nhất trên EduShare Cognito.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border-2 border-[#1a2e1c] rounded-xl text-xs font-bold text-[#1a2e1c] shadow-[2px_2px_0px_0px_rgba(26,46,28,1)] flex items-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Filters and Switchers */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-2 border-[#1a2e1c] rounded-2xl p-3 shadow-[4px_4px_0px_0px_rgba(26,46,28,1)] mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setCategory('streak')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                category === 'streak'
                  ? 'bg-[#1a2e1c] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              Chuỗi Streak
            </button>
            <button
              onClick={() => setCategory('quiz')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                category === 'quiz'
                  ? 'bg-[#1a2e1c] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Brain className="w-4 h-4 text-rose-400" />
              Điểm Quiz AI
            </button>
            <button
              onClick={() => setCategory('study_time')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                category === 'study_time'
                  ? 'bg-[#1a2e1c] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-400" />
              Thời Gian Học
            </button>
          </div>

          {/* Period Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto justify-center">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'weekly'
                  ? 'bg-white text-[#1a2e1c] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'monthly'
                  ? 'bg-white text-[#1a2e1c] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setPeriod('all_time')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'all_time'
                  ? 'bg-white text-[#1a2e1c] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Mọi thời đại
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#1a2e1c] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-500">Đang cập nhật dữ liệu bảng xếp hạng...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-20 text-center bg-white border-2 border-[#1a2e1c] rounded-3xl p-8 shadow-[4px_4px_0px_0px_rgba(26,46,28,1)]">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-700">Chưa có dữ liệu cho giai đoạn này</h3>
            <p className="text-xs text-gray-500 mt-1">Hãy là người đầu tiên học tập và ghi danh lên bảng vàng hôm nay!</p>
          </div>
        ) : (
          <>
            {/* ── TOP 3 PODIUM ── */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end mb-10 pt-8">
              {/* RANK 2 - SILVER */}
              {top2 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border-2 border-[#1a2e1c] rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-center shadow-[4px_4px_0px_0px_rgba(26,46,28,1)] relative flex flex-col items-center"
                >
                  <div className="absolute -top-4 bg-slate-200 text-slate-700 border-2 border-[#1a2e1c] font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    🥈 #2 Bạc
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center overflow-hidden mb-2 mt-2">
                    {top2.avatar_url ? (
                      <img src={top2.avatar_url} alt={top2.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base sm:text-xl font-black text-slate-700">{top2.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-800 truncate max-w-full">
                    {top2.name}
                  </h3>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-lg text-xs font-black text-slate-800">
                    {top2.score} {top2.unit}
                  </div>
                </motion.div>
              ) : <div />}

              {/* RANK 1 - GOLD */}
              {top1 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-b from-amber-50 to-white border-3 border-[#1a2e1c] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-[6px_6px_0px_0px_rgba(26,46,28,1)] relative flex flex-col items-center pb-6 z-10"
                >
                  <div className="absolute -top-5 bg-amber-400 text-[#1a2e1c] border-2 border-[#1a2e1c] font-black text-xs sm:text-sm px-3.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Crown className="w-4 h-4 fill-[#1a2e1c]" /> #1 Vô Địch
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 border-3 border-amber-400 flex items-center justify-center overflow-hidden mb-2 mt-3 shadow-md">
                    {top1.avatar_url ? (
                      <img src={top1.avatar_url} alt={top1.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl sm:text-2xl font-black text-amber-800">{top1.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 truncate max-w-full">
                    {top1.name}
                  </h3>
                  <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-amber-100 border border-amber-300 rounded-xl text-xs sm:text-sm font-black text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {top1.score} {top1.unit}
                  </div>
                </motion.div>
              ) : <div />}

              {/* RANK 3 - BRONZE */}
              {top3 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border-2 border-[#1a2e1c] rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-center shadow-[4px_4px_0px_0px_rgba(26,46,28,1)] relative flex flex-col items-center"
                >
                  <div className="absolute -top-4 bg-amber-700/20 text-amber-900 border-2 border-[#1a2e1c] font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    🥉 #3 Đồng
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center overflow-hidden mb-2 mt-2">
                    {top3.avatar_url ? (
                      <img src={top3.avatar_url} alt={top3.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base sm:text-xl font-black text-amber-800">{top3.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-800 truncate max-w-full">
                    {top3.name}
                  </h3>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100/50 rounded-lg text-xs font-black text-amber-900">
                    {top3.score} {top3.unit}
                  </div>
                </motion.div>
              ) : <div />}
            </div>

            {/* ── RANK 4 TO 50 TABLE ── */}
            <div className="bg-white border-2 border-[#1a2e1c] rounded-2xl shadow-[4px_4px_0px_0px_rgba(26,46,28,1)] overflow-hidden">
              <div className="px-5 py-3.5 bg-[#1a2e1c] text-white flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-4">
                  <span className="w-8 text-center">Hạng</span>
                  <span>Học Viên</span>
                </div>
                <span>{getCategoryLabel(category)}</span>
              </div>

              <div className="divide-y divide-gray-100">
                {remainingUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className={`px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors hover:bg-gray-50/80 ${
                      user.isCurrentUser ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span className="w-8 text-center text-xs sm:text-sm font-black text-gray-400">
                        #{user.rank}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gray-600">{user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                            {user.name}
                          </span>
                          {user.isCurrentUser && (
                            <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-md shrink-0">
                              BẠN
                            </span>
                          )}
                          {user.role === 'admin' && (
                            <span className="text-[9px] font-bold bg-[#1a2e1c] text-amber-300 px-1.5 py-0.2 rounded-md shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          {category === 'streak' && `${user.total_days_studied || user.streak} ngày hoạt động`}
                          {category === 'quiz' && `${user.tasks_completed || 0} nhiệm vụ • ${user.test_sets_count || 0} bài test`}
                          {category === 'study_time' && `Chuỗi ${user.streak} ngày streak`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-black text-[#1a2e1c]">
                        {user.score}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 ml-1">
                        {user.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── STICKY CURRENT USER RANK FOOTER ── */}
      {isAuthenticated && currentUserRank && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-3 border-[#1a2e1c] p-3.5 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.06)]">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1a2e1c] text-white flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-xs">
                #{currentUserRank.rank}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-gray-900 truncate">
                    {currentUserRank.name} (Vị trí của bạn)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md shrink-0">
                    Đang hoạt động
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-medium truncate">
                  Tiếp tục học tập hôm nay để thăng hạng trên bảng vàng!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-xs sm:text-base font-black text-[#2d5a3d]">
                  {currentUserRank.score} {currentUserRank.unit}
                </span>
              </div>
              <button
                onClick={() => router.push('/flashcards')}
                className="hidden sm:flex px-3.5 py-2 bg-[#1a2e1c] hover:bg-[#2d5a3d] text-white rounded-xl text-xs font-bold transition-all items-center gap-1 cursor-pointer"
              >
                Học ngay <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal if clicked */}
      <RegisterModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        triggerMessage={triggerMessage}
      />
    </div>
  );
}
