"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, FileText, LayoutGrid, Download, Copy, AlertTriangle, Eye, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import RegisterModal from '@/components/auth/RegisterModal';

interface SharedResource {
  type: 'document' | 'deck';
  id: number;
  title: string;
  doc_url?: string;
}

export default function SharedWorkspacePage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    triggerMessage
  } = useStudy();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resource, setResource] = useState<SharedResource | null>(null);
  const [accessType, setAccessType] = useState<'viewer' | 'editor' | 'forker'>('viewer');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

  useEffect(() => {
    if (token) {
      verifyLink();
    }
  }, [token]);

  const verifyLink = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/shares/access/${token}`);
      const data = await res.json();
      
      if (res.ok) {
        setResource(data.resource);
        setAccessType(data.access_type);
      } else {
        setError(data.error || 'Đường liên kết không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (resource?.type === 'document') {
      // Logic tải xuống hoặc xem
      if (resource.doc_url) {
        window.open(resource.doc_url, '_blank');
      } else {
        toast.error('URL tài liệu không khả dụng');
      }
    } else if (resource?.type === 'deck') {
      // Fork logic cho deck nếu accessType = forker, hoặc xem viewer
      if (accessType === 'forker') {
        try {
          const auth_token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/flashcards/decks/${resource.id}/fork`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${auth_token}`
            }
          });
          if (res.ok) {
            toast.success('Đã sao chép vào bộ sưu tập của bạn!');
            router.push('/library');
          } else {
            const errData = await res.json();
            toast.error(errData.error || 'Lỗi khi sao chép');
          }
        } catch(e) {
          toast.error('Lỗi kết nối mạng');
        }
      } else {
        // Chỉ xem
        router.push(`/flashcards/${resource.id}?mode=study`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-[#0B0F17] text-[#0d1a14] dark:text-zinc-100 overflow-x-hidden transition-colors duration-200">
      <Navbar 
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />

      <main className="max-w-3xl mx-auto px-4 py-20 flex items-center justify-center min-h-[80vh]">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#1a3d28] dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-zinc-400 font-medium animate-pulse">Đang kiểm tra quyền truy cập...</p>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 p-10 rounded-2xl shadow-xl text-center border border-red-100 dark:border-red-900/40 max-w-md w-full"
          >
            <div className="w-20 h-20 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-3">Truy cập bị từ chối</h2>
            <p className="text-gray-500 dark:text-zinc-400 mb-8">{error}</p>
            <button 
              onClick={() => router.push('/library')}
              className="w-full bg-gray-900 dark:bg-zinc-800 text-white font-medium py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-zinc-700 transition-colors"
            >
              Về thư viện
            </button>
          </motion.div>
        ) : resource && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="bg-[#1a3d28] dark:bg-[#0f2418] p-8 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/10 rounded-2xl backdrop-blur flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-lg">
                  {resource.type === 'document' ? <FileText size={36} className="text-blue-200" /> : <LayoutGrid size={36} className="text-emerald-200" />}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{resource.title}</h1>
                <p className="text-white/80 font-medium flex items-center justify-center gap-2">
                  <span className="px-2 py-1 bg-black/20 rounded text-xs uppercase tracking-wider">
                    {resource.type === 'document' ? 'Tài liệu' : 'Flashcard'}
                  </span>
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-xl p-5 border border-gray-100 dark:border-zinc-700/60 mb-8 flex items-start gap-4">
                <div className="bg-amber-100 dark:bg-amber-950/50 p-2.5 rounded-lg text-amber-700 dark:text-amber-400 mt-0.5">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">Quyền truy cập: {accessType === 'viewer' ? 'Chỉ xem' : accessType === 'editor' ? 'Chỉnh sửa' : 'Sao chép (Fork)'}</h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    Bạn được cấp quyền <strong className="text-gray-900 dark:text-zinc-200">{accessType}</strong> đối với tài nguyên này. 
                    {accessType === 'viewer' && ' Bạn chỉ có thể xem nội dung và không thể thay đổi nó.'}
                    {accessType === 'editor' && ' Bạn có thể chỉnh sửa nội dung trực tiếp.'}
                    {accessType === 'forker' && ' Bạn có thể sao chép tài nguyên này về thư viện cá nhân của bạn.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {resource.type === 'document' ? (
                  <>
                    <button 
                      onClick={handleAction}
                      className="flex-1 bg-[#1a3d28] dark:bg-emerald-600 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-[#12281d] dark:hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                    >
                      <Eye size={18} /> Xem tài liệu
                    </button>
                    {accessType === 'editor' && (
                      <button className="flex-1 bg-white dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 py-3.5 px-4 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
                        <Edit3 size={18} /> Chỉnh sửa
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => router.push(`/flashcards/${resource.id}?mode=study`)}
                      className="flex-1 bg-white dark:bg-zinc-800 border-2 border-[#1a3d28] dark:border-emerald-500 text-[#1a3d28] dark:text-emerald-400 py-3.5 px-4 rounded-xl font-bold hover:bg-green-50 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={18} /> Xem trước thẻ
                    </button>
                    {accessType === 'forker' && (
                      <button 
                        onClick={handleAction}
                        className="flex-1 bg-[#1a3d28] dark:bg-emerald-600 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-[#12281d] dark:hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                      >
                        <Copy size={18} /> Lưu vào thư viện
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
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
