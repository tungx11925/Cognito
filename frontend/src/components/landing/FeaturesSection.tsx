import { motion } from "framer-motion";
import { Brain, Zap, Users, BookOpen } from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="py-24" style={{ background: "#f5f3ee" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <h2
            style={{
              color: "#0d1a14",
              fontWeight: 700,
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              letterSpacing: "-0.02em",
            }}
          >
            Engineered for Deep Work
          </h2>
          <p className="mt-3 max-w-lg mx-auto" style={{ color: "#4a5a52", lineHeight: 1.7, fontSize: "0.95rem" }}>
            Removing friction from the learning process through architectural precision and academic rigor.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Precision AI Analysis — left tall */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="md:row-span-2 rounded-2xl p-7 flex flex-col"
            style={{ background: "#fff", border: "1px solid rgba(26,61,40,0.1)", boxShadow: "0 4px 20px rgba(13,26,20,0.06)" }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "rgba(26,61,40,0.08)" }}>
              <Brain size={22} style={{ color: "#1a3d28" }} />
            </div>
            <h3 className="mb-3" style={{ color: "#0d1a14", fontWeight: 600, fontSize: "1.1rem" }}>
              Precision AI Analysis
            </h3>
            <p style={{ color: "#4a5a52", lineHeight: 1.7, fontSize: "0.88rem" }}>
              Extract concepts and semantic maps from your documents. Our models identify knowledge gaps with surgical precision, automating the heavy lifting of comprehension.
            </p>

            <div className="mt-auto pt-8 space-y-4">
              {[
                { label: "Comprehension", val: 92 },
                { label: "Retention", val: 87 },
                { label: "Speed", val: 76 },
              ].map((item, i) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1.5">
                    <span style={{ color: "#4a5a52", fontSize: "0.78rem" }}>{item.label}</span>
                    <span style={{ color: "#1a3d28", fontSize: "0.78rem", fontWeight: 600 }}>{item.val}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(26,61,40,0.08)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "#1a3d28" }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.val}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, delay: 0.3 + i * 0.18, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Smart Flashcards — dark */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="rounded-2xl p-6"
            style={{ background: "#1a3d28", boxShadow: "0 4px 20px rgba(13,26,20,0.15)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,243,238,0.12)" }}>
                <BookOpen size={19} style={{ color: "#f5f3ee" }} />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(245,243,238,0.1)", color: "rgba(245,243,238,0.7)" }}>
                200+ daily
              </span>
            </div>
            <h3 className="mb-2" style={{ color: "#f5f3ee", fontWeight: 600, fontSize: "1rem" }}>Smart Flashcards</h3>
            <p style={{ color: "rgba(245,243,238,0.6)", fontSize: "0.85rem", lineHeight: 1.65 }}>
              Auto-generate 200+ workflows directly from your seminar notes.
            </p>
          </motion.div>

          {/* Collective Intelligence — dark */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="rounded-2xl p-6"
            style={{ background: "#1a3d28", boxShadow: "0 4px 20px rgba(13,26,20,0.15)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(245,243,238,0.12)" }}>
              <Users size={19} style={{ color: "#f5f3ee" }} />
            </div>
            <h3 className="mb-2" style={{ color: "#f5f3ee", fontWeight: 600, fontSize: "1rem" }}>Collective Intelligence</h3>
            <p style={{ color: "rgba(245,243,238,0.6)", fontSize: "0.85rem", lineHeight: 1.65 }}>
              Join global researchers mastering complex domains in record time.
            </p>
          </motion.div>

          {/* Focus Flow — wide light */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="md:col-span-2 rounded-2xl p-6 flex items-center gap-8"
            style={{ background: "#fff", border: "1px solid rgba(26,61,40,0.1)", boxShadow: "0 4px 20px rgba(13,26,20,0.06)" }}
          >
            <div className="flex-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(26,61,40,0.08)" }}>
                <Zap size={19} style={{ color: "#1a3d28" }} />
              </div>
              <h3 className="mb-2" style={{ color: "#0d1a14", fontWeight: 600, fontSize: "1rem" }}>Focus Flow</h3>
              <p style={{ color: "#4a5a52", fontSize: "0.85rem", lineHeight: 1.65 }}>
                Precision-tuned Pomodoro sessions that adapt to your cognitive rhythm for maximum deep work output.
              </p>
            </div>

            {/* Timer visual */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" stroke="rgba(26,61,40,0.08)" />
                  <motion.circle
                    cx="50" cy="50" r="40" fill="none" strokeWidth="6"
                    stroke="#1a3d28" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    whileInView={{ strokeDashoffset: 2 * Math.PI * 40 * 0.28 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span style={{ color: "#0d1a14", fontWeight: 700, fontSize: "1.1rem" }}>25:00</span>
                  <span style={{ color: "#4a5a52", fontSize: "0.58rem" }}>remaining</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
