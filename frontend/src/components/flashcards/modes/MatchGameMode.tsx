"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Play, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { postMatchLeaderboard, getMatchLeaderboard } from '@/services/flashcard.service';

interface MatchItem {
  id: string; // unique generated ID for the game item
  cardId: number;
  content: string;
  type: 'front' | 'back';
}

export default function MatchGameMode({ 
  cards, 
  deckId, 
  onBack 
}: { 
  cards: any[]; 
  deckId: number; 
  onBack: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [items, setItems] = useState<MatchItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [timeMs, setTimeMs] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [deckId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameFinished) {
      interval = setInterval(() => {
        setTimeMs(prev => prev + 10); // increment every 10ms
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameFinished]);

  const fetchLeaderboard = async () => {
    try {
      const data = await getMatchLeaderboard(deckId);
      setLeaderboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  const startGame = () => {
    if (cards.length < 2) {
      toast.error("Cần ít nhất 2 thẻ để chơi ghép thẻ!");
      return;
    }
    
    // Pick up to 5 random cards
    const shuffledCards = [...cards].sort(() => 0.5 - Math.random()).slice(0, 5);
    
    const gameItems: MatchItem[] = [];
    shuffledCards.forEach(card => {
      gameItems.push({ id: `front-${card.id}`, cardId: card.id, content: card.front, type: 'front' });
      gameItems.push({ id: `back-${card.id}`, cardId: card.id, content: card.back, type: 'back' });
    });
    
    // Shuffle items
    setItems(gameItems.sort(() => 0.5 - Math.random()));
    setSelectedIds([]);
    setMatchedIds([]);
    setWrongPair([]);
    setTimeMs(0);
    setGameFinished(false);
    setIsPlaying(true);
  };

  const handleSelect = (id: string) => {
    if (matchedIds.includes(id) || selectedIds.includes(id) || selectedIds.length >= 2 || wrongPair.length > 0) return;
    
    const newSelected = [...selectedIds, id];
    setSelectedIds(newSelected);
    
    if (newSelected.length === 2) {
      const item1 = items.find(i => i.id === newSelected[0]);
      const item2 = items.find(i => i.id === newSelected[1]);
      
      if (item1 && item2 && item1.cardId === item2.cardId && item1.type !== item2.type) {
        // Match
        setTimeout(() => {
          setMatchedIds(prev => {
            const next = [...prev, ...newSelected];
            if (next.length === items.length) {
              handleWin();
            }
            return next;
          });
          setSelectedIds([]);
        }, 300);
      } else {
        // Wrong
        setWrongPair(newSelected);
        setTimeout(() => {
          setWrongPair([]);
          setSelectedIds([]);
        }, 800); // Wait for shake animation
      }
    }
  };

  const handleWin = async () => {
    setGameFinished(true);
    try {
      await postMatchLeaderboard(deckId, timeMs);
      fetchLeaderboard(); // refresh leaderboard
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    return totalSeconds.toFixed(1) + "s";
  };

  if (!isPlaying) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="bg-white p-8 rounded-3xl shadow-md max-w-lg w-full border border-gray-100 text-center">
          <div className="w-20 h-20 bg-blue-50 text-[#4255FF] rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Trò Chơi Ghép Thẻ</h2>
          <p className="text-gray-500 mb-8">Nối từng thuật ngữ với định nghĩa tương ứng nhanh nhất có thể. Không sai lỗi nào để đạt kỷ lục cao nhất!</p>
          
          <button onClick={startGame} className="w-full bg-[#4255FF] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#3546DF] hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-8">
            <Play size={24} /> Bắt đầu ngay
          </button>

          {leaderboard.length > 0 && (
            <div className="text-left bg-gray-50 p-5 rounded-2xl">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" /> Bảng xếp hạng Kỷ lục
              </h3>
              <div className="flex flex-col gap-3">
                {leaderboard.map((lb, idx) => (
                  <div key={lb.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : idx === 1 ? 'bg-gray-200 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                        {idx + 1}
                      </div>
                      <div className="font-semibold text-gray-800">{lb.name}</div>
                    </div>
                    <div className="font-mono font-bold text-[#4255FF]">{formatTime(lb.time_ms)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => { setIsPlaying(false); onBack(); }} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Thoát</button>
        <div className="flex items-center gap-2 text-2xl font-mono font-bold text-gray-800">
          <Clock className="text-[#4255FF]" /> {formatTime(timeMs)}
        </div>
        <button onClick={startGame} className="px-4 py-2 bg-blue-50 text-[#4255FF] font-bold rounded-lg hover:bg-blue-100 flex items-center gap-2">
          <RotateCcw size={18} /> Chơi lại
        </button>
      </div>

      {gameFinished ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full text-center">
          <Trophy size={60} className="text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Chúc mừng!</h2>
          <p className="text-gray-500 mb-6">Bạn đã hoàn thành trong thời gian</p>
          <div className="text-5xl font-mono font-bold text-[#10b981] mb-8">{formatTime(timeMs)}</div>
          <button onClick={startGame} className="w-full bg-[#10b981] text-white py-3.5 rounded-xl font-bold hover:bg-[#0ea580] transition-colors shadow-md mb-3">
            Thử thách lại
          </button>
          <button onClick={() => setIsPlaying(false)} className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">
            Xem Bảng xếp hạng
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
          <AnimatePresence>
            {items.map((item) => {
              if (matchedIds.includes(item.id)) return null;

              const isSelected = selectedIds.includes(item.id);
              const isWrong = wrongPair.includes(item.id);

              return (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: isWrong ? [-5, 5, -5, 5, 0] : 0 // Shake animation
                  }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleSelect(item.id)}
                  className={`
                    p-6 min-h-[120px] rounded-2xl flex items-center justify-center text-center transition-colors cursor-pointer select-none
                    ${isWrong ? 'bg-red-50 border-2 border-red-500 text-red-600' : 
                      isSelected ? 'bg-green-50 border-2 border-[#10b981] text-[#10b981] shadow-inner' : 
                      'bg-white border-2 border-gray-100 text-gray-700 hover:border-[#10b981] hover:shadow-md'}
                  `}
                >
                  <span className="font-semibold text-lg line-clamp-4">{item.content}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
