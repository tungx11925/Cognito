'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Loader2, ArrowLeft, BookOpen, Clock, Users, BarChart, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ClassDetailsPage() {
  const { classId } = useParams();
  const router = useRouter();
  const { activeUser } = useStudy();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassData = async () => {
      const orgId = activeUser?.memberships?.[0]?.organization_id || '9873d6eb-901d-40ba-83ff-a128af55581b';
      if (!orgId) return;

      try {
        const [classesRes, rosterRes, assignmentsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/classes`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/classes/${classId}/roster`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/classes/${classId}/assignments`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        ]);
        
        const currentClass = classesRes.data.find((c: any) => c.id === classId);
        setClassInfo(currentClass);
        setRoster(rosterRes.data);
        setAssignments(assignmentsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (activeUser) fetchClassData();
  }, [classId, activeUser]);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
      >
        <button 
          onClick={() => router.back()} 
          className="mr-5 p-2.5 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display tracking-tight">{classInfo?.name || 'Chi tiết lớp học'}</h1>
          <div className="flex items-center mt-2 space-x-4">
            <span className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg font-medium">
              <BookOpen size={14} className="mr-2 text-indigo-500" />
              {classInfo?.subject_name || classInfo?.major_name || 'Môn học'}
            </span>
            <span className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg font-medium">
              <Users size={14} className="mr-2 text-blue-500" />
              {roster.length} Học sinh
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 bg-white/50 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 mr-3 ring-1 ring-indigo-500/20">
                  <BookOpen size={20} />
                </div>
                <h2 className="font-bold text-gray-900 text-xl font-display">Bài tập đã giao</h2>
              </div>
            </div>
            
            <div className="divide-y divide-gray-50 bg-white/50">
              {assignments.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <BookOpen size={24} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Lớp chưa có bài tập nào được giao.</p>
                </div>
              ) : (
                assignments.map((asg, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (index * 0.1) }}
                    key={asg.id} 
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/80 transition-colors group"
                  >
                    <div className="mb-4 sm:mb-0">
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{asg.title || asg.test_set_name || 'Bài tập'}</h3>
                      <div className="flex flex-wrap items-center mt-2 text-sm text-gray-500 gap-3">
                        <span className="flex items-center bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100">
                          <Clock size={14} className="mr-1.5 text-amber-500" /> 
                          {asg.duration_minutes ? `${asg.duration_minutes} phút` : 'Không giới hạn'}
                        </span>
                        <span className="flex items-center bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100">
                          Hạn: {asg.due_date ? new Date(asg.due_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                        </span>
                      </div>
                    </div>
                    <Link 
                      href={`/teacher/classes/${classId}/assignments/${asg.id}/results`}
                      className="flex items-center px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm"
                    >
                      <BarChart size={16} className="mr-2" /> 
                      Xem kết quả
                      <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl overflow-hidden sticky top-6"
          >
            <div className="p-6 border-b border-gray-100 bg-white/50 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 mr-3 ring-1 ring-blue-500/20">
                  <Users size={20} />
                </div>
                <h2 className="font-bold text-gray-900 text-xl font-display">Danh sách lớp</h2>
              </div>
            </div>
            
            <div className="divide-y divide-gray-50 bg-white/50 max-h-[600px] overflow-y-auto">
              {roster.length === 0 ? (
                <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                  <Users size={32} className="text-gray-300 mb-3" />
                  <p>Chưa có học sinh trong lớp</p>
                </div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show">
                  {roster.map(student => (
                    <motion.div variants={item} key={student.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold mr-4 border border-blue-200">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{student.student_code || student.email}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
