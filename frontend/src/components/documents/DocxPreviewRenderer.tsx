"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as docx from "docx-preview";

export default function DocxPreviewRenderer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAndRenderDocx = async () => {
      if (!containerRef.current) return;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        
        await docx.renderAsync(blob, containerRef.current, undefined, {
          className: "docx-preview-custom",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: true, // Helps with some math and advanced formats
        });
      } catch (err: any) {
        setError('Không thể hiển thị tài liệu này. Vui lòng tải xuống để xem.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndRenderDocx();
  }, [url]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-100 flex flex-col items-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="w-8 h-8 border-4 border-[#1a3a2a]/30 border-t-[#1a3a2a] rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 z-10">
          <p>{error}</p>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full overflow-y-auto"
        style={{ padding: '20px 0' }}
      />
    </div>
  );
}
