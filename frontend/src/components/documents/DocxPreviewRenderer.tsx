"use client";

import React, { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';

export default function DocxPreviewRenderer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAndRenderDocx = async () => {
      if (!containerRef.current) return;
      try {
        const [response, docx] = await Promise.all([
          fetch(url),
          import('docx-preview')
        ]);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        
        const docxModule = docx as any;
        const renderAsync = docxModule.renderAsync || docxModule.default?.renderAsync;
        if (typeof renderAsync !== 'function') {
          throw new Error('Trình xem DOCX không tương thích.');
        }

        await renderAsync(blob, containerRef.current, undefined, {
          className: "docx-preview-custom",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: true,
        });

        // Tự động phân tích và render công thức toán học KaTeX nếu có trong văn bản
        if (containerRef.current && typeof window !== 'undefined') {
          try {
            // @ts-ignore
            const autoRenderModule = await import('katex/dist/contrib/auto-render.js');
            const renderMath = autoRenderModule.default || autoRenderModule;
            if (typeof renderMath === 'function') {
              const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT);
              let node: Node | null;
              const textNodes: Text[] = [];
              while ((node = walker.nextNode())) {
                textNodes.push(node as Text);
              }

              for (const tn of textNodes) {
                if (tn.nodeValue && tn.nodeValue.includes('\\')) {
                  tn.nodeValue = tn.nodeValue
                    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$ $1 $$$$')
                    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
                    .replace(/\[\s*([\s\S]*?\\[a-zA-Z]+[\s\S]*?)\s*\]/g, '$$$$ $1 $$$$')
                    .replace(/\((\\[a-zA-Z]+)\)/g, '($$$1$)');
                }
              }

              renderMath(containerRef.current, {
                delimiters: [
                  { left: '$$', right: '$$', display: true },
                  { left: '$', right: '$', display: false },
                  { left: '\\(', right: '\\)', display: false },
                  { left: '\\[', right: '\\]', display: true },
                ],
                throwOnError: false,
                strict: false,
              });
            }
          } catch (mathErr) {
            console.warn('[DocxPreviewRenderer] Math render error:', mathErr);
          }
        }
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
