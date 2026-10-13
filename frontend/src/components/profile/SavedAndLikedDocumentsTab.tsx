"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bookmark, Heart, Search, AlertCircle, FileText, 
  ExternalLink, Trash2, Loader2, BookOpen, Clock, Tag,
  ChevronLeft, ChevronRight, HelpCircle, GitBranch, Layers, Share2, MessageSquare
} from 'lucide-react';
import CardErrorBoundary from '@/components/common/CardErrorBoundary';
import {
  getMySavedCommunityResources,
  getMyLikedCommunityResources,
  toggleSaveResource,
  toggleLikeResource,
  CommunityResourceItem,
  ResourceType,
} from '@/services/community.service';

interface SavedAndLikedDocumentsTabProps {
  type: 'saved' | 'liked';
  triggerMessage: (msg: string, type?: 'success' | 'error') => void;
}

export default function SavedAndLikedDocumentsTab({ type, triggerMessage }: SavedAndLikedDocumentsTabProps) {
  const router = useRouter();

  // Active sub-group: 'personal' | 'community'
  const [activeGroup, setActiveGroup] = useState<'personal' | 'community'>('personal');

  // Personal Documents state
  const [personalItems, setPersonalItems] = useState<any[]>([]);
  const [personalTotal, setPersonalTotal] = useState(0);
  const [personalPage, setPersonalPage] = useState(1);
  const [personalTotalPages, setPersonalTotalPages] = useState(1);
  const [personalCategory, setPersonalCategory] = useState('all');
  const [personalSearch, setPersonalSearch] = useState('');
  const [loadingPersonal, setLoadingPersonal] = useState(true);

  // Community Resources state
  const [communityItems, setCommunityItems] = useState<CommunityResourceItem[]>([]);
  const [communityTotal, setCommunityTotal] = useState(0);
  const [communityPage, setCommunityPage] = useState(1);
  const [communityTotalPages, setCommunityTotalPages] = useState(1);
  const [communitySearch, setCommunitySearch] = useState('');
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // 1. Fetch Personal Documents
  const fetchPersonalItems = useCallback(async () => {
    setLoadingPersonal(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(personalPage),
        limit: '10',
      });
      if (personalSearch.trim()) params.append('search', personalSearch.trim());
      if (personalCategory !== 'all') params.append('category', personalCategory);

      const endpoint = type === 'saved' ? '/documents/user/saved' : '/documents/user/liked';
      const res = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        setPersonalItems(data.items || []);
        setPersonalTotal(data.total || 0);
        setPersonalTotalPages(data.totalPages || 1);
      } else {
        triggerMessage("Không thể tải danh sách tài liệu cá nhân", "error");
      }
    } catch (err) {
      console.error(err);
      triggerMessage("Lỗi kết nối máy chủ", "error");
    } finally {
      setLoadingPersonal(false);
    }
  }, [type, personalPage, personalCategory, personalSearch, API_BASE_URL]);

  // 2. Fetch Community Resources
  const fetchCommunityItems = useCallback(async () => {
    setLoadingCommunity(true);
    try {
      const res = type === 'saved'
        ? await getMySavedCommunityResources(communityPage, 10)
        : await getMyLikedCommunityResources(communityPage, 10);

      if (res.error) {
        triggerMessage(res.error, "error");
      } else {
        let list = res.resources || [];
        if (communitySearch.trim()) {
          const q = communitySearch.trim().toLowerCase();
          list = list.filter(r => 
            r.title.toLowerCase().includes(q) || 
            (r.description && r.description.toLowerCase().includes(q))
          );
        }
        setCommunityItems(list);
        setCommunityTotal(res.total || 0);
        setCommunityTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      triggerMessage("Lỗi kết nối bài viết cộng đồng", "error");
    } finally {
      setLoadingCommunity(false);
    }
  }, [type, communityPage, communitySearch]);

  useEffect(() => {
    fetchPersonalItems();
  }, [fetchPersonalItems]);

  useEffect(() => {
    fetchCommunityItems();
  }, [fetchCommunityItems]);

  // Handle Remove Personal Document
  const handleRemovePersonal = async (docId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'saved' ? `/documents/${docId}/save` : `/documents/${docId}/like`;
      
      // Optimistic update
      setPersonalItems(prev => prev.filter(item => item.document_id !== docId));
      setPersonalTotal(prev => Math.max(0, prev - 1));

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        triggerMessage(
          type === 'saved' ? "Đã bỏ lưu tài liệu cá nhân" : "Đã bỏ thích tài liệu cá nhân",
          "success"
        );
      } else {
        fetchPersonalItems();
        triggerMessage("Không thể thao tác lúc này", "error");
      }
    } catch (err) {
      fetchPersonalItems();
      triggerMessage("Lỗi kết nối", "error");
    }
  };

  // Handle Remove Community Resource (Unsave / Unlike)
  const handleRemoveCommunity = async (resourceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Optimistic update
      setCommunityItems(prev => prev.filter(item => item.id !== resourceId));
      setCommunityTotal(prev => Math.max(0, prev - 1));

      const res = type === 'saved'
        ? await toggleSaveResource(resourceId)
        : await toggleLikeResource(resourceId);

      if (res.error) {
        fetchCommunityItems();
        triggerMessage(res.error, "error");
      } else {
        triggerMessage(
          type === 'saved' ? "Đã bỏ lưu bài viết cộng đồng" : "Đã bỏ thích bài viết cộng đồng",
          "success"
        );
      }
    } catch (err) {
      fetchCommunityItems();
      triggerMessage("Lỗi kết nối", "error");
    }
  };

  // Helper for resource icon & label
  const getTypeInfo = (resourceType: ResourceType) => {
    switch (resourceType) {
      case 'document':
        return { label: 'Tài liệu', icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' };
      case 'test_set':
        return { label: 'Bộ đề thi', icon: HelpCircle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' };
      case 'mindmap':
        return { label: 'Sơ đồ tư duy', icon: GitBranch, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' };
      case 'flashcard_deck':
        return { label: 'Thẻ ghi nhớ', icon: Layers, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' };
      default:
        return { label: 'Học liệu', icon: FileText, color: 'text-stone-600 bg-stone-50 dark:bg-zinc-800 dark:text-zinc-400' };
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
      {/* Group Selector Navigation */}
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border-2 border-[#1a2e1c]/18 dark:border-zinc-700 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.08)] dark:shadow-none flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {type === 'saved' ? (
            <Bookmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
          )}
          <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-base">
            {type === 'saved' ? 'Mục đã lưu' : 'Mục đã thích'}
          </h3>
        </div>

        {/* Segmented Control Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveGroup('personal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeGroup === 'personal'
                ? 'bg-white dark:bg-zinc-900 text-[#1a2e1c] dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileText size={13} />
            <span>Tài liệu cá nhân</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
              {personalTotal}
            </span>
          </button>

          <button
            onClick={() => setActiveGroup('community')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeGroup === 'community'
                ? 'bg-white dark:bg-zinc-900 text-[#1a2e1c] dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
            }`}
          >
            <Share2 size={13} />
            <span>Bài từ cộng đồng</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold">
              {communityTotal}
            </span>
          </button>
        </div>
      </div>

      {/* ──────────────── GROUP 1: PERSONAL DOCUMENTS ──────────────── */}
      {activeGroup === 'personal' && (
        <div className="space-y-4">
          {/* Controls: Search & Category */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border-2 border-[#1a2e1c]/18 dark:border-zinc-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">
                Hiển thị tài liệu cá nhân đã {type === 'saved' ? 'lưu' : 'thích'}
              </span>
              <div className="relative flex-1 sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Tìm kiếm tài liệu cá nhân..."
                  value={personalSearch}
                  onChange={(e) => setPersonalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2e1c] dark:focus:ring-emerald-500 text-gray-900 dark:text-zinc-100"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setPersonalCategory(cat.id); setPersonalPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    personalCategory === cat.id
                      ? 'bg-[#1a2e1c] dark:bg-emerald-700 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Items List */}
          {loadingPersonal ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-zinc-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#1a2e1c] dark:text-emerald-400" />
              <span className="text-xs">Đang tải danh sách tài liệu cá nhân...</span>
            </div>
          ) : personalItems.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-800 text-gray-400 flex items-center justify-center mx-auto">
                {type === 'saved' ? <Bookmark className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                {type === 'saved' ? 'Chưa có tài liệu cá nhân nào được lưu' : 'Chưa có tài liệu cá nhân nào được thích'}
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-sm mx-auto">
                Khám phá tài liệu mở để lưu trữ kiến thức cho quá trình ôn tập của bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {personalItems.map((doc) => {
                const isAvailable = Boolean(doc.is_available);

                return (
                  <CardErrorBoundary key={doc.save_id || doc.like_id || doc.document_id} fallbackTitle="Không thể tải tài liệu">
                    <div
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
                          onClick={(e) => handleRemovePersonal(doc.document_id, e)}
                          title={type === 'saved' ? "Bỏ lưu tài liệu" : "Bỏ thích tài liệu"}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {isAvailable && (
                          <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 text-xs font-medium cursor-pointer">
                            <span>Xem</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardErrorBoundary>
                );
              })}

              {/* Pagination */}
              {personalTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3">
                  <button
                    disabled={personalPage <= 1}
                    onClick={() => setPersonalPage(p => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Trang trước
                  </button>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                    Trang {personalPage} / {personalTotalPages}
                  </span>
                  <button
                    disabled={personalPage >= personalTotalPages}
                    onClick={() => setPersonalPage(p => Math.min(personalTotalPages, p + 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium disabled:opacity-40 cursor-pointer"
                  >
                    Trang sau <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── GROUP 2: COMMUNITY RESOURCES ──────────────── */}
      {activeGroup === 'community' && (
        <div className="space-y-4">
          {/* Search Community */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border-2 border-[#1a2e1c]/18 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">
              Hiển thị bài viết từ cộng đồng đã {type === 'saved' ? 'lưu' : 'thích'}
            </span>
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                placeholder="Tìm bài viết cộng đồng..."
                value={communitySearch}
                onChange={(e) => setCommunitySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2e1c] dark:focus:ring-emerald-500 text-gray-900 dark:text-zinc-100"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Community Items List */}
          {loadingCommunity ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-zinc-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#1a2e1c] dark:text-emerald-400" />
              <span className="text-xs">Đang tải bài viết cộng đồng...</span>
            </div>
          ) : communityItems.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-800 text-gray-400 flex items-center justify-center mx-auto">
                <Share2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                {type === 'saved' ? 'Chưa có bài viết cộng đồng nào được lưu' : 'Chưa có bài viết cộng đồng nào được thích'}
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-sm mx-auto">
                Khám phá Bảng tin Cộng đồng để tìm kiếm học liệu xuất sắc được chia sẻ bởi mọi người.
              </p>
              <button
                onClick={() => router.push('/community')}
                className="px-4 py-2 bg-[#1a2e1c] dark:bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-[#2d5a3d] transition-colors cursor-pointer"
              >
                Khám phá Cộng đồng
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {communityItems.map((item) => {
                const typeInfo = getTypeInfo(item.resource_type);
                const TypeIcon = typeInfo.icon;
                const authorDisplayName = item.author_name || 'Người dùng';
                const isAvailable = Boolean(item.is_available && item.study_url);

                return (
                  <CardErrorBoundary key={item.id} fallbackTitle="Không thể tải bài viết cộng đồng">
                    <div
                      className={`p-4 bg-white dark:bg-zinc-900 rounded-2xl border-2 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isAvailable
                          ? 'border-[#1a2e1c]/18 dark:border-zinc-700 hover:border-[#1a2e1c]/40 hover:shadow-md'
                          : 'border-red-200 dark:border-red-950/60 bg-stone-50/50 dark:bg-zinc-900/40 opacity-80'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Type Icon Badge */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Reshare Info */}
                          {item.is_reshare && (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                              <Share2 size={11} />
                              <span>{authorDisplayName} đã chia sẻ lại</span>
                              {item.original_author_name && (
                                <span className="text-stone-400">từ {item.original_author_name}</span>
                              )}
                            </div>
                          )}

                          {/* Title & Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-zinc-100 truncate">
                              {item.title}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            {!isAvailable && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
                                <AlertCircle size={10} /> Không khả dụng
                              </span>
                            )}
                            {item.category && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-medium">
                                {item.category}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-1">
                            {isAvailable
                              ? (item.description || 'Tài nguyên được đóng góp bởi thành viên Cognito.')
                              : (item.unavailable_reason || 'Tài nguyên gốc đã bị xóa hoặc không còn khả dụng.')}
                          </p>

                          {/* Meta: Author & Stats */}
                          <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-zinc-500 pt-0.5">
                            <span>
                              Tác giả: <strong className="text-gray-700 dark:text-zinc-300 font-semibold">{authorDisplayName}</strong>
                            </span>
                            <span>❤️ {item.likes}</span>
                            <span>🔖 {item.save_count ?? item.forks ?? 0}</span>
                            <span>💬 {item.comment_count ?? 0}</span>
                            <span suppressHydrationWarning>
                              {new Date(item.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={(e) => handleRemoveCommunity(item.id, e)}
                          title={type === 'saved' ? "Bỏ lưu bài viết này" : "Bỏ thích bài viết này"}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (isAvailable && item.study_url) {
                              router.push(item.study_url);
                            }
                          }}
                          disabled={!isAvailable}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isAvailable
                              ? 'bg-[#1a2e1c] dark:bg-emerald-700 text-white hover:bg-[#2d5a3d] cursor-pointer'
                              : 'bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          <span>Học ngay</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </CardErrorBoundary>
                );
              })}

              {/* Community Pagination */}
              {communityTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3">
                  <button
                    disabled={communityPage <= 1}
                    onClick={() => setCommunityPage(p => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Trang trước
                  </button>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                    Trang {communityPage} / {communityTotalPages}
                  </span>
                  <button
                    disabled={communityPage >= communityTotalPages}
                    onClick={() => setCommunityPage(p => Math.min(communityTotalPages, p + 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium disabled:opacity-40 cursor-pointer"
                  >
                    Trang sau <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
