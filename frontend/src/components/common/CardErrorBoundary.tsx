"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  className?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CardErrorBoundary caught error]:", error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className={`p-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-300 flex flex-col items-center justify-center text-center gap-2 ${
            this.props.className || ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle size={16} />
          </div>
          <p className="font-semibold">{this.props.fallbackTitle || "Không thể hiển thị mục này"}</p>
          <p className="text-[11px] text-red-500 dark:text-red-400">
            Đã xảy ra lỗi cục bộ khi kết xuất dữ liệu. Các mục khác vẫn hoạt động bình thường.
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-2xs"
          >
            <RefreshCw size={12} />
            <span>Thử lại</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CardErrorBoundary;
