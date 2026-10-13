---
project_name: 'Cognito'
user_name: 'Tu'
date: '2026-10-13'
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - '_bmad-output/project-context.md'
  - 'docs/phase0-survey.md'
  - 'docs/screens/homepage_preview.png'
  - 'docs/screens/homepage_preview_grid.png'
version: '1.1.0'
status: 'APPROVED_FOR_IMPLEMENTATION'
primary_color: '#1a3d28'
serif_font: 'Playfair Display'
dark_bg: '#161916'
dark_surface: '#1F2420'
---

# TÀI LIỆU ĐẶC TẢ THIẾT KẾ UX/UI TOÀN DIỆN (COGNITO - EDUSHARE AI)

> **Mục tiêu chiến lược:** Thiết lập một ngôn ngữ thiết kế nhất quán (Unified Design Language) cho toàn bộ nền tảng học tập thông minh Cognito. Lấy phong cách học thuật cao cấp (Academic Editorial / Warm Craft) của **Landing Page & Flashcards** làm quy chuẩn vàng: màu chính xanh rừng `#1a3d28`, nền kem ấm `#F4F2EC`, bảng màu tối ấm dịu mắt `#161916` (thay thế hoàn toàn màu xanh đen lạnh `#0B0F17`), thẻ bento bo tròn lớn, typography kết hợp Serif sang trọng (`Playfair Display`) và Sans hiện đại (`Inter`).

---

## MỤC LỤC
1. [Triết lý Thiết kế & Định vị Thương hiệu](#1-triết-lý-thiết-kế--định-vị-thương-hiệu)
2. [Hệ thống Design Token & Bảng Màu Tối Ấm](#2-hệ-thống-design-token--bảng-màu-tối-ấm)
3. [Quy chuẩn Component Tái sử dụng (Core UI Components)](#3-quy-chuẩn-component-tái-sử-dụng-core-ui-components)
4. [Hai Mẫu Bố cục Khung dùng chung & Quy chuẩn Footer](#4-hai-mẫu-bố-cục-khung-dùng-chung--quy-chuẩn-footer)
5. [Quy chuẩn Thanh Điều hướng Toàn cục (Navbar)](#5-quy-chuẩn-thanh-điều-hướng-toàn-cục-navbar)
6. [Đặc tả Chi tiết 16 Màn hình & Ma trận 4 Trạng thái](#6-đặc-tả-chi-tiết-16-màn-hình--ma-trận-4-trạng-thái)
7. [Quy chuẩn Chiều rộng Khung chứa (Container Max-Width)](#7-quy-chuẩn-chiều-rộng-khung-chứa-container-max-width)
8. [Tiêu chuẩn Responsive & Mobile Transformation](#8-tiêu-chuẩn-responsive--mobile-transformation)
9. [Tiêu chuẩn Khả năng Tiếp cận (Accessibility WCAG AA)](#9-tiêu-chuẩn-khả-năng-tiếp-cận-accessibility-wcag-aa)

---

## 1. Triết lý Thiết kế & Định vị Thương hiệu

* **Định vị:** *The Operating System for Intellectual Mastery* — Không gian học tập thế hệ mới kết hợp AI, triệt tiêu phân tâm, tối ưu hóa khả năng ghi nhớ dài hạn (Spaced Repetition SM-2).
* **Cảm xúc cốt lõi (Design Mood):**
  * **Trang nhã & Tri thức (Academic Editorial):** Nền kem ấm, chữ tiêu đề serif mềm mại (`Playfair Display`), gạch chân thẳng màu mint sắc nét.
  * **Tập trung sâu (Deep Work Environment):** Chế độ tối ấm (Warm Charcoal/Olive), không gây mỏi mắt trong các phiên học đêm dài.
  * **Bento Grid & Thẻ Card Thủ công:** Bo góc lớn 16–20px (`rounded-2xl`), viền mỏng 1px, shadow mềm tinh tế.

---

## 2. Hệ thống Design Token & Bảng Màu Tối Ấm

Toàn bộ thuộc tính hiển thị được định nghĩa tập trung qua biến CSS tại `frontend/src/styles/design-tokens.css` và ánh xạ trực tiếp vào `frontend/tailwind.config.js`.

> **QUY TẮC BẮT BUỘC CHO AGENT:** Tuyệt đối không dùng các class tùy tiện như `dark:text-emerald-400` hay `dark:bg-emerald-700`. Mọi component chỉ sử dụng semantic token (`text-primary`, `bg-primary`, `bg-card`, `text-foreground`, `bg-background`).

### 2.1. Đề xuất & Chốt Bảng màu Tối Ấm (Warm Dark Palette)
Khắc phục triệt để gam màu `#0B0F17` (xanh đen lạnh) bằng bảng màu than ấm pha sắc xanh rêu sẫm, hài hòa tuyệt đối với nền kem ấm `#F4F2EC` và xanh rừng `#1a3d28`.

| Tên Token Semantic | Biến CSS | Light Mode (Sáng) | Dark Mode Ấm (Tối) | Tỷ lệ Tương phản WCAG (Dark) |
| :--- | :--- | :--- | :--- | :--- |
| **Nền trang (Background)** | `--color-bg` | `#F4F2EC` (Kem ấm) | `#161916` (Than rêu ấm) | Đạt chuẩn nền tảng |
| **Bề mặt Thẻ (Card / Surface)** | `--color-card` | `#FFFFFF` (Trắng tinh) | `#1F2420` (Than ấm nổi) | Tách bạch rõ với nền |
| **Bề mặt Phụ (Card Subtle)** | `--color-card-subtle` | `#EBE9E2` (Kem sẫm) | `#262C27` (Rêu than mờ) | Dùng cho divider, hover list |
| **Viền mỏng (Border)** | `--color-border` | `rgba(26,61,40,0.12)` | `rgba(255,255,255,0.08)` | Tách khối 1px tinh tế |
| **Chữ chính (Text Main)** | `--color-text-main` | `#0D1A14` (Đen lục đậm) | `#EDECE6` (Kem sáng ấm) | **14.9 : 1** (Vượt chuẩn AAA 7:1) |
| **Chữ phụ (Text Muted)** | `--color-text-muted` | `#526058` (Xám rêu ấm) | `#9FA8A1` (Xám rêu sáng) | **7.28 : 1** (Đạt chuẩn AAA 7:1) |
| **Màu chính (Primary)** | `--color-primary` | `#1a3d28` (Xanh rừng chốt) | `#2D6A4F` (Lục bảo ấm) | **5.2 : 1** (Đạt chuẩn AA nút bấm) |
| **Màu chính Hover** | `--color-primary-hover`| `#122b1c` | `#3E8E68` | Trạng thái rê chuột |
| **Chữ trên nền Primary** | `--color-primary-fg` | `#FFFFFF` | `#FFFFFF` | **9.2 : 1** (Vượt chuẩn AAA) |
| **Nhấn Mint Phụ (Mint Subtle)**| `--color-mint-subtle`| `#E8F8F0` (Mint sữa) | `rgba(52,211,153,0.15)` | Dùng cho badge, chip |
| **Viền Mint (Mint Border)** | `--color-mint-border` | `#BFEAD6` | `rgba(52,211,153,0.30)` | Viền badge, gạch chân mint |
| **Premium Gradient** | `--color-premium` | `#F59E0B` → `#D97706` | `#FBBF24` → `#B45309` | **Chỉ dùng duy nhất** cho CTA Premium |

### 2.2. Typography (Kiểu chữ chốt)
* **Font Serif Tiêu đề Lớn:** Chốt **`Playfair Display`** (fallback: `Merriweather`, `Times New Roman`, `serif`) — font chữ serif đang được sử dụng thực tế trong HeroSection và FeaturesSection.
* **Quy chuẩn Gạch chân Điểm nhấn:** Điểm nhấn tiêu đề sử dụng `Playfair Display` in nghiêng (Italic), màu xanh rừng `--color-primary`, kèm **đường gạch thẳng màu mint** nằm ngay dưới chân chữ (`h-1 bg-[#BFEAD6]` hoặc `border-b-2 border-[var(--color-mint-border)]`). **Tuyệt đối bỏ nét vẽ lượn sóng**.
* **Font Nội dung & Giao diện (Body & UI):** `Inter`, `-apple-system`, `sans-serif`.

---

## 3. Quy chuẩn Component Tái sử dụng (Core UI Components)

Tất cả component được xây dựng tại `frontend/src/components/common/` và tuân thủ việc chỉ áp dụng design token:

1. **Button:**
   * `primary`: Nền `var(--color-primary)`, chữ `var(--color-primary-fg)`, hover `var(--color-primary-hover)`, bo tròn 12–16px (hoặc full).
   * `secondary`: Nền `var(--color-mint-subtle)`, viền `var(--color-mint-border)`, chữ `var(--color-primary)`.
   * `ghost`: Nền trong suốt, hover `var(--color-card-subtle)`, chữ `var(--color-text-main)`.
   * `premium`: Gradient cam hổ phách, chữ trắng, icon `Crown`/`Sparkles`.
   * `danger`: Nền trắng viền đỏ hoặc đỏ nhạt, chữ `#E11D48`.
2. **Badge & Chip:** Dạng pill bo tròn `rounded-full`, nền `var(--color-mint-subtle)`, viền `var(--color-mint-border)`, chữ `var(--color-primary)`.
3. **Card:** Nền `var(--color-card)`, viền `var(--color-border)`, bo tròn `rounded-2xl` (16–20px), bóng mờ `shadow-card`, hover nâng nhẹ -3px.
4. **Tabs:** Segmented control bo tròn 12px, tab active có nền `var(--color-card)`, bóng mờ nhẹ, chữ `var(--color-primary)`.
5. **PageHeader:** Khung tiêu đề đầu trang: Breadcrumb/Nút quay lại (`ArrowLeft`) + Tiêu đề Serif `Playfair Display` + Mô tả súc tích + Cụm nút hành động chính bên phải.
6. **Bộ ba Trạng thái:** `Skeleton` (nhấp nháy nền `var(--color-card-subtle)`), `EmptyState` (icon tròn nét mảnh + văn bản + nút CTA), `ErrorState` (cảnh báo + nút thử lại/quay lại).

---

## 4. Hai Mẫu Bố cục Khung dùng chung & Quy chuẩn Footer

### 4.1. AppLayout
* **Cấu trúc:** Sticky Navbar + Khung nội dung căn giữa (theo `max-w` quy định) + **Footer chuẩn ở chân trang**.
* **Phạm vi áp dụng:**
  * Trang chủ (`/`, `/home`)
  * Cộng đồng (`/community`)
  * Kho Tài liệu (`/library`)
  * Flashcards (`/flashcards`, `/flashcards/new`, `/flashcards/[deckId]`, `/flashcards/[deckId]/edit`)
  * Tiến độ & Lịch sử học (`/progress`)
  * Tìm kiếm (`/search`)
  * Bạn bè (`/friends`)
  * Hồ sơ cá nhân (`/profile`, `/profile/[userId]`)
  * Cài đặt tài khoản (`/settings`)
  * Nâng cấp Premium (`/premium`, sandbox, return)
  * Đặt lại mật khẩu (`/reset-password`)
  * Xem tài liệu chia sẻ công khai (`/shared/[token]`)

### 4.2. WorkspaceLayout (Toàn màn hình — KHÔNG Footer)
* **Cấu trúc:** Sticky Navbar + Workspace Header thanh mảnh + Vùng làm việc 2 cột (Danh sách bên trái | Nội dung bên phải) trên cùng nền kem ấm `var(--color-bg)`. Chiều cao cố định `h-[calc(100vh-3.5rem)]`, `overflow-hidden`.
* **QUY CHUẨN FOOTER:** **Hoàn toàn KHÔNG hiển thị Footer** trên các màn hình sau:
  * Trình đọc tài liệu & Trợ lý AI (`/viewer/*`)
  * Phòng tập trung Pomodoro (`/focus`)
  * Sổ tay Ghi chú (`/notes`)
  * Sơ đồ Tư duy (`/mindmap`)
  * Hộp thư Tin nhắn riêng (`/messages`)
  * Cổng Quản trị Hệ thống (`/admin/*`)

---

## 5. Quy chuẩn Thanh Điều hướng Toàn cục (Navbar)

### 5.1. Định vị & Trạng thái Hoạt động (Active State)
* Cố định ở đầu (`fixed top-0 left-0 right-0 z-50 h-14`), nền `rgba(244, 242, 236, 0.94)` (dark: `rgba(22, 25, 22, 0.94)`), `backdrop-blur-md`, viền đáy 1px `border-b border-[var(--color-border)]`.
* **Quy chuẩn Active State (Mục đang chọn):**
  * Nền: `var(--color-mint-subtle)`
  * Viền: 1px `var(--color-mint-border)`
  * Chữ & Icon: In đậm, màu `var(--color-primary)`
  * Dropdown "Góc học tập" kích hoạt active khi đường dẫn hiện tại thuộc 1 trong 5 mục con (`/library`, `/ai-test`, `/quiz/*`, `/notes`, `/mindmap`, `/flashcards/*`).

### 5.2. Danh sách 5 mục trong Dropdown "Góc học tập" (Desktop)
1. **Tài liệu** (`/library`): Kho giáo trình, tài liệu học & file tải lên.
2. **Đề thi & Trắc nghiệm** (`/ai-test`): Luyện đề trắc nghiệm AI & chấm điểm tự động.
3. **Ghi chú** (`/notes`): Sổ tay ghi chép kiến thức cá nhân.
4. **Sơ đồ tư duy** (`/mindmap`): Trực quan hóa cấu trúc kiến thức.
5. **Flashcards** (`/flashcards`): Học ngắt quãng theo thuật toán SM-2.

### 5.3. Quy chuẩn Menu Mobile (< 768px)
* Trên thiết bị di động (< 768px), thanh menu ngang ẩn đi, góc phải hiển thị nút Hamburger (`Menu`, khi mở chuyển thành `X`).
* Khi chạm vào Hamburger, mở rộng Drawer toàn phần hoặc trượt êm từ trên xuống (sử dụng Framer Motion), nền `var(--color-card)`, viền `var(--color-border)`.
* **Danh sách đầy đủ các mục trong Mobile Drawer:**
  1. Trang chủ (`/`)
  2. Góc học tập (Nhóm accordion mở rộng hiển thị đúng 5 mục: Tài liệu, Đề thi, Ghi chú, Mindmap, Flashcards)
  3. Cộng đồng (`/community`)
  4. Tập trung Pomodoro (`/focus`)
  5. Tiến độ & Lịch sử học (`/progress`)
  6. Tìm kiếm (`/search`)
  7. Tin nhắn riêng (`/messages`) — kèm số đếm tin chưa đọc
  8. Nâng cấp Premium (Banner nút cam hổ phách nổi bật)
  9. Bạn bè (`/friends`)
  10. Hồ sơ cá nhân (`/profile`)
  11. Cài đặt tài khoản (`/settings`)
  12. Đăng xuất (đối với người dùng đã đăng nhập) hoặc Đăng nhập / Đăng ký (đối với khách)

---

## 6. Đặc tả Chi tiết 16 Màn hình & Ma trận 4 Trạng thái

Mỗi màn hình được đặc tả cấu trúc layout, chiều rộng container, tương tác chính và **đầy đủ 4 trạng thái bắt buộc (Loading, Empty, Error, Dark Mode)**:

### 6.1. Trang chủ / Landing Page (`/` và `/home`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Cấu trúc:**
  * *Chưa đăng nhập:* Hero Playfair Display + 2 CTA → Lưới 5 công cụ Góc học tập (Card bento lớn) → 3 bước How-it-works → Showcase 6 bộ thẻ cộng đồng thật → Bảng giá Premium → FAQ Accordion → Footer.
  * *Đã đăng nhập:* Vùng Hero được thay bằng khu vực *"Tiếp tục học"* (Streak, thẻ đến hạn ôn, tài liệu gần nhất) rồi tới lưới công cụ.
* **4 Trạng thái:**
  * *Loading:* Skeleton cho cụm Tiếp tục học và Showcase.
  * *Empty:* Không áp dụng (luôn có nội dung giới thiệu tĩnh).
  * *Error:* Toast thông báo nếu API lấy thẻ cộng đồng gặp sự cố.
  * *Dark Mode:* Nền `#161916`, card `#1F2420`, text `#EDECE6`, nút xanh lục bảo `#2D6A4F`.

### 6.2. Cộng đồng Học tập (`/community`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Cấu trúc:** Chia 2 Tab chuyên biệt:
  * *Tab 1: Flashcard chia sẻ (Mặc định):* Thẻ bộ thẻ (tên, số thẻ, tác giả, tim, lưu, nút *"Học ngay"*).
  * *Tab 2: Tài liệu cộng đồng:* Thẻ tài liệu nguồn mở OER (badge tài liệu xanh ngọc, nhãn giấy phép `CC-BY`, tác giả, nút *"Xem tài liệu"*).
  * **Tuyệt đối không có nút nhắn tin trực tiếp người lạ trên thẻ**.
* **4 Trạng thái:**
  * *Loading:* Lưới 6 Bento Card Skeleton.
  * *Empty:* `EmptyState` hình chiếc hộp: *"Chưa có tài nguyên nào trong mục này"* + Nút *"Chia sẻ tài nguyên"*.
  * *Error:* `ErrorState` báo lỗi tải bảng tin kèm nút *"Thử lại"*.
  * *Dark Mode:* Thẻ bài đăng nền `#1F2420`, viền `rgba(255,255,255,0.08)`.

### 6.3. Trình đọc Tài liệu & Trợ lý AI (`/viewer/[id]`)
* **Layout:** `WorkspaceLayout` (Toàn màn hình, KHÔNG Footer) | **Container:** Full width
* **Cấu trúc:** 2 cột Resizable Split-Pane. Cột trái: Trình đọc tài liệu (PDF, Word, Ảnh). **Nếu `doc_url` null, tự động render nội dung Markdown qua `react-markdown`**. Cột phải: Trợ lý AI (Tabs: Trợ lý AI, Mindmap AI, Pomodoro & Note).
* **4 Trạng thái:**
  * *Loading:* Spinner xoay mượt ở trung tâm khung đọc.
  * *Empty:* Không áp dụng.
  * *Error:* `ErrorState` rõ ràng: *"Không tìm thấy hoặc không thể mở tài liệu"* kèm nút *"Quay lại Thư viện"*.
  * *Dark Mode:* Vùng đọc tài liệu nền `#161916`, chữ dịu mắt, sidebar `#1F2420`.

### 6.4. Sổ tay Ghi chú (`/notes`)
* **Layout:** `WorkspaceLayout` (Toàn màn hình, KHÔNG Footer) | **Container:** Full width
* **Cấu trúc:** 2 cột cân đối. Cột trái (w-80 đến w-96): Tìm kiếm từ khóa, danh sách ghi chú, nút *"Tạo ghi chú mới"*. Cột phải: Trình soạn thảo & đọc Markdown trực quan.
* **4 Trạng thái:**
  * *Loading:* Skeleton 4 mục ghi chú bên cột trái.
  * *Empty:* `EmptyState`: *"Bạn chưa có ghi chú nào"* + Nút *"Tạo ghi chú đầu tiên"*.
  * *Error:* Báo lỗi không thể đồng bộ bản nháp kèm nút lưu lại.
  * *Dark Mode:* Toàn bộ nền `#161916`, sidebar `#1F2420`, khung soạn thảo viền tối tinh tế.

### 6.5. Sơ đồ Tư duy (`/mindmap`)
* **Layout:** `WorkspaceLayout` (Toàn màn hình, KHÔNG Footer) | **Container:** Full width
* **Cấu trúc:** Cột trái: Danh sách sơ đồ tư duy, nút *"Tạo sơ đồ mới"*. Cột phải: Khung kết xuất Mermaid SVG tương tác (thu phóng, xoay chuyển, sao chép code).
* **4 Trạng thái:**
  * *Loading:* Skeleton danh sách sơ đồ và spinner kết xuất đồ thị.
  * *Empty:* `EmptyState`: *"Chưa có sơ đồ tư duy nào"* + Nút *"Tạo sơ đồ mới"*.
  * *Error:* Báo lỗi cú pháp Mermaid với gợi ý sửa.
  * *Dark Mode:* Sơ đồ kết xuất với theme dark ấm, các nút node có viền mint.

### 6.6. Kho Tài liệu (`/library`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Cấu trúc:** PageHeader chuẩn (Thư viện của tôi) + Thống kê Streak + Thanh tìm kiếm & bộ lọc danh mục môn học + Lưới thẻ tài liệu bento + Nút *"Tải tài liệu lên"* mở modal tải file.
* **4 Trạng thái:**
  * *Loading:* Lưới 8 Card Skeleton.
  * *Empty:* `EmptyState`: *"Kho tài liệu đang trống"* + Nút *"Tải lên tài liệu đầu tiên"*.
  * *Error:* `ErrorState` báo sự cố tải kho tài liệu kèm nút thử lại.
  * *Dark Mode:* Thẻ card nền `#1F2420`, nhãn danh mục màu mint tối.

### 6.7. Đề thi & Trắc nghiệm (`/quiz` & `/ai-test`)
* **Layout:** `AppLayout` | **Container:** `max-w-4xl` (Khung làm bài thi tập trung, tránh bè ngang)
* **Cấu trúc:**
  * *Danh sách đề thi & Tạo đề AI (`/quiz` & `/ai-test`):* Quản lý các bộ đề thi đã tạo, tạo đề thi mới bằng AI từ tài liệu lựa chọn, tùy chỉnh số lượng câu hỏi và độ khó.
  * *Phòng thi trắc nghiệm (`/quiz/[testSetId]`):* Thanh tiến trình câu hỏi, danh sách câu hỏi trắc nghiệm, chọn đáp án highlight xanh rừng, nút *"Nộp bài"*, bảng tổng kết điểm số kèm giải thích chi tiết từng câu.
* **4 Trạng thái:**
  * *Loading:* Skeleton câu hỏi trắc nghiệm và danh sách bài thi.
  * *Empty:* `EmptyState`: *"Chưa có bài thi nào"* + Nút *"Tạo đề thi mới bằng AI"*.
  * *Error:* Báo lỗi không thể nộp bài hoặc mất kết nối.
  * *Dark Mode:* Lựa chọn đáp án đổi màu highlight xanh rừng ấm khi chọn.

### 6.8. Phòng Tập trung Pomodoro (`/focus`)
* **Layout:** `WorkspaceLayout` (Toàn màn hình, KHÔNG Footer) | **Container:** Full width
* **Cấu trúc:** Chế độ tĩnh lặng không phân tâm: Thiết lập phiên học (25/45/60 phút) → Vòng tròn đếm ngược tối giản → Bảng tổng kết điểm tập trung (Focus Score) & chuỗi ngày học.
* **4 Trạng thái:**
  * *Loading:* Spinner khởi tạo phiên học.
  * *Empty:* N/A.
  * *Error:* Cảnh báo mất đồng bộ dữ liệu thời gian.
  * *Dark Mode:* Môi trường buồng tối sâu `#121412`, vòng tiến trình đếm ngược xanh mint sáng.

### 6.9. Tiến độ & Lịch sử Học tập (`/progress`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Cấu trúc:** Gồm 2 Tab chính:
  * *Tab 1: Tiến độ & Mục tiêu:* Thống kê chuỗi Streak, biểu đồ thời gian học trong tuần, danh sách mục tiêu hoàn thành.
  * *Tab 2: Lịch sử học tập (Nhận dữ liệu từ `/study-sessions` cũ):* Dòng thời gian chi tiết các phiên học, thời lượng và kết quả đạt được.
* **4 Trạng thái:**
  * *Loading:* Skeleton biểu đồ và danh sách lịch sử.
  * *Empty:* `EmptyState`: *"Chưa có dữ liệu học tập. Bắt đầu phiên học đầu tiên ngay!"*.
  * *Error:* `ErrorState` kèm nút thử lại.
  * *Dark Mode:* Biểu đồ Recharts phối màu trên nền `#1F2420`.

### 6.10. Bạn bè & Hộp thư Tin nhắn (`/friends` & `/messages`)
* **Trang Bạn bè (`/friends`):** `AppLayout` | **Container:** `max-w-5xl`
  * Gồm 4 Tab: *Bạn bè*, *Lời mời nhận*, *Lời mời gửi*, *Tìm người*.
  * Đầy đủ nút *"Nhắn tin"* (chỉ khi là bạn bè), *"Chấp nhận"*, *"Từ chối"*, *"Kết bạn"*.
* **Trang Tin nhắn (`/messages`):** `WorkspaceLayout` (Toàn màn hình, KHÔNG Footer) | **Container:** Full width
  * 2 cột: Cột trái là danh sách bạn bè đã kết nối; Cột phải là hộp chat thời gian thực.
  * Kiểm tra chặt chẽ phía server (`friendships.status = 'accepted'`).
* **4 Trạng thái:**
  * *Loading:* Skeleton danh sách bạn bè / tin nhắn.
  * *Empty:* `EmptyState`: *"Chưa có cuộc trò chuyện nào. Hãy kết nối với bạn bè để trao đổi bài học!"*.
  * *Error:* Báo lỗi mất kết nối máy chủ tin nhắn.
  * *Dark Mode:* Bóng chat người gửi màu xanh rừng `#2D6A4F`, người nhận màu than `#262C27`.

### 6.11. Tìm kiếm Toàn cầu (`/search`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Cấu trúc:** Ô tìm kiếm lớn có debounce + Bộ lọc đa đối tượng (Tất cả, Tài liệu, Flashcard, Đề thi, Bạn bè) + Lưới kết quả tìm kiếm phân trang.
* **4 Trạng thái:**
  * *Loading:* Skeleton danh sách kết quả.
  * *Empty:* `EmptyState`: *"Không tìm thấy kết quả phù hợp với từ khóa"* kèm gợi ý từ khóa phổ biến.
  * *Error:* Thông báo sự cố tìm kiếm.
  * *Dark Mode:* Ô nhập liệu nền `#1F2420`, viền sáng nhẹ.

### 6.12. Hồ sơ Người dùng (`/profile` & `/profile/[userId]`)
* **Layout:** `AppLayout` | **Container:** `max-w-5xl`
* **Cấu trúc:** Banner thông tin cá nhân (Avatar tròn, tên, email, bio, vai trò) + Các chỉ số học tập (Streak, tài liệu đã tải, thẻ đã thuộc) + Danh sách tài nguyên đã đóng góp hoặc đã lưu.
* **4 Trạng thái:**
  * *Loading:* Skeleton thông tin hồ sơ và danh sách.
  * *Empty:* *"Người dùng chưa công khai hoạt động nào"*.
  * *Error:* Báo lỗi không tìm thấy người dùng.
  * *Dark Mode:* Khung avatar và thẻ thống kê tông than ấm `#1F2420`.

### 6.13. Cài đặt Tài khoản (`/settings`)
* **Layout:** `AppLayout` | **Container:** `max-w-4xl` (Khung hẹp căn giữa)
* **Cấu trúc:** Danh mục cài đặt dạng thẻ: Thông tin tài khoản, Đổi mật khẩu, Tùy chọn thông báo, Bảo mật 2 lớp, Tùy chọn giao diện (Sáng / Tối / Tự động).
* **4 Trạng thái:**
  * *Loading:* Skeleton form cài đặt.
  * *Empty:* N/A.
  * *Error:* Báo lỗi cập nhật thông tin.
  * *Dark Mode:* Ô nhập form nền `#1F2420`, text `#EDECE6`.

### 6.14. Gói Premium & Thanh toán (`/premium`, sandbox, return)
* **Layout:** `AppLayout` | **Container:** `max-w-6xl`
* **Cấu trúc:** Bảng so sánh tính năng gói Free vs gói Pro (Không giới hạn AI, lưu trữ không giới hạn, hỗ trợ ưu tiên) + CTA cam hổ phách + Khung thanh toán PayOS an toàn.
* **4 Trạng thái:**
  * *Loading:* Skeleton bảng giá và trạng thái đơn hàng.
  * *Empty:* N/A.
  * *Error:* Báo lỗi xử lý giao dịch kèm hướng dẫn liên hệ hỗ trợ.
  * *Dark Mode:* Thẻ Premium nổi bật với viền ánh kim hổ phách trên nền `#1F2420`.

### 6.15. Đăng nhập, Đăng ký & Quên mật khẩu (`RegisterModal` & `/reset-password`)
* **Layout:** Modal đối với đăng nhập/đăng ký; `AppLayout` (`max-w-md`) đối với `/reset-password`.
* **Cấu trúc:** Biểu mẫu xác thực: Nút đăng nhập Google một chạm + Ô nhập email/mật khẩu + Nút hành động chính xanh rừng + Liên kết quên mật khẩu.
* **4 Trạng thái:**
  * *Loading:* Nút đăng nhập hiện spinner vô hiệu hóa click.
  * *Empty:* N/A.
  * *Error:* Báo lỗi sai mật khẩu hoặc tài khoản chưa kích hoạt bằng tiếng Việt dưới từng ô input.
  * *Dark Mode:* Hộp modal nền `#1F2420`, viền `rgba(255,255,255,0.1)`.

### 6.16. Bộ Thẻ Ghi Nhớ Flashcards (`/flashcards`, `new`, `[deckId]`, `edit`)
* **Layout:** `AppLayout` | **Container:** `max-w-4xl` (Khung hẹp tối ưu cho sự tập trung ôn tập)
* **Cấu trúc:**
  * *Hub quản lý (`/flashcards`):* PageHeader chuẩn + Lưới thẻ bộ deck (tên, số thẻ, tác giả, tiến độ nhớ, trạng thái công khai/riêng tư) + Nút *"Tạo bộ thẻ mới"*.
  * *Tạo mới & Sửa bộ thẻ (`/flashcards/new`, `/flashcards/[deckId]/edit`):* Form nhập tiêu đề, mô tả, môn học, chuyển đổi công khai/riêng tư, danh sách các thẻ câu hỏi/câu trả lời thêm/sửa/xóa trực quan.
  * *Phiên ôn tập SM-2 (`/flashcards/[deckId]`):* Thanh tiến trình ôn tập + Thẻ 3D lật mặt trước/sau khi click/nhấn Space + Hàng 4 nút đánh giá phản xạ Spaced Repetition (*Lại / Khó / Tốt / Dễ*) + Màn hình tổng kết phiên học hoàn thành.
* **4 Trạng thái:**
  * *Loading:* Skeleton thẻ flashcard trung tâm và thanh tiến trình.
  * *Empty:* `EmptyState`: *"Bạn chưa có bộ thẻ ghi nhớ nào. Tạo bộ thẻ mới hoặc khám phá từ Cộng đồng!"* + Nút *"Tạo bộ thẻ"*.
  * *Error:* `ErrorState`: Báo lỗi không thể tải danh sách thẻ hoặc lỗi đồng bộ phiên ôn tập kèm nút *"Thử lại"*.
  * *Dark Mode:* Thẻ Flashcard nền `#1F2420`, viền `rgba(255,255,255,0.08)`, chữ `#EDECE6`, 4 nút đánh giá phản xạ có độ tương phản chuẩn trên nền tối.

### 6.17. Xem Tài liệu Chia sẻ Công khai qua Liên kết (`/shared/[token]`)
* **Layout:** `AppLayout` | **Container:** `max-w-5xl`
* **Cấu trúc:** Khung đọc tài liệu cho người xem bên ngoài qua liên kết chia sẻ:
  * Header thanh mảnh: Tên tài liệu, Tác giả, Ngày chia sẻ, Giấy phép, nút *"Mở trong Cognito"* / *"Lưu vào Thư viện cá nhân"*.
  * Khung xem tài liệu: Render đa định dạng (PDF, Docx, Ảnh; nếu `doc_url = null` tự động render Markdown qua `react-markdown` KHÔNG bật `rehype-raw` theo NFR-6).
* **4 Trạng thái:**
  * *Loading:* Spinner xoay mượt ở trung tâm khung đọc.
  * *Empty:* N/A.
  * *Error:* `ErrorState` "Liên kết chia sẻ không tồn tại, đã bị thu hồi hoặc đã hết hạn" kèm nút *"Về Trang chủ"*.
  * *Dark Mode:* Vùng đọc tài liệu nền `#161916`, chữ dịu mắt, khung viền `#1F2420`.

---

## 7. Quy chuẩn Chiều rộng Khung chứa (Container Max-Width)

| Nhóm Màn hình | Chiều rộng tối đa (Max-Width) | Các màn hình áp dụng | Lý do thiết kế |
| :--- | :--- | :--- | :--- |
| **Nhóm Mở rộng (Wide Grid)** | `max-w-7xl` (~1280px) | Trang chủ (`/`), Cộng đồng (`/community`), Thư viện (`/library`), Tiến độ (`/progress`), Tìm kiếm (`/search`) | Không gian rộng rãi cho lưới thẻ Bento Grid 3–4 cột |
| **Nhóm Bảng giá, Hồ sơ & Chia sẻ** | `max-w-6xl` (~1152px) hoặc `max-w-5xl` (~1024px) | Premium (`/premium`), Bạn bè (`/friends`), Hồ sơ (`/profile`), Xem tài liệu chia sẻ (`/shared/[token]`) | Cân đối tầm mắt, các thẻ so sánh và khung đọc không bị kéo dãn |
| **Nhóm Đọc sâu & Cài đặt** | `max-w-4xl` (~896px) | Flashcard Hub (`/flashcards`), Tạo/sửa bộ thẻ (`/flashcards/new`, `edit`), Đề thi (`/quiz`, `[testSetId]`), Cài đặt (`/settings`) | Giữ chiều dài dòng văn bản tối ưu cho khả năng đọc hiểu |
| **Nhóm Xác thực (Auth)** | `max-w-md` (~448px) | Quên mật khẩu (`/reset-password`), Modal đăng nhập | Khung biểu mẫu nhập liệu tập trung |
| **Nhóm Workspace (Dual-Pane)**| `w-full` (100vw, h-screen) | Viewer (`/viewer`), Ghi chú (`/notes`), Mindmap (`/mindmap`), Focus (`/focus`), Tin nhắn (`/messages`), Admin (`/admin`) | Toàn màn hình làm việc 2 cột, không khoảng trống thừa |

---

## 8. Tiêu chuẩn Responsive & Mobile Transformation

* **Desktop (≥ 1280px) & Laptop (1024px):** Hiển thị đầy đủ 2 cột đối với WorkspaceLayout, lưới Bento 3–4 cột đối với AppLayout.
* **Tablet (768px - 1023px):** Lưới chuyển thành 2 cột, thanh Sidebar Workspace thu hẹp về 280px.
* **Mobile (< 768px):**
  * Navbar thu gọn vào Hamburger Drawer.
  * **WorkspaceLayout tự động chuyển thành 2 Segmented Tabs:** Tab 1 *"Danh sách"* và Tab 2 *"Chi tiết / Trợ lý AI"*. Khi chọn 1 mục ở Tab 1 sẽ tự trượt sang Tab 2.
  * `/viewer` trên mobile: Tài liệu xem toàn màn hình, nút mở Trợ lý AI trở thành nút tròn nổi FAB (Floating Action Button) ở góc dưới bên phải.

---

## 9. Tiêu chuẩn Khả năng Tiếp cận (Accessibility WCAG AA)

1. **Độ tương phản màu sắc (Contrast Ratio):**
   * Chữ `#EDECE6` trên nền tối `#161916` đạt **14.9 : 1** (vượt xa chuẩn WCAG AAA 7:1).
   * Chữ phụ `#9FA8A1` trên nền tối `#161916` đạt **7.28 : 1** (đạt chuẩn AAA).
   * Nút bấm `#2D6A4F` với chữ trắng đạt **5.2 : 1** (đạt chuẩn AA).
2. **Focus Ring bàn phím:** Mọi nút, liên kết, ô nhập liệu khi di chuyển bằng phím `Tab` phải có vòng sáng rõ nét: `focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2`.
3. **Thẻ nhãn ARIA:** Tất cả icon-button (chuông, chia sẻ, âm thanh, đóng) bắt buộc có thuộc tính `aria-label` mô tả rõ bằng tiếng Việt.
