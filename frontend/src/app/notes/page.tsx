"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Search, Plus, Trash2, Edit3, Save, 
  Paperclip, BookOpen, Loader2, ArrowLeft, Copy, 
  ExternalLink, Clock, X, Flame, Volume2, VolumeX, 
  EyeOff, Palette, Activity, Sun, Moon, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/landing/Navbar';
import { Background } from '@/components/flashcards/Background';
import { useStudy } from '@/context/StudyContext';
import RegisterModal from '@/components/auth/RegisterModal';
import PremiumModal from '@/components/layout/PremiumModal';
import { 
  getNotes, createNote, updateNote, deleteNote, NoteItem 
} from '@/services/note.service';
import { getDocuments } from '@/services/document.service';

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

export default function NotesPage() {
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

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [documents, setDocuments] = useState<Array<{ id: number; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('ALL');
  
  // Selected note for viewing/editing
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
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

  const fetchNotesList = useCallback(async () => {
    if (!isAuthenticated) {
      setNotes([]);
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
      const res = await getNotes(params);
      let fetchedNotes = res?.notes || [];
      if (selectedDocId === 'STANDALONE') {
        fetchedNotes = fetchedNotes.filter(n => !n.document_id);
      }
      setNotes(fetchedNotes);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, searchQuery, selectedDocId]);

  useEffect(() => {
    fetchNotesList();
  }, [fetchNotesList]);

  // Load user's documents for the dropdown selector
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
      triggerMessage('Vui lòng đăng nhập để tạo ghi chú mới', 'error');
      return;
    }
    setIsCreating(true);
    setIsEditing(false);
    setFormTitle('Ghi chú mới');
    setFormContent('');
    setFormDocId(selectedDocId !== 'ALL' && selectedDocId !== 'STANDALONE' ? parseInt(selectedDocId, 10) : null);
    setActiveNote(null);
  };

  const handleStartEdit = (note: NoteItem) => {
    setIsEditing(true);
    setIsCreating(false);
    setActiveNote(note);
    setFormTitle(note.title || 'Ghi chú');
    setFormContent(note.content || '');
    setFormDocId(note.document_id || null);
  };

  const handleSave = async () => {
    if (!formContent.trim()) {
      toast.error('Vui lòng nhập nội dung ghi chú');
      return;
    }

    try {
      setSaving(true);
      if (isCreating) {
        const res = await createNote({
          title: formTitle.trim() || 'Ghi chú mới',
          content: formContent.trim(),
          document_id: formDocId,
        });
        toast.success('Đã tạo ghi chú thành công!');
        setIsCreating(false);
        await fetchNotesList();
        if (res?.note) setActiveNote(res.note);
      } else if (isEditing && activeNote) {
        const res = await updateNote(activeNote.id, {
          title: formTitle.trim() || 'Ghi chú',
          content: formContent.trim(),
          document_id: formDocId,
        });
        toast.success('Đã lưu thay đổi ghi chú!');
        setIsEditing(false);
        await fetchNotesList();
        if (res?.note) setActiveNote(res.note);
      }
    } catch (err: any) {
      console.error('Error saving note:', err);
      toast.error(err.message || 'Không thể lưu ghi chú');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ghi chú này? Thao tác không thể hoàn tác.')) {
      return;
    }

    try {
      await deleteNote(noteId);
      toast.success('Đã xóa ghi chú');
      if (activeNote?.id === noteId) {
        setActiveNote(null);
        setIsEditing(false);
        setIsCreating(false);
      }
      fetchNotesList();
    } catch (err: any) {
      console.error('Error deleting note:', err);
      toast.error(err.message || 'Lỗi khi xóa ghi chú');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép nội dung vào bộ nhớ tạm');
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 pb-12 relative overflow-x-hidden"
      style={{
        background: bgStyle === "default" ? (dark ? "#121212" : "#FDFCFB") : "transparent",
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
          
          {/* VIEW: MAIN LIST OF NOTES */}
          {!activeNote && !isCreating && !isEditing ? (
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
                    Sổ tay ghi chú học tập
                  </h1>
                  <p style={{ color: textSub, fontSize: 13 }}>
                    Quản lý và tra cứu ghi chú kiến thức cá nhân
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2 bg-[#1a2e1c] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 hover:opacity-90"
                    style={{ background: primaryColor }}
                  >
                    <Plus size={14} />
                    Soạn ghi chú mới
                  </button>
                </div>
              </div>

              {/* Stats badges Row */}
              <div className="flex flex-wrap gap-3">
                <StatBadge
                  dark={dark}
                  icon={<FileText size={16} color={primaryColor} />}
                  label="Tổng số ghi chú"
                  value={`${notes.length} ghi chú`}
                />
                <StatBadge
                  dark={dark}
                  icon={<BookOpen size={16} color="#f59e0b" />}
                  label="Theo tài liệu"
                  value={`${notes.filter(n => n.document_id).length} ghi chú`}
                />
                <StatBadge
                  dark={dark}
                  icon={<Layers size={16} color="#6366f1" />}
                  label="Ghi chú độc lập"
                  value={`${notes.filter(n => !n.document_id).length} ghi chú`}
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
                    placeholder="Tìm kiếm ghi chú theo từ khóa..."
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
                  <option value="STANDALONE">Ghi chú độc lập</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id.toString()}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes Listing Grid */}
              <div className="space-y-3">
                <h2
                  style={{
                    fontWeight: 700,
                    color: textMain,
                    fontSize: 16,
                  }}
                >
                  Danh sách ghi chú của bạn
                </h2>

                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300">Chưa có ghi chú nào</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">Hãy tạo một ghi chú mới để bắt đầu lưu trữ kiến thức học tập.</p>
                    <button
                      onClick={handleStartCreate}
                      className="px-4 py-2 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm"
                      style={{ background: primaryColor }}
                    >
                      <Plus size={14} />
                      Soạn ghi chú ngay
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => setActiveNote(note)}
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
                              {note.title || 'Ghi chú không tiêu đề'}
                            </h3>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1 shrink-0">
                              <Clock size={11} />
                              {new Date(note.updated_at || note.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                            {note.content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
                          {note.document_title ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium rounded-md truncate max-w-[150px]">
                              <BookOpen size={10} className="shrink-0" />
                              <span className="truncate">{note.document_title}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 dark:bg-zinc-800/60 text-gray-400 dark:text-zinc-500 text-[10px] font-medium rounded-md">
                              Độc lập
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(note.content)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-lg transition-colors"
                              title="Sao chép"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => handleStartEdit(note)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(note.id)}
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
            /* VIEW: NOTE EDITOR / READER VIEW */
            <div className="space-y-4">
              <button
                onClick={() => {
                  setActiveNote(null);
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-80"
                style={{ color: primaryColor }}
              >
                <ArrowLeft size={14} /> Quay lại danh sách ghi chú
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
                          {isCreating ? 'Soạn ghi chú mới' : 'Chỉnh sửa ghi chú'}
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
                          <span>Lưu ghi chú</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                        Tiêu đề ghi chú
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Nhập tiêu đề ghi chú..."
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
                        <option value="">-- Không gắn (Ghi chú độc lập) --</option>
                        {documents.map((doc) => (
                          <option key={doc.id} value={doc.id.toString()}>
                            {doc.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                        Nội dung chi tiết
                      </label>
                      <textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        rows={12}
                        placeholder="Viết nội dung ghi chú, công thức, tóm tắt bài học tại đây..."
                        className="w-full p-4 text-xs font-sans leading-relaxed border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 dark:focus:ring-emerald-500/20 resize-y"
                      />
                    </div>
                  </div>
                ) : activeNote ? (
                  /* Reader */
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 leading-snug">
                          {activeNote.title || 'Ghi chú không tiêu đề'}
                        </h2>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Cập nhật: {new Date(activeNote.updated_at || activeNote.created_at).toLocaleString('vi-VN')}
                          </span>
                          {activeNote.document_title && (
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-medium">
                              <Paperclip size={11} />
                              {activeNote.document_title}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopy(activeNote.content)}
                          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Sao chép nội dung"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleStartEdit(activeNote)}
                          className="p-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Chỉnh sửa ghi chú"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(activeNote.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Xóa ghi chú"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 text-sm text-gray-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {activeNote.content}
                    </div>

                    {activeNote.document_id && (
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300">Ghi chú gắn liền với tài liệu:</p>
                            <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium truncate">{activeNote.document_title}</p>
                          </div>
                        </div>
                        <Link
                          href={`/viewer/${activeNote.document_id}`}
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
