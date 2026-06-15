"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Zap,
  BookOpen,
  Trophy,
  Clock,
  Layers,
  Check,
  X,
  Minus,
  Moon,
  Sun,
  GraduationCap,
  Flame,
  Plus,
  Loader2,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Palette,
  EyeOff,
  Activity
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
  reviewFlashcard,
  createFlashcard
} from "@/services/flashcard.service";
import confetti from "canvas-confetti";
import { playFlipSound, playSuccessSound, playHardSound, playCompleteSound } from "@/utils/sound";
import { Background, BackgroundStyle } from "@/components/flashcards/Background";
import MatchGameMode from "@/components/flashcards/modes/MatchGameMode";
import TestMode from "@/components/flashcards/modes/TestMode";
import LearnMode from "@/components/flashcards/modes/LearnMode";
import AIFlashcardLab from "@/components/flashcards/AIFlashcardLab";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import AudioButton from "@/components/flashcards/AudioButton";

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
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  return (
    <div
      onClick={onSelect}
      className="rounded-2xl p-5 cursor-pointer"
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
          <Link
            href={`/flashcards/${deck.id}`}
            className="text-[10px] px-2 py-1 rounded-lg font-bold transition-all bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 hover:bg-emerald-100 hover:scale-105"
            title="Quản lý & chỉnh sửa thẻ"
          >
            Chỉnh sửa
          </Link>
          <span
            onClick={() => onSelect()}
            className="text-[10px] px-2 py-1 rounded-lg font-bold cursor-pointer transition-all bg-[#1a2e1c] text-white hover:bg-[#2d5a3d] hover:scale-105"
            style={{
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Học tập
          </span>
        </div>
      </div>

      <h3
        className="mb-1 truncate"
        style={{
          fontWeight: 700,
          color: dark ? "#f0f0f0" : "#1a2e1c",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 15,
        }}
      >
        {deck.name}
      </h3>
      <p
        className="mb-4 text-xs line-clamp-2 h-8"
        style={{
          color: dark ? "#9ca3af" : "#6b7280",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {deck.description || "Không có mô tả bộ thẻ này."}
      </p>

      <div className="mb-2 flex items-center justify-between">
        <span
          style={{
            fontSize: 12,
            color: dark ? "#9ca3af" : "#6b7280",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {mastered}/{total} thẻ đã thuộc
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: dark ? "#10b981" : "#1a2e1c",
            fontFamily: "'Outfit', sans-serif",
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
          className="h-full rounded-full"
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
            color: dark ? "#9ca3af" : "#9ca3af",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: dark ? "#f0f0f0" : "#1a2e1c",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ── Main Study View ────────────────────────────────────────────────────────

function StudyView({
  dark,
  onBack,
  cards,
  deckTitle,
  muted,
  decks = [],
  onSwitchDeck,
  currentDeckId,
}: {
  dark: boolean;
  onBack: () => void;
  cards: Flashcard[];
  deckTitle: string;
  muted: boolean;
  decks?: Deck[];
  onSwitchDeck?: (deck: Deck) => void;
  currentDeckId?: number;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(1);
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);

  const card = cards[index];

  const { speak, isPlaying } = useTextToSpeech();

  // Settings
  const autoPlayAudio = false; // Tắt tự động phát âm thanh theo yêu cầu

  const playTTS = useCallback(() => {
    if (!card) return;
    const textToSpeak = flipped ? card.back : card.front;
    // Ngôn ngữ sẽ tự động detect bởi hệ thống Mixed Language TTS
    speak(textToSpeak);
  }, [card, flipped, speak]);

  // Auto Play Audio when card flips or index changes
  useEffect(() => {
    if (autoPlayAudio) {
      playTTS();
    }
  }, [index, flipped, autoPlayAudio, playTTS]);

  // Keyboard shortcut 'V' to play TTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'KeyV') {
        e.preventDefault();
        playTTS();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playTTS]);

  const progress = cards.length > 0 ? ((index + (flipped ? 0.5 : 0)) / cards.length) * 100 : 0;

  useEffect(() => {
    if (finished) {
      // Confetti burst logic
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      playCompleteSound(muted);

      return () => clearInterval(interval);
    }
  }, [finished, muted]);

  function goNext(e?: React.MouseEvent) {
    if (e?.currentTarget instanceof HTMLElement) e.currentTarget.blur();
    if (index === cards.length - 1) {
      setFinished(true);
      return;
    }
    setDirection(1);
    setFlipped(false);
    setTimeout(() => setIndex((i) => i + 1), 50);
  }

  function goPrev(e?: React.MouseEvent) {
    if (e?.currentTarget instanceof HTMLElement) e.currentTarget.blur();
    if (index === 0) return;
    setDirection(-1);
    setFlipped(false);
    setTimeout(() => setIndex((i) => i - 1), 50);
  }

  async function rate(r: "easy" | "good" | "hard") {
    setRatings((prev) => ({ ...prev, [card.id]: r }));
    
    // Play sound based on rating
    if (r === "hard") {
      playHardSound(muted);
    } else {
      playSuccessSound(muted);
    }

    // Call backend API in background
    try {
      await reviewFlashcard(card.id, r);
    } catch (err) {
      console.error("Lỗi khi đánh giá thẻ ghi nhớ:", err);
    }

    goNext();
  }

  const border = dark ? "#2a2a2a" : "rgba(26,46,28,0.3)";
  const shadow = dark
    ? "6px 6px 0px 0px rgba(255,255,255,0.04)"
    : "6px 6px 0px 0px rgba(26,46,28,0.14)";
  const primary = dark ? "#10b981" : "#1a2e1c";
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const textSub = dark ? "#9ca3af" : "#6b7280";

  // Dynamic card colors depending on if it's flipped (Answer face vs Question face)
  const isBackSide = flipped;
  const currentCardBg = isBackSide
    ? (dark ? "#0e2317" : "#1a3d28")
    : (dark ? "#1e1e1e" : "#fffdf0"); // warm yellow/cream paper note feel for front

  const currentCardBorder = isBackSide
    ? (dark ? "#10b981" : "#1a3d28")
    : border;

  const currentCardShadow = isBackSide
    ? (dark ? "8px 8px 0px 0px rgba(16,185,129,0.15)" : "8px 8px 0px 0px rgba(26,61,40,0.35)")
    : shadow;

  // Keyboard navigation
  useEffect(() => {
    if (finished || !card) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped(prev => !prev);
        playFlipSound(muted);
      }
      // Review hotkeys (only active when flipped)
      if (flipped) {
        if (e.key === "1") rate("hard");
        if (e.key === "2") rate("good");
        if (e.key === "3") rate("easy");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, finished, cards, muted, flipped]);

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="text-center max-w-sm p-8 rounded-2xl bg-white border border-gray-200 shadow-md">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">Bộ thẻ rỗng</h3>
          <p className="text-gray-500 mt-2 mb-6">Không có thẻ ghi nhớ nào trong bộ này để ôn tập.</p>
          <button
            onClick={onBack}
            className="w-full bg-[#1a2e1c] text-white py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Quay lại bộ thẻ
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const easy = Object.values(ratings).filter((r) => r === "easy").length;
    const ok = Object.values(ratings).filter((r) => r === "good").length;
    const hard = Object.values(ratings).filter((r) => r === "hard").length;

    return (
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center z-10"
          style={{
            background: dark ? "#1e1e1e" : "#ffffff",
            border: `2px solid ${border}`,
            boxShadow: shadow,
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: primary + "22" }}
          >
            <Trophy size={28} color={primary} />
          </div>
          <h2
            style={{ fontWeight: 800, color: textMain, fontSize: 22 }}
            className="mb-1"
          >
            Hoàn thành!
          </h2>
          <p style={{ color: textSub, fontSize: 14 }} className="mb-6">
            Bạn đã ôn {cards.length} thẻ trong phiên này
          </p>

          <div className="flex gap-3 mb-6">
            {[
              { label: "Dễ", count: easy, color: "#10b981" },
              { label: "Ổn", count: ok, color: "#f59e0b" },
              { label: "Khó", count: hard, color: "#ef4444" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex-1 rounded-xl py-3"
                style={{
                  background: s.color + "18",
                  border: `2px solid ${s.color}44`,
                }}
              >
                <div
                  style={{ fontWeight: 800, color: s.color, fontSize: 20 }}
                >
                  {s.count}
                </div>
                <div style={{ color: textSub, fontSize: 12 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setFinished(false);
                setIndex(0);
                setFlipped(false);
                setRatings({});
              }}
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: dark ? "#2a2a2a" : "#f0f0ec",
                border: `2px solid ${border}`,
                color: textMain,
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
              }}
            >
              <RotateCcw size={15} />
              Học lại
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl transition-all active:scale-95"
              style={{
                background: primary,
                color: "#fff",
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                border: "none",
              }}
            >
              Về bộ thẻ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-7xl mx-auto px-1 py-4 z-10"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* === LEFT COLUMN: STUDY STATS & QUICK SWITCHER === */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-5">
          {/* Progress Card */}
          <div 
            className="rounded-2xl p-5 border-2 transition-all duration-300"
            style={{
              background: dark ? "#1e1e1e" : "#ffffff",
              borderColor: dark ? "#2a2a2a" : "rgba(26,46,28,0.18)",
              boxShadow: dark ? "4px 4px 0px 0px rgba(255,255,255,0.03)" : "4px 4px 0px 0px rgba(26,46,28,0.08)",
            }}
          >
            <h3 className="text-sm font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Activity size={16} />
              Tiến trình học
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span style={{ color: textSub }}>Đã ôn tập:</span>
                <span style={{ color: textMain }}>{index + 1} / {cards.length} thẻ</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%`, background: primary }} 
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold pt-1">
                <span style={{ color: textSub }}>Hoàn thành:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Quick Deck Switcher */}
          {decks.length > 1 && (
            <div 
              className="rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col"
              style={{
                background: dark ? "#1e1e1e" : "#ffffff",
                borderColor: dark ? "#2a2a2a" : "rgba(26,46,28,0.18)",
                boxShadow: dark ? "4px 4px 0px 0px rgba(255,255,255,0.03)" : "4px 4px 0px 0px rgba(26,46,28,0.08)",
              }}
            >
              <h3 className="text-sm font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2 text-[#1a3d28] dark:text-emerald-400">
                <Layers size={16} />
                Bộ thẻ khác
              </h3>
              <div className="overflow-y-auto pr-1 space-y-2 max-h-[220px] custom-scrollbar">
                {decks.filter(d => d.id !== currentDeckId).slice(0, 5).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onSwitchDeck?.(d)}
                    className="w-full text-left p-3 rounded-xl border border-dashed transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-1 text-xs"
                    style={{
                      background: dark ? "#2a2a2a" : "#fbfbfa",
                      borderColor: dark ? "#3a3a3a" : "rgba(26,46,28,0.12)",
                      color: textMain
                    }}
                  >
                    <span className="font-bold truncate w-full">{d.name}</span>
                    <span style={{ color: textSub }} className="text-[10px] truncate w-full">
                      {d.description || "Không có mô tả."}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* === CENTER COLUMN: FLASHCARD PLAYER === */}
        <div className="col-span-1 lg:col-span-6 flex flex-col items-center gap-6">
          {/* Top control bar */}
          <div className="w-full flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
              style={{
                background: dark ? "#1e1e1e" : "#fff",
                border: `2px solid ${border}`,
                color: textSub,
                fontWeight: 600,
                fontSize: 13,
                fontFamily: "'Outfit', sans-serif",
                boxShadow: dark
                  ? "2px 2px 0 rgba(255,255,255,0.03)"
                  : "2px 2px 0 rgba(26,46,28,0.08)",
              }}
            >
              <ChevronLeft size={14} />
              Bộ thẻ
            </button>

            <span
              className="text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg max-w-[200px] truncate"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {deckTitle}
            </span>

            <span
              style={{
                fontWeight: 700,
                color: textMain,
                fontSize: 14,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {index + 1} / {cards.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <div
              className="w-full h-2.5 rounded-full overflow-hidden"
              style={{ background: dark ? "#2a2a2a" : "#e0dbd0" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${progress}%`, background: primary }}
              />
            </div>
          </div>

          {/* Flashcard */}
          <div className="w-full" style={{ perspective: 1200 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${card.id}-${flipped}`}
                initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                onClick={() => {
                  setFlipped((f) => !f);
                  playFlipSound(muted);
                }}
                className="rounded-2xl cursor-pointer select-none"
                style={{
                  background: currentCardBg,
                  border: `2px solid ${currentCardBorder}`,
                  boxShadow: currentCardShadow,
                  minHeight: 320,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2.5rem 2rem",
                  position: "relative",
                }}
              >
                {/* Tag and TTS Group */}
                <div className="absolute top-4 left-4 flex gap-2 z-20">
                  <span
                    className="text-xs px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: flipped ? "rgba(255, 255, 255, 0.12)" : (dark ? "#2a2a2a" : "#f0f0ec"),
                      color: flipped ? "#a7f3d0" : (dark ? "#9ca3af" : "#4b5563"),
                      fontWeight: 600,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {card.tag || "Thẻ học tập"}
                  </span>
                  <AudioButton 
                    isPlaying={isPlaying} 
                    onClick={playTTS} 
                    dark={dark || flipped} 
                  />
                </div>

                {/* Flip hint */}
                <span
                  className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-lg"
                  style={{
                    background: flipped
                      ? "rgba(52, 211, 153, 0.15)"
                      : dark
                      ? "#2a2a2a"
                      : "#f0f0ec",
                    color: flipped ? "#34d399" : textSub,
                    fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {flipped ? "Mặt sau" : "Mặt trước"}
                </span>

                {!flipped ? (
                  <div className="text-center w-full px-4">
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: textMain,
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: "-0.5px",
                        lineHeight: 1.3,
                      }}
                      className="break-words"
                    >
                      {card.front}
                    </div>
                    <p
                      className="mt-4 text-xs"
                      style={{ color: textSub, fontFamily: "'Outfit', sans-serif" }}
                    >
                      Nhấn để lật xem đáp án
                    </p>
                  </div>
                ) : (
                  <div className="text-center w-full px-4">
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#ffffff",
                        fontFamily: "'Outfit', sans-serif",
                        lineHeight: 1.4,
                      }}
                      className="break-words whitespace-pre-wrap"
                    >
                      {card.back}
                    </div>
                    <p
                      className="mt-4 text-xs"
                      style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Outfit', sans-serif" }}
                    >
                      Nhấn để lật lại câu hỏi
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Rating buttons — show only when flipped */}
          <div className="w-full h-14 relative flex justify-center items-center overflow-visible">
            <AnimatePresence>
              {flipped && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="w-full flex gap-3"
                >
                  {[
                    { label: "Khó", icon: <X size={16} />, color: "#ef4444", r: "hard" },
                    { label: "Ổn", icon: <Minus size={16} />, color: "#f59e0b", r: "good" },
                    { label: "Dễ", icon: <Check size={16} />, color: "#10b981", r: "easy" },
                  ].map((btn) => (
                    <button
                      key={btn.r}
                      onClick={(e) => {
                        e.stopPropagation();
                        rate(btn.r as any);
                      }}
                      className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90 font-bold"
                      style={{
                        background: btn.color + "18",
                        border: `2px solid ${btn.color}55`,
                        color: btn.color,
                        fontSize: 14,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {btn.icon}
                      {btn.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="w-full flex items-center justify-between mt-2">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: dark ? "#1e1e1e" : "#fff",
                border: `2px solid ${border}`,
                boxShadow: dark
                  ? "3px 3px 0 rgba(255,255,255,0.03)"
                  : "3px 3px 0 rgba(26,46,28,0.1)",
              }}
            >
              <ChevronLeft size={18} color={textMain} />
            </button>

            <button
              onClick={() => {
                setFlipped((f) => !f);
                playFlipSound(muted);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all active:scale-95 font-bold"
              style={{
                background: primary,
                color: "#fff",
                fontSize: 14,
                fontFamily: "'Outfit', sans-serif",
                border: "none",
              }}
            >
              <Zap size={15} />
              {flipped ? "Lật lại" : "Xem đáp án"}
            </button>

            <button
              onClick={goNext}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{
                background: dark ? "#1e1e1e" : "#fff",
                border: `2px solid ${border}`,
                boxShadow: dark
                  ? "3px 3px 0 rgba(255,255,255,0.03)"
                  : "3px 3px 0 rgba(26,46,28,0.1)",
              }}
            >
              <ChevronRight size={18} color={textMain} />
            </button>
          </div>

          <div className="text-gray-400 text-xs font-semibold text-center mt-2 max-w-sm">
            {flipped ? (
              "Sử dụng [1] Khó | [2] Ổn | [3] Dễ để đánh giá thẻ."
            ) : (
              "Sử dụng phím Space / Enter hoặc click vào thẻ để xem nghĩa."
            )}
          </div>
        </div>

        {/* === RIGHT COLUMN: KEYBOARD SHORTCUTS & MEMORIZATION TIPS === */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-5">
          {/* Shortcuts Card */}
          <div 
            className="rounded-2xl p-5 border-2 transition-all duration-300"
            style={{
              background: dark ? "#1e1e1e" : "#ffffff",
              borderColor: dark ? "#2a2a2a" : "rgba(26,46,28,0.18)",
              boxShadow: dark ? "4px 4px 0px 0px rgba(255,255,255,0.03)" : "4px 4px 0px 0px rgba(26,46,28,0.08)",
            }}
          >
            <h3 className="text-sm font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 text-amber-500">
              <Zap size={16} className="animate-pulse" />
              Phím tắt nhanh
            </h3>
            <div className="space-y-3">
              {[
                { key: "Space / Enter", desc: "Lật thẻ" },
                { key: "←", desc: "Thẻ trước" },
                { key: "→", desc: "Thẻ sau" },
                { key: "1", desc: "Đánh giá Khó" },
                { key: "2", desc: "Đánh giá Ổn" },
                { key: "3", desc: "Đánh giá Dễ" },
                { key: "V", desc: "Đọc âm thanh" }
              ].map((s, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span style={{ color: textSub }} className="font-semibold">{s.desc}:</span>
                  <span 
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono font-bold border border-slate-200 dark:border-zinc-700 shadow-sm text-[10px]"
                    style={{ color: textMain }}
                  >
                    {s.key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Memorization Tip Card */}
          <div 
            className="rounded-2xl p-5 border-2 transition-all duration-300 relative overflow-hidden"
            style={{
              background: dark ? "#1e1e1e" : "#ffffff",
              borderColor: dark ? "#2a2a2a" : "rgba(26,46,28,0.18)",
              boxShadow: dark ? "4px 4px 0px 0px rgba(255,255,255,0.03)" : "4px 4px 0px 0px rgba(26,46,28,0.08)",
            }}
          >
            <h3 className="text-sm font-extrabold uppercase tracking-wider mb-2 flex items-center gap-2 text-emerald-500">
              <Sparkles size={16} />
              Mẹo học tập
            </h3>
            <p style={{ color: textSub }} className="text-xs leading-relaxed italic font-semibold">
              "Hãy cố gắng tập hồi tưởng (Active Recall) đáp án trước khi lật thẻ. Việc tự suy nghĩ giúp kích thích bộ não ghi nhớ lâu hơn 150%."
            </p>
          </div>
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
  const [activeMode, setActiveMode] = useState<'study' | 'test' | 'match' | 'learn' | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  
  // Modals
  const [showAILab, setShowAILab] = useState(false);
  
  // Real database states
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckCounts, setDeckCounts] = useState<Record<number, { total: number; mastered: number; due: number }>>({});
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

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
                const mastered = cardsList.filter((c: any) => c.repetitions > 2 && c.interval_days > 3).length;
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
    // Trigger global theme synchronization if needed
    if (typeof window !== "undefined") {
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleStartStudy = async (deck: Deck) => {
    setSelectedDeck(deck);
    setLoadingCards(true);
    try {
      const cardsList = await getAllFlashcards(deck.id);
      if (Array.isArray(cardsList)) {
        setCards(cardsList);
        setActiveMode('study');
      } else {
        console.error("Lỗi khi tải danh sách flashcard:", cardsList);
        triggerMessage(cardsList?.error || "Không thể tải các thẻ ghi nhớ của bộ này.", "error");
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách flashcard:", err);
      triggerMessage("Không thể tải các thẻ ghi nhớ của bộ này.", "error");
    } finally {
      setLoadingCards(false);
    }
  };

  // Calculate aggregated stats
  const totalDecks = decks.length;
  const totalCards = Object.values(deckCounts).reduce((sum, item) => sum + item.total, 0);
  const totalMastered = Object.values(deckCounts).reduce((sum, item) => sum + item.mastered, 0);
  const totalDue = Object.values(deckCounts).reduce((sum, item) => sum + item.due, 0);

  // Suggested deck: the one with cards that has the most due reviews
  const suggestedDeck = decks.length > 0
    ? decks.reduce((best, current) => {
        const bestDue = deckCounts[best.id]?.due || 0;
        const currentDue = deckCounts[current.id]?.due || 0;
        return currentDue > bestDue ? current : best;
      })
    : null;

  const pageBg = dark ? "#121212" : "#ebe8e0";
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const textSub = dark ? "#9ca3af" : "#6b7280";
  const primaryColor = dark ? "#10b981" : "#1a2e1c";

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

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 pb-10 relative overflow-x-hidden"
      style={{ background: bgStyle === "default" ? pageBg : "transparent", fontFamily: "'Outfit', sans-serif" }}
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
                12 ngày Streak
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

      <div className={`${activeMode === 'study' ? 'max-w-7xl' : 'max-w-4xl'} mx-auto w-full px-4 mt-6 flex-1 flex flex-col overflow-x-hidden relative`}>
        <AnimatePresence mode="wait">
          {activeMode ? (
            <motion.div
              key="study-mode"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
              className="flex-1 flex flex-col w-full relative"
            >
              <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide px-2">
                <button
                  onClick={() => setActiveMode('study')}
                  className={`px-4 py-2 font-bold rounded-xl whitespace-nowrap transition-colors ${activeMode === 'study' ? 'bg-[#10b981] text-white' : dark ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                >Lật thẻ</button>
                <button
                  onClick={() => setActiveMode('test')}
                  className={`px-4 py-2 font-bold rounded-xl whitespace-nowrap transition-colors ${activeMode === 'test' ? 'bg-[#10b981] text-white' : dark ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                >Kiểm tra</button>
                <button
                  onClick={() => setActiveMode('match')}
                  className={`px-4 py-2 font-bold rounded-xl whitespace-nowrap transition-colors ${activeMode === 'match' ? 'bg-[#10b981] text-white' : dark ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                >Ghép thẻ</button>
                <button
                  onClick={() => setActiveMode('learn')}
                  className={`px-4 py-2 font-bold rounded-xl whitespace-nowrap transition-colors ${activeMode === 'learn' ? 'bg-[#10b981] text-white' : dark ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                >Học cuốn chiếu</button>
              </div>

              {activeMode === 'study' && (
                <StudyView
                  dark={dark}
                  onBack={() => {
                    setActiveMode(null);
                    setSelectedDeck(null);
                    fetchDecks(); // reload progress
                  }}
                  cards={cards}
                  deckTitle={selectedDeck?.name || "Bộ thẻ học tập"}
                  muted={muted}
                  decks={decks}
                  onSwitchDeck={handleStartStudy}
                  currentDeckId={selectedDeck?.id}
                />
              )}
              {activeMode === 'test' && (
                <TestMode 
                  cards={cards} 
                  deckId={selectedDeck?.id || 0}
                  onBack={() => { setActiveMode(null); fetchDecks(); }} 
                />
              )}
              {activeMode === 'match' && (
                <MatchGameMode 
                  cards={cards} 
                  deckId={selectedDeck?.id || 0}
                  onBack={() => { setActiveMode(null); fetchDecks(); }} 
                />
              )}
              {activeMode === 'learn' && (
                <LearnMode 
                  cards={cards} 
                  deckId={selectedDeck?.id || 0}
                  onBack={() => { setActiveMode(null); fetchDecks(); }} 
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="dash"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.22 }}
              className="flex-1 flex flex-col space-y-6 w-full"
            >
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
                label="Đã thuộc"
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
            {suggestedDeck && (
              <div
                onClick={() => handleStartStudy(suggestedDeck)}
                className="rounded-2xl p-5 flex items-center justify-between cursor-pointer z-10"
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
                    {suggestedDeck.name}
                  </h2>
                  <p
                    style={{
                      color: "#86efac",
                      fontSize: 12,
                    }}
                  >
                    {deckCounts[suggestedDeck.id]?.due || 0} thẻ đến hạn cần ôn ngay
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
                  {loadingCards && selectedDeck?.id === suggestedDeck.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Bắt đầu"
                  )}
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
                        onSelect={() => handleStartStudy(deck)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
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
                // Dùng Promise.all để lưu song song cho nhanh
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
