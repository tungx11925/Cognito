'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Search, MoreVertical, Loader2, UploadCloud, Plus } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { activeUser } = useStudy();
  const orgId = (activeUser as any)?.primary_organization_id || '9873d6eb-901d-40ba-83ff-a128af55581b';

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/classes`, {
          withCredentials: true
        });
        setClasses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (orgId) {
      fetchClasses();
    }
  }, [orgId]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImportSubmit = async () => {
    if (!importFile || !orgId) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/students/import`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Đã bắt đầu tiến trình import. Vui lòng chờ trong giây lát.');
      setShowImportModal(false);
      setImportFile(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi import.');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản lý lớp học</h1>
          <p className="text-gray-500 mt-2 text-sm">Quản lý danh sách, học sinh và giảng viên các lớp học.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center ring-1 ring-emerald-500/20"
          >
            <UploadCloud size={18} className="mr-2" />
            Import CSV
          </button>
          <button className="bg-primary text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center">
            <Plus size={18} className="mr-2" />
            Thêm lớp mới
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 bg-white/50 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tên lớp học..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên Lớp</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Môn học</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">GV Chủ nhiệm</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-50">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Users size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500">Chưa có lớp học nào.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                classes.map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 mr-4 ring-1 ring-blue-500/10">
                          <Users size={18} />
                        </div>
                        <span className="font-bold text-gray-900 font-display">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-600">{c.subject_name || c.major_name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {c.teacher_name ? (
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.teacher_name}</p>
                          <p className="text-xs text-gray-500">{c.teacher_email}</p>
                        </div>
                      ) : <span className="text-gray-400 text-sm italic">Chưa phân công</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
                        Đang hoạt động
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"><MoreVertical size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {showImportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden border border-white/20"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mr-4 text-emerald-600">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-display">Import Học sinh</h2>
                  <p className="text-sm text-gray-500 mt-1">Hỗ trợ định dạng file .csv</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-100">
                  <p>File CSV cần có các cột chính xác:</p>
                  <p className="font-mono text-xs mt-2 bg-amber-100/50 p-2 rounded inline-block">ho_ten, email, ma_so_sinh_vien, chuyen_nganh, lop</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn file CSV</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                    <input 
                      type="file" 
                      accept=".csv"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      onChange={e => setImportFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleImportSubmit}
                  disabled={importing || !importFile}
                  className="px-5 py-2.5 text-white bg-emerald-600 font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
                >
                  {importing ? <Loader2 size={18} className="animate-spin mr-2" /> : <UploadCloud size={18} className="mr-2" />}
                  Tiến hành Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
