"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '../context/StudyContext';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { MarqueeSection } from '../components/landing/MarqueeSection';
import { StatsSection } from '../components/landing/StatsSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { CtaSection } from '../components/landing/CtaSection';
import { Footer } from '../components/landing/Footer';
import { login, googleLogin } from '../services/auth.service';
// Dashboard shell imports
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, FlaskConical, Timer, Settings,
  LogOut, Zap, Search, Bell, Plus, FileText, CreditCard,
  StickyNote, History, User, TrendingUp, Target, Flame,
  Clock, CheckCircle2, ArrowRight,
} from 'lucide-react';

// ─── Inline Dashboard Shell (shown when logged in) ────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'My Library', path: '/library' },
  { icon: FlaskConical, label: 'AI Lab', path: '/ai-lab' },
  { icon: Timer, label: 'Study Sessions', path: '/study-sessions' },
  { icon: Settings, label: 'Settings', path: '/profile?tab=Bảo mật' },
];

const STATS = [
  { label: 'Total Cards', value: '1,248', change: '+24 this week', icon: BookOpen, color: '#1a3a2a' },
  { label: 'Mastered', value: '847', change: '67% of total', icon: CheckCircle2, color: '#16a34a' },
  { label: 'Streak', value: '12 days', change: 'Personal best: 21', icon: Flame, color: '#ea580c' },
  { label: 'Study Time', value: '4h 32m', change: 'This week', icon: Clock, color: '#2563eb' },
];

const REVIEWS = [
  { deck: 'Advanced Algorithms', due: 42, time: 'Now' },
  { deck: 'System Design', due: 12, time: 'Now' },
  { deck: 'Network Security', due: 0, time: 'Tomorrow' },
  { deck: 'Data Science', due: 0, time: 'In 3 days' },
];

function DashboardShell() {
  const {
    isLoggedIn, setIsLoggedIn, activeUser,
    triggerMessage, globalMessage, setShowLanding,
    setIsProfileModalOpen, setProfileModalTab,
  } = useStudy();
  const router = useRouter();
  const [showAvatar, setShowAvatar] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [activePath, setActivePath] = React.useState('/dashboard');

  const DECKS = [
    { name: 'Advanced Algorithms', val: 68 },
    { name: 'Network Security', val: 92 },
    { name: 'System Design', val: 24 },
    { name: 'Data Science Fundamentals', val: 100 },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#f5f3ee', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Toast */}
      {globalMessage.text && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border ${
          globalMessage.type === 'success' ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-white text-rose-700 border-rose-200'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-56 h-full flex flex-col flex-shrink-0" style={{ background: '#FAF8F5', borderRight: '1px solid rgba(26,61,40,0.1)' }}>
        <div className="px-5 py-5 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: '#1a3d28' }}>
              <span style={{ color: '#f5f3ee', fontWeight: 800, fontSize: '0.8rem' }}>E</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1a14', letterSpacing: '0.02em' }}>EduShare AI</div>
              <div style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '0.06em' }}>Scholar Edition</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = activePath === path.split('?')[0];
            return (
              <Link key={path} href={path} onClick={() => setActivePath(path.split('?')[0])}>
                <motion.div whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150"
                  style={{ background: active ? 'rgba(26,61,40,0.1)' : 'transparent', color: active ? '#1a3d28' : '#6b7280' }}>
                  <Icon size={16} />
                  <span style={{ fontSize: '13.5px', fontWeight: active ? 700 : 500 }}>{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 mb-4 rounded-xl p-4" style={{ background: '#1a3d28' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={12} style={{ color: '#86efac' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#86efac', letterSpacing: '0.08em' }}>PRO PLAN</span>
          </div>
          <p style={{ fontSize: '11px', color: '#6ee7b7', lineHeight: 1.5, marginBottom: '10px' }}>
            Unlock advanced SRS algorithms and unlimited decks.
          </p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-1.5 rounded-lg"
            style={{ fontSize: '12px', fontWeight: 600, background: '#f5f3ee', color: '#1a3d28' }}>
            Upgrade to Pro
          </motion.button>
        </div>

        <div className="px-3 pb-4">
          <button
            onClick={() => { setIsLoggedIn(false); triggerMessage('Đăng xuất thành công! Hẹn gặp lại.', 'success'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af', fontSize: '13.5px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
          >
            <LogOut size={15} /><span style={{ fontWeight: 500 }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        <div className="flex items-center gap-3 px-5 py-3 sticky top-0 z-10"
          style={{ background: 'rgba(245,243,238,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(26,61,40,0.1)' }}>
          <div className="relative" style={{ width: '220px' }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm tài liệu, flashcard..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg outline-none"
              style={{ background: 'rgba(26,61,40,0.06)', border: '1px solid rgba(26,61,40,0.12)', color: '#0d1a14', fontSize: '12.5px' }} />
          </div>

          <div className="flex items-center gap-0.5">
            {[{ icon: FileText, label: 'Tài liệu', path: '/library' },
              { icon: CreditCard, label: 'Flashcards', path: '/flashcards' },
              { icon: StickyNote, label: 'Ghi chú', path: '/ai-lab' },
            ].map(({ icon: Icon, label, path }) => (
              <Link key={path} href={path}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-[rgba(26,61,40,0.07)]"
                  style={{ fontSize: '12.5px', fontWeight: 500, color: '#4b5563' }}>
                  <Icon size={13} />{label}
                </button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="p-1.5 rounded-lg hover:bg-[rgba(26,61,40,0.07)]" style={{ color: '#6b7280' }}><History size={16} /></button>
            <button className="relative p-1.5 rounded-lg hover:bg-[rgba(26,61,40,0.07)]" style={{ color: '#6b7280' }}>
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }} />
            </button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/library')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white"
              style={{ fontSize: '12.5px', fontWeight: 600, background: '#1a3d28' }}>
              <Plus size={14} /> Tạo mới
            </motion.button>

            <div className="relative">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowAvatar(!showAvatar)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white cursor-pointer shadow-sm"
                style={{ background: '#1a3d28', fontSize: '11px', fontWeight: 700, border: '2px solid rgba(26,61,40,0.2)' }}>
                {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'U'}
              </motion.div>
              <AnimatePresence>
                {showAvatar && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAvatar(false)} />
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50"
                      style={{ transformOrigin: 'top right' }}>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-900 truncate">{activeUser.name || 'User'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{activeUser.email}</p>
                      </div>
                      <div onClick={() => { setIsProfileModalOpen(true); setProfileModalTab('profile'); setShowAvatar(false); }}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer transition-colors">
                        <User size={13} /><span>Trang cá nhân</span>
                      </div>
                      <div onClick={() => { setIsProfileModalOpen(true); setProfileModalTab('settings'); setShowAvatar(false); }}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer transition-colors">
                        <Settings size={13} /><span>Cài đặt</span>
                      </div>
                      <div className="border-t border-gray-100 my-1" />
                      <div onClick={() => { setShowAvatar(false); setIsLoggedIn(false); triggerMessage('Đăng xuất thành công!', 'success'); }}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors">
                        <LogOut size={13} /><span>Đăng xuất</span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 style={{ color: '#0d1a14', marginBottom: '4px', fontSize: '22px', fontWeight: 700 }}>Dashboard</h1>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Chào mừng trở lại, {activeUser.name?.split(' ')[0] || 'bạn'}! Đây là tổng quan học tập của bạn.</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {STATS.map(({ label, value, change, icon: Icon, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(26,61,40,0.1)', boxShadow: '0 1px 4px rgba(13,26,20,0.05)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0d1a14', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{change}</div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl" style={{ background: '#fff', border: '1px solid rgba(26,61,40,0.1)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(26,61,40,0.06)' }}>
              <div className="flex items-center gap-2">
                <Target size={15} style={{ color: '#1a3d28' }} />
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0d1a14' }}>Sắp đến hạn ôn tập</span>
              </div>
              <button style={{ fontSize: '12px', color: '#1a3d28', fontWeight: 600 }}>Xem tất cả →</button>
            </div>
            {REVIEWS.map((row, i) => (
              <div key={row.deck} className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: i < REVIEWS.length - 1 ? '1px solid rgba(26,61,40,0.04)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: row.due > 0 ? '#dc2626' : '#d1d5db' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{row.deck}</span>
                </div>
                <div className="flex items-center gap-4">
                  {row.due > 0 && <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 700, background: '#fef2f2', color: '#dc2626' }}>{row.due} due</span>}
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{row.time}</span>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                    style={{ fontSize: '12px', fontWeight: 600, background: row.due > 0 ? '#1a3d28' : 'rgba(26,61,40,0.08)', color: row.due > 0 ? '#f5f3ee' : '#6b7280' }}>
                    {row.due > 0 ? 'Ôn tập' : 'Xem'} <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(26,61,40,0.1)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} style={{ color: '#1a3d28' }} />
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0d1a14' }}>Tiến độ học tập</span>
            </div>
            <div className="space-y-4">
              {DECKS.map(({ name, val }, i) => (
                <div key={name}>
                  <div className="flex justify-between mb-1.5">
                    <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1a3d28' }}>{val}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(26,61,40,0.1)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full" style={{ background: '#1a3d28' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


// ─── Landing Page (shown when logged out) ─────────────────────────────────────

function LandingPageContent() {
  const {
    isLoggedIn,
    setIsLoggedIn,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    setActiveUser,
    logout,
    globalMessage,
    triggerMessage,
  } = useStudy();

  const router = useRouter();

  // Load Google GSI Client Script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('google-jssdk')) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.id = 'google-jssdk';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      const googleToken = response.credential;
      const res = await googleLogin(googleToken);
      if (res && res.user) {
        if (res.token) {
          localStorage.setItem('token', res.token);
        }
        setActiveUser(res.user);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        triggerMessage("Đăng nhập bằng Google thành công!", "success");
      } else {
        triggerMessage(res.error || "Không thể đăng nhập bằng Google", "error");
      }
    } catch (err: any) {
      triggerMessage("Lỗi kết nối khi đăng nhập Google", "error");
    }
  };

  useEffect(() => {
    if (showLoginModal && typeof window !== 'undefined') {
      const initGoogle = () => {
        // @ts-ignore
        if (window.google) {
          // @ts-ignore
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '972875462398-hfat49fdkf7btf309jsn7mgsvglju6nv.apps.googleusercontent.com',
            callback: handleGoogleCredentialResponse,
          });
          // @ts-ignore
          window.google.accounts.id.renderButton(
            document.getElementById("googleSignInButton"),
            { theme: "outline", size: "large", width: 382, text: "signin_with" }
          );
        } else {
          setTimeout(initGoogle, 200);
        }
      };
      
      setTimeout(initGoogle, 100);
    }
  }, [showLoginModal]);


  // When logged in show the unified dashboard shell instead of the landing page
  if (isLoggedIn) return <DashboardShell />;

  // Login Form submit handler
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await login({ email, password });
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        setActiveUser(res.user);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        triggerMessage("Đăng nhập thành công! Chào mừng quay trở lại hệ thống học tập AI.", "success");
      } else {
        triggerMessage(res.error || "Tài khoản hoặc mật khẩu không chính xác", "error");
      }
    } catch (err) {
      triggerMessage("Lỗi kết nối đến máy chủ", "error");
    }
  };


  const handleDemoScroll = () => {
    const element = document.getElementById('features');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ee", color: "#0d1a14", overflowX: "hidden" }}>
      
      {/* 🔔 Toast notifications */}
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

      {/* RENDER NEW COMPONENTS WITH ORIGINAL PROPS */}
      <Navbar 
        isLoggedIn={isLoggedIn}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/dashboard')}
        onLogout={logout}
        activeUser={activeUser}
      />

      <HeroSection 
        onStartClick={() => {
          if (!isLoggedIn) setShowLoginModal(true);
          else router.push('/dashboard');
        }}
        onDemoClick={handleDemoScroll}
      />

      <MarqueeSection />

      <StatsSection />

      <FeaturesSection />

      <CtaSection 
        onStartClick={() => {
          if (!isLoggedIn) setShowLoginModal(true);
          else router.push('/dashboard');
        }}
        onExploreClick={handleDemoScroll}
      />

      <Footer />

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-[#0D2B24]/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 bg-white border border-[#0D2B24]/10 rounded-3xl shadow-lg space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="flex justify-between items-center">
                <div className="inline-flex bg-[#0D2B24] p-4 rounded-2xl shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="text-[#0D2B24]/40 hover:text-[#0D2B24] transition p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[#0D2B24] mt-4 uppercase">EduShare AI</h1>
              <p className="text-xs text-[#0D2B24]/60 font-semibold">Đăng nhập tài khoản học viên để bắt đầu học tập</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D2B24]/60 uppercase tracking-wider pl-1">Email Học viên</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  defaultValue="hocvien@edushare.com"
                  className="w-full px-4 py-3.5 bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] focus:ring-1 focus:ring-[#0D2B24] text-sm text-[#0D2B24] rounded-xl focus:outline-none transition-all placeholder:text-[#0D2B24]/30"
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D2B24]/60 uppercase tracking-wider pl-1">Mật khẩu</label>
                <input 
                  type="password" 
                  name="password"
                  required
                  defaultValue="user123"
                  className="w-full px-4 py-3.5 bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] focus:ring-1 focus:ring-[#0D2B24] text-sm text-[#0D2B24] rounded-xl focus:outline-none transition-all placeholder:text-[#0D2B24]/30"
                  placeholder="••••••••"
                />
              </div>


              <button 
                type="submit" 
                className="w-full py-3.5 bg-[#0D2B24] hover:bg-[#0D2B24]/90 text-white font-extrabold text-sm rounded-xl transition-all duration-300 shadow-md"
              >
                Đăng Nhập Hệ Thống
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#0D2B24]/10"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-[#0D2B24]/40 uppercase tracking-wider">Hoặc</span>
              <div className="flex-grow border-t border-[#0D2B24]/10"></div>
            </div>

            <div className="flex justify-center">
              <div id="googleSignInButton" className="w-full flex justify-center"></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LandingPage() {
  return <LandingPageContent />;
}
