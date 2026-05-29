"use client";

import React, { useState } from 'react';
import { useStudy } from '../../../context/StudyContext';

export default function FlashcardsPage() {
  const {
    decks,
    activeDeck,
    setActiveDeck,
    activeDeckCards,
    currentCardIndex,
    isCardFlipped,
    setIsCardFlipped,
    generatingFC,
    handleGenerateFlashcardsFromDoc,
    handleReviewCard,
    showAddDeckModal,
    setShowAddDeckModal,
    newDeckName,
    setNewDeckName,
    newDeckDesc,
    setNewDeckDesc,
    handleAddDeckSubmit,
    activeDoc,
    fetchFlashcardDecks,
    analyticsData
  } = useStudy();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'due' | 'mastered'>('all');

  // Add Deck Modal
  const [showLocalAddModal, setShowLocalAddModal] = useState(false);

  // Filter decks based on subtab
  const filteredDecks = decks.filter(deck => {
    if (activeSubTab === 'due') {
      // Mocking some due decks
      return deck.id % 2 === 0;
    }
    if (activeSubTab === 'mastered') {
      return deck.id % 2 !== 0;
    }
    return true;
  });

  // Render review session
  if (activeDeck) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-4">
        {/* Session Header */}
        <div className="flex items-center justify-between bg-white border border-[#0D2B24]/10 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setActiveDeck(null);
                fetchFlashcardDecks();
              }}
              className="p-2 bg-[#FAF8F5] hover:bg-[#0D2B24]/5 border border-[#0D2B24]/10 text-[#0D2B24]/60 hover:text-[#0D2B24] rounded-xl transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-sm font-bold text-[#0D2B24]">{activeDeck.name}</h2>
              <p className="text-[10px] text-[#0D2B24]/50 font-bold">
                Total: <span className="text-[#0D2B24]">{activeDeckCards.length} cards</span>
              </p>
            </div>
          </div>

          {activeDoc && (
            <button 
              onClick={handleGenerateFlashcardsFromDoc}
              disabled={generatingFC}
              className="bg-[#0D2B24] hover:bg-[#0D2B24]/90 disabled:bg-[#0D2B24]/10 text-white text-[10px] font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              {generatingFC ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-100 border-t-transparent animate-spin"></span>
                  AI Generating...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Generate Cards
                </>
              )}
            </button>
          )}
        </div>

        {activeDeckCards.length === 0 ? (
          <div className="bg-white border border-[#0D2B24]/10 rounded-3xl p-16 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-[#FAF8F5] rounded-full flex items-center justify-center mx-auto text-[#0D2B24]/40 border border-[#0D2B24]/5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="max-w-sm mx-auto space-y-2">
              <h4 className="text-[#0D2B24] font-bold text-xs">This deck is currently empty</h4>
              <p className="text-[#0D2B24]/60 text-[11px] leading-relaxed">
                {activeDoc 
                  ? 'Click "AI Generate Cards" above to automatically generate flashcards from your active document!'
                  : 'Open a document in the library and use the AI Lab to generate cards, or manually add cards.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Card display */}
            <div 
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="relative min-h-[260px] w-full bg-white border border-[#0D2B24]/10 hover:border-[#0D2B24]/20 rounded-3xl p-8 flex flex-col justify-between items-center text-center cursor-pointer select-none transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="text-[9px] text-[#0D2B24]/40 font-black uppercase tracking-widest">
                Card {currentCardIndex + 1} of {activeDeckCards.length} — {isCardFlipped ? 'BACK' : 'FRONT'}
              </div>

              <div className="max-w-md select-text py-4">
                <h3 className="text-md sm:text-lg font-serif-elegant font-bold text-[#0D2B24] leading-snug">
                  {isCardFlipped 
                    ? activeDeckCards[currentCardIndex].back 
                    : activeDeckCards[currentCardIndex].front}
                </h3>
              </div>

              <div className="text-[9px] text-[#0D2B24]/40 font-bold uppercase tracking-wider">
                (Tap card to reveal answer)
              </div>
            </div>

            {/* SRS Buttons */}
            {isCardFlipped && (
              <div className="space-y-3 bg-white border border-[#0D2B24]/10 p-5 rounded-2xl shadow-sm animate-fadeIn">
                <p className="text-center text-[10px] text-[#0D2B24]/60 font-bold uppercase tracking-wider">How well did you recall this?</p>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => handleReviewCard('hard')}
                    className="py-3 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 font-extrabold text-xs rounded-xl transition-all shadow-sm"
                  >
                    Hard (Repeat)
                  </button>
                  <button 
                    onClick={() => handleReviewCard('good')}
                    className="py-3 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 hover:border-sky-600 font-extrabold text-xs rounded-xl transition-all shadow-sm"
                  >
                    Good (6 Days)
                  </button>
                  <button 
                    onClick={() => handleReviewCard('easy')}
                    className="py-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 font-extrabold text-xs rounded-xl transition-all shadow-sm"
                  >
                    Easy (14 Days)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* TOP ROW: SRS Mastery Board Banner & Weekly Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: SRS Mastery Board (Green Bg) */}
        <div className="lg:col-span-8 bg-[#0D2B24] rounded-3xl p-8 text-white flex flex-col justify-between min-h-[220px] relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl font-serif-elegant font-bold tracking-tight">SRS Mastery Board</h2>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              Manage your active recall lists, generate decks from PDF/docs, or manually build cards. Ready for testing? Start a comprehensive spaced repetition review session now.
            </p>
          </div>
          <div className="flex gap-4.5 pt-6">
            <button 
              onClick={() => {
                if (decks.length > 0) setActiveDeck(decks[0]);
              }}
              className="bg-white hover:bg-slate-100 text-[#0D2B24] font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-sm"
            >
              Start All Reviews
            </button>
            <button className="bg-transparent hover:bg-white/5 border border-white/20 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all">
              Review Schedule
            </button>
          </div>
        </div>

        {/* Right Column: Weekly Streak */}
        <div className="lg:col-span-4 bg-white border border-[#0D2B24]/10 rounded-3xl p-6.5 flex flex-col justify-between min-h-[220px] shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-[#0D2B24]">Weekly Streak</h3>
            <p className="text-[11px] text-[#0D2B24]/50 leading-relaxed font-semibold">
              12 days study streak! Keep active to avoid memory decay.
            </p>
          </div>

          {/* Simple Spark-bar-graph */}
          <div className="flex items-end justify-between gap-1.5 h-16 px-2 mt-4">
            {[
              { day: 'M', h: '45%' },
              { day: 'T', h: '60%' },
              { day: 'W', h: '30%' },
              { day: 'T', h: '85%' },
              { day: 'F', h: '25%' },
              { day: 'S', h: '70%', special: true },
              { day: 'S', h: '95%', special: true },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <div className="w-full bg-[#FAF8F5] rounded-md h-full relative overflow-hidden border border-[#0D2B24]/5">
                  <div 
                    style={{ height: bar.h }} 
                    className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-300 ${
                      bar.special ? 'bg-amber-500' : 'bg-[#0D2B24]'
                    }`}
                  ></div>
                </div>
                <span className="text-[9px] font-bold text-[#0D2B24]/40">{bar.day}</span>
              </div>
            ))}
          </div>

          <div className="text-[9px] text-[#0D2B24]/40 font-black uppercase tracking-wider pt-3 border-t border-[#0D2B24]/5 flex justify-between">
            <span>WEEKLY TARGET: 350M</span>
            <span className="text-[#0D2B24]">75% DONE</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR / DECKS TAB AND ACTION */}
      <div className="flex items-center justify-between border-b border-[#0D2B24]/10 pb-2">
        <div className="flex gap-6 text-xs font-bold text-[#0D2B24]/60">
          <button 
            onClick={() => setActiveSubTab('all')} 
            className={`pb-2 border-b-2 transition-all ${activeSubTab === 'all' ? 'text-[#0D2B24] border-[#0D2B24]' : 'border-transparent hover:text-[#0D2B24]'}`}
          >
            All Decks
          </button>
          <button 
            onClick={() => setActiveSubTab('due')} 
            className={`pb-2 border-b-2 transition-all ${activeSubTab === 'due' ? 'text-[#0D2B24] border-[#0D2B24]' : 'border-transparent hover:text-[#0D2B24]'}`}
          >
            Due Soon
          </button>
          <button 
            onClick={() => setActiveSubTab('mastered')} 
            className={`pb-2 border-b-2 transition-all ${activeSubTab === 'mastered' ? 'text-[#0D2B24] border-[#0D2B24]' : 'border-transparent hover:text-[#0D2B24]'}`}
          >
            Mastered
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Create new deck button */}
          <button 
            onClick={() => setShowLocalAddModal(true)}
            className="bg-white border border-[#0D2B24]/10 text-[#0D2B24]/80 text-[11px] font-black px-4 py-2 rounded-xl hover:bg-[#FAF8F5] transition shadow-sm"
          >
            + Create New Deck
          </button>
        </div>
      </div>

      {/* GRID OF DECKS (Redesigned matching screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDecks.map((deck, idx) => {
          // Compute mock percentage
          const percent = deck.id % 2 === 0 ? 42 : 78;
          const statusText = deck.id % 2 === 0 ? '42 DUE' : 'CLEAN';
          const statusColor = deck.id % 2 === 0 
            ? 'bg-rose-50 text-rose-700 border-rose-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200';

          return (
            <div 
              key={deck.id} 
              className="bg-white border border-[#0D2B24]/10 hover:border-[#0D2B24]/20 rounded-3xl p-5.5 flex flex-col justify-between min-h-[190px] transition-all hover:shadow-md shadow-sm relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  {/* Circle stack icon */}
                  <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#0D2B24]/5 flex items-center justify-center text-[#0D2B24]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  
                  {/* Status Pill */}
                  <span className={`text-[9px] font-black px-2 py-0.5 border rounded-full ${statusColor}`}>
                    {statusText}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#0D2B24] truncate leading-tight group-hover:text-[#0D2B24]/80 transition-colors">
                  {deck.name}
                </h3>
                <p className="text-[#0D2B24]/60 text-[11px] mt-1.5 line-clamp-2 leading-relaxed font-normal">
                  {deck.description || 'Spaced repetition cards for active learning.'}
                </p>
              </div>

              {/* Progress and Study action */}
              <div className="mt-5 pt-3.5 border-t border-[#0D2B24]/5">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-[#0D2B24]/50 mb-1.5">
                  <span>MASTERY PROGRESS</span>
                  <span className="text-[#0D2B24]">{percent}%</span>
                </div>
                {/* Progress bar line */}
                <div className="w-full bg-[#FAF8F5] h-1.5 rounded-full overflow-hidden border border-[#0D2B24]/5 mb-3.5">
                  <div 
                    style={{ width: `${percent}%` }}
                    className="h-full bg-[#0D2B24] rounded-full"
                  ></div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setActiveDeck(deck)}
                    className="bg-[#0D2B24] text-white font-extrabold text-[10px] px-4 py-2 rounded-xl hover:bg-[#0D2B24]/90 transition shadow-sm"
                  >
                    Review Now
                  </button>
                  <button 
                    onClick={() => {
                      if (activeDoc) {
                        setActiveDeck(deck);
                        handleGenerateFlashcardsFromDoc();
                      } else {
                        alert("Select a document in AI Lab/Library to generate cards.");
                      }
                    }}
                    className="bg-transparent hover:bg-[#FAF8F5] border border-[#0D2B24]/10 text-[#0D2B24]/80 font-bold text-[10px] px-3 py-2 rounded-xl transition"
                  >
                    AI Populate
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECENT ACTIVITY HISTORY TABLE (Redesigned matching screenshot) */}
      <div className="bg-white border border-[#0D2B24]/10 rounded-3xl p-6.5 shadow-sm">
        <div className="mb-5 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-[#0D2B24]">Recent Activity</h3>
            <p className="text-[11px] text-[#0D2B24]/50 mt-0.5 leading-none font-semibold">Your latest learning runs and quiz completions.</p>
          </div>
          <button className="text-[10px] font-black text-[#0D2B24] hover:underline">
            View Full Log
          </button>
        </div>

        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#0D2B24]/10 text-[9px] text-[#0D2B24]/40 font-black uppercase tracking-wider">
                <th className="pb-3.5 pl-2">Deck/Subject</th>
                <th className="pb-3.5">Type</th>
                <th className="pb-3.5">Accuracy</th>
                <th className="pb-3.5">Cards Reviewed</th>
                <th className="pb-3.5">Status</th>
                <th className="pb-3.5 pr-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0D2B24]/5 font-semibold text-[#0D2B24]/90">
              {[
                { name: 'Toán học nâng cao', type: 'AI Generated Quiz', accuracy: '85%', cards: '10 Cards', status: 'Completed', statusCol: 'text-emerald-700 bg-emerald-50 border-emerald-100', date: 'Today' },
                { name: 'English Vocabulary', type: 'SRS Flashcards', accuracy: '96%', cards: '24 Cards', status: 'Completed', statusCol: 'text-emerald-700 bg-emerald-50 border-emerald-100', date: 'Yesterday' },
                { name: 'Trí tuệ nhân tạo', type: 'AI Quiz Builder', accuracy: '62%', cards: '5 Cards', status: 'Needs Review', statusCol: 'text-amber-700 bg-amber-50 border-amber-100', date: '2 days ago' },
                { name: 'Giải tích 1', type: 'SRS Flashcards', accuracy: '100%', cards: '12 Cards', status: 'Completed', statusCol: 'text-emerald-700 bg-emerald-50 border-emerald-100', date: '3 days ago' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-[#FAF8F5]/50 transition-colors">
                  <td className="py-3.5 pl-2 font-bold">{row.name}</td>
                  <td className="py-3.5 text-[#0D2B24]/60 font-medium text-[11px]">{row.type}</td>
                  <td className="py-3.5 text-[#0D2B24] font-black">{row.accuracy}</td>
                  <td className="py-3.5 text-[#0D2B24]/60 font-medium text-[11px]">{row.cards}</td>
                  <td className="py-3.5">
                    <span className={`text-[9px] px-2 py-0.5 border rounded-full font-black ${row.statusCol}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 pr-2 text-right text-[#0D2B24]/50 text-[11px] font-normal">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Local Add Deck Modal */}
      {showLocalAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0D2B24]/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#0D2B24]/10 rounded-3xl w-full max-w-md p-6.5 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#0D2B24]/10 pb-3">
              <h3 className="text-md font-bold text-[#0D2B24]">Create New Flashcard Deck</h3>
              <button 
                onClick={() => setShowLocalAddModal(false)}
                className="text-[#0D2B24]/40 hover:text-[#0D2B24] transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={async (e) => {
              await handleAddDeckSubmit(e);
              setShowLocalAddModal(false);
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Deck Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Physics Midterm Review..."
                  className="w-full bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition placeholder:text-[#0D2B24]/30"
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Description</label>
                <textarea 
                  placeholder="Summarize what this deck is for..."
                  className="w-full h-20 bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition resize-none placeholder:text-[#0D2B24]/30"
                  value={newDeckDesc}
                  onChange={e => setNewDeckDesc(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#0D2B24]/10">
                <button 
                  type="submit"
                  className="flex-1 bg-[#0D2B24] hover:bg-[#0D2B24]/90 text-white text-xs font-black py-3 rounded-xl transition shadow-sm"
                >
                  Confirm & Create
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowLocalAddModal(false)}
                  className="px-6 py-3 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 border border-[#0D2B24]/10 text-[#0D2B24]/80 font-bold text-xs rounded-xl transition shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
