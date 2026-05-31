import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Menu, X } from "lucide-react";

interface NavbarProps {
  isLoggedIn: boolean;
  onSignInClick: () => void;
  onDashboardClick: () => void;
  activeUser: any;
}

export function Navbar({ isLoggedIn, onSignInClick, onDashboardClick, activeUser }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
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
            {isLoggedIn && (
              <span
                onClick={onDashboardClick}
                className="transition-colors duration-200 text-xs font-bold cursor-pointer"
                style={{ color: "#1a3d28" }}
              >
                Dashboard
              </span>
            )}
            <a
              href="#features"
              className="transition-colors duration-200 text-xs font-semibold"
              style={{ color: "#4a5a52" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#1a3d28"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#4a5a52"; }}
            >
              Features
            </a>
            <a
              href="#stats"
              className="transition-colors duration-200 text-xs font-semibold"
              style={{ color: "#4a5a52" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#1a3d28"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#4a5a52"; }}
            >
              Stats
            </a>
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
                  Go to Dashboard
                </button>
                <div 
                  className="w-7 h-7 rounded-full overflow-hidden bg-emerald-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none" 
                  style={{ border: "2px solid rgba(26,61,40,0.2)" }}
                  title={activeUser.name}
                  onClick={onDashboardClick}
                >
                  {activeUser.name.charAt(0)}
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
              <a href="#features" onClick={() => setMobileOpen(false)} style={{ color: "#4a5a52", fontSize: "0.95rem" }}>Features</a>
              <a href="#stats" onClick={() => setMobileOpen(false)} style={{ color: "#4a5a52", fontSize: "0.95rem" }}>Stats</a>
              {isLoggedIn ? (
                <button 
                  onClick={() => { setMobileOpen(false); onDashboardClick(); }}
                  className="w-full py-2.5 rounded-lg mt-1" 
                  style={{ background: "#1a3d28", color: "#f5f3ee", fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  Go to Dashboard
                </button>
              ) : (
                <button 
                  onClick={() => { setMobileOpen(false); onSignInClick(); }}
                  className="w-full py-2.5 rounded-lg mt-1" 
                  style={{ background: "#1a3d28", color: "#f5f3ee", fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
