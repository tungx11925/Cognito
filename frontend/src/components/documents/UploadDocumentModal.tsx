'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UploadCloud, File, AlertCircle } from 'lucide-react';
import { uploadDocument } from '@/services/document.service';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadDocumentModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !title) {
      setError('Vui lòng nhập tiêu đề và chọn file.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);

    try {
      const result = await uploadDocument(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
        onClose();
        setFile(null);
        setTitle('');
        setDescription('');
        setCategory('');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải lên tài liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Tải lên tài liệu mới</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề tài liệu <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 focus:border-[#1a3a2a] transition-all text-sm"
              placeholder="VD: Bài giảng Toán Cao Cấp..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 focus:border-[#1a3a2a] transition-all text-sm"
              placeholder="VD: Toán học, IT, Ngoại ngữ..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả thêm (Tùy chọn)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 focus:border-[#1a3a2a] transition-all text-sm resize-none"
              placeholder="Nhập mô tả cho tài liệu này..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File tài liệu (PDF, DOC) <span className="text-red-500">*</span></label>
            <label className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${file ? 'border-[#1a3a2a] bg-[#1a3a2a]/5' : 'border-gray-300'}`}>
              <div className="space-y-1 text-center">
                {file ? (
                  <>
                    <File className="mx-auto h-12 w-12 text-[#1a3a2a]" />
                    <p className="text-sm text-gray-600 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative rounded-md font-medium text-[#1a3a2a] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#1a3a2a]">
                        <span>Tải file lên</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                      </span>
                      <p className="pl-1">hoặc kéo thả vào đây</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX tối đa 10MB</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white bg-[#1a3a2a] rounded-xl hover:bg-[#234b37] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang tải...
              </>
            ) : (
              'Tải lên'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
