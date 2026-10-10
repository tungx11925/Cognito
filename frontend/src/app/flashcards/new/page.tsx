"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import DeckEditorForm from '@/components/flashcards/DeckEditorForm';
import { useStudy } from '@/context/StudyContext';

export default function NewDeckPage() {
  const router = useRouter();
  const { isAuthenticated, activeUser } = useStudy();

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#121212]">
      <Navbar 
        isLoggedIn={isAuthenticated}
        onSignInClick={() => {}}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />
      <main className="w-full pt-16">
        <DeckEditorForm />
      </main>
    </div>
  );
}
