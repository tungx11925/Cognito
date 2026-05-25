---
trigger: always_on
description: UI/UX design principles - Elite EdTech / ArchPulse style, Shadcn UI patterns, typography, layout rules.
---

# 🎨 Nguyên tắc Thiết kế UI/UX & Design System

File này đóng vai trò như 'Luật' (Rules) cho dự án HocCungTo, được base trên bản thiết kế Stitch (Elite EdTech / ArchPulse). Bất kỳ Code UI nào được generate ra (React, Tailwind, .NET mapping) đều phải tuân thủ nghiêm ngặt chuẩn mực dưới đây:

## 1. Phong cách & Hướng thiết kế (Creative North Star)
- **Tổng quan**: "The Serene Navigator" - Clean, thoáng, chuyên nghiệp lồng ghép gam màu nóng. Lấy cảm hứng từ editorial/magazine design thay vì SaaS grid cứng nhắc.
- **Không sử dụng**: Neon colors lòe loẹt, thẻ/box viền đen dày cứng nhắc (pure black #000).
- **Ưu tiên**: Khoảng trắng có chủ đích (generous padding), thiết kế bất đối xứng nhẹ (60/40), bo góc lớn, và độ đục/bóng mờ tự nhiên.

## 2. Bảng Màu (Color Palette) - Dựa trên Stitch "Elite EdTech"

Hệ thống sử dụng các biến CSS mở rộng (đã cấu hình trong `globals.css`). Tuyệt đối không dùng hardcode hex (trừ trường hợp gradient).

**Màu Nền (Surfaces & Containers):**
- Nền chính (Canvas): `bg-surface` (`#faf8ff`)
- Content Card: `bg-surface-container-lowest` (`#ffffff`)
- Khối Sidebar / Secondary BG: `bg-surface-container-low` (`#f2f3ff`)
- Hover/Highlight Box: `bg-surface-container-highest` (`#dae2fd`)

**Màu Chữ (Typography):**
- Chữ chính (Tiêu đề): `text-on-surface` (`#131b2e` - Dark Slate)
- Chữ phụ (Mô tả, Label): `text-on-surface-variant` (`#5c3f40` - Tonal Brown/Crimson)
- Màu nhấn (Accent): `text-primary` (`#b80035`)

**Màu Nổi Bật (Primary & CTA):**
- Nền Primary CTA: `bg-[#b80035]` (Crimson)
- Interactive Gradient: Class `.crimson-gradient` (gradient từ `#b80035` sang `#e11d48`)
- Container mềm (Pill background): `bg-primary-container` (`#e11d48`)

## 3. Quy tắc Layout & Bố cục ("No-Line" Rule)

- **The "No-Line" Rule**: HẠN CHẾ TỐI ĐA dùng border liền 1px (nghĩa là `border-gray-200`) để chia đôi layout. 
- **Giải pháp**: Xây dựng ranh giới bằng sự chuyển đổi nền (Ví dụ: khối `surface-container-lowest` đặt trên nền `surface-container-low`).
- **Phân tách nội dung**: Trong nội bộ một Card, không dùng thẻ `<hr/>` để tách các mục. Thay vào đó dùng khoảng cách trắng (`gap-4`, `my-4`) hoặc vạch border mờ (Ví dụ: `border-outline-variant/10`).
- **Glassmorphism**: Các khối lอย nổi (Navbar, Banner thẻ) nên dùng class `.glass-nav` hoặc `bg-white/60 backdrop-blur-xl`.

## 4. Typography (Kiểu Chữ & Iconography)

- **Font**: 
  - Headline/Title: Sử dụng Plus Jakarta Sans (Gán config tailwind) / Be Vietnam Pro.
  - Body: Inter.
- **Biểu tượng (Icons)**: 
  - KHÔNG sử dụng Lucide React hay FontAwesome. Toàn bộ Icon phải sử dụng **Material Symbols Outlined** để đồng bộ Stitch UI.
  - Cú pháp chuẩn: `<span className="material-symbols-outlined">icon_name</span>`
  - Để in đậm icon (Filled): Thêm style `style={{ fontVariationSettings: "'FILL' 1" }}`

## 5. Quy tắc Shadcn UI & Code Rules

- **Taiwind Priority**: Sử dụng Semantic colors (ví dụ `bg-surface`, `text-on-surface`) để hỗ trợ tự động Light/Dark Mode của hệ thống.
- **Class Merging**: Dùng hàm `cn()` để check điều kiện class.
- **Component Design**: Mọi chức năng phức tạp phải được tách nhỏ theo mô hình Atomic Design (vd: phân mục `src/components/dashboard`, `src/components/landing`).

## 6. Responsive Design

| Breakpoint | Target |
|-----------|--------|
| `sm` (640px) | Mobile landscape |
| `md` (768px) | Tablet (Sidebar thường chuyển sang dạng gập) |
| `lg` (1024px) | Desktop |
| `xl` (1280px) | Wide desktop (Giới hạn max-width 7xl) |

- **Mobile-first**: Viết style cho mobile trước, dùng breakpoints để mở rộng.

## 7. Animation & Motion

- CSS-first: Ưu tiên CSS transitions (vd: `transition-all duration-300`).
- GSAP: Các hiệu ứng scroll hoành tráng (Hero Section mọc lên, Card trượt lên) ưu tiên dùng thư viện `gsap` hiện hành của hệ thống thay vì tự viết keyframes phức tạp.
