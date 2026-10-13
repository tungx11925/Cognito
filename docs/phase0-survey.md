# BÁO CÁO KHẢO SÁT HỆ THỐNG COGNITO (PHASE 0)

> **Mục tiêu:** Rà soát và lập hồ sơ hiện trạng toàn bộ hệ thống nền tảng học tập "Cognito" (EduShare AI) trước khi thực hiện tái cấu trúc, thiết lập design token và đồng bộ giao diện đa trang.

---

## 1. Công nghệ thực tế (Tech Stack)

* **Frontend**:
  * **Framework**: Next.js 14.0.0 (App Router: `frontend/src/app`), React 18.2.0, TypeScript 5.0.0.
  * **Styling & UI**: Tailwind CSS 3.3.0, Vanilla CSS (`globals.css`), Framer Motion 12.40.0, Lucide React 1.17.0, Canvas Confetti, Recharts.
  * **Trình đọc & định dạng văn bản**: `@cyntler/react-doc-viewer`, `docx-preview`, `mammoth`, `katex`, `react-markdown`, `remark-gfm`, `mermaid`.
  * **State Management**: React Context (`StudyContext.tsx`), Custom Hooks, Local State (Không dùng Redux/Zustand).
* **Backend**:
  * **Runtime & Framework**: Node.js, Express 4.18.2 with TypeScript (`ts-node`, `nodemon`).
  * **Kiến trúc**: Controller - Service - Repository pattern (`backend/src`).
* **Database & Migration**:
  * **Hệ quản trị**: PostgreSQL 15+ (chạy qua Docker Compose trên cổng 5432).
  * **Query Engine**: `pg` Pool với câu lệnh SQL parameterized (không dùng ORM nặng như Prisma hay TypeORM).
  * **Migration Tool**: `node-pg-migrate` với 44 file migration trong `backend/migrations`.
* **Xác thực (Auth)**:
  * JWT (Access Token 15 phút, Refresh Token 7 ngày), `bcryptjs`.
  * Google OAuth (`google-auth-library` và Google Identity Services SDK).
  * Phân quyền Role: `user`, `admin`, `premium`.
* **Lưu trữ tệp (File Storage)**:
  * Cloudinary Cloud SDK (`dhsqfuxhc`), `multer` xử lý bộ đệm tệp upload.
* **AI Integrations**:
  * Google Gemini API (`@google/generative-ai`, model `gemini-2.5-flash`), Groq SDK, OpenAI SDK.

---

## 2. Toàn bộ Route & Thành phần Layout

### Danh sách Route hiện hữu (`frontend/src/app`):
1. `/` & `/home` - Landing Page (`home/page.tsx`)
2. `/library` - Kho tài liệu cá nhân & phân mục (`library/page.tsx`)
3. `/viewer/[id]` - Trình đọc tài liệu & Trợ lý học tập AI dual-pane (`viewer/[id]/page.tsx`)
4. `/flashcards` - Quản lý Flashcard SM-2 (`flashcards/page.tsx`)
5. `/flashcards/new` - Tạo bộ thẻ mới (`flashcards/new/page.tsx`)
6. `/flashcards/[deckId]` - Phiên học thẻ ghi nhớ / lật thẻ / chế độ toàn màn hình
7. `/flashcards/[deckId]/edit` - Chỉnh sửa bộ thẻ
8. `/notes` - Sổ tay ghi chú học tập 2 cột (`notes/page.tsx`)
9. `/mindmap` - Sơ đồ tư duy kiến thức Mermaid (`mindmap/page.tsx`)
10. `/quiz` & `/quiz/[testSetId]` - Luyện đề & thi trắc nghiệm AI
11. `/ai-test` - Trung tâm tạo đề trắc nghiệm AI (`ai-test/page.tsx`)
12. `/community` - Bảng tin chia sẻ tài nguyên cộng đồng (`community/page.tsx`)
13. `/focus` - Phòng tập trung Pomodoro chuyên sâu (`focus/page.tsx`)
14. `/progress` - Theo dõi tiến độ, streak, mục tiêu (`progress/page.tsx`)
15. `/study-sessions` - Lịch sử các phiên học tập (`study-sessions/page.tsx`) *(Sẽ chuyển thành tab trong `/progress?tab=history`)*
16. `/search` - Tìm kiếm toàn cầu đa đối tượng (`search/page.tsx`)
17. `/messages` - Tin nhắn cá nhân (`messages/page.tsx`)
18. `/profile` & `/profile/[userId]` - Hồ sơ cá nhân & trang người dùng công khai
19. `/settings` - Cài đặt tài khoản, thông báo, mật khẩu (`settings/page.tsx`)
20. `/premium`, `/premium/sandbox-checkout`, `/premium/return` - Nâng cấp gói & thanh toán PayOS
21. `/admin` - Bảng điều khiển quản trị hệ thống (`admin/page.tsx`)
22. `/shared/[token]` - Xem tài liệu chia sẻ qua liên kết công khai

### Khung Layout & Vấn đề cấu trúc:
* **Root Layout (`layout.tsx`)**: Bọc `AppLayoutWrapper`, `ThemeProvider`, `StudyContextProvider`, `Toaster`, `TaskNotifications`.
* **Vấn đề Navbar**: `AppLayoutWrapper` hiện chỉ bọc `<Footer />`, không bọc `<Navbar>`. Hơn 18 trang màn hình đang tự import `<Navbar isLoggedIn={...} ... />` và tự chèn `<div className="pt-20">` gây xô lệch.
* **Component rác**: `src/components/Button.tsx` (chứa nút xanh dương `bg-blue-500`) và `src/components/Navbar.tsx` (chứa navbar `MyApp` demo).
* **Footer**: Các liên kết chính sách/điều khoản đang trỏ vào route tạm (`/library`, `/community`, `/search`).

---

## 3. Bảng đối chiếu phong cách UI (Lệch pha giao diện)

| Trang | Nền trang (Background) | Header / Tiêu đề | Nút hành động chính (Primary CTA) | Font chữ & Phong cách |
| :--- | :--- | :--- | :--- | :--- |
| **Landing (`/`, `/home`)** | Kem ấm `#f5f3ee`, họa tiết thủ công giấy xé / chấm bi | Hero font Serif lớn (`Playfair Display`, `Merriweather`), nhấn italic `#1a3d28` gạch chân mint | `bg-[#1a3d28] hover:bg-[#112a1b]` bo tròn lớn `rounded-full` | Serif tiêu đề + Sans nội dung (`Inter`) |
| **Flashcards (`/flashcards`)** | Kem xám `#ebe8e0` (hỗ trợ đổi style dot/grid/paper qua state) | Sub-header h-14 có nút đổi theme/audio/streak | `bg-[#1a2e1c]` hoặc gradient lục bảo, bo góc `rounded-2xl` | `Outfit` + `Inter`, thẻ card bo lớn 20px |
| **Thư viện (`/library`)** | Kem xám `#ebe8e0` / tối `#121212` | Sub-header phân loại danh mục, streak flame | `bg-[#1a3d28]` bo góc `rounded-xl` | Font cứng `Outfit` |
| **Ghi chú (`/notes`)** | Trắng ngà `#FDFCFB`, Sidebar trắng phẳng `#ffffff` | Thanh header phẳng màu trắng viền xám mỏng | `bg-[#0D2B24] hover:bg-[#16483C]` bo góc `rounded-xl` cỡ nhỏ | Sans-serif thuần, bố cục không đồng điệu với thẻ card Landing |
| **Sơ đồ tư duy (`/mindmap`)** | Trắng ngà `#FDFCFB`, Sidebar trắng phẳng | Giống hệt trang Ghi chú (header trắng phẳng) | `bg-[#0D2B24]` bo `rounded-xl` | Sans-serif thuần |
| **Viewer tài liệu (`/viewer/[id]`)** | Xám lạnh `#FAF8F5`, khung tài liệu xám `#EBECEF`, AI sidebar `#EBE9E4` | Header trắng tinh h-14, tab AI kiểu iOS segmented control `#D6D3CC` | Nút "✨ Đóng Trợ lý" `bg-[#0D2B24]`, nút Tải `border-gray-200` | Giao diện lệch hẳn tông màu so với chất ấm của thương hiệu |
| **Cộng đồng (`/community`)** | Vàng đá mờ xám `#f8f6f0` | Tiêu đề Sans trung bình, tabs kiểu phẳng viền xám | `bg-[#1a3a2a]` nút "Học ngay" | Dùng chung 1 mẫu card cho cả Tài liệu, Flashcard, Quiz |
| **Tập trung (`/focus`)** | `#FAF8F5`, buồng tập trung đen/xanh đậm | Header trắng h-14 | `bg-[#0D2B24]` | Sans-serif |

---

## 4. Nguyên nhân các lỗi đã phát hiện

1. **Viewer báo "Không có đường dẫn tài liệu"**:
   * `DocumentViewerWrapper.tsx` kiểm tra: `if (!rawUrl) return <div>Không có đường dẫn tài liệu.</div>;`
   * Trong DB, tài liệu giáo trình OER và tài liệu sinh tự động có `doc_url = null`, nội dung là chuỗi Markdown nằm trong `solution_text`. Trình xem hiện chưa hỗ trợ render Markdown inline và thiếu `ErrorState` hướng dẫn khi thiếu file.
2. **Cộng đồng trộn lẫn loại & nút nhắn tin công khai**:
   * Dùng chung 1 kiểu card cho tài liệu, flashcard, đề thi.
   * Dòng 1073 tại `community/page.tsx` có nút `router.push('/messages?user=' + item.user_id)` cho phép bất kỳ ai nhắn tin trực tiếp cho người lạ mà không cần quan hệ bạn bè.

---

## 5. Dữ liệu cần bảo vệ và Dữ liệu test cần dọn dẹp

* **Tài khoản thật bảo vệ tuyệt đối (9 tài khoản)**:
  * ID 1: "Admin Edushare" (`admin`)
  * ID 2: "Nguyễn Văn Học" (`hocvien@edushare.com`)
  * ID 3: "tu nguyen" (`tnt11925@gmail.com`)
  * ID 5: "tunek" (`tnt11925@mail.com`)
  * ID 7: "Lê Thị Hoa" (`lehoa@edushare.com`)
  * ID 8: "Phạm Bình Minh" (`phamminh@edushare.com`)
  * ID 21: "Giáo Viên Demo" (`giaovien`)
  * ID 22: "Teacher Edu" (`teacher`)
  * ID 5035: "Thư viện mở Cognito" (`openlibrary@cognito.edu.vn`)
* **Dữ liệu test cần dọn dẹp ở Phase 4**:
  * 155 tài khoản test sinh ra từ các test suite (`phase41_*`, `phase30_*`, `p15_*`, `ratelimit_*`, `test_*`).
  * Các bộ thẻ test: ID 531, 532, 533, 534, 535, 536 ("Bộ thẻ Phase 41..."), ID 5, 6, 7, 9, 10.
  * Các tài liệu test rác ("Tài liệu ôn tập AI Phase 41...", "Test Doc...", "Tài Liệu Ôn Tập Benchmark...").
  * Hơn 600 `test_sets` test rác do test suite tự tạo.
