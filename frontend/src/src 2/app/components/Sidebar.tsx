import { motion } from "motion/react";
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Timer,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: BookOpen, label: "My Library", id: "library" },
  { icon: FlaskConical, label: "AI Lab", id: "ailab" },
  { icon: Timer, label: "Study Sessions", id: "sessions" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside
      className="w-56 h-full flex flex-col flex-shrink-0"
      style={{
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 pb-6">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#1a3a2a" }}
          >
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827", letterSpacing: "0.02em" }}>
              Scholar AI
            </div>
            <div style={{ fontSize: "10px", color: "#9ca3af", letterSpacing: "0.06em" }}>
              Scholar Edition
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 relative"
              style={{
                background: isActive ? "#e8f0eb" : "transparent",
                color: isActive ? "#1a3a2a" : "#6b7280",
              }}
            >
              <Icon size={16} />
              <span style={{ fontSize: "13.5px", fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Pro upgrade */}
      <div
        className="mx-3 mb-4 rounded-xl p-4"
        style={{ background: "#1a3a2a" }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap size={12} style={{ color: "#86efac" }} />
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#86efac", letterSpacing: "0.08em" }}>
            PRO PLAN
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "#6ee7b7", lineHeight: 1.5, marginBottom: "10px" }}>
          Unlock advanced SRS algorithms and unlimited decks.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-1.5 rounded-lg"
          style={{
            fontSize: "12px",
            fontWeight: 600,
            background: "#ffffff",
            color: "#1a3a2a",
          }}
        >
          Upgrade to Pro
        </motion.button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150"
          style={{ color: "#9ca3af", fontSize: "13.5px" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
        >
          <LogOut size={15} />
          <span style={{ fontWeight: 500 }}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
