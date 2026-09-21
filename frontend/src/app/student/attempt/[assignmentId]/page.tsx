'use client';

import React, { useEffect, useState, use } from 'react';
import axios from 'axios';
import { Clock, Loader2, AlertTriangle, CheckCircle, ChevronRight, Trophy, BookOpen } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentAttemptPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { activeUser } = useStudy();
  const router = useRouter();

  useEffect(() => {
    const fetchAttemptData = async () => {
      try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/assignments/${assignmentId}/start`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = res.data;
        setAssignment(data.assignment);
        setQuestions(data.questions || []);
        setAttemptId(data.attempt.id);
        
        // Restore answers
        if (data.existingAnswers) {
          const restored: Record<number, any> = {};
          data.existingAnswers.forEach((ans: any) => {
            restored[ans.question_id] = typeof ans.selected_option === 'string' ? ans.selected_option.replace(/^"|"$/g, '') : ans.selected_option;
          });
          setAnswers(restored);
        }

        if (data.assignment.duration_minutes) {
          const startTime = new Date(data.attempt.start_time).getTime();
          const now = new Date().getTime();
          const elapsed = Math.floor((now - startTime) / 1000);
          const totalSeconds = data.assignment.duration_minutes * 60;
          const remaining = totalSeconds - elapsed;
          setTimeLeft(remaining > 0 ? remaining : 0);
        } else {
          setTimeLeft(-1); // No limit
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi tải bài tập! Vui lòng thử lại.');
        router.push('/student/assignments');
      }
    };

    if (activeUser && assignmentId) {
      fetchAttemptData();
    }
  }, [assignmentId, activeUser, router]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !loading && !isFinished) {
      handleSubmit();
    }
  }, [timeLeft, loading, isFinished]);

  const handleSelectAnswer = async (questionId: number, option: string) => {
    if (isFinished) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));

    if (attemptId) {
      try {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/attempts/${attemptId}/answers`, {
          answers: [{ question_id: questionId, selected_option: option }]
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } catch (err) {
        console.error('Lỗi auto-save', err);
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);
    
    try {
      const payloadAnswers = Object.entries(answers).map(([qId, opt]) => ({
        question_id: parseInt(qId),
        selected_option: opt
      }));

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/attempts/${attemptId}/submit`, {
        answers: payloadAnswers
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setIsSubmitting(false);
      setIsFinished(true);
      setResult({
        score: res.data.score,
        totalScore: 10
      });
    } catch (err) {
      console.error(err);
      alert('Lỗi nộp bài!');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 0) return 'Không giới hạn';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col justify-center items-center">
      <Loader2 className="animate-spin text-emerald-600 w-12 h-12 mb-4" />
      <p className="text-gray-500 font-medium">Đang chuẩn bị bài thi...</p>
    </div>
  );

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50"
          >
            <Trophy className="text-emerald-500 w-12 h-12" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2 font-display">Nộp bài thành công!</h2>
          <p className="text-gray-500 mb-8">Kết quả của bạn đã được lưu lại hệ thống.</p>
          
          <div className="bg-gray-50 rounded-2xl p-8 mb-8 border border-gray-100 relative overflow-hidden">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Điểm số đạt được</p>
            <div className="flex items-baseline justify-center">
              <span className="text-6xl font-bold text-emerald-600 font-display tracking-tighter">{result?.score}</span>
              <span className="text-2xl font-bold text-gray-400 ml-1">/ {result?.totalScore}</span>
            </div>
          </div>

          <button 
            onClick={() => router.push('/student/assignments')}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center group"
          >
            Quay lại danh sách
            <ChevronRight size={18} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;
  const isTimeCritical = timeLeft > 0 && timeLeft < 300; // less than 5 minutes

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa] flex flex-col overflow-hidden">
      {/* Top Navigation / Status Bar - Focus Mode */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm relative z-20 shrink-0">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mr-4 hidden md:flex">
            <BookOpen className="text-emerald-600" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 font-display">{assignment?.title}</h1>
            <div className="flex items-center mt-1">
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden mr-3">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-xs font-medium text-gray-500">
                {answeredCount} / {questions.length} câu đã trả lời
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className={`flex flex-col md:flex-row items-end md:items-center px-4 py-2 rounded-xl font-bold text-lg border ${
            isTimeCritical 
              ? 'bg-red-50 text-red-600 border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' 
              : 'bg-white text-gray-700 border-gray-200 shadow-sm'
          }`}>
            <Clock className="md:mr-2 mb-1 md:mb-0" size={20} />
            <span className="font-display tracking-tight">{formatTime(timeLeft)}</span>
          </div>
          
          <button 
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn nộp bài? Bạn không thể thay đổi sau khi nộp.')) {
                handleSubmit();
              }
            }}
            disabled={isSubmitting}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center shadow-sm hover:shadow-md transition-all"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            Nộp bài
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto w-full p-4 md:p-8 space-y-6 pb-40 pt-8">
          {questions.map((q, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={q.id} 
              id={`question-${q.id}`} 
              className={`bg-white rounded-2xl shadow-sm border p-6 md:p-8 transition-colors ${
                answers[q.id] ? 'border-emerald-200 ring-1 ring-emerald-500/10' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start mb-6">
                <span className={`flex-shrink-0 font-bold w-10 h-10 rounded-xl flex items-center justify-center mr-4 text-lg shadow-sm ${
                  answers[q.id] ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {idx + 1}
                </span>
                <div className="pt-1">
                  <p className="font-medium text-lg text-gray-900 leading-relaxed">{q.content}</p>
                  <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wider">{q.score} điểm</p>
                </div>
              </div>

              {q.type === 'MULTIPLE_CHOICE' && q.options && (
                <div className="space-y-3 md:ml-14">
                  {Object.entries(q.options).map(([key, val]: any) => (
                    <label 
                      key={key}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        answers[q.id] === key 
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' 
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors ${
                        answers[q.id] === key ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                      }`}>
                        {answers[q.id] === key && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <span className={`font-medium text-base ${answers[q.id] === key ? 'text-emerald-900' : 'text-gray-700'}`}>
                        <span className="font-bold mr-2 text-gray-400">{key}.</span> {val}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
