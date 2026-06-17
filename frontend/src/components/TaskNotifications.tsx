"use client";

import React, { useEffect, useState } from "react";
import { useStudy } from "@/context/StudyContext";
import { 
  Trophy, CheckCircle2, Target, BookOpen, Brain, 
  Sparkles, Clock, X, Flame, ChevronRight, Award
} from "lucide-react";

export const TaskNotifications: React.FC = () => {
  const {
    tasks,
    taskCompletionToast,
    setTaskCompletionToast,
    taskProgressToast,
    setTaskProgressToast,
    showDailyRecommendModal,
    setShowDailyRecommendModal,
    isAuthenticated
  } = useStudy();

  const [progressWidth, setProgressWidth] = useState(0);
  const [showProgressToast, setShowProgressToast] = useState(false);

  useEffect(() => {
    if (taskProgressToast) {
      // Set to previous progress first
      const prevPct = Math.min((taskProgressToast.previousValue / taskProgressToast.targetValue) * 100, 100);
      setProgressWidth(prevPct);
      setShowProgressToast(true);

      // Animate to new progress after a slight delay
      const animTimer = setTimeout(() => {
        const nextPct = Math.min((taskProgressToast.currentValue / taskProgressToast.targetValue) * 100, 100);
        setProgressWidth(nextPct);
      }, 150);

      // Auto dismiss
      const dismissTimer = setTimeout(() => {
        setShowProgressToast(false);
        // Clean up state in context after transition ends
        setTimeout(() => setTaskProgressToast(null), 500);
      }, 4500);

      return () => {
        clearTimeout(animTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [taskProgressToast, setTaskProgressToast]);

  if (!isAuthenticated) return null;

  // Helper to get task icon
  const getTaskIcon = (type: string) => {
    switch (type) {
      case "study_flashcards":
        return <Brain className="w-5 h-5 text-rose-500" />;
      case "read_document":
        return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case "practice_quiz":
        return <Target className="w-5 h-5 text-purple-500" />;
      case "study_time":
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Award className="w-5 h-5 text-blue-500" />;
    }
  };

  // Helper to format task current/target values
  const formatProgressText = (task: any) => {
    if (task.task_type === "study_time") {
      const currentMin = Math.round(task.current_value / 60);
      const targetMin = Math.round(task.target_value / 60);
      return `${currentMin}/${targetMin} phút`;
    }
    return `${task.current_value}/${task.target_value}`;
  };

  // Helper to format values for task progress toast
  const formatToastProgressText = (type: string, current: number, target: number) => {
    if (type === "study_time") {
      const currentMin = Math.round(current / 60);
      const targetMin = Math.round(target / 60);
      return `${currentMin}/${targetMin} phút`;
    }
    return `${current}/${target}`;
  };

  const getTaskProgressPct = (task: any) => {
    return Math.min((task.current_value / task.target_value) * 100, 100);
  };

  return (
    <>
      {/* ── 1. RIGHT-SIDE FLOATING TASK PROGRESS TOAST ── */}
      {taskProgressToast && (
        <div 
          className={`fixed bottom-6 right-6 z-[9999] w-80 bg-[#ebe8e0] border-3 border-[#1a2e1c] rounded-2xl p-4 shadow-[5px_5px_0px_0px_rgba(26,46,28,1)] transition-all duration-500 transform ${
            showProgressToast ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0 pointer-events-none"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black tracking-wider text-[#2d5a3d] uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-[#2d5a3d]/20 animate-pulse" /> Cập nhật tiến độ
            </span>
            <button 
              onClick={() => {
                setShowProgressToast(false);
                setTimeout(() => setTaskProgressToast(null), 500);
              }}
              className="text-[#1a2e1c]/60 hover:text-[#1a2e1c] bg-[#1a2e1c]/5 hover:bg-[#1a2e1c]/10 p-1 rounded-lg transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-white border-2 border-[#1a2e1c] rounded-xl shadow-[2px_2px_0px_0px_rgba(26,46,28,0.1)]">
              {getTaskIcon(taskProgressToast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-1">
                <span className="text-xs sm:text-sm font-black text-gray-800 truncate">
                  {taskProgressToast.title}
                </span>
                <span className="text-[10px] font-black text-[#2d5a3d] shrink-0">
                  {formatToastProgressText(taskProgressToast.type, taskProgressToast.currentValue, taskProgressToast.targetValue)}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">
                {taskProgressToast.description}
              </p>
              
              {/* Animated Progress bar */}
              <div className="mt-3 h-2 bg-white rounded-full overflow-hidden border-2 border-[#1a2e1c]">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
              
              {/* Percentage loading display */}
              <div className="mt-1 text-right text-[9px] font-black text-[#2d5a3d]/80">
                {Math.round(progressWidth)}% hoàn thành
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. DAILY RECOMMENDED TASKS MODAL (ON LOGIN) ── */}
      {showDailyRecommendModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#ebe8e0] border-3 border-[#1a2e1c] rounded-3xl shadow-[8px_8px_0px_0px_rgba(26,46,28,1)] overflow-hidden transform transition-all animate-scale-up">
            
            {/* Header */}
            <div className="bg-[#1a2e1c] p-6 text-white relative">
              <button 
                onClick={() => setShowDailyRecommendModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 flex items-center justify-center text-[#1a2e1c] shrink-0 shadow-sm">
                  <Flame className="w-6 h-6 fill-[#1a2e1c]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Nhiệm vụ khuyên dùng</h3>
                  <p className="text-xs text-emerald-300 font-semibold mt-0.5">Hoàn thành để nhận thêm nhiều điểm thưởng!</p>
                </div>
              </div>
            </div>

            {/* Content / Task list */}
            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Danh sách hôm nay
              </p>

              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const pct = getTaskProgressPct(task);
                    const isCompleted = task.is_completed;

                    return (
                      <div 
                        key={task.id} 
                        className={`p-3.5 bg-white border-2 border-[#1a2e1c] rounded-2xl transition-all shadow-[3px_3px_0px_0px_rgba(26,46,28,0.12)] flex items-start gap-3 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,46,28,0.18)] ${
                          isCompleted ? "border-emerald-600 bg-emerald-50/20" : ""
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {getTaskIcon(task.task_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <span className={`text-xs sm:text-sm font-bold text-gray-800 ${isCompleted ? "line-through text-gray-400" : ""}`}>
                              {task.title}
                            </span>
                            <span className={`text-[10px] font-black shrink-0 ${isCompleted ? "text-emerald-600" : "text-[#2d5a3d]"}`}>
                              {formatProgressText(task)}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">
                            {task.description}
                          </p>
                          
                          {/* Progress bar */}
                          <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted 
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                                  : "bg-[#2d5a3d]"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 self-center" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Fallback loading skeleton
                  <div className="py-10 text-center text-sm font-semibold text-gray-500">
                    Đang thiết lập nhiệm vụ cho hôm nay...
                  </div>
                )}
              </div>

              {/* Footer action */}
              <button 
                onClick={() => setShowDailyRecommendModal(false)}
                className="w-full mt-2 bg-[#1a2e1c] hover:bg-[#2d5a3d] text-white py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-0 transition-all cursor-pointer"
              >
                Bắt đầu học tập ngay
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
