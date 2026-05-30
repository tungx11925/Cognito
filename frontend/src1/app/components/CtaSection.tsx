import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-20" style={{ background: "#f5f3ee" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden px-12 py-16 md:py-20 text-center"
          style={{ background: "#1a3d28" }}
        >
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, #f5f3ee 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />
          {/* Glow blobs */}
          <div className="absolute top-0 left-[20%] w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(245,243,238,0.06) 0%, transparent 70%)", transform: "translateY(-50%)" }} />
          <div className="absolute bottom-0 right-[15%] w-52 h-52 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(245,243,238,0.04) 0%, transparent 70%)", transform: "translateY(40%)" }} />

          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mb-4"
              style={{
                color: "#f5f3ee",
                fontWeight: 700,
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              Elevate your academic
              <br />
              performance today.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10 max-w-lg mx-auto"
              style={{ color: "rgba(245,243,238,0.6)", lineHeight: 1.7, fontSize: "0.95rem" }}
            >
              Join the global network of researchers and students using EduShare AI to master complex domains in record time.
            </motion.p>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                className="group flex items-center gap-2 px-7 py-3 rounded-xl transition-all duration-200"
                style={{ background: "#f5f3ee", color: "#0d1a14", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#e8e5de"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f5f3ee"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
              >
                Get Started for Free
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                className="px-7 py-3 rounded-xl transition-all duration-200"
                style={{ background: "transparent", border: "1px solid rgba(245,243,238,0.3)", color: "#f5f3ee", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,243,238,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,243,238,0.5)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,243,238,0.3)"; }}
              >
                Explore Features
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
