'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, Users, FileText, LayoutDashboard, ChevronLeft, Video, Menu, X, GraduationCap } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeUser, loading } = useStudy();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!activeUser) {
      router.push('/testhome');
    }
  }, [activeUser, loading, router]);

  if (loading || !activeUser) return null;

  const navItems = [
    { name: 'Lớp học của tôi', href: '/teacher/classes', icon: LayoutDashboard },
    { name: 'Đề thi & Bài tập', href: '/teacher/exams', icon: FileText },
    { name: 'Studio Bài giảng', href: '/teacher/studio', icon: Video },
  ];

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-full shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-gray-100 shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight font-display">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3 shadow-sm">
              <GraduationCap className="text-white" size={18} />
            </div>
            Teacher Portal
          </h2>
        </div>

        <div className="px-4 py-3">
          <Link href="/testhome" className="flex items-center text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors p-2 rounded-md hover:bg-gray-50 group">
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Về trang chủ
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.includes(item.href);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'text-indigo-700 bg-indigo-50/80 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabTeacher" 
                    className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} className={`mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
              {activeUser.name?.charAt(0) || 'T'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{activeUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{activeUser.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fafafa]">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
