'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, Network, Lightbulb, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { generateMindmap, getCachedMindmap } from '@/services/ai.service';

const MermaidViewer = dynamic(() => import('./MermaidViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full py-12 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
      <Loader2 size={24} className="animate-spin text-[#0D2B24] mb-2" />
      <span className="text-xs text-gray-500 font-medium">Đang khởi tạo trình vẽ sơ đồ...</span>
    </div>
  ),
});

interface MindmapWorkspaceProps {
  documentId: number;
  documentTitle: string;
}

export default function MindmapWorkspace({ documentId, documentTitle }: MindmapWorkspaceProps) {
  const [mindmapCode, setMindmapCode] = useState<string>('');
  const [loadingCache, setLoadingCache] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCachedMindmap = async () => {
      setLoadingCache(true);
      try {
        const data = await getCachedMindmap(documentId);
        if (isMounted && data && data.success && data.mindmap) {
          setMindmapCode(data.mindmap.mermaid_code);
          setIsCached(true);
        }
      } catch (err) {
        console.log('Chưa có mindmap trong cache.');
      } finally {
        if (isMounted) setLoadingCache(false);
      }
    };

    if (documentId) {
      fetchCachedMindmap();
    }
  }, [documentId]);

  const handleGenerateMindmap = async (force: boolean = false) => {
    if (generating) return;
    setGenerating(true);
    const toastId = toast.loading(force ? 'Đang tạo lại sơ đồ tư duy...' : 'AI đang đọc tài liệu và phân tích sơ đồ tư duy...');

    try {
      const data = await generateMindmap(documentId, force);
      if (!data || data.error || !data.success) {
        throw new Error(data?.error || data?.message || 'Không thể tạo sơ đồ tư duy.');
      }

      setMindmapCode(data.mermaidCode);
      setIsCached(!!data.cached);
      toast.success(data.cached ? 'Đã tải sơ đồ tư duy từ Database!' : 'Đã tạo sơ đồ tư duy thành công & lưu vào DB!', { id: toastId });
    } catch (err: any) {
      console.error('Lỗi khi tạo Mindmap:', err);
      toast.error(err.message || 'Lỗi khi kết nối với AI', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  if (loadingCache) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-gray-500">
        <Loader2 size={24} className="animate-spin text-[#0D2B24] mb-3" />
        <span className="text-xs font-medium">Đang kiểm tra sơ đồ tư duy đã lưu...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4 p-4 overflow-y-auto">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-[#0D2B24] to-[#16483C] p-5 rounded-2xl shadow-sm text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg">
                <Network size={18} />
              </span>
              <h3 className="text-sm font-bold tracking-wide">AI Mindmap Auto-Generator</h3>
            </div>
            {mindmapCode && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-md">
                {isCached ? <Database size={11} /> : <Sparkles size={11} />}
                {isCached ? 'Đã lưu trong DB' : 'AI Mới tạo'}
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-100/90 leading-normal w-full break-words">
            Trích xuất tự động cấu trúc kiến thức và các nhánh khái niệm quan trọng từ tài liệu thành sơ đồ tư duy trực quan.
          </p>
        </div>
      </div>

      {/* Action Area */}
      {!mindmapCode ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 text-[#0D2B24] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Lightbulb size={28} className="text-[#0D2B24]" />
          </div>
          <h4 className="text-base font-bold text-gray-800 mb-1.5">Tự động hóa sơ đồ tư duy bài học</h4>
          <p className="text-xs text-gray-500 max-w-sm mb-6 leading-relaxed">
            Nhấn nút bên dưới để AI tự động phân tích và trực quan hóa tài liệu &quot;{documentTitle}&quot;.
          </p>
          <button
            onClick={() => handleGenerateMindmap(false)}
            disabled={generating}
            className="px-6 py-3 bg-[#0D2B24] hover:bg-[#16483C] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2.5 disabled:opacity-60 active:scale-95"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin text-emerald-300" />
                <span>Đang phân tích sơ đồ...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-emerald-300" />
                <span>Tạo Mindmap bằng AI</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => handleGenerateMindmap(true)}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0D2B24] bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
              <span>Tạo lại sơ đồ mới</span>
            </button>
          </div>

          <MermaidViewer chartCode={mindmapCode} />
        </div>
      )}
    </div>
  );
}
