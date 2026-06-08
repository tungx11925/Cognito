"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getNotesByDocument, saveNote } from '@/services/note.service';
import { Check, Loader2, Download, Trash2, BookOpen } from 'lucide-react';

interface Props {
  documentId: number;
}

export default function SmartNotesWorkspace({ documentId }: Props) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load existing note
  useEffect(() => {
    if (!documentId) return;
    const fetchNotes = async () => {
      try {
        const notes = await getNotesByDocument(documentId);
        if (notes && notes.length > 0) {
          setContent(notes[0].content || '');
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };
    fetchNotes();
  }, [documentId]);

  // Auto-save logic with debounce
  useEffect(() => {
    if (saveStatus === 'idle') return; // Don't save immediately on mount unless changed

    const handler = setTimeout(async () => {
      setIsSaving(true);
      setSaveStatus('saving');
      try {
        await saveNote({
          document_id: documentId,
          content: content
        });
        setSaveStatus('saved');
      } catch (error) {
        console.error('Error saving note:', error);
        setSaveStatus('error');
      } finally {
        setIsSaving(false);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(handler);
  }, [content, documentId]);

  useEffect(() => {
    const handleAppendNote = (e: any) => {
      setContent(prev => prev + e.detail);
      setSaveStatus('saving');
    };
    window.addEventListener('APPEND_NOTE', handleAppendNote);
    return () => window.removeEventListener('APPEND_NOTE', handleAppendNote);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaveStatus('saving'); // Indicate that there are unsaved changes (will save soon)
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ ghi chú?')) {
      setContent('');
      setSaveStatus('saving');
    }
  };

  const handleDownload = () => {
    if (!content.trim()) return;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ghi-chu-tai-lieu-${documentId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <BookOpen size={16} className="text-[#0D2B24]" />
          Sổ tay Ghi chú
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-medium min-w-[70px] text-right">
            {saveStatus === 'saving' && (
              <span className="text-gray-500 flex items-center gap-1 justify-end">
                <Loader2 size={12} className="animate-spin" /> Đang lưu
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[#1a3a2a] flex items-center gap-1 justify-end">
                <Check size={12} /> Đã lưu
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-500 justify-end">Lỗi khi lưu</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 border-l pl-3">
            <button 
              onClick={handleDownload}
              className="p-1.5 text-gray-400 hover:text-[#0D2B24] hover:bg-gray-100 rounded-md transition-colors"
              title="Tải xuống ghi chú (.txt)"
            >
              <Download size={14} />
            </button>
            <button 
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Xóa toàn bộ ghi chú"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative bg-[#FAF8F5] rounded-xl border border-gray-200 overflow-hidden shadow-inner group">
        <textarea 
          className="absolute inset-0 w-full h-full p-5 bg-transparent resize-none text-[14px] leading-relaxed text-gray-800 placeholder-gray-400 focus:outline-none custom-scrollbar"
          placeholder="Bắt đầu ghi chú những ý chính tại đây. Hệ thống sẽ tự động lưu lại..."
          value={content}
          onChange={handleChange}
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e5e7eb 28px)',
            backgroundAttachment: 'local',
            lineHeight: '28px',
            paddingTop: '28px'
          }}
        />
      </div>
    </div>
  );
}
