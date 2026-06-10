"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDecks, createDeck } from '@/services/flashcard.service';
import { Layers, Plus, Brain, ArrowRight, Play, Loader2 } from 'lucide-react';

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const data = await getDecks();
      setDecks(data || []);
    } catch (error) {
      console.error('Lỗi khi tải bộ thẻ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    setIsCreating(true);
    try {
      await createDeck(newDeckName, newDeckDesc);
      setShowCreateModal(false);
      setNewDeckName('');
      setNewDeckDesc('');
      fetchDecks();
    } catch (error) {
      console.error('Lỗi khi tạo bộ thẻ:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2B24] mb-2 flex items-center gap-2">
            <Brain className="text-[#0D2B24]" /> Flashcards & Ôn tập
          </h1>
          <p className="text-gray-500">Quản lý các bộ thẻ ghi nhớ và ôn tập thông minh bằng thuật toán Spaced Repetition.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0D2B24] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-[#1a4a3b] transition-colors shadow-sm"
        >
          <Plus size={18} /> Tạo bộ thẻ mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#0D2B24] w-8 h-8" />
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700">Chưa có bộ thẻ nào</h3>
          <p className="text-gray-500 mt-1 mb-4">Hãy tạo bộ thẻ mới hoặc sử dụng AI để trích xuất thẻ từ tài liệu.</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="text-[#0D2B24] font-semibold hover:underline"
          >
            Tạo ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <div key={deck.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#0D2B24] flex items-center justify-center mb-4">
                  <Layers size={20} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{deck.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2">{deck.description || 'Không có mô tả'}</p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <Link 
                  href={`/flashcards/${deck.id}`}
                  className="flex-1 bg-[#FAF8F5] text-[#0D2B24] font-semibold py-2.5 rounded-xl text-center flex items-center justify-center gap-2 hover:bg-[#0D2B24] hover:text-white transition-colors group-hover:bg-[#0D2B24] group-hover:text-white"
                >
                  <Play size={16} className="fill-current" /> Ôn tập ngay
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tạo Bộ Thẻ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tạo Bộ thẻ mới</h2>
              <form onSubmit={handleCreateDeck}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên bộ thẻ <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={newDeckName}
                      onChange={e => setNewDeckName(e.target.value)}
                      placeholder="VD: Từ vựng IELTS, Lịch sử Việt Nam..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D2B24] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea 
                      value={newDeckDesc}
                      onChange={e => setNewDeckDesc(e.target.value)}
                      placeholder="Ghi chú thêm về bộ thẻ này..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D2B24] focus:border-transparent transition-all resize-none h-24"
                    />
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={isCreating || !newDeckName.trim()}
                    className="flex-1 px-4 py-2 bg-[#0D2B24] text-white font-semibold rounded-xl hover:bg-[#1a4a3b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreating ? <Loader2 size={18} className="animate-spin" /> : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
