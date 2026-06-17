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
