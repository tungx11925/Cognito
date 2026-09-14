import { motion } from "framer-motion";

const items = [
  { icon: "🧠", text: "Trợ lý AI Thông minh" },
  { icon: "📚", text: "Flashcards Tự động" },
  { icon: "⚡", text: "Đồng hồ Pomodoro" },
  { icon: "✍️", text: "Ghi chép Tương tác" },
  { icon: "📄", text: "Quản lý Tài liệu PDF/Word" },
  { icon: "🔁", text: "Spaced Repetition" },
  { icon: "🎓", text: "Tối ưu hóa Ghi nhớ" },
  { icon: "✨", text: "Tích hợp AI Tiên tiến" },
  { icon: "📝", text: "Tạo Câu hỏi Trắc nghiệm" },
];

function MarqueeTrack({ reverse = false }: { reverse?: boolean }) {
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden py-3">
      <motion.div
        className="flex gap-4 w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full flex-shrink-0 select-none"
            style={{
              background: i % 3 === 0 ? "#1a3d28" : i % 3 === 1 ? "#fff" : "#eae7e0",
              border: i % 3 === 1 ? "1px solid rgba(26,61,40,0.12)" : "none",
              boxShadow: "0 2px 8px rgba(13,26,20,0.06)",
            }}
          >
            <span style={{ fontSize: "0.95rem" }}>{item.icon}</span>
            <span
              style={{
                color: i % 3 === 0 ? "#f5f3ee" : "#0d1a14",
                fontWeight: 500,
                fontSize: "0.85rem",
                whiteSpace: "nowrap",
              }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function MarqueeSection() {
  return (
    <section
      className="py-6 overflow-hidden relative"
      style={{
        background: "#eae7e0",
        borderTop: "1px solid rgba(26,61,40,0.08)",
        borderBottom: "1px solid rgba(26,61,40,0.08)",
      }}
    >
      {/* Fade edges */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #eae7e0, transparent)" }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #eae7e0, transparent)" }}
      />

      <MarqueeTrack />
      <MarqueeTrack reverse />
    </section>
  );
}
