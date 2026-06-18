"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Library, User, Copy, Download, Unlock, Lock, FileText, LayoutGrid, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import RegisterModal from '@/components/auth/RegisterModal';

interface MarketplaceResource {
  type: 'document' | 'deck';
  id: number;
  title: string;
  description: string;
  price: number;
  author_name: string;
  created_at: string;
}

export default function MarketplacePage() {
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    triggerMessage,
    updateWalletBalance
  } = useStudy();
  
  const router = useRouter();
  const [resources, setResources] = useState<MarketplaceResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'document' | 'deck'>('all');
  const [unlocking, setUnlocking] = useState<number | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchResources();
  }, [activeTab]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 'all' ? '' : `?type=${activeTab}`;
      const res = await fetch(`${API_BASE_URL}/marketplace/resources${typeParam}`);
      const data = await res.json();
      if (res.ok) {
        setResources(data.resources || []);
      } else {
        toast.error(data.error || 'Lỗi khi tải dữ liệu chợ');
      }
    } catch (error) {
      toast.error('Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (resource: MarketplaceResource) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    // Simulate Confirmation for paid items
    if (resource.price > 0) {
      const confirm = window.confirm(`Bạn có chắc chắn muốn mở khóa "${resource.title}" với giá ${resource.price} xu?`);
      if (!confirm) return;
    }

    setUnlocking(resource.id);
    try {
      const token = localStorage.getItem('token');
      const body = resource.type === 'document' ? { documentId: resource.id } : { deckId: resource.id };

      const res = await fetch(`${API_BASE_URL}/marketplace/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Đã mở khóa thành công: ${resource.title}`);
        if (resource.price > 0) {
          updateWalletBalance(-resource.price);
        }
      } else {
        toast.error(data.error || 'Mở khóa thất bại');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi giao dịch');
    } finally {
      setUnlocking(null);
    }
  };

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(search.toLowerCase()) || 
    (res.description && res.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ee", color: "#0d1a14", overflowX: "hidden" }}>
      <Navbar 
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />

      {/* Header */}
      <header className="px-4 md:px-8 py-12 max-w-7xl mx-auto border-b border-gray-200/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: "#1a3d28" }}>
              Chợ Cộng Đồng 🌍
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Khám phá hàng ngàn tài liệu học tập, giáo trình và bộ thẻ Flashcard được chia sẻ từ cộng đồng EduShare AI. Giao dịch bằng xu nội bộ, tôn vinh chất xám.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-200">
            <span className="text-gray-500 font-medium text-sm">Số dư của bạn:</span>
            <div className="flex items-center gap-1 font-bold text-amber-500 text-lg">
              🪙 {activeUser?.wallet_balance || 0}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 w-full sm:w-auto">
            {['all', 'document', 'deck'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-[#1a3d28] text-white shadow' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab === 'all' ? 'Tất cả' : tab === 'document' ? 'Tài liệu PDF/Word' : 'Bộ thẻ Flashcards'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm nội dung..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a3d28] outline-none transition-all shadow-sm font-medium"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#1a3d28] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredResources.map((res, idx) => (
                <motion.div 
                  key={`${res.type}-${res.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5
                        ${res.type === 'document' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {res.type === 'document' ? <FileText size={14} /> : <LayoutGrid size={14} />}
                        {res.type === 'document' ? 'Tài liệu' : 'Flashcard'}
                      </div>
                      
                      <div className={`flex items-center gap-1 font-bold ${res.price === 0 ? 'text-green-600' : 'text-amber-500'}`}>
                        {res.price === 0 ? 'Miễn phí' : `🪙 ${res.price}`}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-[#1a3d28] transition-colors">{res.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">{res.description || 'Chưa có mô tả cho tài nguyên này.'}</p>
                    
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User size={14} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Đăng bởi</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{res.author_name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50/80 border-t border-gray-100">
                    <button 
                      onClick={() => handleUnlock(res)}
                      disabled={unlocking === res.id}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                        ${res.price === 0 
                          ? 'bg-white border-2 border-[#1a3d28] text-[#1a3d28] hover:bg-[#1a3d28] hover:text-white' 
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {unlocking === res.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {res.price === 0 ? <Download size={18} /> : <Unlock size={18} />}
                          {res.price === 0 ? 'Lưu ngay' : `Mở khóa (${res.price} xu)`}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredResources.length === 0 && !loading && (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 mb-6">
                  <Search size={32} className="text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Không tìm thấy tài nguyên</h3>
                <p className="text-gray-500 max-w-md text-lg">Không có tài liệu hay bộ thẻ nào phù hợp với tìm kiếm của bạn lúc này.</p>
              </div>
            )}
          </div>
        )}
      </main>

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
