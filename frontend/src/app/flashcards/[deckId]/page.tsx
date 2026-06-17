"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Loader2, ChevronLeft, ChevronRight, RotateCcw, Play, 
  Edit2, Trash2, Check, X, BookOpen, Layers, Settings, Globe, Lock, 
  PenTool, Puzzle, Star, Volume2, VolumeX, Sparkles, Palette, EyeOff, Activity, 
  Flame, Zap, Trophy, Moon, Sun, Minus
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { Background, BackgroundStyle } from '@/components/flashcards/Background';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import AudioButton from '@/components/flashcards/AudioButton';
import { playFlipSound, playSuccessSound, playHardSound, playCompleteSound } from '@/utils/sound';

import { 
  getAllFlashcards, 
  updateFlashcard, 
  deleteFlashcard, 
  getDeckById, 
  updateDeck, 
  deleteDeck, 
  toggleStarFlashcard, 
  reviewFlashcard, 
  createFlashcard,
  getDecks
} from '@/services/flashcard.service';

import MatchGameMode from '@/components/flashcards/modes/MatchGameMode';
import TestMode from '@/components/flashcards/modes/TestMode';
import LearnMode from '@/components/flashcards/modes/LearnMode';
import WriteMode from '@/components/flashcards/modes/WriteMode';

// Helper colors for decks
const COLOR_PALETTE = [
  "#2d5a3d", // forest
  "#1a3a5c", // blue
  "#5c1a1a", // red
  "#4d1a5c", // purple
  "#5c451a", // orange/gold
];

interface Flashcard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  ease_factor: number;
  repetitions: number;
  interval_days: number;
  next_review_at?: string;
  is_starred?: boolean;
  tag?: string;
}

interface Deck {
  id: number;
  name: string;
  description: string;
  created_at: string;
  is_public?: boolean;
}

// ── StatBadge Sub-component ──────────────────────────────────────────────────
function StatBadge({
  icon,
  label,
  value,
  dark,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dark: boolean;
  border: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[140px]"
      style={{
        background: dark ? "#1e1e1e" : "#ffffff",
        border: `2px solid ${border}`,
        boxShadow: dark
          ? "3px 3px 0 rgba(255,255,255,0.03)"
          : "3px 3px 0 rgba(26,46,28,0.1)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {icon}
      <div>
        <div style={{ fontSize: 11, color: dark ? "#9ca3af" : "#6b7280" }}>
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

export default function FlashcardDeckPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = Number(params.deckId);

  const {
    isAuthenticated,
    activeUser,
    setActiveUser,
    triggerMessage,
    globalMessage,
    setTasks,
    setTaskCompletionToast
  } = useStudy();

  const [dark, setDark] = useState(false);
  const [muted, setMuted] = useState(false);
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>("nebula");
  const [viewMode, setViewMode] = useState<'dashboard' | 'study' | 'test' | 'match' | 'learn' | 'quiz' | 'write'>('dashboard');

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckCounts, setDeckCounts] = useState<Record<number, { total: number; mastered: number; due: number }>>({});
  const [loading, setLoading] = useState(true);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [editDeckName, setEditDeckName] = useState('');
  const [editDeckDesc, setEditDeckDesc] = useState('');
  const [editDeckPublic, setEditDeckPublic] = useState(false);

  // Create card states
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  // Edit card states
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  // Study states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(1);
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [studyFinished, setStudyFinished] = useState(false);

  // Text-To-Speech
  const { speak, isPlaying } = useTextToSpeech();

  // Quiz States
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Custom alert & confirm
  const [confirmDialog, setConfirmDialog] = useState<{ title: string, message: string, onConfirm: () => void, isDestructive?: boolean } | null>(null);

  // Load configuration & initial values — only run once on mount / deckId change
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

    // Determine initial mode from URL param (read once)
    const modeParam = searchParams.get('mode');
    const initialMode = (modeParam && ['dashboard', 'study', 'test', 'match', 'learn', 'quiz', 'write'].includes(modeParam))
      ? (modeParam as 'dashboard' | 'study' | 'test' | 'match' | 'learn' | 'quiz' | 'write')
      : 'dashboard';

    fetchDeckData(initialMode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const fetchDeckData = async (initialMode?: 'dashboard' | 'study' | 'test' | 'match' | 'learn' | 'quiz' | 'write') => {
    try {
      setLoading(true);
      const [allCards, deckInfo, allDecks] = await Promise.all([
        getAllFlashcards(deckId),
        getDeckById(deckId),
        getDecks()
      ]);

      const loadedCards: Flashcard[] = allCards || [];
      setCards(loadedCards);

      // ── Restore study progress from localStorage ─────────────────────────
      // Done here (not in a useEffect) to avoid race conditions between
      // viewMode state and async card loading.
      if (initialMode) {
        setViewMode(initialMode);
        if (initialMode === 'study' && loadedCards.length > 0) {
          const savedKey = `flashcards-progress-${deckId}-index`;
          const savedIndex = localStorage.getItem(savedKey);
          if (savedIndex !== null) {
            const parsed = parseInt(savedIndex, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed < loadedCards.length) {
              setCurrentIndex(parsed);
              setIsFlipped(false);
            } else {
              // Saved index out of range (e.g. deck changed), clean up
              localStorage.removeItem(savedKey);
              setCurrentIndex(0);
            }
          }
        }
      }

      if (deckInfo) {
        setDeck(deckInfo);
        setEditDeckName(deckInfo.name || '');
        setEditDeckDesc(deckInfo.description || '');
        setEditDeckPublic(deckInfo.is_public || false);
      }
      if (Array.isArray(allDecks)) {
        setDecks(allDecks);
        // Calculate counts
        const countsMap: Record<number, { total: number; mastered: number; due: number }> = {};
        await Promise.all(
          allDecks.map(async (d: Deck) => {
            try {
              const cardsList = await getAllFlashcards(d.id);
              if (Array.isArray(cardsList)) {
                const total = cardsList.length;
                // progress/mastered is now based on repetitions > 0 so progress registers immediately
                const mastered = cardsList.filter((c: any) => c.repetitions > 0).length;
                const due = cardsList.filter((c: any) => {
                  if (!c.next_review_at) return true;
                  return new Date(c.next_review_at) <= new Date();
                }).length;
                countsMap[d.id] = { total, mastered, due };
              } else {
                countsMap[d.id] = { total: 0, mastered: 0, due: 0 };
              }
            } catch (e) {
              countsMap[d.id] = { total: 0, mastered: 0, due: 0 };
            }
          })
        );
        setDeckCounts(countsMap);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu bộ thẻ:', error);
      triggerMessage("Không thể tải thông tin bộ thẻ này.", "error");
    } finally {
      setLoading(false);
    }
  };


  const saveStudyIndex = (index: number) => {
    setCurrentIndex(index);
    if (deckId) {
      localStorage.setItem(`flashcards-progress-${deckId}-index`, String(index));
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

  // ── Deck Settings Operations ───────────────────────────────────────────────
  const handleUpdateDeck = async () => {
    try {
      const updated = await updateDeck(deckId, {
        name: editDeckName,
        description: editDeckDesc,
        is_public: editDeckPublic
      });
      setDeck(updated);
      setShowSettings(false);
      triggerMessage('Đã cập nhật thông tin bộ thẻ!', 'success');
      fetchDeckData();
    } catch (error: any) {
      triggerMessage("Lỗi cập nhật: " + error.message, 'error');
    }
  };

  const handleDeleteDeck = () => {
    setConfirmDialog({
      title: 'Xóa bộ thẻ',
      message: 'HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn xóa bộ thẻ này và tất cả thẻ bên trong? Dữ liệu không thể khôi phục!',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDeck(deckId);
          triggerMessage('Đã xóa bộ thẻ thành công!', 'success');
          router.push('/flashcards');
        } catch (error: any) {
          triggerMessage("Lỗi khi xóa: " + error.message, 'error');
        }
      }
    });
  };

  // ── Card CRUD Operations ────────────────────────────────────────────────────
  const handleCreateCard = async () => {
    if (newFront.trim() === '' || newBack.trim() === '') {
      triggerMessage("Nội dung Mặt trước và Mặt sau không được để trống!", 'error');
      return;
    }
    const isDuplicate = cards.some(c => c.front.toLowerCase() === newFront.toLowerCase().trim());
    if (isDuplicate) {
      setConfirmDialog({
        title: 'Cảnh báo trùng lặp',
        message: 'Khái niệm/Thuật ngữ này đã tồn tại trong bộ bài! Bạn có muốn tiếp tục tạo thẻ trùng?',
        onConfirm: proceedCreateCard
      });
      return;
    }
    proceedCreateCard();
  };

  const proceedCreateCard = async () => {
    try {
      const newCard = await createFlashcard(deckId, newFront, newBack);
      setCards([...cards, newCard]);
      setNewFront('');
      setNewBack('');
      setIsAddingCard(false);
      triggerMessage('Đã thêm thẻ mới!', 'success');
      fetchDeckData();
    } catch (error: any) {
      triggerMessage("Lỗi khi tạo thẻ mới: " + error.message, 'error');
    }
  };

  const handleEditClick = (card: Flashcard) => {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const handleSaveEdit = async () => {
    if (!editingCardId) return;
    if (editFront.trim() === '' || editBack.trim() === '') {
      triggerMessage("Nội dung không được để trống!", 'error');
      return;
    }
    const isDuplicate = cards.some(c => c.id !== editingCardId && c.front.toLowerCase() === editFront.toLowerCase().trim());
    if (isDuplicate) {
      setConfirmDialog({
        title: 'Cảnh báo trùng lặp',
        message: 'Khái niệm/Thuật ngữ này đã tồn tại! Bạn có muốn tiếp tục lưu?',
        onConfirm: proceedSaveEdit
      });
      return;
    }
    proceedSaveEdit();
  };

  const proceedSaveEdit = async () => {
    if (!editingCardId) return;
    try {
      await updateFlashcard(editingCardId, editFront, editBack);
      setCards(cards.map(c => c.id === editingCardId ? { ...c, front: editFront, back: editBack } : c));
      setEditingCardId(null);
      triggerMessage('Đã lưu thay đổi!', 'success');
      fetchDeckData();
    } catch (error: any) {
      triggerMessage("Lỗi khi lưu: " + error.message, 'error');
    }
  };

  const handleDeleteCard = (id: number) => {
    setConfirmDialog({
      title: 'Xóa thẻ',
      message: 'Bạn có chắc chắn muốn xóa thẻ này vĩnh viễn?',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteFlashcard(id);
          setCards(cards.filter(c => c.id !== id));
          triggerMessage('Đã xóa thẻ khỏi bộ bài!', 'success');
          fetchDeckData();
        } catch (error: any) {
          triggerMessage("Lỗi khi xóa: " + error.message, 'error');
        }
      }
    });
  };

  const handleToggleStar = async (card: Flashcard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const isStarred = !card.is_starred;
      await toggleStarFlashcard(card.id, isStarred);
      setCards(cards.map(c => c.id === card.id ? { ...c, is_starred: isStarred } : c));
      triggerMessage(isStarred ? 'Đã gắn sao thẻ này!' : 'Đã bỏ gắn sao.', 'success');
    } catch (err: any) {
      triggerMessage('Lỗi: ' + err.message, 'error');
    }
  };

  // ── Text To Speech ─────────────────────────────────────────────────────────
  const playTTS = (text: string) => {
    speak(text);
  };

  // ── Study Mode Navigation & SuperMemo SM-2 SM-2 inspired calculation ──────
  const currentCard = cards[currentIndex];

  const goNext = () => {
    if (currentIndex === cards.length - 1) {
      setStudyFinished(true);
      // Reset index back to 0 in storage on completion
      if (deckId) localStorage.removeItem(`flashcards-progress-${deckId}-index`);
      return;
    }
    setDirection(1);
    setIsFlipped(false);
    setTimeout(() => {
      saveStudyIndex(currentIndex + 1);
    }, 50);
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    setDirection(-1);
    setIsFlipped(false);
    setTimeout(() => {
      saveStudyIndex(currentIndex - 1);
    }, 50);
  };

  const handleRateCard = async (rating: "easy" | "good" | "hard") => {
    if (!currentCard) return;
    setRatings(prev => ({ ...prev, [currentCard.id]: rating }));

    // Sound effects
    if (rating === "hard") {
      playHardSound(muted);
    } else {
      playSuccessSound(muted);
    }

    try {
      const res = await reviewFlashcard(currentCard.id, rating);
      if (res && res.updated_streak !== undefined) {
        if (activeUser) {
          setActiveUser({
            ...activeUser,
            streak: res.updated_streak,
            last_study_date: new Date().toISOString()
          });
        }
      }
      
      // Update task progress from response
      if (res && res.task_update) {
        const { task, justCompleted } = res.task_update;
        if (task) {
          setTasks((prev: any[]) => prev.map(t => t.task_type === task.task_type ? task : t));
          if (justCompleted) {
            setTaskCompletionToast({ type: task.task_type, title: task.title });
            triggerMessage(`Chúc mừng! Bạn đã hoàn thành nhiệm vụ "${task.title}"! 🎉`, "success");
          }
        }
      }

      // ── Update local card state so masteredCount (yellow bar) refreshes immediately ──
      setCards(prev => prev.map(c =>
        c.id === currentCard.id
          ? { ...c, repetitions: Math.max(c.repetitions + 1, 1) }
          : c
      ));
    } catch (err) {
      console.error("Lỗi cập nhật tiến trình ôn tập:", err);
    }

    goNext();
  };


  // Keyboard shortcut listener for study view
  useEffect(() => {
    if (viewMode !== 'study' || studyFinished || !currentCard) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "ArrowRight") {
        goNext();
      }
      if (e.key === "ArrowLeft") {
        goPrev();
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped(prev => !prev);
        playFlipSound(muted);
      }
      // Review ratings keys
      if (isFlipped) {
        if (e.key === "1") handleRateCard("hard");
        if (e.key === "2") handleRateCard("good");
        if (e.key === "3") handleRateCard("easy");
      }
      // Audio hotkey
      if (e.code === 'KeyV') {
        e.preventDefault();
        playTTS(isFlipped ? currentCard.back : currentCard.front);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, studyFinished, viewMode, isFlipped, muted, currentCard]);

  // Confetti on finished study session
  useEffect(() => {
    if (studyFinished) {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      playCompleteSound(muted);
      return () => clearInterval(interval);
    }
  }, [studyFinished, muted]);

  // ── Quiz Generation Logic ──────────────────────────────────────────────────
  const generateQuiz = () => {
    if (cards.length < 4) {
      triggerMessage('Cần tối thiểu 4 thẻ ghi nhớ để tạo các đáp án gây nhiễu cho Trắc nghiệm (Quiz). Hãy thêm thẻ trước!', 'error');
      return;
    }
    const questions = cards.map(card => {
      const otherCards = cards.filter(c => c.id !== card.id);
      const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
      const distractors = shuffledOthers.slice(0, 3).map(c => c.back);
      const options = [card.back, ...distractors].sort(() => 0.5 - Math.random());
      
      return {
        question: card.front,
        correctAnswer: card.back,
        options
      };
    });

    setQuizQuestions(questions.sort(() => 0.5 - Math.random()));
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setQuizFinished(false);
    setViewMode('quiz');
  };

  const handleQuizAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const isCorrect = answer === quizQuestions[currentQuizIndex].correctAnswer;
    if (isCorrect) setQuizScore(prev => prev + 1);

    setTimeout(() => {
      if (currentQuizIndex < quizQuestions.length - 1) {
        setCurrentQuizIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
      }
    }, 1500);
  };

  // ── Render Views ───────────────────────────────────────────────────────────
  const pageBg = dark ? "#121212" : "#ebe8e0";
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const textSub = dark ? "#9ca3af" : "#6b7280";
  const primaryColor = dark ? "#10b981" : "#1a2e1c";
  const border = dark ? "#2a2a2a" : "rgba(26,46,28,0.22)";
  const shadow = dark ? "4px 4px 0px 0px rgba(255,255,255,0.04)" : "4px 4px 0px 0px rgba(26,46,28,0.12)";

  const renderDashboardMode = () => {
    const cardBg = dark ? "#1e1e1e" : "#ffffff";
    return (
      <div className="max-w-4xl mx-auto w-full p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div 
            className="flex-1 rounded-2xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden"
            style={{ background: cardBg, border: `2px solid ${border}`, boxShadow: shadow }}
          >
            {deck && deck.is_public && (
              <div className="absolute top-4 left-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Globe size={12} /> CÔNG KHAI
              </div>
            )}
            {deck && !deck.is_public && (
              <div className="absolute top-4 left-4 bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Lock size={12} /> RIÊNG TƯ
              </div>
            )}
            
            <button 
              onClick={() => setShowSettings(true)}
              className="absolute top-4 right-4 p-2 rounded-full transition-colors hover:scale-105 active:scale-95"
              style={{ color: textSub, background: dark ? "#2a2a2a" : "#f0f0ec" }}
              title="Cài đặt bộ thẻ"
            >
              <Settings size={18} />
            </button>

            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: primaryColor + "22", color: primaryColor }}>
              <Layers size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: textMain }}>{deck ? deck.name : 'Bộ thẻ Flashcards'}</h2>
            {deck?.description && <p className="mb-2 max-w-lg text-sm" style={{ color: textSub }}>{deck.description}</p>}
            <p className="text-xs mb-8 font-semibold" style={{ color: textSub }}>Tổng cộng {cards.length} thẻ thuật ngữ. Chọn một phương pháp học bên dưới.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
              <button 
                onClick={() => { setViewMode('study'); setStudyFinished(false); setIsFlipped(false); }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-xs text-white"
                style={{ background: "#10b981", border: "none" }}
              >
                <BookOpen size={15} /> Lật thẻ
              </button>
              <button 
                onClick={() => { setViewMode('write'); }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-xs"
                style={{ background: dark ? "#2a2a2a" : "#ffffff", border: `2px solid ${border}`, color: textMain }}
              >
                <PenTool size={15} /> Chép tả
              </button>
              <button 
                onClick={generateQuiz}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-xs"
                style={{ background: dark ? "#2a2a2a" : "#ffffff", border: `2px solid ${border}`, color: textMain }}
              >
                <Play size={15} /> Trắc nghiệm
              </button>
              <button 
                onClick={() => setViewMode('match')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-xs"
                style={{ background: dark ? "#2a2a2a" : "#ffffff", border: `2px solid ${border}`, color: textMain }}
              >
                <Puzzle size={15} /> Ghép thẻ
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: textMain }}>
              Danh sách thuật ngữ ({cards.length})
            </h3>
            <p className="text-xs" style={{ color: textSub }}>Sửa đổi hoặc xóa các thẻ đã tạo.</p>
          </div>
          <button 
            onClick={() => setIsAddingCard(!isAddingCard)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-colors hover:opacity-90"
            style={{ background: "#10b98122", color: "#10b981" }}
          >
            {isAddingCard ? 'Hủy' : '+ Thêm thẻ mới'}
          </button>
        </div>

        {/* ADD CARD INLINE */}
        {isAddingCard && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border-2 border-emerald-500 overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-5 flex flex-col gap-4">
              <h4 className="font-bold text-emerald-600 flex items-center gap-2 text-sm">
                <Check size={18} /> Tạo thẻ ghi nhớ mới
              </h4>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Mặt trước (Khái niệm)</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none resize-none bg-white dark:bg-zinc-800 text-sm" 
                    rows={2}
                    placeholder="VD: Artificial Intelligence"
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Mặt sau (Định nghĩa)</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none resize-none bg-white dark:bg-zinc-800 text-sm" 
                    rows={2}
                    placeholder="VD: Trí tuệ nhân tạo..."
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
                <button onClick={() => setIsAddingCard(false)} className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Hủy</button>
                <button onClick={handleCreateCard} className="px-5 py-2 text-xs font-bold bg-[#10b981] text-white rounded-lg hover:opacity-90">Lưu thẻ</button>
              </div>
            </div>
          </div>
        )}

        {/* LIST CARDS */}
        <div className="space-y-4 pb-20">
          {cards.map((card) => (
            <div 
              key={card.id}
              className="rounded-2xl border-2 transition-all relative overflow-hidden"
              style={{ background: cardBg, borderColor: border }}
            >
              {editingCardId === card.id ? (
                <div className="p-5 flex flex-col gap-4 bg-emerald-50/10">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Mặt trước</label>
                      <textarea 
                        className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none resize-none bg-white dark:bg-zinc-800 text-sm" 
                        rows={2}
                        value={editFront}
                        onChange={(e) => setEditFront(e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Mặt sau</label>
                      <textarea 
                        className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg outline-none resize-none bg-white dark:bg-zinc-800 text-sm" 
                        rows={2}
                        value={editBack}
                        onChange={(e) => setEditBack(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
                    <button onClick={() => setEditingCardId(null)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Hủy</button>
                    <button onClick={handleSaveEdit} className="px-4 py-2 text-xs font-bold bg-[#10b981] text-white rounded-lg">Lưu</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row min-h-[80px]">
                  <div className="md:w-1/3 p-4 bg-gray-50/50 dark:bg-zinc-900/20 flex items-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-zinc-800">
                    <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm whitespace-pre-wrap">{card.front}</p>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-between">
                    <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{card.back}</p>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-4">
                      <button onClick={(e) => handleToggleStar(card, e)} className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 ${card.is_starred ? 'text-yellow-500' : 'text-gray-400'}`}>
                        <Star size={16} fill={card.is_starred ? "currentColor" : "none"} />
                      </button>
                      <button onClick={() => handleEditClick(card)} className="p-1.5 text-gray-500 hover:text-emerald-500 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteCard(card.id)} className="p-1.5 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStudyMode = () => {
    if (studyFinished) {
      const easy = Object.values(ratings).filter((r) => r === "easy").length;
      const ok = Object.values(ratings).filter((r) => r === "good").length;
      const hard = Object.values(ratings).filter((r) => r === "hard").length;

      return (
        <div className="flex-1 flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md rounded-2xl p-8 text-center border-2" style={{ background: dark ? "#1e1e1e" : "#ffffff", borderColor: border, boxShadow: shadow }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#10b98122" }}>
              <Trophy size={28} color="#10b981" />
            </div>
            <h2 style={{ fontWeight: 800, color: textMain, fontSize: 22 }} className="mb-1">Hoàn thành bộ thẻ!</h2>
            <p style={{ color: textSub, fontSize: 13 }} className="mb-6">Bạn đã xem và ôn tập tất cả {cards.length} thẻ.</p>
            <div className="flex gap-3 mb-6">
              {[
                { label: "Dễ", count: easy, color: "#10b981" },
                { label: "Ổn", count: ok, color: "#f59e0b" },
                { label: "Khó", count: hard, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} className="flex-1 rounded-xl py-3 border" style={{ background: s.color + "18", borderColor: s.color + "33" }}>
                  <div style={{ fontWeight: 800, color: s.color, fontSize: 20 }}>{s.count}</div>
                  <div style={{ color: textSub, fontSize: 11 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setStudyFinished(false); saveStudyIndex(0); setIsFlipped(false); setRatings({}); }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-200"
              >
                Học lại
              </button>
              <button onClick={() => setViewMode('dashboard')} className="flex-1 py-2.5 bg-[#10b981] hover:opacity-90 text-xs font-bold rounded-xl text-white">Quản lý thẻ</button>
            </div>
          </div>
        </div>
      );
    }

    if (cards.length === 0) return null;
    // progress based on cards SEEN (currentIndex+1), consistent with text display
    const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
    // DB-backed mastered count (repetitions > 0)
    const masteredCount = cards.filter((c: any) => c.repetitions > 0).length;
    const masteredPct = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;
    
    // Warm card backgrounds
    const currentCardBg = isFlipped ? (dark ? "#0e2317" : "#1a3d28") : (dark ? "#1e1e1e" : "#fffdf0");
    const currentCardBorder = isFlipped ? (dark ? "#10b981" : "#1a3d28") : border;
    const currentCardShadow = isFlipped ? (dark ? "8px 8px 0px 0px rgba(16,185,129,0.15)" : "8px 8px 0px 0px rgba(26,61,40,0.35)") : shadow;

    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-4 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-right duration-300">
        {/* LEFT COLUMN: PROGRESS */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-5">
          <div 
            className="rounded-2xl p-5 border-2 transition-all duration-300"
            style={{ background: dark ? "#1e1e1e" : "#ffffff", borderColor: border, boxShadow: shadow }}
          >
            <h3 className="text-sm font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Activity size={16} />
              Tiến trình học
            </h3>
            <div className="space-y-5">
              {/* Session position */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span style={{ color: textSub }}>Thẻ hiện tại:</span>
                  <span style={{ color: textMain }}>{currentIndex + 1} / {cards.length}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: dark ? "#10b981" : "#1a2e1c" }} />
                </div>
                <div className="flex justify-between items-center text-xs font-bold pt-1">
                  <span style={{ color: textSub }}>Tiến trình:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{Math.round(progress)}%</span>
                </div>
              </div>

              {/* DB mastered count */}
              <div className="pt-2 border-t" style={{ borderColor: dark ? "#2a2a2a" : "rgba(26,46,28,0.1)" }}>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span style={{ color: textSub }}>Đã thuộc:</span>
                  <span style={{ color: textMain }}>{masteredCount} / {cards.length} thẻ</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${masteredPct}%`, background: "#f59e0b" }} />
                </div>
                <div className="flex justify-between items-center text-xs font-bold pt-1">
                  <span style={{ color: textSub }}>SM-2:</span>
                  <span style={{ color: "#f59e0b" }} className="font-extrabold">{masteredPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick switcher to other decks */}
          {decks.length > 1 && (
            <div 
              className="rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col"
              style={{ background: dark ? "#1e1e1e" : "#ffffff", borderColor: border, boxShadow: shadow }}
            >
              <h3 className="text-sm font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2 text-[#1a3d28] dark:text-emerald-400">
                <Layers size={16} />
                Bộ thẻ khác
              </h3>
              <div className="overflow-y-auto pr-1 space-y-2 max-h-[200px] scrollbar-hide">
                {decks.filter(d => d.id !== deckId).slice(0, 5).map((d, idx) => (
                  <button
                    key={d.id}
                    onClick={() => router.push(`/flashcards/${d.id}?mode=study`)}
                    className="w-full text-left p-3 rounded-xl border border-dashed transition-all hover:-translate-y-0.5 flex flex-col gap-1 text-xs"
                    style={{
                      background: dark ? "#2a2a2a" : "#fbfbfa",
                      borderColor: dark ? "#3a3a3a" : "rgba(26,46,28,0.12)",
                      color: textMain
                    }}
                  >
                    <span className="font-bold truncate w-full">{d.name}</span>
                    <span style={{ color: textSub }} className="text-[10px] truncate w-full">{d.description || "Không có mô tả."}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: PLAYER */}
        <div className="col-span-1 lg:col-span-6 flex flex-col items-center gap-6">
          {/* Top control bar */}
          <div className="w-full flex items-center justify-between">
            <button
              onClick={() => setViewMode('dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 bg-white dark:bg-zinc-900 border text-xs font-bold"
              style={{ borderColor: border, color: textSub }}
            >
              <ChevronLeft size={14} /> Danh sách
            </button>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg max-w-[200px] truncate">
              {deck ? deck.name : "Bộ thẻ"}
            </span>
            <span className="text-sm font-bold" style={{ color: textMain }}>
              {currentIndex + 1} / {cards.length}
            </span>
          </div>

          {/* Flashcard container */}
          <div className="w-full relative" style={{ perspective: 1200 }}>
            <AnimatePresence mode="wait">
              {currentCard && (
                <motion.div
                  key={`${currentCard.id}-${isFlipped}`}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  onClick={() => {
                    setIsFlipped((f) => !f);
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
                  {/* Tag and TTS */}
                  <div className="absolute top-4 left-4 flex gap-2 z-20">
                    <span
                      className="text-xs px-2.5 py-1.5 rounded-lg font-bold"
                      style={{
                        background: isFlipped ? "rgba(255,255,255,0.12)" : (dark ? "#2a2a2a" : "#f0f0ec"),
                        color: isFlipped ? "#a7f3d0" : (dark ? "#9ca3af" : "#4b5563"),
                      }}
                    >
                      {currentCard.tag || "Thẻ học tập"}
                    </span>
                    <AudioButton 
                      isPlaying={isPlaying} 
                      onClick={() => playTTS(isFlipped ? currentCard.back : currentCard.front)} 
                      dark={dark || isFlipped} 
                    />
                  </div>

                  {/* Flip hint */}
                  <span
                    className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-lg font-bold"
                    style={{
                      background: isFlipped ? "rgba(52, 211, 153, 0.15)" : (dark ? "#2a2a2a" : "#f0f0ec"),
                      color: isFlipped ? "#34d399" : textSub,
                    }}
                  >
                    {isFlipped ? "Mặt sau (Định nghĩa)" : "Mặt trước (Khái niệm)"}
                  </span>

                  {!isFlipped ? (
                    <div className="text-center w-full px-4">
                      <div className="break-words text-2xl md:text-3xl font-bold" style={{ color: textMain, lineHeight: 1.3 }}>
                        {currentCard.front}
                      </div>
                      <p className="mt-4 text-[10px]" style={{ color: textSub }}>Nhấn để lật xem đáp án</p>
                    </div>
                  ) : (
                    <div className="text-center w-full px-4">
                      <div className="break-words text-xl md:text-2xl font-bold text-white whitespace-pre-wrap" style={{ lineHeight: 1.4 }}>
                        {currentCard.back}
                      </div>
                      <p className="mt-4 text-[10px] text-white/60">Nhấn để lật lại câu hỏi</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SM-2 Rating Buttons (Show only when card flipped) */}
          <div className="w-full h-14 relative flex justify-center items-center overflow-visible">
            <AnimatePresence>
              {isFlipped && (
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
                        handleRateCard(btn.r as any);
                      }}
                      className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90 font-bold"
                      style={{
                        background: btn.color + "18",
                        border: `2px solid ${btn.color}55`,
                        color: btn.color,
                        fontSize: 14,
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

          {/* Lower arrows navigation */}
          <div className="w-full flex items-center justify-between mt-2">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-zinc-900 border"
              style={{ borderColor: border }}
            >
              <ChevronLeft size={18} color={textMain} />
            </button>
            <button
              onClick={() => { setIsFlipped((f) => !f); playFlipSound(muted); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all active:scale-95 font-bold text-white"
              style={{ background: dark ? "#10b981" : "#1a2e1c", border: "none", fontSize: 13 }}
            >
              <Zap size={14} />
              {isFlipped ? "Mặt trước" : "Đáp án"}
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex === cards.length - 1}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-zinc-900 border"
              style={{ borderColor: border }}
            >
              <ChevronRight size={18} color={textMain} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: TIPS */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-5">
          <div 
            className="rounded-2xl p-5 border-2 transition-all duration-300"
            style={{ background: dark ? "#1e1e1e" : "#ffffff", borderColor: border, boxShadow: shadow }}
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 text-amber-500">
              <Zap size={14} className="animate-pulse" />
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
                { key: "Phím V", desc: "Đọc phát âm" }
              ].map((s, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] font-semibold">
                  <span style={{ color: textSub }}>{s.desc}:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-[9px] border" style={{ color: textMain }}>
                    {s.key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div 
            className="rounded-2xl p-5 border-2 transition-all duration-300"
            style={{ background: dark ? "#1e1e1e" : "#ffffff", borderColor: border, boxShadow: shadow }}
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-2 flex items-center gap-2 text-emerald-500">
              <Sparkles size={14} />
              Mẹo học tập
            </h3>
            <p style={{ color: textSub }} className="text-[11px] leading-relaxed italic font-semibold">
              "Hãy cố gắng tập hồi tưởng (Active Recall) đáp án trước khi lật thẻ. Việc tự suy nghĩ giúp kích thích bộ não ghi nhớ lâu hơn 150%."
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderQuizMode = () => {
    if (quizFinished) {
      const percentage = Math.round((quizScore / quizQuestions.length) * 100);
      return (
        <div className="flex-1 flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-zinc-800">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 text-[#10b981] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold">{percentage}%</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: textMain }}>Kết thúc bài kiểm tra!</h2>
            <p className="text-sm mb-8" style={{ color: textSub }}>Bạn đã trả lời đúng <span className="font-bold">{quizScore}</span> trên tổng số <span className="font-bold">{quizQuestions.length}</span> câu.</p>
            <div className="flex flex-col gap-2">
              <button onClick={generateQuiz} className="w-full bg-[#10b981] text-white py-3 rounded-xl font-bold text-xs hover:opacity-95">Làm lại bài Quiz</button>
              <button onClick={() => setViewMode('dashboard')} className="w-full bg-gray-100 dark:bg-zinc-800 py-3 rounded-xl font-bold text-xs" style={{ color: textMain }}>Trở về quản lý thẻ</button>
            </div>
          </div>
        </div>
      );
    }

    const currentQ = quizQuestions[currentQuizIndex];
    if (!currentQ) return null;
    const progressPercent = (currentQuizIndex / quizQuestions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto w-full p-6 animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold" style={{ color: textSub }}>Câu hỏi {currentQuizIndex + 1} / {quizQuestions.length}</span>
          <span className="text-xs font-bold bg-[#10b98122] text-[#10b981] px-4 py-1.5 rounded-full">Điểm: {quizScore}</span>
        </div>
        
        <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-[#10b981]" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="bg-white dark:bg-zinc-900 w-full p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 mb-8 text-center min-h-[160px] flex items-center justify-center">
          <h2 className="text-xl font-bold leading-relaxed whitespace-pre-wrap" style={{ color: textMain }}>{currentQ.question}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {currentQ.options.map((opt: string, i: number) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === currentQ.correctAnswer;
            let btnStyle: React.CSSProperties = {
              padding: "1.25rem",
              borderRadius: "0.75rem",
              borderWidth: "2px",
              textAlign: "left",
              fontWeight: 600,
              fontSize: "15px",
              transition: "all 0.2s"
            };

            if (!selectedAnswer) {
              btnStyle = {
                ...btnStyle,
                background: dark ? "#1e1e1e" : "#ffffff",
                borderColor: border,
                color: textMain,
                cursor: "pointer"
              };
            } else {
              if (isCorrect) {
                btnStyle = { ...btnStyle, background: "#10b98115", borderColor: "#10b981", color: "#10b981" };
              } else if (isSelected && !isCorrect) {
                btnStyle = { ...btnStyle, background: "#ef444415", borderColor: "#ef4444", color: "#ef4444" };
              } else {
                btnStyle = { ...btnStyle, background: dark ? "#121212" : "#f9f9f9", borderColor: border, color: textSub, opacity: 0.4 };
              }
            }

            return (
              <button 
                key={i} 
                onClick={() => handleQuizAnswer(opt)} 
                disabled={!!selectedAnswer} 
                style={btnStyle}
                className="hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSystemUI = () => (
    <>
      {/* Toast Notification */}
      {globalMessage && globalMessage.text && (
        <div className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border ${
          globalMessage.type === 'success' ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-white text-rose-700 border-rose-200'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center border dark:border-zinc-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{confirmDialog.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-6 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDialog(null)} className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 dark:bg-zinc-800 dark:text-gray-300 hover:bg-gray-200">Hủy</button>
                <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className={`flex-1 py-2 rounded-xl text-xs font-bold text-white ${confirmDialog.isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>Đồng ý</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deck Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-zinc-800">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm">
                  <Settings size={18} /> Cài đặt Bộ thẻ
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-red-500 p-1"><X size={20} /></button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Tên bộ thẻ</label>
                  <input type="text" value={editDeckName} onChange={e => setEditDeckName(e.target.value)} className="w-full p-2 text-sm border dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Mô tả bộ thẻ</label>
                  <textarea value={editDeckDesc} onChange={e => setEditDeckDesc(e.target.value)} rows={2} className="w-full p-2 text-sm border dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 outline-none resize-none" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-950 rounded-lg border dark:border-zinc-800">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">Công khai bộ thẻ</span>
                    <span className="text-[10px] text-gray-500">Người khác có thể tìm thấy bộ thẻ này</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={editDeckPublic} onChange={e => setEditDeckPublic(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-950">
                <button onClick={handleDeleteDeck} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                  <Trash2 size={16} /> Xóa bộ thẻ
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-xs hover:bg-gray-50">Hủy</button>
                  <button onClick={handleUpdateDeck} className="px-4 py-2 bg-[#10b981] text-white rounded-lg font-bold text-xs hover:opacity-90">Lưu</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#121212]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 pb-10 relative overflow-x-hidden"
      style={{ background: bgStyle === "default" ? pageBg : "transparent", fontFamily: "'Outfit', sans-serif" }}
    >
      <Background styleType={bgStyle} dark={dark} />
      {renderSystemUI()}

      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => {}}
        onDashboardClick={() => router.push('/home')}
        activeUser={activeUser!}
      />

      {/* Secondary toolbar sub-navbar */}
      <div className="pt-20">
        <div 
          className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center border-b"
          style={{ borderColor: dark ? "#222" : "rgba(26,46,28,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <Link href="/flashcards" className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-80"
              style={{ color: primaryColor }}
            >
              <ArrowLeft size={14} /> Thẻ ghi nhớ
            </Link>
          </div>

          <div className="flex items-center gap-4 z-10">
            <div className="flex items-center gap-1.5 font-sans">
              <Flame size={16} color="#f97316" className="animate-pulse" />
              <span style={{ fontWeight: 700, color: dark ? "#d1d5db" : "#374151", fontSize: 13 }}>
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

      {/* Tabs navigation list */}
      <div className={`${(viewMode === 'study' || viewMode === 'test' || viewMode === 'match' || viewMode === 'learn') ? 'max-w-7xl' : 'max-w-4xl'} mx-auto w-full px-4 mt-6 flex-1 flex flex-col overflow-x-hidden relative`}>
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide px-2">
          {[
            { id: 'dashboard', label: 'Quản lý thẻ' },
            { id: 'study', label: 'Lật thẻ' },
            { id: 'quiz', label: 'Trắc nghiệm' },
            { id: 'match', label: 'Ghép thẻ' },
            { id: 'learn', label: 'Học cuốn chiếu' },
            { id: 'write', label: 'Chép tả' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setViewMode(tab.id as any); setStudyFinished(false); }}
              className={`px-4 py-2 font-bold rounded-xl whitespace-nowrap text-xs transition-colors hover:scale-105 active:scale-95 ${
                viewMode === tab.id 
                  ? 'bg-[#10b981] text-white' 
                  : dark ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col w-full relative"
          >
            {cards.length === 0 && viewMode !== 'dashboard' ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center p-8 rounded-2xl bg-white dark:bg-zinc-900 border max-w-sm w-full" style={{ borderColor: border, boxShadow: shadow }}>
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Bộ thẻ rỗng</h3>
                  <p className="text-xs text-gray-500 mt-2 mb-6">Không có thẻ nào trong bộ này để ôn tập. Hãy thêm thẻ tại tab Quản lý thẻ trước!</p>
                  <button onClick={() => setViewMode('dashboard')} className="w-full bg-[#10b981] text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90">
                    Thêm thẻ mới
                  </button>
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'dashboard' && renderDashboardMode()}
                {viewMode === 'study' && renderStudyMode()}
                {viewMode === 'quiz' && renderQuizMode()}
                {viewMode === 'match' && <MatchGameMode cards={cards} deckId={deckId} onBack={() => setViewMode('dashboard')} />}
                {viewMode === 'learn' && <LearnMode cards={cards} deckId={deckId} onBack={() => setViewMode('dashboard')} />}
                {viewMode === 'write' && <WriteMode cards={cards} onBack={() => setViewMode('dashboard')} />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-x-180 { transform: rotateX(180deg); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
