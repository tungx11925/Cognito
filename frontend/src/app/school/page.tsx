'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, Users, BookOpen, GraduationCap } from 'lucide-react';

export default function SchoolDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Lấy organization_id từ user session (giả lập đơn giản cho demo)
  // Thực tế có thể lưu trong context hoặc token
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const orgId = user.primary_organization_id || '9873d6eb-901d-40ba-83ff-a128af55581b'; // Fallback for dev

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/school/${orgId}`, {
          withCredentials: true
        });
        setStats(res.data.stats);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Lỗi khi tải dữ liệu tổng quan');
      } finally {
        setLoading(false);
      }
    };
    
    if (orgId) {
      fetchStats();
    }
  }, [orgId]);

  if (loading) return <div className="text-gray-500">Đang tải dữ liệu...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Tổng quan Trường học</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Học sinh */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="bg-blue-50 rounded-full p-4 mr-4">
            <Users className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Tổng học sinh</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</h3>
            <p className="text-xs text-green-600 font-medium mt-1">
              {stats?.activeStudents || 0} đang hoạt động
            </p>
          </div>
        </div>

        {/* Giáo viên */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="bg-indigo-50 rounded-full p-4 mr-4">
            <GraduationCap className="text-indigo-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Giáo viên</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalTeachers || 0}</h3>
          </div>
        </div>

        {/* Lớp học */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="bg-amber-50 rounded-full p-4 mr-4">
            <Building2 className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Lớp học</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalClasses || 0}</h3>
          </div>
        </div>

        {/* Chuyên ngành */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="bg-emerald-50 rounded-full p-4 mr-4">
            <BookOpen className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Chuyên ngành</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalMajors || 0}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
