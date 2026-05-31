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

function LandingPageContent() {
  const {
    isLoggedIn,
    setIsLoggedIn,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    globalMessage,
    triggerMessage
  } = useStudy();

  const router = useRouter();

  // If already logged in, do NOT redirect automatically to the dashboard
  // useEffect(() => {
  //   if (isLoggedIn) {
  //     router.push('/dashboard');
  //   }
  // }, [isLoggedIn, router]);

  // Login Form submit handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setShowLoginModal(false);
    triggerMessage("Đăng nhập thành công! Chào mừng quay trở lại hệ thống học tập AI.", "success");
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
                  required
                  defaultValue="password123"
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
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return <LandingPageContent />;
}
