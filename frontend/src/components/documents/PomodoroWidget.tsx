"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { pingActiveStudyTime, createStudySession } from '@/services/study.service';
import toast from 'react-hot-toast';

interface PomodoroWidgetProps {
  documentId?: number;
}

export default function PomodoroWidget({ documentId }: PomodoroWidgetProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Track active study seconds for periodic API pinging
  const activeSecondsRef = useRef(0);

  // Flush accumulated active seconds to backend
  const flushActiveTime = async () => {
    const secsToPing = activeSecondsRef.current;
    if (secsToPing > 0) {
      activeSecondsRef.current = 0;
      try {
        await pingActiveStudyTime(secsToPing);
      } catch (err) {
        console.error("Failed to ping active study time:", err);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);

        // Only count study time during focus (work) mode
        if (!isBreak) {
          activeSecondsRef.current += 1;

          // Send ping every 30 seconds
          if (activeSecondsRef.current >= 30) {
            flushActiveTime();
          }
        }
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        // Work session completed!
        flushActiveTime();
        createStudySession(25 * 60, documentId)
          .then(() => {
            toast.success("Tuyệt vời! Bạn đã hoàn thành 1 phiên Pomodoro 🎉");
          })
          .catch((err) => console.error("Error creating study session:", err));

        setCompletedSessions((prev) => prev + 1);
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 min break
      } else {
        // Break completed
        setIsBreak(false);
        setTimeLeft(25 * 60); // 25 min focus
        toast("Hết giờ nghỉ! Sẵn sàng cho phiên tập trung tiếp theo 💪", { icon: '⏰' });
      }
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak, documentId]);

  // Flush time on unmount
  useEffect(() => {
    return () => {
      if (activeSecondsRef.current > 0) {
        flushActiveTime();
      }
    };
  }, []);

  const toggleTimer = () => {
    if (isActive) {
      // Pausing: flush current seconds
      flushActiveTime();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    if (isActive) {
      flushActiveTime();
    }
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
    <div className="relative overflow-hidden w-full flex flex-col gap-2">
      <div className="relative overflow-hidden w-full rounded-xl">
        {/* Background Progress Bar */}
        <div className="absolute inset-0 z-0 bg-gray-50 rounded-xl border border-gray-200/60" />
        <motion.div
          className={`absolute inset-y-0 left-0 z-0 opacity-10 rounded-l-xl ${
            isBreak ? 'bg-emerald-500' : 'bg-[#0D2B24]'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />

        <div className="flex items-center justify-between z-10 relative p-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                isBreak
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-[#0D2B24]/10 text-[#0D2B24]'
              }`}
            >
              {isBreak ? <Coffee size={15} /> : <BrainCircuit size={15} />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                {isBreak ? 'Nghỉ ngơi' : 'Tập trung'}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block ml-0.5" />
                )}
              </span>
              <span
                className="font-mono text-[16px] font-bold text-gray-800 leading-none mt-0.5"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTimer}
              className={`p-2 rounded-lg flex items-center justify-center transition-colors shadow-sm ${
                isBreak
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-[#0D2B24] text-white hover:bg-[#154238]'
              }`}
              title={isActive ? 'Tạm dừng' : 'Bắt đầu'}
            >
              {isActive ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm"
              title="Đặt lại"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {completedSessions > 0 && (
        <div className="flex items-center gap-1.5 px-1 text-[11px] text-emerald-700 font-semibold">
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>Đã hoàn thành {completedSessions} phiên Pomodoro hôm nay!</span>
        </div>
      )}
    </div>
  );
}

