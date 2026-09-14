const footerLinks = {
  "Sản Phẩm": ["Tính năng", "Tích hợp AI", "Bảng giá"],
  "Tài Nguyên": ["Tài liệu hướng dẫn", "Flashcards mẫu", "Cộng đồng"],
  "Chính Sách": ["Về chúng tôi", "Bảo mật", "Điều khoản sử dụng"],
};

export function Footer() {
  return (
    <footer className="py-14 footer-grid-bg" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#f5f3ee" }}>
                <span style={{ color: "#113221", fontWeight: 800, fontSize: "0.8rem" }}>E</span>
              </div>
              <span style={{ color: "#f5f3ee", fontWeight: 700, fontSize: "0.95rem" }}>EduShare AI</span>
            </div>
            <p style={{ color: "#a3b6aa", fontSize: "0.8rem", lineHeight: 1.65 }}>
              Phát triển môi trường học tập hiệu suất cao cho thế hệ tri thức tương lai.
            </p>
            <div className="flex gap-2 mt-5">
              {["𝕏", "in", "gh"].map((icon) => (
                <button
                  key={icon}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a3b6aa", fontSize: "0.72rem", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#a3b6aa"; }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="mb-4" style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="transition-colors duration-200"
                      style={{ color: "#a3b6aa", fontSize: "0.83rem" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#a3b6aa"; }}
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
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "#8da294", fontSize: "0.76rem" }}>© 2026 EduShare AI. Đã đăng ký bản quyền.</p>
          <div className="flex gap-3">
            {["𝕏", "GitHub"].map((s) => (
              <a key={s} href="#" style={{ color: "#8da294", fontSize: "0.76rem" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#8da294"; }}
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
