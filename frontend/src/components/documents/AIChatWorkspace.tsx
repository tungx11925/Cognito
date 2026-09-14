"use client";

import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI, generateQuiz } from '@/services/ai.service';
import { Send, Bot, User, Brain, AlertCircle, PlayCircle, Loader2, Trash2, Image as ImageIcon, X, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStudy } from '@/context/StudyContext';

interface Props {
  documentId: number;
  documentTitle: string;
}

interface UploadedImage {
  id: string;
  dataUrl: string;
  name: string;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  image?: string;
  images?: string[];
  type?: 'text' | 'quiz' | 'flashcards';
  data?: any;
}

export default function AIChatWorkspace({ documentId, documentTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([]);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load chat history from localStorage on mount
  useEffect(() => {
    if (!documentId) return;
    const saved = localStorage.getItem(`chat_history_${documentId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: `Xin chào! 👋 Mình là **Trợ lý EduShare AI**.\nMình đã sẵn sàng phân tích tài liệu **"${documentTitle}"** hoặc **nhiều hình ảnh bài tập/sơ đồ** bạn tải lên.\nBạn cần mình hỗ trợ gì nào?`,
        type: 'text'
      }]);
    }
  }, [documentId, documentTitle]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_history_${documentId}`, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages, documentId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleSendAI = (e: any) => {
      handleSend(e.detail);
    };
    window.addEventListener('SEND_AI_MESSAGE', handleSendAI);
    return () => window.removeEventListener('SEND_AI_MESSAGE', handleSendAI);
  }, [documentId]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (selectedImages.length + files.length > 6) {
      toast.error('Bạn chỉ có thể đính kèm tối đa 6 hình ảnh cùng lúc.');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" không phải là ảnh hợp lệ.`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSelectedImages(prev => {
          if (prev.some(img => img.dataUrl === dataUrl)) return prev;
          return [...prev, {
            id: Math.random().toString(36).substring(2, 9),
            dataUrl,
            name: file.name
          }];
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter(item => item.type.indexOf('image') !== -1);
    
    if (imageItems.length === 0) return;

    if (selectedImages.length + imageItems.length > 6) {
      toast.error('Bạn chỉ có thể đính kèm tối đa 6 hình ảnh.');
      return;
    }

    imageItems.forEach((item) => {
      const file = item.getAsFile();
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSelectedImages(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            dataUrl,
            name: `Ảnh chụp màn hình ${prev.length + 1}`
          }
        ]);
        toast.success('Đã dán hình ảnh vào khung chat!');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() && selectedImages.length === 0) return;
    
    const currentImages = selectedImages.map(img => img.dataUrl);
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text.trim() || (currentImages.length > 0 ? (currentImages.length > 1 ? `Hãy quan sát và phân tích chi tiết ${currentImages.length} hình ảnh này giúp tôi.` : 'Hãy phân tích và giải đáp hình ảnh này giúp tôi.') : ''),
      images: currentImages.length > 0 ? currentImages : undefined,
      image: currentImages[0] || undefined
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome' && m.type !== 'quiz')
        .map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content
        }));

      const response = await chatWithAI(documentId, userMsg.content, history, currentImages);
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: response.reply || 'Xin lỗi, tôi không thể trả lời lúc này.',
        type: 'text'
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: 'Đã có lỗi xảy ra khi phân tích và kết nối với AI. Vui lòng thử lại sau.',
        type: 'text'
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: 'Tạo bài trắc nghiệm từ tài liệu này' };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await generateQuiz(documentId);
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: 'Tôi đã tạo xong bộ câu hỏi trắc nghiệm dựa trên tài liệu. Chúc bạn ôn tập tốt!',
        type: 'quiz',
        data: response.quizzes
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Quiz error:', error);
      const errMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: 'Đã có lỗi xảy ra khi tạo trắc nghiệm. Vui lòng thử lại sau.',
        type: 'text'
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (text: string, isUser: boolean = false) => {
    // Basic Markdown Parser (headers, bold, lists, quotes)
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      let trimmed = line.trim();
      let content = line;

      // Heading 3
      if (trimmed.startsWith('### ')) {
        return (
          <h3 
            key={lineIdx} 
            className={`text-base font-bold mt-3 mb-1.5 pb-1 ${
              isUser ? 'text-white border-b border-white/20' : 'text-[#0D2B24] border-b border-gray-200'
            }`}
          >
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      // Heading 2
      if (trimmed.startsWith('## ')) {
        return (
          <h2 
            key={lineIdx} 
            className={`text-lg font-bold mt-4 mb-2 pb-1 ${
              isUser ? 'text-white border-b border-white/20' : 'text-[#0D2B24] border-b border-gray-200'
            }`}
          >
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      // Heading 1
      if (trimmed.startsWith('# ')) {
        return (
          <h1 
            key={lineIdx} 
            className={`text-xl font-bold mt-4 mb-2 pb-1 ${
              isUser ? 'text-white border-b-2 border-white/30' : 'text-[#0D2B24] border-b-2 border-gray-300'
            }`}
          >
            {trimmed.replace('# ', '')}
          </h1>
        );
      }
      // Unordered list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={lineIdx} className={`ml-4 list-disc my-0.5 ${isUser ? 'text-white' : 'text-gray-700'}`}>
            {renderInlineMarkdown(trimmed.substring(2), isUser)}
          </li>
        );
      }
      // Ordered list
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <li key={lineIdx} className={`ml-4 list-decimal my-0.5 ${isUser ? 'text-white' : 'text-gray-700'}`}>
            {renderInlineMarkdown(numMatch[2], isUser)}
          </li>
        );
      }
      // Blockquote
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote 
            key={lineIdx} 
            className={`border-l-4 pl-3 py-1 my-2 italic rounded-r ${
              isUser 
                ? 'border-emerald-400 bg-white/10 text-white/90' 
                : 'border-[#0D2B24] bg-gray-50 text-gray-700'
            }`}
          >
            {renderInlineMarkdown(trimmed.replace('> ', ''), isUser)}
          </blockquote>
        );
      }
      // Regular paragraph / blank line
      if (trimmed === '') {
        return <div key={lineIdx} className="h-2" />;
      }
      return (
        <p key={lineIdx} className={`my-1 ${isUser ? 'text-white font-normal' : 'text-gray-800'}`}>
          {renderInlineMarkdown(content, isUser)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string, isUser: boolean = false) => {
    // Regex for bold, code, link
    const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className={`font-bold ${isUser ? 'text-white underline decoration-white/40' : 'text-[#0D2B24]'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code 
            key={idx} 
            className={`px-1.5 py-0.5 rounded font-mono text-xs ${
              isUser 
                ? 'bg-white/20 text-white border border-white/20' 
                : 'bg-gray-100 text-[#0D2B24] border border-gray-200'
            }`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const clearHistory = () => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <span className="font-semibold text-sm text-gray-800">Bạn có chắc muốn xóa toàn bộ đoạn chat này?</span>
        <div className="flex gap-2 justify-end mt-2">
          <button 
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            onClick={() => toast.dismiss(t.id)}
          >
            Hủy
          </button>
          <button 
            className="px-4 py-2 text-xs font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors"
            onClick={() => {
              toast.dismiss(t.id);
              const initialMsg: Message = {
                id: 'welcome',
                role: 'ai',
                content: `Xin chào! 👋 Mình là **Trợ lý EduShare AI**.\nMình đã sẵn sàng phân tích tài liệu **"${documentTitle}"** hoặc **nhiều hình ảnh bài tập/sơ đồ** bạn tải lên.\nBạn cần mình hỗ trợ gì nào?`,
                type: 'text'
              };
              setMessages([initialMsg]);
              localStorage.setItem(`chat_history_${documentId}`, JSON.stringify([initialMsg]));
            }}
          >
            Xóa lịch sử
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { borderRadius: '16px' } });
  };

  return (
    <div className="flex-1 flex flex-col relative bg-[#EBE9E4] overflow-hidden">
      {/* Header with Clear Button */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <button 
          onClick={clearHistory}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-300 cursor-pointer"
          title="Xóa lịch sử trò chuyện"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#EBE9E4] pb-44 pt-10">
        {messages.map((msg) => {
          const displayImages = msg.images || (msg.image ? [msg.image] : []);
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${!isUser ? 'bg-gradient-to-br from-[#0D2B24] to-[#1a4a3b]' : 'bg-gray-300 border border-gray-400/50 text-gray-700'}`}>
                {!isUser ? <Bot size={18} /> : <User size={18} />}
              </div>
              
              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[90%]`}>
                <div className={`border rounded-2xl p-4 text-[14px] leading-relaxed shadow-md ${
                  isUser 
                    ? 'bg-[#0D2B24] text-white border-[#0b1f1a] rounded-tr-sm' 
                    : 'bg-white border-gray-300 text-gray-800 rounded-tl-sm'
                }`}>
                  {/* Display Images Gallery if attached */}
                  {displayImages.length > 0 && (
                    <div className={`mb-3 ${
                      displayImages.length === 1 
                        ? 'max-w-[260px]' 
                        : displayImages.length === 2 
                          ? 'grid grid-cols-2 gap-2 max-w-[320px]' 
                          : 'grid grid-cols-3 gap-2 max-w-[360px]'
                    }`}>
                      {displayImages.map((imgSrc, imgIdx) => (
                        <div key={imgIdx} className="relative group rounded-xl overflow-hidden border border-white/20 shadow-sm bg-black/10 aspect-video flex items-center justify-center">
                          <img 
                            src={imgSrc} 
                            alt={`Uploaded reference ${imgIdx + 1}`} 
                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                            onClick={() => setPreviewModalImage(imgSrc)}
                          />
                          <div 
                            onClick={() => setPreviewModalImage(imgSrc)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity"
                          >
                            <Maximize2 size={16} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
                    {renderMarkdown(msg.content, isUser)}
                  </div>
                  
                  {msg.id === 'welcome' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleSend('Tóm tắt nội dung tài liệu')}
                        className="text-[12px] bg-white border border-gray-300/80 px-3.5 py-1.5 rounded-full text-gray-700 hover:text-[#0D2B24] hover:border-[#0D2B24] transition-colors shadow-md font-semibold cursor-pointer"
                      >
                        📝 Tóm tắt
                      </button>
                      <button 
                        onClick={handleGenerateQuiz}
                        className="text-[12px] bg-white border border-gray-300/80 px-3.5 py-1.5 rounded-full text-gray-700 hover:text-[#0D2B24] hover:border-[#0D2B24] transition-colors shadow-md font-semibold cursor-pointer"
                      >
                        ✏️ Tạo bài trắc nghiệm
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[12px] bg-white border border-emerald-500/40 text-emerald-700 px-3.5 py-1.5 rounded-full hover:bg-emerald-50 transition-colors shadow-md font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon size={13} /> Phân tích hình ảnh
                      </button>
                    </div>
                  )}

                  {msg.type === 'quiz' && msg.data && (
                    <div className="mt-4 space-y-4 w-full min-w-[280px]">
                      {msg.data.map((q: any, i: number) => (
                        <QuizComponent key={q.id || i} quiz={q} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D2B24] to-[#1a4a3b] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot size={18} />
            </div>
            <div className="bg-white border border-gray-300 shadow-md rounded-2xl rounded-tl-sm p-4 text-[14px] text-gray-800 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#0D2B24]" /> AI đang quan sát & phân tích...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Fixed Input Chat Box */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#EBE9E4] via-[#EBE9E4] to-transparent pt-6 z-20">
        {/* Multi-Image Attachment Preview Tray */}
        {selectedImages.length > 0 && (
          <div className="mb-2.5 p-2.5 bg-white/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-md animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                <ImageIcon size={13} className="text-emerald-600" />
                Đã đính kèm {selectedImages.length} hình ảnh
              </span>
              <button
                onClick={() => setSelectedImages([])}
                className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {selectedImages.map((img) => (
                <div key={img.id} className="relative group shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shadow-xs bg-gray-100">
                  <img 
                    src={img.dataUrl} 
                    alt={img.name} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewModalImage(img.dataUrl)}
                  />
                  <button
                    onClick={() => setSelectedImages(prev => prev.filter(item => item.id !== img.id))}
                    className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                    title="Gỡ ảnh này"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {selectedImages.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 text-gray-400 hover:text-emerald-600 flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold shrink-0 transition-colors cursor-pointer bg-gray-50/50"
                  title="Thêm ảnh khác"
                >
                  <ImageIcon size={14} />
                  + Thêm
                </button>
              )}
            </div>
          </div>
        )}

        <div className="relative shadow-sm hover:shadow-md rounded-2xl border border-gray-300 bg-white focus-within:border-[#0D2B24] focus-within:ring-2 focus-within:ring-[#0D2B24]/15 transition-all flex items-center p-1.5 gap-2">
          {/* Hidden File Input (supports multiple files) */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Upload Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              selectedImages.length > 0 
                ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 ring-1 ring-emerald-400' 
                : 'text-gray-500 hover:text-[#0D2B24] hover:bg-gray-100 active:scale-95'
            }`}
            title="Đính kèm một hoặc nhiều hình ảnh (hoặc dán Ctrl+V)"
          >
            <ImageIcon size={19} />
          </button>

          {/* Textarea */}
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              selectedImages.length > 0
                ? (selectedImages.length === 1 ? "Nhập câu hỏi về hình ảnh này (hoặc Enter để gửi)..." : `Nhập câu hỏi về ${selectedImages.length} hình ảnh này (hoặc Enter)...`)
                : "Hỏi AI hoặc dán (Ctrl+V) ảnh bài tập vào đây..."
            } 
            className="flex-1 bg-transparent px-1 py-1.5 text-[13.5px] text-gray-800 placeholder-gray-400 focus:outline-none resize-none min-h-[36px] max-h-32 block leading-relaxed"
            rows={1}
            disabled={isLoading}
          />

          {/* Send Button */}
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
            className="w-9 h-9 bg-[#0D2B24] text-white rounded-xl hover:bg-[#154238] active:scale-95 transition-all shadow-xs flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Gửi tin nhắn"
          >
            <Send size={15} className="ml-0.5" />
          </button>
        </div>

        <div className="flex justify-between items-center text-[10.5px] text-gray-400 mt-2 px-1 font-medium select-none">
          <span>💡 Dán ảnh chụp màn hình bằng <b>Ctrl + V</b> (có thể chọn/dán nhiều ảnh)</span>
          <span className="uppercase tracking-wider font-semibold text-[10px] text-gray-400/80">AI Vision Powered</span>
        </div>
      </div>

      {/* Lightbox / Zoom Image Modal */}
      {previewModalImage && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-zinc-950 p-2 border border-zinc-800 shadow-2xl">
            <button 
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors z-10"
            >
              <X size={18} />
            </button>
            <img 
              src={previewModalImage} 
              alt="Fullscreen Preview" 
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function QuizComponent({ quiz, index }: { quiz: any, index: number }) {
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const { triggerTaskProgress } = useStudy();

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return; // Prevent changing answer
    setSelectedOpt(idx);
    setShowExplanation(true);
    triggerTaskProgress('practice_quiz', 1);
  };

  const isCorrect = selectedOpt === quiz.correctAnswer;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm w-full">
      <div className="flex items-start gap-2 mb-3">
        <div className="bg-[#FAF8F5] text-[#0D2B24] text-xs font-bold px-2 py-1 rounded-md shrink-0">
          Q{index + 1}
        </div>
        <h4 className="text-sm font-semibold text-gray-800 leading-snug">{quiz.question}</h4>
      </div>
      
      <div className="space-y-2">
        {quiz.options.map((opt: string, idx: number) => {
          let btnClass = "w-full text-left p-3 rounded-lg text-sm border transition-all ";
          
          if (selectedOpt === null) {
            btnClass += "bg-white border-gray-200 hover:border-[#0D2B24] hover:bg-gray-50 text-gray-700";
          } else {
            if (idx === quiz.correctAnswer) {
              btnClass += "bg-green-50 border-green-500 text-green-800 font-medium";
            } else if (idx === selectedOpt) {
              btnClass += "bg-red-50 border-red-300 text-red-800";
            } else {
              btnClass += "bg-white border-gray-100 text-gray-400 opacity-50";
            }
          }

          return (
            <button 
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selectedOpt !== null}
              className={btnClass}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex gap-2 items-start ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">{isCorrect ? 'Tuyệt vời! Bạn đã trả lời đúng.' : 'Chưa chính xác rồi.'}</p>
            <p className="opacity-90">{quiz.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
