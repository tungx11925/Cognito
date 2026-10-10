import React from "react";
import Link from "next/link";
import { Compass, Home, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f3ee] dark:bg-slate-900 px-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 border border-emerald-950/10 dark:border-slate-700 shadow-xl">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-800 dark:text-emerald-400">
          <Compass size={40} className="animate-spin-slow" />
        </div>

        <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
          Lỗi 404
        </span>

        <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-4 mb-2">
          Không tìm thấy trang này
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển. Đừng lo, bạn có thể quay lại trang chủ hoặc vào thư viện học tập.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#1a3d28] hover:bg-[#143020] text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
          >
            <Home size={16} />
            Trang chủ
          </Link>

          <Link
            href="/library"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold transition-all active:scale-95"
          >
            <BookOpen size={16} />
            Góc học tập
          </Link>
        </div>
      </div>
    </div>
  );
}
