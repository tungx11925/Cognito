import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

const heroImageUrl =
  "https://images.unsplash.com/photo-1674027444485-cec3da58eef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMGJyYWluJTIwbmV1cmFsJTIwbmV0d29yayUyMGdsb3dpbmd8ZW58MXx8fHwxNzgwMTM2MzE5fDA&ixlib=rb-4.1.0&q=80&w=1080";

interface HeroSectionProps {
  onStartClick: () => void;
  onDemoClick: () => void;
}

export function HeroSection({ onStartClick, onDemoClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "#f5f3ee" }}>
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle, #1a3d28 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Soft gradient blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(26,61,40,0.06) 0%, transparent 70%)", transform: "translate(20%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(26,61,40,0.04) 0%, transparent 70%)", transform: "translate(-20%, 30%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7"
              style={{ background: "rgba(26,61,40,0.08)", border: "1px solid rgba(26,61,40,0.15)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1a3d28" }} />
              <span style={{ color: "#1a3d28", fontSize: "0.78rem", fontWeight: 600 }}>
                GPT-4o Analysis Engine — Live
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mb-5"
              style={{
                fontSize: "clamp(2.6rem, 5vw, 4rem)",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#0d1a14",
                letterSpacing: "-0.025em",
              }}
            >
              The Operating System for{" "}
              <em style={{ fontStyle: "italic", color: "#1a3d28" }}>
                Intellectual Mastery.
              </em>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 max-w-md"
              style={{ fontSize: "1rem", color: "#4a5a52", lineHeight: 1.75 }}
            >
              Bridge the gap between complex documents and active recall using
              precision-engineered tools designed for the modern scholar.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={onStartClick}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200"
                style={{ background: "#1a3d28", color: "#f5f3ee", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#143020";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#1a3d28";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                Start Learning Free
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={onDemoClick}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all duration-200"
                style={{ background: "transparent", border: "1px solid rgba(26,61,40,0.25)", color: "#1a3d28", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(26,61,40,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(26,61,40,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(26,61,40,0.25)";
                }}
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(26,61,40,0.1)" }}>
                  <Play size={10} fill="#1a3d28" style={{ color: "#1a3d28" }} />
                </span>
                View Demo
              </button>
            </motion.div>
          </div>

          {/* Right — image */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="relative"
          >
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 20px 60px rgba(13,26,20,0.18)", border: "1px solid rgba(26,61,40,0.12)" }}
            >
              <img
                src={heroImageUrl}
                alt="AI Neural Network"
                className="w-full h-auto block"
                style={{ aspectRatio: "4/3", objectFit: "cover" }}
              />
              {/* Subtle green tint overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(26,61,40,0.15) 0%, transparent 60%)" }} />
            </div>

            {/* Floating card — bottom left */}
            <motion.div
              className="absolute -bottom-5 -left-5 px-4 py-3 rounded-xl flex items-center gap-3"
              style={{ background: "#fff", border: "1px solid rgba(26,61,40,0.1)", boxShadow: "0 8px 24px rgba(13,26,20,0.1)" }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,61,40,0.08)" }}>
                <span style={{ fontSize: "1rem" }}>⚡</span>
              </div>
              <div>
                <div style={{ color: "#0d1a14", fontWeight: 600, fontSize: "0.82rem" }}>Focus Flow</div>
                <div style={{ color: "#4a5a52", fontSize: "0.7rem" }}>Pomodoro Active</div>
              </div>
            </motion.div>

            {/* Floating card — top right */}
            <motion.div
              className="absolute -top-5 -right-5 px-4 py-2.5 rounded-xl"
              style={{ background: "#1a3d28", boxShadow: "0 8px 24px rgba(13,26,20,0.2)" }}
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div style={{ color: "rgba(245,243,238,0.55)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recall Success</div>
              <div style={{ color: "#f5f3ee", fontWeight: 800, fontSize: "1.4rem" }}>98%</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
