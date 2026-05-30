import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Documents", href: "#" },
  { label: "Flashcards", href: "#" },
  { label: "Demo", href: "#" },
];

export function Navbar() {
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
          <div className="flex items-center gap-2">
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
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors duration-200"
                style={{ color: "#4a5a52", fontSize: "0.875rem" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#1a3d28"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#4a5a52"; }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{ color: "#4a5a52", background: "rgba(26,61,40,0.06)", border: "1px solid rgba(26,61,40,0.1)", cursor: "pointer" }}
            >
              <Search size={13} />
              <span>Search resources...</span>
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "rgba(26,61,40,0.06)", border: "1px solid rgba(26,61,40,0.1)", cursor: "pointer" }}
            >
              <Bell size={14} style={{ color: "#4a5a52" }} />
            </button>
            <button
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "#1a3d28", color: "#f5f3ee", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#143020"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1a3d28"; }}
            >
              Create New
            </button>
            <div className="w-7 h-7 rounded-full overflow-hidden" style={{ border: "2px solid rgba(26,61,40,0.2)" }}>
              <img src="https://i.pravatar.cc/32?img=12" alt="Avatar" className="w-full h-full object-cover" />
            </div>
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
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} style={{ color: "#4a5a52", fontSize: "0.95rem" }}>{link.label}</a>
              ))}
              <button className="w-full py-2.5 rounded-lg mt-1" style={{ background: "#1a3d28", color: "#f5f3ee", fontWeight: 600, border: "none", cursor: "pointer" }}>
                Create New
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
