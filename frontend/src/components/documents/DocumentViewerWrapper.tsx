"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle, Download, ExternalLink } from 'lucide-react';

const DocxPreviewRenderer = dynamic(() => import('./DocxPreviewRenderer'), {
  ssr: false,
});

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

export default function DocumentViewerWrapper({ 
  url: rawUrl,
  fileType,
}: { 
  url: string;
  fileType?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  if (!rawUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-gray-400">
        Không có đường dẫn tài liệu.
      </div>
    );
  }

  const url = typeof window !== 'undefined' && window.location.protocol === 'https:' && rawUrl.startsWith('http://') && !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1')
    ? rawUrl.replace('http://', 'https://')
    : rawUrl;

  const fileExt = getFileExtension(url);
  const isDocx = 
    (fileType && (fileType.includes('word') || fileType.includes('officedocument') || fileType.includes('docx') || fileType.includes('msword'))) ||
    fileExt === 'docx' || 
    fileExt === 'doc';
  const isPdf = 
    (fileType && fileType.includes('pdf')) || 
    (!isDocx && fileExt === 'pdf');

  if (isDocx) {
    return (
      <div className="w-full h-full bg-gray-100 overflow-hidden">
        <DocxPreviewRenderer url={url} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 min-h-[400px] text-center">
        <div className="bg-red-50 p-3 rounded-full mb-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-2">Không thể hiển thị tài liệu</h3>
        <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed px-4">{error}</p>
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
      </div>
    );
  }

  // PDF: dùng iframe (native browser PDF viewer, không cần thư viện)
  if (isPdf) {
    return (
      <iframe
        src={url}
        className="w-full h-full border-0"
        title="Trình xem PDF"
        onError={() => setError('Không thể tải tệp PDF. Bạn có thể tải xuống hoặc mở trong tab mới.')}
      />
    );
  }

  // Các loại file khác: thử iframe trước, fallback sang link download
  return (
    <div className="w-full h-full flex flex-col">
      {!useFallback ? (
        <iframe
          src={url}
          className="w-full h-full border-0 flex-1"
          title="Trình xem tài liệu"
          onError={() => setUseFallback(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 min-h-[400px] text-center">
          <div className="bg-yellow-50 p-3 rounded-full mb-4">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-2">Không thể xem trực tiếp</h3>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            Loại file <strong>.{fileExt}</strong> không thể xem inline. Bạn có thể tải về hoặc mở trong tab mới.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center px-4">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0D2B24] hover:bg-[#154238] rounded-lg shadow-sm transition-colors"
            >
              <ExternalLink size={16} /> Mở trong tab mới
            </a>
            <a
              href={url}
              download
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
            >
              <Download size={16} /> Tải xuống
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
