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
    showDailyRecommendModal,
    setShowDailyRecommendModal,
    isAuthenticated
  } = useStudy();

  const [toastProgress, setToastProgress] = useState(70);
  const [showToast, setShowToast] = useState(false);

  // Trigger Toast animation when taskCompletionToast changes
  useEffect(() => {
    if (taskCompletionToast) {
      setToastProgress(50);
      setShowToast(true);
      
      // Animate progress bar to 100% after opening
      const timer1 = setTimeout(() => {
        setToastProgress(100);
      }, 300);

      // Hide toast after 5 seconds
      const timer2 = setTimeout(() => {
        setShowToast(false);
        // Clear global state after slide-out animation finishes
        setTimeout(() => {
          setTaskCompletionToast(null);
        }, 500);
      }, 5500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [taskCompletionToast, setTaskCompletionToast]);

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

  const getTaskProgressPct = (task: any) => {
    return Math.min((task.current_value / task.target_value) * 100, 100);
  };

  return (
    <>
      {/* ── 1. COMPLETED TASK TOAST (SLIDES IN FROM RIGHT) ── */}
      <div 
        className={`fixed top-20 right-5 z-[9999] w-80 bg-white border-2 border-[#1a2e1c] rounded-2xl shadow-[4px_4px_0px_0px_rgba(26,46,28,1)] overflow-hidden transition-all duration-500 ease-out transform ${
          showToast ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
        }`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 animate-bounce">
              <Trophy className="w-6 h-6 text-amber-500 fill-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-amber-600 tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Nhiệm vụ hoàn thành!
              </h4>
              <p className="text-sm font-bold text-gray-800 truncate mt-0.5">
                {taskCompletionToast?.title}
              </p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar animation */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1">
                {taskCompletionToast && getTaskIcon(taskCompletionToast.type)}
                Tiến độ
              </span>
              <span className={`transition-all duration-500 ${toastProgress === 100 ? "text-emerald-600 scale-110" : "text-[#2d5a3d]"}`}>
                {toastProgress === 100 ? "100% Hoàn thành! 🎉" : `${toastProgress}%`}
              </span>
            </div>
            
            <div className="h-3 bg-gray-100 rounded-full border border-gray-200 overflow-hidden relative">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400"
                style={{ width: `${toastProgress}%` }}
              />
              {toastProgress === 100 && (
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
            </div>
          </div>
        </div>
        
        {/* Glow accent bottom */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400" />
      </div>


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
