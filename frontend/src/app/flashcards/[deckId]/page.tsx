"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Loader2, ChevronLeft, ChevronRight, RotateCcw, Play, 
  Edit2, Trash2, Check, X, BookOpen, Layers, Settings, Globe, Lock, 
  PenTool, Puzzle, Star, Volume2, VolumeX, Sparkles, Palette, EyeOff, Activity, 
  Flame, Zap, Trophy, Moon, Sun, Minus, Maximize, Minimize, Shuffle, SlidersHorizontal
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
  getDecks,
  getDeckStudySettings,
  saveDeckStudySettings
} from '@/services/flashcard.service';

import MatchGameMode from '@/components/flashcards/modes/MatchGameMode';
import LearnMode from '@/components/flashcards/modes/LearnMode';
import WriteMode from '@/components/flashcards/modes/WriteMode';

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
  position?: number;
  term_image_url?: string | null;
  definition_image_url?: string | null;
}

interface StudySettings {
  shuffle_cards: boolean;
  front_display: 'term' | 'definition';
  starred_only: boolean;
  difficult_only: boolean;
  auto_tts: boolean;
}

interface Deck {
  id: number;
  name: string;
  description: string;
  created_at: string;
  is_public?: boolean;
  category?: string;
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
    tasks,
    setTasks,
    setTaskCompletionToast,
    setTaskProgressToast
  } = useStudy();

  const [dark, setDark] = useState(false);
  const [muted, setMuted] = useState(false);
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>("nebula");
  const [viewMode, setViewMode] = useState<'dashboard' | 'study' | 'quiz' | 'match' | 'learn' | 'write'>('dashboard');

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  // Fullscreen and Study Settings
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStudyOptions, setShowStudyOptions] = useState(false);
  const [studySettings, setStudySettings] = useState<StudySettings>({
    shuffle_cards: false,
    front_display: 'term',
    starred_only: false,
    difficult_only: false,
    auto_tts: false,
  });

  // Settings modal states
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
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(1);
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [studyFinished, setStudyFinished] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

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

  // ── Helper to filter and order cards ─────────────────────────────────────────
  const applyStudyFilters = useCallback((sourceCards: Flashcard[], settings: StudySettings, specificIds?: number[]) => {
    let list = [...sourceCards];
    if (specificIds && specificIds.length > 0) {
      list = list.filter(c => specificIds.includes(c.id));
    } else {
      if (settings.starred_only) {
        list = list.filter(c => c.is_starred);
      }
      if (settings.difficult_only) {
        list = list.filter(c => (c.ease_factor && c.ease_factor < 2.2) || c.repetitions === 0);
      }
    }
    if (settings.shuffle_cards) {
      list = [...list].sort(() => Math.random() - 0.5);
    }
    return list;
  }, []);

  // ── Load configuration & initial values ──────────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "light";
    setDark(savedTheme === "dark");

    const onThemeChange = (e: any) => {
      if (e.detail?.theme) {
        setDark(e.detail.theme === "dark");
      }
    };
    window.addEventListener("cognito:theme_change", onThemeChange);

    const savedMute = localStorage.getItem("flashcard-muted") === "true";
    setMuted(savedMute);

    const savedBg = (localStorage.getItem("flashcard-bg") as BackgroundStyle) || "nebula";
    setBgStyle(savedBg);

    const modeParam = searchParams.get('mode');
    const initialMode = (modeParam && ['dashboard', 'study', 'quiz', 'match', 'learn', 'write'].includes(modeParam))
      ? (modeParam as 'dashboard' | 'study' | 'quiz' | 'match' | 'learn' | 'write')
      : 'dashboard';

    fetchDeckData(initialMode);

    return () => {
      window.removeEventListener("cognito:theme_change", onThemeChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const fetchDeckData = async (initialMode?: 'dashboard' | 'study' | 'quiz' | 'match' | 'learn' | 'write') => {
    try {
      setLoading(true);
      const [allCards, deckInfo, allDecks, settingsRes] = await Promise.all([
        getAllFlashcards(deckId),
        getDeckById(deckId),
        getDecks(),
        getDeckStudySettings(deckId).catch(() => null)
      ]);

      const loadedCards: Flashcard[] = Array.isArray(allCards) ? allCards : [];
      setCards(loadedCards);

      const loadedSettings: StudySettings = settingsRes || {
        shuffle_cards: false,
        front_display: 'term',
        starred_only: false,
        difficult_only: false,
        auto_tts: false,
      };
      setStudySettings(loadedSettings);

      const initialStudyCards = applyStudyFilters(loadedCards, loadedSettings);
      setStudyCards(initialStudyCards);

      if (initialMode) {
        setViewMode(initialMode);
        if (initialMode === 'study' && initialStudyCards.length > 0) {
          const savedKey = `flashcards-progress-${deckId}-index`;
          const savedIndex = localStorage.getItem(savedKey);
          if (savedIndex !== null) {
            const parsed = parseInt(savedIndex, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed < initialStudyCards.length) {
              setCurrentIndex(parsed);
              setIsFlipped(false);
            } else {
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
    window.dispatchEvent(new CustomEvent("cognito:theme_change", { detail: { theme: nextDark ? "dark" : "light" } }));
    if (typeof window !== "undefined") {
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // ── Fullscreen API Handling ────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && !isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
        setIsFullscreen(true);
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // ── Study Settings Update ──────────────────────────────────────────────────
  const handleUpdateSetting = async (key: keyof StudySettings, value: any) => {
    const nextSettings = { ...studySettings, [key]: value };
    setStudySettings(nextSettings);
    const newPool = applyStudyFilters(cards, nextSettings);
    setStudyCards(newPool);
    setCurrentIndex(0);
    setIsFlipped(false);
    try {
      await saveDeckStudySettings(deckId, nextSettings);
    } catch (err) {
      console.error("Lỗi lưu tùy chọn học:", err);
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
      const nextCards = [...cards, newCard];
      setCards(nextCards);
      setStudyCards(applyStudyFilters(nextCards, studySettings));
      setNewFront('');
      setNewBack('');
      setIsAddingCard(false);
      triggerMessage('Đã thêm thẻ mới!', 'success');
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
      const nextCards = cards.map(c => c.id === editingCardId ? { ...c, front: editFront, back: editBack } : c);
      setCards(nextCards);
      setStudyCards(applyStudyFilters(nextCards, studySettings));
      setEditingCardId(null);
      triggerMessage('Đã lưu thay đổi!', 'success');
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
          const nextCards = cards.filter(c => c.id !== id);
          setCards(nextCards);
          setStudyCards(applyStudyFilters(nextCards, studySettings));
          triggerMessage('Đã xóa thẻ khỏi bộ bài!', 'success');
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
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_starred: isStarred } : c));
      setStudyCards(prev => prev.map(c => c.id === card.id ? { ...c, is_starred: isStarred } : c));
      triggerMessage(isStarred ? 'Đã gắn sao thẻ này!' : 'Đã bỏ gắn sao.', 'success');
    } catch (err: any) {
      triggerMessage('Lỗi: ' + err.message, 'error');
    }
  };

  // ── Text To Speech ─────────────────────────────────────────────────────────
  const playTTS = (text: string) => {
    speak(text);
  };

  // ── Study Navigation & SM-2 Review ─────────────────────────────────────────
  const currentCard = studyCards[currentIndex];
  const isFrontDef = studySettings.front_display === 'definition';
  const frontText = isFrontDef ? currentCard?.back : currentCard?.front;
  const backText = isFrontDef ? currentCard?.front : currentCard?.back;
  const frontImage = isFrontDef ? currentCard?.definition_image_url : currentCard?.term_image_url;
  const backImage = isFrontDef ? currentCard?.term_image_url : currentCard?.definition_image_url;

  const goNext = () => {
    if (currentIndex >= studyCards.length - 1) {
      setStudyFinished(true);
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

    if (rating === "hard") {
      playHardSound(muted);
    } else {
      playSuccessSound(muted);
    }

    try {
      const res = await reviewFlashcard(currentCard.id, rating);
      if (res && res.updated_streak !== undefined && activeUser) {
        setActiveUser({
          ...activeUser,
          streak: res.updated_streak,
          last_study_date: new Date().toISOString()
        });
      }
      if (res && res.task_update?.task) {
        const { task, justCompleted } = res.task_update;
        const prevTask = tasks.find((t: any) => t.task_type === task.task_type);
        setTasks((prev: any[]) => prev.map(t => t.task_type === task.task_type ? task : t));
        setTaskProgressToast({
          type: task.task_type,
          title: task.title,
          description: task.description,
          previousValue: prevTask ? prevTask.current_value : 0,
          currentValue: task.current_value,
          targetValue: task.target_value
        });
        if (justCompleted) {
          setTaskCompletionToast({ type: task.task_type, title: task.title });
          triggerMessage(`Chúc mừng! Bạn đã hoàn thành nhiệm vụ "${task.title}"! 🎉`, "success");
        }
      }

      setCards(prev => prev.map(c =>
        c.id === currentCard.id ? { ...c, repetitions: Math.max(c.repetitions + 1, 1) } : c
      ));
      setStudyCards(prev => prev.map(c =>
        c.id === currentCard.id ? { ...c, repetitions: Math.max(c.repetitions + 1, 1) } : c
      ));
    } catch (err) {
      console.error("Lỗi cập nhật tiến trình ôn tập:", err);
    }

    goNext();
  };

  // Auto-TTS on card change
  useEffect(() => {
    if (viewMode === 'study' && !studyFinished && currentCard && studySettings.auto_tts && !muted) {
      speak(frontText || '');
    }
  }, [currentIndex, currentCard?.id, studySettings.auto_tts, viewMode, studyFinished, frontText, muted, speak]);

  // Keyboard navigation & Shortcuts (Phím F, Esc, Space, 1/2/3, V, S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      if (e.key === 'Escape') {
        if (isFullscreen) {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
          setIsFullscreen(false);
        }
        return;
      }

      if (viewMode === 'study' && !studyFinished && currentCard) {
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
        if (isFlipped) {
          if (e.key === "1") handleRateCard("hard");
          if (e.key === "2") handleRateCard("good");
          if (e.key === "3") handleRateCard("easy");
        }
        if (e.code === 'KeyV') {
          e.preventDefault();
          playTTS(isFlipped ? (backText || '') : (frontText || ''));
        }
        if (e.code === 'KeyS') {
          e.preventDefault();
          handleToggleStar(currentCard);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, studyFinished, viewMode, isFlipped, muted, currentCard, isFullscreen, frontText, backText, toggleFullscreen]);

  // Mobile Swipe Touch Listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 60) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      setIsFlipped(f => !f);
      playFlipSound(muted);
    }
    setTouchStart(null);
  };

  // Relearning helpers
  const handleRelearnUnmastered = () => {
    const unmastered = studyCards.filter(c => ratings[c.id] === 'hard' || (!ratings[c.id] && c.repetitions === 0));
    const pool = unmastered.length > 0 ? unmastered : studyCards.filter(c => c.repetitions === 0);
    if (pool.length === 0) {
      triggerMessage("Bạn đã thuộc tất cả các thẻ! Xuất sắc!", "success");
      return;
    }
    setStudyCards(pool);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRatings({});
    setStudyFinished(false);
  };

  const handleRelearnAll = () => {
    setStudyCards(applyStudyFilters(cards, studySettings));
    setCurrentIndex(0);
    setIsFlipped(false);
    setRatings({});
    setStudyFinished(false);
  };

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
    }, 1200);
  };

  // Typography auto-fit helper
  const getTypographyClass = (text?: string) => {
    if (!text) return 'text-2xl md:text-4xl';
    const len = text.length;
    if (len < 30) return 'text-3xl md:text-5xl font-black';
    if (len < 80) return 'text-2xl md:text-3xl font-bold';
    if (len < 200) return 'text-lg md:text-2xl font-semibold';
    return 'text-base md:text-lg font-medium';
  };

  // Style Tokens
  const pageBg = dark ? "#121212" : "#ebe8e0";
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const textSub = dark ? "#9ca3af" : "#6b7280";
  const primaryColor = dark ? "#10b981" : "#1a2e1c";
  const border = dark ? "#2a2a2a" : "rgba(26,46,28,0.22)";
  const shadow = dark ? "4px 4px 0px 0px rgba(255,255,255,0.04)" : "4px 4px 0px 0px rgba(26,46,28,0.12)";

  // ── Render Study Options Modal ─────────────────────────────────────────────
  const renderStudyOptionsModal = () => (
    <AnimatePresence>
      {showStudyOptions && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm">
                <SlidersHorizontal size={18} className="text-emerald-500" /> Tùy chọn học tập
              </h3>
              <button onClick={() => setShowStudyOptions(false)} className="text-gray-400 hover:text-red-500 p-1"><X size={20} /></button>
            </div>
            <div className="p-5 flex flex-col gap-3.5 text-xs font-medium">
              {/* Trộn thẻ */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700 cursor-pointer hover:bg-gray-100/70 dark:hover:bg-zinc-800 transition-colors">
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">Trộn thẻ</div>
                  <div className="text-[11px] text-gray-500">Đảo ngẫu nhiên thứ tự các thẻ học</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={studySettings.shuffle_cards} 
                  onChange={e => handleUpdateSetting('shuffle_cards', e.target.checked)} 
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                />
              </label>

              {/* Mặt trước hiển thị */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700">
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">Mặt trước hiển thị</div>
                  <div className="text-[11px] text-gray-500">Chọn nội dung hiển thị đầu tiên</div>
                </div>
                <select
                  value={studySettings.front_display}
                  onChange={e => handleUpdateSetting('front_display', e.target.value as any)}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-gray-800 dark:text-gray-100 outline-none"
                >
                  <option value="term">Thuật ngữ</option>
                  <option value="definition">Định nghĩa</option>
                </select>
              </div>

              {/* Chỉ học thẻ sao */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700 cursor-pointer hover:bg-gray-100/70 dark:hover:bg-zinc-800 transition-colors">
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500 fill-amber-500" /> Chỉ học thẻ gắn sao
                  </div>
                  <div className="text-[11px] text-gray-500">Ôn tập các thẻ quan trọng bạn đã đánh dấu</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={studySettings.starred_only} 
                  onChange={e => handleUpdateSetting('starred_only', e.target.checked)} 
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                />
              </label>

              {/* Chỉ học thẻ khó */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700 cursor-pointer hover:bg-gray-100/70 dark:hover:bg-zinc-800 transition-colors">
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">Chỉ học thẻ khó</div>
                  <div className="text-[11px] text-gray-500">Tập trung vào thẻ hay quên hoặc đánh giá Khó</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={studySettings.difficult_only} 
                  onChange={e => handleUpdateSetting('difficult_only', e.target.checked)} 
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                />
              </label>

              {/* Tự động phát âm */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700 cursor-pointer hover:bg-gray-100/70 dark:hover:bg-zinc-800 transition-colors">
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">Tự phát âm (TTS)</div>
                  <div className="text-[11px] text-gray-500">Tự động đọc nội dung khi mở thẻ mới</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={studySettings.auto_tts} 
                  onChange={e => handleUpdateSetting('auto_tts', e.target.checked)} 
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                />
              </label>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end bg-gray-50 dark:bg-zinc-950">
              <button 
                onClick={() => setShowStudyOptions(false)} 
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Render Fullscreen Study Mode ───────────────────────────────────────────
  const renderFullscreenStudyMode = () => {
    const progress = studyCards.length > 0 ? ((currentIndex + 1) / studyCards.length) * 100 : 0;
    const easy = Object.values(ratings).filter((r) => r === "easy").length;
    const ok = Object.values(ratings).filter((r) => r === "good").length;
    const hard = Object.values(ratings).filter((r) => r === "hard").length;

    if (studyFinished) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md rounded-2xl p-8 text-center border-2" style={{ background: dark ? "#1e1e1e" : "#ffffff", borderColor: border, boxShadow: shadow }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#10b98122" }}>
              <Trophy size={28} color="#10b981" />
            </div>
            <h2 style={{ fontWeight: 800, color: textMain, fontSize: 22 }} className="mb-1">Hoàn thành lượt học!</h2>
            <p style={{ color: textSub, fontSize: 13 }} className="mb-6">Bạn đã xem và ôn tập {studyCards.length} thẻ.</p>
            <div className="flex gap-3 mb-6">
              {[
                { label: "Dễ", count: easy, color: "#10b981" },
                { label: "Ổn", count: ok, color: "#f59e0b" },
                { label: "Khó / Lại", count: hard, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} className="flex-1 rounded-xl py-3 border" style={{ background: s.color + "18", borderColor: s.color + "33" }}>
                  <div style={{ fontWeight: 800, color: s.color, fontSize: 20 }}>{s.count}</div>
                  <div style={{ color: textSub, fontSize: 11 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              {hard > 0 && (
                <button 
                  onClick={handleRelearnUnmastered}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-xs font-bold rounded-xl text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <RotateCcw size={14} /> Học lại thẻ chưa thuộc ({hard})
                </button>
              )}
              <div className="flex gap-2.5">
                <button 
                  onClick={handleRelearnAll}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-200"
                >
                  Học lại tất cả
                </button>
                <button 
                  onClick={() => {
                    toggleFullscreen();
                    setViewMode('dashboard');
                  }} 
                  className="flex-1 py-2.5 bg-[#10b981] hover:opacity-90 text-xs font-bold rounded-xl text-white"
                >
                  Quản lý thẻ
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (studyCards.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center p-8 rounded-2xl bg-white dark:bg-zinc-900 border max-w-sm w-full" style={{ borderColor: border, boxShadow: shadow }}>
            <Star className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Không có thẻ phù hợp</h3>
            <p className="text-xs text-gray-500 mt-2 mb-6">
              {studySettings.starred_only ? 'Chưa có thẻ nào được gắn sao trong bộ này.' : 'Không tìm thấy thẻ nào theo bộ lọc hiện tại.'}
            </p>
            <button
              onClick={() => {
                handleUpdateSetting('starred_only', false);
                handleUpdateSetting('difficult_only', false);
              }}
              className="w-full bg-[#10b981] text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90"
            >
              Học tất cả thẻ
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col justify-between h-screen overflow-hidden bg-[#FDFCFB] dark:bg-[#121212]">
        {/* Fixed Thin Header Bar */}
        <div className="h-14 w-full flex items-center justify-between px-4 md:px-6 border-b border-gray-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-sm z-50">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm md:text-base text-gray-800 dark:text-gray-100 max-w-[140px] md:max-w-xs truncate" title={deck?.name}>
              {deck?.name || "Bộ thẻ"}
            </span>
            <button
              onClick={() => setShowStudyOptions(true)}
              className="p-1.5 md:px-2.5 md:py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              title="Tùy chọn học"
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Tùy chọn</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Thẻ trước (←)"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {currentIndex + 1} / {studyCards.length}
              </span>
              <div className="w-20 md:w-32 bg-gray-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mt-0.5">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={currentIndex === studyCards.length - 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Thẻ sau (→)"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {currentCard && (
              <>
                <button
                  onClick={(e) => handleToggleStar(currentCard, e)}
                  className={`p-1.5 rounded-lg border transition-colors ${currentCard.is_starred ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-500' : 'border-gray-200 dark:border-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                  title={currentCard.is_starred ? "Bỏ gắn sao (S)" : "Gắn sao thẻ (S)"}
                >
                  <Star size={16} fill={currentCard.is_starred ? "currentColor" : "none"} />
                </button>
                <AudioButton isPlaying={isPlaying} onClick={() => playTTS(isFlipped ? (backText || '') : (frontText || ''))} dark={dark} />
                
                <div className="hidden md:flex items-center gap-1 ml-1">
                  <button
                    onClick={() => handleRateCard("hard")}
                    className="px-2 py-1 rounded-lg text-xs font-bold border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                    title="Khó (phím 1)"
                  >
                    1. Khó
                  </button>
                  <button
                    onClick={() => handleRateCard("good")}
                    className="px-2 py-1 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors"
                    title="Ổn (phím 2)"
                  >
                    2. Ổn
                  </button>
                  <button
                    onClick={() => handleRateCard("easy")}
                    className="px-2 py-1 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                    title="Dễ (phím 3)"
                  >
                    3. Dễ
                  </button>
                </div>
              </>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ml-1"
              title="Thoát toàn màn hình (Esc hoặc F)"
            >
              <Minimize size={16} />
            </button>
          </div>
        </div>

        {/* Center Stage: Flip Card */}
        <div 
          className="flex-1 w-full flex items-center justify-center p-4 md:p-8 max-w-4xl mx-auto overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentCard && (
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full h-full max-h-[68vh] flex items-center justify-center"
            >
              <div className="flip-card-scene w-full h-full">
                <div
                  className={`flip-card-inner h-full min-h-[360px] md:min-h-[460px] ${isFlipped ? "is-flipped" : ""}`}
                  onClick={() => { setIsFlipped(f => !f); playFlipSound(muted); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === " " && e.preventDefault()}
                >
                  {/* Front Face */}
                  <div
                    className="flip-card-face flip-card-front"
                    style={{
                      background: dark ? "#1e1e1e" : "#fffdf0",
                      border: `2px solid ${border}`,
                      boxShadow: shadow,
                    }}
                  >
                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                      <span className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                        {currentCard.tag || (isFrontDef ? "Định nghĩa" : "Thuật ngữ")}
                      </span>
                    </div>

                    <span className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-lg font-bold bg-black/5 dark:bg-white/10" style={{ color: textSub }}>
                      Mặt trước
                    </span>

                    <div className="w-full flex-1 flex flex-col items-center justify-center overflow-hidden my-auto py-2">
                      {frontImage && (
                        <div className="mb-3 max-h-40 md:max-h-56 w-full flex items-center justify-center overflow-hidden rounded-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={frontImage} alt="Mặt trước" className="max-h-40 md:max-h-56 object-contain rounded-xl shadow-sm" />
                        </div>
                      )}
                      <div className="max-h-[50vh] overflow-y-auto px-4 w-full text-center scrollbar-thin">
                        <div className={`break-words ${getTypographyClass(frontText)}`} style={{ color: textMain, lineHeight: 1.35 }}>
                          {frontText}
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 animate-pulse">
                        Space / Chạm để lật xem đáp án
                      </span>
                    </div>
                  </div>

                  {/* Back Face */}
                  <div
                    className="flip-card-face flip-card-back"
                    style={{
                      background: dark ? "#0e2317" : "#1a3d28",
                      border: `2px solid ${dark ? "#10b981" : "#1a3d28"}`,
                      boxShadow: dark ? "8px 8px 0px 0px rgba(16,185,129,0.15)" : "8px 8px 0px 0px rgba(26,61,40,0.35)",
                    }}
                  >
                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                      <span className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-white/10 text-emerald-200">
                        {currentCard.tag || (isFrontDef ? "Thuật ngữ" : "Định nghĩa")}
                      </span>
                    </div>

                    <span className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-lg font-bold bg-emerald-400/20 text-emerald-300">
                      Mặt sau (Đáp án)
                    </span>

                    <div className="w-full flex-1 flex flex-col items-center justify-center overflow-hidden my-auto py-2">
                      {backImage && (
                        <div className="mb-3 max-h-40 md:max-h-56 w-full flex items-center justify-center overflow-hidden rounded-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={backImage} alt="Mặt sau" className="max-h-40 md:max-h-56 object-contain rounded-xl shadow-sm" />
                        </div>
                      )}
                      <div className="max-h-[50vh] overflow-y-auto px-4 w-full text-center scrollbar-thin">
                        <div className={`break-words ${getTypographyClass(backText)} text-white whitespace-pre-wrap`} style={{ lineHeight: 1.4 }}>
                          {backText}
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
                      <span className="text-[11px] text-emerald-300/70">
                        [1] Khó  •  [2] Ổn  •  [3] Dễ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Thin Hint & Control Bar */}
        <div className="w-full py-3 px-4 border-t border-gray-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span>[Space/Click] Lật thẻ</span>
            <span>•</span>
            <span>[← / →] Chuyển thẻ</span>
            <span>•</span>
            <span>[1/2/3] Đánh giá SM-2</span>
            <span>•</span>
            <span>[S] Đánh dấu sao</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRateCard("hard")}
              className="px-3 py-1 rounded-md font-bold bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:opacity-90"
            >
              1. Khó
            </button>
            <button
              onClick={() => handleRateCard("good")}
              className="px-3 py-1 rounded-md font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 hover:opacity-90"
            >
              2. Ổn
            </button>
            <button
              onClick={() => handleRateCard("easy")}
              className="px-3 py-1 rounded-md font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:opacity-90"
            >
              3. Dễ
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render Other Mode Fullscreen ───────────────────────────────────────────
  const renderOtherModeFullscreen = () => (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FDFCFB] dark:bg-[#121212]">
      <div className="h-14 w-full flex items-center justify-between px-4 md:px-8 border-b border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm md:text-base text-gray-800 dark:text-gray-100">
            {deck?.name || "Bộ thẻ"}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {viewMode === 'quiz' ? 'Trắc nghiệm' : viewMode === 'match' ? 'Ghép thẻ' : viewMode === 'learn' ? 'Học cuốn chiếu' : viewMode === 'write' ? 'Chép tả' : 'Học tập'}
          </span>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          title="Thu nhỏ (Esc hoặc F)"
        >
          <Minimize size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
        {viewMode === 'quiz' && renderQuizMode()}
        {viewMode === 'match' && <MatchGameMode cards={cards} deckId={deckId} onBack={() => { setIsFullscreen(false); setViewMode('dashboard'); }} />}
        {viewMode === 'learn' && <LearnMode cards={cards} deckId={deckId} onBack={() => { setIsFullscreen(false); setViewMode('dashboard'); }} />}
        {viewMode === 'write' && <WriteMode cards={cards} onBack={() => { setIsFullscreen(false); setViewMode('dashboard'); }} />}
      </div>
    </div>
  );

  // ── Render Dashboard Mode ──────────────────────────────────────────────────
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
            
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Link 
                href={`/flashcards/${deckId}/edit`}
                className="p-2 rounded-full transition-colors hover:scale-105 active:scale-95"
                style={{ color: textSub, background: dark ? "#2a2a2a" : "#f0f0ec" }}
                title="Sửa toàn bộ học phần"
              >
                <Edit2 size={16} />
              </Link>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full transition-colors hover:scale-105 active:scale-95"
                style={{ color: textSub, background: dark ? "#2a2a2a" : "#f0f0ec" }}
                title="Cài đặt bộ thẻ"
              >
                <Settings size={18} />
              </button>
            </div>

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
          <div className="flex items-center gap-2">
            <Link
              href={`/flashcards/${deckId}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
              style={{ borderColor: border, color: textMain }}
            >
              <Edit2 size={13} /> Sửa học phần
            </Link>
            <button 
              onClick={() => setIsAddingCard(!isAddingCard)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-colors hover:opacity-90"
              style={{ background: "#10b98122", color: "#10b981" }}
            >
              {isAddingCard ? 'Hủy' : '+ Thêm thẻ mới'}
            </button>
          </div>
        </div>

        {/* Add Card Inline */}
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

        {/* Cards List */}
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
                      <button onClick={(e) => handleToggleStar(card, e)} className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 ${card.is_starred ? 'text-amber-500' : 'text-gray-400'}`}>
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

  // ── Render Normal Study Mode ───────────────────────────────────────────────
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
            <p style={{ color: textSub, fontSize: 13 }} className="mb-6">Bạn đã xem và ôn tập tất cả {studyCards.length} thẻ.</p>
            <div className="flex gap-3 mb-6">
              {[
                { label: "Dễ", count: easy, color: "#10b981" },
                { label: "Ổn", count: ok, color: "#f59e0b" },
                { label: "Khó / Lại", count: hard, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} className="flex-1 rounded-xl py-3 border" style={{ background: s.color + "18", borderColor: s.color + "33" }}>
                  <div style={{ fontWeight: 800, color: s.color, fontSize: 20 }}>{s.count}</div>
                  <div style={{ color: textSub, fontSize: 11 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              {hard > 0 && (
                <button 
                  onClick={handleRelearnUnmastered}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-xs font-bold rounded-xl text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <RotateCcw size={14} /> Học lại thẻ chưa thuộc ({hard})
                </button>
              )}
              <div className="flex gap-2.5">
                <button 
                  onClick={handleRelearnAll}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-200"
                >
                  Học lại
                </button>
                <button onClick={() => setViewMode('dashboard')} className="flex-1 py-2.5 bg-[#10b981] hover:opacity-90 text-xs font-bold rounded-xl text-white">Quản lý thẻ</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (studyCards.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center p-8 rounded-2xl bg-white dark:bg-zinc-900 border max-w-sm w-full" style={{ borderColor: border, boxShadow: shadow }}>
            <Star className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Không có thẻ phù hợp</h3>
            <p className="text-xs text-gray-500 mt-2 mb-6">
              {studySettings.starred_only ? 'Chưa có thẻ nào được gắn sao trong bộ này.' : 'Không tìm thấy thẻ nào theo bộ lọc hiện tại.'}
            </p>
            <button
              onClick={() => {
                handleUpdateSetting('starred_only', false);
                handleUpdateSetting('difficult_only', false);
              }}
              className="w-full bg-[#10b981] text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90"
            >
              Học tất cả thẻ
            </button>
          </div>
        </div>
      );
    }

    const progress = studyCards.length > 0 ? ((currentIndex + 1) / studyCards.length) * 100 : 0;
    const masteredCount = cards.filter((c: any) => c.repetitions > 0).length;
    const masteredPct = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-4 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-right duration-300">
        {/* Left Column: Progress */}
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
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span style={{ color: textSub }}>Thẻ hiện tại:</span>
                  <span style={{ color: textMain }}>{currentIndex + 1} / {studyCards.length}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: dark ? "#10b981" : "#1a2e1c" }} />
                </div>
                <div className="flex justify-between items-center text-xs font-bold pt-1">
                  <span style={{ color: textSub }}>Tiến trình:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{Math.round(progress)}%</span>
                </div>
              </div>

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
                {decks.filter(d => d.id !== deckId).slice(0, 5).map((d) => (
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

        {/* Center Column: Player */}
        <div className="col-span-1 lg:col-span-6 flex flex-col items-center gap-6">
          <div className="w-full flex items-center justify-between">
            <button
              onClick={() => setViewMode('dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 bg-white dark:bg-zinc-900 border text-xs font-bold"
              style={{ borderColor: border, color: textSub }}
            >
              <ChevronLeft size={14} /> Danh sách
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStudyOptions(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-white dark:bg-zinc-900 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"
                style={{ borderColor: border, color: textSub }}
                title="Tùy chọn học"
              >
                <SlidersHorizontal size={13} /> Tùy chọn
              </button>
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                title="Phóng to toàn màn hình (phím F)"
              >
                <Maximize size={13} /> Phóng to (F)
              </button>
            </div>

            <span className="text-sm font-bold" style={{ color: textMain }}>
              {currentIndex + 1} / {studyCards.length}
            </span>
          </div>

          {currentCard && (
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flip-card-scene w-full">
                <div
                  className={`flip-card-inner ${isFlipped ? "is-flipped" : ""}`}
                  onClick={() => { setIsFlipped(f => !f); playFlipSound(muted); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === " " && e.preventDefault()}
                >
                  {/* Front Face */}
                  <div
                    className="flip-card-face flip-card-front"
                    style={{
                      background: dark ? "#1e1e1e" : "#fffdf0",
                      border: `2px solid ${border}`,
                      boxShadow: shadow,
                    }}
                  >
                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                      <span className="text-xs px-2.5 py-1.5 rounded-lg font-bold" style={{ background: dark ? "#2a2a2a" : "#f0f0ec", color: dark ? "#9ca3af" : "#4b5563" }}>
                        {currentCard.tag || (isFrontDef ? "Định nghĩa" : "Thuật ngữ")}
                      </span>
                      <AudioButton isPlaying={isPlaying} onClick={() => playTTS(frontText || '')} dark={dark} />
                      <button
                        onClick={(e) => handleToggleStar(currentCard, e)}
                        className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${currentCard.is_starred ? 'text-amber-500' : 'text-gray-400'}`}
                        title="Đánh dấu sao"
                      >
                        <Star size={16} fill={currentCard.is_starred ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <span className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-lg font-bold" style={{ background: dark ? "#2a2a2a" : "#f0f0ec", color: textSub }}>
                      Mặt trước
                    </span>

                    <div className="w-full flex-1 flex flex-col items-center justify-center overflow-hidden my-auto py-2">
                      {frontImage && (
                        <div className="mb-3 max-h-40 md:max-h-52 w-full flex items-center justify-center overflow-hidden rounded-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={frontImage} alt="Mặt trước" className="max-h-40 md:max-h-52 object-contain rounded-xl shadow-sm" />
                        </div>
                      )}
                      <div className="max-h-[45vh] overflow-y-auto px-4 w-full text-center">
                        <div className={`break-words ${getTypographyClass(frontText)}`} style={{ color: textMain, lineHeight: 1.3 }}>
                          {frontText}
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
                      <span className="text-[10px]" style={{ color: textSub }}>
                        Space / Click để lật xem đáp án
                      </span>
                    </div>
                  </div>

                  {/* Back Face */}
                  <div
                    className="flip-card-face flip-card-back"
                    style={{
                      background: dark ? "#0e2317" : "#1a3d28",
                      border: `2px solid ${dark ? "#10b981" : "#1a3d28"}`,
                      boxShadow: dark ? "8px 8px 0px 0px rgba(16,185,129,0.15)" : "8px 8px 0px 0px rgba(26,61,40,0.35)",
                    }}
                  >
                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                      <span className="text-xs px-2.5 py-1.5 rounded-lg font-bold" style={{ background: "rgba(255,255,255,0.12)", color: "#a7f3d0" }}>
                        {currentCard.tag || (isFrontDef ? "Thuật ngữ" : "Định nghĩa")}
                      </span>
                      <AudioButton isPlaying={isPlaying} onClick={() => playTTS(backText || '')} dark={true} />
                    </div>

                    <span className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-lg font-bold" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                      Mặt sau (Đáp án)
                    </span>

                    <div className="w-full flex-1 flex flex-col items-center justify-center overflow-hidden my-auto py-2">
                      {backImage && (
                        <div className="mb-3 max-h-40 md:max-h-52 w-full flex items-center justify-center overflow-hidden rounded-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={backImage} alt="Mặt sau" className="max-h-40 md:max-h-52 object-contain rounded-xl shadow-sm" />
                        </div>
                      )}
                      <div className="max-h-[45vh] overflow-y-auto px-4 w-full text-center">
                        <div className={`break-words ${getTypographyClass(backText)} text-white whitespace-pre-wrap`} style={{ lineHeight: 1.4 }}>
                          {backText}
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
                      {[
                        { key: "1", label: "Khó", color: "#ef4444" },
                        { key: "2", label: "Ổn", color: "#f59e0b" },
                        { key: "3", label: "Dễ", color: "#10b981" },
                      ].map(k => (
                        <span key={k.key} className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: k.color + "25", color: k.color }}>
                          [{k.key}] {k.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SM-2 Rating Buttons */}
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

          {/* Navigation Controls */}
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
              disabled={currentIndex === studyCards.length - 1}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-zinc-900 border"
              style={{ borderColor: border }}
            >
              <ChevronRight size={18} color={textMain} />
            </button>
          </div>
        </div>

        {/* Right Column: Tips */}
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
                { key: "F", desc: "Phóng to / Thu nhỏ" },
                { key: "Space / Enter", desc: "Lật thẻ" },
                { key: "←", desc: "Thẻ trước" },
                { key: "→", desc: "Thẻ sau" },
                { key: "1", desc: "Đánh giá Khó" },
                { key: "2", desc: "Đánh giá Ổn" },
                { key: "3", desc: "Đánh giá Dễ" },
                { key: "S", desc: "Gắn sao thẻ" },
                { key: "V", desc: "Đọc phát âm" }
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
              &quot;Hãy cố gắng tập hồi tưởng (Active Recall) đáp án trước khi lật thẻ. Việc tự suy nghĩ giúp kích thích bộ não ghi nhớ lâu hơn 150%.&quot;
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── Render Quiz Mode ───────────────────────────────────────────────────────
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-[#10b98122] text-[#10b981] px-4 py-1.5 rounded-full">Điểm: {quizScore}</span>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg border text-xs font-bold bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors"
              title="Phóng to (F)"
            >
              <Maximize size={14} />
            </button>
          </div>
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
      {globalMessage && globalMessage.text && (
        <div className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border ${
          globalMessage.type === 'success' ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-white text-rose-700 border-rose-200'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

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

  // If in Fullscreen Mode, render dedicated Fullscreen interface
  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-[#FDFCFB] dark:bg-[#121212] flex flex-col justify-between overflow-hidden"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {viewMode === 'study' ? renderFullscreenStudyMode() : renderOtherModeFullscreen()}
        {renderStudyOptionsModal()}
        {renderSystemUI()}

        <style dangerouslySetInnerHTML={{__html: `
          .flip-card-scene { perspective: 1200px; width: 100%; height: 100%; }
          .flip-card-inner { position: relative; width: 100%; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; transition: transform 0.52s cubic-bezier(0.4, 0.2, 0.2, 1); cursor: pointer; }
          .flip-card-inner.is-flipped { transform: rotateY(180deg); }
          .flip-card-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; border-radius: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem 2rem; }
          .flip-card-front { transform: rotateY(0deg) translateZ(1px); }
          .flip-card-back { transform: rotateY(180deg) translateZ(1px); }
          .scrollbar-thin::-webkit-scrollbar { width: 5px; }
          .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
        `}} />
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
      {renderStudyOptionsModal()}

      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => {}}
        onDashboardClick={() => router.push('/library')}
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
      <div className={`${(viewMode === 'study' || viewMode === 'match' || viewMode === 'learn') ? 'max-w-7xl' : 'max-w-4xl'} mx-auto w-full px-4 mt-6 flex-1 flex flex-col overflow-x-hidden relative`}>
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
        .flip-card-scene { perspective: 1200px; width: 100%; }
        .flip-card-inner { position: relative; width: 100%; min-height: 320px; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; transition: transform 0.52s cubic-bezier(0.4, 0.2, 0.2, 1); cursor: pointer; }
        .flip-card-inner.is-flipped { transform: rotateY(180deg); }
        .flip-card-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; border-radius: 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem 2rem; }
        .flip-card-front { transform: rotateY(0deg) translateZ(1px); }
        .flip-card-back { transform: rotateY(180deg) translateZ(1px); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
