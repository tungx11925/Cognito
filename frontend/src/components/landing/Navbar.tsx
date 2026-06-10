import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Menu, X, ChevronDown, User, Settings, LogOut, Layout } from "lucide-react";
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
  const { logout } = useStudy();

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
                <a href="/dashboard" className="transition-colors duration-200 text-sm font-bold" style={{ color: "#1a3d28" }}>
                  Bảng điều khiển
                </a>
                <a href="/library" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Tài liệu
                </a>
                <a href="/chat" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Trợ lý AI
                </a>
                <a href="/flashcards" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Flashcards
                </a>
              </>
            ) : (
              <>
                <a href="#features" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Tính năng
                </a>
                <a href="#ai-chat" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Trợ lý AI
                </a>
                <a href="#flashcards" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Flashcards
                </a>
                <a href="#stats" className="transition-colors duration-200 text-sm font-semibold text-gray-600 hover:text-[#1a3d28]">
                  Thống kê
                </a>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={onDashboardClick}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "#1a3d28", color: "#f5f3ee", border: "none", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#143020"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1a3d28"; }}
                >
                  Bảng điều khiển
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
                      activeUser?.name?.charAt(0)?.toUpperCase() || 'U'
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
                              router.push('/dashboard');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <Layout size={14} className="text-gray-400" />
                            Bảng điều khiển
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
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-[#1a3d28] font-bold text-base">Bảng điều khiển</Link>
                  <Link href="/library" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Tài liệu</Link>
                  <Link href="/chat" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Trợ lý AI</Link>
                  <Link href="/flashcards" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Flashcards</Link>
                </>
              ) : (
                <>
                  <Link href="#features" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Tính năng</Link>
                  <Link href="#ai-chat" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Trợ lý AI</Link>
                  <Link href="#flashcards" onClick={() => setMobileOpen(false)} className="text-gray-600 font-semibold text-base">Flashcards</Link>
                </>
              )}
              {isLoggedIn ? (
                <button 
                  onClick={() => { setMobileOpen(false); onDashboardClick(); }}
                  className="w-full py-2.5 rounded-lg mt-1" 
                  style={{ background: "#1a3d28", color: "#f5f3ee", fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  Vào bảng điều khiển
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
