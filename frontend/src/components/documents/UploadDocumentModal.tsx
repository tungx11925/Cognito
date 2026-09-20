'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, File, AlertCircle, CheckCircle2, Loader2, FileText, Image, RefreshCw } from 'lucide-react';
import { getDocumentStatus, reprocessDocument, DocumentProcessingStatus } from '@/services/document.service';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultCategory?: string;
  existingCategories?: string[];
}

const MAX_SIZE_MB = 25;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return <Image className="mx-auto h-10 w-10 text-blue-500" />;
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return <FileText className="mx-auto h-10 w-10 text-red-500" />;
  if (file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) return <FileText className="mx-auto h-10 w-10 text-orange-500" />;
  return <File className="mx-auto h-10 w-10 text-[#1a3a2a]" />;
}


export default function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = '',
  existingCategories = [],
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState<DocumentProcessingStatus | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStopRef = useRef(false);

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  // Auto-fill title from filename
  const handleFileSelect = useCallback((selected: File) => {
    const isPptxExt = selected.name.endsWith('.pptx') || selected.name.endsWith('.ppt');
    if (!ALLOWED_TYPES.includes(selected.type) && !isPptxExt) {
      setError('Chỉ chấp nhận PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), TXT hoặc ảnh');
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File không được vượt quá ${MAX_SIZE_MB}MB`);
      return;
    }
    setError('');
    setFile(selected);
    if (!title) {
      const baseName = selected.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName);
    }
  }, [title]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleUpload = async () => {
    if (!file) { setError('Vui lòng chọn file tài liệu.'); return; }
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề tài liệu.'); return; }

    setUploadState('uploading');
    setUploadProgress(0);
    setError('');
    pollStopRef.current = false;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    if (description.trim()) formData.append('description', description.trim());
    if (category.trim()) formData.append('category', category.trim());

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 201 || xhr.status === 200) {
          const docId = res?.document?.id || res?.id;
          if (docId) {
            setUploadState('processing');
            pollPipeline(docId, 0);
          } else {
            setUploadState('success');
            setTimeout(() => { onSuccess(); handleClose(); }, 1200);
          }
        } else {
          setUploadState('error');
          setError(res.error || 'Có lỗi xảy ra khi tải lên tài liệu.');
        }
      } catch {
        setUploadState('error');
        setError('Phản hồi không hợp lệ từ server.');
      }
    };

    xhr.onerror = () => {
      setUploadState('error');
      setError('Lỗi mạng, không thể kết nối đến server.');
    };

    xhr.open('POST', `${API_BASE}/documents/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  };

  /** Poll trạng thái pipeline: PENDING → PARSING → CHUNKING → EXTRACTING_KEYWORDS → READY/FAILED */
  const pollPipeline = (docId: number, attempt = 0) => {
    if (pollStopRef.current) return;
    if (attempt > 100) { // ~5 phút
      setUploadState('error');
      setError('Xử lý tài liệu mất quá lâu. Bạn có thể kiểm tra lại từ Thư viện.');
      return;
    }
    getDocumentStatus(docId).then((data: any) => {
      if (pollStopRef.current) return;
      if (data?.error) {
        setUploadState('error');
        setError(data.error || 'Không kiểm tra được trạng thái xử lý.');
        return;
      }
      setPipelineStatus(data);
      const effectiveStatus = data?.processing_status || data?.status;
      if (effectiveStatus === 'READY') {
        setUploadState('success');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1200);
      } else if (effectiveStatus === 'FAILED') {
        setUploadState('error');
        setError(data.processing_error || 'Xử lý tài liệu thất bại.');
      } else {
        pollTimerRef.current = setTimeout(() => pollPipeline(docId, attempt + 1), 3000);
      }
    }).catch(() => {
      pollTimerRef.current = setTimeout(() => pollPipeline(docId, attempt + 1), 3000);
    });
  };

  const handleRetryPipeline = async () => {
    if (!pipelineStatus?.id) return;
    setError('');
    setUploadState('processing');
    try {
      await reprocessDocument(pipelineStatus.id);
      pollPipeline(pipelineStatus.id, 0);
    } catch {
      setUploadState('error');
      setError('Không thể thử lại. Vui lòng tải lại trang.');
    }
  };

  const handleClose = () => {
    if (uploadState === 'uploading' && xhrRef.current) {
      xhrRef.current.abort();
    }
    pollStopRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    setFile(null);
    setTitle('');
    setDescription('');
    setCategory(defaultCategory);
    setUploadProgress(0);
    setUploadState('idle');
    setPipelineStatus(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const isUploading = uploadState === 'uploading';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Tải lên tài liệu</h2>
            <p className="text-xs text-gray-400 mt-0.5">PDF, Word, TXT, ảnh · Tối đa {MAX_SIZE_MB}MB · Lưu trên Cloud</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100"
              >
                <AlertCircle size={16} className="shrink-0" />
                <p className="flex-1">{error}</p>
                {(pipelineStatus?.status === 'FAILED' || pipelineStatus?.processing_status === 'FAILED') && (
                  <button
                    onClick={handleRetryPipeline}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                  >
                    <RefreshCw size={12} /> Thử lại
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isUploading}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 focus:border-[#1a3a2a] transition-all text-sm disabled:opacity-60"
              placeholder="VD: Bài giảng Toán Cao Cấp..."
            />
          </div>

          {/* Category */}
          {!defaultCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                list="category-suggestions"
                disabled={isUploading}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 focus:border-[#1a3a2a] transition-all text-sm disabled:opacity-60"
                placeholder="VD: Toán học, IT, Ngoại ngữ..."
              />
              {existingCategories.length > 0 && (
                <datalist id="category-suggestions">
                  {existingCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (Tùy chọn)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              disabled={isUploading}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 focus:border-[#1a3a2a] transition-all text-sm resize-none disabled:opacity-60"
              placeholder="Nhập mô tả cho tài liệu này..."
            />
          </div>

          {/* Drop Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File tài liệu <span className="text-red-500">*</span>
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all duration-200 ${
                isDragging
                  ? 'border-[#1a3a2a] bg-[#1a3a2a]/8 scale-[1.01]'
                  : file
                  ? 'border-[#1a3a2a] bg-[#1a3a2a]/5'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              } ${isUploading ? 'pointer-events-none opacity-70' : 'cursor-pointer'}`}
            >
              <div className="space-y-2 text-center">
                {file ? (
                  <>
                    {getFileIcon(file)}
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[220px] mx-auto">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    {!isUploading && (
                      <button
                        onClick={() => { setFile(null); setError(''); setTitle(''); }}
                        className="text-xs text-red-400 hover:text-red-600 underline"
                      >
                        Chọn file khác
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <UploadCloud className={`mx-auto h-12 w-12 transition-colors ${isDragging ? 'text-[#1a3a2a]' : 'text-gray-400'}`} />
                    <div className="flex text-sm text-gray-500 justify-center gap-1">
                      <label className="relative rounded-md font-medium text-[#1a3a2a] cursor-pointer hover:underline">
                        <span>Chọn file</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileInputChange}
                          accept=".pdf,.doc,.docx,.pptx,.ppt,.txt,.png,.jpg,.jpeg,.webp"
                        />
                      </label>
                      <span>hoặc kéo thả vào đây</span>
                    </div>
                    <p className="text-xs text-gray-400">PDF, PPTX, Word, TXT, Ảnh · Tối đa {MAX_SIZE_MB}MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-[#1a3a2a]" />
                    Đang tải file lên Cloud...
                  </span>
                  <span className="font-mono font-medium text-[#1a3a2a]">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#1a3a2a] to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: 'linear', duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Pipeline Stepper */}
          <AnimatePresence>
            {uploadState === 'processing' && (() => {
              const currentStatus = pipelineStatus?.processing_status || pipelineStatus?.status || 'PENDING';
              const STEPS = [
                { key: 'PENDING', label: 'Tải lên', desc: 'Đã nhận file, đưa vào hàng đợi...' },
                { key: 'PARSING', label: 'Phân tích', desc: 'Trích xuất văn bản & OCR ảnh...' },
                { key: 'CHUNKING', label: 'Phân đoạn', desc: 'Tách đoạn ngữ nghĩa thông minh...' },
                { key: 'EXTRACTING_KEYWORDS', label: 'Từ khoá AI', desc: 'Trích xuất thuật ngữ & trọng tâm...' },
                { key: 'READY', label: 'Sẵn sàng', desc: 'Hoàn tất! Sẵn sàng tạo đề thi.' },
              ];

              const statusOrder: Record<string, number> = {
                PENDING: 0,
                PARSING: 1,
                PROCESSING: 1,
                CHUNKING: 2,
                INDEXING: 2,
                EXTRACTING_KEYWORDS: 3,
                READY: 4,
              };

              const activeIdx = statusOrder[currentStatus] ?? 0;
              const currentDesc = STEPS[activeIdx]?.desc || 'Đang xử lý tài liệu...';

              return (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-[#f8faf9] border border-gray-200 rounded-2xl space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin text-[#1a3a2a]" />
                      Tiến trình xử lý tài liệu
                    </span>
                    {pipelineStatus?.page_count ? (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {pipelineStatus.page_count} trang/slide
                      </span>
                    ) : null}
                  </div>

                  {/* 5-Step Horizontal Stepper */}
                  <div className="relative flex items-center justify-between px-1">
                    {/* Background track line */}
                    <div className="absolute left-3 right-3 top-3 -translate-y-1/2 h-0.5 bg-gray-200 -z-0" />
                    {/* Active track line */}
                    <div
                      className="absolute left-3 top-3 -translate-y-1/2 h-0.5 bg-[#1a3a2a] transition-all duration-500 -z-0"
                      style={{ width: `${(Math.min(activeIdx, 4) / 4) * 94}%` }}
                    />

                    {STEPS.map((step, idx) => {
                      const isCompleted = idx < activeIdx || currentStatus === 'READY';
                      const isCurrent = idx === activeIdx && currentStatus !== 'READY';

                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                              isCompleted
                                ? 'bg-[#1a3a2a] text-white shadow-sm ring-2 ring-[#1a3a2a]/20'
                                : isCurrent
                                ? 'bg-[#1a3a2a] text-white ring-4 ring-[#1a3a2a]/25 animate-pulse'
                                : 'bg-white border-2 border-gray-300 text-gray-400'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] mt-1.5 text-center leading-tight whitespace-nowrap transition-colors ${
                              isCompleted || isCurrent ? 'font-bold text-[#1a3a2a]' : 'font-medium text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-500 text-center italic bg-white/70 py-1.5 px-3 rounded-lg border border-gray-100">
                    {currentDesc}
                  </p>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Success State */}
          <AnimatePresence>
            {uploadState === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100"
              >
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>Tải lên thành công! Đang chuyển hướng...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            {uploadState === 'processing' ? 'Đóng' : 'Hủy'}
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || uploadState === 'processing' || uploadState === 'success' || !file || !title.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-[#1a3a2a] rounded-xl hover:bg-[#234b37] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang tải...
              </>
            ) : uploadState === 'success' ? (
              <>
                <CheckCircle2 size={15} />
                Thành công!
              </>
            ) : (
              <>
                <UploadCloud size={15} />
                Tải lên Cloud
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
