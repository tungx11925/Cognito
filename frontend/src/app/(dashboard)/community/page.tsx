"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Library, User, Copy, ThumbsUp, Star, Eye } from 'lucide-react';
import { getPublicDecks, forkDeck } from '@/services/flashcard.service';
import toast from 'react-hot-toast';

export default function CommunityLibraryPage() {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const data = await getPublicDecks();
      setDecks(data);
    } catch (error) {
      toast.error('Failed to load community decks');
    } finally {
      setLoading(false);
    }
  };

  const handleFork = async (deckId: number) => {
    try {
      await forkDeck(deckId);
      toast.success('Đã copy bộ thẻ vào thư viện của bạn!');
      fetchDecks(); // reload fork count
    } catch (error) {
      toast.error('Có lỗi xảy ra khi copy thẻ');
    }
  };

  const filteredDecks = decks.filter(deck => 
    deck.name.toLowerCase().includes(search.toLowerCase()) || 
    (deck.description && deck.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cộng Đồng EduShare</h1>
            <p className="text-sm text-gray-500 mt-1">Khám phá hàng ngàn bộ thẻ và tài liệu được chia sẻ từ cộng đồng.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tài liệu, flashcards..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#1a3a2a] outline-none transition-all"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#f9fafb]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#1a3a2a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDecks.map((deck) => (
              <motion.div 
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                      Flashcards
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Copy size={14} /> {deck.fork_count || 0}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">{deck.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{deck.description || 'Không có mô tả'}</p>
                  
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
                    {deck.avatar_url ? (
                      <img src={deck.avatar_url} alt={deck.author_name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={12} className="text-gray-500" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate">{deck.author_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{deck.card_count} thẻ</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                  <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Eye size={16} /> Xem trước
                  </button>
                  <button 
                    onClick={() => handleFork(deck.id)}
                    className="flex-1 bg-[#1a3a2a] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#12281d] transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy size={16} /> Lưu (Fork)
                  </button>
                </div>
              </motion.div>
            ))}
            
            {filteredDecks.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <Library size={48} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có bộ thẻ nào</h3>
                <p className="text-gray-500 max-w-md">Hãy là người đầu tiên chia sẻ bộ thẻ học tập của bạn với cộng đồng EduShare AI.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
