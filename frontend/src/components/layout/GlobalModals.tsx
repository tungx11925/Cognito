"use client";

import React from 'react';
import { useStudy } from '@/context/StudyContext';
import PremiumModal from './PremiumModal';

export default function GlobalModals() {
  const { showPremiumModal, setShowPremiumModal } = useStudy();

  return (
    <>
      {showPremiumModal && (
        <PremiumModal 
          isOpen={showPremiumModal} 
          onClose={() => setShowPremiumModal(false)} 
        />
      )}
    </>
  );
}
