"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import RegisterModal from '@/components/auth/RegisterModal';
import PremiumModal from '@/components/layout/PremiumModal';
import { AnimatePresence } from 'framer-motion';

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
