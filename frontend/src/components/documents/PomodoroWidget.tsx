"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Settings } from 'lucide-react';

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
      // Timer finished
      if (!isBreak) {
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 min break
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60); // 25 min work
      }
      setIsActive(false);
      // Optional: play sound here
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

  const progressPercent = isBreak 
    ? ((5 * 60 - timeLeft) / (5 * 60)) * 100 
    : ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          {isBreak ? <Coffee size={16} /> : <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span className="text-xs font-semibold uppercase tracking-wider">{isBreak ? 'Nghỉ ngơi' : 'Tập trung'}</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Settings size={14} />
        </button>
      </div>

      <div className="flex items-center justify-center py-2 relative">
        {/* Progress Circle background */}
        <svg className="w-32 h-32 transform -rotate-90">
          <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
          <motion.circle 
            cx="64" cy="64" r="60" 
            stroke={isBreak ? "#10B981" : "#1a3a2a"} 
            strokeWidth="6" 
            fill="transparent" 
            strokeDasharray={377}
            strokeDashoffset={377 - (377 * progressPercent) / 100}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute font-mono text-3xl font-bold text-gray-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        <button 
          onClick={toggleTimer}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-colors ${
            isBreak ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#1a3a2a] hover:bg-[#234b37]'
          }`}
        >
          {isActive ? <><Pause size={16} /> Tạm dừng</> : <><Play size={16} /> Bắt đầu</>}
        </button>
        <button 
          onClick={resetTimer}
          className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
