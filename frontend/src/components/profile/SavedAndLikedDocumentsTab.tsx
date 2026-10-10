"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bookmark, Heart, Search, Filter, AlertCircle, FileText, 
  ExternalLink, Trash2, Loader2, BookOpen, Clock, Tag, ChevronLeft, ChevronRight 
} from 'lucide-react';

interface SavedAndLikedDocumentsTabProps {
  type: 'saved' | 'liked';
  triggerMessage: (msg: string, type?: 'success' | 'error') => void;
}

export default function SavedAndLikedDocumentsTab({ type, triggerMessage }: SavedAndLikedDocumentsTabProps) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search.trim()) params.append('search', search.trim());
      if (category !== 'all') params.append('category', category);

      const endpoint = type === 'saved' ? '/documents/user/saved' : '/documents/user/liked';
      const res = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        triggerMessage("Không thể tải danh sách tài liệu", "error");
      }
    } catch (err) {
      console.error(err);
      triggerMessage("Lỗi kết nối máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type, page, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const handleRemove = async (docId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'saved' ? `/documents/${docId}/save` : `/documents/${docId}/like`;
      
      // Optimistic update
      setItems(prev => prev.filter(item => item.document_id !== docId));
      setTotal(prev => Math.max(0, prev - 1));

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        triggerMessage(
          type === 'saved' ? "Đã bỏ lưu tài liệu" : "Đã bỏ thích tài liệu",
          "success"
        );
      } else {
        // Rollback if failed
        fetchItems();
        triggerMessage("Không thể thao tác lúc này", "error");
      }
    } catch (err) {
      fetchItems();
      triggerMessage("Lỗi kết nối", "error");
    }
  };

  const categories = [
    { id: 'all', label: 'Tất cả lĩnh vực' },
    { id: 'Toán học', label: 'Toán học' },
    { id: 'Khoa học máy tính', label: 'Khoa học máy tính' },
    { id: 'Trí tuệ nhân tạo', label: 'Trí tuệ nhân tạo' },
    { id: 'Ngoại ngữ', label: 'Ngoại ngữ' },
    { id: 'Kinh tế', label: 'Kinh tế' },
    { id: 'Khác', label: 'Khác' },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border-2 border-[#1a2e1c]/18 dark:border-zinc-700 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.08)] dark:shadow-none space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {type === 'saved' ? (
              <Bookmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
            )}
            <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-base">
              {type === 'saved' ? 'Tài liệu đã lưu' : 'Tài liệu đã thích'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
              {total}
            </span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2e1c] dark:focus:ring-emerald-500 text-gray-900 dark:text-zinc-100"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          </form>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat.id
                  ? 'bg-[#1a2e1c] dark:bg-emerald-700 text-white'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-zinc-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#1a2e1c] dark:text-emerald-400" />
          <span className="text-xs">Đang tải danh sách tài liệu...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-800 text-gray-400 flex items-center justify-center mx-auto">
            {type === 'saved' ? <Bookmark className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
            {type === 'saved' ? 'Chưa có tài liệu nào được lưu' : 'Chưa có tài liệu nào được thích'}
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-sm mx-auto">
            Khám phá thư viện cộng đồng hoặc tài liệu mở để lưu trữ kiến thức cho quá trình ôn tập của bạn.
          </p>
          <button
            onClick={() => router.push('/community')}
            className="px-4 py-2 bg-[#1a2e1c] dark:bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-[#2d5a3d] transition-colors"
          >
            Khám phá Cộng đồng
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((doc) => {
            const isAvailable = Boolean(doc.is_available);

            return (
              <div
                key={doc.save_id || doc.like_id || doc.document_id}
                onClick={() => {
                  if (isAvailable && doc.document_id) {
                    router.push(`/documents/${doc.document_id}`);
                  }
                }}
                className={`p-4 bg-white dark:bg-zinc-900 rounded-2xl border-2 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isAvailable 
                    ? 'border-[#1a2e1c]/18 dark:border-zinc-700 hover:border-[#1a2e1c]/40 hover:shadow-md cursor-pointer' 
                    : 'border-gray-200 dark:border-zinc-800 opacity-60 bg-gray-50/50 dark:bg-zinc-900/40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isAvailable ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#1a2e1c] dark:text-emerald-400' : 'bg-gray-200 dark:bg-zinc-800 text-gray-400'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-zinc-100 truncate">
                        {isAvailable ? doc.title : (doc.title ? `${doc.title} (Đã ẩn)` : 'Tài liệu không còn tồn tại')}
                      </h4>
                      {!isAvailable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertCircle size={10} /> Không còn khả dụng
                        </span>
                      )}
                      {doc.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-medium">
                          {doc.category}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-1">
                      {isAvailable 
                        ? (doc.description || 'Không có mô tả chi tiết.') 
                        : 'Tài liệu này đã bị tác giả gỡ khỏi hệ thống hoặc chuyển về chế độ riêng tư.'}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-zinc-500 pt-0.5">
                      <span>Tác giả: <strong className="text-gray-700 dark:text-zinc-300 font-semibold">{doc.author_name || 'Hệ thống'}</strong></span>
                      {doc.like_count !== undefined && <span>❤️ {doc.like_count}</span>}
                      {doc.save_count !== undefined && <span>🔖 {doc.save_count}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => handleRemove(doc.document_id, e)}
                    title={type === 'saved' ? "Bỏ lưu tài liệu" : "Bỏ thích tài liệu"}
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isAvailable && (
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 text-xs font-medium">
                      <span>Xem</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Trang trước
              </button>
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium disabled:opacity-40"
              >
                Trang sau <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
