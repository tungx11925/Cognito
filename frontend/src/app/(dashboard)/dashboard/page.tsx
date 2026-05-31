"use client";
import { motion } from "framer-motion";
import { TrendingUp, Target, Flame, Clock, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";

const stats = [
  { label: "Total Cards", value: "1,248", change: "+24 this week", icon: BookOpen, color: "#1a3a2a" },
  { label: "Mastered", value: "847", change: "67% of total", icon: CheckCircle2, color: "#16a34a" },
  { label: "Streak", value: "12 days", change: "Personal best: 21", icon: Flame, color: "#ea580c" },
  { label: "Study Time", value: "4h 32m", change: "This week", icon: Clock, color: "#2563eb" },
];

const upcomingReviews = [
  { deck: "Advanced Algorithms", due: 42, time: "Now" },
  { deck: "System Design", due: 12, time: "Now" },
  { deck: "Network Security", due: 0, time: "Tomorrow" },
  { deck: "Data Science", due: 0, time: "In 3 days" },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 style={{ color: "#111827", marginBottom: "4px", fontSize: "22px", fontWeight: 700 }}>Dashboard</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af" }}>Welcome back! Here's your learning overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, change, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-xl p-4"
            style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>{change}</div>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Reviews */}
      <div className="bg-white rounded-xl" style={{ border: "1px solid #e5e7eb" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <div className="flex items-center gap-2">
            <Target size={15} style={{ color: "#1a3a2a" }} />
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>Upcoming Reviews</span>
          </div>
          <button style={{ fontSize: "12px", color: "#1a3a2a", fontWeight: 600 }}>View All →</button>
        </div>
        <div>
          {upcomingReviews.map((row, i) => (
            <div
              key={row.deck}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < upcomingReviews.length - 1 ? "1px solid #f9fafb" : "none" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: row.due > 0 ? "#dc2626" : "#d1d5db" }} />
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>{row.deck}</span>
              </div>
              <div className="flex items-center gap-4">
                {row.due > 0 && (
                  <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 700, background: "#fef2f2", color: "#dc2626" }}>
                    {row.due} due
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>{row.time}</span>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                  style={{ fontSize: "12px", fontWeight: 600, background: row.due > 0 ? "#1a3a2a" : "#f3f4f6", color: row.due > 0 ? "#fff" : "#9ca3af" }}>
                  {row.due > 0 ? "Review" : "Browse"} <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deck Progress */}
      <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} style={{ color: "#1a3a2a" }} />
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>Deck Progress</span>
        </div>
        <div className="space-y-4">
          {[
            { name: "Advanced Algorithms", val: 68 },
            { name: "Network Security", val: 92 },
            { name: "System Design", val: 24 },
            { name: "Data Science Fundamentals", val: 100 },
          ].map(({ name, val }, i) => (
            <div key={name}>
              <div className="flex justify-between mb-1.5">
                <span style={{ fontSize: "12.5px", color: "#374151", fontWeight: 500 }}>{name}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a3a2a" }}>{val}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "#f3f4f6" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "#1a3a2a" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
