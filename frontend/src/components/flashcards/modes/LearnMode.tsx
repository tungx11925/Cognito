"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, X, Check, ArrowRight, Volume2 } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import AudioButton from '@/components/flashcards/AudioButton';

// Mock types for the logic
interface LearnCard {
  id: number;
  front: string;
  back: string;
  box_level: number; // 0: Mới, 1: Familiar (đúng trắc nghiệm), 2: Mastered (đúng viết)
}

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
  
  // Progress Hub Stats
  const [stats, setStats] = useState({
    remaining: cards.length,
    familiar: 0,
    mastered: 0,
  });

  // Current Round State
  const [roundCards, setRoundCards] = useState<LearnCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<'multipleChoice' | 'written'>('multipleChoice');
  
  // Interactions
  const [options, setOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const { speak, isPlaying } = useTextToSpeech();

  // Initialize Learn Session
  const handleStartLearn = () => {
    // Trong thực tế, gọi API /api/decks/:id/learn/initialize để lấy tiến độ
    const initialCards = cards.map(c => ({ ...c, box_level: 0 }));
    setRoundCards(initialCards.slice(0, 5)); // Lấy 5 thẻ làm 1 vòng
    setStats({ remaining: cards.length, familiar: 0, mastered: 0 });
    setIsConfiguring(false);
  };

  const currentCard = roundCards[currentCardIndex];

  // Auto-play đã được tắt theo yêu cầu. Người dùng sẽ tự bấm nút Loa nếu muốn nghe.

  // Generate Options for Multiple Choice
  useEffect(() => {
    if (currentCard && currentMode === 'multipleChoice' && !isEvaluating) {
      const distractorPool = cards.filter(c => c.id !== currentCard.id);
      const wrongAnswers = [...distractorPool].sort(() => 0.5 - Math.random()).slice(0, 3).map(c => c.back);
      const shuffledOptions = [...wrongAnswers, currentCard.back].sort(() => 0.5 - Math.random());
      setOptions(shuffledOptions);
    }
  }, [currentCard, currentMode, cards, isEvaluating]);

  // Handle Answer
  const handleAnswer = (userAnswer: string) => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    
    // Normalize string: lower case, remove extra spaces
    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');
    const correct = normalize(userAnswer) === normalize(currentCard.back);
    
    setIsCorrect(correct);
    
    // Trong thực tế, gọi API /api/decks/:id/learn/submit-answer tại đây
  };

  const handleNext = useCallback(() => {
    if (isCorrect) {
      // Nâng cấp thẻ
      const newBoxLevel = currentCard.box_level + 1;
      
      setStats(prev => {
        const isMasteredNow = newBoxLevel === 2;
        const wasFamiliar = currentCard.box_level === 1;
        
        return {
          remaining: prev.remaining - (currentCard.box_level === 0 ? 1 : 0),
          familiar: prev.familiar + (newBoxLevel === 1 ? 1 : 0) - (wasFamiliar ? 1 : 0),
          mastered: prev.mastered + (isMasteredNow ? 1 : 0)
        };
      });

      // TODO: Loại bỏ thẻ Mastered khỏi vòng, nạp thẻ mới vào nếu vòng quá ít thẻ
    } else {
      // Hạ cấp thẻ về 0
      if (currentCard.box_level > 0) {
        setStats(prev => ({
          remaining: prev.remaining + 1,
          familiar: prev.familiar - (currentCard.box_level === 1 ? 1 : 0),
          mastered: prev.mastered - (currentCard.box_level === 2 ? 1 : 0) // Should not happen in learn mode logic usually
        }));
      }
    }

    // Chuyển sang thẻ tiếp theo trong mảng roundCards
    if (currentCardIndex < roundCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setCurrentMode(roundCards[currentCardIndex + 1].box_level >= 1 ? 'written' : 'multipleChoice');
    } else {
      // Hết vòng -> Tạo vòng mới từ các thẻ chưa mastered
      // Tạm thời mock reset vòng cũ cho demo
      setCurrentCardIndex(0);
      setCurrentMode(roundCards[0].box_level >= 1 ? 'written' : 'multipleChoice');
    }

    setIsEvaluating(false);
    setIsCorrect(null);
    setInputValue('');
  }, [isCorrect, currentCard, currentCardIndex, roundCards]);

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isConfiguring) return;
      
      if (isEvaluating && e.key === 'Enter') {
        handleNext();
        return;
      }

      if (!isEvaluating && currentMode === 'multipleChoice') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4 && options[num - 1]) {
          handleAnswer(options[num - 1]);
        }
      }
      
      if (!isEvaluating && currentMode === 'written' && e.key === 'Enter') {
        handleAnswer(inputValue);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfiguring, isEvaluating, currentMode, options, inputValue, handleNext]);


  if (!isConfiguring) {
    const totalCards = cards.length;
    const progressPercent = ((stats.familiar * 0.5 + stats.mastered) / totalCards) * 100;

    return (
      <div className="fixed inset-0 z-50 bg-[#fafafa] flex flex-col md:flex-row overflow-hidden">
        
        {/* === PROGRESS HUB (SIDEBAR TRÁI) === */}
        <div className="w-full md:w-64 lg:w-80 bg-white border-b md:border-r border-gray-200 p-6 flex flex-col shrink-0">
          <div className="flex justify-between items-center mb-8">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-800 transition-colors">
              <X size={24} />
            </button>
            <span className="font-bold text-gray-800 text-lg">Chế độ Học</span>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-400">Tiến độ</span>
                <span className="text-[#10b981]">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-[#10b981] h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-500">Chưa học</span>
                <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">{stats.remaining}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-orange-500">Đang quen</span>
                <span className="font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-lg">{stats.familiar}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-500">Đã thuộc</span>
                <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg">{stats.mastered}</span>
              </div>
            </div>
          </div>
        </div>

        {/* === MAIN FOCUS AREA (BÊN PHẢI) === */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard?.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-3xl bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[400px]"
            >
              {/* Card Header */}
              <div className="p-8 pb-4 flex justify-between items-start">
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  {currentMode === 'multipleChoice' ? 'Chọn đáp án đúng' : 'Gõ lại chính xác cụm từ'}
                </div>
                <AudioButton isPlaying={isPlaying} onClick={() => speak(currentCard?.front)} />
              </div>

              {/* Card Content (Term) */}
              <div className="px-8 py-6 text-center flex-1 flex items-center justify-center">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                  {currentCard?.front}
                </h2>
              </div>

              {/* Interactions */}
              <div className="p-8 bg-gray-50/50 border-t border-gray-50">
                {currentMode === 'multipleChoice' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {options.map((opt, idx) => {
                      let btnClass = "border-gray-200 hover:border-[#10b981] hover:bg-green-50/30 bg-white text-gray-700";
                      
                      if (isEvaluating) {
                        if (opt === currentCard.back) {
                          btnClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-[0_0_0_2px_#10b981]";
                        } else if (!isCorrect && opt === inputValue) {
                          btnClass = "border-red-500 bg-red-50 text-red-800 font-bold";
                        } else {
                          btnClass = "border-gray-100 opacity-50";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isEvaluating}
                          onClick={() => {
                            setInputValue(opt);
                            handleAnswer(opt);
                          }}
                          className={`p-6 rounded-2xl border-2 text-left transition-all relative ${btnClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                            <span className="text-lg font-medium">{opt}</span>
                          </div>
                          {isEvaluating && opt === currentCard.back && <Check className="absolute right-6 top-1/2 -translate-y-1/2 text-green-600" size={24} />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentMode === 'written' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      autoFocus
                      disabled={isEvaluating}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Gõ đáp án vào đây..."
                      className={`w-full p-6 rounded-2xl border-2 outline-none text-xl transition-colors font-medium shadow-sm ${
                        isEvaluating 
                          ? isCorrect ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900'
                          : 'border-gray-200 focus:border-[#10b981] text-gray-800'
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAnswer(inputValue);
                      }}
                    />
                    {!isEvaluating && (
                      <div className="flex justify-between items-center text-sm font-bold text-gray-400 px-2">
                        <span>Chưa rõ? Bấm Enter để xem đáp án</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Feedback Panel (Appears on evaluate) */}
          <AnimatePresence>
            {isEvaluating && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`fixed bottom-0 left-0 md:left-64 lg:left-80 right-0 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] ${
                  isCorrect ? 'bg-green-50 border-t border-green-200' : 'bg-red-50 border-t border-red-200'
                }`}
              >
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className={`text-2xl font-black mb-2 flex items-center gap-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? 'Tuyệt vời!' : 'Hãy học lại thuật ngữ này'}
                    </h3>
                    {!isCorrect && (
                      <div>
                        <span className="text-red-800 font-medium">Đáp án đúng là: </span>
                        <span className="text-red-900 font-bold text-xl">{currentCard.back}</span>
                      </div>
                    )}
                  </div>
                  <button
                    autoFocus
                    onClick={handleNext}
                    className={`px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg ${
                      isCorrect ? 'bg-[#10b981] text-white hover:bg-[#059669]' : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    Tiếp tục <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full bg-gray-50/50">
       <button onClick={handleStartLearn} className="px-8 py-4 bg-[#10b981] text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-[#059669] hover:-translate-y-1 transition-all">Bắt đầu Chế độ Học</button>
    </div>
  );
}
