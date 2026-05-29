"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudyContextProvider, useStudy } from '../context/StudyContext';

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

  // If already logged in, redirect automatically to the dashboard
  useEffect(() => {
    if (isLoggedIn) {
      router.push('/dashboard');
    }
  }, [isLoggedIn, router]);

  // Login Form submit handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setShowLoginModal(false);
    triggerMessage("Đăng nhập thành công! Chào mừng quay trở lại hệ thống học tập AI.", "success");
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0D2B24] flex flex-col font-sans selection:bg-[#0D2B24]/10 selection:text-[#0D2B24]">
      
      {/* 🔮 Background glows for premium look */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

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

      {/* HEADER */}
      <header className="border-b border-[#0D2B24]/10 bg-white/85 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="bg-[#0D2B24] p-2.5 rounded-xl shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#0D2B24]">EduShare AI</h1>
            <p className="text-[10px] text-[#0D2B24]/50 font-bold tracking-wider uppercase">Nền tảng học tập thông minh</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-bold text-[#0D2B24]/70">
          <a href="#features-section" className="hover:text-[#0D2B24] transition-colors">Documents</a>
          <a href="#features-section" className="hover:text-[#0D2B24] transition-colors">Flashcards</a>
          <a href="#features-section" className="hover:text-[#0D2B24] transition-colors">Notes</a>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-[#0D2B24] text-white hover:bg-[#0D2B24]/90 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              Go to Dashboard
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                {activeUser.name.charAt(0)}
              </span>
            </button>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-[#0D2B24] text-white hover:bg-[#0D2B24]/90 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 px-6 md:px-12 lg:px-24 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-[#0D2B24]/10 px-4 py-2 rounded-full shadow-sm text-xs font-bold text-[#0D2B24]/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              AI ANALYSIS ENGINE - SYSTEM ON-LINE
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif-elegant font-normal text-[#0D2B24] leading-[1.1] tracking-tight">
              The Operating System for <span className="italic font-normal">Intellectual Mastery.</span>
            </h2>

            <p className="text-base text-[#0D2B24]/70 leading-relaxed max-w-lg font-normal">
              Bridge the gap between complex documents and active recall using precision-engineered tools designed for the modern scholar.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => {
                  if (!isLoggedIn) setShowLoginModal(true);
                  else router.push('/dashboard');
                }}
                className="bg-[#0D2B24] hover:bg-[#0D2B24]/90 text-white font-extrabold text-xs px-6 py-4 rounded-xl shadow-md transition-all"
              >
                Start Learning Free
              </button>
              <button 
                onClick={() => {
                  const element = document.getElementById('features-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white hover:bg-[#FAF8F5] border border-[#0D2B24]/15 text-[#0D2B24] font-extrabold text-xs px-6 py-4 rounded-xl shadow-sm transition-all"
              >
                View Features
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center relative">
            <div className="relative w-full max-w-lg bg-[#0D2B24] rounded-3xl p-3 shadow-2xl transition-transform hover:scale-[1.01] duration-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 rounded-3xl pointer-events-none"></div>
              <div className="bg-[#081815] rounded-2xl overflow-hidden aspect-[4/3] border border-white/5 flex items-center justify-center relative">
                {/* Embedded SVG smart neural nodes illustration for premium tech look */}
                <svg className="w-full h-full p-8 text-emerald-500/20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3"/>
                  <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="0.5"/>
                  <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="0.5"/>
                  <path d="M100 20v160M20 100h160M43 43l114 114M43 157L157 43" stroke="currentColor" strokeWidth="0.25"/>
                  <circle cx="100" cy="20" r="5" fill="#10b981"/>
                  <circle cx="100" cy="180" r="5" fill="#10b981"/>
                  <circle cx="20" cy="100" r="5" fill="#10b981"/>
                  <circle cx="180" cy="100" r="5" fill="#10b981"/>
                  <circle cx="43" cy="43" r="5" fill="#10b981"/>
                  <circle cx="157" cy="157" r="5" fill="#10b981"/>
                  {/* Glowing core */}
                  <circle cx="100" cy="100" r="10" fill="#10b981" className="animate-pulse"/>
                </svg>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#081815_90%)] pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features-section" className="py-24 px-6 md:px-12 lg:px-24 bg-white border-t border-[#0D2B24]/10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h3 className="text-3xl font-serif-elegant font-normal text-[#0D2B24]">
              Engineered for Deep Work
            </h3>
            <p className="text-xs text-[#0D2B24]/60 leading-relaxed font-semibold">
              Removing friction from the learning process through architectural precision and academic rigor.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-[220px] lg:auto-rows-[180px]">
            <div className="lg:col-span-6 lg:row-span-2 bg-[#FAF8F5] border border-[#0D2B24]/10 rounded-3xl p-8 flex flex-col justify-between shadow-premium transition-all hover:shadow-premium-hover">
              <div className="space-y-4">
                <div className="inline-flex bg-[#0D2B24] p-3 rounded-2xl text-white shadow-md">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-lg font-serif-elegant font-bold text-[#0D2B24]">Precision AI Analysis</h4>
                <p className="text-xs text-[#0D2B24]/70 leading-relaxed font-normal">
                  Extract key concepts and semantic maps from your documents. Our models identify knowledge gaps with surgical precision, automating the heavy lifting of comprehension.
                </p>
              </div>
              <div className="space-y-2.5 pt-4">
                <div className="h-2 bg-[#0D2B24]/10 rounded-full w-2/3"></div>
                <div className="h-2 bg-[#0D2B24]/5 rounded-full w-1/2"></div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#0D2B24] text-white rounded-3xl p-8 flex items-center justify-between shadow-premium hover:translate-y-[-4px] transition-all duration-300">
              <div className="space-y-3 max-w-[70%]">
                <h4 className="text-lg font-serif-elegant font-bold">Smart Flashcards (SRS)</h4>
                <p className="text-xs text-white/70 leading-relaxed font-normal">
                  Automated active recall lists generated directly from your notes using advanced spacing algorithms.
                </p>
              </div>
              <div className="bg-white/10 p-5 rounded-2xl text-white shadow-inner flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white border border-[#0D2B24]/10 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-premium hover:translate-y-[-4px] transition-all duration-300">
              <div className="relative w-20 h-20 rounded-full border-2 border-emerald-500/10 flex items-center justify-center bg-[#FAF8F5] shadow-inner">
                <div className="absolute inset-0 rounded-full border-2 border-[#0D2B24] border-t-transparent animate-spin opacity-45"></div>
                <span className="text-sm font-mono font-extrabold text-[#0D2B24]">25:00</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#0D2B24]">Focus Flow</h4>
                <p className="text-[9px] text-[#0D2B24]/40 font-bold uppercase tracking-widest">POMODORO ENGINE</p>
              </div>
            </div>

            <div className="lg:col-span-3 bg-[#081815] text-white border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-premium hover:translate-y-[-4px] transition-all duration-300">
              <div className="bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-serif-elegant font-bold text-white">Collective AI Labs</h4>
                <p className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-widest">STUDY SESSIONS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="bg-[#FAF8F5] border-y border-[#0D2B24]/10 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#0D2B24]/10">
          <div className="space-y-2 py-4 md:py-0">
            <h4 className="text-3xl font-serif-elegant font-bold text-[#0D2B24]">500k+</h4>
            <p className="text-[10px] text-[#0D2B24]/50 font-bold uppercase tracking-widest">Scholars</p>
          </div>
          <div className="space-y-2 py-4 md:py-0">
            <h4 className="text-3xl font-serif-elegant font-bold text-[#0D2B24]">12M+</h4>
            <p className="text-[10px] text-[#0D2B24]/50 font-bold uppercase tracking-widest">Cards Generated</p>
          </div>
          <div className="space-y-2 py-4 md:py-0">
            <h4 className="text-3xl font-serif-elegant font-bold text-[#0D2B24]">98%</h4>
            <p className="text-[10px] text-[#0D2B24]/50 font-bold uppercase tracking-widest">Recall Success</p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto bg-[#0D2B24] rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-2xl mx-auto space-y-8 relative z-10">
            <h3 className="text-3xl md:text-4xl font-serif-elegant font-normal leading-tight">
              Elevate your academic performance today.
            </h3>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              Join the global network of researchers and students using EduShare AI to master complex domains in record time.
            </p>
            <button 
              onClick={() => {
                if (!isLoggedIn) setShowLoginModal(true);
                else router.push('/dashboard');
              }}
              className="bg-white hover:bg-slate-100 text-[#0D2B24] font-extrabold text-xs px-6 py-4 rounded-xl shadow-md transition-all"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#0D2B24]/10 py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-sm font-black tracking-tight text-[#0D2B24] uppercase">EduShare AI</h4>
              <p className="text-xs text-[#0D2B24]/60 leading-relaxed font-normal max-w-sm">
                Developing high-performance learning environments for the next generation of collective intelligence.
              </p>
            </div>
            <div className="md:col-span-8 grid grid-cols-3 gap-8">
              <div className="space-y-4 text-left">
                <h5 className="text-[10px] font-extrabold text-[#0D2B24]/40 uppercase tracking-widest">Product</h5>
                <ul className="space-y-2 text-xs font-semibold text-[#0D2B24]/70">
                  <li><a href="#" className="hover:text-[#0D2B24]">Features</a></li>
                  <li><a href="#" className="hover:text-[#0D2B24]">Pricing</a></li>
                </ul>
              </div>
              <div className="space-y-4 text-left">
                <h5 className="text-[10px] font-extrabold text-[#0D2B24]/40 uppercase tracking-widest">Resources</h5>
                <ul className="space-y-2 text-xs font-semibold text-[#0D2B24]/70">
                  <li><a href="#" className="hover:text-[#0D2B24]">Documentation</a></li>
                  <li><a href="#" className="hover:text-[#0D2B24]">Guides</a></li>
                </ul>
              </div>
              <div className="space-y-4 text-left">
                <h5 className="text-[10px] font-extrabold text-[#0D2B24]/40 uppercase tracking-widest">Company</h5>
                <ul className="space-y-2 text-xs font-semibold text-[#0D2B24]/70">
                  <li><a href="#" className="hover:text-[#0D2B24]">About</a></li>
                  <li><a href="#" className="hover:text-[#0D2B24]">Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>

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
