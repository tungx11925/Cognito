"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Trophy,
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
  Palette,
  EyeOff,
  Activity,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStudy } from "@/context/StudyContext";
import { Navbar } from "@/components/landing/Navbar";
import RegisterModal from "@/components/auth/RegisterModal";
import {
  getDecks,
  createDeck,
  getAllFlashcards,
  createFlashcard
} from "@/services/flashcard.service";
import { Background, BackgroundStyle } from "@/components/flashcards/Background";
import AIFlashcardLab from "@/components/flashcards/AIFlashcardLab";

// ── Types ──────────────────────────────────────────────────────────────────

interface Flashcard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  ease_factor: number;
  repetitions: number;
  interval_days: number;
  next_review_at?: string;
  tag?: string;
}

interface Deck {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

// Helper colors for decks
const COLOR_PALETTE = [
  "#2d5a3d", // forest
  "#1a3a5c", // blue
  "#5c1a1a", // red
  "#4d1a5c", // purple
  "#5c451a", // orange/gold
];

// ── Sub-components ─────────────────────────────────────────────────────────

function DeckCard({
  deck,
  dark,
  onSelect,
  total,
  mastered,
  color,
}: {
  deck: Deck;
  dark: boolean;
  onSelect: () => void;
  total: number;
  mastered: number;
  color: string;
}) {
  const router = useRouter();
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  return (
    <div
      onClick={onSelect}
      className="rounded-2xl p-5 cursor-pointer hover:-translate-y-1 transition-all duration-200"
      style={{
        background: dark ? "#1e1e1e" : "#ffffff",
        border: `2px solid ${dark ? "#2a2a2a" : "rgba(26,46,28,0.28)"}`,
        boxShadow: dark
          ? "4px 4px 0px 0px rgba(255,255,255,0.04)"
          : "4px 4px 0px 0px rgba(26,46,28,0.12)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: color + "22" }}
        >
          <BookOpen size={18} color={color} />
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/flashcards/${deck.id}?mode=dashboard`)}
            className="text-[10px] px-2 py-1 rounded-lg font-bold transition-all bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 hover:bg-emerald-100 hover:scale-105"
            title="Quản lý & chỉnh sửa thẻ"
          >
            Chỉnh sửa
          </button>
          <button
            onClick={onSelect}
            className="text-[10px] px-2 py-1 rounded-lg font-bold transition-all bg-[#1a2e1c] text-white hover:bg-[#2d5a3d] hover:scale-105"
          >
            Học tập
          </button>
        </div>
      </div>

      <h3
        className="mb-1 truncate"
        style={{
          fontWeight: 700,
          color: dark ? "#f0f0f0" : "#1a2e1c",
          fontSize: 15,
        }}
      >
        {deck.name}
      </h3>
      <p
        className="mb-4 text-xs line-clamp-2 h-8"
        style={{
          color: dark ? "#9ca3af" : "#6b7280",
        }}
      >
        {deck.description || "Không có mô tả bộ thẻ này."}
      </p>

      <div className="mb-2 flex items-center justify-between">
        <span
          style={{
            fontSize: 12,
            color: dark ? "#9ca3af" : "#6b7280",
          }}
        >
          {mastered}/{total} thẻ đã học
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: dark ? "#10b981" : "#1a2e1c",
          }}
        >
          {pct}%
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: dark ? "#2a2a2a" : "#e5e0d8" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: dark ? "#10b981" : "#1a2e1c" }}
        />
      </div>
    </div>
  );
}

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

// ── Root Page Export ────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    triggerMessage,
    globalMessage
  } = useStudy();

  const [dark, setDark] = useState(false);
  
  // Modals
  const [showAILab, setShowAILab] = useState(false);
  
  // Real database states
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckCounts, setDeckCounts] = useState<Record<number, { total: number; mastered: number; due: number }>>({});
  const [loadingDecks, setLoadingDecks] = useState(true);

  // Deck creation modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [muted, setMuted] = useState(false);
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>("nebula");

  // Load theme, sound settings, background style and decks
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
    
    const savedBg = (localStorage.getItem("flashcard-bg") as BackgroundStyle) || "nebula";
    setBgStyle(savedBg);
    
    fetchDecks();
  }, []);

  // Refetch decks when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchDecks();
    } else {
      setDecks([]);
      setDeckCounts({});
    }
  }, [isAuthenticated]);

  const fetchDecks = async () => {
    try {
      setLoadingDecks(true);
      const data = await getDecks();
      if (data && Array.isArray(data)) {
        setDecks(data);

        // Fetch cards for all decks to calculate counts
        const countsMap: Record<number, { total: number; mastered: number; due: number }> = {};
        await Promise.all(
          data.map(async (deck: Deck) => {
            try {
              const cardsList = await getAllFlashcards(deck.id);
              if (Array.isArray(cardsList)) {
                const total = cardsList.length;
                // progress/mastered is now based on repetitions > 0 so progress registers immediately
                const mastered = cardsList.filter((c: any) => c.repetitions > 0).length;
                // Cards due to review (next_review_at <= now or null)
                const due = cardsList.filter((c: any) => {
                  if (!c.next_review_at) return true;
                  return new Date(c.next_review_at) <= new Date();
                }).length;

                countsMap[deck.id] = { total, mastered, due };
              } else {
                countsMap[deck.id] = { total: 0, mastered: 0, due: 0 };
              }
            } catch (e) {
              countsMap[deck.id] = { total: 0, mastered: 0, due: 0 };
            }
          })
        );
        setDeckCounts(countsMap);
      } else {
        setDecks([]);
        console.error("Lỗi khi tải danh sách bộ thẻ: Dữ liệu trả về không hợp lệ", data);
        if (data && data.error) {
          triggerMessage(`Lỗi kết nối máy chủ: ${data.error}`, "error");
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách bộ thẻ:", error);
      setDecks([]);
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    setIsCreating(true);
    try {
      await createDeck(newDeckName, newDeckDesc);
      setShowCreateModal(false);
      setNewDeckName("");
      setNewDeckDesc("");
      triggerMessage("Tạo bộ thẻ mới thành công!", "success");
      fetchDecks();
    } catch (error) {
      console.error("Lỗi khi tạo bộ thẻ:", error);
      triggerMessage("Không thể tạo bộ thẻ mới.", "error");
    } finally {
      setIsCreating(false);
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

  // Daily suggestion deck (find deck with most due cards)
  let suggestedDeck: Deck | null = null;
  let maxDue = 0;
  for (const d of decks) {
    const dueCount = deckCounts[d.id]?.due || 0;
    if (dueCount > maxDue) {
      maxDue = dueCount;
      suggestedDeck = d;
    }
  }

  const suggest = suggestedDeck;

  // Calculate totals
  const totalDecks = decks.length;
  const totalCards = Object.values(deckCounts).reduce((acc, curr) => acc + curr.total, 0);
  const totalMastered = Object.values(deckCounts).reduce((acc, curr) => acc + curr.mastered, 0);
  const totalDue = Object.values(deckCounts).reduce((acc, curr) => acc + curr.due, 0);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 pb-10 relative overflow-x-hidden"
      style={{
        background: bgStyle === "default" ? (dark ? "#121212" : "#ebe8e0") : "transparent",
      }}
    >
      <Background styleType={bgStyle} dark={dark} />
      {/* Toast Notification */}
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

      {/* Standalone Landing Navbar */}
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/home')}
        activeUser={activeUser!}
      />

      {/* Secondary Custom Toolbar Sub-navbar */}
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center border-b"
          style={{ borderColor: dark ? "#222" : "rgba(26,46,28,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <Link href="/home" className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-80"
              style={{ color: primaryColor }}
            >
              <ArrowLeft size={14} /> Bảng điều khiển
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
                Thẻ ghi nhớ
              </h1>
              <p style={{ color: textSub, fontSize: 13 }}>
                Ôn luyện thông minh với thuật toán lặp lại ngắt quãng (Spaced Repetition)
              </p>
            </div>
            {isAuthenticated && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAILab(true)}
                  className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm border border-emerald-200 hover:bg-emerald-100"
                >
                  <Sparkles size={14} />
                  Tạo bằng AI
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-[#1a2e1c] hover:opacity-90 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  style={{ background: primaryColor }}
                >
                  <Plus size={14} />
                  Tạo bộ thẻ
                </button>
              </div>
            )}
          </div>

          {/* Stats badges Row */}
          <div className="flex flex-wrap gap-3">
            <StatBadge
              dark={dark}
              icon={<Layers size={16} color={primaryColor} />}
              label="Tổng bộ thẻ"
              value={`${totalDecks} bộ`}
            />
            <StatBadge
              dark={dark}
              icon={<Trophy size={16} color="#f59e0b" />}
              label="Đã học"
              value={`${totalMastered}/${totalCards} thẻ`}
            />
            <StatBadge
              dark={dark}
              icon={<Clock size={16} color="#6366f1" />}
              label="Cần ôn hôm nay"
              value={`${totalDue} thẻ`}
            />
          </div>

          {/* Daily Suggestion Banner */}
          {suggest && (
            <div
              onClick={() => router.push(`/flashcards/${suggest.id}?mode=study`)}
              className="rounded-2xl p-5 flex items-center justify-between cursor-pointer z-10 hover:opacity-95 transition-opacity duration-200"
              style={{
                background: dark
                  ? "linear-gradient(135deg, #10b98118, #05966905)"
                  : "linear-gradient(135deg, #1a2e1c, #2d5a3d)",
                border: `2px solid ${dark ? "#10b98133" : "rgba(26,46,28,0.1)"}`,
                boxShadow: dark
                  ? "4px 4px 0 rgba(255,255,255,0.04)"
                  : "4px 4px 0 rgba(26,46,28,0.25)",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: dark ? "#10b981" : "#86efac",
                    marginBottom: 2,
                    letterSpacing: "0.08em",
                  }}
                >
                  ĐỀ XUẤT ÔN LUYỆN
                </p>
                <h2
                  style={{
                    fontWeight: 800,
                    color: "#fff",
                    fontSize: 18,
                  }}
                >
                  {suggest.name}
                </h2>
                <p
                  style={{
                    color: "#86efac",
                    fontSize: 12,
                  }}
                >
                  {deckCounts[suggest.id]?.due || 0} thẻ đến hạn cần ôn ngay
                </p>
              </div>
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold"
                style={{
                  background: "#fff",
                  color: "#1a2e1c",
                  fontSize: 13,
                  border: "none",
                }}
              >
                <Zap size={13} />
                Bắt đầu
              </button>
            </div>
          )}

          {/* Decks Listing Grid */}
          <div className="space-y-3">
            <h2
              style={{
                fontWeight: 700,
                color: textMain,
                fontSize: 16,
              }}
            >
              Bộ thẻ ghi nhớ của bạn
            </h2>

            {loadingDecks ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
              </div>
            ) : decks.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300">Chưa có bộ thẻ nào</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">Hãy tạo một bộ thẻ mới để bắt đầu học tập.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck, idx) => {
                  const counts = deckCounts[deck.id] || { total: 0, mastered: 0 };
                  const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
                  return (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      dark={dark}
                      total={counts.total}
                      mastered={counts.mastered}
                      color={color}
                      onSelect={() => router.push(`/flashcards/${deck.id}?mode=study`)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Deck */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div 
            className="rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-2"
            style={{
              background: dark ? "#1e1e1e" : "#ffffff",
              borderColor: dark ? "#3a3a3a" : "rgba(26,46,28,0.22)",
              color: textMain,
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <div className="p-6">
              <h2 className="text-base font-bold mb-4" style={{ color: textMain }}>Tạo Bộ thẻ mới</h2>
              <form onSubmit={handleCreateDeck}>
                <div className="space-y-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: textSub }}>
                      Tên bộ thẻ <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      value={newDeckName}
                      onChange={e => setNewDeckName(e.target.value)}
                      placeholder="VD: Từ vựng IELTS, Lịch sử Việt Nam..."
                      className="w-full px-4 py-2 text-sm outline-none rounded-xl transition-all"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.15)"}`,
                        background: dark ? "#2d2d2d" : "#fbfbfa",
                        color: textMain,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: textSub }}>
                      Mô tả bộ thẻ
                    </label>
                    <textarea 
                      value={newDeckDesc}
                      onChange={e => setNewDeckDesc(e.target.value)}
                      placeholder="Mô tả sơ lược về bộ thẻ..."
                      className="w-full px-4 py-2 text-sm outline-none rounded-xl transition-all resize-none h-24"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.15)"}`,
                        background: dark ? "#2d2d2d" : "#fbfbfa",
                        color: textMain,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 font-bold text-sm rounded-xl transition-colors"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      cursor: "pointer",
                      border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.15)"}`,
                      background: dark ? "#2a2a2a" : "#f3f3f0",
                      color: textSub,
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={isCreating || !newDeckName.trim()}
                    className="flex-1 px-4 py-2 font-bold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      cursor: "pointer",
                      border: "none",
                      background: primaryColor,
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >
                    {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI Flashcard Lab Modal */}
      <AnimatePresence>
        {showAILab && (
          <AIFlashcardLab 
            onClose={() => setShowAILab(false)} 
            onSaveDeck={async (cards, deckName) => {
              try {
                // 1. Tạo bộ thẻ rỗng trước
                const resDeck = await createDeck(deckName || "AI Flashcards", "Bộ thẻ được tạo tự động bởi AI");
                
                if (resDeck.error) {
                  triggerMessage(resDeck.error, "error");
                  return;
                }

                const deckId = resDeck.id;
                
                // 2. Loop qua tất cả các cards do AI sinh ra và insert vào database
                const insertPromises = cards.map(card => 
                  createFlashcard(deckId, card.front, card.back)
                );
                
                await Promise.all(insertPromises);

                triggerMessage(`Đã lưu ${cards.length} thẻ vào bộ "${deckName}" thành công!`, "success");
                setShowAILab(false);
                
                // Refresh lại danh sách decks để nó hiện số lượng thẻ đúng
                fetchDecks();
              } catch (e) {
                triggerMessage("Có lỗi khi lưu bộ thẻ", "error");
              }
            }} 
          />
        )}
      </AnimatePresence>

      {/* Login Modal for guest user */}
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
