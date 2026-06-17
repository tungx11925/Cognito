import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { triggerMessage } = useStudy();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onClose();
      triggerMessage("Nâng cấp Premium thành công! Chào mừng bạn đến với thế giới không giới hạn.", "success");
    }, 1500);
  };

  const features = [
    { text: "Không giới hạn câu hỏi trợ lý AI", icon: <Sparkles size={16} className="text-amber-500" /> },
    { text: "Tạo Flashcards tự động từ tài liệu", icon: <Zap size={16} className="text-amber-500" /> },
    { text: "Lưu trữ đám mây lên đến 50GB", icon: <Shield size={16} className="text-amber-500" /> },
    { text: "Hỗ trợ ưu tiên 24/7 từ chuyên gia", icon: <Crown size={16} className="text-amber-500" /> }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#f5f3ee] shadow-2xl border border-[rgba(26,61,40,0.1)]"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/80 hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header styling matching tone but Premium vibe */}
        <div className="bg-gradient-to-br from-[#1a3d28] to-[#2c6e49] px-6 pt-10 pb-8 text-center relative overflow-hidden">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 rotate-12">
            <Crown size={140} />
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
              <Crown size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Nâng cấp Premium</h2>
            <p className="text-emerald-100/90 text-sm font-medium">Trải nghiệm không giới hạn AI, lưu trữ và hơn thế nữa.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-white rounded-xl p-5 border border-amber-100 shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600" />
            <h3 className="text-lg font-bold text-[#0d1a14] mb-4">Quyền lợi đặc quyền</h3>
            <ul className="space-y-3">
              {features.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="flex items-end justify-center gap-1 mb-6">
            <span className="text-3xl font-black text-[#1a3d28]">99.000</span>
            <span className="text-sm font-bold text-gray-500 mb-1">VNĐ / tháng</span>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all flex justify-center items-center gap-2"
            style={{ 
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={18} />
                Nâng cấp ngay
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4 font-medium">
            Bạn có thể hủy bất kỳ lúc nào. Không phí ẩn.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
