"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Clock, Brain, Crown, Medal, 
  Sparkles, ChevronRight, User, Shield, RefreshCw,
  TrendingUp, Award, ArrowLeft, Star, Zap
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

  const getCategoryTitle = () => {
    switch (category) {
      case 'streak': return 'Chuỗi Streak Bền Bỉ';
      case 'quiz': return 'Điểm Thử Thách & Bài Tập AI';
      case 'study_time': return 'Thời Gian Học Tập Tích Lũy';
    }
  };

  const getCategoryUnitHeader = () => {
    switch (category) {
      case 'streak': return 'Chuỗi Ngày Học';
      case 'quiz': return 'Tổng Điểm Thưởng';
      case 'study_time': return 'Thời Lượng Học';
    }
  };

  return (
    <div className="min-h-screen bg-[#ece8df] text-gray-900 flex flex-col font-sans pb-32">
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Header Banner */}
        <div className="bg-[#1a2e1c] border-3 border-[#0d1a10] rounded-3xl p-6 sm:p-8 text-white shadow-[6px_6px_0px_0px_rgba(13,26,16,1)] mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-black uppercase tracking-wider mb-2 border border-amber-300/20">
                <Trophy className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse" />
                Vinh Danh Học Viên Xuất Sắc
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                Bảng Xếp Hạng Cognito
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/80 font-medium mt-1.5 max-w-xl">
                Bảng vàng vinh danh những cá nhân có sự kiên trì, điểm số quiz và thời lượng học tập dẫn đầu trên toàn hệ thống.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={fetchLeaderboard}
                disabled={loading}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#1a2e1c] border-2 border-[#0d1a10] rounded-2xl text-xs font-black shadow-[3px_3px_0px_0px_rgba(13,26,16,1)] flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Cập nhật dữ liệu
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Control Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-3 border-[#1a2e1c] rounded-2xl p-3 shadow-[5px_5px_0px_0px_rgba(26,46,28,1)] mb-10">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setCategory('streak')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer border-2 ${
                category === 'streak'
                  ? 'bg-[#1a2e1c] text-white border-[#1a2e1c] shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-transparent hover:bg-gray-100'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              Chuỗi Streak
            </button>
            <button
              onClick={() => setCategory('quiz')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer border-2 ${
                category === 'quiz'
                  ? 'bg-[#1a2e1c] text-white border-[#1a2e1c] shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-transparent hover:bg-gray-100'
              }`}
            >
              <Brain className="w-4 h-4 text-rose-400" />
              Điểm Quiz AI
            </button>
            <button
              onClick={() => setCategory('study_time')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer border-2 ${
                category === 'study_time'
                  ? 'bg-[#1a2e1c] text-white border-[#1a2e1c] shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-transparent hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-400" />
              Thời Gian Học
            </button>
          </div>

          {/* Period Tabs */}
          <div className="flex items-center gap-1 bg-[#ece8df] p-1.5 rounded-xl border-2 border-[#1a2e1c]/30 w-full sm:w-auto justify-center">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'weekly'
                  ? 'bg-[#1a2e1c] text-white shadow-xs'
                  : 'text-gray-700 hover:text-black font-semibold'
              }`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'monthly'
                  ? 'bg-[#1a2e1c] text-white shadow-xs'
                  : 'text-gray-700 hover:text-black font-semibold'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setPeriod('all_time')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'all_time'
                  ? 'bg-[#1a2e1c] text-white shadow-xs'
                  : 'text-gray-700 hover:text-black font-semibold'
              }`}
            >
              Mọi thời đại
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#1a2e1c] border-t-amber-400 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-600">Đang tính toán bảng xếp hạng...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-20 text-center bg-white border-3 border-[#1a2e1c] rounded-3xl p-8 shadow-[5px_5px_0px_0px_rgba(26,46,28,1)]">
            <Trophy className="w-14 h-14 text-amber-300 mx-auto mb-3" />
            <h3 className="text-lg font-black text-gray-800">Chưa có dữ liệu trong giai đoạn này</h3>
            <p className="text-xs text-gray-500 mt-1">Hãy bắt đầu một buổi học để ghi danh đầu tiên lên bảng vàng!</p>
          </div>
        ) : (
          <>
            {/* ── 3D PODIUM TOP 3 ── */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end mb-12 pt-8">
              
              {/* ── TOP 2 (SILVER / LEFT) ── */}
              {top2 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border-3 border-[#1a2e1c] rounded-3xl p-3 sm:p-5 text-center shadow-[5px_5px_0px_0px_rgba(26,46,28,1)] relative flex flex-col items-center justify-between min-h-[220px] sm:min-h-[250px]"
                >
                  <div className="absolute -top-4 bg-slate-100 text-slate-800 border-2 border-[#1a2e1c] font-black text-[11px] sm:text-xs px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap">
                    🥈 #2 Bạc
                  </div>
                  
                  <div className="flex flex-col items-center mt-3">
                    <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-slate-100 border-3 border-slate-300 flex items-center justify-center overflow-hidden mb-2 shadow-inner">
                      {top2.avatar_url ? (
                        <img src={top2.avatar_url} alt={top2.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base sm:text-xl font-black text-slate-700">{top2.name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 truncate max-w-full px-1">
                      {top2.name}
                    </h3>
                  </div>

                  <div className="mt-3 w-full">
                    <div className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-slate-900 truncate">
                      {top2.score} {top2.unit}
                    </div>
                  </div>
                </motion.div>
              ) : <div />}

              {/* ── TOP 1 (GOLD / CENTER) ── */}
              {top1 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-b from-amber-50 via-white to-amber-50/50 border-3 border-amber-500 rounded-3xl p-4 sm:p-6 text-center shadow-[7px_7px_0px_0px_#1a2e1c] ring-3 ring-amber-400/30 relative flex flex-col items-center justify-between min-h-[260px] sm:min-h-[300px] z-10 scale-102"
                >
                  <div className="absolute -top-5 bg-amber-400 text-[#1a2e1c] border-2 border-[#1a2e1c] font-black text-xs sm:text-sm px-4 py-1 rounded-full flex items-center gap-1.5 shadow-md shrink-0 whitespace-nowrap animate-bounce">
                    <Crown className="w-4 h-4 fill-[#1a2e1c]" /> #1 Quán Quân
                  </div>

                  <div className="flex flex-col items-center mt-3">
                    <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center overflow-hidden mb-2 shadow-md">
                      {top1.avatar_url ? (
                        <img src={top1.avatar_url} alt={top1.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl sm:text-3xl font-black text-amber-900">{top1.name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900 truncate max-w-full px-1">
                      {top1.name}
                    </h3>
                  </div>

                  <div className="mt-3 w-full">
                    <div className="px-3 py-1.5 bg-amber-400 border-2 border-[#1a2e1c] rounded-xl text-xs sm:text-sm font-black text-[#1a2e1c] shadow-[2px_2px_0px_0px_rgba(26,46,28,1)] flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 fill-[#1a2e1c]" />
                      {top1.score} {top1.unit}
                    </div>
                  </div>
                </motion.div>
              ) : <div />}

              {/* ── TOP 3 (BRONZE / RIGHT) ── */}
              {top3 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border-3 border-[#1a2e1c] rounded-3xl p-3 sm:p-5 text-center shadow-[5px_5px_0px_0px_rgba(26,46,28,1)] relative flex flex-col items-center justify-between min-h-[195px] sm:min-h-[225px]"
                >
                  <div className="absolute -top-4 bg-[#d97706]/20 text-[#78350f] border-2 border-[#1a2e1c] font-black text-[11px] sm:text-xs px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap">
                    🥉 #3 Đồng
                  </div>

                  <div className="flex flex-col items-center mt-3">
                    <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-amber-50 border-3 border-amber-600/40 flex items-center justify-center overflow-hidden mb-2 shadow-inner">
                      {top3.avatar_url ? (
                        <img src={top3.avatar_url} alt={top3.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base sm:text-xl font-black text-amber-900">{top3.name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 truncate max-w-full px-1">
                      {top3.name}
                    </h3>
                  </div>

                  <div className="mt-3 w-full">
                    <div className="px-2 py-1 bg-amber-50 border border-amber-300 rounded-xl text-xs font-black text-amber-900 truncate">
                      {top3.score} {top3.unit}
                    </div>
                  </div>
                </motion.div>
              ) : <div />}

            </div>

            {/* ── RANK TABLE (TOP 4 TO 50) ── */}
            <div className="bg-white border-3 border-[#1a2e1c] rounded-3xl shadow-[6px_6px_0px_0px_rgba(26,46,28,1)] overflow-hidden">
              <div className="px-6 py-4 bg-[#1a2e1c] text-white flex justify-between items-center text-xs font-black uppercase tracking-wider">
                <div className="flex items-center gap-4">
                  <span className="w-10 text-center">Hạng</span>
                  <span>Học Viên</span>
                </div>
                <span>{getCategoryUnitHeader()}</span>
              </div>

              <div className="divide-y-2 divide-gray-100">
                {remainingUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className={`px-5 sm:px-6 py-4 flex items-center justify-between transition-colors hover:bg-amber-50/40 ${
                      user.isCurrentUser ? 'bg-emerald-50/80 border-l-6 border-emerald-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span className="w-10 text-center text-xs sm:text-sm font-black text-gray-500 shrink-0">
                        #{user.rank}
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-gray-100 border-2 border-[#1a2e1c]/30 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-black text-gray-700">{user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-gray-900 truncate">
                            {user.name}
                          </span>
                          {user.isCurrentUser && (
                            <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-lg shrink-0">
                              BẠN
                            </span>
                          )}
                          {user.role === 'admin' && (
                            <span className="text-[10px] font-bold bg-[#1a2e1c] text-amber-300 px-2 py-0.5 rounded-lg shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                          {category === 'streak' && `${user.total_days_studied || user.streak} ngày đã hoàn thành`}
                          {category === 'quiz' && `${user.tasks_completed || 0} nhiệm vụ • ${user.test_sets_count || 0} bài test`}
                          {category === 'study_time' && `Chuỗi ${user.streak} ngày streak`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black text-[#1a2e1c]">
                        {user.score}
                      </span>
                      <span className="text-xs font-bold text-gray-500 ml-1">
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
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-3 border-[#1a2e1c] p-3.5 z-40 shadow-[0_-5px_15px_rgba(26,46,28,0.12)]">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1a2e1c] text-amber-300 border-2 border-[#1a2e1c] flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-sm">
                #{currentUserRank.rank}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-gray-900 truncate">
                    {currentUserRank.name} (Vị trí của bạn)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg shrink-0">
                    Đang hoạt động
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-medium truncate">
                  Tiếp tục duy trì học tập hôm nay để thăng hạng bảng vàng!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-sm sm:text-lg font-black text-[#2d5a3d]">
                  {currentUserRank.score} {currentUserRank.unit}
                </span>
              </div>
              <button
                onClick={() => router.push('/flashcards')}
                className="hidden sm:flex px-4 py-2 bg-[#1a2e1c] hover:bg-[#2d5a3d] text-white rounded-xl text-xs font-black transition-all items-center gap-1.5 cursor-pointer shadow-sm active:translate-y-0.5"
              >
                Học ngay <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <RegisterModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        triggerMessage={triggerMessage}
      />
    </div>
  );
}
