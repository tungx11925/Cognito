"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Play, Pause, RotateCcw, Send, CheckCircle, 
  Sparkles, BookOpen, Layers, Clock, TrendingUp, HelpCircle, 
  UploadCloud, FileText, ArrowLeft, RefreshCw, Flame, Target, Settings, Brain
} from "lucide-react";
import Link from "next/link";

// Mock Flashcard Deck
const MOCK_FLASHCARDS = [
  { front: "Công thức Đạo hàm của sin(x)?", back: "cos(x)" },
  { front: "Công thức tích phân từng phần?", back: "∫u·dv = u·v - ∫v·du" },
  { front: "Nguyên hàm của 1/x?", back: "ln|x| + C" },
  { front: "Định lý Bayes trong Xác suất?", back: "P(A|B) = [P(B|A) · P(A)] / P(B)" }
];

export default function TestHomePage() {
  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
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
    { id: 1, sender: "ai", text: "Xin chào! Tôi là Cognito AI. Hãy upload tài liệu hoặc đặt câu hỏi về kiến thức giải tích để tôi hỗ trợ bạn ôn tập nhé." },
    { id: 2, sender: "user", text: "Hãy tóm tắt công thức tích phân từng phần." },
    { id: 3, sender: "ai", text: "Công thức tích phân từng phần: ∫u·dv = u·v - ∫v·du. Nguyên lý cốt lõi là chuyển một tích phân phức tạp thành một dạng dễ giải hơn bằng cách chọn hàm u (dễ đạo hàm) và dv (dễ tích phân)." }
  ]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = { id: Date.now(), sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: `Tôi đã nhận được câu hỏi: "${chatInput}". Đây là phản hồi mô phỏng của AI. Khi tích hợp đầy đủ, tôi sẽ quét toàn bộ tài liệu học tập của bạn để đưa ra giải thích chính xác nhất!`
        }
      ]);
      setIsTyping(false);
    }, 1200);
  };

  // Flashcard State
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState({ remembered: 0, forgotten: 0 });

  const nextCard = (remembered: boolean) => {
    if (remembered) {
      setScore(prev => ({ ...prev, remembered: prev.remembered + 1 }));
    } else {
      setScore(prev => ({ ...prev, forgotten: prev.forgotten + 1 }));
    }
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCard((prev) => (prev + 1) % MOCK_FLASHCARDS.length);
    }, 200);
  };

  // Scan File State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFile, setScanFile] = useState<string | null>(null);

  const startScan = (fileName: string) => {
    setScanFile(fileName);
    setIsScanning(true);
    setScanProgress(0);
  };

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsScanning(false);
              // Trigger AI response adding flashcards automatically
              setChatMessages((prevMsg) => [
                ...prevMsg,
                {
                  id: Date.now(),
                  sender: "ai",
                  text: `🎉 Đã xử lý xong tài liệu "${scanFile}"! Tôi đã tự động tạo thêm 5 thẻ ghi nhớ mới trong hệ thống ôn tập của bạn.`
                }
              ]);
            }, 800);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isScanning, scanFile]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ee", color: "#0d1a14", fontFamily: "sans-serif" }}>
      {/* 🧭 Simplified Preview Header */}
      <div className="w-full bg-[#1a3d28] text-white py-3 px-6 text-center text-sm font-semibold flex items-center justify-between shadow-md z-[200] relative">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-slate-900 text-[10px] uppercase font-black px-2 py-0.5 rounded">PREVIEW ROUTE</span>
          <span>Đang xem trước giao diện và hoạt ảnh mới của Cognito</span>
        </div>
        <Link href="/home" className="text-amber-300 hover:underline flex items-center gap-1 text-xs">
          Quay lại trang chủ cũ <ArrowRight size={12} />
        </Link>
      </div>

      {/* -------------------- SECTION 1: HERO -------------------- */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden bg-white border-b border-gray-100">
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(#1a3d28 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}></div>

        {/* Floating abstract elements */}
        <motion.div 
          className="absolute top-28 left-[8%] w-44 h-56 bg-white border border-[#1a3d28]/10 rounded-2xl shadow-xl p-4 hidden lg:block rotate-6"
          animate={{ y: [0, -12, 0], rotate: [6, 8, 6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-800 font-bold mb-3">1</div>
          <div className="h-2 w-full bg-slate-100 rounded mb-2"></div>
          <div className="h-2 w-4/5 bg-slate-100 rounded mb-2"></div>
          <div className="h-2 w-11/12 bg-slate-100 rounded"></div>
        </motion.div>

        <motion.div 
          className="absolute bottom-24 right-[8%] w-48 h-48 bg-[#fef9c3] rounded-3xl opacity-60 shadow-lg hidden lg:block -rotate-6"
          style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 18px, rgba(26,61,40,0.08) 18px, rgba(26,61,40,0.08) 19px)" }}
          animate={{ y: [0, 15, 0], rotate: [-6, -4, -6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-6 text-left">
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full mb-6 bg-[#1a3d28]/5 border border-[#1a3d28]/10 text-xs font-bold text-[#1a3d28]"
            >
              <Sparkles size={13} className="animate-spin text-emerald-700" />
              <span>GIAO DIỆN HOẠT ẢNH TRẢI NGHIỆM MỚI</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6 text-[#0d1a14]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Không gian học tập <br />
              cùng <span className="italic text-[#1a3d28] font-serif font-semibold">Trợ lý AI</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed font-light"
            >
              Đồng bộ tài liệu học tập của bạn, tương tác trực tiếp với Trợ lý AI thế hệ mới, ôn tập thông minh thông qua Flashcards tự động và theo dõi tiến trình tập trung cùng đồng hồ Pomodoro.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <button 
                onClick={() => document.getElementById("study-session")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-4 rounded-full bg-[#1a3d28] text-white hover:bg-[#122e1e] transition-all duration-300 shadow-lg hover:-translate-y-0.5 flex items-center gap-2 font-bold text-sm"
              >
                Trải nghiệm ngay <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => document.getElementById("flashcards-section")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-4 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0d1a14] transition-all duration-300 flex items-center gap-2 font-semibold text-sm"
              >
                Xem ôn tập thẻ
              </button>
            </motion.div>
          </div>

          <div className="lg:col-span-6 relative min-h-[520px] flex items-center justify-center">
            {/* Ambient subtle glow blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-emerald-100/30 blur-3xl -z-10 pointer-events-none" />

            <div 
              className="relative w-full max-w-[460px] h-[480px] mx-auto select-none"
              onMouseLeave={() => setActiveNode(null)}
            >
              {/* SVG connection lines with flowing data pulses */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 460 480">
                {[
                  { id: "docs", x: 95, y: 70 },
                  { id: "pomodoro", x: 365, y: 70 },
                  { id: "flashcards", x: 95, y: 410 },
                  { id: "progress", x: 365, y: 410 }
                ].map((sat) => {
                  const isActive = activeNode === sat.id;
                  return (
                    <React.Fragment key={sat.id}>
                      {/* Static glow line */}
                      <path
                        d={`M 230,240 L ${sat.x},${sat.y}`}
                        stroke="rgba(16, 185, 129, 0.08)"
                        strokeWidth="2"
                        fill="none"
                      />
                      {/* Flowing data pulses line */}
                      <motion.path
                        d={`M 230,240 L ${sat.x},${sat.y}`}
                        stroke={isActive ? "#10b981" : "rgba(16, 185, 129, 0.25)"}
                        strokeWidth={isActive ? "3" : "1.5"}
                        strokeDasharray="6 6"
                        animate={{ strokeDashoffset: [0, -40] }}
                        transition={{
                          repeat: Infinity,
                          duration: isActive ? 1.2 : 2.5,
                          ease: "linear"
                        }}
                        fill="none"
                      />
                    </React.Fragment>
                  );
                })}
              </svg>

              {/* Central Cognito Core / Active Panel Widget */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white border border-slate-200/80 shadow-2xl rounded-3xl z-10 p-6 flex flex-col justify-center items-center text-center overflow-hidden transition-all duration-300 hover:border-emerald-500/30">
                <AnimatePresence mode="wait">
                  {activeNode === null && (
                    <motion.div
                      key="core"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center h-full"
                    >
                      <div className="relative mb-4">
                        {/* Outer pulsing glow */}
                        <motion.div 
                          className="absolute -inset-4 bg-emerald-50 rounded-full -z-10"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        />
                        <div className="w-14 h-14 rounded-full bg-[#1a3d28] flex items-center justify-center text-white shadow-lg shadow-emerald-900/15">
                          <Brain size={26} className="text-emerald-400 animate-pulse" />
                        </div>
                        <motion.div 
                          className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm"
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Sparkles size={8} className="text-white" />
                        </motion.div>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-1.5">Cognito Brain</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Hệ thống thông minh</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed px-1 font-semibold">
                        Rê chuột qua các nút xung quanh để khám phá các siêu năng lực học tập!
                      </p>
                    </motion.div>
                  )}

                  {activeNode === "docs" && (
                    <motion.div
                      key="docs"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col h-full w-full justify-between"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <FileText size={10} className="text-[#1a3d28]" /> Đọc hiểu tài liệu
                        </span>
                        <span className="text-[8px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">AI Scan</span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center gap-2 py-3 text-left">
                        <div className="relative h-1 bg-slate-100 rounded-full overflow-hidden mb-1">
                          <motion.div 
                            className="absolute top-0 bottom-0 left-0 bg-[#1a3d28]"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                          />
                        </div>
                        
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-left text-[9px] text-slate-600 leading-relaxed shadow-inner">
                          <span className="font-bold text-[#1a3d28] block mb-0.5">Trợ lý Cognito AI:</span>
                          "Tôi đã tóm tắt bài học: Tích phân từng phần dùng công thức ∫u dv = uv - ∫v du..."
                        </div>
                      </div>

                      <span className="text-[8px] text-slate-400 font-bold">Quét tài liệu PDF/Docx chỉ trong 1 giây</span>
                    </motion.div>
                  )}

                  {activeNode === "pomodoro" && (
                    <motion.div
                      key="pomodoro"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col h-full w-full justify-between items-center"
                    >
                      <div className="w-full flex justify-between items-center pb-2 border-b border-slate-100 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} className="text-[#1a3d28]" /> Pomodoro tập trung
                        </span>
                        <span className="text-[8px] bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded animate-pulse">Live</span>
                      </div>

                      <div className="flex flex-col items-center py-2">
                        <span className="text-2xl font-black text-slate-800 font-mono tracking-tight mb-1">25:00</span>
                        <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Sẵn sàng đếm ngược</span>
                      </div>

                      <button className="w-full py-1.5 rounded-lg bg-[#1a3d28] hover:bg-[#112a1b] text-white text-[10px] font-bold transition-colors shadow-md">
                        Bắt đầu phiên học
                      </button>
                    </motion.div>
                  )}

                  {activeNode === "flashcards" && (
                    <motion.div
                      key="flashcards"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col h-full w-full justify-between"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <BookOpen size={10} className="text-[#1a3d28]" /> Thẻ ghi nhớ 3D
                        </span>
                        <span className="text-[8px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded">Học nhanh</span>
                      </div>

                      <div className="flex-1 flex items-center justify-center py-2.5">
                        <div 
                          className="w-full bg-[#fffdf0] border border-slate-300 rounded-xl p-3 shadow-md flex flex-col justify-center items-center text-center relative overflow-hidden"
                          style={{
                            backgroundImage: "repeating-linear-gradient(transparent, transparent 16px, #f1f5f9 16px, #f1f5f9 17px)",
                            borderLeft: "4px solid #f87171"
                          }}
                        >
                          <span className="text-[7px] text-slate-400 font-bold block mb-1">MẶT TRƯỚC</span>
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">Đạo hàm của sin(x)?</span>
                        </div>
                      </div>

                      <span className="text-[8px] text-slate-400 font-bold">Lật ngược xem đáp án ở phần bên dưới</span>
                    </motion.div>
                  )}

                  {activeNode === "progress" && (
                    <motion.div
                      key="progress"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col h-full w-full justify-between"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <TrendingUp size={10} className="text-[#1a3d28]" /> Tiến độ & Bento
                        </span>
                        <span className="text-[8px] bg-[#1a3d28]/10 text-[#1a3d28] font-bold px-1.5 py-0.5 rounded">Báo cáo</span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center gap-2 py-3 text-left">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                          <span>Giải tích 12</span>
                          <span>92%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1a3d28] rounded-full w-[92%]" />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                          <span>Học liên tục: 12 ngày</span>
                          <span>🔥</span>
                        </div>
                      </div>

                      <span className="text-[8px] text-slate-400 font-bold">Theo dõi tiến trình trực quan từng bài học</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Satellite Nodes */}
              {[
                {
                  id: "docs",
                  title: "Tài Liệu AI",
                  desc: "Chat & tóm tắt",
                  icon: FileText,
                  color: "from-emerald-500 to-teal-600",
                  positionClass: "top-4 left-0"
                },
                {
                  id: "pomodoro",
                  title: "Đồng Hồ Tập Trung",
                  desc: "Pomodoro đếm ngược",
                  icon: Clock,
                  color: "from-emerald-600 to-green-700",
                  positionClass: "top-4 right-0"
                },
                {
                  id: "flashcards",
                  title: "Học Thẻ 3D",
                  desc: "Lặp lại ngắt quãng",
                  icon: BookOpen,
                  color: "from-amber-500 to-amber-600",
                  positionClass: "bottom-4 left-0"
                },
                {
                  id: "progress",
                  title: "Thống Kê Bento",
                  desc: "Báo cáo tiến trình",
                  icon: TrendingUp,
                  color: "from-teal-600 to-emerald-800",
                  positionClass: "bottom-4 right-0"
                }
              ].map((sat) => {
                const Icon = sat.icon;
                const isActive = activeNode === sat.id;
                return (
                  <div
                    key={sat.id}
                    onMouseEnter={() => setActiveNode(sat.id)}
                    className={`absolute ${sat.positionClass} z-20 cursor-pointer`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`flex items-center gap-2.5 p-3 bg-white border ${
                        isActive ? "border-emerald-500 shadow-xl" : "border-slate-200/80 shadow-md"
                      } rounded-2xl transition-all duration-300 w-[170px] text-left`}
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sat.color} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="text-[11px] font-bold text-slate-800 truncate">{sat.title}</span>
                        <span className="text-[8px] text-slate-400 font-bold truncate">{sat.desc}</span>
                      </div>
                    </motion.div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 1.5: BRAND MARQUEE -------------------- */}
      <section className="bg-[#1a3d28] py-7 overflow-hidden relative border-y border-[#1a3d28]/10 shadow-sm z-30">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
        <div className="animate-marquee-container">
          <div className="animate-marquee-content gap-12 items-center flex pr-12">
            {[...Array(4)].map((_, idx) => (
              <React.Fragment key={idx}>
                <span className="text-white/95 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Sparkles size={13} className="text-amber-300 animate-pulse" /> EduShare AI
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-white/80 font-bold uppercase tracking-wider text-xs">Tự động quét tài liệu</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-white/80 font-bold uppercase tracking-wider text-xs">Đối thoại cùng trợ lý AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-white/80 font-bold uppercase tracking-wider text-xs">Sinh thẻ ghi nhớ tự động</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-white/80 font-bold uppercase tracking-wider text-xs">Làm chủ thời gian Pomodoro</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 2: STUDY SESSION WITH POMODORO & AI -------------------- */}
      <section id="study-session" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-[#1a3d28] mb-3 block">SECTION 2: TRÌNH TỰ TẬP TRUNG</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[#0d1a14]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Học song song. Tập trung tối đa.
          </h2>
          <p className="text-slate-600">
            Xem tài liệu, tương tác hỏi đáp trực tiếp với trợ lý AI và kiểm soát chu kỳ làm việc hiệu quả ngay trên một khung màn hình.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Document Viewer (Left) */}
          <div className="lg:col-span-7 bg-[#faf9f6] border border-slate-200/80 rounded-2xl p-6 md:p-8 flex flex-col justify-between relative shadow-lg min-h-[450px]">
            {/* Ruled Yellow Note Sticky */}
            <motion.div 
              className="absolute -top-4 -right-4 bg-[#fef9c3] border border-amber-200/80 shadow-md rounded-xl p-4 w-52 text-xs text-slate-700 z-20 pointer-events-none rotate-3"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="font-bold border-b border-[#1a3d28]/10 pb-1 mb-1.5 flex items-center gap-1.5 text-[#1a3d28]">
                <span>📌 GHI CHÚ NHANH</span>
              </div>
              <p className="italic">Nhớ công thức: u = đa thức, dv = hàm mũ (thứ tự ưu tiên chọn u: Nhất lô, nhì đa, tam lượng, tứ mũ).</p>
            </motion.div>

            <div className="flex-1 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <FileText size={14} className="text-[#1a3d28]" />
                  GIAI-TICH-12.pdf
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded">Trang 4 / 15</span>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 font-serif">Chương 1: Tích phân & Đạo hàm nâng cao</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Để tính tích phân của tích hai hàm số không cùng loại (ví dụ: hàm đa thức nhân hàm lượng giác), phương pháp phổ biến và hữu hiệu nhất là **tích phân từng phần**.
                </p>

                <div className="bg-white p-5 rounded-xl border border-slate-200 text-center font-serif text-lg my-4 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#1a3d28]"></div>
                  <span className="text-slate-800 text-lg md:text-xl font-bold block">∫ u dv = u v - ∫ v du</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Khi thực hiện phép đặt biến, cần tuân thủ quy tắc chọn ẩn để giảm thiểu độ phức tạp của tích phân thứ hai sau khi tính đạo hàm của hàm số được chọn.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/50 mt-6 flex justify-between items-center text-xs text-slate-400">
              <span>Đã cuộn: 40%</span>
              <span>Cập nhật 2 phút trước</span>
            </div>
          </div>

          {/* Pomodoro & AI Assistant (Right) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Pomodoro Timer Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-lg flex items-center gap-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" stroke="#f1f5f9" />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" strokeWidth="6" stroke="#1a3d28" 
                    strokeDasharray="251" 
                    strokeDashoffset={251 - (251 * (timeLeft / (25 * 60)))} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-slate-800">
                  {formatTime(timeLeft)}
                </div>
              </div>

              <div className="flex-1">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                  {isTimerRunning ? "⏱️ Đang ôn tập" : "⏱️ Pomodoro ngắt quãng"}
                </span>
                <h4 className="font-bold text-slate-800 text-sm mb-2">Chế độ Tập trung Cao độ</h4>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-md"
                    style={{ background: isTimerRunning ? "#b91c1c" : "#1a3d28" }}
                  >
                    {isTimerRunning ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    {isTimerRunning ? "Tạm dừng" : "Bắt đầu"}
                  </button>
                  <button 
                    onClick={() => { setIsTimerRunning(false); setTimeLeft(25 * 60); }}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Assistant Chat Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-lg flex-1 flex flex-col justify-between overflow-hidden min-h-[300px]">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Cognito AI Chatbot
                </span>
                <span className="text-[10px] text-slate-400">Model: Gemini Pro</span>
              </div>

              {/* Message List */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[260px] text-xs">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.sender === "ai" 
                        ? "bg-slate-100 text-slate-800 self-start rounded-tl-sm" 
                        : "bg-[#1a3d28] text-white self-end rounded-tr-sm ml-auto"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="bg-slate-100 text-slate-800 p-3 rounded-2xl rounded-tl-sm w-12 flex items-center justify-center gap-1 self-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-100 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi AI phân tích bài tập..." 
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-xs focus:outline-none focus:border-[#1a3d28]" 
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim() || isTyping}
                  className="w-8 h-8 rounded-full bg-[#1a3d28] text-white flex items-center justify-center hover:bg-[#112a1b] disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  <Send size={12} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 3: FLASHCARDS (3D FLIP & Spaced Repetition) -------------------- */}
      <section id="flashcards-section" className="bg-white py-24 px-6 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5">
            <span className="text-xs font-bold tracking-widest uppercase text-[#1a3d28] mb-3 block">SECTION 3: HỌC THẺ GHI NHỚ</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-[#0d1a14]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ghi nhớ lâu dài với hiệu ứng lật thẻ 3D.
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Nhấp trực tiếp lên thẻ để lật ngược mặt sau xem đáp án, sau đó tự đánh giá mức độ ghi nhớ. Hệ thống tự động tối ưu hóa tần suất lặp lại để củng cố trí nhớ dài hạn.
            </p>

            {/* Live Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a3d28]/5 border border-[#1a3d28]/10 rounded-xl p-4 text-center">
                <span className="block text-2xl font-black text-[#1a3d28]">{score.remembered}</span>
                <span className="text-xs font-bold text-slate-500">Đã nhớ tốt</span>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
                <span className="block text-2xl font-black text-rose-700">{score.forgotten}</span>
                <span className="text-xs font-bold text-slate-500">Cần học lại</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Interactive 3D Card Stack Container */}
            <div className="max-w-md mx-auto relative select-none">
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-bold text-slate-400">THẺ SỐ {currentCard + 1} / {MOCK_FLASHCARDS.length}</span>
                <div className="flex gap-1">
                  {MOCK_FLASHCARDS.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentCard ? "w-4 bg-[#1a3d28]" : "w-1 bg-slate-200"}`}></div>
                  ))}
                </div>
              </div>

              {/* 3D Container */}
              <div 
                className="relative aspect-[4/3] cursor-pointer"
                style={{ perspective: "1000px" }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Background stack effect cards */}
                <div className="absolute inset-x-3 -top-2.5 bottom-2.5 bg-white/40 border border-slate-200 rounded-2xl shadow-sm -z-20 transform -rotate-1"></div>
                <div className="absolute inset-x-1.5 -top-1 bottom-1 bg-white/80 border border-slate-200 rounded-2xl shadow-md -z-10 transform rotate-1"></div>

                {/* Main Interactive Card */}
                <motion.div 
                  className="w-full h-full relative"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 180, damping: 18 }}
                >
                  {/* Front Face (Ruled notebook paper layout) */}
                  <div 
                    className="absolute inset-0 bg-[#fffdf0] rounded-2xl border-2 border-slate-300 shadow-lg p-8 flex flex-col justify-center items-center text-center backface-hidden"
                    style={{ 
                      backfaceVisibility: "hidden", 
                      backgroundImage: "repeating-linear-gradient(transparent, transparent 24px, #e2e8f0 24px, #e2e8f0 25px)", 
                      borderLeft: "6px solid #f87171" 
                    }}
                  >
                    <span className="bg-[#1a3d28]/10 text-[#1a3d28] border border-[#1a3d28]/20 text-[9px] font-bold tracking-widest uppercase mb-6 px-2.5 py-0.5 rounded-full relative z-10">
                      MẶT TRƯỚC · NHẤP ĐỂ LẬT
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold font-serif text-slate-800 leading-relaxed px-4 relative z-10">
                      {MOCK_FLASHCARDS[currentCard].front}
                    </h3>
                  </div>

                  {/* Back Face (Dark elegant forest green layout) */}
                  <div 
                    className="absolute inset-0 bg-[#1a3d28] rounded-2xl border-4 border-white/10 shadow-lg p-8 flex flex-col justify-center items-center text-center backface-hidden"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <span className="text-emerald-300 text-[9px] font-bold tracking-widest uppercase mb-4 block">
                      MẶT SAU · ĐÁP ÁN
                    </span>
                    <h3 className="text-white text-2xl md:text-3xl font-semibold leading-relaxed px-4">
                      {MOCK_FLASHCARDS[currentCard].back}
                    </h3>
                  </div>
                </motion.div>
              </div>

              {/* Rating Actions */}
              <AnimatePresence>
                {isFlipped && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="flex justify-between items-center mt-6 gap-3"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <ArrowLeft size={14} /> Quay lại
                    </button>
                    
                    <div className="flex gap-2 flex-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); nextCard(false); }}
                        className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        ⊗ Chưa nhớ
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); nextCard(true); }}
                        className="flex-1 py-2.5 rounded-xl bg-[#1a3d28] text-white text-xs font-bold border border-[#1a3d28] hover:bg-[#112a1b] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle size={14} /> Đã nhớ tốt
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 4: GAMIFIED BENTO DASHBOARD -------------------- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-[#1a3d28] mb-3 block">SECTION 4: THỐNG KÊ TIẾN TRÌNH</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[#0d1a14]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Hệ thống Bento theo dõi bài học.
          </h2>
          <p className="text-slate-600">
            Xem tiến độ phân tích chi tiết được gói gọn trong thiết kế thẻ lưới tối giản và đẹp mắt.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Card 1: Hour Metrics (Left) */}
          <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Thời gian học tập</span>
              <h3 className="text-slate-800 text-xl font-bold flex items-center gap-1">
                <Clock size={18} className="text-[#1a3d28]" /> 12h 45m
              </h3>
            </div>
            <div className="py-6 flex justify-center">
              {/* Animated Progress Circle */}
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" stroke="#f1f5f9" />
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" stroke="#1a3d28" strokeDasharray="251" strokeDashoffset="62" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-800 leading-none">75%</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Target</span>
                </div>
              </div>
            </div>
            <span className="text-xs text-slate-400 block text-center">Mục tiêu học 15 giờ trong tuần này</span>
          </div>

          {/* Card 2: Day Streak (Center-Top) */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Streak card */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-2 right-2 text-amber-200 scale-150">
                <Flame size={72} strokeWidth={1} fill="currentColor" className="opacity-20" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">Học liên tục</span>
                <h3 className="text-amber-900 text-4xl font-extrabold flex items-baseline gap-1.5">
                  12 <span className="text-xs font-semibold text-amber-700">ngày liên tiếp</span>
                </h3>
              </div>
              <div className="flex gap-1.5 mt-6 z-10">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i < 5 ? "bg-amber-400 text-amber-900 shadow-sm" : "bg-slate-200 text-slate-400"}`}>
                    {i === 4 ? "🔥" : i + 1}
                  </div>
                ))}
              </div>
              <span className="text-xs text-amber-800/70 block mt-2">Duy trì ôn tập mỗi ngày để củng cố trí nhớ!</span>
            </div>

            {/* Target Mastery card */}
            <div className="bg-[#1a3d28] text-[#f5f3ee] rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[10px] opacity-75 uppercase tracking-widest block mb-1">Mức độ thông thạo</span>
                <h3 className="text-xl font-bold flex items-center gap-1.5">
                  <Target size={18} className="text-emerald-300" />
                  Đạt 92% Thẻ
                </h3>
              </div>
              <div className="py-4 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Giải tích 12</span>
                  <span>95%</span>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-[95%]"></div>
                </div>
                <div className="flex justify-between text-xs font-bold pt-2">
                  <span>Toán học Đại cương</span>
                  <span>80%</span>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-[80%]"></div>
                </div>
              </div>
              <span className="text-[10px] text-white/50 block">Được phân tích từ kết quả đánh giá Flashcard</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 5: AI DOCUMENT SCAN FLOW -------------------- */}
      <section className="bg-white py-24 px-6 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="text-xs font-bold tracking-widest uppercase text-[#1a3d28] mb-3 block">SECTION 5: TỰ ĐỘNG QUÉT TÀI LIỆU</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-[#0d1a14]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tải tài liệu lên. <br />AI xử lý tức thì.
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Kéo và thả tài liệu định dạng PDF hoặc DOCX của bạn vào phân vùng bên cạnh. Trợ lý AI của Cognito sẽ tự động phân tích cấu trúc văn bản, sinh tóm tắt và bộ thẻ ghi nhớ tương ứng.
            </p>

            {/* Quick action simulation */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => startScan("Bai-Tap-Toan-12.docx")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0d1a14] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <FileText size={14} className="text-[#1a3d28]" />
                Demo file: Toán 12
              </button>
              <button 
                onClick={() => startScan("De-Cuong-Ly-Dai-Cuong.pdf")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0d1a14] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <FileText size={14} className="text-[#1a3d28]" />
                Demo file: Vật lý đại cương
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Interactive Upload scan preview */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 bg-[#faf9f6] text-center min-h-[280px] flex flex-col justify-center items-center relative overflow-hidden">
              
              {isScanning && (
                <>
                  {/* Glowing Laser Scan Line */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  />

                  <div className="space-y-4 z-10">
                    <RefreshCw className="mx-auto text-[#1a3d28] animate-spin" size={32} />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Đang quét tài liệu: "{scanFile}"</h4>
                      <p className="text-xs text-slate-400 mt-1">Trợ lý AI đang sinh cấu trúc kiến thức và tạo thẻ...</p>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-64 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-[#1a3d28] h-full transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 block">{scanProgress}%</span>
                  </div>
                </>
              )}

              {!isScanning && (
                <div className="space-y-4 cursor-pointer" onClick={() => startScan("Giao-Trinh-Triet-Hoc.pdf")}>
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-sm hover:scale-105 transition-transform">
                    <UploadCloud size={24} className="text-[#1a3d28]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Kéo & Thả tài liệu học tập vào đây</h4>
                    <p className="text-xs text-slate-400 mt-1">Hỗ trợ các file .pdf, .docx, .png (Kích thước tối đa 20MB)</p>
                  </div>
                  <span className="text-[10px] text-[#1a3d28] font-bold underline block">Hoặc click vào đây để chọn tài liệu</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 6: CALL TO ACTION & FOOTER -------------------- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        {/* Large Rounded Forest Green CTA Card */}
        <div 
          className="rounded-3xl p-10 md:p-16 text-center text-[#f5f3ee] relative overflow-hidden shadow-2xl"
          style={{ background: "#1a3d28" }}
        >
          {/* Abstract floating sheets inside card */}
          <motion.div 
            className="absolute top-6 left-6 w-24 h-32 bg-white/5 border border-white/10 rounded-xl rotate-12 hidden md:block"
            animate={{ y: [0, -8, 0], rotate: [12, 14, 12] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-6 right-6 w-32 h-32 bg-white/5 border border-white/10 rounded-full hidden md:block"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />

          <div className="max-w-xl mx-auto relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold font-serif leading-tight">
              Bắt đầu hành trình <br />học tập cùng Cognito
            </h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed font-light">
              Đồng hành cùng hàng ngàn học sinh, sinh viên tối ưu hóa điểm số và khả năng tiếp thu kiến thức chỉ với những công cụ tối giản và mạnh mẽ nhất.
            </p>
            <div className="pt-4">
              <Link 
                href="/home" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#f5f3ee] text-[#1a3d28] hover:bg-white font-bold rounded-full text-sm transition-all duration-300 shadow-xl hover:-translate-y-0.5"
              >
                Trở về Trang Chủ Chính <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} Cognito Inc. Tất cả quyền được bảo lưu.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Liên hệ hỗ trợ</a>
          </div>
        </div>
      </section>
    </div>
  );
}
