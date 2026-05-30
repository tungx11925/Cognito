import { motion } from "motion/react";
import { Search, Bell, Plus, FileText, CreditCard, StickyNote, History } from "lucide-react";

export function TopBar() {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 sticky top-0 z-10"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {/* Search */}
      <div className="relative" style={{ width: "220px" }}>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
        <input
          placeholder="Search decks, tags, or history..."
          className="w-full pl-8 pr-3 py-1.5 rounded-lg outline-none"
          style={{
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            color: "#374151",
            fontSize: "12.5px",
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = "#1a3a2a";
            e.currentTarget.style.background = "#fff";
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.background = "#f3f4f6";
          }}
        />
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-0.5">
        {[
          { icon: FileText, label: "Documents" },
          { icon: CreditCard, label: "Flashcards", active: true },
          { icon: StickyNote, label: "Notes" },
        ].map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{
              fontSize: "12.5px",
              fontWeight: active ? 600 : 500,
              color: active ? "#1a3a2a" : "#6b7280",
              background: active ? "#e8f0eb" : "transparent",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          className="p-1.5 rounded-lg transition-colors duration-150"
          style={{ color: "#9ca3af" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#374151")}
          onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
        >
          <History size={16} />
        </button>
        <button
          className="relative p-1.5 rounded-lg transition-colors duration-150"
          style={{ color: "#9ca3af" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#374151")}
          onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
        >
          <Bell size={16} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: "#ef4444" }}
          />
        </button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white"
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            background: "#1a3a2a",
          }}
        >
          <Plus size={14} />
          Create Now
        </motion.button>

        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white cursor-pointer flex-shrink-0"
          style={{
            background: "#374151",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          A
        </div>
      </div>
    </div>
  );
}
