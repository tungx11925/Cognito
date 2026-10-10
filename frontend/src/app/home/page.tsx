"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { MarqueeSection } from '@/components/landing/MarqueeSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ProgressStatsSection } from '@/components/landing/ProgressStatsSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Phone, CheckCircle2, XCircle, Circle } from 'lucide-react';
import RegisterModal from '@/components/auth/RegisterModal';

function LandingPageContent() {
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    globalMessage,
    triggerMessage,
  } = useStudy();

  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeUser) {
      if (activeUser.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [isAuthenticated, activeUser, router]);

  const handleDemoScroll = () => {
    const element = document.getElementById('features');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-[#0B0F17] text-[#0d1a14] dark:text-zinc-100 overflow-x-hidden transition-colors duration-200" suppressHydrationWarning>
      
      {/* 🔔 Toast notifications */}
      {isMounted && globalMessage.text && (
        <div className={`fixed top-6 right-6 z-[99999] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 border transition-all duration-300 ${
          globalMessage.type === 'success' 
            ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
            : 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* RENDER NEW COMPONENTS WITH ORIGINAL PROPS */}
      <Navbar 
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />

      <HeroSection 
        onStartClick={() => {
          if (!isAuthenticated) setShowLoginModal(true);
          else router.push('/library');
        }}
        onDemoClick={handleDemoScroll}
      />

      <MarqueeSection />

      <StatsSection />

      <FeaturesSection />

      <ProgressStatsSection />

      <CtaSection 
        onStartClick={() => {
          if (!isAuthenticated) setShowLoginModal(true);
          else router.push('/library');
        }}
        onExploreClick={handleDemoScroll}
      />

      <AnimatePresence>
        {showLoginModal && (
          <RegisterModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)} 
            triggerMessage={triggerMessage} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}

export default function LandingPage() {
  return <LandingPageContent />;
}
