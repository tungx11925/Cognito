'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

let mermaidPromise: Promise<any> | null = null;
function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const mermaidInstance = mod.default;
      mermaidInstance.initialize({
        startOnLoad: false,
        theme: 'forest',
        securityLevel: 'strict',
        fontFamily: 'var(--font-sans), sans-serif',
        suppressErrorRendering: true,
      });
      return mermaidInstance;
    });
  }
  return mermaidPromise;
}

function sanitizeMindmapCode(raw: string): string {
  if (!raw) return '';
  const lines = raw.trim().split('\n');
  const out: string[] = [];
  let rootIndented = false;
  let baseIndent = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (trimmed.toLowerCase() === 'mindmap') {
      out.push('mindmap');
      continue;
    }
    if (!rootIndented && (trimmed.startsWith('root(') || trimmed.startsWith('root(('))) {
      out.push('  ' + trimmed);
      rootIndented = true;
      baseIndent = rawLine.match(/^(\s*)/)?.[0].length || 0;
      continue;
    }

    const curIndent = rawLine.match(/^(\s*)/)?.[0].length || 0;
    let level = 1;
    if (curIndent > baseIndent) {
      level = 1 + Math.max(1, Math.round((curIndent - baseIndent) / 2));
    }
    const cleanText = trimmed.replace(/[()\[\]{}:\"']/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) continue;
    out.push(' '.repeat(2 + level * 2) + cleanText);
  }
  return out.length > 0 ? out.join('\n') : raw.trim();
}

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
        const uniqueId = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
        try {
          containerRef.current!.innerHTML = '';
          const cleanedCode = chartCode.trim().startsWith('mindmap')
            ? sanitizeMindmapCode(chartCode)
            : chartCode.trim();
          const mermaid = await getMermaid();
          const { svg } = await mermaid.render(uniqueId, cleanedCode);
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (err) {
          console.error('[MermaidViewer] Render error:', err);
          if (isMounted) setRenderError(true);
        } finally {
          // Remove any rogue error SVG elements injected by Mermaid into document.body
          const rogue = document.getElementById(`d${uniqueId}`) || document.getElementById(uniqueId);
          if (rogue && rogue.parentElement === document.body) {
            rogue.remove();
          }
          const allRogue = document.querySelectorAll('svg[id^="dmermaid-svg"], .mermaid-error');
          allRogue.forEach(el => {
            if (el.parentElement === document.body) el.remove();
          });
        }
      };

      renderChart();
    }

    return () => {
      isMounted = false;
      // Clean up any remaining rogue SVGs on unmount
      const rogue = document.querySelectorAll('svg[id^="dmermaid-svg"], .mermaid-error');
      rogue.forEach(el => {
        if (el.parentElement === document.body) el.remove();
      });
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
