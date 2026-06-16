"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAllFlashcards, updateFlashcard, deleteFlashcard, getDeckById, updateDeck, deleteDeck } from '@/services/flashcard.service';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, Maximize, RefreshCw, Play, Edit2, Trash2, Check, X, BookOpen, Layers, Settings, Globe, Lock, PenTool, Puzzle, Star, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleStarFlashcard } from '@/services/flashcard.service';
import MatchGameMode from '@/components/flashcards/modes/MatchGameMode';
import WriteMode from '@/components/flashcards/modes/WriteMode';

export default function FlashcardDeckPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = Number(params.deckId);
  
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("app-theme");
    if (saved === "dark") setDark(true);
  }, []);

  const [cards, setCards] = useState<any[]>([]);
  const [deck, setDeck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom Alert & Confirm
  const [toast, setToast] = useState<{ type: 'success'|'error'|'warning', text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string, message: string, onConfirm: () => void, isDestructive?: boolean } | null>(null);

  const showToast = (text: string, type: 'success'|'error'|'warning' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Settings States
  const [showSettings, setShowSettings] = useState(false);
  const [editDeckName, setEditDeckName] = useState('');
  const [editDeckDesc, setEditDeckDesc] = useState('');
  const [editDeckPublic, setEditDeckPublic] = useState(false);
  
  // Modes: 'dashboard' | 'study' | 'quiz' | 'match' | 'write'
  const [viewMode, setViewMode] = useState<'dashboard' | 'study' | 'quiz' | 'match' | 'write'>('dashboard');
  
  // Create States
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  // Edit States
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  // Study States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz States
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [deckId]);

  const fetchCards = async () => {
    try {
      const [allCards, deckInfo] = await Promise.all([
        getAllFlashcards(deckId),
        getDeckById(deckId)
      ]);
      setCards(allCards || []);
      if (deckInfo) {
        setDeck(deckInfo);
        setEditDeckName(deckInfo.name || '');
        setEditDeckDesc(deckInfo.description || '');
        setEditDeckPublic(deckInfo.is_public || false);
      }
    } catch (error) {
      console.error('Lỗi tải flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeck = async () => {
    try {
      const updated = await updateDeck(deckId, {
        name: editDeckName,
        description: editDeckDesc,
        is_public: editDeckPublic
      });
      setDeck(updated);
      setShowSettings(false);
      showToast('Đã cập nhật thông tin bộ thẻ!', 'success');
    } catch (error: any) {
      showToast("Lỗi cập nhật: " + error.message, 'error');
    }
  };

  const handleDeleteDeck = () => {
    setConfirmDialog({
      title: 'Xóa bộ thẻ',
      message: 'HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn xóa TOÀN BỘ bộ thẻ này và tất cả thẻ bên trong? Dữ liệu không thể khôi phục!',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDeck(deckId);
          showToast('Đã xóa bộ thẻ!', 'success');
          router.push('/library');
        } catch (error: any) {
          showToast("Lỗi khi xóa: " + error.message, 'error');
        }
      }
    });
  };

  // -------------------------
  // DASHBOARD & CRUD LOGIC
  // -------------------------
  const handleCreateCard = async () => {
    if (newFront.trim() === '' || newBack.trim() === '') {
      showToast("Nội dung Front và Back không được để trống!", 'error');
      return;
    }

    const isDuplicate = cards.some(c => c.front.toLowerCase() === newFront.toLowerCase().trim());
    if (isDuplicate) {
      setConfirmDialog({
        title: 'Cảnh báo trùng lặp',
        message: 'Thuật ngữ (Front) này đã tồn tại trong bộ bài! Bạn có chắc chắn muốn tạo thêm thẻ trùng không?',
        onConfirm: proceedCreateCard
      });
      return;
    }
    proceedCreateCard();
  };

  const proceedCreateCard = async () => {
    try {
      const { createFlashcard } = await import('@/services/flashcard.service');
      const newCard = await createFlashcard(deckId, newFront, newBack);
      setCards([...cards, newCard]);
      setNewFront('');
      setNewBack('');
      setIsAddingCard(false);
      showToast('Đã thêm thẻ mới!', 'success');
    } catch (error: any) {
      showToast("Lỗi khi tạo thẻ mới: " + error.message, 'error');
    }
  };

  const handleEditClick = (card: any) => {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const handleSaveEdit = async () => {
    if (!editingCardId) return;
    if (editFront.trim() === '' || editBack.trim() === '') {
      showToast("Nội dung Front và Back không được để trống!", 'error');
      return;
    }
    
    // Ràng buộc (Constraint): Kiểm tra xem có bị trùng với thẻ khác trong bộ bài không
    const isDuplicate = cards.some(c => c.id !== editingCardId && c.front.toLowerCase() === editFront.toLowerCase().trim());
    if (isDuplicate) {
      setConfirmDialog({
        title: 'Cảnh báo trùng lặp',
        message: 'Thuật ngữ (Front) này đã tồn tại trong bộ bài! Bạn có chắc chắn muốn lưu thẻ trùng không?',
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
      showToast('Đã lưu thay đổi!', 'success');
    } catch (error: any) {
      showToast("Lỗi khi lưu: " + error.message, 'error');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      title: 'Xóa thẻ',
      message: 'Bạn có chắc chắn muốn xóa thẻ này vĩnh viễn?',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteFlashcard(id);
          setCards(cards.filter(c => c.id !== id));
          showToast('Đã xóa thẻ', 'success');
        } catch (error: any) {
          showToast("Lỗi khi xóa: " + error.message, 'error');
        }
      }
    });
  };

  // -------------------------
  // QUIZ LOGIC
  // -------------------------
  const generateQuiz = () => {
    if (cards.length < 4) {
      showToast('⚠️ Ràng buộc hệ thống: Bộ thẻ của bạn cần tối thiểu 4 thẻ để có đủ đáp án tạo bài trắc nghiệm (Quiz Mode). Hãy thêm thẻ trước!', 'warning');
      return;
    }
    
    const questions = cards.map(card => {
      // Get 3 random distinct answers from OTHER cards to act as Distractors
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
    
    // Shuffle questions order
    setQuizQuestions(questions.sort(() => 0.5 - Math.random()));
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setQuizFinished(false);
    setViewMode('quiz');
  };

  const handleQuizAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent double click
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

  const speakText = (text: string, lang = 'en-US') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleStar = async (card: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const isStarred = !card.is_starred;
      await toggleStarFlashcard(card.id, isStarred);
      setCards(cards.map(c => c.id === card.id ? { ...c, is_starred: isStarred } : c));
      showToast(isStarred ? 'Đã gắn sao thẻ này' : 'Đã bỏ gắn sao', 'success');
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // -------------------------
  // STUDY (FLIP) LOGIC
  // -------------------------
  const handleNext = (e?: React.MouseEvent) => {
    if (e?.currentTarget instanceof HTMLElement) e.currentTarget.blur();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev < cards.length - 1 ? prev + 1 : prev));
    }, 150);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e?.currentTarget instanceof HTMLElement) e.currentTarget.blur();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
    }, 150);
  };

  useEffect(() => {
    if (viewMode !== 'study') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length, viewMode]);


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FAF8F5]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0D2B24]" />
      </div>
    );
  }

  // ============== RENDERERS ==============
  const renderSystemUI = () => (
    <>
      {/* GLOBAL TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 
              toast.type === 'warning' ? 'bg-amber-400 text-amber-950' :
              'bg-[#0D2B24] text-white'
            }`}
          >
            {toast.type === 'error' && <X size={18} />}
            {toast.type === 'success' && <Check size={18} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL CONFIRM DIALOG */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
              <p className="text-gray-500 text-sm mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-white transition-colors shadow-md ${
                    confirmDialog.isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-[#4255FF] hover:bg-[#3546DF] shadow-blue-500/20'
                  }`}
                >
                  {confirmDialog.isDestructive ? 'Xác nhận xóa' : 'Đồng ý'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  const renderDashboard = () => {
    const cardBg = dark ? "#1e1e1e" : "#ffffff";
    const border = dark ? "#2a2a2a" : "rgba(26,46,28,0.22)";
    const shadow = dark
      ? "4px 4px 0px 0px rgba(255,255,255,0.04)"
      : "4px 4px 0px 0px rgba(26,46,28,0.12)";
    const textMain = dark ? "#f0f0f0" : "#1a2e1c";
    const textSub = dark ? "#9ca3af" : "#6b7280";
    const primaryColor = "#10b981";

    return (
    <div className="max-w-5xl mx-auto w-full p-6 animate-in fade-in zoom-in-95 duration-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex flex-col md:flex-row gap-6 mb-10">
        {/* Banner/Actions */}
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
            className="absolute top-4 right-4 p-2 rounded-full transition-colors"
            style={{ color: textSub, background: dark ? "#2a2a2a" : "#f0f0ec" }}
            title="Cài đặt bộ thẻ"
          >
            <Settings size={18} />
          </button>

          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: primaryColor + "22", color: primaryColor }}
          >
            <Layers size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: textMain }}>{deck ? deck.name : 'Bộ thẻ Flashcards'}</h2>
          {deck?.description && <p className="mb-2 max-w-lg" style={{ color: textSub }}>{deck.description}</p>}
          <p className="text-sm mb-8" style={{ color: textSub }}>Tổng cộng {cards.length} thẻ thuật ngữ. Chọn chế độ học bên dưới để bắt đầu luyện tập nâng cao.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
            <button 
              onClick={() => { setViewMode('study'); setCurrentIndex(0); setIsFlipped(false); }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all"
              style={{ background: primaryColor, color: "#fff", border: "none" }}
            >
              <BookOpen size={18} /> Lật thẻ
            </button>
            <button 
              onClick={() => { setViewMode('write'); setCurrentIndex(0); }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all"
              style={{ background: dark ? "#2a2a2a" : "#ffffff", border: `2px solid ${border}`, color: textMain }}
            >
              <PenTool size={18} /> Chép tả
            </button>
            <button 
              onClick={generateQuiz}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all"
              style={{ background: dark ? "#2a2a2a" : "#ffffff", border: `2px solid ${border}`, color: textMain }}
            >
              <Play size={18} /> Trắc nghiệm
            </button>
            <button 
              onClick={() => setViewMode('match')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all"
              style={{ background: dark ? "#2a2a2a" : "#ffffff", border: `2px solid ${border}`, color: textMain }}
            >
              <Puzzle size={18} /> Ghép thẻ
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: textMain }}>
            Danh sách thuật ngữ ({cards.length})
          </h3>
          <p className="text-sm mt-1" style={{ color: textSub }}>Ấn để xem, hoặc nhấn nút sửa/xóa.</p>
        </div>
        <button 
          onClick={() => setIsAddingCard(!isAddingCard)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors"
          style={{ background: primaryColor + "22", color: primaryColor }}
        >
          {isAddingCard ? <X size={18} /> : <Check size={18} className="opacity-0 w-0 hidden" />} 
          {isAddingCard ? 'Hủy' : '+ Thêm thẻ mới'}
        </button>
      </div>
      
      {/* CÀI ĐẶT BỘ THẺ MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Settings size={18} /> Cài đặt Bộ thẻ
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-red-500 p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Tên bộ thẻ</label>
                  <input type="text" value={editDeckName} onChange={e => setEditDeckName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4255FF] focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Mô tả ngắn</label>
                  <textarea value={editDeckDesc} onChange={e => setEditDeckDesc(e.target.value)} rows={2} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4255FF] focus:outline-none resize-none" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-sm">Công khai bộ thẻ</span>
                    <span className="text-xs text-gray-500">Cho phép người khác xem bộ thẻ này</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={editDeckPublic} onChange={e => setEditDeckPublic(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <button onClick={handleDeleteDeck} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors">
                  <Trash2 size={16} /> Xóa bộ thẻ
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50">Hủy</button>
                  <button onClick={handleUpdateDeck} className="px-4 py-2 bg-[#4255FF] text-white rounded-lg font-bold text-sm hover:bg-[#3546DF] shadow-md">Lưu thay đổi</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 pb-20">
        {/* ADD NEW CARD FORM */}
        {isAddingCard && (
          <div className="bg-white rounded-xl shadow-md border-2 border-[#4255FF] overflow-hidden mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-5 flex flex-col gap-4 bg-blue-50/20">
              <h4 className="font-bold text-[#4255FF] flex items-center gap-2">
                <Check size={18} /> Tạo thẻ thuật ngữ mới
              </h4>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Thuật ngữ (Front)</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4255FF] focus:border-transparent outline-none resize-none bg-white shadow-inner" 
                    rows={2}
                    placeholder="Nhập khái niệm, từ vựng, câu hỏi..."
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Định nghĩa (Back)</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4255FF] focus:border-transparent outline-none resize-none bg-white shadow-inner" 
                    rows={2}
                    placeholder="Nhập định nghĩa, câu trả lời, ví dụ..."
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-blue-100 pt-3">
                <button onClick={() => setIsAddingCard(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
                <button onClick={handleCreateCard} className="px-5 py-2 text-sm font-bold bg-[#4255FF] text-white rounded-lg hover:bg-[#3546DF] flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
                  Lưu thẻ mới
                </button>
              </div>
            </div>
          </div>
        )}

        {cards.map((card) => (
            <div 
              className="p-5 rounded-2xl mb-4 border-2 shadow-sm transition-all relative group"
              style={{ background: cardBg, borderColor: border }}
            >{editingCardId === card.id ? (
              <div className="p-5 flex flex-col gap-4 bg-blue-50/50">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Thuật ngữ (Front)</label>
                    <textarea 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4255FF] focus:border-transparent outline-none resize-none bg-white shadow-inner" 
                      rows={2}
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Định nghĩa (Back)</label>
                    <textarea 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4255FF] focus:border-transparent outline-none resize-none bg-white shadow-inner" 
                      rows={2}
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
                  <button onClick={() => setEditingCardId(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
                  <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-semibold bg-[#4255FF] text-white rounded-lg hover:bg-[#3546DF] flex items-center gap-1 transition-colors"><Check size={16}/> Lưu thay đổi</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row min-h-[80px]">
                <div className="md:w-1/3 p-5 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 flex items-center justify-center md:justify-start">
                  <p className="text-gray-900 font-semibold whitespace-pre-wrap">{card.front}</p>
                </div>
                <div className="flex-1 p-5 flex items-center justify-center md:justify-start">
                  <p className="text-gray-600 whitespace-pre-wrap">{card.back}</p>
                </div>
                <div className="flex flex-row md:flex-col items-center justify-center p-3 gap-2 border-t md:border-t-0 md:border-l border-gray-100 bg-white transition-opacity shrink-0">
                  <button onClick={() => handleEditClick(card)} className="p-2 text-gray-500 hover:text-[#4255FF] hover:bg-blue-50 rounded-lg transition-colors" title="Sửa"><Edit2 size={18}/></button>
                  <button onClick={() => handleDelete(card.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa vĩnh viễn"><Trash2 size={18}/></button>
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
    const progressPercent = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
    return (
      <div className="flex-1 flex flex-col items-center p-4 relative overflow-hidden animate-in slide-in-from-right duration-300 w-full">
        {/* Top Progress */}
        <div className="w-full max-w-4xl flex items-center gap-4 mb-8 mt-4">
          <div className="text-sm font-bold text-gray-500 w-12 text-right">{currentIndex + 1} / {cards.length}</div>
          <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#4255FF]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="w-full max-w-4xl flex flex-col items-center">
          <div 
            className="w-full aspect-[16/9] md:aspect-[21/9] max-h-[500px] perspective-1000 relative cursor-pointer group mb-8"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="w-full h-full relative preserve-3d transition-all duration-500 ease-out shadow-[0_0.25rem_1rem_rgba(0,0,0,0.08)] rounded-2xl"
              animate={{ rotateX: isFlipped ? 180 : 0 }}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-2xl p-8 flex flex-col justify-center items-center text-center">
                <h2 className="text-3xl md:text-4xl font-normal text-gray-800 leading-snug">
                  {cards[currentIndex]?.front}
                </h2>
                <div className="absolute top-6 flex w-full justify-between px-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Thuật ngữ (Mặt trước)</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); speakText(cards[currentIndex]?.front); }} className="text-gray-400 hover:text-blue-500"><Volume2 size={20} /></button>
                    <button onClick={(e) => handleToggleStar(cards[currentIndex], e)} className={`hover:text-yellow-500 ${cards[currentIndex]?.is_starred ? 'text-yellow-500' : 'text-gray-400'}`}>
                      <Star size={20} fill={cards[currentIndex]?.is_starred ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-2xl p-8 flex flex-col justify-center items-center text-center rotate-x-180">
                <div className="prose prose-lg md:prose-xl prose-emerald">
                  <p className="text-2xl md:text-3xl font-normal text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {cards[currentIndex]?.back}
                  </p>
                </div>
                <div className="absolute top-6 flex w-full justify-between px-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Định nghĩa (Mặt sau)</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); speakText(cards[currentIndex]?.back); }} className="text-gray-400 hover:text-blue-500"><Volume2 size={20} /></button>
                    <button onClick={(e) => handleToggleStar(cards[currentIndex], e)} className={`hover:text-yellow-500 ${cards[currentIndex]?.is_starred ? 'text-yellow-500' : 'text-gray-400'}`}>
                      <Star size={20} fill={cards[currentIndex]?.is_starred ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center justify-between w-full max-w-sm mt-4">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#4255FF] hover:text-[#4255FF] hover:bg-white shadow-sm bg-white disabled:opacity-30 transition-all hover:-translate-y-1">
              <ChevronLeft size={28} />
            </button>
            <div className="text-lg font-bold text-gray-700">{currentIndex + 1} / {cards.length}</div>
            <button onClick={handleNext} disabled={currentIndex === cards.length - 1} className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#4255FF] hover:text-[#4255FF] hover:bg-white shadow-sm bg-white disabled:opacity-30 transition-all hover:-translate-y-1">
              <ChevronRight size={28} />
            </button>
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
          <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
            <div className="w-24 h-24 bg-blue-50 text-[#4255FF] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold">{percentage}%</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Kết thúc bài kiểm tra!</h2>
            <p className="text-gray-500 mb-8">Bạn đã trả lời đúng <span className="font-bold text-gray-800">{quizScore}</span> trên tổng số <span className="font-bold text-gray-800">{quizQuestions.length}</span> thuật ngữ.</p>
            <div className="flex flex-col gap-3">
              <button onClick={generateQuiz} className="w-full bg-[#4255FF] text-white py-3.5 rounded-xl font-bold hover:bg-[#3546DF] transition-colors shadow-md">
                Làm lại bài Quiz
              </button>
              <button onClick={() => setViewMode('dashboard')} className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                Trở về Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    const currentQ = quizQuestions[currentQuizIndex];
    if (!currentQ) return null;

    const progressPercent = ((currentQuizIndex) / quizQuestions.length) * 100;

    return (
      <div className="flex-1 flex flex-col items-center p-4 max-w-4xl mx-auto w-full animate-in slide-in-from-right duration-300">
        <div className="w-full flex justify-between items-center mb-6 mt-4">
          <span className="text-sm font-bold text-gray-500">Câu hỏi {currentQuizIndex + 1} / {quizQuestions.length}</span>
          <span className="text-sm font-bold text-[#4255FF] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">Điểm: {quizScore}</span>
        </div>
        
        <div className="w-full h-1.5 bg-gray-200 rounded-full mb-8 overflow-hidden">
          <motion.div className="h-full bg-[#4255FF]" animate={{ width: `${progressPercent}%` }} />
        </div>

        <div className="bg-white w-full p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 mb-8 text-center min-h-[200px] flex items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 leading-relaxed whitespace-pre-wrap">
            {currentQ.question}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {currentQ.options.map((opt: string, i: number) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === currentQ.correctAnswer;
            
            let btnClass = "p-5 md:p-6 text-left rounded-xl border-2 transition-all duration-200 font-medium text-gray-700 text-base md:text-lg ";
            
            if (!selectedAnswer) {
              btnClass += "border-gray-200 bg-white hover:border-[#4255FF] hover:shadow-md hover:-translate-y-1 cursor-pointer";
            } else {
              if (isCorrect) {
                btnClass += "border-green-500 bg-green-50 text-green-800 shadow-inner";
              } else if (isSelected && !isCorrect) {
                btnClass += "border-red-500 bg-red-50 text-red-800 shadow-inner";
              } else {
                btnClass += "border-gray-200 bg-gray-50 opacity-50";
              }
              btnClass += " cursor-default";
            }

            return (
              <button 
                key={i}
                onClick={() => handleQuizAnswer(opt)}
                disabled={!!selectedAnswer}
                className={btnClass}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col font-sans">
      {/* App Header */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => viewMode === 'dashboard' ? router.back() : setViewMode('dashboard')} 
            className="text-gray-500 hover:text-[#4255FF] transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-gray-800 text-lg">
            {viewMode === 'dashboard' ? 'Quản lý Bộ thẻ' : viewMode === 'study' ? 'Học Lật Thẻ' : 'Trắc Nghiệm (Quiz)'}
          </h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {cards.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-200 max-w-sm w-full">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-[#4255FF]" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Bộ thẻ rỗng</h2>
              <p className="text-gray-500 mb-6">Chưa có thẻ nào trong bộ này. Hãy tạo từ Ghi chú để bắt đầu học.</p>
              <button onClick={() => router.back()} className="w-full bg-[#4255FF] text-white py-3 rounded-xl font-bold hover:bg-[#3546DF] transition-colors shadow-md hover:-translate-y-0.5">
                Quay lại Workspace
              </button>
            </div>
          </div>
        ) : (
          <>
            {renderSystemUI()}
            {viewMode === 'dashboard' && renderDashboard()}
            {viewMode === 'study' && renderStudyMode()}
            {viewMode === 'quiz' && renderQuizMode()}
            {viewMode === 'match' && <MatchGameMode cards={cards} deckId={deckId} onBack={() => setViewMode('dashboard')} />}
            {viewMode === 'write' && <WriteMode cards={cards} onBack={() => setViewMode('dashboard')} />}
          </>
        )}
      </main>

      {/* Global CSS for 3D Transform */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-x-180 { transform: rotateX(180deg); }
        
        /* Custom scrollbar for textarea */
        textarea::-webkit-scrollbar { width: 6px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}
