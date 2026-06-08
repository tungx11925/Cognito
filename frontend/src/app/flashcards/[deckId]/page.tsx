"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllFlashcards } from '@/services/flashcard.service';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, Maximize, RefreshCw, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FlashcardStudyPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = Number(params.deckId);

  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [deckId]);

  const fetchCards = async () => {
    try {
      // Use getAllFlashcards instead of getDueFlashcards to show all cards like Quizlet
      const allCards = await getAllFlashcards(deckId);
      setCards(allCards || []);
    } catch (error) {
      console.error('Lỗi tải flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev < cards.length - 1 ? prev + 1 : prev));
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
    }, 150);
  };

  // Keyboard navigation
  useEffect(() => {
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
  }, [currentIndex, cards.length]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FAF8F5]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0D2B24]" />
      </div>
    );
  }

  const progressPercent = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-[#4255FF] transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-gray-800 text-lg">Bộ thẻ Flashcards</h1>
        </div>
        
        {/* Progress Bar inside Header */}
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
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

        <div className="flex items-center gap-2">
          <button className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#4255FF] px-4 py-2 rounded-lg hover:bg-[#F6F7FB] transition-colors">
            <RefreshCw size={16} /> Tự động phát
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {cards.length === 0 ? (
          <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-200 max-w-sm w-full">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Bộ thẻ rỗng</h2>
            <p className="text-gray-500 mb-6">Chưa có thẻ nào trong bộ này. Hãy thêm thẻ mới để bắt đầu học.</p>
            <button 
              onClick={() => router.back()}
              className="w-full bg-[#4255FF] text-white py-3 rounded-xl font-bold hover:bg-[#3546DF] transition-colors"
            >
              Quay lại
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl flex flex-col items-center">
            {/* Flip Card Container */}
            <div 
              className="w-full aspect-[16/9] md:aspect-[21/9] max-h-[500px] perspective-1000 relative cursor-pointer group mb-8"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-500 ease-out shadow-[0_0.25rem_1rem_rgba(0,0,0,0.08)] rounded-2xl"
                animate={{ rotateX: isFlipped ? 180 : 0 }}
              >
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-2xl p-8 flex flex-col justify-center items-center text-center">
                  <h2 className="text-3xl md:text-4xl font-normal text-gray-800 leading-snug">
                    {cards[currentIndex]?.front}
                  </h2>
                  <div className="absolute top-6 flex w-full justify-between px-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-gray-400 text-sm font-semibold">Thuật ngữ</span>
                    <button className="text-gray-400 hover:text-[#4255FF]"><Maximize size={18} /></button>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-2xl p-8 flex flex-col justify-center items-center text-center rotate-x-180">
                  <div className="prose prose-lg md:prose-xl prose-emerald">
                    <p className="text-2xl md:text-3xl font-normal text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {cards[currentIndex]?.back}
                    </p>
                  </div>
                  <div className="absolute top-6 flex w-full justify-between px-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-gray-400 text-sm font-semibold">Định nghĩa</span>
                    <button className="text-gray-400 hover:text-[#4255FF]"><Maximize size={18} /></button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Navigation Controls (Quizlet style) */}
            <div className="flex items-center justify-between w-full max-w-sm">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#4255FF] hover:text-[#4255FF] hover:bg-white transition-all disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 disabled:hover:bg-transparent shadow-sm bg-white"
              >
                <ChevronLeft size={28} />
              </button>

              <div className="text-lg font-bold text-gray-700">
                {currentIndex + 1} / {cards.length}
              </div>

              <button 
                onClick={handleNext}
                disabled={currentIndex === cards.length - 1}
                className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#4255FF] hover:text-[#4255FF] hover:bg-white transition-all disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 disabled:hover:bg-transparent shadow-sm bg-white"
              >
                <ChevronRight size={28} />
              </button>
            </div>
            
            {/* Keyboard hint */}
            <div className="mt-8 text-gray-400 text-sm font-medium flex items-center gap-4">
              <span>Sử dụng các phím mũi tên ← → để chuyển thẻ</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              <span>Phím Space để lật thẻ</span>
            </div>
          </div>
        )}
      </main>

      {/* Global CSS for 3D Transform */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-x-180 { transform: rotateX(180deg); }
      `}} />
    </div>
  );
}
