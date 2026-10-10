/**
 * Global Site Configuration & Branding
 * Single source of truth for site name, metadata, navigation, and social links.
 */

export const siteConfig = {
  name: "Cognito",
  tagline: "Nền tảng học tập thông minh & chia sẻ tri thức",
  description: "Học tập cá nhân hóa, tóm tắt tài liệu, sinh thẻ ghi nhớ AI, phòng học tập trung Pomodoro và cộng đồng chia sẻ tri thức.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // Navigation Links for Header & Footer
  navLinks: [
    { label: "Trang chủ", href: "/" },
    { label: "Thư viện", href: "/library" },
    { label: "Cộng đồng", href: "/community" },
    { label: "Tìm kiếm", href: "/search" },
    { label: "Bảng xếp hạng", href: "/leaderboard" },
    { label: "Gói Premium", href: "/premium" },
  ],

  // Footer Categorized Links
  footerColumns: [
    {
      title: "SẢN PHẨM",
      links: [
        { label: "Thư viện tài liệu", href: "/library" },
        { label: "Trợ lý AI & Mindmap", href: "/library" },
        { label: "Thẻ ghi nhớ (Flashcard)", href: "/flashcards" },
        { label: "Học tập trung (Focus)", href: "/focus" },
        { label: "Trắc nghiệm & Ôn luyện", href: "/quiz" },
      ],
    },
    {
      title: "TÀI NGUYÊN",
      links: [
        { label: "Cộng đồng học tập", href: "/community" },
        { label: "Thư viện mở OER", href: "/community?type=document" },
        { label: "Tìm kiếm tài liệu", href: "/search" },
        { label: "Bảng vinh danh", href: "/leaderboard" },
      ],
    },
    {
      title: "TÀI KHOẢN & HỖ TRỢ",
      links: [
        { label: "Hồ sơ cá nhân", href: "/profile" },
        { label: "Cài đặt tài khoản", href: "/settings" },
        { label: "Tin nhắn & Bạn bè", href: "/messages" },
        { label: "Nâng cấp Premium", href: "/premium" },
      ],
    },
  ],

  // Verified Official Social Channels
  socialLinks: [
    { name: "GitHub", href: "https://github.com", icon: "github" },
    { name: "Facebook", href: "https://facebook.com", icon: "facebook" },
    { name: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
    { name: "YouTube", href: "https://youtube.com", icon: "youtube" },
  ],
};
