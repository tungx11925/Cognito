"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookText, Zap, BrainCircuit, FileSignature, Layers, Clock, TrendingUp, CheckCircle, RotateCcw, Send, Play, Pause, ArrowLeft } from "lucide-react";

const flashcardDeck = [
  { front: "Đạo hàm của sin(x) là gì?", back: "cos(x)" },
  { front: "Công thức tích phân từng phần?", back: "∫u·dv = u·v - ∫v·du" },
  { front: "Đạo hàm của e^x là gì?", back: "e^x" }
];

export function FeaturesSection() {
  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // AI Chat State
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "ai", text: "Công thức tích phân từng phần: ∫u·dv = u·v - ∫v·du. Ý tưởng là chuyển tích phân khó thành tích phân dễ hơn bằng cách chọn u và dv phù hợp..." },
    { id: 2, sender: "user", text: "Tạo 3 câu hỏi trắc nghiệm từ tài liệu này" },
    { id: 3, sender: "ai", text: "Đây là 2 câu hỏi:\n1. Đạo hàm của sin(x) là gì?\n   A. cos(x) ✓\n   B. -cos(x)\n2. ∫x² dx = ?\n   A. x³ + C\n   B. x³/3 + C ✓" }
  ]);

  const handleChatSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMsg = { id: Date.now(), sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      setChatMessages((prev) => [...prev, {
        id: Date.now() + 1,
        sender: "ai",
        text: "Đây là câu trả lời mô phỏng từ AI cho câu hỏi của bạn. Trong ứng dụng thực tế, tôi sẽ phân tích tài liệu và trả lời chi tiết!"
      }]);
      setIsTyping(false);
    }, 1500);
  };

  // Flashcard State
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCard((prev) => (prev + 1) % flashcardDeck.length);
    }, 200);
  };

  const previousCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCard((prev) => (prev - 1 + flashcardDeck.length) % flashcardDeck.length);
    }, 200);
  };

  return (
    <section id="features" className="py-24" style={{ background: "#f5f3ee" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-32">
        
        {/* SECTION 1: XEM TÀI LIỆU + TIMER */}
        <div>
          <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-12">
            <div className="max-w-xl">
              <span className="text-xs font-bold tracking-widest uppercase mb-4 block" style={{ color: "#1a3d28" }}>
                XEM TÀI LIỆU + TIMER
              </span>
              <h2 className="mb-6" style={{ color: "#0d1a14", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                Đọc tài liệu. Tập trung.<br />Theo dõi tiến độ.
              </h2>
              <p style={{ color: "#4a5a52", lineHeight: 1.7, fontSize: "1.05rem" }}>
                Trình xem tài liệu trực quan tích hợp đồng hồ Pomodoro ngay bên cạnh. Hãy thử tương tác với đồng hồ bấm giờ bên dưới để cảm nhận tính năng tập trung.
              </p>
            </div>

            <div className="flex gap-4 self-start">
              {[
                { icon: <BookText size={18} />, val: "24", label: "tài liệu" },
                { icon: <Clock size={18} />, val: "47h", label: "tuần này" },
                { icon: <TrendingUp size={18} />, val: "12", label: "ngày liên tiếp" }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center min-w-[110px] shadow-sm border border-gray-100">
                  <div style={{ color: "#4a5a52", marginBottom: "8px" }}>{stat.icon}</div>
                  <div style={{ color: "#0d1a14", fontWeight: 800, fontSize: "1.4rem" }}>{stat.val}</div>
                  <div style={{ color: "#6b7c72", fontSize: "0.75rem" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-full rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-200 flex flex-col"
          >
            <div className="h-10 px-4 flex items-center gap-2" style={{ background: "#1a3d28" }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              </div>
              <span className="ml-4 text-xs font-medium text-white/80">Đạo hàm & Tích phân — Lớp 12</span>
            </div>
            
            <div className="flex flex-col lg:flex-row flex-1 h-auto lg:h-[400px]">
              <div className="flex-1 p-8 overflow-hidden relative">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold text-lg text-gray-800">Chương 2: Tích phân</h3>
                  <span className="text-xs text-gray-400">Trang 12 / 24</span>
                </div>
                
                <div className="space-y-3 mb-8">
                  <div className="h-3 w-full bg-gray-100 rounded-full"></div>
                  <div className="h-3 w-11/12 bg-gray-100 rounded-full"></div>
                  <div className="h-3 w-10/12 bg-gray-100 rounded-full"></div>
                </div>

                <div className="bg-gray-50 rounded-xl p-8 flex items-center justify-center border border-gray-100 mb-8 cursor-text">
                  <span className="font-serif text-xl text-gray-800 italic selection:bg-yellow-200">∫ u · dv = u · v − ∫ v · du</span>
                </div>

                <div className="space-y-3">
                  <div className="h-3 w-full bg-gray-100 rounded-full"></div>
                  <div className="h-3 w-9/12 bg-gray-100 rounded-full"></div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              </div>

              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50/50 p-6 flex flex-col gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
                    <Clock size={16} /> Pomodoro Timer
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" stroke="#f3f4f6" />
                        <circle 
                          cx="50" cy="50" r="40" fill="none" strokeWidth="8" stroke="#1a3d28" 
                          strokeDasharray="251" 
                          strokeDashoffset={251 - (251 * (timeLeft / (25 * 60)))} 
                          strokeLinecap="round" 
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-sm tracking-tight">{formatTime(timeLeft)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Phiên học hiện tại</div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-1 transition-colors" 
                          style={{ background: isTimerRunning ? "#b91c1c" : "#1a3d28" }}
                        >
                          {isTimerRunning ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />} 
                          {isTimerRunning ? "Tạm dừng" : "Bắt đầu"}
                        </button>
                        <button 
                          onClick={() => { setIsTimerRunning(false); setTimeLeft(25 * 60); }}
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Làm mới"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col hidden lg:flex">
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
                    <BrainCircuit size={16} /> Trợ lý AI
                  </div>
                  <div className="flex-1 flex flex-col justify-end gap-3">
                    <div className="self-end bg-[#1a3d28] text-white text-xs p-3 rounded-2xl rounded-tr-sm max-w-[90%] shadow-sm leading-relaxed">
                      Giải thích công thức tích phân từng phần?
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>


        {/* SECTION 2: HỌC CÙNG AI */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-full lg:w-1/2"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-md mx-auto h-[450px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 scrollbar-hide flex flex-col">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`text-sm p-4 rounded-2xl max-w-[90%] leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "ai" 
                        ? "self-start bg-gray-100 text-gray-700 rounded-tl-sm" 
                        : "self-end bg-[#1a3d28] text-white rounded-tr-sm shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="self-start bg-gray-100 text-gray-700 text-sm p-4 rounded-2xl rounded-tl-sm w-16 h-12 flex items-center justify-center gap-1">
                    <motion.div className="w-2 h-2 rounded-full bg-gray-400" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-gray-400" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-gray-400" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                )}
              </div>
              <form onSubmit={handleChatSubmit} className="mt-4 relative flex-shrink-0">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hãy thử hỏi AI điều gì đó..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-3.5 text-sm focus:outline-none focus:border-[#1a3d28] pr-12 transition-colors" 
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="absolute right-1.5 top-1.5 w-10 h-10 rounded-full bg-[#1a3d28] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#112a1b] transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>

          <div className="w-full lg:w-1/2">
            <span className="text-xs font-bold tracking-widest uppercase mb-4 block" style={{ color: "#1a3d28" }}>
              GHI CHÚ & TRỢ LÝ AI
            </span>
            <h2 className="mb-6" style={{ color: "#0d1a14", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Tương tác trực tiếp.<br />Ghi nhớ sâu sắc.
            </h2>
            <p className="mb-8" style={{ color: "#4a5a52", lineHeight: 1.7, fontSize: "1.05rem" }}>
              Hãy thử gõ câu hỏi vào khung chat bên trái để trải nghiệm! AI có thể giải thích khái niệm, tóm tắt bài đọc, hoặc thậm chí yêu cầu sinh bộ câu hỏi trắc nghiệm từ chính tài liệu của bạn.
            </p>
            
            <div className="bg-[#fef9c3] border border-[#fde047] rounded-xl p-4 flex gap-3 items-start max-w-md shadow-sm">
              <span className="text-lg">✍️</span>
              <div>
                <div className="font-semibold text-gray-800 text-sm mb-1">Ghi chú của bạn:</div>
                <div className="text-gray-700 text-sm italic">"Nhớ chọn u = phần dễ lấy đạo hàm"</div>
              </div>
            </div>
          </div>
        </div>


        {/* SECTION 3: FLASHCARD */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-5/12">
            <span className="text-xs font-bold tracking-widest uppercase mb-4 block" style={{ color: "#1a3d28" }}>
              HỆ THỐNG FLASHCARD
            </span>
            <h2 className="mb-6" style={{ color: "#0d1a14", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Ghi nhớ lâu dài với<br />Spaced Repetition.
            </h2>
            <p className="mb-8" style={{ color: "#4a5a52", lineHeight: 1.7, fontSize: "1.05rem" }}>
              Tạo flashcard thủ công hoặc để AI tự động sinh từ tài liệu. Hệ thống lưu lại lịch sử ôn tập giống Quizlet, giúp bạn quay lại thẻ cũ dễ dàng.
            </p>

            <div className="space-y-3">
              {[
                { icon: <Zap size={18} />, title: "AI tự tạo flashcard", desc: "Từ tài liệu PDF, Word hoặc ảnh bạn upload" },
                { icon: <RotateCcw size={18} />, title: "Spaced Repetition", desc: "Ôn đúng lúc, ghi nhớ hiệu quả tối đa" },
                { icon: <CheckCircle size={18} />, title: "Theo dõi tiến độ", desc: "Biết chính xác bao nhiêu % đã nắm vững" }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 transition-colors hover:bg-gray-50 cursor-default">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm mb-0.5">{item.title}</div>
                    <div className="text-gray-500 text-xs">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-full lg:w-7/12 perspective-1000"
          >
            {/* INTERACTIVE Flashcard UI Mockup - Redesigned to be unique */}
            <div className="max-w-lg mx-auto select-none mt-8">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-sm font-semibold text-gray-600">Thẻ {currentCard + 1} / {flashcardDeck.length} · <span className="text-gray-400">Giải tích</span></span>
                <div className="flex gap-1.5">
                  {flashcardDeck.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentCard ? "w-6 bg-[#1a3d28]" : "w-1.5 bg-gray-300"}`}></div>
                  ))}
                </div>
              </div>

              {/* Card Stack Container */}
              <div 
                className="relative aspect-[4/3] cursor-pointer group"
                style={{ perspective: "1200px" }}
              >
                {/* Background Cards for Stack Effect */}
                <div className="absolute inset-x-4 -top-3 bottom-3 bg-white/50 border border-gray-200 rounded-3xl shadow-sm -z-20 transform -rotate-2"></div>
                <div className="absolute inset-x-2 -top-1 bottom-1 bg-white/80 border border-gray-200 rounded-3xl shadow-md -z-10 transform rotate-1"></div>

                <motion.div 
                  className="w-full h-full relative preserve-3d shadow-xl rounded-3xl"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  style={{ transformStyle: "preserve-3d" }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* Front - Paper Texture Style */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-[#faf9f6] rounded-3xl p-8 md:p-12 text-center flex flex-col justify-center items-center group-hover:shadow-2xl transition-shadow" 
                    style={{ 
                      backfaceVisibility: "hidden", 
                      backgroundImage: "radial-gradient(#1a3d28 0.5px, transparent 0.5px)", 
                      backgroundSize: "20px 20px", 
                      border: "2px solid #e5e5e5" 
                    }}
                  >
                    <div className="absolute top-0 bottom-0 left-8 w-[2px] bg-red-100/50 hidden md:block"></div>
                    <span className="bg-[#1a3d28] text-white text-[10px] font-bold tracking-widest uppercase mb-6 px-3 py-1 rounded-full shadow-sm z-10">
                      MẶT TRƯỚC · CHẠM ĐỂ LẬT
                    </span>
                    <h3 className="text-[#0d1a14] text-2xl md:text-3xl font-bold leading-relaxed font-serif z-10 relative">
                      {flashcardDeck[currentCard].front}
                    </h3>
                  </div>

                  {/* Back - Dark Elegant Style */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-[#1a3d28] rounded-3xl p-8 md:p-12 text-center flex flex-col justify-center border-4 border-white/20" 
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <span className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-4 block">
                      MẶT SAU · KẾT QUẢ
                    </span>
                    <h3 className="text-white text-3xl md:text-4xl font-semibold leading-relaxed">
                      {flashcardDeck[currentCard].back}
                    </h3>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons - Including "Back" button */}
              <AnimatePresence>
                {isFlipped && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-3"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); previousCard(); }}
                      className="px-5 py-3 rounded-xl bg-white text-gray-600 text-sm font-semibold border border-gray-200 flex items-center gap-2 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm whitespace-nowrap"
                    >
                      <ArrowLeft size={16} /> Lùi lại
                    </button>
                    
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={(e) => { e.stopPropagation(); nextCard(); }}
                        className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 active:bg-red-200 transition-colors shadow-sm"
                      >
                        <span className="text-lg">⊗</span> Chưa nhớ
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); nextCard(); }}
                        className="flex-1 py-3 rounded-xl bg-[#1a3d28] text-white text-sm font-bold border border-[#1a3d28] flex items-center justify-center gap-2 hover:bg-[#112a1b] active:bg-[#0d1a14] transition-colors shadow-sm"
                      >
                        <CheckCircle size={16} /> Đã nhớ
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
