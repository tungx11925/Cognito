"use client";

import React, { useEffect, useState } from 'react';
import mammoth from 'mammoth';

export default function MammothRenderer({ url }: { url: string }) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAndRenderDocx = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const arrayBuffer = await response.arrayBuffer();
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtml(result.value);
      } catch (err: any) {
        setError('Không thể hiển thị tài liệu này. Vui lòng tải xuống để xem.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndRenderDocx();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white">
        <div className="w-8 h-8 border-4 border-[#1a3a2a]/30 border-t-[#1a3a2a] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white text-gray-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="p-8 max-w-4xl mx-auto bg-white shadow-sm my-4 rounded-xl min-h-screen docx-viewer"
      style={{ overflowY: 'auto', maxHeight: '100%' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
