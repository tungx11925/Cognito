"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BookOpen, Flame, MapPin, Share2, Star, Target,
  Trophy, GraduationCap, Globe, Users, MessageSquare,
  Award, Layers, FileText, CheckCircle2, Lock, ArrowLeft,
  ShieldAlert, UserX, ExternalLink, HelpCircle, Check,
  Clock, Heart, Bookmark, Eye, Settings
} from "lucide-react";
import { useStudy } from "@/context/StudyContext";
import { Navbar } from "@/components/landing/Navbar";
import { AnimatePresence, motion } from "framer-motion";
import { forkDeck } from "@/services/flashcard.service";
import { safetyService, ReportReason } from "@/services/safety.service";
import toast from "react-hot-toast";

/* ── UI Components ───────────────────────────────────────── */
const Card = ({ children, className = "" }: any) => {
  return (
    <div className={`bg-white rounded-2xl border-2 border-[#1a2e1c]/45 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.16)] overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(26,46,28,0.24)] hover:border-[#1a2e1c]/65 ${className}`}>
      {children}
    </div>
  );
};

const Badge = ({ children, className = "", variant = "default" }: any) => {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold";
  const variants: any = { 
    default: "bg-gray-100 text-gray-800", 
    outline: "border border-gray-200 text-gray-800",
    pro: "bg-[#1a2e1c] text-white",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200"
  };
  return <span className={`${base} ${variants[variant] || ""} ${className}`}>{children}</span>;
};

const Button = ({ children, className = "", size = "default", variant = "default", ...props }: any) => {
  const base = "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 focus:outline-none disabled:opacity-50";
  const sizes: any = { default: "h-10 px-4 py-2 text-sm", sm: "h-8 px-3 text-xs" };
  const variants: any = { 
    default: "bg-[#1a2e1c] text-white hover:bg-[#2d5a3d] shadow-sm", 
    outline: "border-2 border-[#1a2e1c]/25 bg-white hover:bg-gray-50 text-gray-800",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600"
  };
  return <button className={`${base} ${sizes[size] || sizes.default} ${variants[variant] || variants.default} ${className}`} {...props}>{children}</button>;
};

export default function TargetUserProfilePage() {
  const router = useRouter();
  const { userId } = useParams();
  const { isAuthenticated, activeUser, setShowLoginModal } = useStudy();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"resources" | "quizzes" | "decks">("resources");

  // Safety Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('INAPPROPRIATE');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [isBlockingUser, setIsBlockingUser] = useState(false);

  // Redirect to self-profile if target is logged-in user
  useEffect(() => {
    if (activeUser && activeUser.id === parseInt(userId as string, 10)) {
      router.replace("/profile");
    }
  }, [activeUser, userId, router]);

  const fetchTargetProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/users/${userId}/profile`, { headers });
      const data = await res.json();

      if (res.ok) {
        setProfile(data);
        setError(null);
      } else {
        setError(data.error || "Không thể tải thông tin hồ sơ");
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTargetProfile();
    }
  }, [userId]);

  const handleFork = async (deckId: number) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu bộ thẻ!");
      setShowLoginModal(true);
      return;
    }
    try {
      await forkDeck(deckId);
      toast.success("Đã lưu bộ thẻ vào thư viện của bạn!");
      fetchTargetProfile();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu thẻ");
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết hồ sơ vào clipboard!");
    }
  };

  const handleOpenReport = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để gửi báo cáo!");
      setShowLoginModal(true);
      return;
    }
    setReportReason('INAPPROPRIATE');
    setReportDetails('');
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user?.id) return;
    if (reportReason === 'OTHER' && reportDetails.trim().length < 5) {
      toast.error("Vui lòng nhập chi tiết lý do (ít nhất 5 ký tự)");
      return;
    }
    setIsSubmittingReport(true);
    try {
      const res = await safetyService.reportContent(
        'user',
        profile.user.id,
        reportReason,
        reportDetails.trim() || undefined
      );
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Báo cáo người dùng đã được gửi thành công");
        setReportModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi gửi báo cáo");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleOpenBlock = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thực hiện thao tác này!");
      setShowLoginModal(true);
      return;
    }
    setBlockReason('');
    setBlockModalOpen(true);
  };

  const handleConfirmBlock = async () => {
    if (!profile?.user?.id) return;
    setIsBlockingUser(true);
    try {
      const res = await safetyService.blockUser(profile.user.id, blockReason.trim() || undefined);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Đã chặn người dùng ${profile.user.name}. Nội dung của họ sẽ không còn hiển thị.`);
        setBlockModalOpen(false);
        router.push('/community');
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi chặn người dùng");
    } finally {
      setIsBlockingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ebe8e0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1a2e1c] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-semibold">Đang tải hồ sơ học viên...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#ebe8e0] flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Không thể truy cập hồ sơ</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {error || "Tài khoản này có thể không tồn tại hoặc đã bị khóa do quan hệ chặn."}
          </p>
          <Button onClick={() => router.back()} className="w-full font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  // Handle privacy restrictions
  if (profile.isRestricted) {
    const isPrivate = profile.privacy === "private";
    return (
      <div className="min-h-screen bg-[#ebe8e0] flex flex-col items-center justify-center p-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <Navbar
          isLoggedIn={isAuthenticated}
          onSignInClick={() => setShowLoginModal(true)}
          onDashboardClick={() => router.push('/home')}
          activeUser={activeUser!}
        />
        <Card className="max-w-md w-full p-8 text-center space-y-6 mt-16">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border-2 border-amber-200/50 shadow-md">
            <Lock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            {profile.user.avatar_url ? (
              <img src={profile.user.avatar_url} alt={profile.user.name} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-[#1a2e1c]" />
            ) : (
              <div className="w-16 h-16 bg-[#2d5a3d]/20 text-[#2d5a3d] text-lg font-bold rounded-full flex items-center justify-center mx-auto border-2 border-[#2d5a3d]/30">
                {profile.user.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-800">{profile.user.name}</h2>
            {profile.user.headline && (
              <p className="text-xs text-gray-500 font-medium">{profile.user.headline}</p>
            )}
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1.5">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Hồ sơ riêng tư</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Học viên này đã cài đặt hồ sơ ở chế độ Riêng tư. Các tài nguyên chia sẻ và thống kê học tập công khai đã được ẩn.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => router.back()} variant="outline" className="w-full font-bold">
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { user, public_resources = [], public_quizzes = [], public_decks = [], public_stats = {} } = profile;
  const userInitials = user.name.slice(0, 2).toUpperCase();

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })
    : "Gần đây";

  return (
    <div className="min-h-screen bg-[#ebe8e0] pb-16 transition-colors duration-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/home')}
        activeUser={activeUser!}
      />

      <div className="max-w-5xl mx-auto px-4 pt-24 space-y-6">
        
        {/* Profile Info Header Card */}
        <Card className="overflow-hidden">
          <div className="h-36 relative bg-[#1a2e1c]" style={{
            backgroundImage: "radial-gradient(circle at 15% 60%, rgba(74,124,89,0.6) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(106,173,129,0.4) 0%, transparent 50%)",
          }}>
            <button 
              onClick={() => router.back()}
              className="absolute top-4 left-4 bg-white/20 hover:bg-white/35 text-white p-2 rounded-xl backdrop-blur-xs transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="relative shrink-0 -mt-14 z-10">
                  <div className="w-28 h-28 bg-[#2d5a3d] border-4 border-white shadow-xl rounded-2xl flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">{userInitials}</span>
                    )}
                  </div>
                </div>
                <div className="pb-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-gray-900 text-2xl font-bold">{user.name}</h2>
                    {profile.isSelf && (
                      <Badge variant="pro" className="text-xs px-2.5 py-0.5">
                        Hồ sơ của bạn
                      </Badge>
                    )}
                  </div>
                  {user.headline && (
                    <p className="text-sm font-medium text-emerald-800 mt-0.5">{user.headline}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Thành viên từ tháng {joinDate} · @{user.name.toLowerCase().replace(/\s+/g, '')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {profile.isSelf ? (
                  <Button 
                    onClick={() => router.push('/settings')}
                    className="gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Cài đặt hồ sơ
                  </Button>
                ) : (
                  <Button 
                    onClick={() => router.push(`/messages?user=${user.id}`)}
                    className="gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Nhắn tin
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={handleShare}
                  className="gap-1.5"
                  title="Chia sẻ hồ sơ"
                >
                  <Share2 className="w-4 h-4" />
                  Chia sẻ
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handleOpenReport}
                  className="text-gray-500 hover:text-amber-700 hover:bg-amber-50"
                  title="Báo cáo người dùng"
                >
                  <ShieldAlert className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handleOpenBlock}
                  className="text-gray-500 hover:text-red-700 hover:bg-red-50"
                  title="Chặn người dùng"
                >
                  <UserX className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Bio and Website Section */}
            {(user.bio || user.website) && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {user.bio ? (
                  <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-2xl">
                    {user.bio}
                  </p>
                ) : <div />}

                {user.website && (
                  <a 
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#2d5a3d] font-bold hover:underline shrink-0"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{user.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Basic Public Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Tài nguyên", value: public_stats.total_published_resources || 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Trắc nghiệm", value: public_stats.total_public_quizzes || 0, icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Bộ Flashcard", value: public_stats.total_public_decks || 0, icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Lượt thích", value: public_stats.total_likes_received || 0, icon: Heart, color: "text-red-600", bg: "bg-red-50" },
            { label: "Lượt lưu", value: public_stats.total_saves_received || 0, icon: Bookmark, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Chuỗi Streak", value: `${public_stats.streak || user.streak || 0} ngày`, icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-xl border-2 border-[#1a2e1c]/25 p-3 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(26,46,28,0.1)] transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500">{item.label}</span>
                  <div className={`w-6 h-6 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 mt-2">{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* Content Tabs Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-[#1a2e1c]/5 rounded-xl border border-[#1a2e1c]/15 max-w-md">
          {[
            { id: "resources", label: "Tài nguyên học tập", count: public_resources.length, icon: FileText },
            { id: "quizzes", label: "Bài trắc nghiệm", count: public_quizzes.length, icon: Target },
            { id: "decks", label: "Bộ thẻ Flashcard", count: public_decks.length, icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#1a2e1c] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* 1. PUBLIC RESOURCES TAB */}
            {activeTab === "resources" && (
              <div className="space-y-4">
                {public_resources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {public_resources.map((res: any) => (
                      <Card key={res.id} className="p-5 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {res.subject || res.resource_type || "Tài nguyên"}
                            </span>
                            {res.grade_level && (
                              <span className="text-[10px] font-semibold text-gray-400">
                                {res.grade_level}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1 hover:text-[#2d5a3d] transition-colors">
                            {res.title}
                          </h3>
                          <p className="text-xs text-gray-600 font-medium line-clamp-2 mt-1 leading-relaxed">
                            {res.description || "Không có mô tả chi tiết."}
                          </p>
                        </div>

                        <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {res.view_count || 0}</span>
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500" /> {res.like_count || 0}</span>
                            <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-amber-500" /> {res.save_count || 0}</span>
                          </div>
                          <button
                            onClick={() => router.push(`/community`)}
                            className="text-xs font-bold text-[#2d5a3d] hover:underline flex items-center gap-1"
                          >
                            Xem trong cộng đồng <ArrowLeft className="w-3 h-3 rotate-180" />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center space-y-3">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                    <h3 className="text-base font-bold text-gray-800">Chưa có tài nguyên công khai</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Học viên này chưa chia sẻ tài liệu học tập nào vào thư viện cộng đồng.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. PUBLIC QUIZZES TAB */}
            {activeTab === "quizzes" && (
              <div className="space-y-4">
                {public_quizzes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {public_quizzes.map((quiz: any) => (
                      <Card key={quiz.resource_id} className="p-5 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge variant="green" className="text-[10px]">
                              Bài kiểm tra
                            </Badge>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {quiz.question_count || 0} câu hỏi
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                            {quiz.title}
                          </h3>
                          <p className="text-xs text-gray-600 font-medium line-clamp-2 mt-1 leading-relaxed">
                            {quiz.description || "Bộ đề trắc nghiệm chuẩn kiến thức."}
                          </p>

                          <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              <span>Thời gian: <b>{quiz.time_limit_minutes || 15}p</b></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Target className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Điểm đạt: <b>{quiz.passing_score || 80}%</b></span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500" /> {quiz.like_count || 0}</span>
                            <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-amber-500" /> {quiz.save_count || 0}</span>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => router.push(`/quizzes/${quiz.quiz_id}`)}
                            className="gap-1.5"
                          >
                            Luyện tập ngay
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center space-y-3">
                    <Target className="w-12 h-12 text-gray-400 mx-auto" />
                    <h3 className="text-base font-bold text-gray-800">Chưa có bài trắc nghiệm</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Học viên này chưa xuất bản bộ câu hỏi trắc nghiệm nào ra cộng đồng.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. PUBLIC FLASHCARD DECKS TAB */}
            {activeTab === "decks" && (
              <div className="space-y-4">
                {public_decks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {public_decks.map((deck: any) => (
                      <Card key={deck.id} className="p-5 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="default" className="text-[10px]">
                              {deck.card_count || 0} thẻ ghi nhớ
                            </Badge>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                            {deck.title}
                          </h3>
                          <p className="text-xs text-gray-600 font-medium line-clamp-2 mt-1 leading-relaxed">
                            {deck.description || "Bộ flashcards học tập và ôn tập nhanh."}
                          </p>
                        </div>

                        <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleFork(deck.id)}
                            className="gap-1.5"
                          >
                            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                            Lưu vào thư viện
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center space-y-3">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto" />
                    <h3 className="text-base font-bold text-gray-800">Chưa có bộ Flashcards</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Học viên chưa chia sẻ bộ thẻ ghi nhớ công khai nào.
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#1a2e1c]/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Báo cáo người dùng</h3>
                <p className="text-xs text-gray-500">Báo cáo tài khoản: {user.name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Lý do báo cáo</label>
                <select 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-gray-50 font-medium focus:outline-none focus:border-[#1a2e1c]"
                >
                  <option value="INAPPROPRIATE">Nội dung phản cảm, không phù hợp</option>
                  <option value="SPAM">Spam, quảng cáo rác</option>
                  <option value="HARASSMENT">Quấy rối, xúc phạm cá nhân</option>
                  <option value="COPYRIGHT_VIOLATION">Vi phạm bản quyền</option>
                  <option value="FALSE_INFORMATION">Thông tin sai lệch</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Chi tiết vi phạm {reportReason === 'OTHER' && <span className="text-red-500">*</span>}
                </label>
                <textarea 
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Mô tả cụ thể hành vi vi phạm để đội ngũ quản trị xử lý..."
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-gray-50 font-medium focus:outline-none focus:border-[#1a2e1c]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmittingReport}
                  className="flex-1"
                >
                  {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {blockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Chặn người dùng này?</h3>
                <p className="text-xs text-gray-500">Người dùng: {user.name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Khi chặn, hai bên sẽ không thể xem hồ sơ của nhau, không thể tìm thấy tài nguyên của nhau trên bảng tin cộng đồng và không thể nhắn tin trực tiếp.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Lý do chặn (tùy chọn)</label>
              <input 
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ví dụ: Không muốn tương tác..."
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-gray-50 font-medium focus:outline-none focus:border-[#1a2e1c]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setBlockModalOpen(false)}
                className="flex-1"
              >
                Hủy bỏ
              </Button>
              <Button 
                type="button"
                variant="danger"
                disabled={isBlockingUser}
                onClick={handleConfirmBlock}
                className="flex-1"
              >
                {isBlockingUser ? "Đang xử lý..." : "Xác nhận chặn"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
