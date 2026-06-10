"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getNotesByDocument, saveNote } from '@/services/note.service';
import { Check, Loader2, Download, Trash2, BookOpen, Sparkles, X } from 'lucide-react';
import { generateFlashcardsFromNote, getDecks, createDeck, createFlashcard } from '@/services/flashcard.service';

interface Props {
  documentId: number;
}

export default function SmartNotesWorkspace({ documentId }: Props) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Flashcard Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | ''>('');
  const [newDeckName, setNewDeckName] = useState('');
  const [toastMessage, setToastMessage] = useState('');

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

  // Load decks for flashcard generation
  const fetchDecks = async () => {
    try {
      const data = await getDecks();
      setDecks(data || []);
      if (data && data.length > 0) {
        setSelectedDeckId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

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

  const handleOpenDeckModal = () => {
    if (!content.trim()) {
      alert("Vui lòng ghi chú thêm nội dung trước khi tạo flashcard.");
      return;
    }
    fetchDecks();
    setShowDeckModal(true);
  };

  const handleGenerateFlashcard = async () => {
    setIsGenerating(true);
    try {
      let finalDeckId = selectedDeckId;
      
      // If user typed a new deck name, create it first
      if (newDeckName.trim()) {
        const newDeck = await createDeck(newDeckName, `Tạo tự động từ Ghi chú (Doc ID: ${documentId})`);
        finalDeckId = newDeck.id;
      }

      if (!finalDeckId) {
        alert("Vui lòng chọn hoặc tạo bộ bài (Deck) mới.");
        setIsGenerating(false);
        return;
      }

      // Bắt chính xác đoạn text bôi đen bên trong Textarea
      const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement;
      let selection = '';
      if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
        selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      }
      
      const textToGenerate = selection && selection.length > 10 ? selection : content;

      if (!textToGenerate || textToGenerate.trim() === '') {
        alert("Ghi chú của bạn đang trống, không thể tạo flashcard!");
        setIsGenerating(false);
        return;
      }

      // Fast-path Parsing (AI Bypass): Kiểm tra nếu người dùng đã tự định dạng chuẩn "Front: Back" hoặc "Front - Back"
      const lines = textToGenerate.split('\n').filter(line => line.trim().length > 0);
      const manualCards = [];
      // Regex bắt các chuỗi có định dạng: "Từ khóa : Định nghĩa" hoặc "Từ khóa - Định nghĩa"
      const delimiterRegex = /^(.*?)\s*(:| - | – | — )\s*(.*)$/;
      
      for (const line of lines) {
        const match = line.match(delimiterRegex);
        if (match && match[1].trim() && match[3].trim()) {
          manualCards.push({ front: match[1].trim(), back: match[3].trim() });
        }
      }

      // Nếu ít nhất 50% số dòng tuân theo quy tắc tự định nghĩa, ta bỏ qua gọi AI để tiết kiệm Token và thời gian
      if (manualCards.length > 0 && manualCards.length >= lines.length / 2) {
        await Promise.all(manualCards.map(card => 
          createFlashcard(Number(finalDeckId), card.front, card.back, documentId)
        ));
        
        setToastMessage(`⚡ Tạo siêu tốc ${manualCards.length} thẻ (Bỏ qua AI)!`);
        setTimeout(() => setToastMessage(''), 3000);
        setShowDeckModal(false);
        setNewDeckName('');
        setIsGenerating(false);
        return;
      }

      const response = await generateFlashcardsFromNote(textToGenerate, Number(finalDeckId), documentId);
      
      if (!response.cards || response.cards.length === 0) {
        alert("AI không thể trích xuất được khái niệm nào từ nội dung này. Vui lòng thử bôi đen một đoạn văn bản rõ ràng hơn có chứa định nghĩa hoặc từ khóa.");
        setIsGenerating(false);
        return;
      }

      setToastMessage(`Đã tạo thành công ${response.cards.length} thẻ!`);
      setTimeout(() => setToastMessage(''), 3000);
      setShowDeckModal(false);
      setNewDeckName('');
    } catch (error: any) {
      alert("Lỗi khi tạo flashcard: " + error.message);
    } finally {
      setIsGenerating(false);
    }
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
              onClick={handleOpenDeckModal}
              className="px-2 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#0D2B24] to-[#1a3a2a] hover:opacity-90 rounded-md transition-all shadow-sm"
              title="Tạo bộ thẻ (Flashcard) từ ghi chú bằng AI"
            >
              <Sparkles size={13} className="text-yellow-300" />
              Tạo Flashcards
            </button>
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
          id="note-textarea"
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

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-10 animate-fade-in-up">
            <Check size={14} className="text-green-400" />
            {toastMessage}
          </div>
        )}

        {/* Deck Selection Modal */}
        {showDeckModal && (
          <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#FAF8F5]">
                <h4 className="font-bold text-[#0D2B24] text-sm flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-500" />
                  Lưu Flashcard vào đâu?
                </h4>
                <button onClick={() => setShowDeckModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 flex flex-col gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Chọn bộ bài (Deck) có sẵn</label>
                  <select 
                    className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#0D2B24]"
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(Number(e.target.value))}
                    disabled={newDeckName.length > 0}
                  >
                    <option value="" disabled>-- Chọn bộ bài --</option>
                    {decks.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Hoặc</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tạo bộ bài mới</label>
                  <input 
                    type="text"
                    placeholder="Nhập tên bộ bài mới..."
                    className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D2B24]"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  onClick={() => setShowDeckModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleGenerateFlashcard}
                  disabled={isGenerating || (!selectedDeckId && !newDeckName)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0D2B24] hover:bg-[#1a3a2a] rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <><Loader2 size={14} className="animate-spin" /> Đang tạo bằng AI...</>
                  ) : (
                    'Tiến hành tạo thẻ'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
