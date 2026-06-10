"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle, XCircle, Volume2 } from 'lucide-react';

export default function SpellMode({ 
  cards, 
  onBack 
}: { 
  cards: any[]; 
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<'typing' | 'correct' | 'wrong' | 'forcing_retype'>('typing');
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const card = cards[currentIndex];

  const playTTS = () => {
    if (!card) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(card.front);
      utterance.lang = 'en-US'; // Adjust if needed
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, status]);

  // Autoplay TTS when a new card appears and status resets to typing
  useEffect(() => {
    if (status === 'typing') {
      playTTS();
    }
  }, [currentIndex, status]);

  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
      .replace(/\s{2,}/g, " ") // Collapse whitespace
      .trim();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (status === 'forcing_retype') {
      // Must type exactly the correct answer to proceed
      if (normalizeString(inputText) === normalizeString(card.back)) {
        goToNext();
      } else {
        // Blink red or show error
        inputRef.current?.animate([
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(0)' }
        ], { duration: 200 });
      }
      return;
    }

    if (status === 'correct' || status === 'wrong') {
      goToNext();
      return;
    }

    const isCorrect = normalizeString(inputText) === normalizeString(card.back);
    
    if (isCorrect) {
      setStatus('correct');
      setStats(s => ({ ...s, correct: s.correct + 1 }));
      setTimeout(() => goToNext(), 1000); // Auto next on correct
    } else {
      setStatus('wrong');
      setStats(s => ({ ...s, wrong: s.wrong + 1 }));
    }
  };

  const goToNext = () => {
    setInputText('');
    setStatus('typing');
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const handleContinueFromWrong = () => {
    // Switch to forcing retype mode
    setStatus('forcing_retype');
    setInputText('');
  };

  if (cards.length === 0) return null;

  if (finished) {
    const accuracy = Math.round((stats.correct / cards.length) * 100);
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-24 h-24 bg-blue-50 text-[#4255FF] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold">{accuracy}%</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hoàn thành Chế độ Chính tả</h2>
          <p className="text-gray-500 mb-8">Bạn nghe và viết đúng <span className="font-bold text-green-600">{stats.correct}</span> trên <span className="font-bold">{cards.length}</span> thẻ.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setFinished(false); setCurrentIndex(0); setStats({correct:0, wrong:0}); setStatus('typing'); setInputText(''); }} className="w-full bg-[#4255FF] text-white py-3.5 rounded-xl font-bold hover:bg-[#3546DF] transition-colors shadow-md">
              Học lại từ đầu
            </button>
            <button onClick={onBack} className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">
              Trở về
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex) / cards.length) * 100;

  return (
    <div className="flex-1 flex flex-col items-center p-4 max-w-4xl mx-auto w-full animate-in slide-in-from-right duration-300">
      <div className="w-full flex justify-between items-center mb-6 mt-4">
        <button onClick={onBack} className="text-gray-500 font-bold hover:text-gray-800">Thoát</button>
        <span className="text-sm font-bold text-gray-500">{currentIndex + 1} / {cards.length}</span>
      </div>
      
      <div className="w-full h-1.5 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <motion.div className="h-full bg-[#10b981]" animate={{ width: `${progressPercent}%` }} />
      </div>

      <div className="bg-white w-full p-8 md:p-16 rounded-3xl shadow-sm border border-gray-200 mb-8 flex flex-col min-h-[300px]">
        <div className="flex-1 flex flex-col items-center justify-center mb-8 gap-4">
          <button 
            onClick={playTTS} 
            className="w-20 h-20 bg-blue-50 text-[#10b981] rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors shadow-inner"
          >
            <Volume2 size={36} />
          </button>
          <p className="text-gray-400 font-medium">Lắng nghe và gõ lại thuật ngữ</p>
        </div>
        
        <div className="mt-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={status === 'correct' || status === 'wrong'}
              placeholder={status === 'forcing_retype' ? "Gõ lại đáp án đúng vào đây..." : "Nhập đáp án bằng Tiếng Việt hoặc English..."}
              className={`w-full p-5 pr-16 text-xl rounded-xl border-2 outline-none transition-all
                ${status === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 
                  status === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' : 
                  status === 'forcing_retype' ? 'border-orange-400 focus:border-orange-500 bg-white' :
                  'border-gray-200 focus:border-[#10b981] bg-gray-50 focus:bg-white'}
              `}
            />
            {status === 'typing' || status === 'forcing_retype' ? (
              <button type="submit" className="absolute right-3 top-3 bottom-3 aspect-square bg-[#10b981] text-white rounded-lg flex items-center justify-center hover:bg-[#059669] transition-colors">
                <ChevronRight size={24} />
              </button>
            ) : status === 'correct' ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"><CheckCircle size={32} /></div>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"><XCircle size={32} /></div>
            )}
          </form>
        </div>
      </div>

      <AnimatePresence>
        {status === 'wrong' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full bg-white p-6 rounded-2xl shadow-lg border-2 border-red-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-red-500 font-bold mb-1">Sai rồi!</p>
              <p className="text-gray-500 text-sm mb-2">Đáp án đúng của thẻ này là:</p>
              <p className="text-2xl font-bold text-gray-900">{card.back}</p>
            </div>
            <button onClick={handleContinueFromWrong} className="bg-gray-900 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-black whitespace-nowrap">
              Nhập lại đáp án đúng
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
