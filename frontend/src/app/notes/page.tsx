"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  FileText, Search, Plus, Trash2, Edit3, Save, 
  Paperclip, BookOpen, Loader2, ArrowLeft, Copy, 
  ExternalLink, Check, Clock, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getNotes, createNote, updateNote, deleteNote, NoteItem 
} from '@/services/note.service';
import { getDocuments } from '@/services/document.service';

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [documents, setDocuments] = useState<Array<{ id: number; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('ALL');
  
  // Selected note for viewing/editing
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDocId, setFormDocId] = useState<number | null>(null);

  const fetchNotesList = useCallback(async () => {
    try {
      setLoading(true);
      const params: { q?: string; document_id?: number } = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedDocId !== 'ALL' && selectedDocId !== 'STANDALONE') {
        params.document_id = parseInt(selectedDocId, 10);
      }
      const res = await getNotes(params);
      let fetchedNotes = res?.notes || [];
      if (selectedDocId === 'STANDALONE') {
        fetchedNotes = fetchedNotes.filter(n => !n.document_id);
      }
      setNotes(fetchedNotes);
      if (fetchedNotes.length > 0 && !activeNote && !isCreating) {
        setActiveNote(fetchedNotes[0]);
      }
    } catch (err: any) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedDocId]);

  useEffect(() => {
    fetchNotesList();
  }, [fetchNotesList]);

  // Load user's documents for the dropdown selector
  useEffect(() => {
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
  }, []);

  const handleStartCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setFormTitle('Ghi chú mới');
    setFormContent('');
    setFormDocId(selectedDocId !== 'ALL' && selectedDocId !== 'STANDALONE' ? parseInt(selectedDocId, 10) : null);
    setActiveNote(null);
  };

  const handleStartEdit = (note: NoteItem) => {
    setIsEditing(true);
    setIsCreating(false);
    setActiveNote(note);
    setFormTitle(note.title || 'Ghi chú');
    setFormContent(note.content || '');
    setFormDocId(note.document_id || null);
  };

  const handleSave = async () => {
    if (!formContent.trim()) {
      toast.error('Vui lòng nhập nội dung ghi chú');
      return;
    }

    try {
      setSaving(true);
      if (isCreating) {
        const res = await createNote({
          title: formTitle.trim() || 'Ghi chú mới',
          content: formContent.trim(),
          document_id: formDocId,
        });
        toast.success('Đã tạo ghi chú thành công!');
        setIsCreating(false);
        await fetchNotesList();
        if (res?.note) setActiveNote(res.note);
      } else if (isEditing && activeNote) {
        const res = await updateNote(activeNote.id, {
          title: formTitle.trim() || 'Ghi chú',
          content: formContent.trim(),
          document_id: formDocId,
        });
        toast.success('Đã lưu thay đổi ghi chú!');
        setIsEditing(false);
        await fetchNotesList();
        if (res?.note) setActiveNote(res.note);
      }
    } catch (err: any) {
      console.error('Error saving note:', err);
      toast.error(err.message || 'Không thể lưu ghi chú');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ghi chú này? Thao tác không thể hoàn tác.')) {
      return;
    }

    try {
      await deleteNote(noteId);
      toast.success('Đã xóa ghi chú');
      if (activeNote?.id === noteId) {
        setActiveNote(null);
        setIsEditing(false);
        setIsCreating(false);
      }
      fetchNotesList();
    } catch (err: any) {
      console.error('Error deleting note:', err);
      toast.error(err.message || 'Lỗi khi xóa ghi chú');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép nội dung vào bộ nhớ tạm');
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/study-sessions"
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            title="Quay lại Hub học tập"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Sổ tay ghi chú học tập</h1>
              <p className="text-xs text-gray-500">Quản lý và tra cứu ghi chú kiến thức cá nhân</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0D2B24] hover:bg-[#16483C] text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Tạo ghi chú mới</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Notes List & Filters */}
        <aside className="w-80 sm:w-96 border-r border-gray-200/80 bg-white flex flex-col flex-shrink-0">
          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm ghi chú theo từ khóa..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10"
              >
                <option value="ALL">Tất cả ghi chú ({notes.length})</option>
                <option value="STANDALONE">Ghi chú độc lập</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id.toString()}>
                    {doc.title.length > 32 ? doc.title.slice(0, 32) + '...' : doc.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={24} className="animate-spin text-[#0D2B24] mb-2" />
                <span className="text-xs">Đang tải ghi chú...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-600">Không tìm thấy ghi chú nào</p>
                <p className="text-[11px] text-gray-400 mt-1">Bấm nút Tạo ghi chú mới để thêm bản ghi đầu tiên.</p>
              </div>
            ) : (
              notes.map((note) => {
                const isSelected = activeNote?.id === note.id && !isCreating;
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNote(note);
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className={`p-4 cursor-pointer transition-colors text-left ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-4 border-[#0D2B24]'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xs font-bold text-gray-900 line-clamp-1">
                        {note.title || 'Ghi chú không tiêu đề'}
                      </h3>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                        <Clock size={11} />
                        {new Date(note.updated_at || note.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
                      {note.content}
                    </p>

                    {note.document_title ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-md truncate max-w-full">
                        <BookOpen size={10} className="shrink-0 text-emerald-700" />
                        <span className="truncate">{note.document_title}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-medium rounded-md">
                        Độc lập
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Content Pane: View or Edit/Create */}
        <main className="flex-1 bg-white flex flex-col overflow-y-auto">
          {isCreating || isEditing ? (
            /* Note Editor Form */
            <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                    <Edit3 size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {isCreating ? 'Soạn ghi chú mới' : 'Chỉnh sửa ghi chú'}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0D2B24] hover:bg-[#16483C] text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Lưu ghi chú</span>
                  </button>
                </div>
              </div>

              {/* Title & Document Association Input */}
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tiêu đề ghi chú
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Nhập tiêu đề ghi chú..."
                    className="w-full px-3.5 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Gắn với tài liệu học tập (Tùy chọn)
                  </label>
                  <select
                    value={formDocId === null ? '' : formDocId.toString()}
                    onChange={(e) => setFormDocId(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 bg-white"
                  >
                    <option value="">-- Không gắn (Ghi chú độc lập) --</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id.toString()}>
                        {doc.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 flex flex-col min-h-[300px]">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nội dung chi tiết
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Viết nội dung ghi chú, công thức, tóm tắt bài học tại đây..."
                    className="w-full flex-1 p-4 text-xs font-sans leading-relaxed border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D2B24]/10 resize-none"
                  />
                </div>
              </div>
            </div>
          ) : activeNote ? (
            /* Note Reader View */
            <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto flex flex-col flex-1">
              {/* Note Header & Actions */}
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">
                    {activeNote.title || 'Ghi chú không tiêu đề'}
                  </h2>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Cập nhật: {new Date(activeNote.updated_at || activeNote.created_at).toLocaleString('vi-VN')}
                    </span>
                    {activeNote.document_title && (
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                        <Paperclip size={11} />
                        {activeNote.document_title}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(activeNote.content)}
                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Sao chép nội dung"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleStartEdit(activeNote)}
                    className="p-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Chỉnh sửa ghi chú"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(activeNote.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa ghi chú"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Note Content Body */}
              <div className="flex-1 bg-gray-50/50 border border-gray-100 rounded-2xl p-6 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                {activeNote.content}
              </div>

              {/* Attached Document Quick Link Banner */}
              {activeNote.document_id && (
                <div className="mt-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen size={18} className="text-emerald-700 shrink-0" />
                    <div className="truncate">
                      <p className="text-[11px] font-semibold text-emerald-900">Ghi chú gắn liền với tài liệu:</p>
                      <p className="text-xs text-emerald-800 font-medium truncate">{activeNote.document_title}</p>
                    </div>
                  </div>
                  <Link
                    href={`/viewer?id=${activeNote.document_id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-50 shrink-0 transition-colors"
                  >
                    <span>Mở tài liệu</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <FileText size={48} className="text-gray-200 mb-3" />
              <h3 className="text-sm font-bold text-gray-700 mb-1">Chọn hoặc tạo một ghi chú để bắt đầu</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Ghi chú giúp bạn lưu trữ kiến thức trọng tâm, tóm tắt tài liệu và ôn luyện dễ dàng hơn.
              </p>
              <button
                onClick={handleStartCreate}
                className="mt-4 px-4 py-2 bg-[#0D2B24] hover:bg-[#16483C] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                + Soạn ghi chú ngay
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
