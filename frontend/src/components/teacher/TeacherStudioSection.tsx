"use client";

import React, { useState, useEffect } from 'react';
import { getLectures, uploadLecture, deleteLecture } from '@/services/lecture.service';
import { 
  Presentation, 
  Upload, 
  Play, 
  Trash2, 
  Plus, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Clock, 
  Loader2,
  X,
  Search,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface TeacherStudioSectionProps {
  dark: boolean;
  primaryColor: string;
  textMain: string;
  textSub: string;
  sidebarBorder: string;
  cardBorder: string;
}

export default function TeacherStudioSection({
  dark,
  primaryColor,
  textMain,
  textSub,
  sidebarBorder,
  cardBorder
}: TeacherStudioSectionProps) {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Khoa học máy tính');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const data = await getLectures();
      if (Array.isArray(data)) {
        setLectures(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải danh sách bài giảng');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Vui lòng chọn file tài liệu (PDF, DOCX, TXT)');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (title.trim()) formData.append('title', title.trim());
      if (subject.trim()) formData.append('subject', subject.trim());

      toast.loading('AI đang phân tích tài liệu và tạo các Slide Chapter...', { id: 'upload_lecture_lib' });
      const created = await uploadLecture(formData);
      toast.dismiss('upload_lecture_lib');

      if (created && created.id) {
        toast.success('Đã tạo bộ Slide bài giảng thành công!');
        setShowUploadModal(false);
        setFile(null);
        setTitle('');
        fetchLectures();
      } else {
        toast.error(created?.error || 'Không thể tạo bài giảng lúc này.');
      }
    } catch (e) {
      toast.dismiss('upload_lecture_lib');
      toast.error('Đã có lỗi xảy ra trong quá trình xử lý file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, lectureTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa bộ Slide "${lectureTitle}" không?`)) return;
    try {
      await deleteLecture(id);
      toast.success('Đã xóa bài giảng');
      setLectures(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      toast.error('Không thể xóa bài giảng');
    }
  };

  const filteredLectures = lectures.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (l.subject && l.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubjectFilter === 'all' || l.subject === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  const subjectsList = ['all', ...Array.from(new Set(lectures.map(l => l.subject).filter(Boolean)))];

  return (
    <div className="space-y-6">
      {/* HEADER BANNER CARD */}
      <div 
        className="rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md"
        style={{
          background: dark 
            ? 'linear-gradient(135deg, #132b1d 0%, #0c1a12 100%)' 
            : 'linear-gradient(135deg, #1a3d28 0%, #0d1a14 100%)',
          color: '#ffffff',
          border: `2px solid ${dark ? '#22543d' : 'rgba(26,61,40,0.3)'}`
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold uppercase tracking-wider border border-white/15">
              <Presentation size={14} className="text-emerald-400" /> 
              Teacher Presentation Studio
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight leading-snug">
              Không gian Giảng dạy & Trình chiếu Slide
            </h2>
            <p className="text-emerald-100/80 text-xs md:text-sm leading-relaxed">
              Tải lên giáo trình tài liệu để AI tự động chuyển hóa thành Slide bài giảng trực quan theo từng Chapter, sẵn sàng trình chiếu trực tiếp trên lớp học.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 text-[#0d1a14] font-extrabold rounded-2xl shadow-lg transition-all cursor-pointer text-xs shrink-0"
          >
            <Plus size={16} className="stroke-[3]" /> Tải lên Giáo trình / Slide mới
          </button>
        </div>

        {/* Decorative glow */}
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* TOOLBAR */}
      <div 
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl border"
        style={{
          background: dark ? '#1e1e1e' : '#ffffff',
          borderColor: sidebarBorder,
          boxShadow: dark ? '4px 4px 0 rgba(0,0,0,0.2)' : '4px 4px 0 rgba(26,46,28,0.06)'
        }}
      >
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search 
              size={14} 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" 
              style={{ color: textSub }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm bài giảng, môn học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl outline-none transition-all"
              style={{
                background: dark ? '#161616' : '#f5f3ee',
                color: textMain,
                border: `1px solid ${sidebarBorder}`
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: textSub }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto">
            {subjectsList.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubjectFilter(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSubjectFilter === sub
                    ? 'bg-[#1a3d28] text-white'
                    : (dark ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                {sub === 'all' ? 'Tất cả chủ đề' : sub}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 text-xs font-bold" style={{ color: textSub }}>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <BookOpen size={13} /> {filteredLectures.length} Bài giảng
          </span>
          <span className="text-xs">Role: <b style={{ color: textMain }}>Teacher</b></span>
        </div>
      </div>

      {/* LECTURES LIST */}
      {loading ? (
        <div 
          className="flex flex-col items-center justify-center py-20 rounded-3xl border"
          style={{ background: dark ? '#1e1e1e' : '#ffffff', borderColor: sidebarBorder }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d28] mb-2" />
          <p className="text-xs font-bold" style={{ color: textSub }}>Đang tải danh sách bài giảng...</p>
        </div>
      ) : filteredLectures.length === 0 ? (
        <div 
          className="text-center py-14 rounded-3xl border p-8 max-w-md mx-auto"
          style={{ background: dark ? '#1e1e1e' : '#ffffff', borderColor: sidebarBorder }}
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-[#1a3d28] flex items-center justify-center mx-auto mb-3">
            <Presentation size={28} />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: textMain }}>Chưa có bộ Slide bài giảng nào</h3>
          <p className="text-xs mb-5 leading-relaxed" style={{ color: textSub }}>
            Tải lên tài liệu giáo trình (PDF, Word DOCX) để AI tự động chuyển hóa thành Slide theo từng Chapter và bài thuyết trình trực quan.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-[#1a3d28] hover:bg-[#143020] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            + Tạo bài giảng ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLectures.map((lecture) => (
            <motion.div
              key={lecture.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
              className="rounded-3xl border overflow-hidden shadow-sm flex flex-col group"
              style={{
                background: dark ? '#1e1e1e' : '#ffffff',
                borderColor: cardBorder,
                boxShadow: dark ? '4px 4px 0 rgba(0,0,0,0.3)' : '4px 4px 0 rgba(26,46,28,0.08)'
              }}
            >
              {/* Cover */}
              <div 
                className="h-36 p-5 flex flex-col justify-between relative overflow-hidden text-white"
                style={{ 
                  background: lecture.cover_color 
                    ? `linear-gradient(135deg, ${lecture.cover_color} 0%, #0d1a14 100%)` 
                    : 'linear-gradient(135deg, #0f2b1d 0%, #08150f 100%)' 
                }}
              >
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/20 uppercase tracking-wider text-emerald-100">
                    {lecture.subject || 'Khoa học'}
                  </span>
                  <button
                    onClick={(e) => handleDelete(lecture.id, lecture.title, e)}
                    className="p-1.5 text-white/60 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Xóa bài giảng"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="z-10 mt-1">
                  <h3 className="font-serif font-bold text-base leading-snug line-clamp-2 text-white group-hover:text-emerald-200 transition-colors">
                    {lecture.title}
                  </h3>
                </div>

                <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-emerald-400/20 blur-lg pointer-events-none" />
              </div>

              {/* Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-xs line-clamp-2 mb-4 leading-relaxed" style={{ color: textSub }}>
                  {lecture.description || 'Bộ slide bài giảng chuẩn cấu trúc từng Chapter, tích hợp công thức và ghi chú.'}
                </p>

                <div 
                  className="flex items-center justify-between text-xs font-bold mb-4 pt-3 border-t"
                  style={{ borderColor: dark ? '#2a2a2a' : 'rgba(26,46,28,0.08)' }}
                >
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <Layers size={13} /> {lecture.total_slides || 24} Slide bài giảng
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: textSub }}>
                    <Clock size={13} className="text-amber-500" /> {lecture.chapter_count || 3} Chapter
                  </span>
                </div>

                <Link
                  href={`/teacher/presentation/${lecture.id}`}
                  className="w-full py-2.5 px-4 bg-[#1a3d28] hover:bg-[#143020] text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 group-hover:bg-emerald-800 cursor-pointer"
                >
                  <Play size={13} className="fill-white" /> Bắt đầu Trình chiếu
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <div 
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => !uploading && setShowUploadModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="rounded-3xl p-6 max-w-lg w-full shadow-2xl border relative"
              style={{
                background: dark ? '#1e1e1e' : '#ffffff',
                borderColor: sidebarBorder,
                color: textMain
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="absolute top-5 right-5 p-1.5 rounded-xl transition-colors cursor-pointer"
                style={{ color: textSub }}
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#1a3d28] flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Tải lên Giáo trình / Slide</h3>
                  <p className="text-xs" style={{ color: textSub }}>AI sẽ tự động tách các Chapter thành Slide trình chiếu chuẩn sư phạm</p>
                </div>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: textMain }}>
                    Tên bài giảng / Môn học
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ví dụ: Kỹ thuật Lập trình Web & AI"
                    className="w-full px-4 py-2.5 text-xs rounded-xl focus:outline-none transition-all"
                    style={{
                      background: dark ? '#161616' : '#f5f3ee',
                      color: textMain,
                      border: `1px solid ${sidebarBorder}`
                    }}
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: textMain }}>
                    Chủ đề / Ngành học
                  </label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl focus:outline-none transition-all"
                    style={{
                      background: dark ? '#161616' : '#f5f3ee',
                      color: textMain,
                      border: `1px solid ${sidebarBorder}`
                    }}
                    disabled={uploading}
                  >
                    <option value="Khoa học máy tính">Khoa học máy tính / CNTT</option>
                    <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo & Machine Learning</option>
                    <option value="Toán học & Giải tích">Toán học & Giải tích</option>
                    <option value="Kinh tế & Quản trị">Kinh tế & Quản trị</option>
                    <option value="Ngoại ngữ & Ngôn ngữ">Ngoại ngữ & Ngôn ngữ</option>
                    <option value="Y Dược & Sinh học">Y Dược & Sinh học</option>
                    <option value="Khác">Chủ đề khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: textMain }}>
                    Tệp tài liệu giáo trình (PDF, DOCX, TXT)
                  </label>
                  <label 
                    className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                    style={{
                      borderColor: sidebarBorder,
                      background: dark ? '#161616' : '#f5f3ee/50'
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Upload size={22} className="text-emerald-600" />
                    <span className="text-xs font-bold" style={{ color: textMain }}>
                      {file ? file.name : 'Bấm để chọn file hoặc kéo thả vào đây'}
                    </span>
                    <span className="text-[11px]" style={{ color: textSub }}>
                      {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Hỗ trợ PDF, Word (.docx) tối đa 25MB'}
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="w-full py-3 bg-[#1a3d28] hover:bg-[#143020] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> AI đang bóc tách Slide & Chapter...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Bắt đầu tạo Slide Trình chiếu
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
