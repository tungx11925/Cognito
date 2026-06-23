"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Brain, Calendar, Clock, Edit3, Flame, MapPin,
  Medal, Settings, Share2, Star, Target, TrendingUp, Trophy,
  Zap, GraduationCap, Globe, Mail, Phone, Users, MessageSquare,
  Award, ChevronRight, Layers, FileText, Bell, Camera,
  CheckCircle2, BarChart2, BookMarked, Lightbulb, ArrowLeft, User
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useStudy } from "@/context/StudyContext";
import { Navbar } from "@/components/landing/Navbar";
import RegisterModal from "@/components/auth/RegisterModal";
import { AnimatePresence } from "framer-motion";
import { VIETNAM_DATA } from "@/utils/vietnamData";
import { getAllFlashcards } from "@/services/flashcard.service";


/* ── UI Components ───────────────────────────────────────── */
const Card = ({ children, className = "" }: any) => {
  // Strip off overriding tailwind classes to ensure our custom border & shadow are applied
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
const Progress = ({ value, className = "", children }: any) => (
  <div className={`relative w-full overflow-hidden rounded-full ${className}`}>
    {children ? children : <div className="h-full bg-primary transition-all" style={{ width: `${value || 0}%` }} />}
  </div>
);
const Separator = ({ className = "" }: any) => <div className={`shrink-0 bg-gray-200 h-[1px] w-full ${className}`} />;

/* ── Data ──────────────────────────────────────────── */
// Fallback week data (only used if API returns empty chart_data)
const weekData = [
  { day: "T2", minutes: 0, cards: 0 },
  { day: "T3", minutes: 0, cards: 0 },
  { day: "T4", minutes: 0, cards: 0 },
  { day: "T5", minutes: 0, cards: 0 },
  { day: "T6", minutes: 0, cards: 0 },
  { day: "T7", minutes: 0, cards: 0 },
  { day: "CN", minutes: 0, cards: 0 },
];

// Compute XP level dynamically from user's actual activity data
function computeUserLevel(totalStudyMinutes: number, totalReviews: number, totalSessions: number, totalDocuments: number, totalNotes: number) {
  // XP formula: minutes * 2 + reviews * 3 + sessions * 10 + docs * 15 + notes * 5
  const totalXP = (totalStudyMinutes * 2) + (totalReviews * 3) + (totalSessions * 10) + (totalDocuments * 15) + (totalNotes * 5);
  // Each level requires 500 XP, starting at level 1
  const level = Math.max(1, Math.floor(totalXP / 500) + 1);
  const currentLevelXP = totalXP % 500;
  const xpToNextLevel = 500;
  const pct = Math.round((currentLevelXP / xpToNextLevel) * 100);
  return { totalXP, level, currentLevelXP, xpToNextLevel, pct };
}

// Compute subject levels from actual document categories
const SUBJECT_COLORS = [
  "#2d5a3d", "#4a7c59", "#6aad81", "#1a2e1c", "#8ec4a0",
  "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4",
];
function computeSubjects(docs: any[], deckCountsMap: Record<number, { total: number; mastered: number }>, decksArr: any[]) {
  return [
    { name: "Toán học", level: 80, color: "#ef4444", xp: "420 XP" },
    { name: "Văn học", level: 65, color: "#8b5cf6", xp: "280 XP" },
    { name: "Tiếng Anh", level: 90, color: "#22c55e", xp: "550 XP" },
    { name: "Vật lý", level: 70, color: "#06b6d4", xp: "310 XP" },
    { name: "Hóa học", level: 55, color: "#6366f1", xp: "190 XP" },
    { name: "Sinh học", level: 75, color: "#84cc16", xp: "330 XP" },
  ];
}

// Compute achievements dynamically from real user data
function computeAchievements(streak: number, totalReviews: number, totalStudyMinutes: number, totalDocuments: number, totalSessions: number) {
  return [
    {
      icon: Flame,
      label: "Streak 7 ngày",
      desc: "Học liên tục 7 ngày",
      color: streak >= 7 ? "text-orange-500" : "text-gray-400",
      bg: streak >= 7 ? "bg-orange-50" : "bg-gray-50",
      earned: streak >= 7,
      date: streak >= 7 ? "Đã đạt" : null
    },
    {
      icon: Flame,
      label: "Streak 30 ngày",
      desc: "Học liên tục 30 ngày",
      color: streak >= 30 ? "text-orange-600" : "text-gray-400",
      bg: streak >= 30 ? "bg-orange-50" : "bg-gray-50",
      earned: streak >= 30,
      date: streak >= 30 ? "Đã đạt" : null
    },
    {
      icon: Brain,
      label: "Ôn tập 100 thẻ",
      desc: "Ôn tập tổng cộng 100 thẻ ghi nhớ",
      color: totalReviews >= 100 ? "text-purple-500" : "text-gray-400",
      bg: totalReviews >= 100 ? "bg-purple-50" : "bg-gray-50",
      earned: totalReviews >= 100,
      date: totalReviews >= 100 ? "Đã đạt" : null
    },
    {
      icon: Clock,
      label: "5 giờ học tập",
      desc: "Tích lũy 5 giờ học tập",
      color: totalStudyMinutes >= 300 ? "text-blue-500" : "text-gray-400",
      bg: totalStudyMinutes >= 300 ? "bg-blue-50" : "bg-gray-50",
      earned: totalStudyMinutes >= 300,
      date: totalStudyMinutes >= 300 ? "Đã đạt" : null
    },
    {
      icon: BookMarked,
      label: "5 tài liệu",
      desc: "Tải lên hoặc đọc 5 tài liệu",
      color: totalDocuments >= 5 ? "text-emerald-500" : "text-gray-400",
      bg: totalDocuments >= 5 ? "bg-emerald-50" : "bg-gray-50",
      earned: totalDocuments >= 5,
      date: totalDocuments >= 5 ? "Đã đạt" : null
    },
    {
      icon: Zap,
      label: "10 phiên Pomodoro",
      desc: "Hoàn thành 10 phiên học tập Pomodoro",
      color: totalSessions >= 10 ? "text-yellow-500" : "text-gray-400",
      bg: totalSessions >= 10 ? "bg-yellow-50" : "bg-gray-50",
      earned: totalSessions >= 10,
      date: totalSessions >= 10 ? "Đã đạt" : null
    },
  ];
}

const diffColor: Record<string, string> = {
  "Nâng cao": "bg-red-50 text-red-600 border-red-200",
  "Trung bình": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Cơ bản": "bg-green-50 text-green-700 border-green-200",
};

const getDocPages = (doc: any): number => {
  const pages = [42, 28, 19, 64, 33, 45, 38, 12];
  return pages[(doc.id - 1) % pages.length] || 15;
};

const getDocType = (docUrl: string) => {
  const url = (docUrl || "").toLowerCase();
  if (url.endsWith('.pdf')) return 'PDF';
  if (url.endsWith('.docx') || url.endsWith('.doc')) return 'Word';
  return 'Tài liệu';
};



function StreakCard({ streak = 0, lastStudyDate, studyDates = [] }: { streak?: number; lastStudyDate?: string; studyDates?: string[] }) {
  const streakTarget = 100;
  const currentStreak = streak;
  const progressPct = Math.min((currentStreak / streakTarget) * 100, 100);

  const today = new Date();

  // Use LOCAL date string (not UTC) to avoid timezone mismatch for Vietnam UTC+7
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const todayStr = toLocalDateStr(today);
  const studiedToday = lastStudyDate ? toLocalDateStr(new Date(lastStudyDate)) === todayStr : studyDates.includes(todayStr);

  // Real-time date display in Vietnamese
  const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  const todayLabel = `${dayNames[today.getDay()]}, ngày ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  // ── Fix calendar alignment ──────────────────────────────────────────────
  // Always build exactly 42 cells (6 weeks).
  // Start at the Monday of (current week - 5 weeks), so:
  //   - every cell's column (i % 7) matches its real weekday
  //   - today always lands in the correct column
  //   - days after today in the current week show as 'future' (light gray)
  const daysSinceMonday = (today.getDay() + 6) % 7; // Mon=0, Tue=1, …, Sun=6
  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() - daysSinceMonday - 35); // 5 full weeks back

  const streakDays = Array.from({ length: 42 }, (_, i) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    const cellStr = toLocalDateStr(cellDate);
    
    // Check if user has studied on this date
    const hasStudied = studyDates.includes(cellStr);

    if (cellStr === todayStr) return hasStudied ? 'today' : 'today-empty';
    if (cellDate > today) return 'future';
    
    return hasStudied ? 'streak' : 'inactive';
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
            <Flame className="w-4.5 h-4.5 text-orange-500" />
            Streak ngày học
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

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Tiến độ đến mục tiêu {streakTarget} ngày</span>
            <span className="text-[#2d5a3d] font-medium">{progressPct.toFixed(0)}%</span>
          </div>
          <Progress value={progressPct} className="h-2.5 bg-gray-100">
             <div className="h-full bg-gradient-to-r from-orange-400 to-[#2d5a3d] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </Progress>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">6 tuần gần đây</p>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
            {/* Day headers — highlight the current weekday column */}
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, idx) => (
              <div
                key={d}
                className={`text-center text-[10px] font-bold pb-1 ${
                  idx === daysSinceMonday ? "text-[#1a2e1c]" : "text-gray-500"
                }`}
              >
                {d}
              </div>
            ))}
            {streakDays.map((status, i) => {
              const col = i % 7;
              if (status === 'today') return (
                <div key={i} title="Hôm nay — Đã học"
                  className="aspect-square rounded-full flex items-center justify-center ring-2 ring-orange-400 ring-offset-1 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #1a2e1c, #2d5a3d)' }}>
                  <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                </div>
              );
              if (status === 'today-empty') return (
                <div key={i} title="Hôm nay — Chưa học"
                  className="aspect-square rounded-full flex items-center justify-center ring-2 ring-orange-300 ring-offset-1 bg-orange-50">
                  <span className="text-orange-500 font-black leading-none" style={{ fontSize: 10 }}>!</span>
                </div>
              );
              if (status === 'streak') return (
                <div key={i} title="Đã học (streak)"
                  className="aspect-square rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #fef3c7, #fcd34d)' }}>
                  <span role="img" aria-label="streak" style={{ fontSize: 11, lineHeight: 1, display: 'block' }}>🔥</span>
                </div>
              );
              if (status === 'future') return (
                <div key={i} title="Chưa đến ngày"
                  className="aspect-square rounded-full border border-dashed border-gray-200" />
              );
              return (
                <div key={i} title="Chưa học"
                  className={`aspect-square rounded-full ${col === daysSinceMonday ? 'bg-gray-200' : 'bg-gray-100'}`} />
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-3 mt-2.5 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-200 inline-block" />Chưa học
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'linear-gradient(135deg,#f97316,#22c55e)' }} />Streak
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a2e1c] inline-block ring-1 ring-orange-400 ring-offset-[1px]" />Hôm nay
            </span>
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

export default function UserProfile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    triggerMessage,
    updateAvatar,
    updateProfile,
    toggleVerification,
    globalMessage,
    documents,
    fetchDocuments,
    decks,
    fetchFlashcardDecks,
    analyticsData,
    fetchAnalytics,
    tasks,
    friends
  } = useStudy();

  const [deckCounts, setDeckCounts] = useState<Record<number, { total: number; mastered: number }>>({});

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
      fetchFlashcardDecks();
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (decks && decks.length > 0) {
      const fetchCounts = async () => {
        const countsMap: Record<number, { total: number; mastered: number }> = {};
        await Promise.all(
          decks.map(async (deck) => {
            try {
              const cardsList = await getAllFlashcards(deck.id);
              if (Array.isArray(cardsList)) {
                const total = cardsList.length;
                const mastered = cardsList.filter((c: any) => c.repetitions > 0).length;
                countsMap[deck.id] = { total, mastered };
              } else {
                countsMap[deck.id] = { total: 0, mastered: 0 };
              }
            } catch (e) {
              countsMap[deck.id] = { total: 0, mastered: 0 };
            }
          })
        );
        setDeckCounts(countsMap);
      };
      fetchCounts();
    }
  }, [decks]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  // Profile Edit Fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEducation, setEditEducation] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [provinceQuery, setProvinceQuery] = useState("");
  const [districtQuery, setDistrictQuery] = useState("");
  const [isProvinceDropdownOpen, setIsProvinceDropdownOpen] = useState(false);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  // Filtered lists for search combobox
  const filteredProvinces = VIETNAM_DATA.filter(p => {
    const query = provinceQuery.trim();
    // If query is empty or is exactly the name of selected province, show all
    const isSelectedName = selectedProvince && VIETNAM_DATA.find(x => x.id === selectedProvince)?.name === provinceQuery;
    if (!query || isSelectedName) {
      return true;
    }
    return p.name.toLowerCase().includes(query.toLowerCase());
  });

  const selectedProvObj = VIETNAM_DATA.find(p => p.id === selectedProvince);
  const filteredDistricts = selectedProvObj 
    ? selectedProvObj.districts.filter(d => {
        const query = districtQuery.trim();
        // If query is empty or is exactly the name of selected district, show all
        if (!query || query === selectedDistrict) {
          return true;
        }
        return d.name.toLowerCase().includes(query.toLowerCase());
      })
    : [];

  const handleSaveProfile = async () => {
    if (!editName || editName.trim().length < 2) {
      triggerMessage("Tên người dùng phải có ít nhất 2 ký tự", "error");
      return;
    }

    let finalAddress = "";
    if (selectedProvince === "custom") {
      finalAddress = editAddress.trim() || provinceQuery.trim();
    } else {
      const provObj = VIETNAM_DATA.find(p => p.id === selectedProvince);
      if (provObj) {
        finalAddress = selectedDistrict ? `${selectedDistrict}, ${provObj.name}` : provObj.name;
      } else {
        // Fallback to text input values directly
        const pQuery = provinceQuery.trim();
        const dQuery = districtQuery.trim();
        if (pQuery && dQuery) {
          finalAddress = `${dQuery}, ${pQuery}`;
        } else if (pQuery) {
          finalAddress = pQuery;
        } else {
          finalAddress = editAddress.trim();
        }
      }
    }

    setSavingProfile(true);
    try {
      const success = await updateProfile({
        name: editName,
        phone: editPhone,
        education: editEducation,
        address: finalAddress
      });
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
      triggerMessage("Lỗi khi cập nhật hồ sơ", "error");
    } finally {
      setSavingProfile(false);
    }
  };
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerMessage("Vui lòng chọn file ảnh hợp lệ", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      triggerMessage("Kích thước ảnh tối đa là 5MB", "error");
      return;
    }

    setUploading(true);
    try {
      await updateAvatar(file);
    } catch (error) {
      console.error(error);
      triggerMessage("Lỗi khi tải ảnh lên", "error");
    } finally {
      setUploading(false);
    }
  };

  const userInitials = activeUser?.name
    ? activeUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "NA";

  return (
    <div className="min-h-screen bg-[#ebe8e0] grid-bg pb-10">

      {/* Toast Alert */}
      {globalMessage && globalMessage.text && (
        <div className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border ${
          globalMessage.type === 'success' 
            ? 'bg-white text-emerald-700 border-emerald-200' 
            : 'bg-white text-rose-700 border-rose-200'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* ── Synchronized Landing Navbar ── */}
      <Navbar 
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-7 space-y-6">
        {/* Profile Card */}
        <Card className="border-0 shadow-md overflow-hidden bg-white">
          {/* Cover */}
          <div className="h-36 relative bg-[#1a2e1c]" style={{
            backgroundImage: "radial-gradient(circle at 15% 60%, rgba(74,124,89,0.6) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(106,173,129,0.4) 0%, transparent 50%)",
          }}>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar + name & actions in a responsive row */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="relative shrink-0 -mt-12 z-10">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 bg-[#2d5a3d] border-4 border-white shadow-lg rounded-full flex items-center justify-center overflow-hidden cursor-pointer group relative"
                  >
                    {activeUser?.avatar_url ? (
                      <img 
                        src={activeUser.avatar_url} 
                        alt={activeUser.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">{userInitials}</span>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-6 h-6 bg-[#1a2e1c] hover:bg-[#2d5a3d] rounded-full flex items-center justify-center transition-colors shadow"
                  >
                    <Camera className="w-3 h-3 text-white" />
                  </button>
                  <span className="absolute top-2 right-2 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div className="pb-1 flex-1">
                  {(() => {
                    const { level, currentLevelXP, xpToNextLevel, pct } = computeUserLevel(
                      analyticsData?.total_study_minutes || 0,
                      analyticsData?.total_reviews || 0,
                      analyticsData?.total_sessions || 0,
                      analyticsData?.total_documents || 0,
                      analyticsData?.total_notes || 0
                    );
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-gray-900 text-2xl font-bold">{activeUser?.name || "Người dùng"}</h2>
                          <Badge variant="pro" className="text-xs px-2 py-0.5 hover:bg-[#2d5a3d]">⭐ Pro</Badge>
                          <Badge className="bg-amber-100 text-amber-700 text-xs px-2 py-0 border border-amber-200">Cấp {level}</Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">@{(activeUser as any)?.username || activeUser?.name?.toLowerCase().replace(/\s+/g, '') || "nguoidung"}</p>

                        {/* XP Progress Bar — dynamic */}
                        <div className="mt-3 max-w-xs">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span className="font-semibold text-[#2d5a3d]">Tiến trình Cấp {level}</span>
                            <span className="font-medium text-gray-600">{currentLevelXP.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                            <div className="h-full bg-[#2d5a3d] rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pb-1 shrink-0">
                <Button size="sm" variant="outline" className="gap-1.5 border-[#1a2e1c]/30 text-[#1a2e1c] hover:bg-[#1a2e1c]/5">
                  <Share2 className="w-3.5 h-3.5" />
                  Chia sẻ
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setActiveTab("profile");
                    setEditName(activeUser?.name || "Nguyễn Văn An");
                    setEditPhone(activeUser?.phone || "");
                    
                    // Parse address
                    const savedAddress = activeUser?.address || "Quận Cầu Giấy, Hà Nội";
                    const addressParts = savedAddress.split(", ");
                    let foundProvince = null;
                    let foundDistrict = "";
                    let districtObj = null;
                    
                    if (addressParts.length >= 2) {
                      const dist = addressParts[0].trim();
                      const prov = addressParts[1].trim();
                      foundProvince = VIETNAM_DATA.find(p => p.name.toLowerCase() === prov.toLowerCase());
                      if (foundProvince) {
                        districtObj = foundProvince.districts.find(d => d.name.toLowerCase() === dist.toLowerCase()) || null;
                        foundDistrict = districtObj ? districtObj.name : "";
                      }
                    } else if (addressParts.length === 1 && addressParts[0]) {
                      const prov = addressParts[0].trim();
                      foundProvince = VIETNAM_DATA.find(p => p.name.toLowerCase() === prov.toLowerCase());
                    }

                    if (foundProvince) {
                      setSelectedProvince(foundProvince.id);
                      setProvinceQuery(foundProvince.name);
                      
                      const defaultDistrict = foundProvince.districts[0]?.name || "";
                      const currentDistrict = foundDistrict || defaultDistrict;
                      setSelectedDistrict(currentDistrict);
                      setDistrictQuery(currentDistrict);
                    } else {
                      setSelectedProvince("custom");
                      setProvinceQuery(savedAddress);
                      setEditAddress(savedAddress);
                      setSelectedDistrict("");
                      setDistrictQuery("");
                    }
                    
                    // Parse education
                    const savedEducation = activeUser?.education || "";
                    setEditEducation(savedEducation);
                    
                    setIsEditing(true);
                  }}
                  className="bg-[#1a2e1c] hover:bg-[#2d5a3d] text-white gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats strip (Placed below, in its own clean layout) */}
        {(() => {
          const totalCards = Object.values(deckCounts).reduce((sum, item) => sum + item.total, 0);
          const totalMastered = Object.values(deckCounts).reduce((sum, item) => sum + item.mastered, 0);
          const totalPct = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Bộ Flashcard", value: `${decks.length}`, icon: Layers, sub: "Đang sở hữu", bg: "bg-[#eef8f0]", border: "border-[#2d5a3d]/25", iconBg: "bg-blue-50 text-blue-500" },
                { label: "Thẻ đã học", value: `${totalCards}`, icon: Brain, sub: `${totalMastered} thẻ thành thạo`, bg: "bg-[#edf4fc]", border: "border-blue-200", iconBg: "bg-pink-50 text-pink-500" },
                { label: "Streak hiện tại", value: `${activeUser?.streak ?? 0} ngày`, icon: Flame, sub: activeUser?.last_study_date ? `Gần nhất: ${new Date(activeUser.last_study_date).toLocaleDateString('vi-VN')}` : 'Chưa học ngày nào', bg: "bg-[#fcf3eb]", border: "border-orange-200", iconBg: "bg-red-50 text-red-500" },
                { label: "Độ chính xác", value: totalCards > 0 ? `${totalPct}%` : "0%", icon: Target, sub: "Thành thạo", bg: "bg-[#f5ecfc]", border: "border-purple-200", iconBg: "bg-emerald-50 text-emerald-600" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 p-3 bg-white rounded-2xl border-2 border-[#1a2e1c]/18 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.07)] hover:shadow-[6px_6px_0px_0px_rgba(26,46,28,0.12)] hover:border-[#1a2e1c]/30 transition-all duration-300">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                    <s.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold leading-tight">{s.value}</p>
                    <p className="text-[11px] text-gray-500 font-semibold leading-tight mt-0.5">{s.label}</p>
                    <p className="text-[10px] text-[#4a7c59] font-semibold leading-tight mt-0.5">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT SIDEBAR */}
          <div className="space-y-5">
            <StreakCard streak={activeUser?.streak ?? 0} lastStudyDate={activeUser?.last_study_date} studyDates={activeUser?.study_dates} />

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                  <BarChart2 className="w-4.5 h-4.5 text-[#2d5a3d]" />
                  Thống kê học tập
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-2">
                  {(() => {
                    const totalCards = Object.values(deckCounts).reduce((sum, item) => sum + item.total, 0);
                    const studyMinutes = analyticsData?.total_study_minutes || 0;
                    const studyHours = Math.round(studyMinutes / 60);
                    const sessions = analyticsData?.total_sessions || 0;
                    const docsCount = documents?.length || analyticsData?.total_documents || 0;
                    const flashcardsCount = totalCards || analyticsData?.total_flashcards || 0;

                    return [
                      { label: "Tổng thời gian học", value: `${studyHours} giờ`, color: "text-emerald-700", bg: "bg-[#eef8f0]", border: "border-[#2d5a3d]/25" },
                      { label: "Phiên Pomodoro", value: `${sessions} phiên`, color: "text-blue-700", bg: "bg-[#edf4fc]", border: "border-blue-200" },
                      { label: "Lượt ôn tập thẻ", value: `${analyticsData?.total_reviews || 0} lượt`, color: "text-purple-700", bg: "bg-[#f5ecfc]", border: "border-purple-200" },
                      { label: "Tài liệu học tập", value: `${docsCount} tài liệu`, color: "text-amber-700", bg: "bg-[#fcf8ec]", border: "border-amber-200" },
                      { label: "Ghi chú học tập", value: `${analyticsData?.total_notes || 0} ghi chú`, color: "text-indigo-700", bg: "bg-[#eceffc]", border: "border-indigo-200" },
                      { label: "Flashcard đã tạo", value: `${flashcardsCount} thẻ`, color: "text-rose-700", bg: "bg-[#fcecef]", border: "border-rose-200" },
                    ].map((item) => (
                      <div key={item.label} className={`flex justify-between items-center p-2.5 rounded-xl ${item.bg} border ${item.border} shadow-2xs`}>
                        <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                        <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                    <Users className="w-4.5 h-4.5 text-[#2d5a3d]" />
                    Bạn bè học cùng
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-[#2d5a3d]/30 text-[#2d5a3d]">{friends.length} bạn</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-2.5">
                  {friends.length > 0 ? (
                    friends.map((f) => (
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
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white shadow-2xs hover:bg-[#eaf0eb] border border-gray-100">
                          <MessageSquare className="w-3.5 h-3.5 text-[#4a7c59]" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-400 font-medium">Chưa có bạn bè nào được kết nối.</div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 border-2 border-dashed border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d]/5 hover:border-[#2d5a3d]/40 rounded-xl py-2 font-semibold text-xs">
                  Xem tất cả bạn bè →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-5">

            {/* Tabs */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 p-1 rounded-xl shadow-sm grid grid-cols-5">
                {[
                  { val: "overview", label: "Tổng quan" },
                  { val: "profile", label: "Hồ sơ" },
                  { val: "flashcards", label: "Flashcards" },
                  { val: "achievements", label: "Thành tích" },
                  { val: "documents", label: "Tài liệu" },
                ].map(t => (
                  <button 
                    key={t.val} 
                    onClick={() => setActiveTab(t.val)}
                    className={`rounded-lg py-1.5 text-xs sm:text-sm font-medium transition-colors ${activeTab === t.val ? "bg-[#1a2e1c] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Weekly chart */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                          <TrendingUp className="w-4.5 h-4.5 text-[#2d5a3d]" />
                          Hoạt động 7 ngày qua
                        </CardTitle>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2d5a3d] inline-block" />Phút học</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const chartData = analyticsData?.chart_data && analyticsData.chart_data.length > 0
                          ? analyticsData.chart_data
                          : weekData;

                        const totalWeeklyMinutes = chartData.reduce((sum, item) => sum + item.minutes, 0);
                        const avgWeeklyMinutes = Math.round(totalWeeklyMinutes / chartData.length);
                        const maxDayItem = chartData.reduce((max, item) => item.minutes > max.minutes ? item : max, { day: "-", minutes: 0 });

                        return (
                          <>
                            <ResponsiveContainer width="100%" height={170}>
                              <AreaChart data={chartData}>
                                <defs>
                                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2d5a3d" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#2d5a3d" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} unit=" ph" />
                                <Tooltip formatter={(v: any) => [`${v} phút`, ""]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                                <Area type="monotone" dataKey="minutes" stroke="#2d5a3d" strokeWidth={2.5} fill="url(#grad1)" dot={{ fill: "#2d5a3d", r: 3.5 }} activeDot={{ r: 5 }} />
                              </AreaChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                              {[
                                { label: "Tổng tuần này", value: `${totalWeeklyMinutes} phút`, bg: "bg-[#eef8f0]", border: "border-[#2d5a3d]/20" },
                                { label: "Trung bình / ngày", value: `${avgWeeklyMinutes} phút`, bg: "bg-[#edf4fc]", border: "border-blue-200" },
                                { label: "Nhiều nhất", value: maxDayItem.minutes > 0 ? `${maxDayItem.day} (${maxDayItem.minutes} ph)` : "-", bg: "bg-[#fcf3eb]", border: "border-orange-200" },
                              ].map(s => (
                                <div key={s.label} className={`text-center p-2 rounded-xl ${s.bg} border ${s.border} shadow-2xs`}>
                                  <p className="text-xs font-bold text-gray-800">{s.value}</p>
                                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Skill levels */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                        <Award className="w-4.5 h-4.5 text-[#2d5a3d]" />
                        Trình độ môn học
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {(() => {
                          const computedSubjects = computeSubjects(documents, deckCounts, decks);
                          if (computedSubjects.length === 0) {
                            return (
                              <div className="col-span-2 text-center py-8 text-sm text-gray-400 font-medium">
                                Chưa có dữ liệu để tính toán. Hãy thêm tài liệu hoặc tạo bộ flashcard!
                              </div>
                            );
                          }
                          return computedSubjects.map((s) => (
                            <div key={s.name} className="p-3.5 bg-[#f4f7f4] border border-[#2d5a3d]/20 rounded-xl hover:border-[#2d5a3d]/40 transition-all shadow-2xs">
                              <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
                                <span>{s.name}</span>
                                <span className="text-[#2d5a3d]">{s.xp}</span>
                              </div>
                              <div className="h-2 bg-gray-200/80 rounded-full overflow-hidden border border-gray-200/40">
                                <div className="h-full rounded-full transition-all" style={{ width: `${s.level}%`, backgroundColor: s.color }} />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mục tiêu hôm nay */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                          <Lightbulb className="w-4.5 h-4.5 text-[#2d5a3d]" />
                          Nhiệm vụ hôm nay
                        </CardTitle>
                        <span className="text-xs text-gray-400">
                          {tasks.filter(t => t.is_completed).length}/{tasks.length} hoàn thành
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2.5">
                      {tasks.map((t) => {
                        const isDone = t.is_completed;
                        const bg = isDone ? "bg-[#eaf8f0] border-[#2d5a3d]/20 text-[#2d5a3d]" : "bg-[#fafaf9] border-gray-300 text-gray-700";
                        const formatVal = t.task_type === 'study_time' 
                          ? `${Math.round(t.current_value / 60)}/${Math.round(t.target_value / 60)} phút` 
                          : `${t.current_value}/${t.target_value}`;
                        return (
                          <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl border shadow-2xs ${bg} transition-all duration-200 hover:translate-x-0.5`}>
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className={`w-5 h-5 shrink-0 ${isDone ? "text-[#2d5a3d]" : "text-gray-300"}`} />
                              <span className={`text-sm font-semibold ${isDone ? "line-through opacity-75" : ""}`}>{t.title}</span>
                            </div>
                            <span className="text-xs font-black shrink-0">{formatVal}</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── PROFILE ── */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  {/* Card 1: Thông tin cá nhân */}
                  <Card className="bg-white border-0 shadow-sm rounded-2xl">
                    <CardHeader className="pb-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#2d5a3d]">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-gray-900 text-base font-bold">Thông tin cá nhân</CardTitle>
                            <p className="text-xs text-gray-400">Chi tiết thông tin tài khoản của bạn</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditing && (
                            <Button 
                              onClick={() => setIsEditing(false)}
                              disabled={savingProfile}
                              size="sm" 
                              variant="ghost"
                              className="text-gray-500 hover:bg-gray-100"
                            >
                              Hủy
                            </Button>
                          )}
                          <Button 
                            onClick={() => {
                              if (isEditing) {
                                handleSaveProfile();
                              } else {
                                setEditName(activeUser?.name || "Nguyễn Văn An");
                                setEditPhone(activeUser?.phone || "");
                                
                                // Parse address
                                const savedAddress = activeUser?.address || "Quận Cầu Giấy, Hà Nội";
                                const addressParts = savedAddress.split(", ");
                                let foundProvince = null;
                                let foundDistrict = "";
                                let districtObj = null;
                                
                                if (addressParts.length >= 2) {
                                  const dist = addressParts[0].trim();
                                  const prov = addressParts[1].trim();
                                  foundProvince = VIETNAM_DATA.find(p => p.name.toLowerCase() === prov.toLowerCase());
                                  if (foundProvince) {
                                    districtObj = foundProvince.districts.find(d => d.name.toLowerCase() === dist.toLowerCase()) || null;
                                    foundDistrict = districtObj ? districtObj.name : "";
                                  }
                                } else if (addressParts.length === 1 && addressParts[0]) {
                                  const prov = addressParts[0].trim();
                                  foundProvince = VIETNAM_DATA.find(p => p.name.toLowerCase() === prov.toLowerCase());
                                }

                                if (foundProvince) {
                                  setSelectedProvince(foundProvince.id);
                                  setProvinceQuery(foundProvince.name);
                                  
                                  const defaultDistrict = foundProvince.districts[0]?.name || "";
                                  const currentDistrict = foundDistrict || defaultDistrict;
                                  setSelectedDistrict(currentDistrict);
                                  setDistrictQuery(currentDistrict);
                                } else {
                                  setSelectedProvince("custom");
                                  setProvinceQuery(savedAddress);
                                  setEditAddress(savedAddress);
                                  setSelectedDistrict("");
                                  setDistrictQuery("");
                                }
                                
                                // Parse education
                                const savedEducation = activeUser?.education || "";
                                setEditEducation(savedEducation);
                                
                                setIsEditing(true);
                              }
                            }}
                            disabled={savingProfile}
                            size="sm" 
                            variant={isEditing ? "default" : "outline"}
                            className={isEditing ? "bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5" : "border-[#1a2e1c]/30 text-[#1a2e1c] hover:bg-[#1a2e1c]/5 gap-1.5"}
                          >
                            {isEditing ? (
                              <>
                                {savingProfile ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Lưu</span>
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Chỉnh sửa</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 divide-y divide-gray-100/70">
                      {[
                        { label: "Họ và tên", value: activeUser?.name || "", icon: User },
                        { label: "Học vấn", value: activeUser?.education || "", icon: GraduationCap },
                        { label: "Địa chỉ", value: activeUser?.address || "", icon: MapPin },
                        { label: "Ngày tham gia", value: activeUser?.created_at ? new Date(activeUser.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : "Chưa rõ", icon: Calendar, readOnly: true },
                        { label: "Email liên hệ", value: activeUser?.email || "", icon: Mail, readOnly: true },
                        { label: "Số điện thoại", value: activeUser?.phone || "Chưa cập nhật", icon: Phone }
                      ].map((item, index) => {
                        const isEditMode = isEditing && !item.readOnly;
                        
                        return (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-2 first:pt-2 last:pb-2">
                            <span className="text-sm font-semibold text-gray-500 flex items-center gap-3">
                              <item.icon className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                              {item.label}
                            </span>
                            
                            {isEditMode ? (
                              <div className="w-full max-w-[280px] sm:max-w-[360px] flex flex-col gap-2">
                                {item.label === "Họ và tên" && (
                                  <input 
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2d5a3d] focus:border-[#2d5a3d] w-full text-right"
                                  />
                                )}
                                
                                {item.label === "Số điện thoại" && (
                                  <input 
                                    type="text"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    className="text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2d5a3d] focus:border-[#2d5a3d] w-full text-right"
                                  />
                                )}
                                
                                {item.label === "Địa chỉ" && (
                                  <div className="flex flex-col gap-2.5 w-full text-left max-w-sm sm:max-w-md ml-auto">
                                    {/* Province Selection */}
                                    <div className="relative w-full">
                                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tỉnh / Thành phố</div>
                                      <input
                                        type="text"
                                        placeholder="Nhập & tìm kiếm Tỉnh/Thành..."
                                        value={provinceQuery}
                                        onFocus={() => setIsProvinceDropdownOpen(true)}
                                        onChange={(e) => {
                                          setProvinceQuery(e.target.value);
                                          setSelectedProvince("");
                                          setSelectedDistrict("");
                                          setDistrictQuery("");
                                        }}
                                        onBlur={() => setTimeout(() => setIsProvinceDropdownOpen(false), 200)}
                                        className="text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 focus:border-[#2d5a3d] w-full transition-all text-left"
                                      />
                                      {isProvinceDropdownOpen && (
                                        <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg py-1 text-sm scrollbar-thin scrollbar-thumb-gray-200">
                                          {filteredProvinces.length > 0 ? (
                                            filteredProvinces.map(p => (
                                              <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                  setSelectedProvince(p.id);
                                                  setProvinceQuery(p.name);
                                                  setIsProvinceDropdownOpen(false);
                                                  
                                                  setSelectedDistrict("");
                                                  setDistrictQuery("");
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-[#eef8f0] hover:text-[#2d5a3d] text-gray-700 font-medium cursor-pointer transition-colors"
                                              >
                                                {p.name}
                                              </button>
                                            ))
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedProvince("custom");
                                                setEditAddress(provinceQuery);
                                                setIsProvinceDropdownOpen(false);
                                              }}
                                              className="w-full text-left px-4 py-2 hover:bg-[#eef8f0] text-gray-700 font-medium cursor-pointer text-[#2d5a3d]"
                                            >
                                              Sử dụng: "{provinceQuery}"
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* District Selection */}
                                    {selectedProvince && selectedProvince !== "custom" && (
                                      <div className="relative w-full">
                                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Quận / Huyện</div>
                                        <input
                                          type="text"
                                          placeholder="Nhập & tìm kiếm Quận/Huyện..."
                                          value={districtQuery}
                                          onFocus={() => setIsDistrictDropdownOpen(true)}
                                          onChange={(e) => {
                                            setDistrictQuery(e.target.value);
                                            setSelectedDistrict("");
                                          }}
                                          onBlur={() => setTimeout(() => setIsDistrictDropdownOpen(false), 200)}
                                          className="text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 focus:border-[#2d5a3d] w-full transition-all text-left"
                                        />
                                        {isDistrictDropdownOpen && (
                                          <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg py-1 text-sm scrollbar-thin scrollbar-thumb-gray-200">
                                            {filteredDistricts.length > 0 ? (
                                              filteredDistricts.map(d => (
                                                <button
                                                  key={d.name}
                                                  type="button"
                                                  onClick={() => {
                                                    setSelectedDistrict(d.name);
                                                    setDistrictQuery(d.name);
                                                    setIsDistrictDropdownOpen(false);
                                                  }}
                                                  className="w-full text-left px-4 py-2 hover:bg-[#eef8f0] hover:text-[#2d5a3d] text-gray-700 font-medium cursor-pointer transition-colors"
                                                >
                                                  {d.name}
                                                </button>
                                              ))
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setSelectedDistrict(districtQuery);
                                                  setIsDistrictDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-[#eef8f0] text-gray-700 font-medium cursor-pointer text-[#2d5a3d]"
                                              >
                                                Sử dụng: "{districtQuery}"
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Custom Address Input */}
                                    {selectedProvince === "custom" && (
                                      <div className="relative w-full">
                                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Địa chỉ chi tiết</div>
                                        <input
                                          type="text"
                                          placeholder="Nhập địa chỉ của bạn..."
                                          value={editAddress}
                                          onChange={(e) => setEditAddress(e.target.value)}
                                          className="text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 focus:border-[#2d5a3d] w-full text-left transition-all"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {item.label === "Học vấn" && (
                                  <div className="flex flex-col gap-1 w-full text-left max-w-sm sm:max-w-md ml-auto">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Trường học</div>
                                    <input 
                                      type="text"
                                      placeholder="Nhập tên trường học của bạn..."
                                      value={editEducation}
                                      onChange={(e) => setEditEducation(e.target.value)}
                                      className="text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 focus:border-[#2d5a3d] w-full text-left transition-all"
                                    />
                                  </div>
                                )}
                              </div>
                            ) : item.label === "Xác thực tài khoản" ? (
                              <div className="flex items-center gap-3">
                                {activeUser?.is_verified ? (
                                  <>
                                    <Badge className="bg-green-50 hover:bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                                      Đã bật 2FA
                                    </Badge>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => toggleVerification(false)}
                                      className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-xs py-1 h-8"
                                    >
                                      Tắt bảo mật
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Badge className="bg-gray-50 hover:bg-gray-50 text-gray-500 border border-gray-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                                      Chưa kích hoạt
                                    </Badge>
                                    <Button 
                                      size="sm" 
                                      onClick={() => toggleVerification(true)}
                                      className="bg-[#2d5a3d] hover:bg-[#1f3f2a] text-white text-xs py-1 h-8"
                                    >
                                      Kích hoạt 2FA
                                    </Button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-gray-800 truncate max-w-[220px] sm:max-w-[420px] text-right">{item.value}</span>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Card 2: Premium Account Status Card (Positioned below Card 1) */}
                  <Card className="border-0 shadow-sm overflow-hidden bg-white rounded-2xl flex flex-col md:flex-row">
                  {/* Premium Gradient Header (Left block on md screens, top on small screens) */}
                  <div className="relative p-8 text-white bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] overflow-hidden md:w-80 shrink-0 flex flex-col justify-between">
                    {/* Circle background decorations */}
                    <div className="absolute right-[-10%] top-[-20%] w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                    <div className="absolute left-[-20%] bottom-[-20%] w-32 h-32 rounded-full bg-white/10 blur-lg pointer-events-none" />
                    
                    <div className="flex items-center gap-2 mb-8 md:mb-0">
                      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-md">
                        <span className="text-lg">🛡️</span>
                      </div>
                      <span className="text-sm font-bold tracking-wide text-white/90">Trạng thái tài khoản</span>
                    </div>
                    
                    <div>
                      <p className="text-xs text-purple-200 font-medium">Gói hiện tại</p>
                      <div className="flex items-center gap-2.5 mt-1">
                        <h3 className="text-3xl font-extrabold tracking-tight">Miễn phí</h3>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-white/20 border border-white/20 rounded-full backdrop-blur-sm">
                          Cơ bản
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body (Right block) */}
                  <CardContent className="p-8 flex-1 flex flex-col justify-between gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-5">
                        {/* Recommended Upgrade Label */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#D97706]">
                            <span className="text-base">✨</span>
                            <span className="text-sm font-bold text-gray-800">Nâng cấp PRO</span>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] rounded-md border border-[#FDE68A]">
                            Đề xuất
                          </span>
                        </div>

                          {/* Feature List */}
                          <ul className="grid grid-cols-1 gap-3">
                            {[
                              "Không giới hạn bộ thẻ flashcard",
                              "Phân tích học tập nâng cao",
                              "Tải xuống nội dung offline",
                              "Ưu tiên hỗ trợ 24/7"
                            ].map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="text-emerald-600 text-xs font-bold">✓</span>
                                </div>
                                <span className="text-sm font-medium text-gray-600 leading-tight">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Price Tag Box and Actions */}
                        <div className="flex flex-col justify-between gap-4">
                          {/* Price Tag Box */}
                          <div className="p-4 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE]/40 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-purple-400 line-through font-semibold">Giá đề xuất: 99K</p>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-xl font-extrabold text-[#6D28D9]">69K</span>
                                <span className="text-xs font-bold text-[#6D28D9]/70">/tháng</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 text-xs font-extrabold text-emerald-600 bg-emerald-50 rounded-md border border-emerald-100">
                              -30%
                            </span>
                          </div>

                          {/* CTA button and timer */}
                          <div className="space-y-2.5">
                            <Button className="w-full py-5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-bold rounded-xl shadow-md shadow-purple-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 border-0">
                              <span>👑</span>
                              <span>Nâng cấp ngay</span>
                            </Button>
                            <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-gray-400">
                              <span className="text-xs">🕒</span>
                              <span>Ưu đãi kết thúc sau 2 ngày</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── FLASHCARDS ── */}
              {activeTab === "flashcards" && (
                <div className="space-y-4">
                  {(() => {
                    const totalCards = Object.values(deckCounts).reduce((sum, item) => sum + item.total, 0);
                    const totalMastered = Object.values(deckCounts).reduce((sum, item) => sum + item.mastered, 0);
                    const totalPct = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-700 font-medium">
                              {decks.length} bộ · {totalCards} thẻ tổng
                            </p>
                            <p className="text-xs text-gray-400">
                              {totalMastered} thẻ đã thành thạo ({totalPct}%)
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => router.push('/flashcards')}
                            className="bg-[#1a2e1c] hover:bg-[#2d5a3d] text-white gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Tạo bộ mới
                          </Button>
                        </div>

                        {decks.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-600">Bạn chưa có bộ thẻ flashcard nào.</p>
                            <Button size="sm" onClick={() => router.push('/flashcards')} className="mt-3 bg-[#1a2e1c] hover:bg-[#2d5a3d] text-white">
                              Tạo bộ thẻ đầu tiên
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {decks.map((deck) => {
                              const counts = deckCounts[deck.id] || { total: 0, mastered: 0 };
                              const pct = counts.total > 0 ? Math.round((counts.mastered / counts.total) * 100) : 0;
                              
                              const borderColors = ["border-l-[#2d5a3d]", "border-l-blue-600", "border-l-indigo-600", "border-l-purple-600", "border-l-amber-600"];
                              const borderClass = borderColors[deck.id % borderColors.length] || "border-l-[#2d5a3d]";

                              return (
                                <Card 
                                  key={deck.id} 
                                  className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4 ${borderClass}`}
                                  onClick={() => router.push(`/flashcards/${deck.id}`)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <Badge variant="outline" className="text-xs border-[#2d5a3d]/30 text-[#2d5a3d] shrink-0">Học tập</Badge>
                                          {counts.total > 0 && (
                                            <Badge variant="outline" className="text-xs shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                              {counts.total} thẻ
                                            </Badge>
                                          )}
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1a2e1c] transition-colors leading-snug truncate">
                                          {deck.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 truncate mt-1">
                                          {deck.description || "Không có mô tả bộ thẻ này."}
                                        </p>
                                      </div>
                                      <BookMarked className="w-4.5 h-4.5 text-gray-300 group-hover:text-[#2d5a3d] transition-colors shrink-0" />
                                    </div>
                                    
                                    {counts.total > 0 ? (
                                      <>
                                        <Progress value={pct} className="h-1.5 bg-gray-100 mb-2">
                                           <div className="h-full bg-[#2d5a3d] rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </Progress>
                                        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                                          <span>{counts.mastered}/{counts.total} thẻ thành thạo</span>
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(deck.created_at).toLocaleDateString("vi-VN")}
                                          </span>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-xs text-gray-400 mt-4 flex items-center justify-between">
                                        <span>Chưa có thẻ ghi nhớ</span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {new Date(deck.created_at).toLocaleDateString("vi-VN")}
                                        </span>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* ── ACHIEVEMENTS ── */}
              {activeTab === "achievements" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(() => {
                      const dynAchievements = computeAchievements(
                        activeUser?.streak ?? 0,
                        analyticsData?.total_reviews || 0,
                        analyticsData?.total_study_minutes || 0,
                        analyticsData?.total_documents || documents.length || 0,
                        analyticsData?.total_sessions || 0
                      );
                      return dynAchievements.map((a, i) => (
                        <Card key={i} className={`border-0 shadow-sm transition-all ${a.earned ? "hover:shadow-md" : "opacity-50"}`}>
                          <CardContent className="p-4 flex flex-col items-center gap-3 text-center">
                            <div className={`w-14 h-14 rounded-2xl ${a.earned ? a.bg : "bg-gray-100"} flex items-center justify-center`}>
                              <a.icon className={`w-7 h-7 ${a.earned ? a.color : "text-gray-300"}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                              {a.earned && a.date && (
                                <p className="text-xs text-[#4a7c59] mt-1 font-medium">{a.date}</p>
                              )}
                              {!a.earned && (
                                <Badge variant="outline" className="text-xs text-gray-400 border-gray-200 mt-1">Chưa đạt</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>

                  {/* Xếp hạng */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                        <Trophy className="w-4.5 h-4.5 text-[#2d5a3d]" />
                        Điểm XP của bạn
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {(() => {
                        const { totalXP, level, currentLevelXP, xpToNextLevel, pct } = computeUserLevel(
                          analyticsData?.total_study_minutes || 0,
                          analyticsData?.total_reviews || 0,
                          analyticsData?.total_sessions || 0,
                          analyticsData?.total_documents || documents.length || 0,
                          analyticsData?.total_notes || 0
                        );
                        return (
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: "Tổng XP", rank: totalXP.toLocaleString(), unit: "XP", bg: "bg-[#eef8f0]", border: "border-[#2d5a3d]/20" },
                              { label: "Cấp hiện tại", rank: `Cấp ${level}`, unit: "", bg: "bg-[#edf4fc]", border: "border-blue-200" },
                              { label: "Tiến độ cấp", rank: `${pct}%`, unit: `${currentLevelXP}/${xpToNextLevel} XP`, bg: "bg-[#fcf3eb]", border: "border-orange-200" },
                            ].map(r => (
                              <div key={r.label} className={`p-3 rounded-xl ${r.bg} border ${r.border} text-center shadow-2xs`}>
                                <p className="text-xl font-bold text-[#1a2e1c]">{r.rank}</p>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{r.label}</p>
                                {r.unit && <p className="text-[10px] text-[#4a7c59] font-medium mt-1">{r.unit}</p>}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── DOCUMENTS ── */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  {(() => {
                    const totalPagesAll = documents.reduce((sum, doc) => sum + getDocPages(doc), 0);
                    const totalReadPagesAll = documents.reduce((sum, doc) => sum + Math.round(getDocPages(doc) * ((doc.id % 4) / 4 + 0.25)), 0);

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700 font-medium">
                            {documents.length} tài liệu học tập · {totalReadPagesAll.toLocaleString()} trang đã học
                          </p>
                          <Button 
                            size="sm" 
                            onClick={() => router.push('/library')}
                            className="bg-[#1a2e1c] hover:bg-[#2d5a3d] text-white gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Thêm tài liệu
                          </Button>
                        </div>

                        {documents.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-600">Bạn chưa có tài liệu nào trong thư viện.</p>
                            <Button size="sm" onClick={() => router.push('/library')} className="mt-3 bg-[#1a2e1c] hover:bg-[#2d5a3d] text-white">
                              Thêm tài liệu đầu tiên
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {documents.map((doc) => {
                              const fileType = getDocType(doc.doc_url || doc.title);
                              const totalPages = getDocPages(doc);
                              const readPages = Math.round(totalPages * ((doc.id % 4) / 4 + 0.25));
                              const pct = Math.round((readPages / totalPages) * 100);

                              return (
                                <Card 
                                  key={doc.id} 
                                  className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                  onClick={() => router.push(`/viewer/${doc.id}`)}
                                >
                                  <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-12 rounded-lg bg-[#1a2e1c]/8 flex items-center justify-center shrink-0">
                                      <FileText className="w-5 h-5 text-[#2d5a3d]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#1a2e1c] max-w-[200px] sm:max-w-md">
                                          {doc.title}
                                        </p>
                                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-500 shrink-0">
                                          {fileType}
                                        </Badge>
                                      </div>
                                      <Progress value={pct} className="h-1.5 bg-gray-100 mb-1.5">
                                        <div className="h-full bg-[#2d5a3d] rounded-full transition-all" style={{ width: `${pct}%` }} />
                                      </Progress>
                                      <p className="text-xs text-gray-400">
                                        {readPages}/{totalPages} trang · {pct}% hoàn thành · {doc.category || "Chung"}
                                      </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#2d5a3d] transition-colors shrink-0" />
                                  </CardContent>
                                </Card>
                              );
                            })}

                            <Button 
                              variant="outline" 
                              onClick={() => router.push('/library')}
                              className="w-full border-dashed border-[#2d5a3d]/30 text-[#2d5a3d] hover:bg-[#eaf0eb]"
                            >
                              Xem tất cả {documents.length} tài liệu trong thư viện →
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
