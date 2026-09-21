"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EBE9E4] p-4 text-[#0D2B24]">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-emerald-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Đã có lỗi xảy ra!</h2>
        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          Rất xin lỗi, hệ thống vừa gặp một sự cố không mong muốn. Điều này có thể do phiên đăng nhập hết hạn hoặc lỗi kết nối.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0D2B24] text-white rounded-xl font-bold hover:bg-[#154238] transition-colors active:scale-95"
          >
            <RefreshCcw size={18} />
            Thử lại ngay
          </button>
          
          <Link 
            href="/"
            className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95 block"
            onClick={() => {
              // Option to force clearing local auth if it's an auth error causing loops
              if (error.message?.toLowerCase().includes("token") || error.message?.toLowerCase().includes("auth")) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }
            }}
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
