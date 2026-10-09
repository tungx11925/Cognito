"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, BookOpen, Flame, Star, ChevronLeft, Sparkles } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import AudioButton from '@/components/flashcards/AudioButton';

interface LearnCard {
  id: number;
  front: string;
  back: string;
  box_level: number;
}

const LETTER_LABELS = ['A', 'B', 'C', 'D'];

export default function LearnMode({ 
  cards, 
  deckId,
  onBack 
}: { 
  cards: any[]; 
  deckId: number;
  onBack: () => void;
}) {
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [stats, setStats] = useState({ remaining: cards.length, familiar: 0, mastered: 0 });
  const [roundCards, setRoundCards] = useState<LearnCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<'multipleChoice' | 'written'>('multipleChoice');
  const [options, setOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { speak, isPlaying } = useTextToSpeech();

  const handleStartLearn = () => {
    const initialCards = cards.map(c => ({ ...c, box_level: 0 }));
    setRoundCards(initialCards.slice(0, 5));
    setStats({ remaining: cards.length, familiar: 0, mastered: 0 });
    setIsConfiguring(false);
  };

  const currentCard = roundCards[currentCardIndex];

  // Truncate long answers so users can't spot the topic instantly
  const truncateAnswer = (text: string, maxLen = 60) => {
    const firstLine = text.split('\n')[0];
    return firstLine.length > maxLen ? firstLine.slice(0, maxLen).trimEnd() + '…' : firstLine;
  };

  useEffect(() => {
    if (currentCard && currentMode === 'multipleChoice' && !isEvaluating) {
      const correctLen = currentCard.back.length;
      const pool = cards.filter(c => c.id !== currentCard.id);

      // Sort by answer length closest to the correct answer → harder to guess by length alone
      const sorted = [...pool].sort((a, b) =>
        Math.abs(a.back.length - correctLen) - Math.abs(b.back.length - correctLen)
      );

      // Take top 6 closest, then pick 3 randomly from them for variety
      const candidates = sorted.slice(0, Math.min(6, sorted.length));
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      const wrong = shuffled.slice(0, 3).map(c => c.back);

      setOptions([...wrong, currentCard.back].sort(() => 0.5 - Math.random()));
    }
  }, [currentCard, currentMode, cards, isEvaluating]);

  const handleAnswer = (userAnswer: string) => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
    setIsCorrect(norm(userAnswer) === norm(currentCard.back));
  };

  const handleNext = useCallback(() => {
    if (isCorrect) {
      const lvl = currentCard.box_level + 1;
      setStats(prev => ({
        remaining: prev.remaining - (currentCard.box_level === 0 ? 1 : 0),
        familiar: prev.familiar + (lvl === 1 ? 1 : 0) - (currentCard.box_level === 1 ? 1 : 0),
        mastered: prev.mastered + (lvl === 2 ? 1 : 0),
      }));
    } else if (currentCard.box_level > 0) {
      setStats(prev => ({
        remaining: prev.remaining + 1,
        familiar: prev.familiar - (currentCard.box_level === 1 ? 1 : 0),
        mastered: prev.mastered - (currentCard.box_level === 2 ? 1 : 0),
      }));
    }
    const next = currentCardIndex < roundCards.length - 1 ? currentCardIndex + 1 : 0;
    setCurrentCardIndex(next);
    setCurrentMode(roundCards[next]?.box_level >= 1 ? 'written' : 'multipleChoice');
    setIsEvaluating(false);
    setIsCorrect(null);
    setInputValue('');
  }, [isCorrect, currentCard, currentCardIndex, roundCards]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (isConfiguring) return;
      if (isEvaluating && e.key === 'Enter') { handleNext(); return; }
      if (!isEvaluating && currentMode === 'multipleChoice') {
        const n = parseInt(e.key);
        if (n >= 1 && n <= 4 && options[n - 1]) handleAnswer(options[n - 1]);
      }
      if (!isEvaluating && currentMode === 'written' && e.key === 'Enter') handleAnswer(inputValue);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isConfiguring, isEvaluating, currentMode, options, inputValue, handleNext]);

  // ── START SCREEN ────────────────────────────────────────────────────────
  if (isConfiguring) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full"
        >
          {/* Icon */}
          <div className="mb-6 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <BookOpen size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Học Cuốn Chiếu</h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Trắc nghiệm → Điền từ. Hệ thống lặp lại thông minh giúp bạn nhớ lâu hơn.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleStartLearn}
              className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              Bắt đầu học ngay
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-2xl font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <ChevronLeft size={16} /> Quay lại
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── ACTIVE SESSION ───────────────────────────────────────────────────────
  const total = cards.length;
  const pct = Math.round(((stats.familiar * 0.5 + stats.mastered) / total) * 100);
  const cardNum = currentCardIndex + 1;
  const cardTotal = roundCards.length;

  return (
    <div
      className="w-full flex gap-6 px-2 pb-10"
      style={{ minHeight: 'calc(100vh - 180px)' }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <div
        className="hidden lg:flex flex-col w-56 shrink-0 rounded-2xl overflow-hidden"
        style={{ background: '#0f1c29', alignSelf: 'flex-start', position: 'sticky', top: 24 }}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-white font-bold text-xs tracking-widest uppercase">Tiến độ</span>
          <button
            onClick={onBack}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-lg px-2 py-1 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <X size={12} /> Thoát
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-white/40">Hoàn thành</span>
            <span className="text-emerald-400 font-bold">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-white/50 text-xs font-medium">Chưa học</span>
            <span className="text-white font-bold text-sm">{stats.remaining}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-4 py-3">
            <span className="text-amber-300 text-xs font-medium flex items-center gap-1"><Flame size={12} />Đang quen</span>
            <span className="text-amber-300 font-bold text-sm">{stats.familiar}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3">
            <span className="text-emerald-300 text-xs font-medium flex items-center gap-1"><Star size={12} />Đã thuộc</span>
            <span className="text-emerald-300 font-bold text-sm">{stats.mastered}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="flex-1 flex flex-col items-center">
        {/* Mobile exit */}
        <div className="lg:hidden w-full flex justify-between items-center mb-4">
          <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 font-semibold text-sm">
            <ChevronLeft size={18} /> Thoát
          </button>
          <span className="text-gray-400 text-sm font-medium">{cardNum} / {cardTotal}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard?.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-2xl"
          >
            {/* Question block */}
            <div
              className="rounded-3xl p-8 mb-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f1c29 0%, #1a3045 100%)' }}
            >
              {/* Decorative blob */}
              <div
                className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
                style={{ background: '#10b981' }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                    {currentMode === 'multipleChoice' ? 'Chọn đáp án đúng' : 'Điền vào chỗ trống'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-xs font-medium">{cardNum}/{cardTotal}</span>
                    <AudioButton isPlaying={isPlaying} onClick={() => speak(currentCard?.front)} />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-snug text-center min-h-[80px] flex items-center justify-center">
                  {currentCard?.front}
                </h2>
              </div>
            </div>

            {/* Answers block */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              {currentMode === 'multipleChoice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt, i) => {
                    const isSelected = inputValue === opt && isEvaluating;
                    let style = {
                      border: '2px solid #e5e7eb',
                      background: '#f9fafb',
                      color: '#374151',
                    } as React.CSSProperties;

                    if (isEvaluating) {
                      if (opt === currentCard.back) style = { border: '2px solid #10b981', background: '#ecfdf5', color: '#065f46' };
                      else if (isSelected && !isCorrect) style = { border: '2px solid #ef4444', background: '#fef2f2', color: '#991b1b' };
                      else style = { border: '2px solid #f3f4f6', background: '#f9fafb', color: '#9ca3af', opacity: 0.5 };
                    }

                    return (
                      <button
                        key={i}
                        disabled={isEvaluating}
                        onClick={() => { setInputValue(opt); handleAnswer(opt); }}
                        className="group relative p-4 rounded-2xl text-left transition-all duration-150 hover:scale-[1.01]"
                        style={style}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                            style={{
                              background: isEvaluating && opt === currentCard.back ? '#10b981' : '#e5e7eb',
                              color: isEvaluating && opt === currentCard.back ? 'white' : '#6b7280',
                            }}
                          >
                            {LETTER_LABELS[i]}
                          </span>
                          <span className="text-sm font-medium leading-snug pt-0.5">{truncateAnswer(opt)}</span>
                        </div>
                        {isEvaluating && opt === currentCard.back && (
                          <Check size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentMode === 'written' && (
                <div className="space-y-3">
                  <input
                    autoFocus
                    disabled={isEvaluating}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAnswer(inputValue); }}
                    placeholder="Nhập đáp án của bạn..."
                    className="w-full px-5 py-4 rounded-2xl border-2 outline-none text-base font-medium transition-colors"
                    style={{
                      borderColor: isEvaluating ? (isCorrect ? '#10b981' : '#ef4444') : '#e5e7eb',
                      background: isEvaluating ? (isCorrect ? '#ecfdf5' : '#fef2f2') : '#f9fafb',
                      color: isEvaluating ? (isCorrect ? '#065f46' : '#991b1b') : '#1f2937',
                    }}
                  />
                  {!isEvaluating && (
                    <p className="text-xs text-gray-400 font-medium pl-1">Nhấn Enter để kiểm tra</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── FEEDBACK BAR ── */}
        <AnimatePresence>
          {isEvaluating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-2xl mt-4 rounded-2xl p-5 flex items-center justify-between gap-4"
              style={{
                background: isCorrect ? '#ecfdf5' : '#fef2f2',
                border: `2px solid ${isCorrect ? '#6ee7b7' : '#fca5a5'}`,
              }}
            >
              <div>
                <p className={`font-black text-lg ${isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
                  {isCorrect ? '🎉 Chính xác!' : '❌ Chưa đúng'}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-red-600 mt-0.5">
                    Đáp án: <strong>{currentCard?.back}</strong>
                  </p>
                )}
              </div>
              <button
                autoFocus
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
                style={{ background: isCorrect ? '#10b981' : '#ef4444' }}
              >
                Tiếp <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
