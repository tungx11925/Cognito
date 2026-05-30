import { motion } from "motion/react";
import { User, Bell, Brain, Shield, Palette } from "lucide-react";
import { useState } from "react";

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative w-10 h-5 rounded-full transition-colors duration-200"
      style={{ background: value ? "#1a3a2a" : "#e5e7eb" }}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
      />
    </button>
  );
}

export function SettingsView() {
  const [notifs, setNotifs] = useState({ daily: true, streak: true, newCards: false });
  const [algo, setAlgo] = useState({ ai: true, adaptive: true });

  const sections = [
    {
      icon: User,
      title: "Account",
      items: [
        { label: "Full Name", type: "text", value: "Alex Johnson" },
        { label: "Email", type: "email", value: "alex@example.com" },
      ],
    },
    {
      icon: Bell,
      title: "Notifications",
      toggles: [
        { key: "daily", label: "Daily review reminders", sub: "Get reminded when cards are due" },
        { key: "streak", label: "Streak alerts", sub: "Notify before losing your streak" },
        { key: "newCards", label: "New card suggestions", sub: "AI-suggested cards based on your progress" },
      ],
    },
    {
      icon: Brain,
      title: "SRS Algorithm",
      toggles: [
        { key: "ai", label: "AI-enhanced scheduling", sub: "Use ML to optimize review intervals" },
        { key: "adaptive", label: "Adaptive difficulty", sub: "Adjust card difficulty based on performance" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div>
        <h1 style={{ color: "#111827", marginBottom: "4px" }}>Settings</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af" }}>Manage your account and preferences</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-xl p-5 flex items-center gap-4" style={{ border: "1px solid #e5e7eb" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ background: "#1a3a2a", fontSize: "20px", fontWeight: 700 }}>
          A
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>Alex Johnson</div>
          <div style={{ fontSize: "12.5px", color: "#9ca3af" }}>Free Plan · Joined Jan 2025</div>
        </div>
        <button className="ml-auto px-4 py-2 rounded-lg" style={{ fontSize: "13px", fontWeight: 600, background: "#1a3a2a", color: "#fff" }}>
          Edit Profile
        </button>
      </div>

      {/* Sections */}
      {sections.map(({ icon: Icon, title, items, toggles }) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl overflow-hidden"
          style={{ border: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <Icon size={15} style={{ color: "#1a3a2a" }} />
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>{title}</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            {items?.map(({ label, type, value }) => (
              <div key={label}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>{label}</label>
                <input
                  type={type}
                  defaultValue={value}
                  className="w-full px-3 py-2 rounded-lg outline-none"
                  style={{ border: "1px solid #e5e7eb", fontSize: "13px", color: "#374151", background: "#fafafa" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#1a3a2a")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>
            ))}
            {toggles?.map(({ key, label, sub }) => {
              const group = title === "Notifications" ? notifs : algo;
              const setGroup = title === "Notifications"
                ? (k: string) => setNotifs(p => ({ ...p, [k]: !p[k as keyof typeof p] }))
                : (k: string) => setAlgo(p => ({ ...p, [k]: !p[k as keyof typeof p] }));
              return (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>{label}</p>
                    <p style={{ fontSize: "11.5px", color: "#9ca3af", marginTop: "1px" }}>{sub}</p>
                  </div>
                  <Toggle value={group[key as keyof typeof group]} onChange={() => setGroup(key)} />
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Appearance */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <Palette size={15} style={{ color: "#1a3a2a" }} />
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>Appearance</span>
        </div>
        <div className="px-5 py-4">
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>Theme</p>
          <div className="flex gap-3">
            {["Light", "Dark", "System"].map(t => (
              <button
                key={t}
                className="flex-1 py-2 rounded-lg transition-all duration-150"
                style={{
                  fontSize: "13px",
                  fontWeight: t === "Light" ? 600 : 500,
                  background: t === "Light" ? "#1a3a2a" : "#f3f4f6",
                  color: t === "Light" ? "#fff" : "#6b7280",
                  border: "1px solid transparent",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #fecaca" }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #fef2f2" }}>
          <Shield size={15} style={{ color: "#dc2626" }} />
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#dc2626" }}>Danger Zone</span>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Delete Account</p>
            <p style={{ fontSize: "11.5px", color: "#9ca3af" }}>Permanently delete your account and all data</p>
          </div>
          <button className="px-4 py-2 rounded-lg" style={{ fontSize: "13px", fontWeight: 600, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
