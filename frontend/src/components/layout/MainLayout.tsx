"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/landing/Navbar';
import { AnimatePresence } from 'framer-motion';

const RegisterModal = dynamic(
  () => import('@/components/auth/RegisterModal'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  }
);

const PremiumModal = dynamic(
  () => import('@/components/layout/PremiumModal'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  }
);

export function MainLayout({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    showPremiumModal,
    setShowPremiumModal,
    activeUser,
    triggerMessage,
  } = useStudy();
  
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ee", color: "#0d1a14", overflowX: "hidden" }}>
      <Navbar 
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-20">
        {children}
      </main>

      <AnimatePresence>
        {showLoginModal && (
          <RegisterModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)} 
            triggerMessage={triggerMessage} 
          />
        )}
        {showPremiumModal && (
          <PremiumModal 
            isOpen={showPremiumModal} 
            onClose={() => setShowPremiumModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
