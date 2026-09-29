"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "react-hot-toast";
import {
  startQuiz,
  submitQuiz,
  QuizQuestion,
  QuizAttempt,
  QuizResultAnswer,
  SubmitAnswerItem,
} from "@/services/quiz.service";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Trophy,
  Award,
  Check,
  X,
  Lightbulb,
  FileQuestion,
  HelpCircle,
  Share2,
  Zap,
} from "lucide-react";

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const testSetId = Number(params?.testSetId);
  const modeParam = searchParams.get("mode");
  const previousAttemptIdParam = searchParams.get("attemptId");

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [testSetName, setTestSetName] = useState<string>("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isRetryMistakes, setIsRetryMistakes] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submission & Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultData, setResultData] = useState<{
    attempt: QuizAttempt;
    answers: QuizResultAnswer[];
  } | null>(null);

  // Result Filter
  const [resultFilter, setResultFilter] = useState<"all" | "correct" | "incorrect">("all");

  // Start Quiz
  const initQuiz = useCallback(
    async (isRetry: boolean = false, prevId?: number) => {
      setLoading(true);
      setError(null);
      setResultData(null);
      setAnswers({});
      setFlagged(new Set());
      setCurrentIndex(0);
      setSecondsElapsed(0);

      try {
        const res = await startQuiz(testSetId, {
          isRetryMistakes: isRetry,
          previousAttemptId: prevId,
        });

        if (res.error) {
          setError(res.error);
          return;
        }

        setAttempt(res.attempt);
        setTestSetName(res.testSet?.name || "Bài kiểm tra");
        setQuestions(res.questions || []);
        setIsRetryMistakes(res.isRetryMistakes);

        // Bắt đầu đếm giờ
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setSecondsElapsed((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        setError(err.message || "Không thể tải bài thi. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    },
    [testSetId]
  );

  useEffect(() => {
    if (!testSetId || isNaN(testSetId)) {
      setError("Mã bộ đề thi không hợp lệ.");
      setLoading(false);
      return;
    }

    const isRetry = modeParam === "retry-mistakes" && Boolean(previousAttemptIdParam);
    initQuiz(isRetry, previousAttemptIdParam ? Number(previousAttemptIdParam) : undefined);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testSetId, modeParam, previousAttemptIdParam, initQuiz]);

  // Format Timer: MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (resultData || loading || showConfirmModal) return;

      // Không can thiệp nếu đang gõ vào input / textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea") return;

      if (e.key === "ArrowLeft") {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      } else if (e.key === "ArrowRight") {
        if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
      } else {
        const curQ = questions[currentIndex];
        if (!curQ) return;

        if (curQ.type === "MULTIPLE_CHOICE") {
          const keyUpper = e.key.toUpperCase();
          if (["A", "B", "C", "D"].includes(keyUpper)) {
            setAnswers((prev) => ({ ...prev, [curQ.id]: keyUpper }));
          }
        } else if (curQ.type === "TRUE_FALSE") {
          const keyUpper = e.key.toUpperCase();
          if (keyUpper === "A" || keyUpper === "1" || keyUpper === "T") {
            setAnswers((prev) => ({ ...prev, [curQ.id]: "A" }));
          } else if (keyUpper === "B" || keyUpper === "2" || keyUpper === "F") {
            setAnswers((prev) => ({ ...prev, [curQ.id]: "B" }));
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions, resultData, loading, showConfirmModal]);

  // Handle Answer Selection
  const handleSelectOption = (questionId: number, val: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  // Toggle Flag
  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  // Handle Submit Quiz
  const handleSubmitQuiz = async () => {
    if (!attempt) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    if (timerRef.current) clearInterval(timerRef.current);

    const payloadAnswers: SubmitAnswerItem[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] !== undefined ? answers[q.id] : null,
    }));

    try {
      const res = await submitQuiz(attempt.id, {
        answers: payloadAnswers,
        durationSeconds: secondsElapsed,
      });

      if (res.error) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      setResultData(res);
      toast.success("Nộp bài thành công!");

      // Bắn pháo hoa ăn mừng nếu đạt kết quả tốt (>= 70%)
      const pct = res.attempt.percentage || 0;
      if (pct >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi nộp bài");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry Mistakes action
  const handleRetryMistakes = () => {
    if (!resultData?.attempt?.id) return;
    initQuiz(true, resultData.attempt.id);
  };

  // Retry All action
  const handleRetryAll = () => {
    initQuiz(false);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-semibold animate-pulse">Đang chuẩn bị đề thi...</p>
      </div>
    );
  }

  // Error State
  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải bài thi</h2>
          <p className="text-sm text-gray-600 mb-6">{error || "Bộ đề thi này chưa có câu hỏi nào để luyện tập."}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/ai-test"
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Quay lại danh sách
            </Link>
            <button
              onClick={() => initQuiz(isRetryMistakes, previousAttemptIdParam ? Number(previousAttemptIdParam) : undefined)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: KẾT QUẢ BÀI THI & REVIEW CÂU SAI
  // ==========================================
  if (resultData) {
    const { attempt: resAttempt, answers: resAnswers } = resultData;
    const answeredCount = resAnswers.filter((a) => a.user_answer !== null && a.user_answer !== undefined && a.user_answer !== "").length;
    const mistakesCount = resAnswers.filter((a) => !a.is_correct).length;
    const pct = resAttempt.percentage || 0;

    const filteredAnswers = resAnswers.filter((ans) => {
      if (resultFilter === "correct") return ans.is_correct;
      if (resultFilter === "incorrect") return !ans.is_correct;
      return true;
    });

    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/ai-test"
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} /> Quay lại danh sách đề thi
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                Lượt làm #{resAttempt.id}
              </span>
            </div>
          </div>

          {/* Result Score Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/50 to-teal-50/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <Trophy size={14} /> Hoàn thành bài thi
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{resAttempt.testSetName || testSetName}</h1>
                <p className="text-sm text-gray-500">
                  Thời gian làm bài: <strong className="text-gray-800">{formatTime(resAttempt.durationSeconds || secondsElapsed)}</strong> • Hoàn thành lúc: {new Date(resAttempt.completedAt || Date.now()).toLocaleTimeString("vi-VN")}
                </p>
              </div>

              {/* Circular / Badge Score */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-32 h-32 rounded-3xl flex flex-col items-center justify-center border-4 shadow-lg ${
                    pct >= 80
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-emerald-500/10"
                      : pct >= 50
                      ? "bg-amber-50 border-amber-500 text-amber-700 shadow-amber-500/10"
                      : "bg-rose-50 border-rose-500 text-rose-700 shadow-rose-500/10"
                  }`}
                >
                  <span className="text-3xl font-black">{resAttempt.score}</span>
                  <span className="text-xs font-semibold opacity-75">/ {resAttempt.totalScore} Điểm</span>
                  <span className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full bg-white/70">
                    {pct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="bg-slate-50 p-3.5 rounded-2xl text-center">
                <p className="text-xs font-semibold text-gray-400">Tổng số câu</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{resAttempt.totalQuestions}</p>
              </div>
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl text-center">
                <p className="text-xs font-semibold text-emerald-600">Câu trả lời đúng</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{resAttempt.correctCount}</p>
              </div>
              <div className="bg-rose-50/70 p-3.5 rounded-2xl text-center">
                <p className="text-xs font-semibold text-rose-600">Câu làm sai</p>
                <p className="text-xl font-bold text-rose-700 mt-1">{mistakesCount}</p>
              </div>
              <div className="bg-amber-50/70 p-3.5 rounded-2xl text-center">
                <p className="text-xs font-semibold text-amber-600">Chưa làm</p>
                <p className="text-xl font-bold text-amber-700 mt-1">{resAttempt.totalQuestions - answeredCount}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              {mistakesCount > 0 && (
                <button
                  onClick={handleRetryMistakes}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
                >
                  <RotateCcw size={16} /> Làm lại chỉ các câu sai ({mistakesCount} câu)
                </button>
              )}
              <button
                onClick={handleRetryAll}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <RotateCcw size={16} /> Làm lại cả bộ đề
              </button>
              <Link
                href="/ai-test"
                className="ml-auto px-5 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Về kho đề thi
              </Link>
            </div>
          </div>

          {/* Breakdown Tabs & List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award size={20} className="text-emerald-600" />
                Chi tiết đáp án &amp; giải thích
              </h2>
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setResultFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    resultFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Tất cả ({resAnswers.length})
                </button>
                <button
                  onClick={() => setResultFilter("correct")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    resultFilter === "correct" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Đúng ({resAttempt.correctCount})
                </button>
                <button
                  onClick={() => setResultFilter("incorrect")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    resultFilter === "incorrect" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Sai ({mistakesCount})
                </button>
              </div>
            </div>

            {filteredAnswers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-200">
                <p className="text-sm font-semibold">Không có câu hỏi nào theo bộ lọc này.</p>
              </div>
            ) : (
              filteredAnswers.map((ans, idx) => {
                const questionContent = ans.questionContent || ans.question_content || "";
                const options = ans.options || ans.question_options;
                const correctAnswer = ans.correctAnswer || ans.question_correct_answer;
                const explanation = ans.explanation || "";
                const isCorrect = ans.is_correct;
                const userAns = ans.user_answer !== null && ans.user_answer !== undefined ? JSON.parse(JSON.stringify(ans.user_answer)) : null;

                return (
                  <motion.div
                    key={ans.id || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-white rounded-2xl p-6 border shadow-sm ${
                      isCorrect ? "border-emerald-200/80" : "border-rose-200/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                            isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isCorrect ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                          {isCorrect ? "Đúng" : "Sai"}
                        </span>
                        <span className="text-xs text-gray-400">
                          Điểm: <strong>{ans.score_awarded}</strong> / {ans.maxScore || ans.question_max_score || 1.0}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-semibold text-gray-900 mb-4 whitespace-pre-wrap">
                      {questionContent}
                    </p>

                    {/* Choices / Answers */}
                    {options && typeof options === "object" && Object.keys(options).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {Object.entries(options).map(([k, val]) => {
                          const isOptionCorrect = String(correctAnswer).toUpperCase() === k.toUpperCase();
                          const isOptionUser = String(userAns).toUpperCase() === k.toUpperCase();

                          let itemStyle = "border-gray-200 bg-gray-50/50 text-gray-700";
                          if (isOptionCorrect) {
                            itemStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20";
                          } else if (isOptionUser && !isCorrect) {
                            itemStyle = "border-rose-400 bg-rose-50 text-rose-800 line-through opacity-80";
                          }

                          return (
                            <div key={k} className={`flex items-start gap-3 p-3 rounded-xl border text-xs sm:text-sm ${itemStyle}`}>
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                                  isOptionCorrect
                                    ? "bg-emerald-600 text-white"
                                    : isOptionUser && !isCorrect
                                    ? "bg-rose-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                {k}
                              </span>
                              <span className="flex-1">{String(val)}</span>
                              {isOptionCorrect && <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />}
                              {isOptionUser && !isCorrect && <XCircle size={16} className="text-rose-500 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2 mb-4 p-3.5 bg-gray-50 rounded-xl text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-500 w-32">Câu trả lời của bạn:</span>
                          <span className={`font-semibold ${isCorrect ? "text-emerald-700" : "text-rose-600"}`}>
                            {userAns !== null ? String(userAns) : "(Chưa trả lời)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-500 w-32">Đáp án chính xác:</span>
                          <span className="font-bold text-emerald-700">{String(correctAnswer)}</span>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {explanation && (
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                        <Lightbulb size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-amber-800">Lời giải chi tiết:</p>
                          <p className="leading-relaxed">{explanation}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: PHÒNG THI / QUIZ SOLVING WORKSPACE
  // ==========================================
  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[Number(k)] !== undefined && answers[Number(k)] !== null && answers[Number(k)] !== ""
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 px-4 sm:px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/ai-test"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Thoát phòng thi"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1">{testSetName}</h1>
                {isRetryMistakes && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 uppercase">
                    Ôn lại câu sai
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Câu {currentIndex + 1} / {questions.length} • Đã làm: {answeredCount}/{questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Focus Mode Link */}
            <Link
              href={`/focus?quizId=${testSetId}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs sm:text-sm font-bold border border-amber-200 transition-colors"
              title="Chuyển sang Chế độ Tập trung chuyên sâu với đề thi này"
            >
              <Zap size={14} className="text-amber-600 fill-amber-600" />
              <span>Tập trung</span>
            </Link>

            {/* Live Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs sm:text-sm font-black border border-emerald-200">
              <Clock size={16} className="text-emerald-600 animate-pulse" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm shadow-emerald-600/20"
            >
              Nộp bài
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left: Question Card (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
            {/* Question Meta */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-[#1a3a2a] text-white text-xs font-black">
                  Câu {currentIndex + 1}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold">
                  {currentQ.type === "MULTIPLE_CHOICE"
                    ? "Trắc nghiệm"
                    : currentQ.type === "TRUE_FALSE"
                    ? "Đúng / Sai"
                    : currentQ.type === "FILL_BLANK"
                    ? "Điền từ"
                    : "Tự luận"}
                </span>
                <span className="text-xs text-gray-400">({currentQ.score} điểm)</span>
              </div>

              {/* Flag button */}
              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  flagged.has(currentQ.id)
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Flag size={14} className={flagged.has(currentQ.id) ? "fill-amber-500 text-amber-500" : ""} />
                {flagged.has(currentQ.id) ? "Đã đánh dấu" : "Đánh dấu"}
              </button>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed mb-8 whitespace-pre-wrap">
              {currentQ.content}
            </div>

            {/* Interactive Inputs by Question Type */}
            {currentQ.type === "MULTIPLE_CHOICE" && currentQ.options && (
              <div className="space-y-3">
                {Object.entries(currentQ.options).map(([optKey, optText]) => {
                  const isSelected = answers[currentQ.id] === optKey;
                  return (
                    <button
                      key={optKey}
                      onClick={() => handleSelectOption(currentQ.id, optKey)}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                          : "bg-white border-gray-200 hover:bg-gray-50/80 text-gray-800"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors ${
                          isSelected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {optKey}
                      </span>
                      <span className="text-sm sm:text-base font-medium leading-normal flex-1 pt-0.5">
                        {String(optText)}
                      </span>
                      {isSelected && <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === "TRUE_FALSE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "A", label: "Đúng (True)", isTrue: true },
                  { key: "B", label: "Sai (False)", isTrue: false },
                ].map((item) => {
                  const isSelected = answers[currentQ.id] === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelectOption(currentQ.id, item.key)}
                      className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 text-base font-bold transition-all ${
                        isSelected
                          ? item.isTrue
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                            : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                          : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {item.isTrue ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === "FILL_BLANK" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Đáp án của bạn:
                </label>
                <input
                  type="text"
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Nhập câu trả lời ngắn vào đây..."
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                />
              </div>
            )}

            {currentQ.type === "ESSAY" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Nội dung tự luận:
                </label>
                <textarea
                  rows={6}
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Trình bày chi tiết câu trả lời của bạn..."
                  className="w-full p-4 text-sm sm:text-base rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent leading-relaxed"
                />
                <p className="text-right text-xs text-gray-400">
                  {(answers[currentQ.id] || "").length} ký tự
                </p>
              </div>
            )}

            {/* Bottom Nav Controls */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} /> Câu trước
              </button>

              <div className="text-xs text-gray-400 hidden sm:block">
                Dùng phím <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">←</kbd>{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">→</kbd> hoặc{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">A, B, C, D</kbd>
              </div>

              {isLastQuestion ? (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-colors"
                >
                  Nộp bài <CheckCircle2 size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs sm:text-sm font-bold hover:bg-[#25523b] transition-colors"
                >
                  Câu tiếp <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Question Navigation Sidebar (1 col) */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-200 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Danh sách câu hỏi</h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {answeredCount}/{questions.length}
            </span>
          </div>

          {/* Grid Pills */}
          <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const hasAnswer =
                answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "";
              const isFlag = flagged.has(q.id);

              let pillStyle = "border-gray-200 text-gray-600 hover:bg-gray-50";
              if (isCurrent) {
                pillStyle = "bg-[#1a3a2a] text-white font-black border-[#1a3a2a] shadow-sm";
              } else if (isFlag) {
                pillStyle = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
              } else if (hasAnswer) {
                pillStyle = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl border flex items-center justify-center text-xs relative transition-all ${pillStyle}`}
                >
                  {idx + 1}
                  {isFlag && !isCurrent && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-4 mt-4 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#1a3a2a]" />
              <span>Đang làm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
              <span>Đã đánh dấu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md border border-gray-200" />
              <span>Chưa làm</span>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Xác nhận nộp bài?</h3>
              <p className="text-xs text-gray-500 mb-4">
                Bạn đã hoàn thành <strong>{answeredCount}</strong> / {questions.length} câu hỏi.
                {questions.length - answeredCount > 0 && (
                  <span className="block text-amber-600 font-semibold mt-1">
                    Còn {questions.length - answeredCount} câu chưa trả lời!
                  </span>
                )}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Làm tiếp
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
                >
                  {isSubmitting ? "Đang nộp..." : "Đồng ý nộp"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
