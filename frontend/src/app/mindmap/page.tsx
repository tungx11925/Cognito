"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Network, Search, Plus, Trash2, Edit3, Save, 
  Paperclip, BookOpen, Loader2, ArrowLeft, Copy, 
  ExternalLink, Sparkles, RefreshCw, X, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/landing/Navbar';
import { useStudy } from '@/context/StudyContext';
import { 
  getMindmaps, createMindmap, updateMindmap, deleteMindmap, MindmapItem 
} from '@/services/mindmap.service';
import { getDocuments } from '@/services/document.service';

const MermaidViewer = dynamic(
  () => import('@/components/documents/MermaidViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  }
);

const RegisterModal = dynamic(
  () => import('@/components/auth/RegisterModal'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  }
);

const PremiumModal = dynamic(
  () => import('@/components/layout/PremiumModal'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  }
);

const DEFAULT_TEMPLATES = [
  {
    name: 'Sơ đồ tư duy cơ bản',
    code: `mindmap
  root((Chủ đề trọng tâm))
    Nhánh 1: Khái niệm
      Định nghĩa cơ bản
      Thuộc tính chính
    Nhánh 2: Nguyên lý hoạt động
      Quy trình bước 1
      Quy trình bước 2
    Nhánh 3: Ứng dụng thực tế
      Ví dụ minh họa
      Bài tập áp dụng`,
  },
  {
    name: 'Cấu trúc hệ thống / Phân loại',
    code: `mindmap
  root((Hệ thống kiến thức))
    Phần 1: Lý thuyết
      Công thức
      Định lý
    Phần 2: Phương pháp giải
      Dạng 1: Cơ bản
      Dạng 2: Nâng cao
    Phần 3: Lưu ý quan trọng
      Bẫy đề thi
      Mẹo ghi nhớ`,
  },
];

export default function MindmapPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    showPremiumModal,
    setShowPremiumModal,
    activeUser,
    triggerMessage,
  } = useStudy();

  const [mindmaps, setMindmaps] = useState<MindmapItem[]>([]);
  const [documents, setDocuments] = useState<Array<{ id: number; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('ALL');

  const [activeMindmap, setActiveMindmap] = useState<MindmapItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formMermaidCode, setFormMermaidCode] = useState('');
  const [formDocId, setFormDocId] = useState<number | null>(null);

  const fetchMindmapsList = useCallback(async () => {
    if (!isAuthenticated) {
      setMindmaps([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params: { q?: string; document_id?: number } = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedDocId !== 'ALL' && selectedDocId !== 'STANDALONE') {
        params.document_id = parseInt(selectedDocId, 10);
      }
      const res = await getMindmaps(params);
      let fetched = res?.mindmaps || [];
      if (selectedDocId === 'STANDALONE') {
        fetched = fetched.filter(m => !m.document_id);
      }
      setMindmaps(fetched);
      if (fetched.length > 0 && !activeMindmap && !isCreating) {
        setActiveMindmap(fetched[0]);
      }
    } catch (err: any) {
      console.error('Error fetching mindmaps:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, searchQuery, selectedDocId]);

  useEffect(() => {
    fetchMindmapsList();
  }, [fetchMindmapsList]);

  useEffect(() => {
    if (!isAuthenticated) {
      setDocuments([]);
      return;
    }
    const fetchDocs = async () => {
      try {
        const res = await getDocuments();
        if (res && Array.isArray(res)) {
          setDocuments(res);
        } else if (res?.documents && Array.isArray(res.documents)) {
          setDocuments(res.documents);
        }
      } catch (err) {
        console.error('Error loading documents:', err);
      }
    };
    fetchDocs();
  }, [isAuthenticated]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setFormTitle('Sơ đồ tư duy mới');
    setFormMermaidCode(DEFAULT_TEMPLATES[0].code);
    setFormDocId(selectedDocId !== 'ALL' && selectedDocId !== 'STANDALONE' ? parseInt(selectedDocId, 10) : null);
    setActiveMindmap(null);
  };

  const handleStartEdit = (m: MindmapItem) => {
    setIsEditing(true);
    setIsCreating(false);
    setActiveMindmap(m);
    setFormTitle(m.title || 'Sơ đồ tư duy');
    setFormMermaidCode(m.mermaid_code || '');
    setFormDocId(m.document_id || null);
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      triggerMessage('Vui lòng đăng nhập để lưu sơ đồ tư duy', 'error');
      return;
    }
    if (!formMermaidCode.trim()) {
      toast.error('Vui lòng nhập mã Mermaid cho sơ đồ tư duy');
      return;
    }

    try {
      setSaving(true);
      if (isCreating) {
        const res = await createMindmap({
          title: formTitle.trim() || 'Sơ đồ tư duy mới',
          mermaid_code: formMermaidCode.trim(),
          document_id: formDocId,
        });
        toast.success('Đã tạo sơ đồ tư duy thành công!');
        setIsCreating(false);
        await fetchMindmapsList();
        if (res?.mindmap) setActiveMindmap(res.mindmap);
      } else if (isEditing && activeMindmap) {
        const res = await updateMindmap(activeMindmap.id, {
          title: formTitle.trim() || 'Sơ đồ tư duy',
          mermaid_code: formMermaidCode.trim(),
          document_id: formDocId,
        });
        toast.success('Đã lưu thay đổi sơ đồ tư duy!');
        setIsEditing(false);
        await fetchMindmapsList();
        if (res?.mindmap) setActiveMindmap(res.mindmap);
      }
    } catch (err: any) {
      console.error('Error saving mindmap:', err);
      toast.error(err.message || 'Không thể lưu sơ đồ tư duy');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mindmapId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sơ đồ tư duy này?')) {
      return;
    }

    try {
      await deleteMindmap(mindmapId);
      toast.success('Đã xóa sơ đồ tư duy');
      if (activeMindmap?.id === mindmapId) {
        setActiveMindmap(null);
        setIsEditing(false);
        setIsCreating(false);
      }
      fetchMindmapsList();
    } catch (err: any) {
      console.error('Error deleting mindmap:', err);
      toast.error(err.message || 'Lỗi khi xóa sơ đồ tư duy');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã Mermaid');
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0B0F17] text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser}
      />

      <div className="pt-20 flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-gray-200/80 dark:border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <Link
              href="/library"
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              title="Quay lại Thư viện"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Network size={20} />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-zinc-100 leading-tight">Sơ đồ tư duy (Mindmap)</h1>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Trực quan hóa cấu trúc kiến thức và mối quan hệ khái niệm</p>
              </div>
            </div>
          </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0D2B24] hover:bg-[#16483C] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Tạo sơ đồ mới</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 sm:w-96 border-r border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col flex-shrink-0 transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800/80 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sơ đồ theo tiêu đề..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 hover:bg-gray-100/70 focus:bg-white dark:bg-zinc-800/70 dark:hover:bg-zinc-800 dark:focus:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 dark:focus:ring-emerald-500/20 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 dark:focus:ring-emerald-500/20"
            >
              <option value="ALL">Tất cả sơ đồ ({mindmaps.length})</option>
              <option value="STANDALONE">Sơ đồ độc lập</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id.toString()}>
                  {doc.title.length > 32 ? doc.title.slice(0, 32) + '...' : doc.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800/80">
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500">
                <Loader2 size={24} className="animate-spin text-[#0D2B24] dark:text-emerald-400 mb-2" />
                <span className="text-xs">Đang tải sơ đồ...</span>
              </div>
            ) : mindmaps.length === 0 ? (
              <div className="p-8 text-center">
                <Network size={32} className="mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
                <p className="text-xs font-semibold text-gray-600 dark:text-zinc-300">Chưa có sơ đồ tư duy nào</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">Bấm nút Tạo sơ đồ mới để bắt đầu phác thảo kiến thức.</p>
              </div>
            ) : (
              mindmaps.map((m) => {
                const isSelected = activeMindmap?.id === m.id && !isCreating;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setActiveMindmap(m);
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className={`p-4 cursor-pointer transition-colors text-left ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-l-4 border-[#0D2B24] dark:border-emerald-400'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-zinc-100 line-clamp-1">
                        {m.title || 'Sơ đồ không tiêu đề'}
                      </h3>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1 shrink-0">
                        <Clock size={11} />
                        {new Date(m.updated_at || m.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {m.document_title ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-[10px] font-medium rounded-md truncate max-w-full">
                        <BookOpen size={10} className="shrink-0 text-emerald-700 dark:text-emerald-400" />
                        <span className="truncate">{m.document_title}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 dark:bg-zinc-800/60 text-gray-400 dark:text-zinc-500 text-[10px] font-medium rounded-md">
                        Độc lập
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 bg-white dark:bg-[#0B0F17] flex flex-col overflow-y-auto transition-colors">
          {isCreating || isEditing ? (
            /* Mindmap Editor */
            <div className="p-6 sm:p-8 max-w-4xl w-full mx-auto flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Edit3 size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                    {isCreating ? 'Thiết kế sơ đồ tư duy mới' : 'Chỉnh sửa sơ đồ tư duy'}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0D2B24] hover:bg-[#16483C] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Lưu sơ đồ</span>
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Tiêu đề sơ đồ
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Nhập tên sơ đồ tư duy..."
                    className="w-full px-3.5 py-2.5 text-sm font-semibold border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-gray-900 dark:text-zinc-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 dark:focus:ring-emerald-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Gắn với tài liệu học tập (Tùy chọn)
                  </label>
                  <select
                    value={formDocId === null ? '' : formDocId.toString()}
                    onChange={(e) => setFormDocId(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 dark:focus:ring-emerald-500/20 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                  >
                    <option value="">-- Không gắn (Sơ đồ độc lập) --</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id.toString()}>
                        {doc.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Templates Selector */}
                {isCreating && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                      Mẫu sơ đồ nhanh:
                    </label>
                    <div className="flex gap-2">
                      {DEFAULT_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormMermaidCode(tmpl.code)}
                          className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-800 dark:hover:text-emerald-400 text-[11px] font-medium text-gray-700 dark:text-zinc-300 rounded-lg transition-colors border border-gray-200 dark:border-zinc-700"
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mermaid Code Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                      Mã Mermaid
                    </label>
                    <span className="text-[11px] text-gray-400 dark:text-zinc-500">Hỗ trợ cú pháp Mermaid mindmap</span>
                  </div>
                  <textarea
                    value={formMermaidCode}
                    onChange={(e) => setFormMermaidCode(e.target.value)}
                    rows={8}
                    className="w-full p-3 font-mono text-xs border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 dark:focus:ring-emerald-500/20 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Live Preview Section */}
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Xem trước trực quan
                </h4>
                <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-zinc-900/60 min-h-[300px]">
                  <MermaidViewer chartCode={formMermaidCode} />
                </div>
              </div>
            </div>
          ) : activeMindmap ? (
            /* Mindmap Viewer */
            <div className="p-6 sm:p-8 max-w-5xl w-full mx-auto flex flex-col flex-1">
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 leading-snug">
                    {activeMindmap.title || 'Sơ đồ tư duy'}
                  </h2>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Cập nhật: {new Date(activeMindmap.updated_at || activeMindmap.created_at).toLocaleString('vi-VN')}
                    </span>
                    {activeMindmap.document_title && (
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-medium">
                        <Paperclip size={11} />
                        {activeMindmap.document_title}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopyCode(activeMindmap.mermaid_code)}
                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Sao chép mã Mermaid"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleStartEdit(activeMindmap)}
                    className="p-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Chỉnh sửa sơ đồ"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(activeMindmap.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Xóa sơ đồ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Visual Interactive Diagram */}
              <div className="flex-1 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 shadow-xs overflow-auto flex items-center justify-center min-h-[450px]">
                <MermaidViewer chartCode={activeMindmap.mermaid_code} />
              </div>

              {/* Attached Document Quick Link */}
              {activeMindmap.document_id && (
                <div className="mt-6 p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300">Sơ đồ gắn liền với tài liệu:</p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium truncate">{activeMindmap.document_title}</p>
                    </div>
                  </div>
                  <Link
                    href={`/viewer/${activeMindmap.document_id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-50 dark:hover:bg-zinc-700 shrink-0 transition-colors"
                  >
                    <span>Mở tài liệu</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-zinc-500">
              <Network size={48} className="text-gray-200 dark:text-zinc-700 mb-3" />
              <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300 mb-1">Chọn hoặc tạo sơ đồ tư duy</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-sm">
                Sơ đồ tư duy giúp liên kết các ý niệm bài học thành bức tranh tổng thể rõ ràng, trực quan.
              </p>
              <button
                onClick={handleStartCreate}
                className="mt-4 px-4 py-2 bg-[#0D2B24] hover:bg-[#16483C] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                + Bắt đầu tạo sơ đồ mới
              </button>
            </div>
          )}
        </main>
      </div>
      </div>

      <RegisterModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        triggerMessage={triggerMessage} 
      />
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
      />
    </div>
  );
}
