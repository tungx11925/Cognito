"use client";

import React, { useState } from 'react';
import { useStudy } from '../../../context/StudyContext';
import { useRouter } from 'next/navigation';

export default function LibraryPage() {
  const {
    documents,
    handleOpenWorkspace,
    handleDeleteDocument,
    showAddDocModal,
    setShowAddDocModal,
    newDocTitle,
    setNewDocTitle,
    newDocCat,
    setNewDocCat,
    newDocDesc,
    setNewDocDesc,
    newDocContent,
    setNewDocContent,
    newDocSolution,
    setNewDocSolution,
    handleAddDocumentSubmit,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter
  } = useStudy();

  const router = useRouter();

  // Filter documents based on query and category
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0D2B24] tracking-tight">Thư viện Tài liệu ({documents.length})</h2>
          <p className="text-xs text-[#0D2B24]/50 font-semibold mt-0.5">Tải lên các tài liệu học tập hoặc lời giải để ôn tập cùng trợ lý AI.</p>
        </div>
        <button 
          onClick={() => setShowAddDocModal(true)}
          className="bg-[#0D2B24] text-white hover:bg-[#0D2B24]/90 text-xs font-black px-4.5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tải lên Tài liệu
        </button>
      </div>

      {/* API Stats Overview Banner */}
      <div className="bg-[#0D2B24] rounded-3xl p-6 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black tracking-tight uppercase text-emerald-400">System Integration Status</h3>
            <p className="text-[11px] text-white/60 mt-1 font-semibold">
              Docker API Gateway: <span className="font-mono text-emerald-300">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-300 text-[9px] font-black uppercase tracking-wider">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {[
            { method: 'GET', path: '/documents', desc: 'Fetch Library' },
            { method: 'POST', path: '/documents', desc: 'Create Doc' },
            { method: 'POST', path: '/ai/chat', desc: 'AI Assistant' },
            { method: 'POST', path: '/ai/generate-quiz', desc: 'Quiz Builder' },
          ].map((ep, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[8px] font-black px-1.5 py-0.5 rounded shrink-0">
                {ep.method}
              </span>
              <div className="min-w-0">
                <p className="text-white font-mono text-[9px] truncate">{ep.path}</p>
                <p className="text-white/40 text-[8px] truncate">{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white border border-[#0D2B24]/10 rounded-2xl p-4 shadow-sm justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-[#0D2B24]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Tìm kiếm tài liệu..." 
            className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#0D2B24]/10 rounded-xl text-[#0D2B24] text-xs focus:outline-none focus:border-[#0D2B24] transition-all placeholder:text-[#0D2B24]/30"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-[#0D2B24]/40 uppercase tracking-wide mr-1">Chủ đề:</span>
          {['all', 'Trí tuệ nhân tạo', 'Toán học', 'Ngoại ngữ'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all ${
                categoryFilter === cat 
                  ? 'bg-[#0D2B24] text-white border-[#0D2B24] shadow-sm' 
                  : 'bg-white text-[#0D2B24]/70 border-[#0D2B24]/10 hover:bg-[#FAF8F5]'
              }`}
            >
              {cat === 'all' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Documents */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white border border-[#0D2B24]/10 rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-[#FAF8F5] rounded-full flex items-center justify-center mx-auto text-[#0D2B24]/40 border border-[#0D2B24]/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-[#0D2B24] font-bold text-xs">Thư viện trống</h4>
          <p className="text-[#0D2B24]/60 text-[11px] leading-relaxed max-w-xs mx-auto">
            Không tìm thấy tài liệu nào khớp. Tải lên tài liệu mới để bắt đầu học tập cùng AI.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id}
              className="bg-white border border-[#0D2B24]/10 hover:border-[#0D2B24]/20 rounded-3xl p-5.5 flex flex-col justify-between min-h-[190px] transition-all hover:shadow-md shadow-sm relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black px-2.5 py-0.5 bg-[#0D2B24]/5 border border-[#0D2B24]/10 rounded-full text-[#0D2B24]/80">
                    {doc.category}
                  </span>
                  <span className="text-[10px] text-[#0D2B24]/40 font-semibold">
                    {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0D2B24] truncate leading-tight group-hover:text-[#0D2B24]/80 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-[#0D2B24]/60 text-[11px] mt-2 line-clamp-2 leading-relaxed font-normal">
                  {doc.description || 'Chưa có mô tả chi tiết cho tài liệu này.'}
                </p>
              </div>

              <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-[#0D2B24]/5">
                <button
                  onClick={() => {
                    handleOpenWorkspace(doc);
                    router.push('/ai-lab');
                  }}
                  className="bg-[#0D2B24] hover:bg-[#0D2B24]/90 text-white font-extrabold text-[10px] px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Tự học AI
                </button>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-rose-600 hover:text-rose-700 font-extrabold text-[10px] px-3 py-2 rounded-lg transition-colors hover:bg-rose-50"
                >
                  Xóa tài liệu
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global Upload Document Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-[#0D2B24]/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#0D2B24]/10 rounded-3xl w-full max-w-xl p-6.5 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#0D2B24]/10 pb-3">
              <h3 className="text-md font-bold text-[#0D2B24]">Tải lên Tài liệu học tập mới</h3>
              <button 
                onClick={() => setShowAddDocModal(false)}
                className="text-[#0D2B24]/40 hover:text-[#0D2B24] transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddDocumentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Tên tài liệu *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Lời giải tích toán học 1..."
                    className="w-full bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition placeholder:text-[#0D2B24]/30"
                    value={newDocTitle}
                    onChange={e => setNewDocTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Danh mục học tập</label>
                  <select 
                    className="w-full bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition placeholder:text-[#0D2B24]/30"
                    value={newDocCat}
                    onChange={e => setNewDocCat(e.target.value)}
                  >
                    <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
                    <option value="Toán học">Toán học</option>
                    <option value="Ngoại ngữ">Ngoại ngữ</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Mô tả ngắn</label>
                <input 
                  type="text" 
                  placeholder="Mô tả nội dung chính..."
                  className="w-full bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition placeholder:text-[#0D2B24]/30"
                  value={newDocDesc}
                  onChange={e => setNewDocDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Nội dung văn bản tài liệu *</label>
                <textarea 
                  required
                  placeholder="Gõ hoặc dán nội dung chính của tài liệu học tập vào đây..."
                  className="w-full h-24 bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition resize-none font-sans placeholder:text-[#0D2B24]/30"
                  value={newDocContent}
                  onChange={e => setNewDocContent(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wide">Lời giải chi tiết đính kèm (Bản Text/Markdown)</label>
                <textarea 
                  placeholder="Nhập phần giải đáp, lời giải chi tiết cho các câu hỏi..."
                  className="w-full h-20 bg-[#FAF8F5] border border-[#0D2B24]/10 focus:border-[#0D2B24] rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none transition resize-none font-mono placeholder:text-[#0D2B24]/30"
                  value={newDocSolution}
                  onChange={e => setNewDocSolution(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#0D2B24]/10">
                <button 
                  type="submit"
                  className="flex-1 bg-[#0D2B24] hover:bg-[#0D2B24]/90 text-white text-xs font-black py-3 rounded-xl transition shadow-sm"
                >
                  Xác nhận tải lên
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddDocModal(false)}
                  className="px-6 py-3 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 border border-[#0D2B24]/10 text-[#0D2B24]/80 font-bold text-xs rounded-xl transition shadow-sm"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
