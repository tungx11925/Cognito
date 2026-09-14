"use client";

import React, { useState, useEffect } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import DocxPreviewRenderer from './DocxPreviewRenderer';
import { AlertCircle, Download, ExternalLink, RefreshCw } from 'lucide-react';

const getFileExtension = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || 'pdf' : 'pdf';
  } catch (e) {
    const parts = url.split('?')[0].split('#')[0].split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || 'pdf' : 'pdf';
  }
};

export default function DocumentViewerWrapper({ url: rawUrl }: { url: string }) {
  const url = typeof window !== 'undefined' && window.location.protocol === 'https:' && rawUrl.startsWith('http://') && !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1')
    ? rawUrl.replace('http://', 'https://')
    : rawUrl;

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fileExt = getFileExtension(url);
  const isDocx = fileExt === 'docx' || fileExt === 'doc';

  useEffect(() => {
    if (isDocx) {
      setLoading(false);
      return;
    }

    let active = true;
    let currentBlobUrl: string | null = null;

    const loadDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Không thể tải tài liệu (Lỗi HTTP ${response.status})`);
        }
        const blob = await response.blob();
        
        if (active) {
          currentBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(currentBlobUrl);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải tài liệu:", err);
        if (active) {
          setError(
            err.message && (err.message.includes('Failed to fetch') || err.message.includes('fetch'))
              ? 'Không thể hiển thị tài liệu này trực tiếp do lỗi bảo mật CORS hoặc sự cố kết nối. Bạn có thể tải xuống hoặc mở trong tab mới.'
              : err.message || 'Lỗi không xác định khi tải tài liệu.'
          );
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      active = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [url, isDocx]);

  if (isDocx) {
    return (
      <div className="w-full h-full bg-gray-100 overflow-hidden">
        <DocxPreviewRenderer url={url} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 min-h-[300px]">
        <div className="w-8 h-8 border-4 border-[#0D2B24]/30 border-t-[#0D2B24] rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Đang tải và chuẩn bị tài liệu...</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 min-h-[400px] text-center">
        <div className="bg-red-50 p-3 rounded-full mb-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-2">Không thể hiển thị tài liệu</h3>
        <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed px-4">
          {error || 'Không thể tải tệp tin.'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center px-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0D2B24] hover:bg-[#154238] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ExternalLink size={16} /> Mở trong tab mới
          </a>
          <a
            href={url}
            download
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Download size={16} /> Tải tài liệu về
          </a>
        </div>

        {fileExt === 'pdf' && (
          <div className="mt-8 pt-6 border-t border-gray-200 w-full max-w-md px-4">
            <p className="text-xs text-gray-400 mb-3">
              Hoặc bạn có thể thử xem bằng trình xem PDF của trình duyệt:
            </p>
            <button
              onClick={() => {
                setError(null);
                setBlobUrl(url); // Set original URL directly to trigger iframe rendering
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#0D2B24] hover:underline font-semibold"
            >
              <RefreshCw size={12} /> Thử dùng trình xem PDF của trình duyệt (Iframe)
            </button>
          </div>
        )}
      </div>
    );
  }

  // If the user selected standard iframe fallback or blobUrl is set directly to original URL
  if (blobUrl === url) {
    return (
      <iframe
        src={url}
        className="w-full h-full border-0"
        title="Trình xem tài liệu dự phòng"
      />
    );
  }

  const docs = [
    { 
      uri: blobUrl, 
      fileType: fileExt
    }
  ];

  return (
    <DocViewer 
      documents={docs} 
      pluginRenderers={DocViewerRenderers} 
      style={{ width: '100%', height: '100%' }}
      config={{
        header: {
          disableHeader: true,
          disableFileName: true,
          retainURLParams: false
        }
      }}
    />
  );
}
