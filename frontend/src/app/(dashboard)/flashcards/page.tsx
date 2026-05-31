"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Calendar, Flame, Plus, Clock, Target, Upload, ArrowRight } from "lucide-react";
import { DeckCard } from "../../../components/dashboard/DeckCard";
import { StreakChart } from "../../../components/dashboard/StreakChart";

const decks = [
  { id: 1, title: "Advanced Algorithms", description: "Complexity analysis, Dynamic Programming, and Graph Theory essentials.", mastery: 68, dueCount: 42, status: "due" as const },
  { id: 2, title: "Network Security", description: "TCP/IP protocols, encryption standards, and common vulnerability patterns.", mastery: 92, status: "clean" as const },
  { id: 3, title: "System Design", description: "Scalability principles, microservices architecture, and load balancing.", mastery: 24, dueCount: 12, status: "due" as const },
  { id: 4, title: "Data Science Fundamentals", description: "Linear algebra, statistics, and basic machine learning models in Python.", mastery: 100, status: "archived" as const },
];

const recentActivity = [
  { deck: "Advanced Algorithms", action: "Completed Review (20 cards)", accuracy: "85%", time: "12m 4s", date: "2 hours ago" },
  { deck: "System Design", action: "Added 15 new cards", accuracy: "—", time: "3m 15s", date: "Yesterday" },
  { deck: "Network Security", action: "Mastered 5 tags", accuracy: "100%", time: "8m 42s", date: "Yesterday" },
];

const filterTabs = ["All Decks", "Due Soon", "Mastered"];

export default function FlashcardsPage() {
  const [activeFilter, setActiveFilter] = useState("All Decks");

  const filteredDecks = decks.filter(d => {
    if (activeFilter === "Due Soon") return d.status === "due";
    if (activeFilter === "Mastered") return d.mastery >= 90;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ background: "#f3f4f6" }}>

      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex gap-4">
        {/* SRS card */}
        <div className="flex-1 rounded-xl p-5 relative overflow-hidden" style={{ background: "#1a3a2a", minHeight: "140px" }}>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={13} style={{ color: "#86efac" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#86efac", letterSpacing: "0.07em" }}>SRS MASTERY BOARD</span>
            </div>
            <p style={{ color: "#f0fdf4", marginBottom: "6px" }}>
              You have{" "}<span style={{ fontWeight: 700, textDecoration: "underline", textDecorationColor: "#86efac" }}>142 cards</span>{" "}
              due for review today across 4 active decks. AI recommends focusing on{" "}
              <span style={{ color: "#86efac" }}>Advanced Algorithms</span>.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ fontSize: "12.5px", fontWeight: 600, background: "#ffffff", color: "#1a3a2a" }}>
                <Target size={13} /> Start All Reviews
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ fontSize: "12.5px", fontWeight: 600, background: "rgba(255,255,255,0.12)", color: "#d1fae5", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Calendar size={13} /> Review Schedule
              </motion.button>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-40 pointer-events-none"
            style={{ background: "linear-gradient(to left, rgba(134,239,172,0.06), transparent)" }} />
        </div>

        {/* Weekly streak card */}
        <div className="rounded-xl p-5 flex-shrink-0 bg-white" style={{ border: "1px solid #e5e7eb", minWidth: "220px" }}>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={13} style={{ color: "#ea580c" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#ea580c", letterSpacing: "0.07em" }}>WEEKLY STREAK</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "#9ca3af", marginBottom: "12px" }}>Maintaining consistency for 12 days</p>
          <StreakChart />
        </div>
      </motion.div>

      {/* Filter + Decks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {filterTabs.map(tab => (
              <button key={tab} onClick={() => setActiveFilter(tab)}
                className="relative px-3.5 py-1.5 rounded-lg transition-all duration-150"
                style={{
                  fontSize: "12.5px", fontWeight: activeFilter === tab ? 600 : 500,
                  color: activeFilter === tab ? "#1a3a2a" : "#6b7280",
                  background: activeFilter === tab ? "#ffffff" : "transparent",
                  border: activeFilter === tab ? "1px solid #e5e7eb" : "1px solid transparent",
                  boxShadow: activeFilter === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeFilter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} className="grid grid-cols-3 gap-4">
            {filteredDecks.map((deck, i) => <DeckCard key={deck.id} {...deck} index={i} />)}
            {/* Create New Deck */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: filteredDecks.length * 0.07, duration: 0.35 }}
              whileHover={{ y: -2 }}
              className="rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer group bg-white min-h-[200px]"
              style={{ border: "1.5px dashed #d1d5db" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{ background: "#f3f4f6", border: "1px solid #e5e7eb" }}>
                <Plus size={20} style={{ color: "#6b7280" }} />
              </div>
              <div className="text-center">
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "3px" }}>Create New Deck</div>
                <div style={{ fontSize: "11.5px", color: "#9ca3af", lineHeight: 1.5 }}>Upload a PDF or paste notes to auto-generate cards</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Upload size={11} style={{ color: "#6b7280" }} />
                <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Import Content</span>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }}
        className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "#1a3a2a" }} />
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>Recent Activity</span>
          </div>
          <button style={{ fontSize: "12px", fontWeight: 600, color: "#1a3a2a" }}>View Full History</button>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
              {["DECK NAME", "ACTION", "ACCURACY", "TIME", "DATE"].map(col => (
                <th key={col} className="px-5 py-3 text-left"
                  style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td className="px-5 py-3.5" style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{row.deck}</td>
                <td className="px-5 py-3.5" style={{ fontSize: "12.5px", color: "#6b7280" }}>{row.action}</td>
                <td className="px-5 py-3.5">
                  <span style={{ fontSize: "12px", fontWeight: 700,
                    color: row.accuracy === "—" ? "#d1d5db" : row.accuracy === "100%" ? "#16a34a" : "#374151" }}>
                    {row.accuracy}
                  </span>
                </td>
                <td className="px-5 py-3.5" style={{ fontSize: "12px", color: "#9ca3af" }}>{row.time}</td>
                <td className="px-5 py-3.5" style={{ fontSize: "11.5px", color: "#9ca3af" }}>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <div className="h-2" />
    </div>
  );
}
