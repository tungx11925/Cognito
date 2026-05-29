"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { StudyContextProvider, useStudy } from '../../context/StudyContext';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, setIsLoggedIn, activeUser, triggerMessage, globalMessage, setShowLanding } = useStudy();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to landing page '/' if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0D2B24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    )},
    { name: 'My Library', path: '/library', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )},
    { name: 'AI Lab', path: '/ai-lab', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    )},
    { name: 'Study Sessions', path: '/study-sessions', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { name: 'Settings', path: '/settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  // Helper to determine if a menu path is active
  const isMenuItemActive = (itemPath: string) => {
    if (itemPath === '/ai-lab') {
      return pathname === '/ai-lab' || pathname === '/flashcards';
    }
    return pathname === itemPath;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0D2B24] flex font-sans selection:bg-[#0D2B24]/10 selection:text-[#0D2B24] relative">
      
      {/* Toast notifications */}
      {globalMessage.text && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 border transition-all duration-300 ${
          globalMessage.type === 'success' 
            ? 'bg-white text-emerald-700 border-emerald-200' 
            : 'bg-white text-rose-700 border-rose-200'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* 🧭 SIDE NAVIGATION (White background matching screenshot) */}
      <aside className="w-64 bg-white border-r border-[#0D2B24]/10 flex flex-col justify-between shrink-0 h-screen sticky top-0 py-6 px-4">
        <div className="space-y-8">
          {/* Logo brand */}
          <div className="flex items-center gap-2.5 px-3">
            <div className="bg-[#0D2B24] p-2.5 rounded-xl shadow-sm text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-[#0D2B24] uppercase">EduShare AI</h1>
              <p className="text-[9px] text-[#0D2B24]/50 font-bold uppercase tracking-wider">Scholar Edition</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const active = isMenuItemActive(item.path);
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                    active 
                      ? 'bg-[#FAF8F5] text-[#0D2B24] border border-[#0D2B24]/5' 
                      : 'text-[#0D2B24]/60 hover:text-[#0D2B24] hover:bg-[#FAF8F5]/50'
                  }`}
                >
                  <span className={active ? 'text-[#0D2B24]' : 'text-[#0D2B24]/60'}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer and Pro Plan card */}
        <div className="space-y-6">
          {/* Pro Plan Card */}
          <div className="bg-[#0D2B24] rounded-2xl p-4 text-white space-y-3 relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
            <div>
              <span className="text-[9px] font-black tracking-wider uppercase text-emerald-400 bg-white/10 px-2 py-0.5 rounded-full">PRO PLAN</span>
              <p className="text-[10px] text-white/80 leading-relaxed font-semibold mt-2.5">
                Unlock advanced SRS algorithms and unlimited decks.
              </p>
            </div>
            <button className="w-full bg-white hover:bg-slate-100 text-[#0D2B24] font-black text-[10px] py-2.5 rounded-xl transition shadow-sm">
              Upgrade to Pro
            </button>
          </div>

          {/* Logout button */}
          <button 
            onClick={() => {
              setIsLoggedIn(false);
              setShowLanding(true);
              triggerMessage("Đăng xuất thành công! Hẹn gặp lại bạn.", "success");
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-[#0D2B24]/60 hover:text-rose-600 font-bold text-xs transition-colors"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Outer Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 📡 HEADER */}
        <header className="h-16 border-b border-[#0D2B24]/10 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between shrink-0">
          
          {/* Left search */}
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#0D2B24]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search decks, tags, or history..." 
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#0D2B24]/10 rounded-xl text-[#0D2B24] text-xs focus:outline-none focus:border-[#0D2B24] transition-all placeholder:text-[#0D2B24]/30"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sub Navigation (Documents, Flashcards, Notes) */}
          <div className="flex items-center gap-6 text-xs font-bold text-[#0D2B24]/60 ml-8">
            <Link 
              href="/library" 
              className={`pb-1 border-b-2 transition-all ${pathname === '/library' ? 'text-[#0D2B24] border-[#0D2B24]' : 'border-transparent hover:text-[#0D2B24]'}`}
            >
              Documents
            </Link>
            <Link 
              href="/flashcards" 
              className={`pb-1 border-b-2 transition-all ${pathname === '/flashcards' ? 'text-[#0D2B24] border-[#0D2B24]' : 'border-transparent hover:text-[#0D2B24]'}`}
            >
              Flashcards
            </Link>
            <Link 
              href="/ai-lab" 
              className={`pb-1 border-b-2 transition-all ${pathname === '/ai-lab' ? 'text-[#0D2B24] border-[#0D2B24]' : 'border-transparent hover:text-[#0D2B24]'}`}
            >
              Notes
            </Link>
          </div>

          {/* Right Action & Profile info */}
          <div className="flex items-center gap-4.5">
            {/* Bell/notifications icon */}
            <button className="p-2 text-[#0D2B24]/60 hover:text-[#0D2B24] transition relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>

            {/* History icon */}
            <button className="p-2 text-[#0D2B24]/60 hover:text-[#0D2B24] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Create button */}
            <button 
              onClick={() => router.push('/library')}
              className="bg-[#0D2B24] text-white hover:bg-[#0D2B24]/90 text-xs font-black px-4.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create New
            </button>

            {/* Profile Avatar */}
            <div 
              className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#0D2B24]/10 flex items-center justify-center font-black text-xs text-[#0D2B24] shadow-sm select-none cursor-pointer"
              title={`${activeUser.name} (${activeUser.email})`}
            >
              {activeUser.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* 🖥️ MAIN CONTENT PANEL */}
        <main className="flex-1 overflow-y-auto bg-[#FAF8F5] p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutInner>{children}</DashboardLayoutInner>;
}
