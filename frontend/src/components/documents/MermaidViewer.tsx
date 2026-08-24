'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

mermaid.initialize({
  startOnLoad: false,
  theme: 'forest',
  securityLevel: 'loose',
  fontFamily: 'var(--font-sans), sans-serif',
});

interface MermaidViewerProps {
  chartCode: string;
}

export default function MermaidViewer({ chartCode }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setRenderError(false);

    if (containerRef.current && chartCode) {
      const renderChart = async () => {
        try {
          containerRef.current!.innerHTML = '';
          const uniqueId = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(uniqueId, chartCode.trim());
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (err) {
          console.error('[MermaidViewer] Render error:', err);
          if (isMounted) setRenderError(true);
        }
      };

      renderChart();
    }

    return () => {
      isMounted = false;
    };
  }, [chartCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chartCode);
    setCopied(true);
    toast.success('Đã sao chép mã Mermaid!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col items-center bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      {/* Control Bar */}
      <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
        <span className="text-xs font-bold text-[#0D2B24] uppercase tracking-wider flex items-center gap-1.5">
          🧠 Sơ đồ tư duy AI
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setScale(s => Math.min(s + 0.15, 2))}
            title="Phóng to"
            className="p-1.5 text-gray-500 hover:text-[#0D2B24] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => setScale(s => Math.max(s - 0.15, 0.5))}
            title="Thu nhỏ"
            className="p-1.5 text-gray-500 hover:text-[#0D2B24] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={() => setScale(1)}
            title="Về kích thước chuẩn"
            className="p-1.5 text-gray-500 hover:text-[#0D2B24] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
          </button>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          <button
            onClick={handleCopyCode}
            title="Sao chép mã Mermaid"
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 text-gray-600 hover:text-[#0D2B24] bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            {copied ? 'Đã chép' : 'Code'}
          </button>
        </div>
      </div>

      {/* Render Area */}
      {renderError ? (
        <div className="w-full py-8 text-center bg-amber-50/50 rounded-xl border border-amber-200/60 p-4">
          <p className="text-xs text-amber-800 font-medium mb-2">Đã xảy ra lỗi hiển thị sơ đồ.</p>
          <pre className="text-[11px] text-gray-600 bg-white p-3 rounded-lg border text-left overflow-x-auto max-h-48 font-mono">
            {chartCode}
          </pre>
        </div>
      ) : (
        <div className="w-full overflow-auto min-h-[300px] flex justify-center items-center py-4">
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}
            className="transition-transform duration-150 flex justify-center w-full"
          >
            <div ref={containerRef} className="w-full flex justify-center [&_svg]:max-w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
