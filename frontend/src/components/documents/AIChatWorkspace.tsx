"use client";

import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI, generateQuiz } from '@/services/ai.service';
import { Send, Bot, User, Brain, AlertCircle, PlayCircle, Loader2, Trash2 } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';

interface Props {
  documentId: number;
  documentTitle: string;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  type?: 'text' | 'quiz' | 'flashcards';
  data?: any;
}

export default function AIChatWorkspace({ documentId, documentTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
        content: `Xin chào! 👋 Mình là **Trợ lý EduShare AI**.\nMình đã chuẩn bị sẵn sàng tài liệu **"${documentTitle}"**.\nBạn muốn mình giúp gì nào?`,
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
  }, [documentId]); // Need documentId in dependency or use functional updates, but handleSend handles it

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome' && m.type !== 'quiz')
        .map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content
        }));

      const response = await chatWithAI(documentId, text, history);
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
        content: 'Đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.',
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

  const renderMarkdown = (text: string) => {
    // Simple bold markdown parser for demo purposes
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const clearHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?')) {
      const initialMsg: Message = {
        id: 'welcome',
        role: 'ai',
        content: `Xin chào! 👋 Mình là **Trợ lý EduShare AI**.\nMình đã chuẩn bị sẵn sàng tài liệu **"${documentTitle}"**.\nBạn muốn mình giúp gì nào?`,
        type: 'text'
      };
      setMessages([initialMsg]);
      localStorage.setItem(`chat_history_${documentId}`, JSON.stringify([initialMsg]));
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header with Clear Button */}
      <div className="absolute top-2 right-2 z-10">
        <button 
          onClick={clearHistory}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white/80 backdrop-blur-sm border border-gray-100"
          title="Xóa lịch sử trò chuyện"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white pb-32 pt-10">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${msg.role === 'ai' ? 'bg-gradient-to-br from-[#0D2B24] to-[#1a4a3b]' : 'bg-gray-200 text-gray-600'}`}>
              {msg.role === 'ai' ? <Bot size={18} /> : <User size={18} />}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[90%]`}>
              <div className={`border shadow-sm rounded-2xl p-4 text-[14px] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#0D2B24] text-white border-[#0D2B24] rounded-tr-sm' 
                  : 'bg-[#FAF8F5] border-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
                
                {msg.id === 'welcome' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleSend('Tóm tắt nội dung tài liệu')}
                      className="text-[12px] bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-700 hover:text-[#0D2B24] hover:border-[#0D2B24] transition-colors shadow-sm"
                    >
                      📝 Tóm tắt
                    </button>
                    <button 
                      onClick={handleGenerateQuiz}
                      className="text-[12px] bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-700 hover:text-[#0D2B24] hover:border-[#0D2B24] transition-colors shadow-sm"
                    >
                      ✏️ Tạo bài trắc nghiệm
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
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D2B24] to-[#1a4a3b] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot size={18} />
            </div>
            <div className="bg-[#FAF8F5] border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm p-4 text-[14px] text-gray-800 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#0D2B24]" /> AI đang suy nghĩ...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Fixed Input Chat Box */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-8">
        <div className="relative group shadow-sm rounded-2xl overflow-hidden border border-gray-200 bg-white focus-within:border-[#0D2B24] focus-within:ring-1 focus-within:ring-[#0D2B24] transition-all">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Hỏi AI về tài liệu này... (Nhấn Enter để gửi)" 
            className="w-full bg-transparent px-4 py-3.5 pr-12 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none resize-none min-h-[56px] max-h-32 block"
            rows={1}
            disabled={isLoading}
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 p-2 bg-[#0D2B24] text-white rounded-xl hover:bg-[#154238] transition-colors shadow-sm flex items-center justify-center disabled:opacity-50"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2 font-medium tracking-wide uppercase">AI có thể cung cấp thông tin chưa chính xác</p>
      </div>
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
