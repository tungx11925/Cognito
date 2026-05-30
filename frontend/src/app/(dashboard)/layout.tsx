"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStudy } from '../../context/StudyContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, FlaskConical, Timer, Settings,
  LogOut, Zap, Search, Bell, Plus, FileText, CreditCard, StickyNote, History,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'My Library', path: '/library' },
  { icon: FlaskConical, label: 'AI Lab', path: '/ai-lab' },
  { icon: Timer, label: 'Study Sessions', path: '/study-sessions' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, setIsLoggedIn, activeUser, triggerMessage, globalMessage, setShowLanding } = useStudy();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoggedIn) router.push('/');
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f3f4f6" }}>
        <div className="w-8 h-8 border-4 border-[#1a3a2a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === '/ai-lab') return pathname === '/ai-lab' || pathname === '/flashcards';
    return pathname === path;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden"
      style={{ background: "#f3f4f6", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Toast */}
      {globalMessage.text && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border ${
          globalMessage.type === 'success' ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-white text-rose-700 border-rose-200'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className="w-56 h-full flex flex-col flex-shrink-0"
        style={{ background: "#ffffff", borderRight: "1px solid #e5e7eb" }}>

        {/* Logo */}
        <div className="px-5 py-5 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a3a2a" }}>
              <Zap size={15} className="text-white" />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827", letterSpacing: "0.02em" }}>EduShare AI</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", letterSpacing: "0.06em" }}>Scholar Edition</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <Link key={path} href={path}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 cursor-pointer"
                  style={{ background: active ? "#e8f0eb" : "transparent", color: active ? "#1a3a2a" : "#6b7280" }}
                >
                  <Icon size={16} />
                  <span style={{ fontSize: "13.5px", fontWeight: active ? 600 : 500 }}>{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Pro upgrade card */}
        <div className="mx-3 mb-4 rounded-xl p-4" style={{ background: "#1a3a2a" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={12} style={{ color: "#86efac" }} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#86efac", letterSpacing: "0.08em" }}>PRO PLAN</span>
          </div>
          <p style={{ fontSize: "11px", color: "#6ee7b7", lineHeight: 1.5, marginBottom: "10px" }}>
            Unlock advanced SRS algorithms and unlimited decks.
          </p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-1.5 rounded-lg"
            style={{ fontSize: "12px", fontWeight: 600, background: "#ffffff", color: "#1a3a2a" }}>
            Upgrade to Pro
          </motion.button>
        </div>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={() => {
              setIsLoggedIn(false);
              setShowLanding(true);
              triggerMessage("Đăng xuất thành công! Hẹn gặp lại bạn.", "success");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150"
            style={{ color: "#9ca3af", fontSize: "13.5px" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
          >
            <LogOut size={15} />
            <span style={{ fontWeight: 500 }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* TopBar */}
        <div className="flex items-center gap-3 px-5 py-3 sticky top-0 z-10"
          style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>

          {/* Search */}
          <div className="relative" style={{ width: "220px" }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search decks, tags, or history..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg outline-none"
              style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151", fontSize: "12.5px" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#1a3a2a"; e.currentTarget.style.background = "#fff"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f3f4f6"; }}
            />
          </div>

          {/* Tab nav */}
          <div className="flex items-center gap-0.5">
            {[
              { icon: FileText, label: "Documents", path: "/library" },
              { icon: CreditCard, label: "Flashcards", path: "/flashcards" },
              { icon: StickyNote, label: "Notes", path: "/ai-lab" },
            ].map(({ icon: Icon, label, path }) => {
              const active = pathname === path;
              return (
                <Link key={path} href={path}>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150"
                    style={{ fontSize: "12.5px", fontWeight: active ? 600 : 500,
                      color: active ? "#1a3a2a" : "#6b7280", background: active ? "#e8f0eb" : "transparent" }}>
                    <Icon size={13} />{label}
                  </button>
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button className="p-1.5 rounded-lg transition-colors duration-150" style={{ color: "#9ca3af" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#374151")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
              <History size={16} />
            </button>
            <button className="relative p-1.5 rounded-lg transition-colors duration-150" style={{ color: "#9ca3af" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#374151")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} />
            </button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/library')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white"
              style={{ fontSize: "12.5px", fontWeight: 600, background: "#1a3a2a" }}>
              <Plus size={14} /> Create New
            </motion.button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white cursor-pointer flex-shrink-0"
              style={{ background: "#374151", fontSize: "11px", fontWeight: 700 }}
              title={`${activeUser.name} (${activeUser.email})`}>
              {activeUser.name.charAt(0)}
            </div>
          </div>
        </div>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
            style={{ background: "#f3f4f6" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutInner>{children}</DashboardLayoutInner>;
}
