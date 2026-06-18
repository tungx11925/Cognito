import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Menu, X, ChevronDown, User, Settings, LogOut, Layout, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudy } from "@/context/StudyContext";

interface NavbarProps {
  isLoggedIn: boolean;
  onSignInClick: () => void;
  onDashboardClick: () => void;
  activeUser: any;
}

export function Navbar({ isLoggedIn, onSignInClick, onDashboardClick, activeUser }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const { logout, taskCompletionToast, setTaskCompletionToast, setShowPremiumModal } = useStudy();
  const [toastProgress, setToastProgress] = useState(60);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (taskCompletionToast) {
      setToastProgress(50);
      setShowToast(true);
      
      const timer1 = setTimeout(() => {
        setToastProgress(100);
      }, 400);

      const timer2 = setTimeout(() => {
        setShowToast(false);
        setTimeout(() => {
          setTaskCompletionToast(null);
        }, 400);
      }, 5500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [taskCompletionToast, setTaskCompletionToast]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownOpen && !target.closest(".profile-dropdown-container")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        background: scrolled ? "rgba(245,243,238,0.97)" : "rgba(245,243,238,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(26,61,40,0.1)",
        boxShadow: scrolled ? "0 2px 20px rgba(26,61,40,0.08)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={isLoggedIn ? onDashboardClick : undefined}>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "#1a3d28" }}
            >
              <span style={{ color: "#f5f3ee", fontWeight: 800, fontSize: "0.8rem" }}>E</span>
            </div>
            <span style={{ color: "#0d1a14", fontWeight: 700, fontSize: "0.95rem" }}>
              EduShare AI
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {isLoggedIn ? (
              <>
                <Link href="/library" className="transition-colors duration-200 text-sm font-bold" style={{ color: "#1a3d28" }}>
                  Thư viện của tôi
                </Link>
                <Link href="/library" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Tài liệu
                </Link>
                <Link href="/flashcards" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Flashcards
                </Link>
                <Link href="/community" className="transition-colors duration-200 text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                  Cộng đồng
                </Link>
              </>
            ) : (
              <>
                <Link href="#features" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Tính năng
                </Link>
                <Link href="#flashcards" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Flashcards
                </Link>
                <Link href="/community" className="transition-colors duration-200 text-sm font-semibold text-emerald-600 hover:text-emerald-800">
                  Cộng đồng
                </Link>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#ffffff", border: "none", cursor: "pointer", boxShadow: "0 2px 10px rgba(245, 158, 11, 0.2)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.3)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 10px rgba(245, 158, 11, 0.2)"; }}
                >
                  <Sparkles size={14} />
                  Nâng cấp Premium
                </button>
                
                {/* Profile Dropdown Container */}
                <div className="relative profile-dropdown-container">
                  <div 
                    className="w-7 h-7 rounded-full overflow-hidden bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none transition-colors duration-150" 
                    style={{ border: "2px solid rgba(26,61,40,0.2)" }}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    {activeUser?.avatar_url ? (
                      <img 
                        src={activeUser.avatar_url} 
                        alt={activeUser.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      activeUser?.name?.charAt(0) || 'U'
                    )}
                  </div>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-100 shadow-xl py-1 z-[110] text-gray-700"
                        style={{ boxShadow: "0 10px 25px -5px rgba(26,61,40,0.15)" }}
                      >
                        {/* User Header */}
                        <div className="px-4 py-2.5 border-b border-gray-50 flex flex-col">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {activeUser?.name || 'Người dùng'}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate mt-0.5">
                            {activeUser?.email || ''}
                          </span>
                        </div>

                        {/* Menu Options */}
                        <div className="p-1">
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/library');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <Layout size={14} className="text-gray-400" />
                            Thư viện của tôi
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/profile');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <User size={14} className="text-gray-400" />
                            Hồ sơ cá nhân
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/settings');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <Settings size={14} className="text-gray-400" />
                            Cài đặt hệ thống
                          </button>
                        </div>

                        {/* Logout Divider */}
                        <div className="border-t border-gray-50 my-1"></div>

                        {/* Logout Option */}
                        <div className="p-1">
                          <button
                            onClick={async () => {
                              setDropdownOpen(false);
                              await logout();
                              router.push('/');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                          >
                            <LogOut size={14} />
                            Đăng xuất
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Task completed toast bubble underneath avatar */}
                  <AnimatePresence>
                    {showToast && taskCompletionToast && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="absolute right-0 mt-3 w-80 bg-white border-2 border-[#1a2e1c] rounded-2xl shadow-[4px_4px_0px_0px_rgba(26,46,28,1)] overflow-hidden z-[120] text-gray-800"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 animate-bounce">
                              <Trophy className="w-5 h-5 text-amber-500 fill-amber-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[10px] font-black text-amber-600 tracking-wide uppercase flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                Nhiệm vụ hoàn thành!
                              </h4>
                              <p className="text-xs font-bold text-gray-800 truncate mt-0.5">
                                {taskCompletionToast.title}
                              </p>
                            </div>
                            <button 
                              onClick={() => setShowToast(false)}
                              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3.5 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-700">
                              <span>Tiến độ</span>
                              <span className={`transition-all duration-300 ${toastProgress === 100 ? "text-emerald-600 scale-105 font-black" : ""}`}>
                                {toastProgress === 100 ? "100% Hoàn thành! 🎉" : `${toastProgress}%`}
                              </span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full border border-gray-200 overflow-hidden relative">
                              <div 
                                className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400"
                                style={{ width: `${toastProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "#1a3d28", color: "#f5f3ee", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#143020"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1a3d28"; }}
              >
                Sign In
              </button>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0d1a14" }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: "#f5f3ee", borderTop: "1px solid rgba(26,61,40,0.1)" }}
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
              {isLoggedIn ? (
                <>
                  <Link href="/library" onClick={() => setMobileOpen(false)} className="text-[#1a3d28] font-bold text-base">Thư viện của tôi</Link>
                  <Link href="/library" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Tài liệu</Link>
                  <Link href="/flashcards" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Flashcards</Link>
                  <Link href="/community" onClick={() => setMobileOpen(false)} className="text-emerald-600 font-bold text-base">Cộng đồng</Link>
                </>
              ) : (
                <>
                  <Link href="#features" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Tính năng</Link>
                  <Link href="#flashcards" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Flashcards</Link>
                  <Link href="/community" onClick={() => setMobileOpen(false)} className="text-emerald-600 font-bold text-base">Cộng đồng</Link>
                </>
              )}
              {isLoggedIn ? (
                <button 
                  onClick={() => { setMobileOpen(false); setShowPremiumModal(true); }}
                  className="w-full py-2.5 rounded-lg mt-1 flex items-center justify-center gap-2" 
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#ffffff", fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  <Sparkles size={16} />
                  Nâng cấp Premium
                </button>
              ) : (
                <button 
                  onClick={() => { setMobileOpen(false); onSignInClick(); }}
                  className="w-full py-2.5 rounded-lg mt-1" 
                  style={{ background: "#1a3d28", color: "#f5f3ee", fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
