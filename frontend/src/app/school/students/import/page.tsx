'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileType, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [error, setError] = useState('');

  const user = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('user') || '{}' : '{}');
  const orgId = user.primary_organization_id || '9873d6eb-901d-40ba-83ff-a128af55581b';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/students/import`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      setJobId(res.data.jobId);
      pollStatus(res.data.jobId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi upload file');
      setIsUploading(false);
    }
  };

  const pollStatus = async (id: string) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}/students/import/${id}`,
        { withCredentials: true }
      );
      
      setJobStatus(res.data);
      
      if (res.data.status === 'PROCESSING') {
        setTimeout(() => pollStatus(id), 2000);
      } else {
        setIsUploading(false);
      }
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nhập danh sách học sinh</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {!jobId ? (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Hướng dẫn</h3>
              <p className="text-gray-500 text-sm mb-4">
                Tải lên file CSV chứa danh sách học sinh. File phải có các cột: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">ho_ten, email, ma_so_sinh_vien, chuyen_nganh, lop</code>. Tối đa 2000 dòng.
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="text-gray-400 mb-4" size={48} />
                <span className="text-sm font-medium text-gray-700 mb-1">
                  Nhấn để chọn file CSV
                </span>
                <span className="text-xs text-gray-500">
                  hoặc kéo thả file vào đây
                </span>
              </label>
            </div>

            {file && (
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center text-blue-700">
                  <FileType className="mr-3" size={20} />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="ml-2 text-xs text-blue-500">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Đang tải lên...' : 'Bắt đầu Import'}
                </button>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-start">
                <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              {jobStatus?.status === 'PROCESSING' && (
                <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></span>
              )}
              {jobStatus?.status === 'COMPLETED' && <CheckCircle className="text-green-500 mr-2" />}
              {jobStatus?.status === 'FAILED' && <XCircle className="text-red-500 mr-2" />}
              Trạng thái xử lý
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Tổng số</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStatus?.total || 0}</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Đã xử lý</p>
                  <p className="text-2xl font-bold text-blue-600">{jobStatus?.processed || 0}</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Thành công</p>
                  <p className="text-2xl font-bold text-green-600">{jobStatus?.success || 0}</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Thất bại</p>
                  <p className="text-2xl font-bold text-red-600">{jobStatus?.failed || 0}</p>
                </div>
              </div>
            </div>

            {jobStatus?.errors && jobStatus.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Chi tiết lỗi ({jobStatus.errors.length})</h4>
                <div className="bg-red-50 border border-red-100 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-red-200">
                    <thead className="bg-red-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-800">Dòng</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-800">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-800">Lý do lỗi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-red-100">
                      {jobStatus.errors.map((err: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-600">{err.row}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{err.email}</td>
                          <td className="px-4 py-2 text-sm text-red-600">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {(jobStatus?.status === 'COMPLETED' || jobStatus?.status === 'FAILED') && (
              <div className="mt-8">
                <button
                  onClick={() => { setJobId(null); setFile(null); setJobStatus(null); }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Tải lên file khác
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
