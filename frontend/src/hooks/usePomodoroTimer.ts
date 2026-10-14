"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { pingActiveStudyTime, createStudySession } from '@/services/study.service';
import toast from 'react-hot-toast';

export interface PomodoroConfig {
  focusMinutes: number;       // 1 - 180
  shortBreakMinutes: number;  // 1 - 30
  longBreakMinutes: number;   // 1 - 60
  cyclesBeforeLongBreak: number; // 1 - 10
  preset: '25/5' | '50/10' | 'custom';
}

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  preset: '25/5'
};

const STORAGE_KEY = 'cognito_pomodoro_settings';

export interface PomodoroTimerReturn {
  config: PomodoroConfig;
  setConfig: React.Dispatch<React.SetStateAction<PomodoroConfig>>;
  tempConfig: PomodoroConfig;
  setTempConfig: React.Dispatch<React.SetStateAction<PomodoroConfig>>;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  mode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  setMode: React.Dispatch<React.SetStateAction<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isActive: boolean;
  cycleCount: number;
  completedSessions: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  saveConfig: (newCfg: PomodoroConfig) => void;
  handleSelectPreset: (p: '25/5' | '50/10') => void;
  handleApplySettings: () => void;
  formatTime: (seconds: number) => string;
  totalTime: number;
  progressPercent: number;
}

export function usePomodoroTimer(documentId?: number, disabled: boolean = false): PomodoroTimerReturn {
  // Load configuration with fallback to localStorage
  const [config, setConfig] = useState<PomodoroConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return { ...DEFAULT_POMODORO_CONFIG, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_POMODORO_CONFIG;
  });

  // Modal / panel settings open state
  const [showSettings, setShowSettings] = useState(false);
  const [tempConfig, setTempConfig] = useState<PomodoroConfig>(config);

  // Mode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
  const [mode, setMode] = useState<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>('FOCUS');
  const [timeLeft, setTimeLeft] = useState(config.focusMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [cycleCount, setCycleCount] = useState(0); // Số phiên hoàn thành
  const [completedSessions, setCompletedSessions] = useState(0);

  // Timestamp references to prevent timer drift when tab is hidden / throttled
  const targetEndTimeRef = useRef<number | null>(null);
  const lastActiveTimestampRef = useRef<number | null>(null);
  const accumulatedActiveSecsRef = useRef(0);

  // Save config to localStorage
  const saveConfig = (newCfg: PomodoroConfig) => {
    setConfig(newCfg);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCfg));
      } catch (e) {}
    }
  };

  // Helper flush active study time
  const flushActiveTime = useCallback(async () => {
    const secs = accumulatedActiveSecsRef.current;
    if (secs > 0) {
      accumulatedActiveSecsRef.current = 0;
      try {
        await pingActiveStudyTime(secs);
      } catch (err) {
        console.warn('[POMODORO] Failed to ping active time:', err);
      }
    }
  }, []);

  // Compute total duration in seconds for current mode
  const getCurrentModeDuration = useCallback((m: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK', cfg: PomodoroConfig) => {
    if (m === 'FOCUS') return cfg.focusMinutes * 60;
    if (m === 'SHORT_BREAK') return cfg.shortBreakMinutes * 60;
    return cfg.longBreakMinutes * 60;
  }, []);

  // Handle phase completion
  const handleSessionComplete = useCallback(() => {
    setIsActive(false);
    targetEndTimeRef.current = null;
    lastActiveTimestampRef.current = null;

    if (mode === 'FOCUS') {
      flushActiveTime();
      createStudySession(config.focusMinutes * 60, documentId)
        .then(() => {
          toast.success(`Tuyệt vời! Bạn đã hoàn thành 1 phiên tập trung (${config.focusMinutes} phút) 🎉`);
        })
        .catch(() => {});

      const newCycle = cycleCount + 1;
      setCycleCount(newCycle);
      setCompletedSessions(prev => prev + 1);

      // Determine next break type: Short or Long Break
      if (newCycle % config.cyclesBeforeLongBreak === 0) {
        setMode('LONG_BREAK');
        setTimeLeft(config.longBreakMinutes * 60);
        toast(`Bạn đã hoàn thành ${config.cyclesBeforeLongBreak} phiên! Hãy nghỉ ngơi dài ${config.longBreakMinutes} phút nào ☕🌿`, { icon: '🏆' });
      } else {
        setMode('SHORT_BREAK');
        setTimeLeft(config.shortBreakMinutes * 60);
        toast(`Hết giờ tập trung! Hãy nghỉ ngắn ${config.shortBreakMinutes} phút ☕`, { icon: '⏰' });
      }
    } else {
      // Break finished -> back to focus
      setMode('FOCUS');
      setTimeLeft(config.focusMinutes * 60);
      toast('Hết giờ nghỉ! Sẵn sàng cho phiên tập trung tiếp theo 💪', { icon: '🚀' });
    }
  }, [mode, config, documentId, cycleCount, flushActiveTime]);

  // Main tick loop driven by Date.now() timestamp delta (immune to tab throttling)
  useEffect(() => {
    if (disabled || !isActive || !targetEndTimeRef.current) return;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current! - now) / 1000));
      setTimeLeft(remaining);

      // Record active focus seconds
      if (mode === 'FOCUS' && lastActiveTimestampRef.current) {
        const deltaSec = Math.max(0, Math.floor((now - lastActiveTimestampRef.current) / 1000));
        if (deltaSec > 0) {
          accumulatedActiveSecsRef.current += deltaSec;
          lastActiveTimestampRef.current = now;
          if (accumulatedActiveSecsRef.current >= 30) {
            flushActiveTime();
          }
        }
      } else {
        lastActiveTimestampRef.current = now;
      }

      // Session finished
      if (remaining === 0) {
        handleSessionComplete();
      }
    };

    const intervalId = setInterval(tick, 500);

    // Synchronize immediately when browser tab regains focus or visibility changes
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        tick();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibilityOrFocus);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibilityOrFocus);
      }
    };
  }, [disabled, isActive, mode, flushActiveTime, handleSessionComplete]);

  // Flush time on unmount
  useEffect(() => {
    return () => {
      if (!disabled && accumulatedActiveSecsRef.current > 0) {
        flushActiveTime();
      }
    };
  }, [disabled, flushActiveTime]);

  const toggleTimer = useCallback(() => {
    if (isActive) {
      // Pausing
      flushActiveTime();
      setIsActive(false);
      targetEndTimeRef.current = null;
      lastActiveTimestampRef.current = null;
    } else {
      // Starting / Resuming: anchor end timestamp
      targetEndTimeRef.current = Date.now() + timeLeft * 1000;
      lastActiveTimestampRef.current = Date.now();
      setIsActive(true);
    }
  }, [isActive, timeLeft, flushActiveTime]);

  const resetTimer = useCallback(() => {
    if (isActive) {
      flushActiveTime();
    }
    setIsActive(false);
    targetEndTimeRef.current = null;
    lastActiveTimestampRef.current = null;
    setTimeLeft(getCurrentModeDuration(mode, config));
  }, [isActive, mode, config, flushActiveTime, getCurrentModeDuration]);

  // Preset switch helper
  const handleSelectPreset = useCallback((p: '25/5' | '50/10') => {
    let next: PomodoroConfig;
    if (p === '25/5') {
      next = { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4, preset: '25/5' };
    } else {
      next = { focusMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20, cyclesBeforeLongBreak: 4, preset: '50/10' };
    }
    setTempConfig(next);
  }, []);

  // Apply Settings from modal
  const handleApplySettings = useCallback(() => {
    saveConfig(tempConfig);
    setShowSettings(false);

    if (isActive) {
      toast('Cài đặt mới đã được lưu và sẽ áp dụng cho phiên sau hoặc khi bạn Đặt lại!', { icon: 'ℹ️' });
    } else {
      // Not running: update current timeLeft immediately
      setTimeLeft(getCurrentModeDuration(mode, tempConfig));
      toast.success('Đã áp dụng cài đặt Pomodoro mới!');
    }
  }, [tempConfig, isActive, mode, getCurrentModeDuration]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const totalTime = getCurrentModeDuration(mode, config);
  const progressPercent = Math.min(100, Math.max(0, ((totalTime - timeLeft) / (totalTime || 1)) * 100));

  return {
    config,
    setConfig,
    tempConfig,
    setTempConfig,
    showSettings,
    setShowSettings,
    mode,
    setMode,
    timeLeft,
    setTimeLeft,
    isActive,
    cycleCount,
    completedSessions,
    toggleTimer,
    resetTimer,
    saveConfig,
    handleSelectPreset,
    handleApplySettings,
    formatTime,
    totalTime,
    progressPercent
  };
}
