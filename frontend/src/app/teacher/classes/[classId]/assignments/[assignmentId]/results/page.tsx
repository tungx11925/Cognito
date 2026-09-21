'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Loader2, ArrowLeft, BarChart2, Users, Target, CheckCircle2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AssignmentResultsPage() {
  const { classId, assignmentId } = useParams();
  const router = useRouter();
  const { activeUser } = useStudy();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const orgId = (activeUser as any)?.memberships?.[0]?.organization_id || '9873d6eb-901d-40ba-83ff-a128af55581b';
      if (!orgId) return;

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/classes/${classId}/assignments/${assignmentId}/results`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setData(res.data);
      } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi tải kết quả!');
      } finally {
        setLoading(false);
      }
    };
    if (activeUser) fetchResults();
  }, [classId, assignmentId, activeUser]);

  if (loading) {
    return <div className="flex h-[60vh] justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Target size={48} className="text-gray-300 mb-4" />
      <p className="text-gray-500 font-medium">Không tìm thấy dữ liệu bài tập</p>
    </div>
  );

  const { assignment, attempts } = data;
  
  // Calculate stats
  const submittedAttempts = attempts.filter((a: any) => a.status === 'SUBMITTED' || a.status === 'GRADED');
  const avgScore = submittedAttempts.length > 0
    ? (submittedAttempts.reduce((sum: number, a: any) => sum + Number(a.score || 0), 0) / submittedAttempts.length).toFixed(2)
    : 0;
  
  const completionRate = attempts.length > 0 
    ? Math.round((submittedAttempts.length / attempts.length) * 100) 
    : 0;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center mb-8"
      >
        <button 
          onClick={() => router.back()}
          className="mr-5 p-2 bg-white text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-display">Phân tích Kết quả</h1>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span className="font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md mr-3">{assignment.title || 'Bài tập'}</span>
            <span className="flex items-center"><Target size={14} className="mr-1.5" /> ID: {assignment.id.substring(0,8)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
      >
        <motion.div variants={item} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="flex items-center mb-4 relative z-10">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3.5 rounded-xl text-blue-600 shadow-sm ring-1 ring-blue-500/10 mr-4">
              <CheckCircle2 size={24} />
            </div>
            <p className="font-semibold text-gray-600 uppercase tracking-wider text-xs">Đã Nộp / Tổng</p>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-bold text-gray-900 font-display">
              {submittedAttempts.length} <span className="text-xl font-medium text-gray-400">/ {attempts.length}</span>
            </p>
          </div>
        </motion.div>
        
        <motion.div variants={item} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="flex items-center mb-4 relative z-10">
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 p-3.5 rounded-xl text-emerald-600 shadow-sm ring-1 ring-emerald-500/10 mr-4">
              <Award size={24} />
            </div>
            <p className="font-semibold text-gray-600 uppercase tracking-wider text-xs">Điểm Trung Bình</p>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-bold text-gray-900 font-display">{avgScore}</p>
          </div>
        </motion.div>
        
        <motion.div variants={item} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
          <div className="flex items-center mb-4 relative z-10">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-3.5 rounded-xl text-purple-600 shadow-sm ring-1 ring-purple-500/10 mr-4">
              <BarChart2 size={24} />
            </div>
            <p className="font-semibold text-gray-600 uppercase tracking-wider text-xs">Tỷ Lệ Hoàn Thành</p>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-bold text-gray-900 font-display">
              {completionRate}<span className="text-2xl text-purple-600">%</span>
            </p>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl overflow-hidden shadow-soft"
      >
        <div className="p-6 border-b border-gray-100 bg-white/50 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 mr-3">
              <Users size={18} />
            </div>
            <h2 className="font-bold text-gray-900 text-lg font-display">Danh sách Nộp bài</h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Học sinh</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian nộp</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm số</th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-50">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Target size={32} className="text-gray-300 mb-3" />
                      <p>Chưa có học sinh nào nộp bài</p>
                    </div>
                  </td>
                </tr>
              ) : (
                attempts.map((a: any, i: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (i * 0.05) }}
                    key={a.id} 
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold mr-4 border border-indigo-200/50">
                          {a.student_name ? a.student_name.charAt(0) : 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{a.student_name || 'Sinh viên'}</p>
                          <p className="text-xs text-gray-500 font-medium">{a.student_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {a.status === 'SUBMITTED' || a.status === 'GRADED' ? (
                        <span className="px-3 py-1.5 inline-flex text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 shadow-sm">
                          Đã nộp
                        </span>
                      ) : a.status === 'IN_PROGRESS' ? (
                        <span className="px-3 py-1.5 inline-flex text-xs font-bold rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-500/20 shadow-sm">
                          Đang làm
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 inline-flex text-xs font-bold rounded-md bg-gray-100 text-gray-700 ring-1 ring-gray-500/20 shadow-sm">
                          {a.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                      {a.end_time ? (
                        <div className="flex flex-col">
                          <span>{new Date(a.end_time).toLocaleDateString('vi-VN')}</span>
                          <span className="text-xs text-gray-400">{new Date(a.end_time).toLocaleTimeString('vi-VN')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Chưa nộp</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {a.score !== null ? (
                        <div className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm">
                          {Number(a.score).toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
