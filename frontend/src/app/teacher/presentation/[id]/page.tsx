"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLectureById } from '@/services/lecture.service';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Search, 
  Sparkles, 
  Sun, 
  Moon, 
  FileText, 
  Crosshair, 
  Layers, 
  HelpCircle, 
  X, 
  Loader2,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

interface Slide {
  id: number;
  slide_number: number;
  chapter_index: number;
  chapter_title: string;
  title: string;
  subtitle?: string;
  content: string;
  callout_type?: string;
  callout_title?: string;
  callout_content?: string;
  speaker_notes?: string;
}

interface Lecture {
  id: number;
  title: string;
  description: string;
  subject: string;
  chapter_count: number;
  total_slides: number;
  slides: Slide[];
}

export default function TeacherPresentationPage() {
  const params = useParams();
  const router = useRouter();
  const lectureId = params.id as string;
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showNotes, setShowNotes] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [laserPointer, setLaserPointer] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showPresenterBar, setShowPresenterBar] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const hideBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchLecture();
  }, [lectureId]);

  const fetchLecture = async () => {
    try {
      setLoading(true);
      const data = await getLectureById(lectureId);
      if (data && !data.error) {
        setLecture(data);
      } else {
        toast.error('Không tìm thấy bài giảng');
      }
    } catch (e) {
      toast.error('Lỗi khi tải bài giảng');
    } finally {
      setLoading(false);
    }
  };

  // Sync fullscreen change with document fullscreenElement
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSearch) {
        if (e.key === 'Escape') setShowSearch(false);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        }
      } else if (e.key === 'l' || e.key === 'L') {
        setLaserPointer(prev => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        setShowNotes(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, lecture, showSearch, isFullscreen]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (laserPointer) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }

    if (isFullscreen) {
      setShowPresenterBar(true);
      if (hideBarTimeoutRef.current) clearTimeout(hideBarTimeoutRef.current);
      hideBarTimeoutRef.current = setTimeout(() => {
        setShowPresenterBar(false);
      }, 3000);
    }
  };

  const nextSlide = () => {
    if (!lecture || !lecture.slides) return;
    if (currentSlideIndex < lecture.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const enterFullscreen = () => {
    setIsFullscreen(true);
    setShowPresenterBar(true);
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => {
        console.warn('Browser fullscreen blocked, using in-app theater mode:', err);
      });
    }
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  const handleAiSummarize = () => {
    if (!lecture || !lecture.slides[currentSlideIndex]) return;
    setIsSummarizing(true);
    const slide = lecture.slides[currentSlideIndex];
    
    setTimeout(() => {
      setAiSummary(`### 💡 Tóm tắt sư phạm cho giảng viên:
- **Khái niệm chính**: ${slide.title} (${slide.subtitle || 'Mục trọng tâm'})
- **Ý nghĩa giảng dạy**: Trình bày rõ ràng cấu trúc lý thuyết & liên kết ứng dụng thực tế.
- **Tương tác gợi ý**: Đặt câu hỏi thảo luận cho lớp học về các thành phần cốt lõi của ${slide.callout_title || 'bài học'}.`);
      setIsSummarizing(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#FAF8F5] flex flex-col items-center justify-center text-[#1a3d28] font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3d28] mb-4" />
        <p className="text-sm text-[#1a3d28]/80 font-semibold">Đang tải Slide bài giảng trình chiếu...</p>
      </div>
    );
  }

  if (!lecture || !lecture.slides || lecture.slides.length === 0) {
    return (
      <div className="h-screen w-full bg-[#FAF8F5] flex flex-col items-center justify-center text-[#1a2e1c] p-6 font-sans">
        <div className="bg-white border-2 border-[#1a3d28]/20 rounded-3xl p-8 max-w-md text-center shadow-xl">
          <BookOpen className="w-12 h-12 text-[#1a3d28] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Chưa có Slide bài giảng</h2>
          <p className="text-[#6b7280] text-sm mb-6">Bài giảng này chưa được khởi tạo các slide trình chiếu.</p>
          <Link href="/teacher/studio" className="px-5 py-2.5 bg-[#1a3d28] hover:bg-[#143020] text-white rounded-xl text-sm font-semibold transition-colors">
            Về Teacher Studio
          </Link>
        </div>
      </div>
    );
  }

  const currentSlide = lecture.slides[currentSlideIndex];
  const filteredSlides = searchQuery
    ? lecture.slides.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.callout_content && s.callout_content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : lecture.slides;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`h-screen w-full overflow-hidden flex flex-col select-none transition-colors duration-300 font-sans relative ${
        isDarkMode ? 'bg-[#0a1510] text-[#f5f3ee]' : 'bg-[#FAF8F5] text-[#1a2e1c]'
      }`}
    >
      {/* LASER POINTER GLOW */}
      {laserPointer && (
        <div 
          className="fixed pointer-events-none z-[99999] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
          style={{ left: laserPos.x, top: laserPos.y }}
        >
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_6px_rgba(239,68,68,0.9)] animate-pulse" />
        </div>
      )}

      {/* TOP PRESENTATION HEADER - COGNITO BRAND STYLE (Hidden in Full-Slide Theater Mode) */}
      {!isFullscreen && (
        <header className={`h-14 border-b flex items-center justify-between px-5 z-20 shrink-0 ${
          isDarkMode 
            ? 'bg-[#0d1a14]/95 border-[#1e3d2a] backdrop-blur-md' 
            : 'bg-white border-[#1a3d28]/15 shadow-xs'
        }`}>
          <div className="flex items-center gap-6">
            <Link 
              href="/teacher/studio"
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                isDarkMode 
                  ? 'text-emerald-300 hover:text-white hover:bg-white/10' 
                  : 'text-[#1a3d28] hover:bg-[#1a3d28]/10'
              }`}
            >
              <ArrowLeft size={16} /> Slide Studio
            </Link>

            <div className="flex flex-col">
              <h1 className="text-[13px] font-bold tracking-wide truncate max-w-md font-serif text-[#1a3d28] dark:text-emerald-300">
                {lecture.title}
              </h1>
              <p className={`text-[11px] truncate font-medium ${isDarkMode ? 'text-emerald-200/70' : 'text-[#6b7280]'}`}>
                {currentSlide.chapter_title || 'Chapter 1'} · {lecture.total_slides || lecture.slides.length} slide
              </p>
            </div>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleAiSummarize}
              disabled={isSummarizing}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-[#0d1a14]' 
                  : 'bg-[#1a3d28] hover:bg-[#143020] active:scale-95 text-white'
              }`}
            >
              <Sparkles size={14} className={isSummarizing ? 'animate-spin' : ''} />
              {isSummarizing ? 'Đang tóm tắt...' : 'Tóm tắt AI'}
            </button>

            <button
              onClick={() => setShowNotes(prev => !prev)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer border ${
                showNotes 
                  ? (isDarkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-900 border-amber-300')
                  : (isDarkMode ? 'border-[#1e3d2a] text-emerald-100 hover:bg-white/5' : 'border-[#1a3d28]/20 text-[#1a3d28] hover:bg-[#1a3d28]/5')
              }`}
              title="Ghi chú Giảng viên (Phím N)"
            >
              <FileText size={14} /> Ghi chú
            </button>

            <button
              onClick={() => setLaserPointer(prev => !prev)}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                laserPointer 
                  ? 'bg-red-500/20 text-red-500 border-red-500/50' 
                  : (isDarkMode ? 'border-[#1e3d2a] text-emerald-100 hover:bg-white/5' : 'border-[#1a3d28]/20 text-[#1a3d28] hover:bg-[#1a3d28]/5')
              }`}
              title="Con trỏ Laser (Phím L)"
            >
              <Crosshair size={15} />
            </button>

            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                isDarkMode ? 'border-[#1e3d2a] text-emerald-100 hover:bg-white/5' : 'border-[#1a3d28]/20 text-[#1a3d28] hover:bg-[#1a3d28]/5'
              }`}
              title="Chuyển chế độ Sáng / Tối"
            >
              {isDarkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-[#1a3d28]" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer border ${
                isDarkMode ? 'border-[#1e3d2a] text-emerald-100 hover:bg-white/5' : 'border-[#1a3d28]/20 text-[#1a3d28] hover:bg-[#1a3d28]/5'
              }`}
              title="Toàn màn hình Slide (Phím F)"
            >
              <Maximize2 size={15} /> Toàn màn hình
            </button>
          </div>
        </header>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT THUMBNAIL BAR (Hidden when isFullscreen is true) */}
        {!isFullscreen && (
          <aside className={`w-28 border-r overflow-y-auto flex flex-col items-center py-4 space-y-3 shrink-0 z-10 scrollbar-thin ${
            isDarkMode ? 'bg-[#0d1a14] border-[#1e3d2a]' : 'bg-[#f4f2ec] border-[#1a3d28]/15'
          }`}>
            {lecture.slides.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              return (
                <button
                  key={slide.id || idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-20 h-16 rounded-xl relative flex flex-col p-1.5 transition-all cursor-pointer group text-left ${
                    isActive 
                      ? (isDarkMode 
                          ? 'ring-2 ring-emerald-500 bg-emerald-950/60 border border-emerald-500/80 shadow-md scale-105' 
                          : 'ring-2 ring-[#1a3d28] bg-white border border-[#1a3d28] shadow-md scale-105')
                    : (isDarkMode 
                        ? 'bg-[#14281e] border border-[#224830] hover:border-emerald-500/50 opacity-70 hover:opacity-100' 
                        : 'bg-white/90 border border-[#1a3d28]/20 hover:border-[#1a3d28]/60 hover:bg-white')
                  }`}
                >
                  {/* Miniature slide skeleton */}
                  <div className="flex-1 flex flex-col justify-center space-y-1 overflow-hidden opacity-60">
                    <div className={`h-1.5 w-3/4 rounded ${isActive ? (isDarkMode ? 'bg-emerald-400' : 'bg-[#1a3d28]') : (isDarkMode ? 'bg-emerald-700/60' : 'bg-stone-400')}`} />
                    <div className={`h-1 w-full rounded ${isDarkMode ? 'bg-emerald-900/60' : 'bg-stone-300'}`} />
                    <div className={`h-1 w-5/6 rounded ${isDarkMode ? 'bg-emerald-900/60' : 'bg-stone-300'}`} />
                  </div>
                  
                  {/* Number Badge */}
                  <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-stone-200 dark:border-white/5">
                    <span className={isActive ? (isDarkMode ? 'text-emerald-400 font-extrabold' : 'text-[#1a3d28] font-extrabold') : (isDarkMode ? 'text-emerald-200/50' : 'text-stone-500')}>
                      {slide.slide_number || idx + 1}
                    </span>
                  </div>
                </button>
              );
            })}
          </aside>
        )}

        {/* CENTER SLIDE PRESENTATION CANVAS (CANVA 16:9 RATIO IN FULLSCREEN) */}
        <main 
          ref={slideContainerRef}
          className={`flex-1 overflow-y-auto flex flex-col items-center justify-center relative scrollbar-thin transition-all ${
            isFullscreen 
              ? (isDarkMode ? 'bg-[#060c08] p-3 md:p-6 pb-20' : 'bg-[#ece9e0] p-3 md:p-6 pb-20') 
              : 'p-4 md:p-8 pt-4 pb-14'
          }`}
        >
          <div 
            className={`w-full rounded-3xl transition-all duration-300 border flex flex-col justify-between relative my-auto shrink-0 ${
              isFullscreen 
                ? 'max-w-[1200px] max-h-[84vh] p-6 md:p-10 shadow-2xl overflow-hidden' 
                : 'max-w-4xl min-h-[480px] max-h-[82vh] p-6 md:p-10 shadow-xl overflow-hidden'
            } ${
              isDarkMode 
                ? 'bg-gradient-to-b from-[#102419] via-[#0d1e15] to-[#0a1710] border-[#224830] text-[#f5f3ee] shadow-[0_20px_50px_rgba(0,0,0,0.8)]' 
                : 'bg-white border-2 border-[#1a3d28]/15 text-[#1a2e1c] shadow-[0_16px_40px_rgba(26,61,40,0.1)]'
            }`}
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
          >
            {/* Top Slide Header */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 scrollbar-thin">
              {currentSlide.subtitle && (
                <div className={`font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${
                  isFullscreen ? 'text-xs md:text-sm' : 'text-[11px] md:text-xs'
                } ${
                  isDarkMode ? 'text-emerald-400' : 'text-[#1a3d28]'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-emerald-400' : 'bg-[#1a3d28]'}`} />
                  {currentSlide.subtitle}
                </div>
              )}

              <h2 className={`font-serif font-black tracking-tight mb-4 leading-tight shrink-0 ${
                isFullscreen ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'
              } ${
                isDarkMode ? 'text-white' : 'text-[#1a2e1c]'
              }`}>
                {currentSlide.title}
              </h2>

              {/* Callout Container (Definition Box in Cognito Emerald/Forest Theme) */}
              {currentSlide.callout_content && (
                <div className={`mb-4 rounded-xl border transition-all shrink-0 ${
                  isFullscreen ? 'p-4 md:p-5' : 'p-3.5 md:p-4'
                } ${
                  isDarkMode 
                    ? 'bg-[#142e20] border-emerald-500/30 border-l-4 border-l-emerald-500 text-emerald-100 shadow-md' 
                    : 'bg-[#f4f8f5] border-emerald-300/80 border-l-4 border-l-[#1a3d28] text-[#1a2e1c] shadow-xs'
                }`}>
                  <div className={`font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2 ${
                    isFullscreen ? 'text-xs md:text-sm' : 'text-[11px] md:text-xs'
                  } ${
                    isDarkMode ? 'text-emerald-400' : 'text-[#1a3d28]'
                  }`}>
                    <Layers size={isFullscreen ? 15 : 13} className={isDarkMode ? 'text-emerald-400' : 'text-[#1a3d28]'} />
                    {currentSlide.callout_title || 'Definition / Trọng tâm'}
                  </div>
                  <div className={`italic leading-relaxed font-sans opacity-90 ${
                    isFullscreen ? 'text-sm md:text-base' : 'text-[13.5px] md:text-sm'
                  }`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                    >
                      {currentSlide.callout_content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Slide Body Content */}
              <div className={`leading-relaxed space-y-2.5 font-sans break-words ${
                isFullscreen ? 'text-sm md:text-base' : 'text-[14px] md:text-[15px]'
              }`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                  components={{
                    p: ({ node, ...props }) => <p className={`leading-relaxed my-1.5 ${isDarkMode ? 'text-emerald-100/85' : 'text-[#2e3e33]'}`} {...props} />,
                    strong: ({ node, ...props }) => <strong className={isDarkMode ? 'font-bold text-emerald-300' : 'font-bold text-[#1a3d28]'} {...props} />,
                    ul: ({ node, children }) => <ul className="space-y-2 my-2 list-none p-0">{children}</ul>,
                    ol: ({ node, children }) => <ol className="space-y-2 my-2 list-none p-0">{children}</ol>,
                    li: ({ node, children }) => (
                      <li className={`p-3 rounded-xl border flex items-start gap-3 transition-all list-none ${
                        isDarkMode 
                          ? 'bg-[#142e20]/80 border-[#224830] text-emerald-100 hover:border-emerald-500/40' 
                          : 'bg-[#FAF8F5] border-[#1a3d28]/15 text-[#1a2e1c] hover:border-[#1a3d28]/35'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isDarkMode ? 'bg-emerald-400' : 'bg-[#1a3d28]'}`} />
                        <div className="flex-1">{children}</div>
                      </li>
                    ),
                  }}
                >
                  {currentSlide.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Slide Footer Info Inside Card */}
            <div className={`mt-4 pt-3 border-t flex items-center justify-between font-medium shrink-0 ${
              isFullscreen ? 'text-xs md:text-sm' : 'text-[11px] md:text-xs'
            } ${
              isDarkMode ? 'border-[#1e3d2a] text-emerald-400/60' : 'border-[#1a3d28]/15 text-[#1a3d28]/60'
            }`}>
              <span>{lecture.title}</span>
              <span>{currentSlide.slide_number || currentSlideIndex + 1}</span>
            </div>
          </div>
        </main>
      </div>

      {/* SPEAKER NOTES DRAWER */}
      {showNotes && (
        <div className={`h-28 border-t p-4 z-20 shrink-0 flex flex-col justify-between animate-in slide-in-from-bottom-2 ${
          isDarkMode ? 'bg-[#142a1e] border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <span className="flex items-center gap-1.5">
              <FileText size={14} /> Ghi chú giảng viên (Speaker Notes) · Slide {currentSlideIndex + 1}
            </span>
            <button onClick={() => setShowNotes(false)} className="hover:text-black dark:hover:text-white cursor-pointer">
              <X size={14} />
            </button>
          </div>
          <p className="text-xs leading-relaxed overflow-y-auto max-h-16 pr-2">
            {currentSlide.speaker_notes || 'Không có ghi chú riêng cho slide này.'}
          </p>
        </div>
      )}

      {/* AI SUMMARY MODAL */}
      {aiSummary && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setAiSummary(null)}
        >
          <div 
            className={`relative max-w-lg w-full rounded-3xl p-6 border shadow-2xl ${
              isDarkMode 
                ? 'bg-[#0f2318] border-emerald-500/40 text-white' 
                : 'bg-white border-[#1a3d28]/20 text-[#1a2e1c]'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isDarkMode ? 'border-white/10' : 'border-[#1a3d28]/15'
            }`}>
              <span className={`text-sm font-bold flex items-center gap-2 ${
                isDarkMode ? 'text-emerald-400' : 'text-[#1a3d28]'
              }`}>
                <Sparkles size={16} /> Trợ lý AI Giảng dạy
              </span>
              <button onClick={() => setAiSummary(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
              isDarkMode ? 'text-emerald-100/90' : 'text-[#374151]'
            }`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiSummary}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH SLIDES MODAL */}
      {showSearch && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
          onClick={() => setShowSearch(false)}
        >
          <div 
            className={`relative max-w-lg w-full rounded-3xl p-5 border shadow-2xl ${
              isDarkMode 
                ? 'bg-[#0f2318] border-emerald-500/40 text-white' 
                : 'bg-white border-[#1a3d28]/20 text-[#1a2e1c]'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center gap-2 pb-3 border-b ${
              isDarkMode ? 'border-[#224830]' : 'border-[#1a3d28]/15'
            }`}>
              <Search size={18} className={isDarkMode ? 'text-emerald-400' : 'text-[#1a3d28]'} />
              <input 
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nội dung bài giảng..."
                className={`bg-transparent text-sm w-full focus:outline-none ${
                  isDarkMode ? 'placeholder-emerald-300/40 text-white' : 'placeholder-gray-400 text-[#1a2e1c]'
                }`}
              />
              <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto mt-3 space-y-2">
              {filteredSlides.map((s, idx) => (
                <div
                  key={s.id || idx}
                  onClick={() => {
                    const originalIdx = lecture.slides.findIndex(orig => orig.id === s.id);
                    if (originalIdx !== -1) setCurrentSlideIndex(originalIdx);
                    setShowSearch(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${
                    isDarkMode 
                      ? 'bg-white/5 hover:bg-emerald-600/30' 
                      : 'bg-[#FAF8F5] hover:bg-[#1a3d28]/10'
                  }`}
                >
                  <div className={`text-xs font-bold mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-[#1a3d28]'}`}>
                    Slide {s.slide_number}: {s.title}
                  </div>
                  <p className={`text-[11px] line-clamp-2 ${isDarkMode ? 'text-emerald-100/70' : 'text-gray-600'}`}>{s.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROL TOOLBAR (Only shown when not in fullscreen mode) */}
      {!isFullscreen && (
        <footer className={`h-12 border-t flex items-center justify-between px-6 z-20 shrink-0 ${
          isDarkMode 
            ? 'bg-[#0d1a14]/95 border-[#1e3d2a] backdrop-blur-md' 
            : 'bg-white border-[#1a3d28]/15'
        }`}>
          {/* Slide Counter Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              disabled={currentSlideIndex === 0}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'text-emerald-300 hover:text-white hover:bg-white/10' 
                  : 'text-[#1a3d28] hover:bg-[#1a3d28]/10'
              }`}
              title="Trang trước (Phím ←)"
            >
              <ChevronLeft size={18} />
            </button>
            
            <span className={`text-xs font-bold tracking-wider ${
              isDarkMode ? 'text-emerald-200/80' : 'text-[#1a3d28]'
            }`}>
              {currentSlideIndex + 1} / {lecture.slides.length}
            </span>

            <button
              onClick={nextSlide}
              disabled={currentSlideIndex === lecture.slides.length - 1}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'text-emerald-300 hover:text-white hover:bg-white/10' 
                  : 'text-[#1a3d28] hover:bg-[#1a3d28]/10'
              }`}
              title="Trang tiếp theo (Phím → / Space)"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Center Zoom & Quick Search */}
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 text-xs font-semibold ${
              isDarkMode ? 'text-emerald-200/80' : 'text-[#1a3d28]'
            }`}>
              <button 
                onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                className="px-2 py-0.5 rounded hover:bg-[#1a3d28]/10 font-bold cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-[11px]">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
                className="px-2 py-0.5 rounded hover:bg-[#1a3d28]/10 font-bold cursor-pointer"
              >
                +
              </button>
            </div>

            <button 
              onClick={() => setShowSearch(true)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'text-emerald-200/80 hover:text-white hover:bg-white/10' 
                  : 'text-[#1a3d28] hover:bg-[#1a3d28]/10'
              }`}
            >
              <Search size={14} /> Tìm kiếm
            </button>
          </div>

          {/* Right Info / Shortcut Help */}
          <div className={`flex items-center gap-3 text-xs ${
            isDarkMode ? 'text-emerald-200/60' : 'text-[#1a3d28]/60'
          }`}>
            <span className="text-[11px] font-medium hidden md:inline">Phím tắt: <b>←</b> / <b>→</b> / <b>F</b> (Toàn màn hình)</span>
          </div>
        </footer>
      )}
    </div>
  );
}
