"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, BookOpen, Tag, MoreVertical, FileText, Calendar, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getDocuments } from "@/services/document.service";
import UploadDocumentModal from "@/components/documents/UploadDocumentModal";
import Link from 'next/link';

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await getDocuments(search, categoryFilter);
      if (!data.error) {
        setDocuments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadDocuments();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, categoryFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#111827", marginBottom: "4px", fontSize: "22px", fontWeight: 700 }}>Thư viện của tôi</h1>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>Quản lý và ôn tập các tài liệu cá nhân của bạn</p>
        </div>
        <motion.button
          onClick={() => setIsUploadOpen(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-sm"
          style={{ fontSize: "13px", fontWeight: 600, background: "#1a3a2a" }}
        >
          <Plus size={14} /> Tải lên tài liệu
        </motion.button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none shadow-sm transition-all"
            style={{ background: "#fff", border: "1px solid #e5e7eb", fontSize: "14px", color: "#374151" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#1a3a2a")}
            onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
          />
        </div>
        
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl outline-none shadow-sm cursor-pointer"
          style={{ fontSize: "13.5px", fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e5e7eb" }}
        >
          <option value="">Tất cả danh mục</option>
          <option value="Toán học">Toán học</option>
          <option value="Ngoại ngữ">Ngoại ngữ</option>
          <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
          <option value="Khác">Khác</option>
        </select>
      </div>

      {/* Cards list */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-10 text-center">
            <div className="w-6 h-6 border-2 border-[#1a3a2a]/30 border-t-[#1a3a2a] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Đang tải tài liệu...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">Chưa có tài liệu nào</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">Hãy tải lên tài liệu đầu tiên của bạn để bắt đầu học tập.</p>
            <button onClick={() => setIsUploadOpen(true)} className="text-sm text-[#1a3a2a] font-semibold hover:underline">
              Tải lên ngay &rarr;
            </button>
          </div>
        ) : (
          documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(selected === doc.id ? null : doc.id)}
              className="bg-white rounded-xl cursor-pointer transition-shadow duration-150 relative group"
              style={{
                border: selected === doc.id ? "1px solid #1a3a2a" : "1px solid #f3f4f6",
                boxShadow: selected === doc.id ? "0 0 0 3px rgba(26,58,42,0.08)" : "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#f0f4f2" }}>
                  <FileText size={18} style={{ color: "#1a3a2a" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#1a3a2a", background: "#e8f0eb", padding: "2px 8px", borderRadius: "6px" }}>
                        {doc.category || 'Khác'}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Calendar size={11} />
                        {formatDate(doc.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[15px] text-gray-900 font-semibold mb-1 line-clamp-1 group-hover:text-[#1a3a2a] transition-colors">{doc.title}</p>
                  <p className="text-[13px] text-gray-500 line-clamp-1">{doc.description || 'Không có mô tả.'}</p>
                  
                  <AnimatePresence>
                    {selected === doc.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-100 flex gap-2"
                      >
                        <Link 
                          href={`/viewer/${doc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 bg-[#1a3a2a] text-white text-[13px] font-semibold rounded-lg hover:bg-[#234b37] transition-colors"
                        >
                          Mở tài liệu (Học tập)
                        </Link>
                        <a 
                          href={doc.doc_url} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Tải xuống
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isUploadOpen && (
          <UploadDocumentModal 
            isOpen={isUploadOpen} 
            onClose={() => setIsUploadOpen(false)} 
            onSuccess={loadDocuments}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
