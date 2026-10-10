"use client";

import React, { useState, useEffect } from 'react';
import { 
  Pin, PinOff, Edit2, X, Check, History, Sparkles, BookOpen, 
  Globe, ChevronDown, Plus, Trash2, Bookmark
} from 'lucide-react';
import { 
  getPromptTemplates, createPromptTemplate, deletePromptTemplate,
  getPromptHistory, addPromptHistory, togglePinPromptHistory, deletePromptHistory,
  PromptTemplateItem, PromptHistoryItem 
} from '@/services/ai-prompt.service';
import toast from 'react-hot-toast';

export interface ActivePromptState {
  text: string;
  label?: string;
  contextMode: 'DOCUMENT_CONTEXT' | 'GENERAL';
  scope: 'full' | 'pages' | 'selection';
  scopeDetails?: string;
  isPinned: boolean;
}

interface Props {
  documentId?: number;
  activePrompt: ActivePromptState | null;
  onChangeActivePrompt: (prompt: ActivePromptState | null) => void;
  className?: string;
}

export default function StickyPromptBar({
  documentId,
  activePrompt,
  onChangeActivePrompt,
  className = ''
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [templates, setTemplates] = useState<PromptTemplateItem[]>([]);
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // Load templates and history on mount
  useEffect(() => {
    loadTemplates();
    loadHistory();
  }, [documentId]);

  const loadTemplates = async () => {
    try {
      const data = await getPromptTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.warn('Lỗi tải mẫu prompt:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getPromptHistory(documentId);
      setHistory(data || []);
      // If no active prompt currently, but there's a pinned prompt in history, restore it
      if (!activePrompt && data && data.length > 0) {
        const pinned = data.find(h => h.is_pinned);
        if (pinned) {
          onChangeActivePrompt({
            text: pinned.prompt_text,
            label: 'Prompt đã ghim',
            contextMode: pinned.context_mode === 'general' ? 'GENERAL' : 'DOCUMENT_CONTEXT',
            scope: (pinned.scope as any) || 'full',
            isPinned: true
          });
        }
      }
    } catch (err) {
      console.warn('Lỗi tải lịch sử prompt:', err);
    }
  };

  const handleStartEdit = () => {
    setEditText(activePrompt?.text || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) {
      onChangeActivePrompt(null);
    } else {
      onChangeActivePrompt({
        text: editText.trim(),
        label: activePrompt?.label || 'Chỉ dẫn tùy chỉnh',
        contextMode: activePrompt?.contextMode || 'DOCUMENT_CONTEXT',
        scope: activePrompt?.scope || 'full',
        scopeDetails: activePrompt?.scopeDetails,
        isPinned: activePrompt?.isPinned || false
      });
    }
    setIsEditing(false);
  };

  const handleTogglePin = async () => {
    if (!activePrompt) return;
    const newPinned = !activePrompt.isPinned;
    onChangeActivePrompt({
      ...activePrompt,
      isPinned: newPinned
    });

    try {
      // Save or update in history
      await addPromptHistory({
        document_id: documentId || null,
        prompt_text: activePrompt.text,
        context_mode: activePrompt.contextMode === 'GENERAL' ? 'general' : 'document',
        scope: activePrompt.scope,
        is_pinned: newPinned
      });
      loadHistory();
      toast.success(newPinned ? 'Đã ghim prompt cho các câu hỏi tiếp theo' : 'Đã bỏ ghim prompt');
    } catch (err) {
      console.warn('Lỗi ghim prompt:', err);
    }
  };

  const handleClear = () => {
    onChangeActivePrompt(null);
    setIsEditing(false);
  };

  const handleSelectTemplate = (tpl: PromptTemplateItem) => {
    onChangeActivePrompt({
      text: tpl.prompt_text,
      label: tpl.title,
      contextMode: activePrompt?.contextMode || 'DOCUMENT_CONTEXT',
      scope: activePrompt?.scope || 'full',
      isPinned: activePrompt?.isPinned || false
    });
    setShowTemplates(false);
    toast.success(`Đã áp dụng mẫu: "${tpl.title}"`);
  };

  const handleSelectHistory = (item: PromptHistoryItem) => {
    onChangeActivePrompt({
      text: item.prompt_text,
      label: 'Từ lịch sử',
      contextMode: item.context_mode === 'general' ? 'GENERAL' : 'DOCUMENT_CONTEXT',
      scope: (item.scope as any) || 'full',
      isPinned: item.is_pinned
    });
    setShowHistory(false);
  };

  const handleCreateCustomTemplate = async () => {
    if (!newTemplateTitle.trim() || !newTemplateText.trim()) {
      toast.error('Vui lòng nhập tên và nội dung mẫu prompt');
      return;
    }
    try {
      await createPromptTemplate({
        title: newTemplateTitle.trim(),
        prompt_text: newTemplateText.trim(),
        category: 'custom'
      });
      toast.success('Đã lưu mẫu prompt mới!');
      setNewTemplateTitle('');
      setNewTemplateText('');
      setIsCreatingTemplate(false);
      loadTemplates();
    } catch (err: any) {
      toast.error('Lỗi khi lưu mẫu: ' + (err.message || 'Thử lại sau'));
    }
  };

  const handleDeleteCustomTemplate = async (id: number) => {
    try {
      await deletePromptTemplate(id);
      toast.success('Đã xóa mẫu');
      loadTemplates();
    } catch (err: any) {
      toast.error('Không thể xóa mẫu: ' + err.message);
    }
  };

  const handleDeleteHistoryItem = async (id: number) => {
    try {
      await deletePromptHistory(id);
      loadHistory();
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className={`sticky top-0 z-30 w-full bg-emerald-50/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-emerald-200/80 dark:border-zinc-800 text-xs shadow-xs px-3 py-2 transition-all ${className}`}>
      {/* ── Active Prompt Bar Content ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Indicator & Content */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
            {activePrompt ? (activePrompt.label || 'Chỉ dẫn') : 'Chưa đặt prompt'}
          </span>

          {activePrompt && (
            <div className="flex items-center gap-1.5 shrink-0 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-0.5">
                {activePrompt.contextMode === 'DOCUMENT_CONTEXT' ? (
                  <BookOpen size={11} className="text-emerald-600" />
                ) : (
                  <Globe size={11} className="text-blue-500" />
                )}
                {activePrompt.contextMode === 'DOCUMENT_CONTEXT' ? 'Theo tài liệu' : 'Tổng quát'}
              </span>
              <span>•</span>
              <span className="capitalize">
                {activePrompt.scope === 'full' ? 'Cả tài liệu' : activePrompt.scope === 'pages' ? (activePrompt.scopeDetails || 'Theo trang') : 'Đoạn chọn'}
              </span>
            </div>
          )}

          {/* Prompt text or Edit inline */}
          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <input
                type="text"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                placeholder="Ví dụ: Trả lời ngắn gọn, tiếng Việt, có ví dụ minh họa..."
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 outline-hidden focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
              <button 
                onClick={handleSaveEdit} 
                className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all"
                title="Lưu chỉ dẫn"
              >
                <Check size={13} />
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="p-1 rounded-md bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 active:scale-95 transition-all"
                title="Hủy"
              >
                <X size={13} />
              </button>
            </div>
          ) : activePrompt ? (
            <div 
              onClick={handleStartEdit} 
              className="flex-1 truncate cursor-pointer text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-medium pl-1"
              title="Nhấn để chỉnh sửa chỉ dẫn này"
            >
              &quot;{activePrompt.text}&quot;
            </div>
          ) : (
            <div 
              onClick={handleStartEdit}
              className="flex-1 truncate cursor-pointer text-gray-400 dark:text-gray-500 italic hover:text-emerald-600 transition-colors"
            >
              Nhấn để đặt chỉ dẫn prompt cố định cho AI...
            </div>
          )}
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {activePrompt && !isEditing && (
            <>
              {/* Sửa inline */}
              <button
                onClick={handleStartEdit}
                className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-100/60 dark:hover:bg-zinc-800 transition-all active:scale-95"
                title="Sửa prompt trực tiếp"
              >
                <Edit2 size={13} />
              </button>

              {/* Ghim / Bỏ ghim */}
              <button
                onClick={handleTogglePin}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  activePrompt.isPinned 
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-200/70 dark:bg-emerald-950 font-bold' 
                    : 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-100/60 dark:hover:bg-zinc-800'
                }`}
                title={activePrompt.isPinned ? "Bỏ ghim prompt" : "Ghim prompt (áp dụng liên tục)"}
              >
                {activePrompt.isPinned ? <Pin size={13} className="fill-current text-emerald-600" /> : <Pin size={13} />}
              </button>

              {/* Xóa prompt */}
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all active:scale-95"
                title="Xóa prompt hiện tại"
              >
                <X size={13} />
              </button>
            </>
          )}

          {/* Button Mẫu Prompt */}
          <button
            onClick={() => { setShowTemplates(v => !v); setShowHistory(false); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-2xs"
          >
            <Bookmark size={11} />
            Mẫu
            <ChevronDown size={11} />
          </button>

          {/* Button Lịch sử Prompt */}
          <button
            onClick={() => { setShowHistory(v => !v); setShowTemplates(false); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-2xs"
            title="Lịch sử các câu lệnh đã dùng"
          >
            <History size={11} />
            Lịch sử
          </button>
        </div>
      </div>

      {/* ── Dropdown: Mẫu Prompt ── */}
      {showTemplates && (
        <div className="mt-2 p-3 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-72 overflow-y-auto z-40 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100 dark:border-zinc-800">
            <span className="font-bold text-gray-800 dark:text-gray-200 text-[12px] flex items-center gap-1.5">
              <Bookmark size={13} className="text-emerald-600" />
              Mẫu prompt có sẵn
            </span>
            <button
              onClick={() => setIsCreatingTemplate(v => !v)}
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Plus size={12} />
              {isCreatingTemplate ? 'Đóng tạo' : 'Tạo mẫu mới'}
            </button>
          </div>

          {/* Form thêm custom template */}
          {isCreatingTemplate && (
            <div className="mb-3 p-2.5 bg-emerald-50/70 dark:bg-zinc-800/80 rounded-lg border border-emerald-200 dark:border-zinc-700 space-y-2">
              <input
                type="text"
                placeholder="Tên mẫu (ví dụ: Tóm tắt 3 ý chính)"
                value={newTemplateTitle}
                onChange={e => setNewTemplateTitle(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
              />
              <textarea
                placeholder="Nội dung prompt chỉ dẫn..."
                value={newTemplateText}
                onChange={e => setNewTemplateText(e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsCreatingTemplate(false)}
                  className="px-2 py-1 text-[11px] rounded bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateCustomTemplate}
                  className="px-2.5 py-1 text-[11px] rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Lưu mẫu
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {templates.map(tpl => (
              <div
                key={tpl.id}
                className="group relative p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-zinc-800 transition-all text-left flex flex-col justify-between"
              >
                <div 
                  onClick={() => handleSelectTemplate(tpl)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-[11.5px]">
                      {tpl.title}
                    </span>
                    {tpl.is_system && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-gray-100 dark:bg-zinc-800 text-gray-500 rounded">
                        Hệ thống
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-gray-500 dark:text-gray-400 line-clamp-2">
                    {tpl.prompt_text}
                  </p>
                </div>

                {!tpl.is_system && (
                  <button
                    onClick={() => handleDeleteCustomTemplate(tpl.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                    title="Xóa mẫu riêng"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dropdown: Lịch sử Prompt ── */}
      {showHistory && (
        <div className="mt-2 p-3 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-72 overflow-y-auto z-40 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100 dark:border-zinc-800">
            <span className="font-bold text-gray-800 dark:text-gray-200 text-[12px] flex items-center gap-1.5">
              <History size={13} className="text-emerald-600" />
              Lịch sử câu lệnh gần đây
            </span>
            <span className="text-[10px] text-gray-400">
              {history.length} câu lệnh
            </span>
          </div>

          {history.length === 0 ? (
            <p className="text-center py-4 text-gray-400 text-[11px] italic">
              Chưa có lịch sử câu lệnh nào
            </p>
          ) : (
            <div className="space-y-1.5">
              {history.map(item => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-2 p-2 rounded-lg border border-gray-100 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-zinc-800 transition-all text-left"
                >
                  <div
                    onClick={() => handleSelectHistory(item)}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {item.is_pinned && <Pin size={10} className="fill-current text-emerald-600 shrink-0" />}
                      <span className="text-[10px] text-gray-400">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.context_mode === 'general' ? 'Tổng quát' : 'Tài liệu'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium truncate">
                      {item.prompt_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={async () => {
                        await togglePinPromptHistory(item.id);
                        loadHistory();
                      }}
                      className="p-1 text-gray-400 hover:text-emerald-600"
                      title={item.is_pinned ? "Bỏ ghim" : "Ghim"}
                    >
                      <Pin size={12} className={item.is_pinned ? "fill-current text-emerald-600" : ""} />
                    </button>
                    <button
                      onClick={() => handleDeleteHistoryItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Xóa khỏi lịch sử"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
