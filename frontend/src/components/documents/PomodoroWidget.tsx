"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Coffee, BrainCircuit, 
  CheckCircle2, Settings, Sliders, X, Check, BellRing 
} from 'lucide-react';
import { pingActiveStudyTime, createStudySession } from '@/services/study.service';
import toast from 'react-hot-toast';

import { usePomodoroTimer, PomodoroTimerReturn, PomodoroConfig, DEFAULT_POMODORO_CONFIG } from '@/hooks/usePomodoroTimer';

export type { PomodoroConfig };
export const DEFAULT_CONFIG = DEFAULT_POMODORO_CONFIG;

interface PomodoroWidgetProps {
  documentId?: number;
  pomodoro?: PomodoroTimerReturn;
}

export default function PomodoroWidget({ documentId, pomodoro: externalPomodoro }: PomodoroWidgetProps) {
  const internalPomodoro = usePomodoroTimer(documentId, Boolean(externalPomodoro));
  const p = externalPomodoro || internalPomodoro;

  const {
    config,
    tempConfig,
    setTempConfig,
    showSettings,
    setShowSettings,
    mode,
    timeLeft,
    isActive,
    completedSessions,
    toggleTimer,
    resetTimer,
    handleSelectPreset,
    handleApplySettings,
    formatTime,
    progressPercent
  } = p;

  return (
    <div className="relative w-full flex flex-col gap-2">
      {/* Main Bar */}
      <div className="relative overflow-hidden w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-zinc-900 shadow-xs">
        {/* Animated Background Progress */}
        <motion.div
          className={`absolute inset-y-0 left-0 z-0 opacity-15 rounded-l-2xl ${
            mode === 'FOCUS' ? 'bg-[#0D2B24] dark:bg-emerald-500' : 'bg-emerald-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />

        <div className="flex items-center justify-between z-10 relative p-3 gap-2">
          {/* Mode Icon & Timer Display */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-xl shadow-xs transition-colors ${
                mode === 'FOCUS'
                  ? 'bg-[#0D2B24] text-white dark:bg-emerald-600'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {mode === 'FOCUS' ? <BrainCircuit size={17} /> : <Coffee size={17} />}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {mode === 'FOCUS' ? 'Tập trung' : mode === 'SHORT_BREAK' ? 'Nghỉ ngắn' : 'Nghỉ dài'}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                )}
                <span className="text-[10px] text-gray-400 font-medium ml-1">
                  ({config.preset === 'custom' ? 'Tùy chỉnh' : config.preset})
                </span>
              </div>
              <span
                className="font-mono text-[18px] font-black text-gray-900 dark:text-gray-100 leading-none mt-0.5 tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTimer}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${
                mode === 'FOCUS'
                  ? 'bg-[#0D2B24] dark:bg-emerald-600 text-white hover:bg-[#154238]'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
              title={isActive ? 'Tạm dừng' : 'Bắt đầu'}
            >
              {isActive ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors shadow-xs active:scale-95"
              title="Đặt lại phiên"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => {
                setTempConfig(config);
                setShowSettings(true);
              }}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors shadow-xs active:scale-95"
              title="Tùy chỉnh Pomodoro"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Completed counter indicator */}
      {completedSessions > 0 && (
        <div className="flex items-center gap-1.5 px-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>Đã hoàn thành {completedSessions} phiên hôm nay ({completedSessions % config.cyclesBeforeLongBreak}/{config.cyclesBeforeLongBreak} chu kỳ)</span>
        </div>
      )}

      {/* Customization Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 text-gray-800 dark:text-gray-100"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-[#0D2B24] dark:text-emerald-400" />
                  <h3 className="font-bold text-base">Cài đặt Pomodoro</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Presets */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cấu hình mẫu</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('25/5')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      tempConfig.preset === '25/5'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    25 / 5 phút
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('50/10')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      tempConfig.preset === '50/10'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    50 / 10 phút
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempConfig(prev => ({ ...prev, preset: 'custom' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      tempConfig.preset === 'custom'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Tùy chỉnh
                  </button>
                </div>
              </div>

              {/* Sliders & Numeric Inputs */}
              <div className="flex flex-col gap-4 text-xs">
                {/* Focus Minutes (1 - 180) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Thời gian tập trung:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{tempConfig.focusMinutes} phút</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="180"
                    value={tempConfig.focusMinutes}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, focusMinutes: Number(e.target.value), preset: 'custom' }))}
                    className="accent-emerald-600 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1 phút</span>
                    <span>180 phút</span>
                  </div>
                </div>

                {/* Short Break (1 - 30) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Nghỉ ngắn:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{tempConfig.shortBreakMinutes} phút</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={tempConfig.shortBreakMinutes}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, shortBreakMinutes: Number(e.target.value), preset: 'custom' }))}
                    className="accent-emerald-600 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1 phút</span>
                    <span>30 phút</span>
                  </div>
                </div>

                {/* Long Break (1 - 60) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Nghỉ dài:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{tempConfig.longBreakMinutes} phút</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={tempConfig.longBreakMinutes}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, longBreakMinutes: Number(e.target.value), preset: 'custom' }))}
                    className="accent-emerald-600 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1 phút</span>
                    <span>60 phút</span>
                  </div>
                </div>

                {/* Sessions before long break (1 - 10) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Số phiên trước khi nghỉ dài:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{tempConfig.cyclesBeforeLongBreak} phiên</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={tempConfig.cyclesBeforeLongBreak}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, cyclesBeforeLongBreak: Number(e.target.value), preset: 'custom' }))}
                    className="accent-emerald-600 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1 phiên</span>
                    <span>10 phiên</span>
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] p-2.5 rounded-xl flex items-center gap-2">
                  <BellRing size={14} className="shrink-0" />
                  <span>Phiên hiện tại đang chạy. Thay đổi sẽ được áp dụng cho phiên kế tiếp hoặc khi bạn bấm nút Đặt lại.</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleApplySettings}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0D2B24] dark:bg-emerald-600 text-white hover:opacity-90 shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Lưu & Áp dụng</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
