'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';

export default function TeacherExamsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({
    class_id: '',
    duration_minutes: 45,
    attempt_limit: 1,
    access_code: '',
    title: '',
    due_date: ''
  });
  const [assigning, setAssigning] = useState(false);

  const { activeUser } = useStudy();

  const fetchClasses = async (orgId: string) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignModal = () => {
    const orgId = activeUser?.memberships?.[0]?.organization_id;
    if (orgId) {
      fetchClasses(orgId);
    }
    setAssignForm(prev => ({ ...prev, title: result?.testSet?.name || file?.name || 'Đề thi' }));
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async () => {
    const orgId = activeUser?.memberships?.[0]?.organization_id;
    if (!orgId || !assignForm.class_id || !result?.testSet?.id) return;
    
    setAssigning(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/classes/${assignForm.class_id}/assign`, {
        test_set_id: result.testSet.id,
        title: assignForm.title,
        duration_minutes: assignForm.duration_minutes,
        attempt_limit: assignForm.attempt_limit,
        due_date: assignForm.due_date || null,
        access_code: assignForm.access_code || null,
        is_mandatory: true
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Giao bài thành công!');
      setShowAssignModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi giao bài.');
    } finally {
      setAssigning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf' && !selected.name.endsWith('.docx')) {
        setError('Chỉ hỗ trợ file PDF hoặc DOCX');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', `Đề thi: ${file.name}`);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/test-sets/upload-exam`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi phân tích đề thi.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Đề thi & Bài tập</h1>
        <p className="text-gray-500 mt-1">Tải lên đề thi có sẵn (PDF/DOCX) để AI tự động trích xuất thành bộ câu hỏi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Tải đề thi lên</h3>
            
            <div className="mb-4">
              <label 
                htmlFor="exam-upload" 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Click để chọn file</p>
                  <p className="text-xs text-gray-400 mt-1">PDF hoặc DOCX</p>
                </div>
                <input id="exam-upload" type="file" className="hidden" accept=".pdf,.docx,application/pdf" onChange={handleFileChange} />
              </label>
            </div>

            {file && (
              <div className="flex items-center p-3 bg-indigo-50 text-indigo-700 rounded-lg mb-4 text-sm font-medium">
                <FileText size={16} className="mr-2" />
                <span className="truncate">{file.name}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start p-3 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Đang phân tích AI...
                </>
              ) : (
                'Trích xuất đề thi'
              )}
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          {result ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-green-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-green-800 flex items-center">
                    <CheckCircle2 className="mr-2" size={20} />
                    Trích xuất thành công!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">Đã tìm thấy {result.questions.length} câu hỏi trong đề thi.</p>
                </div>
                <button 
                  onClick={handleOpenAssignModal}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Lưu & Giao bài
                </button>
              </div>
              <div className="p-0 max-h-[600px] overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {result.questions.map((q: any, idx: number) => (
                    <li key={q.id || idx} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start">
                        <span className="font-bold text-indigo-600 mr-3 mt-1">Câu {idx + 1}:</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-3">{q.content}</p>
                          {q.type === 'MULTIPLE_CHOICE' && q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                              {Object.entries(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map(([key, val]: any) => {
                                const isCorrect = q.correct_answer === key || JSON.parse(q.correct_answer || '""') === key;
                                return (
                                  <div key={key} className={`p-2 rounded border text-sm ${isCorrect ? 'border-green-500 bg-green-50 text-green-700 font-medium' : 'border-gray-200 text-gray-600'}`}>
                                    <span className="font-bold mr-2">{key}.</span> {val}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Loại: {q.type} | Điểm: {q.score}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 border-dashed flex flex-col items-center justify-center p-12 text-center text-gray-500 min-h-[400px]">
              <FileText size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bản xem trước Đề thi</h3>
              <p className="max-w-md text-sm">Sau khi tải lên và phân tích, các câu hỏi được AI nhận diện sẽ hiển thị tại đây để bạn kiểm tra và chỉnh sửa.</p>
            </div>
          )}
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Giao bài cho lớp</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề bài tập</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={assignForm.title}
                  onChange={e => setAssignForm({...assignForm, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn lớp học</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={assignForm.class_id}
                  onChange={e => setAssignForm({...assignForm, class_id: e.target.value})}
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={assignForm.duration_minutes}
                    onChange={e => setAssignForm({...assignForm, duration_minutes: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lần làm bài</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={assignForm.attempt_limit}
                    onChange={e => setAssignForm({...assignForm, attempt_limit: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={assignForm.due_date}
                  onChange={e => setAssignForm({...assignForm, due_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu (Access Code)</label>
                <input 
                  type="text" 
                  placeholder="Để trống nếu không yêu cầu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={assignForm.access_code}
                  onChange={e => setAssignForm({...assignForm, access_code: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button 
                onClick={handleAssignSubmit}
                disabled={assigning || !assignForm.class_id}
                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                {assigning ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Lưu & Giao bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
