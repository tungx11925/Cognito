'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, Users, Upload, LogOut, ChevronLeft, BookOpen } from 'lucide-react';

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/testhome'); // redirect to login page
    }
  }, [router]);

  if (!user) return null;

  // Render Sidebar
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link href="/testhome" className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors">
            <ChevronLeft size={20} className="mr-1" />
            <span className="font-medium text-sm">Về trang chủ</span>
          </Link>
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Building2 className="mr-2 text-blue-600" />
            Quản lý Trường học
          </h2>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/school" 
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/school' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <Building2 size={20} className="mr-3" />
                Tổng quan
              </Link>
            </li>
            <li>
              <Link 
                href="/school/classes" 
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/school/classes' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <Users size={20} className="mr-3" />
                Quản lý lớp học
              </Link>
            </li>
            <li>
              <Link 
                href="/school/students/import" 
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/school/students/import' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <Upload size={20} className="mr-3" />
                Nhập danh sách học sinh
              </Link>
            </li>
            <li>
              <Link 
                href="/school/assignments" 
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${pathname === '/school/assignments' ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}
              >
                <BookOpen size={20} className="mr-3" />
                Bài tập giao
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
