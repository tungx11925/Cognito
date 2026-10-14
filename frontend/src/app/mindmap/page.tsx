"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Network, Search, Plus, Trash2, Edit3, Save, 
  Paperclip, BookOpen, Loader2, ArrowLeft, Copy, 
  ExternalLink, Sparkles, RefreshCw, X, Clock,
  Flame, Volume2, VolumeX, EyeOff, Palette, Activity, Sun, Moon, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/landing/Navbar';
import { Background } from '@/components/flashcards/Background';
import { useStudy } from '@/context/StudyContext';
import { 
  getMindmaps, createMindmap, updateMindmap, deleteMindmap, MindmapItem 
} from '@/services/mindmap.service';
import { getDocuments } from '@/services/document.service';

const MermaidViewer = dynamic(
  () => import('@/components/documents/MermaidViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  }
);

const RegisterModal = dynamic(
  () => import('@/components/auth/RegisterModal'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  }
);

const PremiumModal = dynamic(
  () => import('@/components/layout/PremiumModal'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  }
);

const DEFAULT_TEMPLATES = [
  {
    name: 'Sơ đồ tư duy cơ bản',
    code: `mindmap
  root((Chủ đề trọng tâm))
    Nhánh 1: Khái niệm
      Định nghĩa cơ bản
      Thuộc tính chính
    Nhánh 2: Nguyên lý hoạt động
      Quy trình bước 1
      Quy trình bước 2
    Nhánh 3: Ứng dụng thực tế
      Ví dụ minh họa
      Bài tập áp dụng`,
  },
  {
    name: 'Cấu trúc hệ thống / Phân loại',
    code: `mindmap
  root((Hệ thống kiến thức))
    Phần 1: Lý thuyết
      Công thức
      Định lý
    Phần 2: Phương pháp giải
      Dạng 1: Cơ bản
      Dạng 2: Nâng cao
    Phần 3: Lưu ý quan trọng
      Bẫy đề thi
      Mẹo ghi nhớ`,
  },
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
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[140px]"
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
        <div style={{ fontSize: 11, color: "#9ca3af" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#f3f4f6" : "#111827" }}>{value}</div>
      </div>
    </div>
  );
}

export default function MindmapPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    showPremiumModal,
    setShowPremiumModal,
    activeUser,
    triggerMessage,
  } = useStudy();

  const [dark, setDark] = useState(false);
  const [muted, setMuted] = useState(false);
  const [bgStyle, setBgStyle] = useState<"default" | "nebula" | "geometry">("default");

  const [mindmaps, setMindmaps] = useState<MindmapItem[]>([]);
  const [documents, setDocuments] = useState<Array<{ id: number; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('ALL');

  const [activeMindmap, setActiveMindmap] = useState<MindmapItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formMermaidCode, setFormMermaidCode] = useState('');
  const [formDocId, setFormDocId] = useState<number | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "light";
    setDark(savedTheme === "dark");

    const onThemeChange = (e: any) => {
      if (e.detail?.theme) {
        setDark(e.detail.theme === "dark");
      }
    };
    window.addEventListener("cognito:theme_change", onThemeChange);
    return () => {
      window.removeEventListener("cognito:theme_change", onThemeChange);
    };
  }, []);

  const handleToggleDark = () => {
    const nextDark = !dark;
    setDark(nextDark);
    localStorage.setItem("app-theme", nextDark ? "dark" : "light");
    window.dispatchEvent(new CustomEvent("cognito:theme_change", { detail: { theme: nextDark ? "dark" : "light" } }));
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
    const bgStyles: ("default" | "nebula" | "geometry")[] = ["default", "nebula", "geometry"];
    const nextIdx = (bgStyles.indexOf(bgStyle) + 1) % bgStyles.length;
    const nextBg = bgStyles[nextIdx];
    setBgStyle(nextBg);
    localStorage.setItem("flashcard-bg", nextBg);
  };

  const primaryColor = dark ? "#10b981" : "#1a2e1c";
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const textSub = dark ? "#9ca3af" : "#6b7280";

  const fetchMindmapsList = useCallback(async () => {
    if (!isAuthenticated) {
      setMindmaps([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params: { q?: string; document_id?: number } = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedDocId !== 'ALL' && selectedDocId !== 'STANDALONE') {
        params.document_id = parseInt(selectedDocId, 10);
      }
      const res = await getMindmaps(params);
      let fetched = res?.mindmaps || [];
      if (selectedDocId === 'STANDALONE') {
        fetched = fetched.filter(m => !m.document_id);
      }
      setMindmaps(fetched);
    } catch (err: any) {
      console.error('Error fetching mindmaps:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, searchQuery, selectedDocId]);

  useEffect(() => {
    fetchMindmapsList();
  }, [fetchMindmapsList]);

  useEffect(() => {
    if (!isAuthenticated) {
      setDocuments([]);
      return;
    }
    const fetchDocs = async () => {
      try {
        const res = await getDocuments();
        if (res && Array.isArray(res)) {
          setDocuments(res);
        } else if (res?.documents && Array.isArray(res.documents)) {
          setDocuments(res.documents);
        }
      } catch (err) {
        console.error('Error loading documents:', err);
      }
    };
    fetchDocs();
  }, [isAuthenticated]);

  const handleStartCreate = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      triggerMessage('Vui lòng đăng nhập để tạo sơ đồ tư duy mới', 'error');
      return;
    }
    setIsCreating(true);
    setIsEditing(false);
    setFormTitle('Sơ đồ tư duy mới');
    setFormMermaidCode(DEFAULT_TEMPLATES[0].code);
    setFormDocId(selectedDocId !== 'ALL' && selectedDocId !== 'STANDALONE' ? parseInt(selectedDocId, 10) : null);
    setActiveMindmap(null);
  };

  const handleStartEdit = (item: MindmapItem) => {
    setIsEditing(true);
    setIsCreating(false);
    setActiveMindmap(item);
    setFormTitle(item.title || 'Sơ đồ tư duy');
    setFormMermaidCode(item.mermaid_code || DEFAULT_TEMPLATES[0].code);
    setFormDocId(item.document_id || null);
  };

  const handleSave = async () => {
    if (!formMermaidCode.trim()) {
      toast.error('Vui lòng nhập mã sơ đồ Mermaid');
      return;
    }

    try {
      setSaving(true);
      if (isCreating) {
        const res = await createMindmap({
          title: formTitle.trim() || 'Sơ đồ tư duy mới',
          mermaid_code: formMermaidCode.trim(),
          document_id: formDocId,
        });
        toast.success('Đã tạo sơ đồ tư duy thành công!');
        setIsCreating(false);
        await fetchMindmapsList();
        if (res?.mindmap) setActiveMindmap(res.mindmap);
      } else if (isEditing && activeMindmap) {
        const res = await updateMindmap(activeMindmap.id, {
          title: formTitle.trim() || 'Sơ đồ tư duy',
          mermaid_code: formMermaidCode.trim(),
          document_id: formDocId,
        });
        toast.success('Đã lưu thay đổi sơ đồ!');
        setIsEditing(false);
        await fetchMindmapsList();
        if (res?.mindmap) setActiveMindmap(res.mindmap);
      }
    } catch (err: any) {
      console.error('Error saving mindmap:', err);
      toast.error(err.message || 'Không thể lưu sơ đồ tư duy');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sơ đồ này? Thao tác không thể hoàn tác.')) {
      return;
    }

    try {
      await deleteMindmap(id);
      toast.success('Đã xóa sơ đồ tư duy');
      if (activeMindmap?.id === id) {
        setActiveMindmap(null);
        setIsEditing(false);
        setIsCreating(false);
      }
      fetchMindmapsList();
    } catch (err: any) {
      console.error('Error deleting mindmap:', err);
      toast.error(err.message || 'Lỗi khi xóa sơ đồ tư duy');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã Mermaid');
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 pb-12 relative overflow-x-hidden"
      style={{
        background: bgStyle === "default" ? (dark ? "#121212" : "#ebe8e0") : "transparent",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <Background styleType={bgStyle} dark={dark} />

      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser}
      />

      {/* Secondary Custom Toolbar Sub-navbar */}
      <div className="pt-20">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center border-b"
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
              {bgStyle === "default" && <><EyeOff size={14} strokeWidth={2.75} /> Tối giản</>}
              {bgStyle === "nebula" && <><Palette size={14} className="text-emerald-500" strokeWidth={2.75} /> Tinh vân</>}
              {bgStyle === "geometry" && <><Activity size={14} className="text-blue-500" strokeWidth={2.75} /> Hình học</>}
            </button>

            <button
              onClick={handleToggleDark}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{
                background: dark ? "#2a2a2a" : "#f3f3f0",
                border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.18)"}`,
              }}
            >
              {dark ? <Sun size={15} color="#10b981" strokeWidth={2.75} /> : <Moon size={15} color="#1a2e1c" strokeWidth={2.75} />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 flex-1 flex flex-col overflow-x-hidden relative">
        <div className="flex-1 flex flex-col space-y-6 w-full pb-16">

          {/* VIEW: MAIN LIST OF MINDMAPS */}
          {!activeMindmap && !isCreating && !isEditing ? (
            <>
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
                    Sơ đồ tư duy (Mindmap)
                  </h1>
                  <p style={{ color: textSub, fontSize: 13 }}>
                    Trực quan hóa cấu trúc kiến thức và mối quan hệ khái niệm
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2 bg-[#1a2e1c] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 hover:opacity-90"
                    style={{ background: primaryColor }}
                  >
                    <Plus size={14} />
                    Tạo sơ đồ mới
                  </button>
                </div>
              </div>

              {/* Stats badges Row */}
              <div className="flex flex-wrap gap-3">
                <StatBadge
                  dark={dark}
                  icon={<Network size={16} color={primaryColor} />}
                  label="Tổng số sơ đồ"
                  value={`${mindmaps.length} sơ đồ`}
                />
                <StatBadge
                  dark={dark}
                  icon={<BookOpen size={16} color="#f59e0b" />}
                  label="Theo tài liệu"
                  value={`${mindmaps.filter(m => m.document_id).length} sơ đồ`}
                />
                <StatBadge
                  dark={dark}
                  icon={<Layers size={16} color="#6366f1" />}
                  label="Mẫu sơ đồ"
                  value={`${DEFAULT_TEMPLATES.length} mẫu có sẵn`}
                />
              </div>

              {/* Search + Filter toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm sơ đồ theo tiêu đề..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-[#1a2e1c]/10 dark:focus:ring-emerald-500/20 transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-700 dark:text-zinc-300 focus:outline-hidden shadow-xs cursor-pointer"
                >
                  <option value="ALL">Tất cả tài liệu</option>
                  <option value="STANDALONE">Sơ đồ độc lập</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id.toString()}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mindmaps Listing Grid */}
              <div className="space-y-3">
                <h2
                  style={{
                    fontWeight: 700,
                    color: textMain,
                    fontSize: 16,
                  }}
                >
                  Danh sách sơ đồ tư duy của bạn
                </h2>

                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                  </div>
                ) : mindmaps.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800">
                    <Network className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300">Chưa có sơ đồ tư duy nào</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">Hãy tạo một sơ đồ mới hoặc chọn mẫu có sẵn để bắt đầu học tập.</p>
                    <button
                      onClick={handleStartCreate}
                      className="px-4 py-2 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm"
                      style={{ background: primaryColor }}
                    >
                      <Plus size={14} />
                      Tạo sơ đồ ngay
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mindmaps.map((mm) => (
                      <div
                        key={mm.id}
                        onClick={() => setActiveMindmap(mm)}
                        className="rounded-2xl p-5 cursor-pointer hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                        style={{
                          background: dark ? "#1e1e1e" : "#ffffff",
                          border: `2px solid ${dark ? "#2a2a2a" : "rgba(26,46,28,0.2)"}`,
                          boxShadow: dark
                            ? "3px 3px 0 rgba(255,255,255,0.03)"
                            : "3px 3px 0 rgba(26,46,28,0.1)",
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 line-clamp-1">
                              {mm.title || 'Sơ đồ tư duy'}
                            </h3>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1 shrink-0">
                              <Clock size={11} />
                              {new Date(mm.updated_at || mm.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>

                          <div className="bg-gray-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800/80 mb-4">
                            <p className="text-[11px] font-mono text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                              {mm.mermaid_code}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
                          {mm.document_title ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium rounded-md truncate max-w-[150px]">
                              <BookOpen size={10} className="shrink-0" />
                              <span className="truncate">{mm.document_title}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 dark:bg-zinc-800/60 text-gray-400 dark:text-zinc-500 text-[10px] font-medium rounded-md">
                              Độc lập
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopyCode(mm.mermaid_code)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-lg transition-colors"
                              title="Sao chép Mermaid"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => handleStartEdit(mm)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(mm.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* VIEW: MINDMAP VIEWER / EDITOR */
            <div className="space-y-4">
              <button
                onClick={() => {
                  setActiveMindmap(null);
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-80"
                style={{ color: primaryColor }}
              >
                <ArrowLeft size={14} /> Quay lại danh sách sơ đồ
              </button>

              <div
                className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-zinc-900 border"
                style={{
                  borderColor: dark ? "#2a2a2a" : "rgba(26,46,28,0.2)",
                  boxShadow: dark ? "4px 4px 0 rgba(255,255,255,0.03)" : "4px 4px 0 rgba(26,46,28,0.1)",
                }}
              >
                {isCreating || isEditing ? (
                  /* Form */
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Edit3 size={16} />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                          {isCreating ? 'Tạo sơ đồ tư duy mới' : 'Chỉnh sửa sơ đồ tư duy'}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsCreating(false);
                            setIsEditing(false);
                          }}
                          className="px-3 py-1.5 text-xs text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#0D2B24] hover:bg-[#16483C] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60"
                        >
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          <span>Lưu sơ đồ</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                        Tiêu đề sơ đồ
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Nhập tiêu đề sơ đồ tư duy..."
                        className="w-full px-3.5 py-2.5 text-sm font-semibold border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 dark:focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                        Gắn với tài liệu học tập (Tùy chọn)
                      </label>
                      <select
                        value={formDocId === null ? '' : formDocId.toString()}
                        onChange={(e) => setFormDocId(e.target.value ? parseInt(e.target.value, 10) : null)}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                      >
                        <option value="">-- Không gắn (Sơ đồ độc lập) --</option>
                        {documents.map((doc) => (
                          <option key={doc.id} value={doc.id.toString()}>
                            {doc.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Templates Selector */}
                    {isCreating && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                          Mẫu sơ đồ nhanh:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DEFAULT_TEMPLATES.map((tmpl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormMermaidCode(tmpl.code)}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-800 dark:hover:text-emerald-400 text-xs font-medium text-gray-700 dark:text-zinc-300 rounded-xl transition-colors border border-gray-200 dark:border-zinc-700"
                            >
                              {tmpl.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                          Mã Mermaid
                        </label>
                        <span className="text-[11px] text-gray-400 dark:text-zinc-500">Cú pháp Mermaid mindmap</span>
                      </div>
                      <textarea
                        value={formMermaidCode}
                        onChange={(e) => setFormMermaidCode(e.target.value)}
                        rows={7}
                        className="w-full p-3 font-mono text-xs border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 dark:focus:ring-emerald-500/20 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                        Xem trước trực quan
                      </h4>
                      <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-zinc-900/60 min-h-[300px]">
                        <MermaidViewer chartCode={formMermaidCode} />
                      </div>
                    </div>
                  </div>
                ) : activeMindmap ? (
                  /* Viewer */
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 leading-snug">
                          {activeMindmap.title || 'Sơ đồ tư duy'}
                        </h2>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Cập nhật: {new Date(activeMindmap.updated_at || activeMindmap.created_at).toLocaleString('vi-VN')}
                          </span>
                          {activeMindmap.document_title && (
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-medium">
                              <Paperclip size={11} />
                              {activeMindmap.document_title}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopyCode(activeMindmap.mermaid_code)}
                          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Sao chép mã Mermaid"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleStartEdit(activeMindmap)}
                          className="p-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Chỉnh sửa sơ đồ"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(activeMindmap.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Xóa sơ đồ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 shadow-xs overflow-auto flex items-center justify-center min-h-[450px]">
                      <MermaidViewer chartCode={activeMindmap.mermaid_code} />
                    </div>

                    {activeMindmap.document_id && (
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300">Sơ đồ gắn liền với tài liệu:</p>
                            <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium truncate">{activeMindmap.document_title}</p>
                          </div>
                        </div>
                        <Link
                          href={`/viewer/${activeMindmap.document_id}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-50 dark:hover:bg-zinc-700 shrink-0 transition-colors"
                        >
                          <span>Mở tài liệu</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}

        </div>
      </div>

      <RegisterModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        triggerMessage={triggerMessage} 
      />
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
      />
    </div>
  );
}
