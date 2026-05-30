const footerLinks = {
  Product: ["System Policies", "Integrations", "Pricing Plans"],
  Library: ["Documentation", "Study Guides", "Community Hub"],
  Institutional: ["About the Lab", "Privacy Policy", "Terms of Service"],
};

export function Footer() {
  return (
    <footer className="py-14" style={{ background: "#f5f3ee", borderTop: "1px solid rgba(26,61,40,0.08)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#1a3d28" }}>
                <span style={{ color: "#f5f3ee", fontWeight: 800, fontSize: "0.8rem" }}>E</span>
              </div>
              <span style={{ color: "#0d1a14", fontWeight: 700, fontSize: "0.95rem" }}>EduShare AI</span>
            </div>
            <p style={{ color: "#6b7c72", fontSize: "0.8rem", lineHeight: 1.65 }}>
              Developing high-performance learning environments for the next generation of collective intelligence.
            </p>
            <div className="flex gap-2 mt-5">
              {["𝕏", "in", "gh"].map((icon) => (
                <button
                  key={icon}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "rgba(26,61,40,0.06)", border: "1px solid rgba(26,61,40,0.1)", color: "#4a5a52", fontSize: "0.72rem", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(26,61,40,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#1a3d28"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(26,61,40,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#4a5a52"; }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="mb-4" style={{ color: "#0d1a14", fontWeight: 600, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="transition-colors duration-200"
                      style={{ color: "#6b7c72", fontSize: "0.83rem" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#1a3d28"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#6b7c72"; }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-7 flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(26,61,40,0.07)" }}>
          <p style={{ color: "#9aab9e", fontSize: "0.76rem" }}>© 2026 EduShare AI Laboratory. All rights reserved.</p>
          <div className="flex gap-3">
            {["𝕏", "GitHub"].map((s) => (
              <a key={s} href="#" style={{ color: "#9aab9e", fontSize: "0.76rem" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#1a3d28"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#9aab9e"; }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
