"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BookOpen, Brain, Calendar, Clock, Flame, MapPin,
  Medal, Share2, Star, Target, TrendingUp, Trophy,
  Zap, GraduationCap, Globe, Mail, Phone, Users, MessageSquare,
  Award, ChevronRight, Layers, FileText, Camera,
  CheckCircle2, BarChart2, BookMarked, Lightbulb, ArrowLeft, User, Lock, Copy, Eye
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useStudy } from "@/context/StudyContext";
import { Navbar } from "@/components/landing/Navbar";
import RegisterModal from "@/components/auth/RegisterModal";
import { AnimatePresence, motion } from "framer-motion";
import { forkDeck } from "@/services/flashcard.service";
import toast from "react-hot-toast";

/* ── UI Components ───────────────────────────────────────── */
const Card = ({ children, className = "" }: any) => {
  const cleanedClassName = className
    .replace(/\bborder-0\b/g, "")
    .replace(/\bshadow-sm\b/g, "")
    .replace(/\bshadow-md\b/g, "")
    .replace(/\bshadow-lg\b/g, "")
    .replace(/\bborder\b/g, "")
    .trim();

  return (
    <div className={`bg-white rounded-2xl border-2 border-[#1a2e1c]/45 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.16)] overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(26,46,28,0.24)] hover:border-[#1a2e1c]/65 ${cleanedClassName}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }: any) => <div className={`px-6 pt-5 pb-4 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = "" }: any) => <h3 className={`font-semibold text-gray-900 ${className}`}>{children}</h3>;
const CardContent = ({ children, className = "" }: any) => <div className={`px-6 pb-6 ${className}`}>{children}</div>;
const Badge = ({ children, className = "", variant = "default" }: any) => {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold";
  const variants: any = { 
    default: "bg-gray-100 text-gray-800", 
    outline: "border border-gray-200 text-gray-800",
    pro: "bg-[#1a2e1c] text-white"
  };
  return <span className={`${base} ${variants[variant] || ""} ${className}`}>{children}</span>;
};

const Button = ({ children, className = "", size = "default", variant = "default", ...props }: any) => {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none";
  const sizes: any = { default: "h-10 px-4 py-2", sm: "h-8 px-3 text-xs" };
  const variants: any = { default: "bg-[#1a2e1c] text-white hover:bg-[#2d5a3d]", outline: "border border-gray-200 bg-transparent hover:bg-gray-50 text-gray-900" };
  return <button className={`${base} ${sizes[size] || sizes.default} ${variants[variant] || variants.default} ${className}`} {...props}>{children}</button>;
};

const Separator = ({ className = "" }: any) => <div className={`shrink-0 bg-gray-200 h-[1px] w-full ${className}`} />;

/* ── Streak Grid Component ───────────────────────────────── */
function TargetUserStreakCard({ streak = 0, studyDates = [] }: { streak?: number; studyDates?: string[] }) {
  const streakTarget = 100;
  const currentStreak = streak;
  const progressPct = Math.min((currentStreak / streakTarget) * 100, 100);

  const today = new Date();
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const todayStr = toLocalDateStr(today);
  const studiedToday = studyDates.includes(todayStr);

  const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  const todayLabel = `${dayNames[today.getDay()]}, ngày ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  const daysSinceMonday = (today.getDay() + 6) % 7;
  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() - daysSinceMonday - 35); // 5 weeks back

  const streakDays = Array.from({ length: 42 }, (_, i) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    const cellStr = toLocalDateStr(cellDate);
    const hasStudied = studyDates.includes(cellStr);

    if (cellStr === todayStr) return hasStudied ? 'today' : 'today-empty';
    if (cellDate > today) return 'future';
    return hasStudied ? 'streak' : 'inactive';
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800 text-base font-bold">
            <Flame className="w-4.5 h-4.5 text-orange-500" />
            Streak ngày học của bạn ấy
          </CardTitle>
          <Badge className="bg-orange-50 text-orange-600 border border-orange-200 text-xs px-2">
            🔥 {currentStreak} ngày
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-[#1a2e1c]">{currentStreak}</span>
              <span className="text-gray-400 mb-2 text-sm">/ {streakTarget} ngày mục tiêu</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Ngày hiện tại: <span className="font-semibold text-[#2d5a3d]">{todayLabel}</span></p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p className="font-medium">{today.getDate()}/{today.getMonth() + 1}/{today.getFullYear()}</p>
            {studiedToday ? (
              <p className="text-[#2d5a3d] font-semibold mt-0.5">✓ Đã học hôm nay</p>
            ) : (
              <p className="text-orange-500 font-semibold mt-0.5">⚡ Chưa học hôm nay</p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
            <div className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-medium">
            <span>Tiến trình hoàn thành mục tiêu</span>
            <span>{progressPct.toFixed(0)}%</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1 uppercase tracking-wider">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {streakDays.map((dayType, i) => {
              let bgClass = "bg-gray-100 border-gray-200/40";
              if (dayType === 'streak') bgClass = "bg-[#2d5a3d] border-[#2d5a3d]";
              if (dayType === 'today') bgClass = "bg-[#2d5a3d] border-[#1a2e1c] ring-2 ring-emerald-400 ring-offset-1";
              if (dayType === 'today-empty') bgClass = "bg-orange-50 border-orange-400 ring-2 ring-orange-300 ring-offset-1";
              if (dayType === 'inactive') bgClass = "bg-gray-100 border-gray-200 hover:bg-gray-200/50";
              if (dayType === 'future') bgClass = "bg-gray-50/50 border-gray-100 opacity-60";

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg border transition-all duration-150 cursor-pointer ${bgClass}`}
                  title={`Cell ${i + 1}`}
                />
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: "Streak hiện tại", value: `${currentStreak} ngày`, icon: "🔥", bg: "bg-[#eef8f0]", border: "border-[#2d5a3d]/25" },
            { label: "Hôm nay", value: studiedToday ? '✅ Đã học' : '⚡ Chưa học', icon: "📅", bg: studiedToday ? "bg-[#eef8f0]" : "bg-[#fff8ec]", border: studiedToday ? "border-[#2d5a3d]/25" : "border-amber-200" },
            { label: "Cần thêm", value: `${Math.max(streakTarget - currentStreak, 0)} ngày`, icon: "🎯", bg: "bg-[#fcf8ec]", border: "border-amber-200" },
          ].map(s => (
            <div key={s.label} className={`p-2.5 rounded-xl ${s.bg} border ${s.border} text-center shadow-2xs`}>
              <p className="text-base">{s.icon}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TargetUserProfilePage() {
  const router = useRouter();
  const { userId } = useParams();
  const { isAuthenticated, activeUser, showLoginModal, setShowLoginModal } = useStudy();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

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
      fetchTargetProfile(); // reload profile to update stats if necessary
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu thẻ");
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
            {error || "Tài khoản này có thể không tồn tại hoặc đã được xóa."}
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
            <p className="text-xs text-gray-400 font-medium">@{(profile.user as any).username || profile.user.name.toLowerCase().replace(/\s+/g, '')}</p>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1.5">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Hồ sơ riêng tư</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              {isPrivate
                ? "Học viên này đã cài đặt hồ sơ ở chế độ Riêng tư hoàn toàn."
                : "Chỉ những người dùng đã kết bạn với học viên này mới có quyền xem thông tin học tập, flashcards và tài liệu của bạn ấy."}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => router.back()} variant="outline" className="flex-1 font-bold">
              Quay lại
            </Button>
            {!isPrivate && !isAuthenticated && (
              <Button onClick={() => setShowLoginModal(true)} className="flex-1 font-bold">
                Đăng nhập kết bạn
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const { user } = profile;
  const userInitials = user.name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#ebe8e0] pb-12 transition-colors duration-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/home')}
        activeUser={activeUser!}
      />

      <div className="max-w-5xl mx-auto px-4 pt-24 space-y-6">
        
        {/* Profile Info Header */}
        <Card className="overflow-hidden border-0 shadow-xs">
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
                <div className="relative shrink-0 -mt-12 z-10">
                  <div className="w-24 h-24 bg-[#2d5a3d] border-4 border-white shadow-lg rounded-full flex items-center justify-center overflow-hidden">
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
                  <span className="absolute top-2 right-2 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div className="pb-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-gray-900 text-2xl font-bold">{user.name}</h2>
                    <Badge variant="pro" className="text-xs px-2 py-0.5">Học viên</Badge>
                    <Badge className="bg-amber-100 text-amber-700 text-xs px-2 py-0 border border-amber-200">Cấp {10 + (user.streak % 5)}</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">@{user.name.toLowerCase().replace(/\s+/g, '')}</p>
                  
                  {/* XP Progress Bar */}
                  <div className="mt-3 max-w-xs">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span className="font-semibold text-[#2d5a3d]">Tiến trình cấp học</span>
                      <span className="font-medium text-gray-600">{(user.streak * 120) % 5000} / 5,000 XP</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                      <div className="h-full bg-[#2d5a3d] rounded-full transition-all" style={{ width: `${((user.streak * 120) % 5000) / 50}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover stats */}
              <div className="flex gap-3 pb-1 shrink-0">
                <div className="bg-[#f4f7f4] border border-[#2d5a3d]/15 px-4 py-2.5 rounded-xl text-center min-w-[80px]">
                  <p className="text-lg font-bold text-[#1a2e1c]">{user.streak || 0}</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Ngày Streak</p>
                </div>
                <div className="bg-[#f4f7f4] border border-[#2d5a3d]/15 px-4 py-2.5 rounded-xl text-center min-w-[80px]">
                  <p className="text-lg font-bold text-[#1a2e1c]">{user.decks?.length || 0}</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Bộ Thẻ</p>
                </div>
                <div className="bg-[#f4f7f4] border border-[#2d5a3d]/15 px-4 py-2.5 rounded-xl text-center min-w-[80px]">
                  <p className="text-lg font-bold text-[#1a2e1c]">{user.documents?.length || 0}</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Tài liệu</p>
                </div>
              </div>
            </div>

            {/* Additional info grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin học tập</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                    <GraduationCap className="w-4 h-4 text-[#4a7c59] shrink-0" />
                    <span>Trường/Khóa học: <span className="text-gray-800 font-bold">{user.education || "Chưa cập nhật"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                    <MapPin className="w-4 h-4 text-[#4a7c59] shrink-0" />
                    <span>Đến từ: <span className="text-gray-800 font-bold">{user.address || "Chưa cập nhật"}</span></span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Liên hệ & Mạng xã hội</h3>
                <div className="space-y-2">
                  {user.website && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                      <Globe className="w-4 h-4 text-[#4a7c59] shrink-0" />
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-[#2d5a3d] hover:underline font-bold truncate block max-w-[200px]">
                        {user.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                    <Mail className="w-4 h-4 text-[#4a7c59] shrink-0" />
                    <span className="truncate block max-w-[200px]">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mục tiêu học tập</h3>
                <p className="text-xs text-gray-500 leading-normal font-medium">
                  {user.bio || "Học viên chưa cập nhật tiểu sử cá nhân."}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Dynamic content grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT SIDEBAR (Friends & Achievements) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Friends list */}
            <Card className="border-0 shadow-xs">
              <CardHeader className="pb-3 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base font-bold">
                    <Users className="w-4.5 h-4.5 text-[#2d5a3d]" />
                    Bạn bè của bạn ấy
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-[#2d5a3d]/30 text-[#2d5a3d]">{user.friends?.length || 0} bạn</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {user.friends && user.friends.length > 0 ? (
                    user.friends.map((f: any) => (
                      <div 
                        key={f.id} 
                        onClick={() => router.push(`/profile/${f.id}`)}
                        className="flex items-center gap-3 p-3 bg-[#f4f7f4] border border-[#2d5a3d]/20 rounded-xl transition-all duration-200 hover:bg-emerald-50/30 hover:border-[#2d5a3d]/35 group cursor-pointer shadow-2xs"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#2d5a3d]/15 text-[#2d5a3d] text-xs font-bold flex items-center justify-center shrink-0">
                          {f.avatar_url ? (
                            <img src={f.avatar_url} alt={f.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            f.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate group-hover:text-[#1a2e1c]">{f.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{f.education || 'Học viên'} · {f.streak || 0} ngày streak</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-400 font-medium">Học viên này chưa kết nối bạn bè.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 shadow-xs">
              <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="flex items-center gap-2 text-gray-800 text-base font-bold">
                  <Award className="w-4.5 h-4.5 text-yellow-500" />
                  Huy hiệu & Thành tích
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Flame, label: "Streak 30 ngày", desc: "Học liên tục 30 ngày", color: "text-orange-500", bg: "bg-orange-50", earned: user.streak >= 30 },
                    { icon: Trophy, label: "Top học sinh", desc: "Xếp hạng top 5%", color: "text-yellow-500", bg: "bg-yellow-50", earned: true },
                    { icon: Brain, label: "Trí tuệ xuất sắc", desc: "1000 thẻ trong 1 ngày", color: "text-purple-500", bg: "bg-purple-50", earned: user.streak >= 15 },
                    { icon: Star, label: "100% chính xác", desc: "Hoàn hảo 1 bài kiểm tra", color: "text-blue-500", bg: "bg-blue-50", earned: true },
                  ].map((a, idx) => {
                    const IconComp = a.icon;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all duration-200 ${
                          a.earned 
                            ? "bg-white border-yellow-200/60 shadow-2xs" 
                            : "bg-gray-50 border-gray-200/40 opacity-40"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${a.bg}`}>
                          <IconComp className={`w-4 h-4 ${a.color}`} />
                        </div>
                        <p className="text-[10px] font-bold text-gray-800 leading-tight">{a.label}</p>
                        <p className="text-[8px] text-gray-400 font-medium mt-0.5 leading-none">{a.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Tabs */}
            <div className="space-y-4">
              <div className="flex gap-2 p-1.5 bg-[#f4f7f4]/60 border border-[#2d5a3d]/15 rounded-xl max-w-md">
                {[
                  { id: "overview", label: "Tổng quan", icon: BarChart2 },
                  { id: "decks", label: "Flashcards", icon: Layers },
                  { id: "documents", label: "Tài liệu", icon: FileText },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? "bg-[#1a2e1c] text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-800 hover:bg-[#1a2e1c]/5"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  
                  {/* OVERVIEW TAB */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <TargetUserStreakCard 
                        streak={user.streak} 
                        studyDates={user.study_dates} 
                      />

                      {/* Learning stats card */}
                      <Card className="border-0 shadow-xs">
                        <CardHeader>
                          <CardTitle className="text-gray-800 text-base font-bold">Thống kê học tập của bạn ấy</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                              { label: "Tổng thời gian học", value: `${(user.streak * 25) || 120} phút`, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
                              { label: "Thẻ đã ghi nhớ", value: `${(user.streak * 8) || 35} thẻ`, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
                              { label: "Mức độ chính xác", value: "88%", icon: Target, color: "text-red-500", bg: "bg-red-50" },
                              { label: "Chỉ số tập trung", value: "92%", icon: Lightbulb, color: "text-yellow-600", bg: "bg-yellow-50" }
                            ].map((stat, idx) => {
                              const Icon = stat.icon;
                              return (
                                <div key={idx} className="p-4 bg-[#f9fafb] border border-gray-100 rounded-2xl flex flex-col justify-between h-28">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg}`}>
                                    <Icon className={`w-4 h-4 ${stat.color}`} />
                                  </div>
                                  <div>
                                    <p className="text-base font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 leading-tight">{stat.label}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* FLASHCARDS TAB */}
                  {activeTab === "decks" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {user.decks && user.decks.length > 0 ? (
                        user.decks.map((deck: any) => (
                          <Card key={deck.id} className="border-0 shadow-xs flex flex-col h-full hover:-translate-y-0.5 transition-transform duration-200">
                            <CardContent className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                                    Flashcards
                                  </Badge>
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    {deck.card_count || 0} thẻ
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-950 line-clamp-1 mb-1">{deck.name}</h3>
                                <p className="text-xs text-gray-400 line-clamp-2 min-h-[32px] font-medium leading-relaxed">
                                  {deck.description || "Không có mô tả"}
                                </p>
                              </div>

                              <div className="flex gap-2 pt-4 border-t border-gray-50 mt-4">
                                <Button 
                                  onClick={() => handleFork(deck.id)}
                                  size="sm" 
                                  className="w-full text-xs font-bold gap-1.5 py-1.5"
                                >
                                  <Copy className="w-3.5 h-3.5" /> Lưu (Fork)
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-bounce" />
                          <h3 className="text-base font-bold text-gray-700 mb-1">Chưa có bộ thẻ công khai</h3>
                          <p className="text-xs text-gray-400">Học viên này chưa chia sẻ công khai bộ thẻ học tập nào.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DOCUMENTS TAB */}
                  {activeTab === "documents" && (
                    <div className="space-y-3">
                      {user.documents && user.documents.length > 0 ? (
                        user.documents.map((doc: any) => {
                          const docType = doc.doc_url ? doc.doc_url.split('.').pop()?.toUpperCase() : "DOCX";
                          return (
                            <Card key={doc.id} className="border-0 shadow-xs hover:border-[#2d5a3d]/30 transition-all duration-200">
                              <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-xs font-bold text-gray-900 truncate">{doc.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                      {doc.category || "Tài liệu học tập"} · Định dạng: {docType}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {doc.doc_url && (
                                    <a 
                                      href={doc.doc_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center rounded-lg font-bold text-xs h-8 px-3 border border-[#2d5a3d]/30 text-[#2d5a3d] hover:bg-[#2d5a3d]/5 transition-colors"
                                    >
                                      Xem tài liệu
                                    </a>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-bounce" />
                          <h3 className="text-base font-bold text-gray-700 mb-1">Chưa có tài liệu nào</h3>
                          <p className="text-xs text-gray-400">Học viên này chưa tải lên tài liệu học tập công khai nào.</p>
                        </div>
                      )}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal for guests */}
      <AnimatePresence>
        {showLoginModal && (
          <RegisterModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            triggerMessage={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
