"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import DeckEditorForm from '@/components/flashcards/DeckEditorForm';
import { useStudy } from '@/context/StudyContext';

export default function EditDeckPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, activeUser } = useStudy();
  const deckId = params?.deckId ? parseInt(params.deckId as string, 10) : undefined;

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#121212]">
      <Navbar 
        isLoggedIn={isAuthenticated}
        onSignInClick={() => {}}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />
      <main className="w-full pt-16">
        {deckId ? (
          <DeckEditorForm initialDeckId={deckId} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            Không tìm thấy mã học phần hợp lệ.
          </div>
        )}
      </main>
    </div>
  );
}
