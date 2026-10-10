"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function QuizRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testSetId = searchParams.get("testSetId");

  useEffect(() => {
    if (testSetId) {
      router.replace(`/quiz/${testSetId}`);
    } else {
      router.replace("/ai-test");
    }
  }, [router, testSetId]);

  return (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#1a3d28] dark:text-emerald-400" />
      <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Đang tải không gian trắc nghiệm & đề thi...</span>
    </div>
  );
}

export default function QuizIndexPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ee] dark:bg-[#0B0F17]">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d28] dark:text-emerald-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Đang khởi tạo...</span>
        </div>
      }>
        <QuizRedirectHandler />
      </Suspense>
    </div>
  );
}
