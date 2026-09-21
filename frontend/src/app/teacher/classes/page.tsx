'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, BookOpen, Clock, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { activeUser } = useStudy();

  useEffect(() => {
    const fetchMyClasses = async () => {
      if (!activeUser) return;
      try {
        const orgId = activeUser.primary_organization_id || '9873d6eb-901d-40ba-83ff-a128af55581b';
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/classes?teacher_id=${activeUser.id}`, {
          withCredentials: true
        });
        setClasses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyClasses();
  }, [activeUser]);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Lớp học của tôi</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-2xl">Danh sách các lớp bạn được phân công giảng dạy. Theo dõi tiến độ và quản lý bài tập của học sinh.</p>
      </motion.div>

      {classes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 rounded-2xl text-center flex flex-col items-center border border-dashed border-gray-200"
        >
          <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
            <Sparkles size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-display">Chưa có lớp học nào</h3>
          <p className="text-gray-500 mt-2 max-w-md">Bạn chưa được phân công giảng dạy lớp học nào trong học kỳ này. Vui lòng liên hệ Admin để được xếp lớp.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {classes.map(c => (
            <motion.div 
              key={c.id} 
              variants={item}
              className="glass-card rounded-2xl overflow-hidden group flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50/50 to-white/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] -z-0"></div>
                
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <h3 className="font-bold text-xl text-gray-900 font-display tracking-tight leading-tight line-clamp-2 pr-2">{c.name}</h3>
                  <span className="bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-semibold whitespace-nowrap">Đang học</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 mt-4 relative z-10">
                  <div className="bg-white p-1.5 rounded-md shadow-sm mr-2 text-indigo-500 ring-1 ring-black/5">
                    <BookOpen size={14} />
                  </div>
                  <span className="truncate font-medium">{c.subject_name || c.major_name || 'Môn học chung'}</span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between bg-white/50">
                <div className="flex justify-between items-center mb-6 px-1">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center text-gray-500 mb-1">
                      <Users size={14} className="mr-1.5" />
                      <span className="text-xs uppercase tracking-wider font-semibold">Học sinh</span>
                    </div>
                    <span className="text-base font-bold text-gray-900">--</span>
                  </div>
                  
                  <div className="w-px h-8 bg-gray-200"></div>
                  
                  <div className="flex flex-col items-center">
                    <div className="flex items-center text-gray-500 mb-1">
                      <Clock size={14} className="mr-1.5" />
                      <span className="text-xs uppercase tracking-wider font-semibold">Học kỳ</span>
                    </div>
                    <span className="text-base font-bold text-gray-900">HK1</span>
                  </div>
                </div>
                
                <Link 
                  href={`/teacher/classes/${c.id}`}
                  className="w-full flex items-center justify-center bg-indigo-50 text-indigo-700 py-3 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md"
                >
                  Vào lớp học
                  <ArrowRight size={18} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
