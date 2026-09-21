"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Sparkles, BookOpen, Clock, Target, Shield, CheckCircle, GraduationCap, X, ChevronRight, User, Lock, Loader2, BookMarked
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudy } from "@/context/StudyContext";

export default function CognitoLandingPage() {
  const router = useRouter();
  const { login, register, activeUser, isAuthenticated } = useStudy();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Handle redirect if logged in
  useEffect(() => {
    if (isAuthenticated && activeUser) {
      if (activeUser.role === 'school_admin' || activeUser.role === 'admin') router.push('/school');
      else if (activeUser.role === 'teacher') router.push('/teacher');
      else router.push('/student');
    }
  }, [isAuthenticated, activeUser, router]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (authMode === 'login') {
        const success = await login(email, password);
        if (!success) setError('Email hoặc mật khẩu không chính xác.');
      } else {
        const success = await register(name, email, password);
        if (!success) setError('Đăng ký thất bại. Email có thể đã tồn tại.');
        else {
          await login(email, password);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
      
      {/* 🚀 Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-gray-900">Cognito</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 font-medium text-gray-600 text-sm">
            <Link href="#features" className="hover:text-emerald-600 transition-colors">Tính năng</Link>
            <Link href="#solutions" className="hover:text-emerald-600 transition-colors">Giải pháp</Link>
            <Link href="#testimonials" className="hover:text-emerald-600 transition-colors">Đánh giá</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="hidden md:block font-bold text-sm text-gray-700 hover:text-emerald-600 transition-colors"
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              Bắt đầu miễn phí
            </button>
          </div>
        </div>
      </header>

      {/* 🌟 WOW Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-300/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-300/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold mb-8 shadow-sm"
          >
            <Sparkles size={16} className="text-emerald-500" />
            <span>Nền tảng học tập thông minh thế hệ mới</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold font-display tracking-tighter text-gray-900 leading-[1.1] mb-8"
          >
            Học tập không giới hạn. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Quản lý toàn diện.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Cognito kết nối nhà trường, giáo viên và học sinh trên một nền tảng duy nhất. Trải nghiệm giáo dục cá nhân hóa với sự hỗ trợ của AI.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-lg font-bold shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              Tham gia ngay <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-full text-lg font-bold shadow-sm hover:shadow-md transition-all"
            >
              Tìm hiểu thêm
            </button>
          </motion.div>
        </div>

        {/* Dashboard Preview Image (Mock) */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 50 }}
          className="max-w-6xl mx-auto mt-20 relative z-10"
        >
          <div className="rounded-[2rem] p-2 bg-white/40 backdrop-blur-2xl shadow-2xl border border-white/60">
            <div className="rounded-[1.5rem] overflow-hidden border border-gray-200/50 bg-gray-50 aspect-video relative flex items-center justify-center">
              {/* Abstract Representation of Dashboard */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex p-8 gap-8">
                {/* Sidebar */}
                <div className="w-48 h-full bg-white rounded-xl shadow-sm border border-gray-100 hidden md:flex flex-col p-4 gap-4 opacity-70">
                  <div className="w-full h-8 bg-gray-100 rounded-lg"></div>
                  <div className="w-3/4 h-4 bg-gray-100 rounded mt-4"></div>
                  <div className="w-2/3 h-4 bg-gray-100 rounded"></div>
                  <div className="w-3/4 h-4 bg-gray-100 rounded"></div>
                </div>
                {/* Main */}
                <div className="flex-1 h-full flex flex-col gap-6 opacity-90">
                  <div className="flex justify-between items-center">
                    <div className="w-48 h-10 bg-white rounded-xl shadow-sm border border-gray-100"></div>
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-gray-100"></div>
                  </div>
                  <div className="flex gap-6 h-32">
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4"></div>
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4"></div>
                    <div className="flex-1 bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 p-4 hidden lg:block"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                    <div className="w-full h-8 bg-gray-50 rounded-lg"></div>
                    <div className="w-full flex-1 bg-gray-50 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 to-transparent"></div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 🍱 Bento Grid Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-gray-900 mb-4">Hệ sinh thái toàn diện</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Mọi công cụ bạn cần để quản lý, giảng dạy và học tập hiệu quả, tất cả trong một.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1 */}
            <div className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100 flex flex-col justify-between overflow-hidden relative group hover:shadow-lg transition-all">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6">
                  <BookMarked className="text-emerald-600" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Quản lý Trường học</h3>
                <p className="text-gray-600 max-w-sm">Tổ chức năm học, quản lý học kỳ, phân công giáo viên và theo dõi tiến độ toàn trường một cách dễ dàng.</p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/40 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100 flex flex-col justify-between relative group hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6">
                <Target className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Không gian Giáo viên</h3>
                <p className="text-gray-600">Giao bài tập, chấm điểm tự động và theo dõi phân tích học lực chi tiết.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 border border-orange-100 flex flex-col justify-between relative group hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6">
                <Sparkles className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Trợ lý AI</h3>
                <p className="text-gray-600">Tạo đề thi tự động, flashcards và giải đáp thắc mắc 24/7.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100 flex flex-col justify-between relative group hover:shadow-lg transition-all">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6">
                  <CheckCircle className="text-purple-600" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Focus Mode Học sinh</h3>
                <p className="text-gray-600 max-w-sm">Trải nghiệm làm bài không phân tâm, gamification giúp tạo động lực học tập mỗi ngày.</p>
              </div>
              {/* Illustration mockup */}
              <div className="absolute bottom-0 right-10 w-48 h-40 bg-white rounded-t-2xl shadow-xl border border-gray-200/50 transform translate-y-8 group-hover:translate-y-4 transition-transform p-4 flex flex-col gap-3">
                <div className="w-full h-4 bg-gray-100 rounded-full"></div>
                <div className="w-3/4 h-4 bg-gray-100 rounded-full"></div>
                <div className="w-full flex-1 bg-emerald-50 rounded-xl mt-2 border border-emerald-100"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 CTA Section */}
      <section className="py-24 px-6 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-6">Sẵn sàng để thay đổi?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Tham gia cùng hàng ngàn giáo viên và học sinh đang sử dụng Cognito để nâng cao chất lượng giáo dục.</p>
          <button 
            onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
            className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full text-xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
          >
            Bắt đầu miễn phí ngay hôm nay
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-gray-100 text-center text-gray-500">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <GraduationCap size={20} className="text-gray-400" />
          <span className="font-bold text-gray-900 font-display">Cognito</span>
          <span>© 2026. Nền tảng Giáo dục Mở.</span>
        </div>
      </footer>

      {/* 🔐 Auth Modal - Premium Design */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8 md:p-10">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm ring-1 ring-emerald-500/20">
                  <GraduationCap size={24} />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 font-display tracking-tight mb-2">
                  {authMode === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  {authMode === 'login' ? 'Nhập thông tin để tiếp tục với Cognito' : 'Bắt đầu hành trình học tập cùng Cognito'}
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-3">
                    <Shield size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Họ và tên</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                          <User size={18} />
                        </div>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <span className="font-bold">@</span>
                      </div>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex justify-between">
                      <span>Mật khẩu</span>
                      {authMode === 'login' && <a href="#" className="text-emerald-600 hover:underline">Quên mật khẩu?</a>}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors shadow-md mt-6 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500 font-medium">
                    {authMode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <button 
                      onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                      className="ml-1 text-emerald-600 font-bold hover:underline"
                    >
                      {authMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
