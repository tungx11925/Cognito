"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDocumentById } from '@/services/document.service';
import { ArrowLeft, Share2, Download, AlertCircle, Send, Languages, PenLine, Loader2 } from 'lucide-react';
import Link from 'next/link';
import PomodoroWidget from '@/components/documents/PomodoroWidget';
import SmartNotesWorkspace from '@/components/documents/SmartNotesWorkspace';
import AIChatWorkspace from '@/components/documents/AIChatWorkspace';
import { generateFlashcards } from '@/services/ai.service';
import { createDeck } from '@/services/flashcard.service';
import dynamic from 'next/dynamic';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentViewerWrapper = dynamic(() => import('@/components/documents/DocumentViewerWrapper'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
      <div className="w-8 h-8 border-4 border-[#1a3a2a]/30 border-t-[#1a3a2a] rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500 font-medium">Đang tải trình xem tài liệu...</p>
    </div>
  )
});

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'tools' | 'ai'>('ai');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{x: number, y: number} | null>(null);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => {
      // Small timeout to let the selection register
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text && text.length > 0) {
          const range = selection!.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          // Don't show if selecting inside the AI or tools sidebar
          if (rect.right > window.innerWidth - 300 && isSidebarOpen) return;
          
          setSelectedText(text);
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
        } else {
          setSelectionPosition(null);
          setSelectedText("");
        }
      }, 50);
    };
    
    window.document.addEventListener('mouseup', handleMouseUp);
    return () => window.document.removeEventListener('mouseup', handleMouseUp);
  }, [isSidebarOpen]);

  const handleTranslate = () => {
    setIsSidebarOpen(true);
    setActiveTab('ai');
    window.dispatchEvent(new CustomEvent('SEND_AI_MESSAGE', { detail: `Dịch đoạn văn bản sau sang tiếng Việt:\n\n"${selectedText}"` }));
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleExplain = () => {
    setIsSidebarOpen(true);
    setActiveTab('ai');
    window.dispatchEvent(new CustomEvent('SEND_AI_MESSAGE', { detail: `Giải thích chi tiết thuật ngữ/khái niệm chuyên ngành sau:\n\n"${selectedText}"` }));
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleQuickNote = () => {
    setIsSidebarOpen(true);
    setActiveTab('tools');
    window.dispatchEvent(new CustomEvent('APPEND_NOTE', { detail: `\n\n> ${selectedText}\n` }));
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleGenerateFlashcards = async () => {
    if (isGeneratingCards) return;
    setIsGeneratingCards(true);
    try {
      // 1. Create a new deck for this document
      const deckResult = await createDeck(`Tài liệu: ${document.title}`, `Bộ thẻ tự động tạo từ tài liệu ${document.title}`);
      
      // 2. Generate flashcards and insert into deck
      await generateFlashcards(Number(docId), deckResult.id);
      
      // 3. Redirect to study screen
      router.push(`/flashcards/${deckResult.id}`);
    } catch (error) {
      console.error('Lỗi khi tạo flashcard:', error);
      alert('Không thể tạo flashcard lúc này. Hãy chắc chắn bạn đã cấu hình GROQ API KEY!');
      setIsGeneratingCards(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile(); // Check immediately on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!docId) return;

    const fetchDoc = async () => {
      setLoading(true);
      try {
        const data = await getDocumentById(docId);
        if (data.error) {
          setError(data.error);
        } else {
          setDocument(data);
        }
      } catch (err) {
        setError('Không thể tải tài liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docId]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-[#F9F9F9]">
        <div className="w-8 h-8 border-4 border-[#1a3a2a]/30 border-t-[#1a3a2a] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-6 h-screen bg-[#F9F9F9]">
        <Link href="/library" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 w-fit">
          <ArrowLeft size={16} /> Quay lại thư viện
        </Link>
        <div className="bg-white rounded-xl p-8 text-center max-w-md mx-auto border border-gray-100 shadow-sm mt-10">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Không tìm thấy tài liệu</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button onClick={() => router.push('/library')} className="px-5 py-2 bg-[#1a3a2a] text-white rounded-lg text-sm font-semibold">
            Về thư viện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#FAF8F5] overflow-hidden flex flex-col font-sans relative">
      
      {/* QUICK FLOATING TOOLBAR */}
      <AnimatePresence>
        {selectionPosition && selectedText && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-[#0D2B24] text-white shadow-2xl rounded-lg border border-[#1a3a2a] flex items-center p-1 gap-0.5"
            style={{ left: selectionPosition.x, top: selectionPosition.y, transform: 'translate(-50%, -100%)' }}
          >
            <button onClick={handleTranslate} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 hover:bg-white/10 rounded-md transition-colors">
              <Languages size={14} className="text-emerald-300" /> Dịch nhanh
            </button>
            <div className="w-px h-4 bg-white/20 mx-0.5"></div>
            <button onClick={handleExplain} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 hover:bg-white/10 rounded-md transition-colors">
              <AlertCircle size={14} className="text-blue-300" /> Giải thích AI
            </button>
            <div className="w-px h-4 bg-white/20 mx-0.5"></div>
            <button onClick={handleQuickNote} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 hover:bg-white/10 rounded-md transition-colors">
              <PenLine size={14} className="text-yellow-300" /> Thêm Note
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. FIXED TOPBAR (Full width, h-14) */}
      <header className="h-14 px-6 bg-white border-b border-gray-200/80 flex items-center justify-between shrink-0 z-20 relative shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/library" className="p-1.5 -ml-1.5 text-gray-500 hover:text-[#0D2B24] rounded-lg hover:bg-gray-100 transition-colors shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex items-center gap-3">
            <h1 className="text-[15px] font-bold text-[#0D2B24] truncate max-w-lg">{document.title}</h1>
            <div className="flex items-center gap-2 text-[12px] shrink-0">
              <span className="bg-[#F5F3EE] border border-gray-200/60 px-2 py-0.5 rounded-md text-gray-700 font-medium">
                {document.category || 'Khác'}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">Tải lên: {new Date(document.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-[#0D2B24] border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-lg transition-all font-semibold">
            <Share2 size={14} /> Chia sẻ
          </button>
          <a href={document.doc_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-[#0D2B24] border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-lg transition-all font-semibold">
            <Download size={14} /> Tải xuống
          </a>
          <div className="w-px h-4 bg-gray-200 mx-1"></div>
          <button 
            onClick={toggleSidebar}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-all shadow-sm ${
              isSidebarOpen 
                ? 'bg-[#0D2B24] text-white hover:bg-[#154238] shadow-md hover:shadow-lg' 
                : 'bg-white border border-gray-200 text-[#0D2B24] hover:bg-gray-50'
            }`}
          >
            ✨ {isSidebarOpen ? 'Đóng Trợ lý' : 'Mở Trợ lý AI'}
          </button>
        </div>
      </header>
 
      {/* 2. MAIN WORKSPACE (Dual-pane structure) */}
      <div className="flex-1 h-[calc(100vh-3.5rem)] flex overflow-hidden relative">
        {/* @ts-ignore */}
        <Group direction={isMobile ? 'vertical' : 'horizontal'} className="w-full h-full">
          
          {/* BÊN TRÁI: Document Viewer Pane */}
          <Panel 
            defaultSize={isSidebarOpen ? 60 : 100} 
            className="bg-[#EBECEF] relative overflow-y-auto min-w-0 flex flex-col"
          >
            <div className="min-h-full p-4 md:p-8 flex justify-center min-w-0 bg-[#EBECEF]">
              {/* Document Container with soft shadow mimicking real paper */}
              <div className="w-full max-w-5xl bg-white shadow-xl rounded-md overflow-hidden border border-gray-300/40">
                <DocumentViewerWrapper url={document.doc_url} />
              </div>
            </div>
          </Panel>
 
          {/* RESIZER HANDLE */}
          <Separator 
            className={`group relative shrink-0 flex items-center justify-center outline-none z-10 transition-all ${
              isSidebarOpen ? 'flex' : 'hidden'
            } ${isMobile ? 'h-2 w-full cursor-row-resize' : 'w-2 h-full cursor-col-resize -ml-1'}`}
          >
            <div className={`transition-colors duration-200 ${isMobile ? 'h-[1px] w-full' : 'w-[1px] h-full'} bg-gray-200/80 group-hover:bg-[#0D2B24] group-data-[resize-handle-active]:bg-[#0D2B24]`} />
          </Separator>
 
          {/* BÊN PHẢI: AI Assistant Sidebar Pane */}
          <Panel 
            defaultSize={40}
            minSize={25}
            className={`bg-[#EBE9E4] border-l-2 border-gray-300 overflow-hidden min-w-0 ${isMobile ? 'w-full border-t-2' : ''}`}
          >
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.div 
                  initial={{ x: isMobile ? 0 : 50, y: isMobile ? 50 : 0, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  exit={{ x: isMobile ? 0 : 50, y: isMobile ? 50 : 0, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  className="w-full h-full flex flex-col relative bg-[#EBE9E4]"
                >
                  {/* AI Tabs / Header - iOS Segmented Control Style */}
                  <div className="flex items-center bg-[#D6D3CC] p-1 rounded-xl gap-1 shrink-0 m-3.5 border border-gray-300/40">
                    <button 
                      onClick={() => setActiveTab('ai')}
                      className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
                        activeTab === 'ai' 
                          ? 'bg-white text-[#0D2B24] shadow-sm border border-gray-300/20' 
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
                      }`}
                    >
                      ✨ Trợ lý AI
                    </button>
                    <button 
                      onClick={() => setActiveTab('tools')}
                      className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
                        activeTab === 'tools' 
                          ? 'bg-white text-[#0D2B24] shadow-sm border border-gray-300/20' 
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
                      }`}
                    >
                      🛠️ Công cụ
                    </button>
                  </div>
 
                  {/* AI Chat Content */}
                  <div className="flex-1 flex flex-col overflow-hidden relative">
                    {activeTab === 'ai' ? (
                      <AIChatWorkspace documentId={Number(docId)} documentTitle={document.title} />
                    ) : (
                      <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col space-y-6">
                        <div className="bg-white border border-gray-300/70 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                          <h3 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-3">Đồng hồ Pomodoro</h3>
                          <PomodoroWidget />
                        </div>
 
                        <div className="bg-white border border-gray-300/70 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex-1 min-h-[350px]">
                          <SmartNotesWorkspace documentId={Number(docId)} />
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#0D2B24] to-[#154238] p-5 rounded-2xl shadow-md border border-[#1a3a2a]">
                          <h3 className="text-[12px] font-bold text-green-200 uppercase tracking-wider mb-2">Flashcard AI</h3>
                          <p className="text-xs text-green-50/90 mb-4 leading-relaxed">
                            Trích xuất tự động các khái niệm quan trọng trong tài liệu thành thẻ ghi nhớ.
                          </p>
                          <button 
                            onClick={handleGenerateFlashcards}
                            disabled={isGeneratingCards}
                            className="w-full py-2.5 text-sm font-bold text-[#0D2B24] bg-white rounded-xl hover:bg-gray-50 shadow-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                          >
                            {isGeneratingCards ? <Loader2 size={16} className="animate-spin" /> : 'Tạo Flashcard ngay'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
