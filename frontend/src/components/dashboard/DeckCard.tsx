"use client";
import { motion } from "framer-motion";
import { MoreHorizontal, BookOpen, Archive, CheckCircle2 } from "lucide-react";

interface DeckCardProps {
  title: string;
  description: string;
  mastery: number;
  dueCount?: number;
  status: "due" | "clean" | "archived";
  index: number;
}

const statusConfig = {
  due: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "DUE" },
  clean: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "CLEAN" },
  archived: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb", label: "ARCHIVED" },
};

export function DeckCard({ title, description, mastery, dueCount, status, index }: DeckCardProps) {
  const sc = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
      className="rounded-xl p-4 flex flex-col gap-3 cursor-pointer group bg-white"
      style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "#f3f4f6", border: "1px solid #e5e7eb" }}>
          <BookOpen size={14} style={{ color: "#6b7280" }} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full"
            style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
              background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
            {dueCount ? `${dueCount} ${sc.label}` : sc.label}
          </span>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#9ca3af" }}>
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h3 style={{ color: "#111827", marginBottom: "3px", fontSize: "14px", fontWeight: 600 }}>{title}</h3>
        <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.5 }}>{description}</p>
      </div>

      {/* Mastery */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>Mastery</span>
          <span style={{ fontSize: "12px", color: "#374151", fontWeight: 700 }}>{mastery}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${mastery}%` }}
            transition={{ delay: index * 0.07 + 0.3, duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "#1a3a2a" }}
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-150"
          style={{ fontSize: "12.5px", fontWeight: 600,
            background: status === "archived" ? "#f3f4f6" : "#1a3a2a",
            color: status === "archived" ? "#6b7280" : "#ffffff" }}
        >
          {status === "archived" ? <><Archive size={12} /> View Archive</>
            : status === "clean" ? <><CheckCircle2 size={12} /> Browse Cards</>
            : "Review Now"}
        </motion.button>
        <button style={{ color: "#d1d5db" }}><MoreHorizontal size={16} /></button>
      </div>
    </motion.div>
  );
}
