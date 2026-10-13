---
project_name: 'Cognito'
user_name: 'Tu'
date: '2026-10-13'
sections_completed: ['technology_stack', 'critical_rules']
existing_patterns_found: 22
primary_color: '#1a3d28'
---

# Project Context for AI Agents

_Tài liệu quy định bắt buộc về kiến trúc, design token và quy tắc triển khai code cho toàn bộ AI agents làm việc trên dự án Cognito (EduShare AI). Mọi agent phải tuân thủ nghiêm ngặt các quy tắc dưới đây._

---

## 1. Công nghệ & Phiên bản thực tế (Tech Stack)

* **Frontend**: Next.js 14.0.0 (App Router: `frontend/src/app`), React 18.2.0, TypeScript 5.0.0
* **Styling**: Tailwind CSS 3.3.0, Vanilla CSS (`frontend/src/styles/design-tokens.css`), Framer Motion 12.40.0, Lucide React 1.17.0
* **Backend**: Express 4.18.2, TypeScript 5.0.0, Node.js (`ts-node`, `nodemon`)
* **Database & Migration**: PostgreSQL 15+ (`pg` Pool với parameterized raw SQL), `node-pg-migrate`
* **File Storage**: Cloudinary SDK (`dhsqfuxhc`), Multer
* **AI Models**: Google Gemini 2.5 Flash (`@google/generative-ai`), Groq SDK, OpenAI SDK

---

## 2. Quy tắc cốt lõi bắt buộc cho mọi Agent (Critical Rules)

### 2.1. Quản lý thư viện & Phụ thuộc
* **Tuyệt đối không cài thêm thư viện mới** (`npm install` / `yarn add`) nếu chưa hỏi và chưa được chủ dự án phê duyệt.
* Ưu tiên tái sử dụng tối đa các thư viện và component hiện có trong dự án.

### 2.2. Design System & Màu sắc thương hiệu
* **Màu chính xanh rừng chốt duy nhất**: `--color-primary: #1a3d28` (giá trị xuất hiện nhiều nhất trong codebase với 177+ vị trí). Gộp và loại bỏ các mã màu xanh phân mảnh (`#1a2e1c`, `#0D2B24`, `#1a3a2a`, `#143828`). Bắt buộc có biến thể dark mode chuẩn (`dark:text-emerald-400`, `dark:bg-emerald-700`...).
* **Nền trang kem ấm**: Mặc định dùng token `var(--color-bg-warm)` / `#F4F2EC` (dark mode: `#0B0F17` hoặc `#121212`), thẻ card trắng viền mảnh bo góc lớn 16–20px (`rounded-2xl`), shadow mềm.
* **Không hardcode kiểu dáng**: Chỉ sử dụng design token từ `frontend/src/styles/design-tokens.css` (được ánh xạ vào `tailwind.config.js`). Không hardcode màu sắc, font chữ, khoảng cách cục bộ trong từng trang.

### 2.3. Khung Layout & Điều hướng (Navbar / Footer)
* **Navbar & Footer tập trung trong `AppLayoutWrapper`**: Cả `<Navbar>` và `<Footer>` được quản lý chung bên trong `AppLayoutWrapper`. Các trang con (`src/app/**/page.tsx`) **tuyệt đối không tự import Navbar**.
* **Chiến lược di chuyển Navbar an toàn**:
  * Phải thí điểm đưa Navbar vào `AppLayoutWrapper` trên 2 trang `/notes` và `/community` trước.
  * Kiểm tra kỹ lưỡng để không bị trùng lặp 2 Navbar. Sau khi xác nhận hoạt động chuẩn xác mới áp dụng cho các trang còn lại.
  * Phải gỡ bỏ import `<Navbar>` cục bộ trong cùng lần chỉnh sửa tương ứng với mỗi trang.
* **Xóa bỏ component rác**: Chỉ xóa file `src/components/Button.tsx` (chứa nút xanh `bg-blue-500`) và `src/components/Navbar.tsx` (chứa navbar `MyApp` demo) sau khi kiểm tra chắc chắn không còn nơi nào import.
* **Bảo toàn liên kết & Chuyển hướng**: Route đổi tên/di chuyển bắt buộc phải có redirect 301/308 (ví dụ `/study-sessions` → `/progress?tab=history`). Không để link chết ở Footer và các nút breadcrumb.

### 2.4. Dữ liệu & Trạng thái giao diện
* **Tuyệt đối không hardcode / mock dữ liệu**: Toàn bộ danh sách trên giao diện người dùng phải lấy từ API/DB thật.
* **Chuẩn hóa trạng thái (Story States)**: Mỗi màn hình / story bắt buộc phải có đầy đủ 4 trạng thái:
  1. Trạng thái đang tải (Loading / Skeleton)
  2. Trạng thái rỗng (Empty state kèm hướng dẫn và nút hành động)
  3. Trạng thái lỗi (Error state thân thiện kèm nút quay lại/thử lại)
  4. Hoạt động trơn tru ở Chế độ tối (Dark mode)

### 2.5. Cơ sở dữ liệu & Danh sách tài khoản
* **Mọi thay đổi DB phải qua migration**: Dùng `node-pg-migrate`, bắt buộc có script rollback (`down`).
* **An toàn khi xóa dữ liệu**: Bắt buộc phải chạy sao lưu `pg_dump` và thực hiện `dry-run` liệt kê bản ghi trước khi xóa dữ liệu seed/test.
* **Bảo vệ tài khoản người dùng**:
  * **Bảo vệ tuyệt đối**: ID `1`, `3`, `5`, `5035`. Tuyệt đối không xóa.
  * **Tạm giữ, chờ chủ dự án duyệt**: ID `2`, `7`, `8`, `21`, `22` (không bảo vệ vĩnh viễn, chỉ xóa khi có lệnh phê duyệt cụ thể).

### 2.6. Bản quyền & Tài liệu Nguồn mở (OER)
* **Nghiêm cấm cào tài liệu có bản quyền** (giáo trình xuất bản, đề thi có bản quyền).
* **Chỉ nhập tài liệu thuộc Whitelist 4 giấy phép mở**: `CC0`, `CC-BY`, `CC-BY-SA`, `Public Domain`. Loại bỏ hoàn toàn `MIT` (dành cho mã nguồn) và `OpenStax-License` (không chuẩn). Nghiêm cấm nhập các tài liệu chứa điều khoản phi thương mại `NC` (như phần lớn MIT OCW `CC BY-NC-SA` gây rủi ro pháp lý với mô hình có gói hội viên trả phí). Mỗi tài liệu phải lưu và hiển thị rõ ràng: `source_url`, `license`, `author`, `imported_at`.
* Tài liệu tải lên mặc định là riêng tư. Muốn chia sẻ công khai phải xác nhận cam kết bản quyền.

### 2.7. Quan hệ bạn bè & Nhắn tin riêng tư
* **Bảo mật tin nhắn riêng**: Chỉ những người dùng đã là bạn bè (`friendships.status = 'accepted'`) mới được nhắn tin riêng.
* **Kiểm tra ở server**: Kiểm tra quyền nghiêm ngặt tại backend service/controller. Không cho phép người lạ nhắn tin cho nhau; không để nút nhắn tin trực tiếp trên khu vực bài đăng công khai.

### 2.8. Ngôn ngữ & Bản địa hóa
* **100% tiếng Việt**: Toàn bộ chữ hiển thị trên giao diện (tiêu đề, nhãn, nút bấm, toast, thông báo, modal, placeholder, empty state) phải bằng tiếng Việt với thuật ngữ nhất quán.
