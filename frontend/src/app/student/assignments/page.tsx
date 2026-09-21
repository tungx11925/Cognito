'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen, Clock, Loader2, ArrowRight, CheckCircle, Target, Trophy, Flame } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { activeUser } = useStudy();

  useEffect(() => {
    // Fake data for now, would normally fetch from /api/school/assignments?student_id=...
    const fetchAssignments = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/my-assignments`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAssignments(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    if (activeUser) {
      fetchAssignments();
    }
  }, [activeUser]);

  if (loading) return (
    <div className="flex h-[60vh] justify-center items-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const completedCount = assignments.filter(a => a.status === 'SUBMITTED' || a.status === 'GRADED').length;
  const progressPercent = assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display tracking-tight">Bài tập & Kiểm tra</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-xl">Danh sách các bài tập bạn cần hoàn thành. Hãy duy trì chuỗi học tập để nhận thêm huy hiệu nhé!</p>
        </div>

        {/* Gamification Widget */}
        <div className="flex gap-4">
          <div className="glass-card px-4 py-2 rounded-xl flex items-center border border-orange-200/50 bg-gradient-to-br from-orange-50 to-white">
            <Flame className="text-orange-500 mr-2" size={20} />
            <div>
              <p className="text-xs text-orange-600/80 font-bold uppercase tracking-wider">Chuỗi</p>
              <p className="font-bold text-gray-900 font-display leading-tight">5 ngày</p>
            </div>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl flex items-center border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-white">
            <Trophy className="text-emerald-500 mr-2" size={20} />
            <div>
              <p className="text-xs text-emerald-600/80 font-bold uppercase tracking-wider">Hoàn thành</p>
              <p className="font-bold text-gray-900 font-display leading-tight">{completedCount}/{assignments.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      {assignments.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4 text-emerald-600 flex-shrink-0">
            <Target size={20} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-bold text-gray-700">Tiến độ khóa học</span>
              <span className="text-sm font-bold text-emerald-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full"
              ></motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {assignments.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-12 rounded-2xl text-center flex flex-col items-center border border-dashed border-emerald-200"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 ring-4 ring-white shadow-inner">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-display">Tuyệt vời!</h3>
          <p className="text-gray-500 mt-2">Bạn không có bài tập nào đang chờ xử lý.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {assignments.map((a, i) => {
            const isCompleted = a.status === 'SUBMITTED' || a.status === 'GRADED';
            const isOverdue = a.status === 'OVERDUE';
            
            return (
              <motion.div 
                variants={item}
                key={a.id} 
                className={`glass-card rounded-2xl overflow-hidden group flex flex-col relative transition-all duration-300 ${
                  isCompleted ? 'border border-gray-200/60 opacity-80' : 'hover:-translate-y-1 hover:shadow-lg border border-transparent ring-1 ring-emerald-500/10'
                }`}
              >
                {/* Decorative background glow */}
                {!isCompleted && (
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></div>
                )}
                
                <div className={`p-6 border-b border-gray-100 ${isCompleted ? 'bg-gray-50/50' : 'bg-gradient-to-br from-emerald-50/80 to-white/90'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`font-bold text-lg font-display truncate pr-2 ${isCompleted ? 'text-gray-600 line-through' : 'text-gray-900'}`} title={a.title}>
                      {a.title}
                    </h3>
                    
                    {isCompleted ? (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-bold flex items-center shadow-sm">
                        <CheckCircle size={12} className="mr-1" />
                        Đã nộp
                      </span>
                    ) : a.status === 'IN_PROGRESS' ? (
                      <span className="bg-blue-50 text-blue-600 ring-1 ring-blue-500/20 text-xs px-2.5 py-1 rounded-md font-bold shadow-sm">
                        Đang làm
                      </span>
                    ) : isOverdue ? (
                      <span className="bg-red-50 text-red-600 ring-1 ring-red-500/20 text-xs px-2.5 py-1 rounded-md font-bold shadow-sm flex items-center">
                        Quá hạn
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-bold shadow-sm">
                        Cần làm
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mt-3">
                    <div className="bg-white p-1 rounded-md shadow-sm border border-gray-100 mr-2">
                      <BookOpen size={14} className={isCompleted ? "text-gray-400" : "text-emerald-500"} />
                    </div>
                    <span className="truncate font-medium">{a.class_name}</span>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between bg-white/50">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">Hạn nộp</span>
                      <span className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {a.due_date ? new Date(a.due_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">Thời gian</span>
                      <div className="flex items-center font-bold text-gray-900">
                        <Clock size={14} className="mr-1.5 text-amber-500" />
                        <span className="text-sm">{a.duration_minutes || '∞'} phút</span>
                      </div>
                    </div>
                  </div>
                  
                  {isCompleted ? (
                    <div className="w-full flex items-center justify-center bg-gray-50 text-gray-500 px-4 py-3 rounded-xl font-bold border border-gray-200/60 shadow-sm">
                      Đã hoàn thành
                    </div>
                  ) : (
                    <Link 
                      href={`/student/attempt/${a.id}`}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 group-hover:scale-[1.02]"
                    >
                      Bắt đầu làm bài
                      <ArrowRight size={18} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
