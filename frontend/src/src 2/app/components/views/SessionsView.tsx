import { motion } from "motion/react";
import { Play, Clock, CheckCircle2, BarChart2, Calendar } from "lucide-react";

const sessions = [
  { deck: "Advanced Algorithms", date: "Today, 9:14 AM", duration: "12m 4s", cards: 20, accuracy: 85, score: "Good" },
  { deck: "System Design", date: "Today, 8:50 AM", duration: "3m 15s", cards: 5, accuracy: 60, score: "Fair" },
  { deck: "Network Security", date: "Yesterday, 7:22 PM", duration: "8m 42s", cards: 18, accuracy: 100, score: "Perfect" },
  { deck: "Advanced Algorithms", date: "Yesterday, 6:05 PM", duration: "5m 20s", cards: 8, accuracy: 75, score: "Good" },
  { deck: "Data Science", date: "2 days ago", duration: "14m 30s", cards: 25, accuracy: 96, score: "Excellent" },
];

const scoreColor: Record<string, string> = {
  Perfect: "#16a34a",
  Excellent: "#1a3a2a",
  Good: "#2563eb",
  Fair: "#ea580c",
};

export function SessionsView() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#111827", marginBottom: "4px" }}>Study Sessions</h1>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>Track your review history and performance</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
          style={{ fontSize: "13px", fontWeight: 600, background: "#1a3a2a" }}
        >
          <Play size={13} /> Start Session
        </motion.button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sessions", value: "47", icon: Calendar, color: "#1a3a2a" },
          { label: "Avg Accuracy", value: "83%", icon: BarChart2, color: "#16a34a" },
          { label: "Total Time", value: "6h 14m", icon: Clock, color: "#2563eb" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-xl p-4"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}12` }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>{value}</div>
          </motion.div>
        ))}
      </div>

      {/* Sessions list */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>Recent Sessions</span>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
              {["DECK", "DATE", "DURATION", "CARDS", "ACCURACY", "SCORE"].map(col => (
                <th key={col} className="px-5 py-3 text-left" style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                style={{ borderBottom: "1px solid #f9fafb" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-5 py-3.5" style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{s.deck}</td>
                <td className="px-5 py-3.5" style={{ fontSize: "12px", color: "#9ca3af" }}>{s.date}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5" style={{ fontSize: "12.5px", color: "#6b7280" }}>
                    <Clock size={12} /> {s.duration}
                  </div>
                </td>
                <td className="px-5 py-3.5" style={{ fontSize: "12.5px", color: "#6b7280" }}>{s.cards} cards</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full w-16 overflow-hidden" style={{ background: "#f3f4f6" }}>
                      <div className="h-full rounded-full" style={{ width: `${s.accuracy}%`, background: "#1a3a2a" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{s.accuracy}%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} style={{ color: scoreColor[s.score] }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: scoreColor[s.score] }}>{s.score}</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
