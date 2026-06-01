import { motion } from "framer-motion";

const stats = [
  { value: "50+", label: "ĐỊNH DẠNG TÀI LIỆU" },
  { value: "10K+", label: "FLASHCARDS TẠO TỰ ĐỘNG" },
  { value: "98%", label: "TỶ LỆ GHI NHỚ" },
];

export function StatsSection() {
  return (
    <section id="stats" className="py-16" style={{ background: "#f5f3ee", borderTop: "1px solid rgba(26,61,40,0.07)", borderBottom: "1px solid rgba(26,61,40,0.07)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontWeight: 800,
                  color: "#0d1a14",
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                }}
              >
                {stat.value}
              </div>
              <div
                className="mt-2"
                style={{
                  color: "#4a5a52",
                  fontSize: "0.7rem",
                  letterSpacing: "0.12em",
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
