"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Zap, Clock, Play, Pause, Square, AlertTriangle, 
  CheckCircle2, ArrowLeft, Maximize2, Minimize2, Eye, 
  EyeOff, Coffee, ArrowRight, BookOpen, HelpCircle, 
  TrendingUp, Sparkles, RefreshCw, XCircle, Flame, ShieldAlert
} from 'lucide-react';
import { focusService, FocusSession, FocusSummary } from '@/services/focus.service';
import { getDocuments } from '@/services/document.service';
import { getTestSets } from '@/services/ai-test.service';

type FocusModeState = 'SETUP' | 'ACTIVE' | 'SUMMARY' | 'BREAK';

function FocusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryDocId = searchParams.get('documentId') ? Number(searchParams.get('documentId')) : null;
  const queryQuizId = searchParams.get('quizId') ? Number(searchParams.get('quizId')) : null;
  const queryDuration = searchParams.get('duration') ? Number(searchParams.get('duration')) : null;

  // View state
  const [modeState, setModeState] = useState<FocusModeState>('SETUP');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Setup options
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(queryDuration || 25);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<number | null>(queryDocId);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(queryQuizId);

  // Available resources for attachment
  const [userDocuments, setUserDocuments] = useState<Array<{ id: number; title: string }>>([]);
  const [userTestSets, setUserTestSets] = useState<Array<{ id: number; name: string }>>([]);

  // Active Session state
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [liveDistractionCount, setLiveDistractionCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [lastDistractionNotice, setLastDistractionNotice] = useState<string | null>(null);

  // Summary state
  const [summaryData, setSummaryData] = useState<FocusSummary | null>(null);
  const [detailedEvents, setDetailedEvents] = useState<any[]>([]);

  // Break state
  const [breakSecondsRemaining, setBreakSecondsRemaining] = useState<number>(5 * 60);
  const [breakTotalSeconds] = useState<number>(5 * 60);
  const [breathingPhase, setBreathingPhase] = useState<'Hít vào' | 'Giữ hơi' | 'Thở ra'>('Hít vào');

  // Cancel Confirmation Modal
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  // Refs for tracking and timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHiddenTimeRef = useRef<number | null>(null);
  const isBlurActiveRef = useRef<boolean>(false);

  // 1. Initial Load: Check for existing active session & resources
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setLoading(true);
        // Load active session from server if any
        const activeRes = await focusService.getActiveSession().catch(() => ({ activeSession: null }));
        
        if (activeRes?.activeSession && isMounted) {
          const sess = activeRes.activeSession;
          setActiveSession(sess);
          setLiveDistractionCount(sess.distraction_count || 0);
          
          // Calculate elapsed time
          const startMs = new Date(sess.started_at).getTime();
          const nowMs = Date.now();
          const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));
          const targetSecs = sess.target_duration_seconds;
          const remaining = Math.max(0, targetSecs - elapsed);
          
          setSecondsElapsed(elapsed);
          setSecondsRemaining(remaining);
          setSelectedDocId(sess.document_id);
          setSelectedQuizId(sess.quiz_id);
          setModeState('ACTIVE');
        } else if (isMounted) {
          // Preload user's documents & test sets for the attachment selector
          const [docsRes, testsRes] = await Promise.all([
            getDocuments().catch(() => ({ documents: [] })),
            getTestSets().catch(() => ({ testSets: [] })),
          ]);

          if (isMounted) {
            if (docsRes?.documents) {
              setUserDocuments(docsRes.documents);
            } else if (Array.isArray(docsRes)) {
              setUserDocuments(docsRes);
            }

            if (testsRes?.testSets) {
              setUserTestSets(testsRes.testSets);
            } else if (Array.isArray(testsRes)) {
              setUserTestSets(testsRes);
            }
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Lỗi khi khởi tạo Chế độ tập trung');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Start Session Handler
  const handleStartSession = async (durationMinsOverride?: number) => {
    try {
      setLoading(true);
      setError(null);
      const mins = durationMinsOverride || targetDurationMinutes;
      const targetSeconds = mins * 60;

      const session = await focusService.startSession({
        target_duration_seconds: targetSeconds,
        document_id: selectedDocId,
        quiz_id: selectedQuizId,
      });

      setActiveSession(session);
      setSecondsRemaining(targetSeconds);
      setSecondsElapsed(0);
      setLiveDistractionCount(0);
      setIsPaused(false);
      setModeState('ACTIVE');
    } catch (err: any) {
      setError(err.message || 'Không thể bắt đầu phiên tập trung.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Finish Session Handler
  const handleFinishSession = useCallback(async (status: 'COMPLETED' | 'INTERRUPTED' | 'CANCELLED') => {
    if (!activeSession) return;
    try {
      setLoading(true);
      const res = await focusService.finishSession(activeSession.id, {
        status,
        actual_duration_seconds: secondsElapsed,
      });

      // Fetch full summary with event history
      const fullSummary = await focusService.getSessionSummary(activeSession.id).catch(() => ({
        session: res.session,
        events: [],
        summary: res.summary,
      }));

      setSummaryData(fullSummary.summary);
      setDetailedEvents(fullSummary.events || []);
      setActiveSession(null);
      setModeState('SUMMARY');

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi kết thúc phiên.');
    } finally {
      setLoading(false);
      setShowCancelModal(false);
    }
  }, [activeSession, secondsElapsed]);

  // 4. Distraction Event Recording Helper
  const recordDistraction = useCallback((
    eventType: 'TAB_SWITCH' | 'PAGE_BLUR' | 'PAGE_HIDDEN' | 'IDLE' | 'RETURNED', 
    durationSecs?: number,
    details?: Record<string, any>
  ) => {
    if (!activeSession || isPaused) return;

    focusService.recordDistraction(activeSession.id, {
      event_type: eventType,
      duration_seconds: durationSecs,
      details,
    }).then((res) => {
      setLiveDistractionCount(res.distractionCount);
      if (eventType === 'PAGE_HIDDEN' || eventType === 'TAB_SWITCH' || eventType === 'PAGE_BLUR') {
        setLastDistractionNotice('Đã ghi nhận chuyển đổi cửa sổ/tab trình duyệt');
        setTimeout(() => setLastDistractionNotice(null), 4000);
      } else if (eventType === 'RETURNED') {
        setLastDistractionNotice('Chào mừng bạn quay lại tập trung!');
        setTimeout(() => setLastDistractionNotice(null), 4000);
      } else if (eventType === 'IDLE') {
        setLastDistractionNotice('Không có thao tác trong hơn 60 giây');
        setTimeout(() => setLastDistractionNotice(null), 4000);
      }
    }).catch(() => {
      // Non-blocking telemetry
    });
  }, [activeSession, isPaused]);

  // 5. Active Session Timer & Heartbeat Ping
  useEffect(() => {
    if (modeState !== 'ACTIVE' || !activeSession || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      return;
    }

    // 1-second countdown & count-up
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Time's up -> Complete session
          handleFinishSession('COMPLETED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 15-second ping heartbeat to backend
    pingIntervalRef.current = setInterval(() => {
      if (activeSession?.id) {
        focusService.pingActive(activeSession.id, 15).catch(() => {});
      }
    }, 15000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [modeState, activeSession, isPaused, handleFinishSession]);

  // 6. Browser-Only Distraction Detection Listeners
  useEffect(() => {
    if (modeState !== 'ACTIVE' || !activeSession || isPaused) return;

    // Visibility change handler (tab switch or browser minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastHiddenTimeRef.current = Date.now();
        recordDistraction('PAGE_HIDDEN');
      } else if (document.visibilityState === 'visible') {
        const awayDurationSecs = lastHiddenTimeRef.current
          ? Math.max(1, Math.round((Date.now() - lastHiddenTimeRef.current) / 1000))
          : undefined;
        lastHiddenTimeRef.current = null;
        recordDistraction('RETURNED', awayDurationSecs);
      }
    };

    // Window blur handler (user clicks outside browser or switches apps)
    const handleWindowBlur = () => {
      if (!isBlurActiveRef.current) {
        isBlurActiveRef.current = true;
        recordDistraction('PAGE_BLUR');
      }
    };

    // Window focus handler
    const handleWindowFocus = () => {
      if (isBlurActiveRef.current) {
        isBlurActiveRef.current = false;
        recordDistraction('RETURNED');
      }
    };

    // 60-second Idle detector (mouse & keyboard inactivity)
    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        recordDistraction('IDLE', 60);
      }, 60000);
    };

    // Attach user activity listeners
    window.addEventListener('mousemove', resetIdleTimer, { passive: true });
    window.addEventListener('keydown', resetIdleTimer, { passive: true });
    window.addEventListener('scroll', resetIdleTimer, { passive: true });
    window.addEventListener('touchstart', resetIdleTimer, { passive: true });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Initial idle reset
    resetIdleTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);

      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);

      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [modeState, activeSession, isPaused, recordDistraction]);

  // 7. Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // 8. Break Timer & Breathing Guide
  const startBreakTimer = () => {
    setBreakSecondsRemaining(5 * 60);
    setModeState('BREAK');

    if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    breakTimerRef.current = setInterval(() => {
      setBreakSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(breakTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Breathing rhythm: 4s breathe in, 4s hold, 4s breathe out
    let step = 0;
    if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    breathingIntervalRef.current = setInterval(() => {
      step = (step + 1) % 3;
      if (step === 0) setBreathingPhase('Hít vào');
      else if (step === 1) setBreathingPhase('Giữ hơi');
      else setBreathingPhase('Thở ra');
    }, 4000);
  };

  const endBreak = () => {
    if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    setModeState('SETUP');
  };

  // Helper formatting mm:ss
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress circle math
  const targetSecs = activeSession?.target_duration_seconds || targetDurationMinutes * 60;
  const progressRatio = Math.min(1, secondsElapsed / Math.max(1, targetSecs));
  const strokeDashoffset = 565 - 565 * progressRatio;

  // Render Loading
  if (loading && modeState === 'SETUP' && !activeSession) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#0D2B24]/20 border-t-[#0D2B24] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-700 animate-pulse">Đang chuẩn bị không gian tập trung...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 1. SETUP STATE
  // =========================================================================
  if (modeState === 'SETUP') {
    const durationPresets = [
      { mins: 15, label: 'Khởi động', desc: '15 phút tập trung nhanh' },
      { mins: 25, label: 'Pomodoro', desc: '25 phút chuẩn khoa học' },
      { mins: 45, label: 'Chuyên sâu', desc: '45 phút học kiến thức mới' },
      { mins: 60, label: 'Bứt phá', desc: '60 phút luyện đề & giải bài' },
    ];

    const currentDoc = userDocuments.find((d) => d.id === selectedDocId);
    const currentQuiz = userTestSets.find((t) => t.id === selectedQuizId);

    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
        {/* Header */}
        <header className="h-16 px-6 sm:px-10 bg-white border-b border-gray-200/80 flex items-center justify-between">
          <Link href="/study-sessions" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} /> Không gian học tập
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
              <Zap size={13} className="text-emerald-600" />
              Focus Mode
            </span>
          </div>
        </header>

        {/* Setup Content */}
        <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 flex-1">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0D2B24] to-[#1b5245] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Zap size={28} className="text-emerald-300" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Chế độ Tập trung Cao độ
            </h1>
            <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
              Không gian học sâu không phân tâm. Tự động đếm giờ, phát hiện chuyển tab trình duyệt và đồng bộ chuỗi ngày học của bạn.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-8">
            {/* Step 1: Duration Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                1. Chọn thời gian tập trung
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {durationPresets.map((preset) => {
                  const isSelected = targetDurationMinutes === preset.mins && !customMinutes;
                  return (
                    <button
                      key={preset.mins}
                      type="button"
                      onClick={() => {
                        setTargetDurationMinutes(preset.mins);
                        setCustomMinutes('');
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#0D2B24] bg-emerald-50/50 ring-2 ring-[#0D2B24]/10 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-base font-extrabold ${isSelected ? 'text-[#0D2B24]' : 'text-gray-900'}`}>
                          {preset.mins} phút
                        </span>
                        {isSelected && <CheckCircle2 size={16} className="text-[#0D2B24]" />}
                      </div>
                      <div className="text-[11px] font-bold text-gray-700">{preset.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{preset.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom input */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">Hoặc tùy chỉnh:</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  placeholder="Số phút (1-180)"
                  value={customMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomMinutes(val);
                    const n = parseInt(val, 10);
                    if (!isNaN(n) && n > 0 && n <= 180) {
                      setTargetDurationMinutes(n);
                    }
                  }}
                  className="w-32 px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0D2B24]"
                />
                <span className="text-xs text-gray-500">phút</span>
              </div>
            </div>

            {/* Step 2: Attachment Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                2. Gắn kết nội dung học tập (Tùy chọn)
              </label>

              <div className="space-y-3">
                {/* Free Session Option */}
                <div
                  onClick={() => {
                    setSelectedDocId(null);
                    setSelectedQuizId(null);
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    !selectedDocId && !selectedQuizId
                      ? 'border-[#0D2B24] bg-emerald-50/50 ring-1 ring-[#0D2B24]'
                      : 'border-gray-200 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Tập trung tự do (Không gắn kết)</div>
                      <div className="text-[11px] text-gray-500">Tự do đọc sách vở ngoài đời, ôn bài vở hoặc ghi chép</div>
                    </div>
                  </div>
                  {!selectedDocId && !selectedQuizId && <CheckCircle2 size={16} className="text-[#0D2B24]" />}
                </div>

                {/* Document Attachment */}
                <div className="p-3.5 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/60">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Gắn với Tài liệu đọc</div>
                        <div className="text-[11px] text-gray-500">Đọc tài liệu trong thư viện khi tập trung</div>
                      </div>
                    </div>
                  </div>

                  <select
                    value={selectedDocId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setSelectedDocId(val);
                      if (val) setSelectedQuizId(null);
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-[#0D2B24]"
                  >
                    <option value="">-- Chọn tài liệu từ thư viện --</option>
                    {userDocuments.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title}
                      </option>
                    ))}
                  </select>
                  {currentDoc && (
                    <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md">
                      ✓ Đã chọn: {currentDoc.title}
                    </div>
                  )}
                </div>

                {/* Quiz Attachment */}
                <div className="p-3.5 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center border border-purple-200/60">
                        <HelpCircle size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Gắn với Bộ đề luyện thi</div>
                        <div className="text-[11px] text-gray-500">Luyện đề trắc nghiệm trong phiên tập trung</div>
                      </div>
                    </div>
                  </div>

                  <select
                    value={selectedQuizId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setSelectedQuizId(val);
                      if (val) setSelectedDocId(null);
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-[#0D2B24]"
                  >
                    <option value="">-- Chọn bộ đề kiểm tra --</option>
                    {userTestSets.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.name}
                      </option>
                    ))}
                  </select>
                  {currentQuiz && (
                    <div className="text-[11px] text-purple-800 font-semibold bg-purple-50 px-2.5 py-1 rounded-md">
                      ✓ Đã chọn: {currentQuiz.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy & Anti-Distraction Policy */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 text-gray-600 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-gray-800">
                <ShieldAlert size={14} className="text-emerald-700" />
                <span>Cam kết bảo mật & Quyền riêng tư người học</span>
              </div>
              <p className="leading-relaxed">
                Hệ thống chỉ dựa vào sự kiện trình duyệt (chuyển tab, thu nhỏ cửa sổ, không thao tác &gt;60s) để tính chỉ số tập trung. 
                <strong> Tuyệt đối KHÔNG sử dụng Camera, Microphone hay phân tích tâm lý</strong>.
              </p>
            </div>

            {/* Action CTA */}
            <button
              type="button"
              onClick={() => handleStartSession()}
              className="w-full py-3.5 bg-[#0D2B24] hover:bg-[#144136] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-[0.99]"
            >
              <Play size={18} className="fill-white" />
              <span>Bắt đầu phiên tập trung ({targetDurationMinutes} phút)</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 2. ACTIVE FOCUS MODE (ATMOSPHERIC IMMERSIVE VIEW)
  // =========================================================================
  if (modeState === 'ACTIVE' && activeSession) {
    const isAttachedToDoc = Boolean(activeSession.document_id);
    const isAttachedToQuiz = Boolean(activeSession.quiz_id);

    return (
      <div className={`min-h-screen bg-[#0B1B15] text-white flex flex-col font-sans transition-all duration-300 relative select-none ${isFullscreen ? 'p-4' : ''}`}>
        {/* Top Floating Bar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 z-10">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-300">
              Đang trong phiên tập trung
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Distraction Pill */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              liveDistractionCount === 0 
                ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/30' 
                : 'bg-amber-900/60 text-amber-200 border border-amber-500/30'
            }`}>
              {liveDistractionCount === 0 ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>Rời trang: {liveDistractionCount} lần</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Exit/Cancel Button */}
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
            >
              Dừng phiên
            </button>
          </div>
        </header>

        {/* Real-time Distraction Toast Notification */}
        {lastDistractionNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500/90 text-black text-xs font-extrabold rounded-full shadow-lg z-30 animate-bounce">
            ⚠️ {lastDistractionNotice}
          </div>
        )}

        {/* Main Central Circle */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 max-w-xl mx-auto w-full">
          {/* Circular Countdown Progress Ring */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/10"
              />
              {/* Active Progress */}
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="#10B981"
                strokeWidth="8"
                strokeDasharray="565"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            {/* Center Time Display */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-xs font-semibold text-emerald-400/80 mt-1 uppercase tracking-widest">
                {isPaused ? 'Đang tạm dừng' : 'Thời gian còn lại'}
              </span>
              <span className="text-[11px] text-gray-400 mt-2 font-mono">
                Đã học: {formatTime(secondsElapsed)}
              </span>
            </div>
          </div>

          {/* Attached Material Quick Link */}
          {(isAttachedToDoc || isAttachedToQuiz) && (
            <div className="mb-8 w-full bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center justify-between text-left">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                  Nội dung liên kết:
                </span>
                <span className="text-xs font-semibold text-gray-200 truncate block">
                  {activeSession.document_title || activeSession.quiz_title || 'Nội dung học tập'}
                </span>
              </div>
              {isAttachedToDoc && (
                <a
                  href={`/viewer/${activeSession.document_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0 transition-colors inline-flex items-center gap-1"
                >
                  <BookOpen size={12} />
                  <span>Mở tài liệu</span>
                </a>
              )}
              {isAttachedToQuiz && (
                <a
                  href={`/quiz/${activeSession.quiz_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shrink-0 transition-colors inline-flex items-center gap-1"
                >
                  <HelpCircle size={12} />
                  <span>Làm đề thi</span>
                </a>
              )}
            </div>
          )}

          {/* Controls: Pause / Finish */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              {isPaused ? <Play size={16} className="fill-white" /> : <Pause size={16} className="fill-white" />}
              <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
            </button>

            <button
              onClick={() => handleFinishSession('COMPLETED')}
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
            >
              <CheckCircle2 size={16} />
              <span>Hoàn thành phiên</span>
            </button>
          </div>
        </main>

        {/* Ambient Subtle Background Graphic */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="w-[500px] h-[500px] rounded-full bg-emerald-600/30 blur-3xl absolute -top-40 -left-40" />
          <div className="w-[500px] h-[500px] rounded-full bg-teal-600/20 blur-3xl absolute -bottom-40 -right-40" />
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#12241E] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center text-white">
              <AlertTriangle size={36} className="text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-bold mb-2">Bạn muốn dừng phiên tập trung?</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Thời gian bạn đã học ({formatTime(secondsElapsed)}) vẫn sẽ được ghi nhận vào bảng tiến độ.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
                >
                  Tiếp tục học
                </button>
                <button
                  onClick={() => handleFinishSession('INTERRUPTED')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                >
                  Dừng & Lưu kết quả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: 3. SUMMARY VIEW (NEVER A DEAD END)
  // =========================================================================
  if (modeState === 'SUMMARY' && summaryData) {
    const isSuccess = summaryData.status === 'COMPLETED';
    const score = summaryData.focusScore || 0;
    const scoreRating = score >= 90 ? 'Xuất sắc' : score >= 75 ? 'Rất tốt' : score >= 60 ? 'Khá' : 'Cần cải thiện';
    const scoreBadgeColor = score >= 90 ? 'bg-emerald-100 text-emerald-800' : score >= 75 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';

    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
        <header className="h-16 px-6 sm:px-10 bg-white border-b border-gray-200/80 flex items-center justify-between">
          <Link href="/study-sessions" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} /> Không gian học tập
          </Link>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            Tổng kết phiên tập trung
          </span>
        </header>

        <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 flex-1 space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {isSuccess ? 'Chúc mừng bạn đã hoàn thành phiên tập trung!' : 'Phiên tập trung đã được lưu lại'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-md mx-auto">
              Toàn bộ thời gian học và điểm tập trung đã được tự động đồng bộ vào Bảng tiến độ và Chuỗi ngày học (StudyStreak).
            </p>

            {/* Score Pill */}
            <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200/80">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm tập trung</span>
              <span className="text-2xl font-black text-gray-900">{score}/100</span>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${scoreBadgeColor}`}>
                {scoreRating}
              </span>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200/60 text-center">
                <Clock size={16} className="text-gray-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-gray-900">{summaryData.actualFocusMinutes} phút</div>
                <div className="text-[11px] text-gray-500">Thời gian thực tế</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200/60 text-center">
                <Zap size={16} className="text-emerald-600 mx-auto mb-1.5" />
                <div className="text-lg font-black text-gray-900">{Math.round(summaryData.targetDurationSeconds / 60)} phút</div>
                <div className="text-[11px] text-gray-500">Thời gian mục tiêu</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200/60 text-center">
                <EyeOff size={16} className="text-amber-600 mx-auto mb-1.5" />
                <div className="text-lg font-black text-gray-900">{summaryData.distractionCount} lần</div>
                <div className="text-[11px] text-gray-500">Rời tab/cửa sổ</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200/60 text-center">
                <Flame size={16} className="text-orange-500 mx-auto mb-1.5 fill-orange-500" />
                <div className="text-lg font-black text-gray-900">+{summaryData.actualFocusMinutes}m</div>
                <div className="text-[11px] text-gray-500">Cộng dồn Streak</div>
              </div>
            </div>

            {/* Distraction breakdown if any */}
            {detailedEvents.length > 0 && (
              <div className="mt-6 text-left border-t border-gray-100 pt-4">
                <div className="text-xs font-bold text-gray-700 mb-2">Nhật ký chuyển đổi trình duyệt:</div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {detailedEvents.map((evt, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-gray-800">
                        {evt.event_type === 'TAB_SWITCH' && 'Chuyển đổi thẻ (Tab Switch)'}
                        {evt.event_type === 'PAGE_BLUR' && 'Mất tiêu điểm cửa sổ (Blur)'}
                        {evt.event_type === 'PAGE_HIDDEN' && 'Ẩn trang trình duyệt (Hidden)'}
                        {evt.event_type === 'IDLE' && 'Không thao tác > 60s (Idle)'}
                        {evt.event_type === 'RETURNED' && 'Đã quay lại tập trung'}
                      </span>
                      <span className="text-gray-400 font-mono">
                        {new Date(evt.occurred_at).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actionable Next Steps (Never a Dead End) */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Bước tiếp theo dành cho bạn:
            </h3>

            {/* Option 1: Pomodoro Short Break */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Coffee size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                    Nghỉ giải lao ngắn 5 phút (Pomodoro Break)
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Thư giãn mắt, hít thở sâu và nạp lại năng lượng trước khi bắt đầu phiên tiếp theo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={startBreakTimer}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm"
              >
                Nghỉ 5 phút
              </button>
            </div>

            {/* Option 2: Continue Learning with Attached Material or Library */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {summaryData.documentId ? (
                <Link
                  href={`/viewer/${summaryData.documentId}`}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100/70 flex items-center justify-between text-xs font-bold text-gray-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={15} className="text-amber-600" />
                    Quay lại đọc tài liệu
                  </span>
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
              ) : (
                <Link
                  href="/library"
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100/70 flex items-center justify-between text-xs font-bold text-gray-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={15} className="text-amber-600" />
                    Mở kho tài liệu học tập
                  </span>
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
              )}

              {summaryData.quizId ? (
                <Link
                  href={`/quiz/${summaryData.quizId}`}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100/70 flex items-center justify-between text-xs font-bold text-gray-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle size={15} className="text-purple-600" />
                    Vào làm bài kiểm tra
                  </span>
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
              ) : (
                <Link
                  href="/ai-test"
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100/70 flex items-center justify-between text-xs font-bold text-gray-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle size={15} className="text-purple-600" />
                    Luyện đề thi trắc nghiệm
                  </span>
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
              )}
            </div>

            {/* Option 3: Check Progress or Start Next Session */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <Link
                href="/progress"
                className="text-gray-600 hover:text-gray-900 font-bold inline-flex items-center gap-1.5"
              >
                <TrendingUp size={14} />
                <span>Xem Bảng tiến độ & Chuỗi học</span>
              </Link>

              <button
                type="button"
                onClick={() => setModeState('SETUP')}
                className="px-5 py-2.5 bg-[#0D2B24] hover:bg-[#144136] text-white rounded-xl font-bold transition-all shadow-sm"
              >
                Bắt đầu phiên học mới
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 4. BREAK TIMER MODE (POMODORO SHORT BREAK & RELAXATION)
  // =========================================================================
  if (modeState === 'BREAK') {
    const breakRatio = Math.min(1, (breakTotalSeconds - breakSecondsRemaining) / breakTotalSeconds);

    return (
      <div className="min-h-screen bg-[#F0F7F4] flex flex-col font-sans items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-white rounded-3xl border border-emerald-100 shadow-sm p-8 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Coffee size={28} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Giờ nghỉ giải lao Pomodoro</h2>
            <p className="text-xs text-gray-600 mt-1">
              Hãy đứng dậy uống nước, vươn vai hoặc làm theo bài tập thở nhẹ dưới đây.
            </p>
          </div>

          {/* Break Timer Display */}
          <div className="py-4">
            <div className="text-5xl font-black text-emerald-800 font-mono tracking-tight">
              {formatTime(breakSecondsRemaining)}
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-emerald-100 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-emerald-600 transition-all duration-1000"
                style={{ width: `${breakRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Calming Breathing Guide */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              Bài tập thở thư giãn 4-4-4
            </span>
            <div className="text-base font-extrabold text-emerald-950 animate-pulse">
              {breathingPhase}...
            </div>
          </div>

          {/* Skip Break Button */}
          <button
            type="button"
            onClick={endBreak}
            className="w-full py-3 bg-[#0D2B24] hover:bg-[#144136] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>Kết thúc nghỉ & Vào phiên mới</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function FocusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#0D2B24]/20 border-t-[#0D2B24] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-700">Đang tải...</p>
      </div>
    }>
      <FocusContent />
    </Suspense>
  );
}
