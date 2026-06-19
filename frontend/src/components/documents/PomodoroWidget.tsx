"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Settings, BrainCircuit } from 'lucide-react';

export default function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 min break
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60); // 25 min work
      }
      setIsActive(false);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = isBreak ? 5 * 60 : 25 * 60;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="relative overflow-hidden w-full">
      {/* Background Progress Bar */}
      <div className="absolute inset-0 z-0 bg-gray-50 rounded-xl border border-gray-200/60" />
      <motion.div 
        className={`absolute inset-y-0 left-0 z-0 opacity-10 rounded-l-xl ${isBreak ? 'bg-emerald-500' : 'bg-[#0D2B24]'}`}
        initial={{ width: 0 }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ duration: 1, ease: "linear" }}
      />
      
      <div className="flex items-center justify-between z-10 relative p-3">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isBreak ? 'bg-emerald-100 text-emerald-600' : 'bg-[#0D2B24]/10 text-[#0D2B24]'}`}>
             {isBreak ? <Coffee size={15} /> : <BrainCircuit size={15} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{isBreak ? 'Nghỉ ngơi' : 'Tập trung'}</span>
            <span className="font-mono text-[16px] font-bold text-gray-800 leading-none mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={toggleTimer}
            className={`p-2 rounded-lg flex items-center justify-center transition-colors shadow-sm ${
              isBreak ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-[#0D2B24] text-white hover:bg-[#154238]'
            }`}
          >
            {isActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button 
            onClick={resetTimer}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
