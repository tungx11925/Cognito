"use client";
import { motion } from "framer-motion";
import { Search, Plus, Filter, BookOpen, Tag } from "lucide-react";
import { useState } from "react";

const allCards = [
  { id: 1, deck: "Advanced Algorithms", front: "What is the time complexity of Dijkstra's algorithm?", back: "O((V + E) log V) with a min-heap", tags: ["graphs", "complexity"], mastered: false },
  { id: 2, deck: "Advanced Algorithms", front: "Explain dynamic programming vs memoization", back: "DP is bottom-up; memoization is top-down recursion with caching", tags: ["dp"], mastered: true },
  { id: 3, deck: "Network Security", front: "What is a man-in-the-middle attack?", back: "Attacker secretly intercepts and relays messages between two parties", tags: ["attacks"], mastered: true },
  { id: 4, deck: "System Design", front: "What is a CDN?", back: "Content Delivery Network — geographically distributed servers to serve content faster", tags: ["infrastructure"], mastered: false },
  { id: 5, deck: "System Design", front: "Explain CAP theorem", back: "A distributed system can guarantee only 2 of: Consistency, Availability, Partition tolerance", tags: ["distributed"], mastered: false },
  { id: 6, deck: "Network Security", front: "What is TLS handshake?", back: "Protocol for establishing an encrypted session between client and server", tags: ["protocols"], mastered: true },
];

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = allCards.filter(
    c => c.front.toLowerCase().includes(search.toLowerCase()) || c.deck.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#111827", marginBottom: "4px", fontSize: "22px", fontWeight: 700 }}>My Library</h1>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>Browse and manage all your flashcards</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
          style={{ fontSize: "13px", fontWeight: 600, background: "#1a3a2a" }}
        >
          <Plus size={14} /> Add Card
        </motion.button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cards or decks..."
            className="w-full pl-8 pr-3 py-2 rounded-lg outline-none"
            style={{ background: "#fff", border: "1px solid #e5e7eb", fontSize: "13px", color: "#374151" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#1a3a2a")}
            onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ fontSize: "12.5px", fontWeight: 500, color: "#6b7280", background: "#fff", border: "1px solid #e5e7eb" }}>
          <Filter size={13} /> Filter
        </button>
      </div>

      {/* Cards list */}
      <div className="space-y-2">
        {filtered.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(selected === card.id ? null : card.id)}
            className="bg-white rounded-xl cursor-pointer transition-shadow duration-150"
            style={{
              border: selected === card.id ? "1px solid #1a3a2a" : "1px solid #e5e7eb",
              boxShadow: selected === card.id ? "0 0 0 3px rgba(26,58,42,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#f3f4f6" }}>
                <BookOpen size={14} style={{ color: "#6b7280" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#1a3a2a", background: "#e8f0eb", padding: "1px 7px", borderRadius: "9999px" }}>
                    {card.deck}
                  </span>
                  {card.mastered && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "1px 7px", borderRadius: "9999px", border: "1px solid #bbf7d0" }}>
                      MASTERED
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "13.5px", color: "#111827", fontWeight: 500 }}>{card.front}</p>
                {selected === card.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3"
                    style={{ borderTop: "1px solid #f3f4f6" }}
                  >
                    <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>{card.back}</p>
                  </motion.div>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <Tag size={11} style={{ color: "#d1d5db" }} />
                  {card.tags.map(t => (
                    <span key={t} style={{ fontSize: "10.5px", color: "#9ca3af", background: "#f9fafb", border: "1px solid #e5e7eb", padding: "0px 6px", borderRadius: "9999px" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
