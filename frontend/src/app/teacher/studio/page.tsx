"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation,
  BookOpen,
  Clock,
  Layers,
  Moon,
  Sun,
  Flame,
  Plus,
  Loader2,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  EyeOff,
  Activity,
  Palette,
  Play,
  Trash2,
  Upload,
  X,
  Search,
  CheckCircle2,
  FileText,
  Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStudy } from "@/context/StudyContext";
import { Navbar } from "@/components/landing/Navbar";
import RegisterModal from "@/components/auth/RegisterModal";
import { getLectures, uploadLecture, deleteLecture } from "@/services/lecture.service";
import { Background, BackgroundStyle } from "@/components/flashcards/Background";
import toast from "react-hot-toast";

// Helper color palette for lecture deck cards
const COLOR_PALETTE = [
  "#2d5a3d", // forest
  "#1a3a5c", // blue
  "#5c1a1a", // red
  "#4d1a5c", // purple
  "#5c451a", // orange/gold
];

function StatBadge({
  icon,
  label,
  value,
  dark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dark: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl flex-1 min-w-[140px]"
      style={{
        background: dark ? "#1e1e1e" : "#ffffff",
        border: `2px solid ${dark ? "#2a2a2a" : "rgba(26,46,28,0.2)"}`,
        boxShadow: dark
          ? "3px 3px 0 rgba(255,255,255,0.03)"
          : "3px 3px 0 rgba(26,46,28,0.1)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {icon}
      <div>
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: dark ? "#f0f0f0" : "#1a2e1c",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function TeacherStudioPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    triggerMessage,
    globalMessage,
  } = useStudy();

  const [dark, setDark] = useState(false);
  const [muted, setMuted] = useState(false);
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>("default");

  // Lectures data
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Trí tuệ nhân tạo");

  // Load theme, settings, and lectures
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "light";
    setDark(savedTheme === "dark");
    if (typeof window !== "undefined") {
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    const savedMute = localStorage.getItem("flashcard-muted") === "true";
    setMuted(savedMute);

    const savedBg = (localStorage.getItem("flashcard-bg") as BackgroundStyle) || "default";
    setBgStyle(savedBg);

    fetchLecturesData();
  }, []);

  // Auth Check
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/home');
      return;
    }
    if (activeUser && activeUser.role !== 'teacher') {
      router.push('/home');
      return;
    }
  }, [isAuthenticated, activeUser, router]);

  const fetchLecturesData = async () => {
    try {
      setLoading(true);
      const data = await getLectures();
      if (Array.isArray(data)) {
        setLectures(data);
      }
    } catch (e) {
      console.error(e);
      triggerMessage("Lỗi khi tải danh sách bài giảng", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Vui lòng chọn file tài liệu (PDF, DOCX, TXT)");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      if (title.trim()) formData.append("title", title.trim());
      if (subject.trim()) formData.append("subject", subject.trim());

      toast.loading("AI đang phân tích tài liệu và tạo Slide Chapter...", { id: "upload_lecture_studio" });
      const created = await uploadLecture(formData);
      toast.dismiss("upload_lecture_studio");

      if (created && created.id) {
        toast.success("Đã tạo bộ Slide bài giảng thành công!");
        setShowUploadModal(false);
        setFile(null);
        setTitle("");
        fetchLecturesData();
      } else {
        toast.error(created?.error || "Không thể tạo bài giảng lúc này.");
      }
    } catch (e) {
      toast.dismiss("upload_lecture_studio");
      toast.error("Đã có lỗi xảy ra trong quá trình xử lý file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLecture = async (id: number, lectureTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa bộ Slide "${lectureTitle}" không?`)) return;
    try {
      await deleteLecture(id);
      toast.success("Đã xóa bài giảng");
      setLectures((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      toast.error("Không thể xóa bài giảng");
    }
  };

  const handleToggleDark = () => {
    const nextDark = !dark;
    setDark(nextDark);
    localStorage.setItem("app-theme", nextDark ? "dark" : "light");
    if (typeof window !== "undefined") {
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    localStorage.setItem("flashcard-muted", String(nextMuted));
  };

  const handleCycleBg = () => {
    const bgStyles: BackgroundStyle[] = ["default", "nebula", "geometry"];
    const nextIdx = (bgStyles.indexOf(bgStyle) + 1) % bgStyles.length;
    const nextBg = bgStyles[nextIdx];
    setBgStyle(nextBg);
    localStorage.setItem("flashcard-bg", nextBg);
  };

  const primaryColor = dark ? "#10b981" : "#1a2e1c";
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const textSub = dark ? "#9ca3af" : "#6b7280";

  // Calculations
  const totalLectures = lectures.length;
  const totalSlides = lectures.reduce((acc, l) => acc + (Number(l.total_slides) || 0), 0);
  const totalChapters = lectures.reduce((acc, l) => acc + (Number(l.chapter_count) || 0), 0);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 pb-10 relative overflow-x-hidden"
      style={{
        background: bgStyle === "default" ? (dark ? "#121212" : "#ebe8e0") : "transparent",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <Background styleType={bgStyle} dark={dark} />

      {/* Toast Notification */}
      {globalMessage && globalMessage.text && (
        <div
          className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border ${
            globalMessage.type === "success"
              ? "bg-white text-emerald-700 border-emerald-200"
              : "bg-white text-rose-700 border-rose-200"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full animate-ping ${
              globalMessage.type === "success" ? "bg-emerald-400" : "bg-rose-400"
            }`}
          />
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* Global Navbar */}
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push("/library")}
        activeUser={activeUser!}
      />

      {/* Secondary Custom Toolbar Sub-navbar (GỌN GÀNG CHUẨN FLASHCARDS) */}
      <div className="pt-20">
        <div
          className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center border-b"
          style={{ borderColor: dark ? "#222" : "rgba(26,46,28,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <Link
              href="/library"
              className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-80"
              style={{ color: primaryColor }}
            >
              <ArrowLeft size={14} /> Thư viện của tôi
            </Link>
          </div>

          <div className="flex items-center gap-4 z-10">
            <div className="flex items-center gap-1.5 font-sans">
              <Flame size={16} color="#f97316" className="animate-pulse" />
              <span
                style={{
                  fontWeight: 700,
                  color: dark ? "#d1d5db" : "#374151",
                  fontSize: 13,
                }}
              >
                {activeUser?.streak || 0} ngày Streak
              </span>
            </div>

            {/* Mute/Unmute Toggle */}
            <button
              onClick={handleToggleMute}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 hover:opacity-80"
              style={{
                background: dark ? "#2a2a2a" : "#f3f3f0",
                border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.18)"}`,
                color: dark ? "#f0f0f0" : "#1a2e1c",
              }}
              title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {muted ? <VolumeX size={15} strokeWidth={2.75} /> : <Volume2 size={15} strokeWidth={2.75} />}
            </button>

            {/* Background Style Cycle */}
            <button
              onClick={handleCycleBg}
              className="px-3 h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:opacity-80 text-xs font-bold font-sans"
              style={{
                background: dark ? "#2a2a2a" : "#f3f3f0",
                border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.18)"}`,
                color: dark ? "#f0f0f0" : "#1a2e1c",
              }}
              title="Đổi kiểu hình nền"
            >
              {bgStyle === "default" && (
                <>
                  <EyeOff size={14} strokeWidth={2.75} /> Tối giản
                </>
              )}
              {bgStyle === "nebula" && (
                <>
                  <Palette size={14} className="text-emerald-500" strokeWidth={2.75} /> Tinh vân
                </>
              )}
              {bgStyle === "geometry" && (
                <>
                  <Activity size={14} className="text-blue-500" strokeWidth={2.75} /> Hình học
                </>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={handleToggleDark}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{
                background: dark ? "#2a2a2a" : "#f3f3f0",
                border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.18)"}`,
              }}
            >
              {dark ? (
                <Sun size={15} color="#10b981" strokeWidth={2.75} />
              ) : (
                <Moon size={15} color="#1a2e1c" strokeWidth={2.75} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-6 flex-1 flex flex-col overflow-x-hidden relative">
        <div className="flex-1 flex flex-col space-y-6 w-full">
          {/* Header section with Create New Button */}
          <div className="flex justify-between items-end">
            <div>
              <h1
                style={{
                  fontWeight: 800,
                  color: textMain,
                  fontSize: 26,
                  letterSpacing: "-0.5px",
                }}
              >
                Giảng dạy & Slide
              </h1>
              <p style={{ color: textSub, fontSize: 13 }}>
                Tải lên giáo trình tài liệu để AI tự động chuyển hóa thành Slide bài giảng trực quan theo Chapter
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
              >
                <Sparkles size={14} />
                Tạo bằng AI
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 hover:opacity-90 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                style={{ background: primaryColor }}
              >
                <Plus size={14} />
                Tải lên giáo trình
              </button>
            </div>
          </div>

          {/* Stats badges Row (3 THẺ THỐNG KÊ GỌN GÀNG) */}
          <div className="flex flex-wrap gap-3">
            <StatBadge
              dark={dark}
              icon={<Presentation size={18} color={primaryColor} />}
              label="Tổng bài giảng"
              value={`${totalLectures} bộ`}
            />
            <StatBadge
              dark={dark}
              icon={<Layers size={18} color="#f59e0b" />}
              label="Tổng Slide bài giảng"
              value={`${totalSlides || (totalLectures * 24)} slide`}
            />
            <StatBadge
              dark={dark}
              icon={<Clock size={18} color="#6366f1" />}
              label="Chapter đã phân tách"
              value={`${totalChapters || (totalLectures * 3)} Chapter`}
            />
          </div>

          {/* Section Heading */}
          <div className="flex items-center justify-between">
            <h2
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: textMain,
              }}
            >
              Bộ bài giảng của bạn
            </h2>
            <span className="text-xs font-semibold" style={{ color: textSub }}>
              Phân quyền: <b style={{ color: textMain }}>Teacher / Giảng viên</b>
            </span>
          </div>

          {/* Main Area: Empty state or Grid of Lecture Cards */}
          {loading ? (
            <div
              className="p-12 rounded-3xl flex flex-col items-center justify-center"
              style={{
                background: dark ? "#1e1e1e" : "#ffffff",
                border: `2px solid ${dark ? "#2a2a2a" : "rgba(26,46,28,0.2)"}`,
              }}
            >
              <Loader2 className="w-8 h-8 animate-spin text-[#1a3d28] mb-3" />
              <p className="text-xs font-bold" style={{ color: textSub }}>
                Đang tải danh sách bài giảng & Slide...
              </p>
            </div>
          ) : lectures.length === 0 ? (
            <div
              className="p-12 rounded-3xl flex flex-col items-center justify-center text-center"
              style={{
                background: dark ? "#1e1e1e" : "#ffffff",
                border: `2px solid ${dark ? "#2a2a2a" : "rgba(26,46,28,0.2)"}`,
                boxShadow: dark
                  ? "4px 4px 0px 0px rgba(255,255,255,0.04)"
                  : "4px 4px 0px 0px rgba(26,46,28,0.12)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(26, 61, 40, 0.08)" }}
              >
                <Presentation size={28} color={primaryColor} />
              </div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: textMain,
                  marginBottom: 6,
                }}
              >
                Chưa có bộ bài giảng nào
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: textSub,
                  maxWidth: 380,
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                Hãy tải lên một bộ giáo trình tài liệu để bắt đầu tạo Slide trình chiếu theo từng Chapter.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                style={{ background: primaryColor }}
              >
                <Plus size={14} /> Tạo bộ bài giảng mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {lectures.map((lecture, idx) => {
                const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
                return (
                  <div
                    key={lecture.id}
                    className="rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200"
                    style={{
                      background: dark ? "#1e1e1e" : "#ffffff",
                      border: `2px solid ${dark ? "#2a2a2a" : "rgba(26,46,28,0.28)"}`,
                      boxShadow: dark
                        ? "4px 4px 0px 0px rgba(255,255,255,0.04)"
                        : "4px 4px 0px 0px rgba(26,46,28,0.12)",
                    }}
                  >
                    <div>
                      {/* Top Bar with Icon & Actions */}
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: color + "22" }}
                        >
                          <Presentation size={18} color={color} />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleDeleteLecture(lecture.id, lecture.title, e)}
                            className="text-[10px] px-2 py-1 rounded-lg font-bold transition-all bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:scale-105"
                            title="Xóa bài giảng"
                          >
                            Xóa
                          </button>
                          <Link
                            href={`/teacher/presentation/${lecture.id}`}
                            className="text-[10px] px-3 py-1 rounded-lg font-bold transition-all text-white hover:scale-105 flex items-center gap-1"
                            style={{ background: primaryColor }}
                          >
                            <Play size={10} className="fill-white" /> Trình chiếu
                          </Link>
                        </div>
                      </div>

                      <h3
                        className="mb-1 truncate font-bold text-base"
                        style={{ color: textMain }}
                        title={lecture.title}
                      >
                        {lecture.title}
                      </h3>
                      <p
                        className="mb-4 text-xs line-clamp-2 h-8 leading-relaxed"
                        style={{ color: textSub }}
                      >
                        {lecture.description || "Giáo trình bài giảng trực quan theo từng Chapter, sẵn sàng trình chiếu."}
                      </p>
                    </div>

                    <div>
                      <div
                        className="flex items-center justify-between text-xs font-semibold pt-3 border-t"
                        style={{ borderColor: dark ? "#2a2a2a" : "rgba(26,46,28,0.08)" }}
                      >
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <Layers size={13} /> {lecture.total_slides || 24} slide bài giảng
                        </span>
                        <span style={{ color: textSub }} className="flex items-center gap-1">
                          <Clock size={13} /> {lecture.chapter_count || 3} Chapter
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal (MATCHING THE MODAL COMPONENT STYLE) */}
      <AnimatePresence>
        {showUploadModal && (
          <div
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => !uploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="rounded-3xl p-6 max-w-lg w-full shadow-2xl relative"
              style={{
                background: dark ? "#1e1e1e" : "#ffffff",
                border: `2px solid ${dark ? "#2a2a2a" : "rgba(26,46,28,0.2)"}`,
                color: textMain,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="absolute top-5 right-5 p-1.5 rounded-xl transition-colors cursor-pointer"
                style={{ color: textSub }}
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#1a3d28] flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Tải lên Giáo trình / Slide</h3>
                  <p className="text-xs" style={{ color: textSub }}>
                    AI sẽ tự động tách các Chapter thành Slide trình chiếu chuẩn sư phạm
                  </p>
                </div>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: textMain }}>
                    Tên bài giảng / Môn học
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Kỹ thuật Lập trình Web & AI"
                    className="w-full px-4 py-2.5 text-xs rounded-xl focus:outline-none transition-all"
                    style={{
                      background: dark ? "#161616" : "#f5f3ee",
                      color: textMain,
                      border: `1px solid ${dark ? "#333" : "rgba(26,46,28,0.15)"}`,
                    }}
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: textMain }}>
                    Chủ đề / Ngành học
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl focus:outline-none transition-all"
                    style={{
                      background: dark ? "#161616" : "#f5f3ee",
                      color: textMain,
                      border: `1px solid ${dark ? "#333" : "rgba(26,46,28,0.15)"}`,
                    }}
                    disabled={uploading}
                  >
                    <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo & Machine Learning</option>
                    <option value="Khoa học máy tính">Khoa học máy tính / CNTT</option>
                    <option value="Toán học & Giải tích">Toán học & Giải tích</option>
                    <option value="Kinh tế & Quản trị">Kinh tế & Quản trị</option>
                    <option value="Ngoại ngữ & Ngôn ngữ">Ngoại ngữ & Ngôn ngữ</option>
                    <option value="Khác">Chủ đề khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: textMain }}>
                    Tệp tài liệu giáo trình (PDF, DOCX, TXT)
                  </label>
                  <label
                    className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                    style={{
                      borderColor: dark ? "#333" : "rgba(26,46,28,0.2)",
                      background: dark ? "#161616" : "rgba(245,243,238,0.5)",
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Upload size={22} className="text-emerald-600" />
                    <span className="text-xs font-bold" style={{ color: textMain }}>
                      {file ? file.name : "Bấm để chọn file hoặc kéo thả vào đây"}
                    </span>
                    <span className="text-[11px]" style={{ color: textSub }}>
                      {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Hỗ trợ PDF, Word (.docx) tối đa 25MB"}
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="w-full py-3 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    style={{ background: primaryColor }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> AI đang bóc tách Slide & Chapter...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Bắt đầu tạo Slide Trình chiếu
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
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
