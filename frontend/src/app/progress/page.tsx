"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Target, Clock, BookOpen, Layers, HelpCircle,
  Plus, Trash2, CheckCircle2, TrendingUp, Calendar, Award,
  Sparkles, RefreshCw, AlertCircle, X, ChevronRight, Activity,
  BarChart3, CheckCircle, FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import RegisterModal from '@/components/auth/RegisterModal';
import { progressService, ProgressSummary, LearningGoal } from '@/services/progress.service';

const TARGET_TYPE_LABELS: Record<string, { label: string; unit: string; icon: any; color: string }> = {
  study_time_minutes: { label: 'Thời gian học tập', unit: 'phút', icon: Clock, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  quizzes_completed: { label: 'Luyện đề trắc nghiệm', unit: 'bài thi', icon: HelpCircle, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  flashcards_reviewed: { label: 'Ôn tập Flashcards', unit: 'thẻ', icon: Layers, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  documents_read: { label: 'Đọc tài liệu', unit: 'tài liệu', icon: BookOpen, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
};

const ACTIVITY_TYPE_LABELS: Record<string, { label: string; icon: any; badgeClass: string }> = {
  take_quiz: { label: 'Làm bài trắc nghiệm', icon: HelpCircle, badgeClass: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  read_doc: { label: 'Đọc tài liệu', icon: BookOpen, badgeClass: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  study_flashcards: { label: 'Ôn tập Flashcards', icon: Layers, badgeClass: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  focus_session: { label: 'Phiên học tập trung', icon: Clock, badgeClass: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  daily_checkin: { label: 'Điểm danh học tập', icon: Flame, badgeClass: 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  create_note: { label: 'Ghi chú tài liệu', icon: FileText, badgeClass: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
};

export default function ProgressPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    triggerMessage,
  } = useStudy();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  // Goal Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalSubject, setGoalSubject] = useState('');
  const [goalTargetType, setGoalTargetType] = useState<'study_time_minutes' | 'quizzes_completed' | 'flashcards_reviewed' | 'documents_read'>('study_time_minutes');
  const [goalTargetValue, setGoalTargetValue] = useState<number>(60);
  const [goalPeriod, setGoalPeriod] = useState<'daily' | 'weekly'>('daily');
  const [savingGoal, setSavingGoal] = useState(false);

  // Filter for activities
  const [activityFilter, setActivityFilter] = useState<'all' | 'take_quiz' | 'read_doc' | 'study_flashcards'>('all');

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await progressService.getSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Error fetching progress summary:', err);
      const errMsg = err.message || 'Lỗi kết nối tới máy chủ khi tải tiến độ';
      setError(errMsg);
      triggerMessage(errMsg, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProgress();
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      triggerMessage('Vui lòng nhập tiêu đề mục tiêu', 'error');
      return;
    }
    if (goalTargetValue <= 0) {
      triggerMessage('Chỉ tiêu mục tiêu phải lớn hơn 0', 'error');
      return;
    }

    try {
      setSavingGoal(true);
      await progressService.createGoal({
        title: goalTitle.trim(),
        subject: goalSubject.trim() || undefined,
        target_type: goalTargetType,
        target_value: goalTargetValue,
        period: goalPeriod,
      });

      triggerMessage('Tạo mục tiêu học tập thành công 🎉', 'success');
      setIsModalOpen(false);
      setGoalTitle('');
      setGoalSubject('');
      setGoalTargetValue(60);
      await fetchProgress();
    } catch (err: any) {
      triggerMessage(err.message || 'Lỗi tạo mục tiêu', 'error');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục tiêu học tập này không?')) return;
    try {
      await progressService.deleteGoal(id);
      triggerMessage('Đã xóa mục tiêu học tập', 'success');
      await fetchProgress();
    } catch (err: any) {
      triggerMessage(err.message || 'Lỗi xóa mục tiêu', 'error');
    }
  };

  const handleQuickCreate = async (title: string, subject: string, targetType: any, targetValue: number) => {
    try {
      setSavingGoal(true);
      await progressService.createGoal({
        title,
        subject: subject || undefined,
        target_type: targetType,
        target_value: targetValue,
        period: 'daily',
      });
      triggerMessage('Đã thêm mục tiêu học tập nhanh 🎉', 'success');
      await fetchProgress();
    } catch (err: any) {
      triggerMessage(err.message || 'Lỗi thêm mục tiêu', 'error');
    } finally {
      setSavingGoal(false);
    }
  };

  // Calendar Heatmap calculation (6 weeks = 42 cells)
  const renderCalendarCells = () => {
    const today = new Date();
    const toLocalDateStr = (d: Date) => {
      const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
      const year = vnTime.getUTCFullYear();
      const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(vnTime.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = toLocalDateStr(today);
    const studyDates = summary?.streak?.studyDates || [];

    const daysSinceMonday = (today.getDay() + 6) % 7;
    const gridStart = new Date(today);
    gridStart.setDate(today.getDate() - daysSinceMonday - 35);

    return Array.from({ length: 42 }, (_, i) => {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + i);
      const cellStr = toLocalDateStr(cellDate);
      const hasStudied = studyDates.includes(cellStr);

      if (cellStr === todayStr) {
        return (
          <div
            key={i}
            title={`Hôm nay (${cellStr}): ${hasStudied ? 'Đã học 🔥' : 'Chưa học'}`}
            className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold ring-2 ring-[#1a2e1c] dark:ring-emerald-500 ${
              hasStudied ? 'bg-[#1a2e1c] dark:bg-emerald-700 text-white shadow-sm' : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
            }`}
          >
            {hasStudied ? '🔥' : '!'}
          </div>
        );
      }

      if (cellDate > today) {
        return (
          <div
            key={i}
            title={`Ngày tương lai (${cellStr})`}
            className="aspect-square rounded-lg border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20"
          />
        );
      }

      return (
        <div
          key={i}
          title={`Ngày ${cellStr}: ${hasStudied ? 'Đã học' : 'Không có hoạt động'}`}
          className={`aspect-square rounded-lg transition-colors ${
            hasStudied
              ? 'bg-gradient-to-br from-emerald-500 to-[#1a2e1c] text-white flex items-center justify-center text-[10px]'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
          }`}
        >
          {hasStudied ? '✓' : ''}
        </div>
      );
    });
  };

  const filteredActivities = (summary?.recent_activities || []).filter(act => {
    if (activityFilter === 'all') return true;
    return act.activity_type === activityFilter;
  });

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-[#0B0F17] text-[#0d1a14] dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300">
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border-2 border-[#1a2e1c]/20 dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.12)] dark:shadow-none">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1a2e1c]/10 text-[#1a2e1c] border border-[#1a2e1c]/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                <TrendingUp size={13} />
                Tiến độ học tập thật 100%
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
                Múi giờ UTC+7 (Việt Nam)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1a14] dark:text-zinc-100 tracking-tight">
              Tiến độ & Mục tiêu học tập cá nhân
            </h1>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1 max-w-2xl">
              Theo dõi chuỗi ngày học liên tục (Study Streak), tiến độ hoàn thành mục tiêu ngày và toàn bộ nhật ký học tập thực tế từ các module.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 text-sm font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              Làm mới dữ liệu
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                  triggerMessage('Vui lòng đăng nhập để đặt mục tiêu học tập', 'error');
                  return;
                }
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a2e1c] hover:bg-[#2d5a3d] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-bold transition-all shadow-md active:scale-95"
            >
              <Plus size={16} />
              Đặt mục tiêu mới
            </button>
          </div>
        </div>

        {/* Unauthenticated Alert Banner */}
        {!isAuthenticated && (
          <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800/40 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Bạn chưa đăng nhập</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Vui lòng đăng nhập để lưu trữ nhật ký học tập, theo dõi chuỗi ngày học liên tục và đồng bộ tiến độ mục tiêu cá nhân.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#1a2e1c] hover:bg-[#2d5a3d] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold shrink-0 transition-all shadow-sm"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && !summary && (
          <div className="mb-8 p-6 bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-800/40 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Không thể tải dữ liệu tiến độ</h3>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shrink-0 transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Thử lại
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !summary ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 flex flex-col justify-between">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800 rounded" />
                  <div className="h-8 w-24 bg-gray-200 dark:bg-zinc-800 rounded mt-2" />
                </div>
              ))}
            </div>
            <div className="h-48 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 flex flex-col justify-between">
              <div className="h-4 w-48 bg-gray-200 dark:bg-zinc-800 rounded" />
              <div className="h-24 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-72 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="h-4 w-56 bg-gray-200 dark:bg-zinc-800 rounded mb-4" />
                <div className="h-48 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl" />
              </div>
              <div className="h-72 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="h-4 w-40 bg-gray-200 dark:bg-zinc-800 rounded mb-4" />
                <div className="h-48 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top 5 Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {/* Streak Card */}
          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-zinc-900 p-5 rounded-2xl border-2 border-orange-200 dark:border-orange-900/50 shadow-[3px_3px_0px_0px_rgba(249,115,22,0.15)] dark:shadow-none flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Chuỗi Streak</span>
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Flame size={18} className="fill-orange-500" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-orange-600 dark:text-orange-400">
                  {summary?.streak?.currentStreak || 0}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">ngày liên tục</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                Kỷ lục: <strong className="text-gray-700 dark:text-zinc-300">{summary?.streak?.longestStreak || 0} ngày</strong> • {summary?.streak?.studiedToday ? '✓ Đã học hôm nay' : '⚡ Chưa học hôm nay'}
              </p>
            </div>
          </div>

          {/* Total Study Time */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border-2 border-[#1a2e1c]/20 dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(26,46,28,0.08)] dark:shadow-none flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Thời gian học</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock size={17} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[#0d1a14] dark:text-zinc-100">
                  {summary?.total_study_minutes || 0}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">phút</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                Tương đương {((summary?.total_study_minutes || 0) / 60).toFixed(1)} giờ thực tế
              </p>
            </div>
          </div>

          {/* Quizzes Completed */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border-2 border-[#1a2e1c]/20 dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(26,46,28,0.08)] dark:shadow-none flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Bài trắc nghiệm</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <HelpCircle size={17} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[#0d1a14] dark:text-zinc-100">
                  {summary?.total_quizzes_completed || 0}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">lượt nộp</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                Chấm điểm tự động và lưu lịch sử
              </p>
            </div>
          </div>

          {/* Flashcards Reviewed */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border-2 border-[#1a2e1c]/20 dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(26,46,28,0.08)] dark:shadow-none flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Thẻ Flashcard</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Layers size={17} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[#0d1a14] dark:text-zinc-100">
                  {summary?.total_flashcards_reviewed || 0}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">lượt ôn</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                Lặp lại ngắt quãng SM-2
              </p>
            </div>
          </div>

          {/* Documents Read */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border-2 border-[#1a2e1c]/20 dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(26,46,28,0.08)] dark:shadow-none flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Tài liệu học</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BookOpen size={17} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[#0d1a14] dark:text-zinc-100">
                  {summary?.total_documents_read || 0}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">tài liệu</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                Đã xử lý & học tập trong kho
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Learning Goals */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border-2 border-[#1a2e1c]/20 dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.12)] dark:shadow-none mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Target className="text-[#1a2e1c] dark:text-emerald-400" size={22} />
                <h2 className="text-xl font-bold text-[#0d1a14] dark:text-zinc-100">Mục tiêu học tập cá nhân (Learning Goals)</h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Tiến độ hôm nay được tính tự động từ dữ liệu hoạt động học tập thực tế (Asia/Ho_Chi_Minh).
              </p>
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                  triggerMessage('Vui lòng đăng nhập để đặt mục tiêu học tập', 'error');
                  return;
                }
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a2e1c] dark:text-emerald-400 hover:underline"
            >
              <Plus size={14} /> Thêm mục tiêu mới
            </button>
          </div>

          {summary?.daily_goals && summary.daily_goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.daily_goals.map((goal) => {
                const typeConfig = TARGET_TYPE_LABELS[goal.target_type] || {
                  label: goal.target_type,
                  unit: '',
                  icon: Target,
                  color: 'text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                };
                const IconComponent = typeConfig.icon;

                return (
                  <div
                    key={goal.id}
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      goal.is_completed
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-[#1a2e1c]/40 dark:hover:border-zinc-700 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeConfig.color}`}>
                          <IconComponent size={12} />
                          {typeConfig.label}
                        </span>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          title="Xóa mục tiêu này"
                          className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-base leading-snug line-clamp-1">
                        {goal.title}
                      </h3>
                      {goal.subject && (
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                          Chủ đề: <span className="font-semibold text-gray-700 dark:text-zinc-300">{goal.subject}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="text-gray-500 dark:text-zinc-400 font-medium">
                          Hôm nay: <strong className="text-gray-900 dark:text-zinc-100 font-bold">{goal.current_value}</strong> / {goal.target_value} {typeConfig.unit}
                        </span>
                        <span className={`font-bold ${goal.is_completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#1a2e1c] dark:text-emerald-400'}`}>
                          {goal.progress_percentage}%
                        </span>
                      </div>

                      <div className="w-full h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-gray-200/60 dark:border-zinc-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            goal.is_completed
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                              : 'bg-gradient-to-r from-orange-400 to-[#1a2e1c] dark:to-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-2.5 text-[11px]">
                        <span className="text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                          Chu kỳ: {goal.period === 'weekly' ? 'Hàng tuần' : 'Mỗi ngày'}
                        </span>
                        {goal.is_completed ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 size={13} /> Hoàn thành 🎉
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-zinc-400 font-medium">
                            Còn {Math.max(0, goal.target_value - goal.current_value)} {typeConfig.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-[#fdfcfb] dark:bg-zinc-900/40 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Target size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-zinc-200">Bạn chưa đặt mục tiêu học tập nào</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-5">
                Thiết lập mục tiêu hàng ngày (ví dụ 60 phút học, 2 bài trắc nghiệm) giúp bạn duy trì kỷ luật và nâng cao hiệu quả ôn luyện.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handleQuickCreate('Học 60 phút mỗi ngày', 'Tất cả môn', 'study_time_minutes', 60)}
                  disabled={savingGoal}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:border-[#1a2e1c] dark:hover:border-emerald-500 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all text-gray-700 dark:text-zinc-200 shadow-2xs"
                >
                  ⚡ Mẫu: Học 60 phút/ngày
                </button>
                <button
                  onClick={() => handleQuickCreate('Luyện 2 bài trắc nghiệm', 'Toán học', 'quizzes_completed', 2)}
                  disabled={savingGoal}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:border-[#1a2e1c] dark:hover:border-emerald-500 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all text-gray-700 dark:text-zinc-200 shadow-2xs"
                >
                  ⚡ Mẫu: Luyện 2 bài quiz/ngày
                </button>
                <button
                  onClick={() => handleQuickCreate('Ôn tập 20 thẻ Flashcard', 'Từ vựng', 'flashcards_reviewed', 20)}
                  disabled={savingGoal}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:border-[#1a2e1c] dark:hover:border-emerald-500 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all text-gray-700 dark:text-zinc-200 shadow-2xs"
                >
                  ⚡ Mẫu: Ôn 20 flashcard/ngày
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Weekly Chart & Calendar Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Weekly Minutes Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border-2 border-[#1a2e1c]/20 dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.12)] dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0d1a14] dark:text-zinc-100 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#1a2e1c] dark:text-emerald-400" />
                  Thời lượng học tập 7 ngày gần nhất
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Thống kê số phút học thực tế ghi nhận từ mọi hoạt động của bạn.
                </p>
              </div>
            </div>

            <div className="h-64 w-full pt-4">
              {summary?.weekly_chart && summary.weekly_chart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.weekly_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="progressMinutesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} unit="m" />
                    <Tooltip
                      formatter={(val: any) => [`${val} phút`, 'Thời gian học']}
                      labelFormatter={(lbl: any, items: any) => {
                        const item = items?.[0]?.payload;
                        return item ? `${lbl} (${item.date}) - ${item.quizzes_count || 0} bài quiz` : lbl;
                      }}
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#f4f4f5' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#progressMinutesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-zinc-500">
                  Chưa có dữ liệu học tập trong tuần này
                </div>
              )}
            </div>
          </div>

          {/* Streak 6-week Calendar Heatmap (1 col) */}
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border-2 border-[#1a2e1c]/20 dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.12)] dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-[#0d1a14] dark:text-zinc-100 flex items-center gap-2">
                  <Flame size={20} className="text-orange-500 fill-orange-500" />
                  Lịch điểm danh (6 tuần)
                </h2>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                  {summary?.streak?.currentStreak || 0} ngày liên tiếp
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
                Mỗi ô tương ứng một ngày. Hoàn thành bài quiz, đọc tài liệu hoặc ôn flashcard để giữ chuỗi!
              </p>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-gray-400 dark:text-zinc-500 mb-1.5">
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span>CN</span>
              </div>

              {/* 42 Calendar Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {renderCalendarCells()}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-gray-200 dark:bg-zinc-700 inline-block" /> Chưa học
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1a2e1c] dark:bg-emerald-600 inline-block" /> Đã học
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-100 dark:bg-orange-950/50 border border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400 font-bold inline-flex items-center justify-center text-[8px]">!</span> Hôm nay
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Recent Learning Activities Log */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border-2 border-[#1a2e1c]/20 dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.12)] dark:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0d1a14] dark:text-zinc-100 flex items-center gap-2">
                <Activity size={22} className="text-[#1a2e1c] dark:text-emerald-400" />
                Nhật ký hoạt động học tập thực tế (Learning Activities Log)
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Ghi nhận từng hành động học tập thực tế (Idempotent, không trùng lặp, chuẩn xác theo thời gian nộp).
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'take_quiz', label: 'Trắc nghiệm' },
                { id: 'read_doc', label: 'Tài liệu' },
                { id: 'study_flashcards', label: 'Flashcards' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivityFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activityFilter === tab.id
                      ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-xs'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredActivities.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredActivities.map((act) => {
                const config = ACTIVITY_TYPE_LABELS[act.activity_type] || {
                  label: act.activity_type,
                  icon: Activity,
                  badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
                };
                const IconComp = config.icon;
                const d = new Date(act.created_at);
                const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

                return (
                  <div key={act.id} className="py-4 flex items-center justify-between gap-4 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <IconComp size={18} className="text-gray-700 dark:text-zinc-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${config.badgeClass}`}>
                            {config.label}
                          </span>
                          {act.subject && (
                            <span className="text-xs font-semibold text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                              {act.subject}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 truncate">
                          {act.details?.score !== undefined && (
                            <span className="font-semibold text-gray-700 dark:text-zinc-200 mr-2">
                              Điểm: {act.details.score}/{act.details.totalScore || 10} ({act.details.correctCount}/{act.details.totalQuestions} câu đúng)
                            </span>
                          )}
                          {act.details?.source === 'backfill' && (
                            <span className="text-gray-400 dark:text-zinc-500 italic mr-2">(Dữ liệu đồng bộ lịch sử)</span>
                          )}
                          Thời điểm: {timeStr}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {act.duration_seconds > 0 ? (
                        <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                          ⏱ {Math.round(act.duration_seconds / 60)} phút ({act.duration_seconds}s)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Hoàn tất</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-3">
                <Activity size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-700 dark:text-zinc-300">Chưa có nhật ký hoạt động nào</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                Khi bạn làm bài kiểm tra, ôn thẻ flashcard hoặc đọc tài liệu, toàn bộ hành trình sẽ được ghi nhận tại đây.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => router.push('/ai-test')}
                  className="px-4 py-2 rounded-xl bg-[#1a2e1c] hover:bg-[#2d5a3d] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold transition-all"
                >
                  Làm bài kiểm tra ngay
                </button>
                <button
                  onClick={() => router.push('/library')}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-bold transition-all"
                >
                  Mở kho tài liệu
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </main>

      {/* Goal Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#1a2e1c]/10 dark:bg-emerald-950/40 text-[#1a2e1c] dark:text-emerald-400 flex items-center justify-center">
                    <Target size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Thiết lập mục tiêu học tập mới</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Tiêu đề mục tiêu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Học Java 60 phút mỗi ngày"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#1a2e1c] dark:focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Chủ đề / Môn học (tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Java, Toán học, Tiếng Anh (để trống nếu áp dụng mọi môn)"
                    value={goalSubject}
                    onChange={(e) => setGoalSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#1a2e1c] dark:focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Loại chỉ tiêu <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={goalTargetType}
                      onChange={(e) => setGoalTargetType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#1a2e1c] dark:focus:ring-emerald-500 text-xs font-medium"
                    >
                      <option value="study_time_minutes">Thời gian học (phút)</option>
                      <option value="quizzes_completed">Bài thi trắc nghiệm (bài)</option>
                      <option value="flashcards_reviewed">Ôn tập Flashcards (thẻ)</option>
                      <option value="documents_read">Đọc tài liệu (tài liệu)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Chỉ tiêu cần đạt <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={goalTargetValue}
                      onChange={(e) => setGoalTargetValue(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#1a2e1c] dark:focus:ring-emerald-500 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Chu kỳ lặp lại
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGoalPeriod('daily')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        goalPeriod === 'daily'
                          ? 'border-[#1a2e1c] dark:border-emerald-600 bg-[#1a2e1c]/5 dark:bg-emerald-950/30 text-[#1a2e1c] dark:text-emerald-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Mỗi ngày (Daily)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalPeriod('weekly')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        goalPeriod === 'weekly'
                          ? 'border-[#1a2e1c] dark:border-emerald-600 bg-[#1a2e1c]/5 dark:bg-emerald-950/30 text-[#1a2e1c] dark:text-emerald-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Mỗi tuần (Weekly)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={savingGoal}
                    className="px-5 py-2.5 rounded-xl bg-[#1a2e1c] hover:bg-[#2d5a3d] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {savingGoal ? 'Đang lưu...' : 'Tạo mục tiêu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginModal && (
          <RegisterModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            triggerMessage={triggerMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
