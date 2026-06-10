"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, File, X, Loader2, Sparkles, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface GeneratedCard {
  front: string;
  back: string;
}

interface AIFlashcardLabProps {
  onClose: () => void;
  onSaveDeck: (cards: GeneratedCard[], deckName: string) => void;
}

const SUPPORTED_TYPES = [
  'application/pdf', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'text/plain'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function AIFlashcardLab({ onClose, onSaveDeck }: AIFlashcardLabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [deckName, setDeckName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const handleFileSelect = (file: File) => {
    setError(null);
    if (!SUPPORTED_TYPES.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setError('Định dạng file không được hỗ trợ. Chỉ nhận .PDF, .DOCX, .TXT, .XLSX, .CSV');
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Dung lượng file vượt quá 10MB.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    // Tự động gợi ý tên bộ thẻ từ tên file
    setDeckName(file.name.replace(/\.[^/.]+$/, ""));
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      // Lấy URL backend (API_BASE_URL)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // Gọi API Backend Node.js
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/ai/generate-flashcards-from-file`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Có lỗi xảy ra khi gọi AI.');
      }

      const data = await response.json();
      if (data.cards && data.cards.length > 0) {
        setGeneratedCards(data.cards);
        toast.success(`Đã tạo thành công ${data.cards.length} thẻ!`);
      } else {
        throw new Error('AI không tìm thấy nội dung phù hợp để tạo thẻ.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống. Vui lòng thử lại.');
      toast.error('Quá trình sinh thẻ thất bại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditCard = (index: number, field: 'front' | 'back', value: string) => {
    const newCards = [...generatedCards];
    newCards[index][field] = value;
    setGeneratedCards(newCards);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#fafafa] w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="bg-white px-8 py-6 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-[#10b981]">
              <Sparkles size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">AI Flashcard Lab</h2>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Tự động trích xuất kiến thức từ tài liệu của bạn</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-8 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            
            {/* TRẠNG THÁI 1: UPLOAD FILE */}
            {generatedCards.length === 0 && !isProcessing && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto w-full flex flex-col items-center"
              >
                <div 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-12 border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-white
                    ${isDragging ? 'border-[#10b981] bg-emerald-50/50 scale-[1.02]' : 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/20'}
                    ${error ? 'border-red-300 bg-red-50/30' : ''}
                  `}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.docx,.txt,.xlsx,.xls,.csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0]);
                    }}
                  />
                  
                  {selectedFile ? (
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-emerald-100 rounded-full text-[#10b981] shadow-inner">
                        <FileText size={48} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{selectedFile.name}</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-emerald-50 rounded-full text-[#10b981] mb-6 shadow-sm">
                        <UploadCloud size={48} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Kéo thả file vào đây</h3>
                      <p className="text-gray-500 font-medium mb-6">hoặc click để chọn file từ máy tính</p>
                      
                      <div className="flex gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
                        <span>Hỗ trợ định dạng: .PDF, .DOCX, .TXT, .XLSX, .CSV</span>
                        <span className="text-gray-300">|</span>
                        <span>Tối đa: 10MB</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Hiển thị lỗi */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 px-6 py-4 rounded-xl border border-red-100 w-full"
                    >
                      <AlertCircle size={20} strokeWidth={2.5} />
                      <span className="font-bold">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Nút hành động */}
                {selectedFile && !error && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    onClick={handleGenerate}
                    className="mt-8 px-10 py-4 bg-[#10b981] hover:bg-[#059669] text-white font-black text-lg rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                  >
                    <Sparkles size={20} />
                    Bắt đầu sinh thẻ bằng AI
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* TRẠNG THÁI 2: LOADING */}
            {isProcessing && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center space-y-8 min-h-[400px]"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[#10b981] blur-2xl opacity-20 rounded-full animate-pulse"></div>
                  <Loader2 size={64} className="text-[#10b981] animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-black text-gray-800">AI đang đọc tài liệu...</h3>
                  <p className="text-gray-500 font-medium">Đang trích xuất kiến thức và đóng gói thành Flashcard. Vui lòng đợi trong giây lát.</p>
                </div>
                {/* Giả lập thanh tiến trình chạy liên tục */}
                <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#10b981] rounded-full animate-[loading_2s_ease-in-out_infinite] w-1/3"></div>
                </div>
              </motion.div>
            )}

            {/* TRẠNG THÁI 3: KẾT QUẢ & CHỈNH SỬA */}
            {generatedCards.length > 0 && !isProcessing && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full"
              >
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Review Bộ thẻ</h3>
                    <p className="text-gray-500 text-sm font-medium">AI đã tìm thấy {generatedCards.length} khái niệm quan trọng.</p>
                  </div>
                  <input 
                    type="text" 
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Tên bộ thẻ..."
                    className="border-2 border-gray-200 rounded-xl px-4 py-2 font-bold text-gray-800 outline-none focus:border-[#10b981] transition-colors w-64"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedCards.map((card, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border-2 border-emerald-50 shadow-sm relative group hover:border-emerald-200 transition-all">
                      <div className="absolute top-4 right-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={16} />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1 block">Thuật ngữ (Front)</label>
                          <textarea 
                            value={card.front}
                            onChange={(e) => handleEditCard(idx, 'front', e.target.value)}
                            className="w-full font-bold text-lg text-gray-800 outline-none resize-none bg-transparent"
                            rows={2}
                          />
                        </div>
                        <div className="h-px bg-gray-100 w-full"></div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-emerald-500 tracking-wider mb-1 block">Định nghĩa (Back)</label>
                          <textarea 
                            value={card.back}
                            onChange={(e) => handleEditCard(idx, 'back', e.target.value)}
                            className="w-full font-medium text-gray-600 outline-none resize-none bg-transparent"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER ACTION */}
        {generatedCards.length > 0 && !isProcessing && (
          <div className="bg-white border-t border-gray-100 p-6 flex justify-end gap-4">
            <button 
              onClick={() => { setGeneratedCards([]); setSelectedFile(null); }}
              className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Hủy bỏ & Làm lại
            </button>
            <button 
              onClick={() => onSaveDeck(generatedCards, deckName)}
              className="px-8 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 size={20} />
              Lưu vào kho thẻ
            </button>
          </div>
        )}
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}} />
    </div>
  );
}
