"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { submitFeedback } from '@/services/feedback.service';
import { MessageSquareHeart, Star, X, Send, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'Giao diện & Trải nghiệm', label: '🎨 Giao diện & Trải nghiệm' },
  { id: 'Tốc độ AI & Trợ lý', label: '⚡ Tốc độ AI & Trợ lý' },
  { id: 'Flashcards & Ôn tập', label: '🎴 Flashcards & Ôn tập' },
  { id: 'Trắc nghiệm & Đề thi', label: '📝 Trắc nghiệm & Đề thi' },
  { id: 'Đề xuất tính năng mới', label: '💡 Đề xuất tính năng mới' },
  { id: 'Báo lỗi (Bug)', label: '🐞 Báo lỗi hệ thống' },
];

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Rất thất vọng 😞', color: 'text-rose-500' },
  2: { text: 'Cần cải thiện 🙁', color: 'text-amber-500' },
  3: { text: 'Tạm ổn / Bình thường 😐', color: 'text-yellow-600' },
  4: { text: 'Tốt & Hài lòng 🙂', color: 'text-emerald-500' },
  5: { text: 'Rất tuyệt vời! 🤩', color: 'text-emerald-600 font-black' },
};

export default function FeedbackWidget() {
  const { activeUser } = useStudy();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>('Giao diện & Trải nghiệm');
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Ẩn hoàn toàn nếu người dùng là Admin hoặc đang ở trong trang quản trị /admin
  if (activeUser?.role === 'admin' || pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 3) {
      setErrorMessage('Vui lòng nhập nội dung đánh giá/góp ý (tối thiểu 3 ký tự).');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await submitFeedback({
        rating,
        category,
        comment: comment.trim(),
        user_name: activeUser ? activeUser.name : (userName.trim() || undefined),
        user_email: activeUser ? activeUser.email : (userEmail.trim() || undefined),
        page_url: typeof window !== 'undefined' ? window.location.pathname : undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setComment('');
        setRating(5);
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể gửi đánh giá, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStarCount = hoverRating || rating;

  return (
    <>
      {/* Nút bấm nổi ở góc phải màn hình */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="fixed bottom-6 right-6 z-[9990]"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-[#1a3d28] hover:bg-[#153422] text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-[#1a3d28]/25 transition-all duration-300 active:scale-95 border border-white/20"
          title="Đóng góp ý kiến & Đánh giá trải nghiệm"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
            <MessageSquareHeart size={15} />
          </div>
          <span className="text-xs font-bold tracking-wide pr-1">Đánh giá</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>
      </motion.div>

      {/* Modal Đánh giá trải nghiệm */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 my-auto"
              style={{ backgroundColor: '#ffffff' }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1a3d28] via-[#214f34] to-[#1a3d28] px-6 py-5 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full translate-x-8 -translate-y-8 blur-xl pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 border border-white/15">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Đánh giá & Góp ý trải nghiệm</h3>
                    <p className="text-xs text-emerald-100/80">Ý kiến của bạn giúp Cognito ngày càng hoàn thiện hơn</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div 
                className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar bg-white"
                style={{ backgroundColor: '#ffffff' }}
              >
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-10 text-center flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={36} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Gửi đánh giá thành công!</h4>
                    <p className="text-xs text-gray-500 max-w-xs">
                      Cảm ơn bạn rất nhiều! Đội ngũ phát triển Cognito đã ghi nhận ý kiến đóng góp quý báu này.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Chọn số sao */}
                    <div className="text-center py-2 bg-gray-50/80 rounded-2xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        Mức độ hài lòng của bạn
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-gray-300 hover:scale-125 transition-transform duration-150 focus:outline-none"
                          >
                            <Star
                              size={32}
                              className={`transition-colors ${
                                star <= activeStarCount
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                  : 'text-gray-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-xs font-semibold h-4">
                        <span className={RATING_LABELS[activeStarCount]?.color}>
                          {RATING_LABELS[activeStarCount]?.text}
                        </span>
                      </div>
                    </div>

                    {/* Danh mục đánh giá */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-2">
                        Chủ đề bạn muốn góp ý:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                              category === cat.id
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nội dung góp ý */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1.5">
                        Nhận xét chi tiết & Đề xuất thêm: <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn, tính năng bạn muốn có thêm, hoặc những điểm chưa hài lòng..."
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Thông tin người gửi nếu chưa đăng nhập */}
                    {!activeUser && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">
                            Họ và tên (Tùy chọn):
                          </label>
                          <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">
                            Email (Tùy chọn):
                          </label>
                          <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Thông báo lỗi nếu có */}
                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Nút gửi */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#1a3d28] hover:bg-[#153422] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Gửi Đánh Giá Ngay</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
