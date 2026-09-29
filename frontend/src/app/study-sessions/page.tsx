"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Layers, FileText, Network, BookOpen, 
  HelpCircle, ArrowRight, Sparkles, CheckCircle2, TrendingUp, Zap
} from 'lucide-react';

export default function StudySessionsPage() {
  const studyTools = [
    {
      title: 'Chế độ tập trung (Focus Mode)',
      description: 'Không gian học sâu không phân tâm. Bấm giờ Pomodoro, phát hiện chuyển tab/cửa sổ và tự động đồng bộ chuỗi ngày học.',
      href: '/focus',
      icon: Zap,
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      badge: 'Deep Focus & Pomodoro',
      actionText: 'Vào chế độ tập trung',
    },
    {
      title: 'Flashcards & Spaced Repetition',
      description: 'Luyện tập ghi nhớ chủ động với thuật toán lặp lại ngắt quãng SM-2, theo dõi tiến độ thẻ cần ôn và chuỗi ngày học.',
      href: '/flashcards',
      icon: Layers,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: 'Spaced Repetition SM-2',
      actionText: 'Vào học Flashcards',
    },
    {
      title: 'Sổ tay ghi chú học tập',
      description: 'Tạo, biên tập, tìm kiếm và gắn ghi chú vào tài liệu học tập. Tra cứu nhanh chóng các định lý, công thức và tóm tắt bài học.',
      href: '/notes',
      icon: FileText,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      badge: 'Notes Workspace',
      actionText: 'Mở sổ tay ghi chú',
    },
    {
      title: 'Sơ đồ tư duy (Mindmap)',
      description: 'Phác thảo và trực quan hóa cấu trúc bài học, liên kết khái niệm và sơ đồ phân nhánh kiến thức bằng mã Mermaid tương tác.',
      href: '/mindmap',
      icon: Network,
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      badge: 'Visual Mindmap',
      actionText: 'Vào phòng vẽ sơ đồ',
    },
    {
      title: 'Kho tài liệu học tập',
      description: 'Đọc tài liệu, sách giáo trình, slide bài giảng kèm chế độ học thông minh, hỏi đáp nội dung và tạo ghi chú trực tiếp.',
      href: '/library',
      icon: BookOpen,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'Document Learning',
      actionText: 'Mở kho tài liệu',
    },
    {
      title: 'Luyện đề & Kiểm tra trắc nghiệm',
      description: 'Làm bài thi thử, chấm điểm tự động, xem giải thích chi tiết từng câu và ôn lại toàn bộ các câu làm sai với 1 click.',
      href: '/ai-test',
      icon: HelpCircle,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      badge: 'Quiz Engine',
      actionText: 'Làm bài kiểm tra',
    },
    {
      title: 'Tiến độ & Mục tiêu học tập',
      description: 'Theo dõi chuỗi ngày học liên tục (Study Streak), hoàn thành các mục tiêu học tập cá nhân và xem nhật ký hoạt động thực tế 100%.',
      href: '/progress',
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-800 border-orange-200',
      badge: 'Streak & Goals',
      actionText: 'Xem tiến độ học tập',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200/80 px-4 sm:px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-3 border border-emerald-200/60">
            <Sparkles size={13} />
            <span>Không gian tự học cá nhân hóa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Không gian học tập & Ghi nhớ (Study System)
          </h1>
          <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">
            Hệ sinh thái công cụ hỗ trợ người học tổng hợp kiến thức, rèn luyện trí nhớ qua thuật toán lặp lại ngắt quãng, phác thảo sơ đồ tư duy và ghi chú bài học có hệ thống.
          </p>
        </div>
      </div>

      {/* Grid of Study Tools */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studyTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.title}
                className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${tool.color}`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {tool.badge}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-gray-900 mb-2 group-hover:text-[#0D2B24] transition-colors">
                    {tool.title}
                  </h2>
                  <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    {tool.description}
                  </p>
                </div>

                <Link
                  href={tool.href}
                  className="flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-[#0D2B24] text-gray-700 hover:text-white rounded-xl text-xs font-semibold transition-all group-hover:border-[#0D2B24]"
                >
                  <span>{tool.actionText}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Learning Methodology Feature Callout */}
        <div className="mt-10 bg-gradient-to-r from-[#0D2B24] to-[#16483C] text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl">
            <h3 className="text-base font-bold text-emerald-200 mb-2">
              Nguyên lý học tập ngắt quãng (Spaced Repetition & Retrieval Practice)
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed mb-4">
              Hệ thống áp dụng thuật toán SM-2 tự động phân loại mức độ ghi nhớ (Khó, Bình thường, Dễ) để xác định thời điểm tối ưu cho lần ôn tập tiếp theo, giúp củng cố kiến thức vào trí nhớ dài hạn mà không cần học vẹt dồn ép.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                <span>Không có nội dung sinh ảo ngoài kiểm soát</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                <span>Kiểm soát sở hữu dữ liệu IDOR an toàn</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                <span>Liên kết chặt chẽ với tài liệu học tập</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
