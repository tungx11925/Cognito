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
import { googleLogin } from '../services/auth.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Phone, CheckCircle2, XCircle, Circle } from 'lucide-react';
import RegisterModal from '../components/auth/RegisterModal';

function LandingPageContent() {
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    setActiveUser,
    globalMessage,
    triggerMessage,
    login: contextLogin,
    register: contextRegister
  } = useStudy();

  const router = useRouter();
  // Auto-redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleDemoScroll = () => {
    const element = document.getElementById('features');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ee", color: "#0d1a14", overflowX: "hidden" }}>
      
      {/* 🔔 Toast notifications */}
      {globalMessage.text && (
        <div className={`fixed top-6 right-6 z-[99999] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 border transition-all duration-300 ${
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
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/dashboard')}
        activeUser={activeUser!}
      />

      <HeroSection 
        onStartClick={() => {
          if (!isAuthenticated) setShowLoginModal(true);
          else router.push('/dashboard');
        }}
        onDemoClick={handleDemoScroll}
      />

      <MarqueeSection />

      <StatsSection />

      <FeaturesSection />

      <CtaSection 
        onStartClick={() => {
          if (!isAuthenticated) setShowLoginModal(true);
          else router.push('/dashboard');
        }}
        onExploreClick={handleDemoScroll}
      />

      <Footer />

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
