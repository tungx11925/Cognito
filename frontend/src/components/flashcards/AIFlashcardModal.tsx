"use client";

import React, { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, Loader2, Sparkles, CheckCircle2, AlertCircle, Edit2, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateFlashcardsFromFile } from '@/services/flashcard.service';

export interface GeneratedCard {
  front: string;
  back: string;
}

interface AIFlashcardModalProps {
  onClose: () => void;
  onSaveDeck: (cards: GeneratedCard[], deckName: string) => Promise<void> | void;
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

export default function AIFlashcardModal({ onClose, onSaveDeck }: AIFlashcardModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [deckName, setDeckName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [generationMetadata, setGenerationMetadata] = useState<{
    provider?: string;
    model?: string;
    isLLMGenerated?: boolean;
    warning?: string | null;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError(null);
    const fileName = file.name.toLowerCase();
    const isSupported =
      SUPPORTED_TYPES.includes(file.type) ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.pdf');

    if (!isSupported) {
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
    setDeckName(file.name.replace(/\.[^/.]+$/, ''));
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

    try {
      const data = await generateFlashcardsFromFile(selectedFile);

      if (data && data.error) {
        throw new Error(data.error);
      }

      if (data && data.cards && Array.isArray(data.cards) && data.cards.length > 0) {
        setGeneratedCards(data.cards);
        setGenerationMetadata(data.metadata || null);
        if (data.suggestedDeckName && !deckName) {
          setDeckName(data.suggestedDeckName);
        }
        if (data.metadata && data.metadata.isLLMGenerated === false) {
          toast('Bộ thẻ được sinh bằng bộ trích xuất văn bản dự phòng (không qua LLM)', { icon: '⚠️' });
        } else {
          toast.success(`Đã tạo thành công ${data.cards.length} thẻ bằng AI!`);
        }
      } else {
        throw new Error('Không tìm thấy nội dung phù hợp trong file để tạo thẻ.');
      }
    } catch (err: any) {
      console.error('[AI_FLASHCARD_ERROR]', err);
      const msg = err.message || 'Lỗi xử lý file tài liệu. Vui lòng thử lại.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditCard = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...generatedCards];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedCards(updated);
  };

  const handleSave = async () => {
    if (generatedCards.length === 0) return;

    if (generationMetadata && generationMetadata.isLLMGenerated === false) {
      const confirmSave = window.confirm(
        '⚠️ Cảnh báo: Bộ thẻ này được tạo bằng bộ trích xuất văn bản dự phòng (không qua mô hình AI), chất lượng có thể chưa tối ưu.\n\nBạn có chắc chắn muốn lưu bộ thẻ này vào kho thẻ không?'
      );
      if (!confirmSave) return;
    }

    setIsSaving(true);
    try {
      await onSaveDeck(generatedCards, deckName.trim() || 'Bộ thẻ AI');
    } catch (err: any) {
      toast.error('Lỗi khi lưu bộ thẻ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#fafafa] dark:bg-[#18181b] w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-800"
      >
        {/* HEADER */}
        <div className="bg-white dark:bg-[#202023] px-8 py-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-950/60 p-2.5 rounded-xl text-[#10b981]">
              <Sparkles size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
                AI Flashcard Lab
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                Tự động trích xuất kiến thức từ tài liệu của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto w-full flex flex-col items-center"
              >
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-12 border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-white dark:bg-[#202023]
                    ${
                      isDragging
                        ? 'border-[#10b981] bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.02]'
                        : 'border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 hover:bg-emerald-50/20'
                    }
                    ${error ? 'border-red-300 dark:border-red-900/50 bg-red-50/30' : ''}
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
                      <div className="p-4 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-[#10b981] shadow-inner">
                        <FileText size={48} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedFile.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-[#10b981] mb-6 shadow-sm">
                        <UploadCloud size={48} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Kéo thả file vào đây</h3>
                      <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">hoặc click để chọn file từ máy tính</p>

                      <div className="flex gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#18181b] px-4 py-2 rounded-xl">
                        <span>Hỗ trợ định dạng: .PDF, .DOCX, .TXT, .XLSX, .CSV</span>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <span>Tối đa: 10MB</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Hiển thị lỗi */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/30 px-6 py-4 rounded-xl border border-red-100 dark:border-red-900/50 w-full"
                    >
                      <AlertCircle size={20} strokeWidth={2.5} />
                      <span className="font-bold">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Nút hành động */}
                {selectedFile && !error && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleGenerate}
                    className="mt-8 px-10 py-4 bg-[#10b981] hover:bg-[#059669] text-white font-black text-lg rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                  >
                    <UploadCloud size={20} />
                    Bắt đầu tạo thẻ từ file
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* TRẠNG THÁI 2: LOADING */}
            {isProcessing && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center space-y-8 min-h-[400px]"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[#10b981] blur-2xl opacity-20 rounded-full animate-pulse"></div>
                  <Loader2 size={64} className="text-[#10b981] animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100">Đang đọc tài liệu...</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Đang trích xuất kiến thức và đóng gói thành Flashcard. Vui lòng đợi trong giây lát.
                  </p>
                </div>
                <div className="w-64 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#10b981] rounded-full animate-[loading_2s_ease-in-out_infinite] w-1/3"></div>
                </div>
              </motion.div>
            )}

            {/* TRẠNG THÁI 3: KẾT QUẢ & CHỈNH SỬA */}
            {generatedCards.length > 0 && !isProcessing && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Review Bộ thẻ</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                      Đã trích xuất {generatedCards.length} khái niệm quan trọng từ file.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Tên bộ thẻ..."
                    className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202023] rounded-xl px-4 py-2 font-bold text-gray-800 dark:text-gray-100 outline-none focus:border-[#10b981] transition-colors w-64"
                  />
                </div>

                {/* Cảnh báo khi thẻ sinh bằng bộ trích xuất dự phòng (heuristic) */}
                {generationMetadata && generationMetadata.isLLMGenerated === false && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-xl mt-0.5">
                        <AlertTriangle size={22} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                          Bộ thẻ được trích xuất bằng thuật toán dự phòng (Không qua AI)
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                          {generationMetadata.warning || 'Dịch vụ AI tạm thời không phản hồi. Bạn có thể bấm Thử lại bằng AI hoặc chỉnh sửa nội dung bên dưới.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                    >
                      <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
                      Thử lại bằng AI
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#202023] p-5 rounded-2xl border-2 border-emerald-50 dark:border-gray-800 shadow-sm relative group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
                    >
                      <div className="absolute top-4 right-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={16} />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1 block">
                            Thuật ngữ (Front)
                          </label>
                          <textarea
                            value={card.front}
                            onChange={(e) => handleEditCard(idx, 'front', e.target.value)}
                            className="w-full font-bold text-lg text-gray-800 dark:text-gray-100 outline-none resize-none bg-transparent"
                            rows={2}
                          />
                        </div>
                        <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-emerald-500 tracking-wider mb-1 block">
                            Định nghĩa (Back)
                          </label>
                          <textarea
                            value={card.back}
                            onChange={(e) => handleEditCard(idx, 'back', e.target.value)}
                            className="w-full font-medium text-gray-600 dark:text-gray-300 outline-none resize-none bg-transparent"
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
          <div className="bg-white dark:bg-[#202023] border-t border-gray-100 dark:border-gray-800 p-6 flex justify-end gap-4">
            <button
              onClick={() => {
                setGeneratedCards([]);
                setSelectedFile(null);
              }}
              disabled={isSaving}
              className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Hủy bỏ & Làm lại
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {isSaving ? 'Đang lưu...' : 'Lưu vào kho thẻ'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
