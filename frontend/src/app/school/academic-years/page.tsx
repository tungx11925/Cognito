'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Plus, MoreVertical, Loader2, BookOpen } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AcademicYearsPage() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');
  
  const { activeUser } = useStudy();
  const orgId = (activeUser as any)?.primary_organization_id || '9873d6eb-901d-40ba-83ff-a128af55581b';

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/academic-years`, {
        withCredentials: true
      });
      setAcademicYears(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchAcademicYears();
    }
  }, [orgId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/academic-years`, {
        name: newYearName,
        start_date: newYearStart,
        end_date: newYearEnd
      }, { withCredentials: true });
      setIsCreating(false);
      setNewYearName('');
      setNewYearStart('');
      setNewYearEnd('');
      fetchAcademicYears();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi tạo năm học');
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản lý Năm học & Học kỳ</h1>
          <p className="text-gray-500 mt-2 text-sm">Thiết lập lộ trình thời gian cho các khóa học của trường.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Tạo Năm học mới
        </button>
      </motion.div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="glass-card rounded-2xl p-6 mb-8 overflow-hidden"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4 font-display">Thiết lập Năm học mới</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên năm học</label>
                <input 
                  required
                  type="text" 
                  placeholder="VD: 2023 - 2024"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                <input 
                  required
                  type="date" 
                  value={newYearStart}
                  onChange={(e) => setNewYearStart(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                <input 
                  required
                  type="date" 
                  value={newYearEnd}
                  onChange={(e) => setNewYearEnd(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
              <div className="md:col-span-3 flex justify-end space-x-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-colors shadow-sm"
                >
                  Lưu năm học
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {academicYears.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card p-12 rounded-2xl text-center flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Calendar size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-display">Chưa có năm học nào</h3>
            <p className="text-gray-500 mt-2 max-w-sm">Hệ thống của bạn chưa thiết lập lộ trình thời gian. Hãy bắt đầu bằng việc tạo năm học đầu tiên.</p>
          </motion.div>
        ) : (
          academicYears.map((ay, index) => (
            <motion.div 
              key={ay.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5 border-b border-gray-100 bg-white/50 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-xl text-primary mr-4 ring-1 ring-primary/10 shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg font-display">{ay.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                      {new Date(ay.start_date).toLocaleDateString('vi-VN')} - {new Date(ay.end_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3 items-center">
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${ay.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200/50'}`}>
                    {ay.is_active ? 'Đang hoạt động' : 'Đã đóng'}
                  </span>
                  <button className="text-gray-400 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50 transition-colors"><MoreVertical size={18} /></button>
                </div>
              </div>
              <div className="p-6 bg-gray-50/30">
                <SemesterList orgId={orgId} academicYearId={ay.id} />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function SemesterList({ orgId, academicYearId }: { orgId: string, academicYearId: string }) {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSemesters = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/academic-years/${academicYearId}/semesters`, {
        withCredentials: true
      });
      setSemesters(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, [academicYearId]);

  const handleCloseSemester = async (semesterId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đóng học kỳ này? Học sinh và giáo viên sẽ không thể tương tác thêm.')) return;
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/semesters/${semesterId}`, {
        status: 'CLOSED'
      }, { withCredentials: true });
      fetchSemesters();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi đóng học kỳ');
    }
  };

  if (loading) return <div className="text-sm text-gray-500 py-6 text-center flex items-center justify-center"><Loader2 size={16} className="animate-spin mr-2" /> Đang tải học kỳ...</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <h4 className="font-semibold text-gray-800 flex items-center">
          <BookOpen size={16} className="mr-2 text-gray-400" /> Các học kỳ trong năm
        </h4>
        <button className="text-sm text-primary font-medium hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">+ Thêm học kỳ</button>
      </div>
      
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên học kỳ</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {semesters.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                  Chưa có học kỳ nào. Vui lòng thêm học kỳ mới.
                </td>
              </tr>
            ) : (
              semesters.map((sem) => (
                <tr key={sem.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{sem.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(sem.start_date).toLocaleDateString('vi-VN')} - {new Date(sem.end_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                      sem.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : 
                      sem.status === 'UPCOMING' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20' : 
                      'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20'
                    }`}>
                      {sem.status === 'ACTIVE' ? 'Đang diễn ra' : sem.status === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã đóng'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-right font-medium">
                    {sem.status !== 'CLOSED' ? (
                      <button 
                        onClick={() => handleCloseSemester(sem.id)} 
                        className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Đóng học kỳ
                      </button>
                    ) : (
                      <span className="text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">Đã khóa</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
