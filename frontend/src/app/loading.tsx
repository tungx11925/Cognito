"use client";

import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-[#0D2B24]">
      <Loader2 size={40} className="animate-spin" />
      <p className="text-sm font-semibold text-gray-500 animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );
}
