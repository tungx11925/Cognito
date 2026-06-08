import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Menu, X, ChevronDown, User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useStudy } from "../../context/StudyContext";

interface NavbarProps {
  isLoggedIn: boolean;
  onSignInClick: () => void;
  onDashboardClick: () => void;
  onLogout: () => void;
  activeUser: any;
}

export function Navbar({ isLoggedIn, onSignInClick, onDashboardClick, onLogout, activeUser }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { setIsProfileModalOpen, setProfileModalTab } = useStudy();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const avatarInitial = activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : '?';

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
                
                <div className="relative">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-7 h-7 rounded-full overflow-hidden bg-emerald-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none shadow-sm" 
                    style={{ border: "2px solid rgba(26,61,40,0.2)" }}
                    title={activeUser?.name || ''}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    {avatarInitial}
                  </motion.div>

                  <AnimatePresence>
                    {showDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowDropdown(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 overflow-hidden"
                          style={{ transformOrigin: "top right" }}
                        >
                          <div className="px-4 py-2 border-b border-gray-100 text-left">
                            <p className="text-xs font-semibold text-gray-900 truncate">{activeUser?.name || 'User'}</p>
                            <p className="text-[10px] text-gray-500 truncate">{activeUser?.email || 'user@example.com'}</p>
                          </div>
                          
                          <div 
                            onClick={() => {
                              setIsProfileModalOpen(true);
                              setProfileModalTab('profile');
                              setShowDropdown(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer transition-colors text-left"
                          >
                            <User size={13} />
                            <span>Trang cá nhân</span>
                          </div>
                          
                          <div 
                            onClick={() => {
                              setIsProfileModalOpen(true);
                              setProfileModalTab('settings');
                              setShowDropdown(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer transition-colors text-left"
                          >
                            <Settings size={13} />
                            <span>Cài đặt</span>
                          </div>
                          
                          <div className="border-t border-gray-100 my-1" />
                          
                          <div 
                            onClick={() => {
                              setShowDropdown(false);
                              onLogout();
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors text-left"
                          >
                            <LogOut size={13} />
                            <span>Đăng xuất</span>
                          </div>
                        </motion.div>
                      </>
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
