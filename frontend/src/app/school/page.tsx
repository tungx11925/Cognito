'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, Users, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { motion } from 'framer-motion';

export default function SchoolDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { activeUser, loading: authLoading } = useStudy();

  useEffect(() => {
    if (authLoading) return;
    if (!activeUser) {
      router.push('/');
    }
  }, [activeUser, authLoading, router]);

  const orgId = activeUser?.primary_organization_id || '9873d6eb-901d-40ba-83ff-a128af55581b';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}`, {
          withCredentials: true
        });
        setStats(res.data.stats);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Lỗi khi tải dữ liệu tổng quan');
      } finally {
        setLoading(false);
      }
    };
    
    if (orgId) {
      fetchStats();
    }
  }, [orgId]);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>;

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

  const statCards = [
    {
      title: 'Tổng học sinh',
      value: stats?.totalStudents || 0,
      subValue: `${stats?.activeStudents || 0} đang hoạt động`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Giáo viên',
      value: stats?.totalTeachers || 0,
      icon: GraduationCap,
      color: 'indigo'
    },
    {
      title: 'Lớp học',
      value: stats?.totalClasses || 0,
      icon: Building2,
      color: 'amber'
    },
    {
      title: 'Chuyên ngành',
      value: stats?.totalMajors || 0,
      icon: BookOpen,
      color: 'emerald'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tổng quan Hệ thống</h1>
        <p className="text-gray-500 mt-2 text-sm">Chào mừng trở lại. Đây là tình hình tổng quan của tổ chức.</p>
      </motion.div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={i} 
              variants={item}
              className="glass-card rounded-2xl p-6 relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-${stat.color}-500/10 rounded-full blur-xl group-hover:bg-${stat.color}-500/20 transition-colors duration-500`} />
              
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl shadow-sm ring-1 ring-${stat.color}-500/20`}>
                  <Icon size={22} />
                </div>
              </div>
              
              <div>
                <h3 className="text-3xl font-bold text-gray-900 font-display tracking-tight">{stat.value}</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{stat.title}</p>
                {stat.subValue && (
                  <p className="text-xs text-emerald-600 font-medium mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-md">
                    {stat.subValue}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Decorative empty state or chart placeholder for future */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 glass-card rounded-2xl p-8 border border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[300px]"
      >
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="text-gray-400" size={24} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Hoạt động gần đây</h3>
        <p className="text-gray-500 text-sm max-w-sm text-center">Các biểu đồ thống kê và luồng hoạt động chi tiết sẽ xuất hiện tại đây.</p>
      </motion.div>
    </div>
  );
}
