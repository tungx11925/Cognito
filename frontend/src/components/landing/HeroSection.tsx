import { motion } from "framer-motion";
import { ArrowRight, Play, Hourglass, BookText, MessageSquare, Layers, FileText, Search, Bell } from "lucide-react";

const heroImageUrl =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxsZWFybmluZ3xlbnwwfHx8fDE3MjE4MzY3MTh8MA&ixlib=rb-4.1.0&q=80&w=1080";

interface HeroSectionProps {
  onStartClick: () => void;
  onDemoClick: () => void;
}

export function HeroSection({ onStartClick, onDemoClick }: HeroSectionProps) {
  return (
    <section className="relative pb-[250px] lg:pb-[350px] bg-white overflow-hidden">
      
      {/* Main Rounded Container */}
      <div 
        className="relative overflow-hidden pt-36 pb-72 px-6 text-center flex flex-col items-center border-b border-gray-100"
        style={{ background: "linear-gradient(180deg, #f5f3ee 0%, #e8e5de 100%)" }}
      >
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#1a3d28 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
        
        {/* Floating Abstract "Paper" Shapes (Top area) */}
        <motion.div 
          className="absolute top-20 left-[10%] w-64 h-64 rounded-3xl opacity-40 rotate-12"
          style={{ background: "#ffffff", border: "1px solid rgba(26,61,40,0.1)" }}
          animate={{ y: [0, -15, 0], rotate: [12, 14, 12] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-32 right-[12%] w-48 h-48 rounded-full opacity-30 blur-3xl"
          style={{ background: "#fef9c3" }}
        />

        {/* LAYERED PAPER EFFECT (Craft Aesthetic) - Bottom of Container */}
        <div className="absolute bottom-0 left-0 w-full h-[300px] overflow-hidden pointer-events-none">
          
          {/* 1. Yellow Lined Paper (Far Right) */}
          <div 
            className="absolute -right-12 -bottom-16 w-96 h-80 transform -rotate-[15deg] shadow-2xl z-0" 
            style={{
              background: "#fef9c3",
              backgroundImage: "repeating-linear-gradient(transparent, transparent 28px, rgba(26,61,40,0.15) 28px, rgba(26,61,40,0.15) 29px)",
              borderRadius: "24px 0 0 0"
            }}
          ></div>

          {/* 2. Dark Grey/Black Torn Paper (Center Right) */}
          <svg className="absolute right-[12%] bottom-0 w-[400px] h-64 transform -rotate-6 z-10 filter drop-shadow-2xl" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 L0,30 L8,22 L15,35 L22,25 L32,40 L42,28 L50,45 L58,32 L68,48 L75,35 L85,45 L92,30 L100,40 L100,100 Z" fill="#2d3748" />
          </svg>

          {/* 3. Light Grey Torn Paper (Center Right, overlapping dark grey) */}
          <svg className="absolute right-[18%] bottom-0 w-[450px] h-56 transform rotate-3 z-20 filter drop-shadow-xl" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 L0,45 L10,38 L18,48 L28,35 L38,50 L48,38 L58,55 L65,42 L75,52 L85,38 L95,48 L100,40 L100,100 Z" fill="#e8e7e3" />
          </svg>

          {/* 4. White Spiral Notebook Paper (Center Left) */}
          <svg className="absolute left-[2%] -bottom-4 w-[60%] h-64 transform -rotate-2 origin-bottom-left filter drop-shadow-2xl z-30" preserveAspectRatio="none">
            <defs>
              <mask id="notebook-holes">
                <rect width="100%" height="100%" fill="white" />
                <pattern id="hole-pattern" width="60" height="50" patternUnits="userSpaceOnUse">
                  <rect x="20" y="-10" width="20" height="35" rx="6" fill="black" />
                </pattern>
                <rect width="100%" height="50" fill="url(#hole-pattern)" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="#ffffff" mask="url(#notebook-holes)" />
          </svg>

          {/* 5. Dark Green Torn Paper (Far Left) */}
          <svg className="absolute -left-10 bottom-0 w-[500px] h-52 transform -rotate-3 z-40 filter drop-shadow-2xl" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 L0,40 L8,35 L15,45 L22,32 L32,42 L40,30 L50,45 L60,35 L70,48 L78,38 L88,45 L95,35 L100,42 L100,100 Z" fill="#1a3d28" />
          </svg>

        </div>

        {/* Center Content */}
        <div className="relative z-50 max-w-3xl mx-auto flex flex-col items-center">
          
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 shadow-sm backdrop-blur-md"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(26,61,40,0.1)" }}
          >
            <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(26,61,40,0.8)]" style={{ background: "#1a3d28" }} />
            <span style={{ color: "#0d1a14", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.02em" }}>
              EduShare AI — Trợ lý học tập thông minh
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mb-6 max-w-4xl"
            style={{
              fontFamily: "'Playfair Display', 'Merriweather', 'Times New Roman', Times, serif",
              fontSize: "clamp(2.8rem, 5.5vw, 4.8rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#0d1a14",
            }}
          >
            Nền tảng học tập cùng <br className="hidden md:block" />
            <em style={{ 
              fontStyle: "italic", 
              color: "#1a3d28",
              fontWeight: 600,
              display: "inline-block",
              transform: "rotate(-1deg)"
            }}>
              Trợ lý Thông minh
            </em>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-10 max-w-xl text-center"
            style={{ fontSize: "1.1rem", color: "#4a5a52", lineHeight: 1.6, fontWeight: 400 }}
          >
            Đọc tài liệu, hỏi đáp trực tiếp với AI, tự động tạo Flashcard và duy trì sự tập trung với Pomodoro. Không gian tối ưu cho mọi ý tưởng lớn của bạn.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={onStartClick}
              className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              style={{ background: "#1a3d28", color: "#ffffff", fontWeight: 600, fontSize: "1rem" }}
            >
              Bắt đầu học miễn phí
            </button>

            <button
              onClick={onDemoClick}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full transition-all duration-300 hover:bg-white shadow-sm border border-gray-200"
              style={{ background: "rgba(255,255,255,0.7)", color: "#0d1a14", fontWeight: 600, fontSize: "1rem", backdropFilter: "blur(10px)" }}
            >
              <Play size={16} fill="currentColor" />
              Xem tính năng
            </button>
          </motion.div>
        </div>
      </div>

      {/* Floating Mockup Overlapping the Container Bottom */}
      <div className="relative z-50 max-w-5xl mx-auto -mt-[200px] lg:-mt-[250px] px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100, damping: 20 }}
          className="relative"
        >
          {/* Main Mockup Window */}
          <div 
            className="rounded-2xl overflow-hidden shadow-2xl bg-white border-4 border-white"
            style={{ boxShadow: "0 30px 60px -15px rgba(26,61,40,0.4)" }}
          >
            {/* Fake Browser Header */}
            <div className="h-8 bg-gray-100 flex items-center px-4 gap-1.5 border-b border-gray-200">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            {/* App UI Mockup instead of Image */}
            <div className="w-full bg-white flex" style={{ aspectRatio: "16/9" }}>
              {/* Sidebar */}
              <div className="hidden sm:flex w-1/4 lg:w-1/5 bg-[#fcfcfc] border-r border-gray-100 p-4 flex-col gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#1a3d28] flex items-center justify-center text-white text-xs font-bold shadow-sm">E</div>
                  <span className="font-semibold text-sm text-gray-800">EduShare</span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">KHÔNG GIAN HỌC</div>
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-100 text-sm text-[#1a3d28] font-semibold">
                    <BookText size={15} /> Tài liệu
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg cursor-default transition-colors">
                    <Layers size={15} /> Flashcards
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg cursor-default transition-colors">
                    <MessageSquare size={15} /> Trợ lý AI
                  </div>
                </div>

                <div className="mt-auto space-y-1">
                  <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 font-medium hover:bg-gray-100 rounded-lg cursor-default">
                    <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                      <img src="https://ui-avatars.com/api/?name=User&background=random" alt="Avatar" />
                    </div>
                    Tài khoản
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 lg:p-8 bg-white flex flex-col relative overflow-hidden">
                {/* Topbar */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-2 w-1/2">
                    <Search size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400 font-medium">Tìm kiếm tài liệu, flashcard...</span>
                  </div>
                  <div className="flex gap-3 text-gray-400">
                    <Bell size={18} />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-4 font-serif">Tài liệu gần đây</h3>

                {/* Grid of Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Card 1: Red (Toán) */}
                  <div className="bg-[#fff1f2] border border-[#ffe4e6] rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-rose-500 mb-4">
                      <BookText size={20} strokeWidth={2.5}/>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">Toán Cao Cấp</h4>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1">Chương 3: Đạo hàm & Tích phân</p>
                    <div className="mt-auto pt-6">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1.5">
                        <span>Tiến độ</span>
                        <span>75%</span>
                      </div>
                      <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full w-3/4"></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Blue (Vật lý) */}
                  <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500 mb-4">
                      <Layers size={20} strokeWidth={2.5}/>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">Vật lý Đại cương</h4>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1">Bộ thẻ ghi nhớ - 50 thẻ</p>
                    <div className="mt-auto pt-6">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1.5">
                        <span>Đã ôn tập</span>
                        <span>12/50</span>
                      </div>
                      <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-1/4"></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Green (Lịch sử - AI Chat) */}
                  <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow cursor-default hidden sm:flex">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-green-500 mb-4">
                      <MessageSquare size={20} strokeWidth={2.5}/>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">Lịch sử Thế giới</h4>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1">Phiên hỏi đáp AI đang mở</p>
                    <div className="mt-auto pt-6">
                      <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Đang hoạt động
                      </div>
                    </div>
                  </div>
                  
                  {/* Card 4: Yellow (Ghi chú) */}
                  <div className="bg-[#fef9c3] border border-[#fde047] rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow cursor-default hidden lg:flex">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-yellow-600 mb-4">
                      <FileText size={20} strokeWidth={2.5}/>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">Ghi chú cá nhân</h4>
                    <p className="text-xs text-gray-500 font-medium line-clamp-2">Ý tưởng bài luận Văn học và dàn ý chi tiết...</p>
                    <div className="mt-auto pt-4 text-[10px] text-gray-400 font-bold">
                      Cập nhật 2 giờ trước
                    </div>
                  </div>
                </div>
                
                {/* Decorative fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Floating Badge - Top Right (Memory Score) */}
          <motion.div
            className="absolute -top-6 -right-4 md:-right-8 px-6 py-4 rounded-2xl flex flex-col justify-center items-center backdrop-blur-md"
            style={{ background: "rgba(26,61,40,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 15px 35px rgba(26,61,40,0.4)" }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>
              ĐIỂM THẺ GHI NHỚ
            </div>
            <div style={{ color: "#ffffff", fontWeight: 600, fontSize: "1.75rem", lineHeight: 1 }}>
              98%
            </div>
          </motion.div>

          {/* Floating Badge - Bottom Left (Pomodoro) */}
          <motion.div
            className="absolute -bottom-6 -left-4 md:-left-8 px-5 py-3.5 rounded-2xl flex items-center gap-3 backdrop-blur-md"
            style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 15px 35px rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.05)" }}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100">
              <Hourglass size={18} style={{ color: "#1a3d28" }} />
            </div>
            <div>
              <div style={{ color: "#0d1a14", fontWeight: 600, fontSize: "0.85rem", marginBottom: "1px" }}>
                Pomodoro Timer
              </div>
              <div style={{ color: "#718096", fontSize: "0.75rem" }}>
                Đang tập trung...
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}
