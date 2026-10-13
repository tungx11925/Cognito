---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - 'docs/phase0-survey.md'
workflowType: 'epics-and-stories'
project_name: 'Cognito'
user_name: 'Tu'
date: '2026-10-13'
status: 'complete'
version: '1.4.0'
---

# Cognito - Epic and Story Breakdown

## Overview

Tài liệu này cung cấp danh mục phân rã toàn diện các Epic và User Story cho dự án **Cognito (EduShare AI)**, chuyển hóa các yêu cầu từ [PRD v1.2.1](file:///d:/Ky_7/EXE101/Cognito/_bmad-output/planning-artifacts/prd.md), [UX Design Specification](file:///d:/Ky_7/EXE101/Cognito/_bmad-output/planning-artifacts/ux-design-specification.md), và [Architecture Solution Design v1.2.0](file:///d:/Ky_7/EXE101/Cognito/_bmad-output/planning-artifacts/architecture.md) thành các câu chuyện người dùng có thể thực thi độc lập, có tiêu chí nghiệm thu (Acceptance Criteria) đo lường được và hỗ trợ đầy đủ 4 trạng thái giao diện (*Loading, Empty, Error, Dark Mode*).

---

## Requirements Inventory

### Functional Requirements

* **FR-1**: Hệ thống Design Token Toàn diện & Bảng Màu Tối Ấm (`design-tokens.css`, warm dark `#161916`, 12 semantic tokens, ngưỡng tương phản WCAG AA: chữ thường ≥ 4.5:1, chữ lớn/icon/viền ≥ 3.0:1).
* **FR-2**: Bộ UI Component Dùng Chung & Ma trận Trạng thái Chuẩn (14 components tại `frontend/src/components/common/`, 5 biến thể Button, đủ 4 trạng thái Loading/Empty/Error/Dark).
* **FR-3**: Cấu trúc Layout Toàn Cục & Điều hướng Navbar / Footer (Kế thừa từ FR1 & FR11 gốc: `AppLayoutWrapper` tập trung Navbar, thí điểm `/notes` và `/community`, Dropdown "Góc học tập" 5 mục, Footer ở `AppLayout`, loại bỏ Footer ở `WorkspaceLayout`).
* **FR-4a**: Quy trình Sao lưu & Kiểm kê Thử nghiệm Dry-Run Chỉ Đọc (Sao lưu vật lý `docker exec -i myproject-postgres pg_dump -U tu cognito`, kiểm tra cấu trúc, chạy dry-run chỉ đọc xuất danh sách ID cụ thể & Cloudinary public_ids, dừng ABORT nếu ID 1, 3, 5, 5035; cảnh báo vàng tách riêng ID 2, 7, 8, 21, 22; chạy sớm sau Epic 4).
* **FR-4b**: Quy trình Xóa Dữ liệu Thử nghiệm Có Phê Duyệt Thủ Công (Chỉ chạy sau khi Chủ dự án duyệt danh sách ID cụ thể từ dry-run và sau khi đã đo baseline; xóa an toàn trong Transaction `WHERE id IN (...)` không dùng `LIKE`; chạy lại script đếm sau xóa để đối chiếu; chạy trước Epic 7).
* **FR-5**: Trang chủ / Landing Page (Kế thừa từ FR10 gốc: font Playfair Display, gạch thẳng mint, 5 khối bento công cụ trong Góc học tập, showcase 6 bộ thẻ thật từ API, Bảng giá, FAQ, khu "Tiếp tục học").
* **FR-6**: Cộng đồng Học tập (Kế thừa từ FR5 gốc: 2 Tab "Flashcard chia sẻ" và "Tài liệu cộng đồng"; cột `is_community_published` đã có sẵn trong DB; điều kiện hiển thị: `visibility = 'public' AND is_community_published = true AND (copyright_confirmed = true OR admin_approved_at IS NOT NULL)`; 13 tài liệu cũ đang public bị ẩn cho tới khi chủ xác nhận hoặc admin duyệt; tab có EmptyState rõ ràng khi chưa có tài liệu được duyệt; gỡ bỏ 100% nút nhắn tin người lạ; nút báo cáo vi phạm).
* **FR-7**: Trình đọc Tài liệu & Trợ lý AI (Kế thừa từ FR2 gốc: Strategy render đa định dạng, inline Markdown bằng `react-markdown` khi `doc_url` null, ErrorState thoát hiểm có nút thử lại/báo lỗi/quay lại, triệt tiêu khung trắng; bao gồm cả `/viewer/[id]` và `/shared/[token]`).
* **FR-8**: Sổ tay Ghi chú (`/notes`) (`WorkspaceLayout` không Footer, trình soạn thảo Markdown không bật `rehype-raw`, tự động lưu, EmptyState).
* **FR-9**: Sơ đồ Tư duy (`/mindmap`) (`WorkspaceLayout` không Footer, đồ thị Mermaid SVG tương tác zoom/pan, Dark mode nền `#161916` viền mint, bắt lỗi cú pháp thân thiện).
* **FR-10**: Kho Tài liệu Cá nhân (`/library`) (Kế thừa từ FR3 gốc: `AppLayout`, tải file < 10MB lên Cloudinary, lưu trữ metadata OER và visibility có sẵn, hiển thị trạng thái cam kết bản quyền của tài liệu).
* **FR-11**: Đề thi & Trắc nghiệm AI (`/quiz` & `/ai-test`) (Tách thành 2 story UI: danh sách đề thi `/quiz` và phòng thi trắc nghiệm tập trung `/quiz/[testSetId]`; khung `max-w-4xl`, highlight đáp án xanh rừng, lưu điểm vào DB và tab Lịch sử học tại `/progress`).
* **FR-12**: Phòng Tập trung Pomodoro (`/focus`) (`WorkspaceLayout` toàn màn hình buồng tối `#121412`, vòng đếm ngược xanh mint sáng, đồng bộ phiên tập trung).
* **FR-13**: Tiến độ & Lịch sử Học tập (`/progress`) (`AppLayout`, Tab Tiến độ và Tab Lịch sử, nhận chuyển hướng HTTP 308 từ `/study-sessions` cũ kèm bảo toàn query string).
* **FR-14**: Bạn bè & Hộp thư Tin nhắn Riêng (`/friends` & `/messages`) (Kế thừa từ FR8 & FR9 gốc: chỉ bạn bè `accepted` mới mở chat mới; Phương án A cho tin cũ: chỉ đọc + nút "Gửi lời mời kết bạn" 1-click; chặn `user_blocks` trả 403; báo cáo vi phạm).
* **FR-15**: Tìm kiếm Toàn cầu Đa Đối tượng (`/search`) (`AppLayout`, debounce 300ms, bộ lọc đa đối tượng Tài liệu, Flashcard, Đề thi, Bạn bè).
* **FR-16**: Hồ sơ Cá nhân & Người dùng Công khai (`/profile`) (`AppLayout`, phân quyền chủ sở hữu/khách, thống kê thành tích).
* **FR-17**: Cài đặt Tài khoản & Giao diện (`/settings`) (`AppLayout`, chuyển theme Sáng/Tối ấm tức thì không reload, đổi mật khẩu an toàn).
* **FR-18**: Gói Hội viên Premium & Thanh toán PayOS (`/premium`) (Ngoài phạm vi MVP; giữ nguyên 100% logic backend PayOS, chỉ áp token UI màu hổ phách `var(--color-premium)`).
* **FR-19**: Xác thực Người dùng: Đăng ký, Đăng nhập & Đặt lại MK (Modal auth, trang `/reset-password` dùng `AppLayout` CÓ Footer, thông báo tiếng Việt, bcryptjs, rate limit).
* **FR-20**: Bộ Thẻ Ghi Nhớ Flashcards & Ôn tập SM-2 (`/flashcards`) (Lật thẻ 3D, Spaced Repetition SM-2, clone bộ thẻ công khai với `source_deck_id ON DELETE SET NULL` và ghi công tác giả; chặn 403 nếu clone bộ thẻ riêng tư; có story riêng cho `/flashcards/new` và `/flashcards/[deckId]/edit`).
* **FR-21**: Quản lý Bản quyền & Nhập liệu Nguồn mở OER (Kế thừa từ FR6 & FR7 gốc: Whitelist 4 giấy phép `CC0`, `CC-BY`, `CC-BY-SA`, `Public Domain`; loại bỏ MIT và OpenStax-License; không dùng MIT OCW do rủi ro điều khoản NC; so khớp license bằng parser chuẩn hóa; test duyệt 11 tài liệu, từ chối/cảnh báo ID 10282; không cần story điền nguồn thủ công vì 12 doc đã có link/license; quy trình chủ tài liệu xác nhận và Admin duyệt qua `admin_approved_at/by` kèm ghi log vào `moderation_logs`; script idempotent lưu `source_url`, `license`, `author`, `imported_at`).

---

### NonFunctional Requirements

* **NFR-1**: Hiệu năng & Tốc độ tải: FCP ≤ 1.5s, CLS ≤ 0.05 là mục tiêu đề xuất, cần đo baseline trước, không phải ngưỡng cứng.
* **NFR-2**: Khả năng tiếp cận WCAG 2.1 AA (Ngưỡng tương phản: chữ thường ≥ 4.5:1, chữ lớn/icon/viền ≥ 3.0:1 cả Sáng và Tối ấm; focus ring; 100% icon có `aria-label` tiếng Việt).
* **NFR-3**: Bảo mật & Phân quyền (JWT Auth Access 15m/Refresh 7d; kiểm tra quyền chặt chẽ tại tầng Service).
* **NFR-4**: Tính toàn vẹn Dữ liệu (Mọi thay đổi DB qua `node-pg-migrate`, bắt buộc tuân thủ quy trình 5 bước: backup, up, verify, down trên DB tạm/restore, up lại).
* **NFR-5**: Bản địa hóa 100% Tiếng Việt (Không trộn lẫn tiếng Anh trong UI, nhãn nút, placeholder, toast thông báo).
* **NFR-6**: Phòng chống Lỗ hổng, XSS & Content Security Policy (Khởi đầu bằng `Content-Security-Policy-Report-Only`, whitelist đầy đủ Next.js, Framer Motion, Mermaid, Cloudinary, Google OAuth; chuyển chế độ chặn chỉ sau khi Tu duyệt; tin nhắn render Text thuần `<span>{content}</span>`; Markdown qua `react-markdown` KHÔNG bật `rehype-raw`).
* **NFR-7**: Giới hạn Tần suất Truy cập (Dùng thư viện có sẵn `express-rate-limit` ^8.7.0 hoặc code thuần: Auth 5 lần/15m; AI 10 req/m; Chat 30 req/m; Reports 5 req/10m).
* **NFR-8**: Độ tin cậy & Retry Backoff (Exponential backoff kèm jitter chỉ áp dụng cho thao tác ĐỌC/IDEMPOTENT; TUYỆT ĐỐI KHÔNG retry tạo thanh toán PayOS để tránh trùng đơn; bắt lỗi try/catch không sập tiến trình).
* **NFR-9**: Bảo toàn Tuyến đường & Chuyển hướng URL (Cấu hình chuyển hướng HTTP 308 từ `/study-sessions` sang `/progress?tab=history`, bảo toàn toàn bộ query parameters).

---

### Additional Requirements (Từ Kiến Trúc Kỹ Thuật v1.2.0 & Chỉ Đạo Chủ Dự Án)

* **AR-1 (Zero New Libraries):** Giữ nguyên stack (Next.js 14, Express TS, `pg` thuần, `node-pg-migrate`); tận dụng thư viện ĐÃ CÓ trong `package.json` (như `express-rate-limit` ^8.7.0); nếu phát sinh nhu cầu thư viện mới phải ghi "chờ duyệt" và chờ Tu phê duyệt trước khi cài.
* **AR-2 (Database Migrations Có Rollback & Quy Trình 5 Bước Bắt Buộc):**
  * Áp dụng quy trình 5 bước (`backup` bảng qua container `myproject-postgres`, `up`, `verify`, `down` trên DB tạm/bản restore từ backup, `up` lại) cho toàn bộ các story migration (`Story 4.3`, `Story 5.4a`, `Story 5.5a`, `Story 6.1`, `Story 6.2`).
  * `friendships`: Migration sao lưu bảng, in danh sách gộp/xóa dedupe, giữ nguyên tên cột `user_id` / `friend_id` (coi requester = `user_id`, addressee = `friend_id`), tạo `UNIQUE INDEX idx_friendships_unique_pair ON (LEAST(user_id, friend_id), GREATEST(user_id, friend_id))`. Bỏ `'blocked'`, chỉ giữ `('pending', 'accepted')`. Tạo chỉ mục tìm kiếm `idx_friendships_user_status` và `idx_friendships_friend_status`. Rà soát grep toàn bộ mã nguồn đụng bảng friendships và chạy test hồi quy `/profile` trước và sau migration. Có script `down` đối xứng.
  * `messages`: Thêm `receiver_id` và `read_at`. Backfill `receiver_id` từ `conversation_members` và `conversations`. Chọn `read_at TIMESTAMPTZ` làm nguồn chân lý duy nhất, đồng bộ ngược với `is_read`. Có script `down` đối xứng.
  * `documents`: Thêm các cột: `copyright_confirmed BOOLEAN DEFAULT false`, `imported_at TIMESTAMPTZ`, `admin_approved_at TIMESTAMPTZ`, `admin_approved_by INTEGER REFERENCES users(id)`. Dữ liệu cũ nhận `copyright_confirmed = false`. Có script `down` đối xứng.
  * `content_reports`: Nâng cấp CHECK `target_type IN ('resource', 'comment', 'user', 'message', 'deck', 'document')` có script `up`/`down` riêng biệt đối xứng.
  * `flashcard_decks`: Bổ sung `source_deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE SET NULL`, `original_author_name VARCHAR(255)` có script `up`/`down` riêng biệt đối xứng.
* **AR-3 (Phân Quyền Tầng Dịch Vụ - Service-Level Authorization):**
  * `MessageService.sendMessage`: Kiểm tra `user_blocks` trước (403), kiểm tra bạn bè `friendships` `accepted` (403). Khi chặn: xóa `friendships`, hủy lời mời pending, ghi vào `user_blocks`.
  * Flashcard Clone: Chỉ cho phép clone bộ thẻ public chưa gỡ; bộ thẻ private trả về **HTTP 403 Forbidden**.
* **AR-4 (Smart Polling Phân Tầng):**
  * Active chat polling: 3–5s khi tab chat hiển thị (`document.visibilityState === 'visible'`).
  * Unread count Navbar: Tuyến riêng `GET /api/messages/unread-count` chạy chu kỳ độc lập 30–60s.
* **AR-5 (Chuẩn Hóa Component & Dọn Dẹp File Rác):**
  * Chốt duy nhất một thư mục component dùng chung: `frontend/src/components/common/`.
  * Dọn dẹp các file rác sau khi xác nhận không còn nơi import: `frontend/src/components/Button.tsx`, `Navbar.tsx` rác.
  * Kiểm tra tĩnh Grep: Cấm triệt để 4 mã màu xanh cũ (`#1a2e1c`, `#0D2B24`, `#1a3a2a`, `#143828`), cấm `#1a3d28` ngoài `design-tokens.css`, quét cả mã hex mint và các token khác ngoài `design-tokens.css`, cấm `dark:text-emerald-*`, `dark:bg-emerald-*`.
  * `WorkspaceLayout` tính chiều cao theo công thức `h-[calc(100vh-var(--navbar-height))]` (`overflow-hidden`, 100% không Footer); biến `--navbar-height` lấy từ việc **đo Navbar thực tế khi làm story layout**, giá trị `3.5rem` chỉ là giá trị khởi đầu đề xuất.
* **AR-6 (Đo Baseline Kỹ Thuật Trước Nghiệm Thu):** Đo đạc và lập file `docs/baseline-metrics.md` **ngay tại Story 1.0 (trước mọi thay đổi UI)** để làm mốc đối chiếu xuyên suốt toàn bộ dự án.

---

### UX Design Requirements (Từ UX Design Specification)

* **UX-DR1 (Hệ Thống Token CSS & Dark Mode Ấm):** `design-tokens.css` định nghĩa đầy đủ 12 token và biến `--navbar-height`, nền than ấm `#161916`, card than ấm `#1F2420`, text chính `#EDECE6`, text phụ `#9E9E96`, viền `#2A2F2A`, primary dark `#2D6A4F`.
* **UX-DR2 (Bộ 14 Core Components Dùng Chung):** Đặt tại `frontend/src/components/common/`: `Button`, `Badge`, `Card`, `Tabs`, `Input`, `Select`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Avatar`, `ProgressBar`, `PageHeader`. Đầy đủ 4 trạng thái Loading, Empty, Error, Dark.
* **UX-DR3 (Bố Cục Kép AppLayout vs WorkspaceLayout):** `AppLayoutWrapper` chứa Navbar tập trung; `AppLayout` có Footer ở 11 màn hình (gồm cả `/reset-password` và `/shared/[token]`); `WorkspaceLayout` toàn màn hình không Footer cho 6 không gian làm việc (`/viewer/*`, `/focus`, `/notes`, `/mindmap`, `/messages`, `/admin/*`).
* **UX-DR4 (Typography & Điểm Nhấn Thương Hiệu):** Tiêu đề dùng font Serif `Playfair Display`, điểm nhấn là đường gạch thẳng màu mint (`#BFEAD6`), nội dung dùng `Inter`.
* **UX-DR5 (Thanh Điều Hướng Toàn Diện):** Navbar hiển thị active state chuẩn; mobile drawer (< 768px) hiển thị 12 mục; Dropdown "Góc học tập" gồm 5 mục (Tài liệu, Đề thi & Trắc nghiệm, Ghi chú, Sơ đồ tư duy, Thẻ ghi nhớ); Chuông thông báo và badge tin nhắn chưa đọc.
* **UX-DR6 (Đồng Bộ 17 Màn Hình Giao Diện):** Áp dụng thiết kế bento card bo góc 16-20px, bóng nhẹ, viền mảnh, vi chuyển động Framer Motion mượt mà trên toàn bộ 17 tuyến đường UI (bao gồm `/viewer/[id]`, `/shared/[token]`, `/flashcards/new`, `/flashcards/[deckId]/edit`, `/quiz`, `/quiz/[testSetId]`).

---

### FR Coverage Map

| Yêu Cầu FR | Story Ánh Xạ | Mô Tả Trách Nhiệm Phân Rã |
| :--- | :--- | :--- |
| **FR-1** | **Story 1.1, Story 1.3** | Xây dựng token CSS light+dark, đo biến `--navbar-height`, kiểm tra tĩnh grep cấm màu cũ |
| **FR-2** | **Story 1.2** | Xây dựng 14 Core UI Components dùng chung tại `frontend/src/components/common/` |
| **FR-3** | **Story 2.1..2.5, Story 3.1** | `AppLayoutWrapper` tập trung Navbar, thí điểm `/notes` + `/community`, Footer phân tầng, Dropdown "Góc học tập" 5 mục |
| **FR-4a**| **Story FR-4a** | Sao lưu vật lý `pg_dump -i` & script dry-run chỉ đọc xuất danh sách ID cụ thể và Cloudinary public_ids (chạy sau Epic 4) |
| **FR-4b**| **Story FR-4b** | Thực thi xóa dữ liệu thử nghiệm trong Transaction `WHERE id IN (...)` sau khi Chủ dự án duyệt danh sách ID (chạy trước Epic 7) |
| **FR-5** | **Story 7.1..7.4** | Landing Page chuẩn typography Playfair Display, 5 bento công cụ, showcase thẻ thật, bảng giá, FAQ, tiếp tục học |
| **FR-6** | **Story 5.1, 5.2, 5.4, 5.7**| Cộng đồng học thuật: 2 tab, lọc bản quyền, chủ tài liệu xác nhận, ẩn doc cũ, báo cáo vi phạm, gỡ nút nhắn lạ |
| **FR-7** | **Story 4.0, 4.1, 4.2, Story 8.14** | Trình đọc tài liệu Viewer `/viewer/[id]`, render inline Markdown khi `doc_url` null, `ErrorState`, trang `/shared/[token]` |
| **FR-8** | **Story 8.3** | Giao diện Sổ tay Ghi chú (`/notes`): `WorkspaceLayout` không Footer, an toàn XSS, 4 trạng thái |
| **FR-9** | **Story 8.4** | Giao diện Sơ đồ Tư duy (`/mindmap`): `WorkspaceLayout` không Footer, Mermaid SVG dark mode, 4 trạng thái |
| **FR-10**| **Story 4.3, 4.4, Story 8.1** | Schema tài liệu, validation upload < 10MB (Epic 4); UI Thư viện cá nhân `/library` (Epic 8) |
| **FR-11**| **Story 8.2a, Story 8.2b** | Giao diện Danh sách đề thi `/quiz` & Phòng thi trắc nghiệm tập trung `/quiz/[testSetId]`: Khung `max-w-4xl`, 4 trạng thái |
| **FR-12**| **Story 8.6** | Giao diện Phòng Pomodoro (`/focus`): `WorkspaceLayout` buồng tối `#121412`, 4 trạng thái |
| **FR-13**| **Story 3.2, 3.3, Story 8.7** | Tách tab Lịch sử học & Redirect 308 từ `/study-sessions` (Epic 3); UI biểu đồ tiến độ `/progress` (Epic 8) |
| **FR-14**| **Story 6.1..6.6** | Bạn bè & Tin nhắn: Friendships vô hướng, Phương án A cho tin cũ + nút kết bạn 1-click, chặn 403, Smart Polling |
| **FR-15**| **Story 8.8** | Trang tìm kiếm toàn sàn đa đối tượng `/search` (4 trạng thái) |
| **FR-16**| **Story 8.9** | Giao diện Hồ sơ Cá nhân (`/profile` & `/profile/[userId]`): Phân quyền chủ sở hữu/khách, 4 trạng thái |
| **FR-17**| **Story 8.10** | Giao diện Cài đặt (`/settings`): Theme switcher tức thì không reload, đổi mật khẩu, 4 trạng thái |
| **FR-18**| **Story 8.11** | Giao diện Gói Premium (`/premium`): Giữ 100% backend PayOS, chỉ áp token UI màu hổ phách, 4 trạng thái |
| **FR-19**| **Story 8.12** | Giao diện Xác thực (Modal Auth & `/reset-password` CÓ Footer): Tiếng Việt 100%, 4 trạng thái |
| **FR-20**| **Story 5.5, 5.5a, 8.5, 8.5a, 8.5b**| Clone bộ thẻ public (Epic 5); UI Flashcards SM-2 (`/flashcards`), Tạo mới (`/flashcards/new`), Sửa (`/flashcards/[deckId]/edit`) |
| **FR-21**| **Story 5.3, Story 5.6** | Parser chuẩn hóa khớp giấy phép OER (duyệt 11, từ chối/cảnh báo 10282, ghi log); Script nạp OER idempotent |
| **Admin** | **Story 8.13** | Cổng Quản trị Viên (`/admin/*`): `WorkspaceLayout` không Footer, duyệt báo cáo & bản quyền, 4 trạng thái |

---

### NFR Coverage Map

| Yêu Cầu NFR | Story Ánh Xạ | Cơ Chế Triển Khai & Kiểm Chứng |
| :--- | :--- | :--- |
| **NFR-1** (Hiệu năng) | **Story 1.0, Story 9.5** | Đo FCP, CLS, latency baseline tại Story 1.0; đo nghiệm thu đối chiếu tại Story 9.5 |
| **NFR-2** (Tiếp cận) | **Story 1.1, 1.2, 9.5** | Tương phản WCAG AA (≥ 4.5:1), focus ring trên 14 components, 100% icon có `aria-label` tiếng Việt |
| **NFR-3** (Phân quyền) | **Story 6.3, 5.5, 9.1, 9.2** | JWT tầng Service, chặn 403 chat người lạ / bị block, chặn 403 clone bộ thẻ private |
| **NFR-4** (Tính toàn vẹn) | **Story 4.3, 5.4a, 5.5a, 6.1, 6.2, 9.3**| Quy trình 5 bước bắt buộc: backup bảng, up, verify, test down trên DB tạm/restore, up lại |
| **NFR-5** (Bản địa hóa) | **Toàn bộ Story Epic 7 & 8** | 100% chuỗi UI, thông báo, nhãn nút, empty/error state sử dụng tiếng Việt chuẩn mực |
| **NFR-6** (An toàn & CSP)| **Story 1.4, Story 4.1, 6.5** | Cấu hình `Content-Security-Policy-Report-Only` (Next.js, Framer Motion, Mermaid, Cloudinary, Google OAuth); cấm `rehype-raw`; chat text thuần |
| **NFR-7** (Rate Limit) | **Story 6.7** | Sử dụng thư viện có sẵn `express-rate-limit` ^8.7.0 (Auth 5 lần/15m, AI 10 req/m, Chat 30 req/m, Reports 5 req/10m) |
| **NFR-8** (Retry Backoff) | **Story 4.5** | Retry backoff kèm jitter chỉ áp dụng cho thao tác ĐỌC/IDEMPOTENT; TUYỆT ĐỐI KHÔNG retry tạo thanh toán PayOS |
| **NFR-9** (Chuyển hướng) | **Story 3.3, Story 9.4** | Chuyển hướng HTTP 308 từ `/study-sessions` sang `/progress?tab=history` bảo toàn 100% query string |

---

## Thứ Tự Triển Khai Tổng Thể (Execution Order)

```
[Epic 1: Design System (Story 1.0 Baseline -> 1.1 Tokens -> 1.2 Components -> 1.3 Grep -> 1.4 CSP Report-Only)]
   ↓
[Epic 2: Layout Toàn Cục & Navbar/Footer (Story 2.1 -> 2.2 Thí điểm -> 2.3 Gỡ Navbar -> 2.4 Footer -> 2.5 Dọn rác)]
   ↓
[Epic 3: Điều Hướng, Dropdown Góc Học Tập 5 Mục & Redirect 308 (Story 3.1 -> 3.2 -> 3.3)]
   ↓
[Epic 4: Viewer, ErrorState, Schema Documents & Retry (Story 4.0 -> 4.1 -> 4.2 -> 4.3 Migration 5 bước -> 4.4 Upload -> 4.5 Retry)]
   ↓
[Story FR-4a: Sao lưu vật lý pg_dump & Dry-Run Kiểm Kê Dữ Liệu Rác (Chỉ đọc)]
   ↓
[Epic 5: Cộng Đồng, Bản Quyền & Nguồn Mở OER (Story 5.1 -> 5.2 -> 5.3 Duyệt/Parse OER -> 5.4 Reports -> 5.4a Migration Reports -> 5.5 Clone -> 5.5a Migration Decks -> 5.6 Nạp OER -> 5.7 Gỡ nút chat)]
   ↓
[Epic 6: Bạn Bè, Tin Nhắn Riêng Tư & Rate Limiting (Story 6.1 Migration 5 bước -> 6.2 Migration 5 bước -> 6.3 Phân quyền -> 6.4 Quản lý bạn -> 6.5 Hộp thư -> 6.6 Smart Polling -> 6.7 Rate Limiting)]
   ↓
[Story FR-4b: Xóa Thật Dữ Liệu Rác Trong Transaction (Sau khi Chủ dự án duyệt danh sách ID)]
   ↓
[Epic 7: Landing Page & Hệ Sinh Thái Dữ Liệu Thật (Story 7.1 -> 7.2 -> 7.3 -> 7.4)]
   ↓
[Epic 8: Chuẩn Hóa UI 17 Tuyến Tuyến Màn Hình (Story 8.1 Library -> 8.2a Quiz -> 8.2b Phòng thi -> 8.3 Notes -> 8.4 Mindmap -> 8.5 Flashcards -> 8.5a Tạo thẻ -> 8.5b Sửa thẻ -> 8.6 Focus -> 8.7 Progress -> 8.8 Search -> 8.9 Profile -> 8.10 Settings -> 8.11 Premium -> 8.12 Auth -> 8.13 Admin -> 8.14 Shared Viewer)]
   ↓
[Epic 9: Kiểm Thử QA, Đối Chiếu Baseline & Báo Cáo Nghiệm Thu (Story 9.1 -> 9.2 -> 9.3 Migration 5 bước -> 9.4 Redirect 308 -> 9.5 Nghiệm thu Before/After)]
```

---

## Chi Tiết Các Epic & User Story (Chi Tiết Từng Story)

---

## Epic 1: Design System & Core UI Foundation

**Mục tiêu Epic 1:** Thiết lập bộ chỉ số Baseline kỹ thuật ban đầu, xây dựng hệ thống Design Token CSS chuẩn (Sáng & Tối ấm `#161916`), hoàn thiện bộ 14 Core Components dùng chung tại `frontend/src/components/common/` đạt chuẩn WCAG AA và đủ 4 trạng thái giao diện, cùng bộ quét tĩnh grep cấm màu xanh cũ và token nằm ngoài CSS.

### Story 1.0: Đo Đạc Bộ Chỉ Số Kỹ Thuật Baseline Ban Đầu (Chạy trước mọi thay đổi UI)
As a **Kỹ sư trưởng dự án**,  
I want **đo và lưu trữ toàn bộ chỉ số hiệu năng (FCP, CLS), độ trễ API và tỷ lệ lỗi mạng hiện tại vào `docs/baseline-metrics.md`**,  
So that **có mốc số liệu khách quan đối chiếu trước và sau khi thực hiện nâng cấp toàn diện hệ thống.**

**Tham chiếu:** NFR-1, AR-6.  
**Acceptance Criteria:**
* **Given** môi trường ứng dụng và cơ sở dữ liệu đang chạy bình thường,
* **When** thực thi kịch bản đo đạc baseline trên các trang `/`, `/library`, `/community`, `/auth`,
* **Then** hệ thống ghi nhận chính xác các chỉ số: FCP (giây), CLS, độ trễ API đăng nhập, độ trễ API câu hỏi, và tỷ lệ lỗi hiện tại vào file [baseline-metrics.md](file:///d:/Ky_7/EXE101/Cognito/docs/baseline-metrics.md).
* **And** tài liệu ghi nhận rõ: "FCP ≤ 1.5s, CLS ≤ 0.05 là mục tiêu đề xuất, cần đo baseline trước, không phải ngưỡng cứng."

### Story 1.1: Xây Dựng Hệ Thống Design Token CSS & Biến Thể Tối Ấm
As a **Nhà phát triển Frontend**,  
I want **file `frontend/src/styles/design-tokens.css` định nghĩa đầy đủ 12 semantic tokens cho chế độ Sáng và Tối ấm `#161916` cùng biến `--navbar-height`**,  
So that **toàn bộ giao diện Cognito loại bỏ hoàn toàn việc hardcode màu sắc ad-hoc.**

**Tham chiếu:** FR-1, UX-DR1, NFR-2.  
**Acceptance Criteria:**
* **Given** ứng dụng Next.js đang chạy,
* **When** mở `frontend/src/styles/design-tokens.css`,
* **Then** file chứa đủ 12 semantic tokens: `--color-bg`, `--color-card`, `--color-card-subtle`, `--color-border`, `--color-text-main`, `--color-text-muted`, `--color-primary`, `--color-primary-hover`, `--color-primary-fg`, `--color-mint-subtle`, `--color-mint-border`, `--color-premium`.
* **And** Light mode có `--color-primary: #1a3d28`, `--color-bg: #F4F2EC`. Dark mode có `--color-bg: #161916`, `--color-card: #1F2420`, `--color-primary: #2D6A4F`.
* **And** biến `--navbar-height` được khai báo ban đầu là `3.5rem` và cập nhật chính xác theo kích thước đo thực tế của Navbar.
* **And** các token đạt ngưỡng tương phản WCAG AA: chữ thường ≥ 4.5:1, chữ lớn/icon/viền ≥ 3.0:1 trên cả 2 chế độ.

### Story 1.2: Xây Dựng Bộ 14 Core UI Components Dùng Chung Tại `components/common/`
As a **Nhà phát triển Frontend**,  
I want **bộ 14 components chuẩn (`Button`, `Badge`, `Card`, `Tabs`, `Input`, `Select`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Avatar`, `ProgressBar`, `PageHeader`) tại `frontend/src/components/common/`**,  
So that **mọi trang chức năng tái sử dụng đồng bộ và hỗ trợ đủ 4 trạng thái giao diện.**

**Tham chiếu:** FR-2, UX-DR2, NFR-2, AR-5.  
**Acceptance Criteria:**
* **Given** thư mục `frontend/src/components/common/`,
* **When** kiểm tra từng component trong số 14 components,
* **Then** mỗi component hỗ trợ đầy đủ 4 trạng thái (*Loading, Empty, Error, Dark Mode*).
* **And** `Button` có 5 biến thể (`primary`, `secondary`, `ghost`, `premium`, `danger`); biến thể primary dùng nền `var(--color-primary)` với text trắng.
* **And** `EmptyState` hỗ trợ icon nét mảnh, tiêu đề, mô tả và nút CTA tiếng Việt.
* **And** `ErrorState` hỗ trợ thông báo lỗi, nút "Thử lại", "Báo lỗi" và "Quay lại" kích hoạt đúng callback.
* **And** 100% component có focus ring rõ ràng khi dùng phím `Tab` và icon có `aria-label` tiếng Việt.

### Story 1.3: Kiểm Tra Tĩnh Grep Cấm 4 Màu Xanh Cũ & Token Nằm Ngoài CSS
As a **Kỹ sư Đảm bảo Chất lượng (QA)**,  
I want **script kiểm tra tĩnh grep codebase quét mã hex và class lỗi thời**,  
So that **ngăn chặn tuyệt đối mã màu hardcode quay trở lại codebase.**

**Tham chiếu:** FR-1, AR-5.  
**Acceptance Criteria:**
* **Given** toàn bộ mã nguồn trong `frontend/src`,
* **When** chạy lệnh quét regex tĩnh:
  `grep -rE "(#1a2e1c|#0D2B24|#1a3a2a|#143828)" frontend/src`,
* **Then** kết quả trả về đúng 0 dòng vi phạm.
* **And** mã màu `#1a3d28` chỉ xuất hiện đúng 1 lần duy nhất trong `frontend/src/styles/design-tokens.css`.
* **And** không còn class `dark:text-emerald-*` hay `dark:bg-emerald-*` nào trong mã nguồn.
* **And** script quét cảnh báo các mã hex mint hoặc token ad-hoc xuất hiện ngoài file `design-tokens.css`.

### Story 1.4: Cấu Hình Content-Security-Policy-Report-Only (CSP) Cho Ứng Dụng
As a **Kỹ sư Bảo mật Ứng dụng**,  
I want **cấu hình tiêu đề HTTP `Content-Security-Policy-Report-Only` với danh sách nguồn tin cậy chuẩn xác**,  
So that **hệ thống giám sát vi phạm bảo mật và chuẩn bị chuyển sang chế độ chặn thực thi sau khi Chủ dự án phê duyệt.**

**Tham chiếu:** NFR-6, Architecture Quyết định 5.2.  
**Acceptance Criteria:**
* **Given** cấu hình Next.js middleware / headers (`next.config.js`),
* **When** người dùng tải bất kỳ trang nào của ứng dụng,
* **Then** phản hồi HTTP trả về header `Content-Security-Policy-Report-Only` (tuyệt đối KHÔNG chặn hoạt động giao diện khi chưa duyệt).
* **And** chính sách CSP bao gồm đầy đủ các nguồn cần thiết:
  - Script & Eval: `'self'`, `'unsafe-eval'` (dev/hydrate), `'unsafe-inline'`, `https://accounts.google.com`, `https://apis.google.com`.
  - Style: `'self'`, `'unsafe-inline'`, `https://fonts.googleapis.com` (phục vụ Framer Motion và Google Fonts).
  - Images & Media: `'self'`, `data:`, `blob:`, `https://res.cloudinary.com`, `https://lh3.googleusercontent.com`, `https://*.googleusercontent.com`.
  - Worker & SVG: `'self'`, `blob:` (phục vụ Mermaid.js và PDF preview).
  - Connect & API: `'self'`, `http://localhost:5000`, `ws://localhost:3000`, `https://accounts.google.com`, `https://api.payos.vn`, `https://api.cloudinary.com`.
  - Frame & Embed: `'self'`, `https://accounts.google.com`, `https://pay.payos.vn`, `blob:`.
* **And** hệ thống ghi nhận quy tắc: "Chỉ chuyển sang chế độ chặn (`Content-Security-Policy` enforcing) sau khi Chủ dự án (Tu) trực tiếp duyệt báo cáo telemetry."

---

## Epic 2: Layout Toàn Cục & Chuẩn Hóa Khung Điều Hướng

**Mục tiêu Epic 2:** Triển khai `AppLayoutWrapper` quản lý Navbar và Footer tập trung; thí điểm gỡ Navbar cục bộ trên `/notes` và `/community` có bước xác nhận kiểm tra không trùng Navbar; gỡ Navbar cục bộ trên các trang còn lại; đảm bảo Footer chỉ xuất hiện ở `AppLayout` và biến mất ở `WorkspaceLayout`; dọn dẹp các file component rác sau khi xác nhận.

### Story 2.1: Triển Khai `AppLayoutWrapper` Tập Trung & Bố Cục Kép Phân Tầng
As a **Người dùng nền tảng**,  
I want **thanh điều hướng Navbar cố định ở đỉnh trang và Footer chỉ hiển thị ở các trang phù hợp**,  
So that **tôi có trải nghiệm điều hướng nhất quán mà không bị che khuất không gian làm việc chuyên sâu.**

**Tham chiếu:** FR-3, UX-DR3.  
**Acceptance Criteria:**
* **Given** ứng dụng Next.js,
* **When** truy cập vào bất kỳ tuyến đường nào,
* **Then** `AppLayoutWrapper` tự động phân loại layout:
  - Tuyến đường `WorkspaceLayout` (`/viewer/*`, `/focus`, `/notes`, `/mindmap`, `/messages`, `/admin/*`): Render Navbar ở đỉnh, chiều cao nội dung `h-[calc(100vh-var(--navbar-height))]` (`overflow-hidden`), và **100% không render thẻ Footer**.
  - Tuyến đường `AppLayout` (Trang chủ, Thư viện, Đề thi, Tiến độ, v.v.): Render Navbar ở đỉnh, container giới hạn độ rộng, và CÓ Footer ở chân trang.
* **And** hỗ trợ chuyển đổi mượt mà giữa chế độ Sáng và Tối ấm.

### Story 2.2: Thí Điểm Gỡ Navbar Cục Bộ Trên `/notes` và `/community` (Có bước xác nhận)
As a **Nhà phát triển Frontend**,  
I want **thí điểm gỡ bỏ Navbar cục bộ trên 2 trang `/notes` và `/community`**,  
So that **xác nhận không còn lỗi giật màn hình hoặc 2 Navbar trùng nhau trước khi mở rộng toàn sàn.**

**Tham chiếu:** FR-3, AR-5.  
**Acceptance Criteria:**
* **Given** trang `/notes` và `/community`,
* **When** gỡ bỏ lệnh import `<Navbar />` cục bộ bên trong page component và để `AppLayoutWrapper` quản lý,
* **Then** kiểm tra DOM xác nhận đúng 1 thẻ `<nav>` duy nhất tồn tại trên trang.
* **And** không còn khoảng đệm padding `pt-20` bị giật khi tải trang.
* **And** có bước dừng để Chủ dự án kiểm tra và xác nhận trực quan thành công trước khi áp dụng tiếp.

### Story 2.3: Gỡ Bỏ Navbar Cục Bộ Trên Các Trang Còn Lại Trong Cùng Lần Sửa
As a **Nhà phát triển Frontend**,  
I want **gỡ bỏ import Navbar cục bộ trên toàn bộ các trang còn lại**,  
So that **toàn bộ hệ thống 100% sử dụng Navbar từ `AppLayoutWrapper`.**

**Tham chiếu:** FR-3, AR-5.  
**Acceptance Criteria:**
* **Given** các trang chức năng còn lại (`/`, `/library`, `/quiz`, `/focus`, `/progress`, `/search`, `/profile`, `/settings`, `/premium`, `/admin`),
* **When** rà soát và gỡ bỏ Navbar cục bộ (thực hiện trong cùng lần sửa của từng trang),
* **Then** 100% các trang không còn tự import Navbar riêng lẻ.
* **And** không có bất kỳ trang nào xuất hiện 2 Navbar trùng nhau.

### Story 2.4: Chuẩn Hóa Chân Trang Footer & Trang Pháp Lý / Hỗ Trợ
As a **Khách truy cập & Học viên**,  
I want **chân trang Footer chuẩn hiển thị bản quyền, liên kết điều khoản và trang chính sách**,  
So that **tôi dễ dàng tìm hiểu thông tin pháp lý và nhận hỗ trợ khi cần thiết.**

**Tham chiếu:** FR-3, UX-DR3.  
**Acceptance Criteria:**
* **Given** người dùng ở các trang `AppLayout` (bao gồm cả `/reset-password`),
* **When** cuộn xuống cuối trang,
* **Then** Footer hiển thị logo Cognito, thông tin bản quyền, và các liên kết: Điều khoản dịch vụ (`/terms`), Chính sách bảo mật (`/privacy`), Trợ giúp (`/help`).
* **And** giao diện Footer tương thích hoàn toàn với nền tối ấm `#161916` (chữ phụ `#9E9E96`, viền `#2A2F2A`).

### Story 2.5: Dọn Dẹp Component Rác Sau Khi Xác Nhận Không Còn Nơi Import
As a **Kỹ sư Phần mềm**,  
I want **xóa bỏ file `frontend/src/components/Button.tsx` (nút xanh cũ) và các file Navbar rác**,  
So that **codebase sạch sẽ, không gây nhầm lẫn khi phát triển tiếp.**

**Tham chiếu:** FR-2, AR-5.  
**Acceptance Criteria:**
* **Given** việc chuẩn hóa component đã hoàn tất,
* **When** chạy lệnh kiểm tra import đối với `frontend/src/components/Button.tsx` và file Navbar rác,
* **Then** xác nhận 0 nơi nào còn import các file này.
* **And** tiến hành xóa bỏ các file rác an toàn khỏi thư mục mã nguồn.

---

## Epic 3: Hệ Thống Điều Hướng Mở Rộng, Dropdown & Bảo Toàn Tuyến Đường

**Mục tiêu Epic 3:** Xây dựng Dropdown "Góc học tập" 5 mục trên Navbar; tách biệt tab "Lịch sử học tập" trên trang `/progress`; cấu hình chuyển hướng vĩnh viễn HTTP 308 từ `/study-sessions` cũ sang `/progress?tab=history` bảo toàn 100% tham số truy vấn.

### Story 3.1: Xây Dựng Dropdown "Góc Học Tập" 5 Mục Trên Navbar
As a **Người dùng nền tảng**,  
I want **menu Dropdown "Góc học tập" hiển thị đầy đủ 5 công cụ chính trên Navbar**,  
So that **tôi truy cập nhanh vào bất kỳ không gian học tập nào chỉ với một cú nhấp chuột.**

**Tham chiếu:** FR-3, UX-DR5.  
**Acceptance Criteria:**
* **Given** thanh điều hướng Navbar trên màn hình desktop,
* **When** bấm vào nút "Góc học tập",
* **Then** menu Dropdown mở ra mượt mà với 5 mục:
  1. Tài liệu (`/library`)
  2. Đề thi & Trắc nghiệm (`/quiz`)
  3. Ghi chú (`/notes`)
  4. Sơ đồ tư duy (`/mindmap`)
  5. Thẻ ghi nhớ Flashcards (`/flashcards`)
* **And** mỗi mục có icon minh họa, tên công cụ và mô tả ngắn bằng tiếng Việt.
* **And** đóng dropdown khi bấm ra ngoài hoặc nhấn phím `Esc`.

### Story 3.2: Tách Biệt Tab "Lịch Sử Học Tập" Trên Trang `/progress`
As a **Học viên**,  
I want **xem riêng tab "Lịch sử học tập" trên trang `/progress`**,  
So that **tôi theo dõi chi tiết dòng thời gian các phiên học Pomodoro, bài thi trắc nghiệm và phiên ôn thẻ flashcard.**

**Tham chiếu:** FR-13.  
**Acceptance Criteria:**
* **Given** trang `/progress`,
* **When** bấm vào tab "Lịch sử học tập" (hoặc truy cập qua URL `/progress?tab=history`),
* **Then** hệ thống kết xuất danh sách lịch sử học tập phân loại theo loại hình (Pomodoro, Quiz, Flashcard) kèm thời gian và kết quả đạt được.
* **And** hỗ trợ đủ 4 trạng thái: Loading Skeleton khi tải, EmptyState khi chưa có lịch sử, ErrorState khi API lỗi, Dark mode nền than ấm.

### Story 3.3: Cấu Hình Chuyển Hướng Vĩnh Viễn HTTP 308 Cho `/study-sessions`
As a **Người dùng truy cập từ bookmark cũ**,  
I want **tuyến đường `/study-sessions` tự động chuyển hướng vĩnh viễn sang `/progress?tab=history`**,  
So that **tôi không gặp lỗi 404 và giữ nguyên toàn bộ tham số tìm kiếm (query params).**

**Tham chiếu:** NFR-9, FR-13.  
**Acceptance Criteria:**
* **Given** người dùng hoặc bot gửi request tới `/study-sessions?filter=week&sort=desc`,
* **When** Next.js xử lý request chuyển hướng,
* **Then** phản hồi trả về đúng mã trạng thái **HTTP 308 Permanent Redirect**.
* **And** URL đích chuyển thành `/progress?tab=history&filter=week&sort=desc`, bảo toàn 100% các query parameters.

---

## Epic 4: Trình Đọc Tài Liệu (Viewer), Xử Lý Ngoại Lệ, Schema Tài Liệu & Retry

**Mục tiêu Epic 4:** Chuẩn hóa giao diện Trình đọc tài liệu `/viewer/[id]` theo `WorkspaceLayout` không Footer; nâng cấp `DocumentViewerWrapper` hỗ trợ render inline Markdown an toàn (không bật `rehype-raw`) khi `doc_url` null nhưng có `solution_text`; bổ sung component `ErrorState` có nút thử lại và báo lỗi khi file hỏng (triệt tiêu khung trắng); migration nâng cấp schema `documents` đầy đủ các trường bản quyền tuân thủ quy trình 5 bước bắt buộc; hoàn thiện cơ chế validate tạo tài liệu < 10MB; và thiết lập tiện ích retry backoff chỉ áp dụng cho thao tác đọc/idempotent (cấm retry PayOS).

### Story 4.0: Chuẩn Hóa Giao Diện Trình Đọc Tài Liệu Học Tập (`/viewer/[id]`)
As a **Người học**,  
I want **giao diện `/viewer/[id]` chuyên nghiệp với bố cục `WorkspaceLayout` toàn màn hình (không Footer), hỗ trợ xem đa định dạng và thanh công cụ trợ lý học tập**,  
So that **tôi tập trung tối đa vào việc đọc tài liệu mà không bị phân tâm bởi các yếu tố thừa.**

**Tham chiếu:** FR-7, UX-DR3, UX-DR6.  
**Acceptance Criteria:**
* **Given** người dùng truy cập vào trang `/viewer/[id]`,
* **When** trang tải thành công,
* **Then** giao diện sử dụng `WorkspaceLayout` toàn màn hình (`h-[calc(100vh-var(--navbar-height))]`, `overflow-hidden`, tuyệt đối không có Footer).
* **And** bố cục chia thành:
  - Khung đọc chính: hỗ trợ phóng to/thu nhỏ (zoom/pan), chuyển trang và toàn màn hình (fullscreen).
  - Thanh công cụ bên (sidebar): mục lục tài liệu, danh sách ghi chú nhanh và nút kích hoạt Trợ lý AI giải thích.
* **And** hỗ trợ đầy đủ 4 trạng thái giao diện (*Loading skeleton, Empty state, Error state, Dark mode than ấm*).
* **And** có nút quay lại Thư viện và nút Báo cáo vi phạm nội dung.

### Story 4.1: Render Inline Markdown An Toàn Khi `doc_url` Null Trong Viewer
As a **Học viên đọc giáo trình OER / tài liệu AI**,  
I want **nội dung văn bản Markdown hiển thị trực tiếp trong Viewer khi tài liệu không có file URL**,  
So that **tôi không còn gặp thông báo cụt "Không có đường dẫn tài liệu" hay màn hình trắng.**

**Tham chiếu:** FR-7, NFR-6.  
**Acceptance Criteria:**
* **Given** tài liệu trong DB có `doc_url IS NULL` và có `solution_text` (hoặc `content`),
* **When** mở trang `/viewer/[id]`,
* **Then** hệ thống tự động nhận diện và kết xuất nội dung inline Markdown qua `react-markdown` + `remark-gfm`.
* **And** **tuyệt đối KHÔNG bật plugin `rehype-raw`** (đảm bảo an toàn XSS theo NFR-6).
* **And** hỗ trợ hiển thị đẹp mắt bảng biểu, khối code và công thức ở cả Light và Dark mode.

### Story 4.2: Tích Hợp `ErrorState` Thoát Hiểm Có Nút Thử Lại & Báo Lỗi Trong Viewer
As a **Học viên**,  
I want **màn hình báo lỗi thân thiện kèm các nút hành động khi tệp tài liệu bị hỏng hoặc mất kết nối**,  
So that **tôi có lối thoát hiểm an toàn, gửi báo lỗi và không bao giờ bị kẹt ở khung trắng.**

**Tham chiếu:** FR-7, NFR-8.  
**Acceptance Criteria:**
* **Given** tệp tài liệu bị lỗi tải (404, mạng hỏng, định dạng không hỗ trợ),
* **When** Viewer phát hiện lỗi,
* **Then** hệ thống kết xuất component `ErrorState` thay thế hoàn toàn khung tài liệu (0% màn hình trắng).
* **And** hiển thị thông báo lỗi bằng tiếng Việt kèm 3 nút hành động: "Thử lại" (`onRetry`), "Báo lỗi tài liệu" (`onReport`), và "Quay lại Thư viện" (`onBack`).
* **And** nút "Báo lỗi" mở modal cho phép gửi phản hồi trực tiếp tới hệ thống kiểm duyệt.

### Story 4.3: Migration Nâng Cấp Schema `documents` Theo Quy Trình 5 Bước & Audit Log
As a **Kỹ sư Cơ sở dữ liệu**,  
I want **migration nâng cấp bảng `documents` với đầy đủ các cột bản quyền tuân thủ quy trình 5 bước an toàn nghiêm ngặt**,  
So that **hệ thống sẵn sàng cho quy trình xác nhận bản quyền và kiểm duyệt của Admin có khả năng rollback sạch sẽ 100%.**

**Tham chiếu:** FR-6, FR-21, NFR-4, AR-2.  
**Acceptance Criteria:**
* **Given** bảng `documents` hiện có trong PostgreSQL (28 bản ghi),
* **When** thực hiện migration theo quy trình 5 bước bắt buộc:
  1. *Bước 1 (Backup):* Chạy `docker exec -i myproject-postgres pg_dump -U tu -t documents cognito > backups/pre_migration_documents_YYYYMMDD.sql`.
  2. *Bước 2 (Up):* Thực thi `npm run migrate up` bổ sung các cột: `source_url TEXT`, `license VARCHAR(100)`, `original_author VARCHAR(255)`, `imported_at TIMESTAMPTZ`, `copyright_confirmed BOOLEAN NOT NULL DEFAULT false`, `admin_approved_at TIMESTAMPTZ`, `admin_approved_by INTEGER REFERENCES users(id)`.
  3. *Bước 3 (Kiểm tra):* Xác minh toàn bộ 28 bản ghi cũ có `copyright_confirmed = false`, cấu trúc cột và khóa ngoại hợp lệ.
  4. *Bước 4 (Test Down):* Chạy `npm run migrate down` trên cơ sở dữ liệu tạm (hoặc bản restore từ backup), xác nhận schema hoàn nguyên sạch sẽ 100%.
  5. *Bước 5 (Up lại):* Chạy `npm run migrate up` lần 2 đảm bảo tính lặp lại (idempotency) hoàn hảo.
* **And** tận dụng bảng log có sẵn `moderation_logs` để ghi nhận các hành động duyệt bản quyền (`action = 'APPROVE_COPYRIGHT'`, `target_type = 'document'`).

### Story 4.4: Xác Thực & Kiểm Soát Tải Lên Tài Liệu Học Tập (< 10MB)
As a **Người dùng tải tài liệu cá nhân**,  
I want **form tải lên kiểm tra định dạng hợp lệ (PDF, Word, Ảnh) và dung lượng tối đa 10MB**,  
So that **tệp tải lên Cloudinary luôn an toàn, không làm tràn bộ nhớ hệ thống.**

**Tham chiếu:** FR-10, NFR-3.  
**Acceptance Criteria:**
* **Given** modal tải tài liệu tại `/library`,
* **When** người dùng chọn file > 10MB hoặc file không đúng định dạng (.exe, .zip),
* **Then** hệ thống chặn ngay tại client và hiển thị thông báo lỗi tiếng Việt rõ ràng.
* **And** tài liệu hợp lệ tải lên thành công nhận mặc định `visibility = 'private'`, `is_community_published = false`, `copyright_confirmed = false`.

### Story 4.5: Xử Lý Lỗi Tải Mạng & Tiện Ích Retry Backoff Cho Thao Tác Đọc/Idempotent
As a **Kỹ sư Hệ thống**,  
I want **tiện ích `retryWithBackoff` bằng code thuần áp dụng cho các thao tác đọc và tải tài liệu khi gặp sự cố mạng tạm thời**,  
So that **hệ thống tự động phục hồi kết nối mà không bao giờ gây lỗi trùng lặp dữ liệu hay thanh toán kép.**

**Tham chiếu:** NFR-8, Architecture Quyết định 2.4.  
**Acceptance Criteria:**
* **Given** các thao tác đọc dữ liệu (fetch OER từ nguồn ngoài, đọc metadata Cloudinary, tải nội dung tài liệu, polling tin nhắn),
* **When** xảy ra lỗi mạng tạm thời (timeout, HTTP 503, HTTP 429),
* **Then** hệ thống thực thi tiện ích `retryWithBackoff(fn, retries = 3, initialDelay = 1000)` viết bằng code thuần TypeScript/JavaScript với exponential backoff kèm jitter ngẫu nhiên.
* **And** **TUYỆT ĐỐI KHÔNG ÁP DỤNG RETRY cho thao tác tạo giao dịch thanh toán PayOS (`POST /api/payment/create-payment-link`)**: khi API PayOS gặp lỗi hoặc timeout, hệ thống lập tức thông báo lỗi rõ ràng bằng tiếng Việt để người dùng chủ động kiểm tra trạng thái hoặc thao tác lại, triệt tiêu hoàn toàn nguy cơ tạo đơn hàng trùng lặp.
* **And** toàn bộ lỗi mạng đều được bọc trong khối try/catch an toàn, không làm sập tiến trình Node.js hay gây crash ứng dụng.

---

## [CỔNG KIỂM SOÁT DỮ LIỆU GIAI ĐOẠN 1]: Story FR-4a

### Story FR-4a: Sao Lưu Vật Lý `pg_dump -i` & Script Dry-Run Chỉ Đọc Xuất ID Cụ Thể
As a **Quản trị viên hệ thống**,  
I want **chạy sao lưu DB an toàn và script dry-run chỉ đọc xuất danh sách ID rác cụ thể cùng Cloudinary public_ids**,  
So that **Chủ dự án kiểm tra, đối chiếu danh sách thực tế trước khi ra quyết định xóa.**

**Tham chiếu:** FR-4a, AR-2.  
**Thực thi:** Chạy ngay sau khi hoàn thành Epic 4.  
**Acceptance Criteria:**
* **Given** database PostgreSQL trong container `myproject-postgres`,
* **When** thực thi lệnh sao lưu `docker exec -i myproject-postgres pg_dump -U tu cognito > backups/pre_cleanup_backup_YYYYMMDD.sql` (cờ `-i`),
* **Then** tệp sao lưu được kiểm tra tính hợp lệ bằng `pg_restore --list` và thư mục `backups/` nằm trong `.gitignore`.
* **When** thực thi script SQL dry-run chỉ đọc,
* **Then** script xuất ra mảng danh sách ID cụ thể: `deleted_user_ids` (155 IDs), `deleted_deck_ids`, `deleted_doc_ids`, `deleted_test_set_ids`.
* **And** xuất file `backups/deleted_cloudinary_public_ids_YYYYMMDD.json` chứa danh sách Cloudinary asset để dọn dẹp riêng.
* **And** **Fail-Safe ABORT:** Nếu phát hiện bất kỳ bản ghi nào cần xóa có `owner_id IN (1, 3, 5, 5035)`, script lập tức dừng khẩn cấp và báo lỗi đỏ.
* **And** **Cảnh báo vàng:** Nếu phát hiện bản ghi có `owner_id IN (2, 7, 8, 21, 22)`, tự động tách riêng ra danh sách chờ duyệt riêng từng ID.

---

## Epic 5: Cộng Đồng Học Thuật, Bản Quyền & Nguồn Mở OER

**Mục tiêu Epic 5:** Chuẩn hóa giao diện cộng đồng 2 Tab riêng biệt; ẩn 13 tài liệu cũ đang public đến khi được xác nhận hoặc duyệt; xây dựng story cho chủ tài liệu tự xác nhận bản quyền; xây dựng story cho Admin duyệt bản quyền độc lập có ghi log (hỗ trợ duyệt hàng loạt tài liệu ID 5035); cơ chế báo cáo vi phạm; clone bộ thẻ chỉ cho phép public; script nạp OER idempotent whitelist 4 giấy phép; gỡ bỏ 100% nút nhắn tin người lạ.

### Story 5.1: Giao Diện 2 Tab Cộng Đồng & EmptyState Khi Chưa Có Tài Liệu Được Duyệt
As a **Học viên khám phá cộng đồng**,  
I want **giao diện `/community` có 2 Tab riêng biệt "Flashcard chia sẻ" và "Tài liệu cộng đồng" với EmptyState rõ ràng**,  
So that **tôi tìm kiếm đúng loại tài nguyên học tập mình cần.**

**Tham chiếu:** FR-6, UX-DR2.  
**Acceptance Criteria:**
* **Given** trang `/community`,
* **When** chuyển đổi giữa Tab 1 "Flashcard chia sẻ" và Tab 2 "Tài liệu cộng đồng",
* **Then** nội dung lọc hiển thị chính xác theo từng loại tài nguyên.
* **And** Tab 2 áp dụng điều kiện truy vấn:
  `visibility = 'public' AND is_community_published = true AND (copyright_confirmed = true OR admin_approved_at IS NOT NULL)`.
* **And** **EmptyState rõ ràng:** Khi chưa có tài liệu nào được xác nhận hoặc duyệt bản quyền, hiển thị hộp minh họa EmptyState kèm thông báo *"Chưa có tài liệu cộng đồng nào được phê duyệt bản quyền. Hãy là người đầu tiên chia sẻ!"* và nút hành động "Chia sẻ tài liệu".
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 5.2: Ẩn Tài Liệu Cũ Chưa Xác Nhận & Story Chủ Tài Liệu Tự Xác Nhận Bản Quyền
As a **Chủ sở hữu tài liệu đã tải lên**,  
I want **xem danh sách tài liệu cá nhân chưa xác nhận bản quyền và thực hiện cam kết bản quyền một chạm**,  
So that **tài liệu hợp pháp của tôi được hiển thị trở lại trên Tab Cộng đồng.**

**Tham chiếu:** FR-6, AR-2.  
**Acceptance Criteria:**
* **Given** tài liệu do người dùng tải lên có `visibility = 'public'` nhưng `copyright_confirmed = false`,
* **Then** tài liệu đó bị ẩn hoàn toàn khỏi Tab Tài liệu cộng đồng.
* **When** chủ sở hữu truy cập vào Thư viện cá nhân (`/library`),
* **Then** các tài liệu này hiển thị nhãn cảnh báo *"Chưa cam kết bản quyền - Đang ẩn khỏi cộng đồng"* kèm nút "Xác nhận bản quyền".
* **When** người dùng nhấp xác nhận và tích chọn cam kết giấy phép hợp lệ,
* **Then** hệ thống cập nhật `copyright_confirmed = true` và tài liệu lập tức hiển thị công khai trên cộng đồng.

### Story 5.3: Giao Diện Admin Duyệt Bản Quyền Tài Liệu & Chuẩn Hóa So Khớp Giấy Phép
As a **Quản trị viên (Admin)**,  
I want **giao diện kiểm duyệt bản quyền cho các tài liệu cộng đồng với cơ chế chuẩn hóa so khớp giấy phép OER**,  
So that **các giáo trình mở OER chuẩn được công khai minh bạch mà không mạo danh chủ tài liệu, đồng thời tự động nhận diện và cảnh báo các giấy phép có điều khoản NC.**

**Tham chiếu:** FR-6, FR-21, AR-2, AR-5.  
**Acceptance Criteria:**
* **Given** giao diện quản trị Admin (`/admin/documents` hoặc tab Kiểm duyệt tài liệu),
* **Then** 100% giao diện sử dụng các component và token đã được xây dựng từ **Epic 1**.
* **And** hệ thống tích hợp **parser chuẩn hóa giấy phép** (License Normalization): phân tích chuỗi văn bản giấy phép thực tế về mã định danh chuẩn (ví dụ: chuyển `"Creative Commons CC-BY 4.0"` hoặc `"CC BY 4.0"` về `CC-BY`, `"CC0 1.0 Universal"` về `CC0`), tuyệt đối **không so sánh chuỗi chính xác (`===`)**.
* **When** Admin thực hiện kịch bản kiểm duyệt hàng loạt đối với 12 tài liệu hiện có của tài khoản hệ thống `user_id = 5035` (đã có sẵn `source_url` và `license`, không cần story điền nguồn thủ công):
* **Then** hệ thống **phê duyệt thành công 11 tài liệu hợp lệ**:
  - Cập nhật `admin_approved_at = NOW()`, `admin_approved_by = current_admin_id`.
  - Giữ nguyên `copyright_confirmed = false` (không mạo danh chủ tài liệu).
  - Ghi 11 bản ghi vào `moderation_logs` (`action = 'APPROVE_COPYRIGHT'`, `target_type = 'document'`).
  - 11 tài liệu này lập tức hiển thị công khai trên Tab Tài liệu cộng đồng.
* **And** hệ thống **từ chối phê duyệt và phát sinh cảnh báo đối với tài liệu ID 10282**:
  - Nhận diện tài liệu ID 10282 có license `"Creative Commons CC-BY-NC-SA 4.0"` (chứa điều khoản `NC` - Phi thương mại từ nguồn MIT OCW).
  - Không phê duyệt tự động, giữ nguyên trạng thái ẩn, hiển thị cảnh báo màu vàng yêu cầu xem xét pháp lý trước khi đưa vào nền tảng có gói trả phí.

### Story 5.4: Hệ Thống Báo Cáo Vi Phạm Nội Dung Đa Đối Tượng (`content_reports`)
As a **Học viên tham gia cộng đồng**,  
I want **bấm nút "Báo cáo" trên tài liệu, bộ thẻ flashcard, tin nhắn hoặc người dùng vi phạm**,  
So that **nội dung rác hoặc vi phạm bản quyền được gửi về đội ngũ kiểm duyệt.**

**Tham chiếu:** FR-6, AR-2.  
**Acceptance Criteria:**
* **Given** nút "Báo cáo" trên các tài nguyên công cộng,
* **When** người dùng chọn lý do (Vi phạm bản quyền, Spam, Nội dung độc hại) và gửi báo cáo,
* **Then** API `POST /api/reports` lưu bản ghi vào bảng `content_reports` với `target_type IN ('resource', 'comment', 'user', 'message', 'deck', 'document')`.
* **And** áp dụng Rate Limiting đề xuất: tối đa 5 báo cáo / 10 phút.

### Story 5.4a: Migration Nâng Cấp Bảng Báo Cáo Vi Phạm `content_reports` (`target_type`)
As a **Kỹ sư Cơ sở dữ liệu**,  
I want **file migration riêng biệt nâng cấp ràng buộc `target_type` của bảng `content_reports` có mã UP/DOWN đối xứng**,  
So that **hệ thống hỗ trợ báo cáo đầy đủ các loại đối tượng với khả năng rollback an toàn theo quy trình 5 bước.**

**Tham chiếu:** FR-6, NFR-4, AR-2.  
**Acceptance Criteria:**
* **Given** bảng `content_reports` trong PostgreSQL,
* **When** thực hiện migration theo quy trình 5 bước bắt buộc:
  1. *Bước 1 (Backup):* Chạy `docker exec -i myproject-postgres pg_dump -U tu -t content_reports cognito > backups/pre_migration_content_reports_YYYYMMDD.sql`.
  2. *Bước 2 (Up):* Thực thi `npm run migrate up` thay thế ràng buộc check bằng `target_type IN ('resource', 'comment', 'user', 'message', 'deck', 'document')`.
  3. *Bước 3 (Kiểm tra):* Xác minh các ràng buộc mới và dữ liệu hiện hữu.
  4. *Bước 4 (Test Down):* Thực thi `npm run migrate down` trên DB tạm / bản restore từ backup, xác nhận khôi phục lại ràng buộc cũ `target_type IN ('resource', 'comment', 'user')` sạch sẽ 100%.
  5. *Bước 5 (Up lại):* Chạy `npm run migrate up` lần 2 đảm bảo tính lặp lại (idempotency).

### Story 5.5: Phân Quyền Sao Chép Bộ Thẻ Cộng Đồng (Chỉ Public, Private Trả 403)
As a **Học viên**,  
I want **sao chép (clone) một bộ thẻ Flashcard công khai của người khác về tài khoản cá nhân**,  
So that **tôi ôn tập theo thuật toán SM-2 riêng mà vẫn ghi công tác giả gốc.**

**Tham chiếu:** FR-20, AR-3.  
**Acceptance Criteria:**
* **Given** bộ thẻ flashcard của người khác,
* **When** gọi API `POST /api/community/flashcards/:id/clone` với bộ thẻ có `is_public = false`,
* **Then** hệ thống từ chối và ném mã lỗi **HTTP 403 Forbidden**.
* **When** gọi clone bộ thẻ có `is_public = true` (chưa bị xóa/ẩn),
* **Then** hệ thống tạo bản sao độc lập với `source_deck_id = original_deck.id` và lưu giữ vĩnh viễn `original_author_name`.
* **And** nếu bộ thẻ gốc sau này bị tác giả xóa, trường `source_deck_id` tự động chuyển thành `NULL` (`ON DELETE SET NULL`), bảo vệ vĩnh viễn bản sao của người học.
* **And** thông số học tập SM-2 trên bản sao được khởi tạo trắng mặc định (`ease_factor = 2.5`, `interval_days = 0`).

### Story 5.5a: Migration Nâng Cấp Bảng `flashcard_decks` (`source_deck_id`, `original_author_name`)
As a **Kỹ sư Cơ sở dữ liệu**,  
I want **file migration riêng biệt bổ sung các cột tham chiếu nguồn gốc và tác giả cho bảng `flashcard_decks` có đối xứng UP/DOWN**,  
So that **hệ thống hỗ trợ tính năng clone bộ thẻ độc lập và ghi công tác giả tuân thủ quy trình 5 bước an toàn.**

**Tham chiếu:** FR-20, NFR-4, AR-2.  
**Acceptance Criteria:**
* **Given** bảng `flashcard_decks` trong cơ sở dữ liệu,
* **When** thực hiện migration theo quy trình 5 bước bắt buộc:
  1. *Bước 1 (Backup):* Chạy `docker exec -i myproject-postgres pg_dump -U tu -t flashcard_decks cognito > backups/pre_migration_flashcard_decks_YYYYMMDD.sql`.
  2. *Bước 2 (Up):* Thực thi `npm run migrate up` bổ sung các cột `source_deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE SET NULL`, `original_author_name VARCHAR(255)` và tạo chỉ mục `idx_flashcard_decks_source`.
  3. *Bước 3 (Kiểm tra):* Xác minh các cột, khóa ngoại và chỉ mục mới được tạo đầy đủ.
  4. *Bước 4 (Test Down):* Thực thi `npm run migrate down` trên DB tạm / bản restore từ backup, kiểm chứng việc xóa chỉ mục và drop 2 cột sạch sẽ.
  5. *Bước 5 (Up lại):* Chạy `npm run migrate up` lần 2 đưa DB về trạng thái mục tiêu hoàn chỉnh.

### Story 5.6: Script Nạp Giáo Trình Mở OER Idempotent Với Whitelist 4 Giấy Phép
As a **Quản trị viên nội dung**,  
I want **script nhập liệu giáo trình OER tự động kiểm tra giấy phép theo từng sách và nạp an toàn**,  
So that **kho học liệu Cognito có giáo trình chuẩn mực mà không gặp rủi ro bản quyền thương mại.**

**Tham chiếu:** FR-21, AR-2.  
**Acceptance Criteria:**
* **Given** file dữ liệu giáo trình OER nguồn (OpenStax, Wikibooks),
* **When** chạy script nạp học liệu,
* **Then** script chỉ chấp nhận các đầu sách có giấy phép thuộc whitelist: `CC0`, `CC-BY`, `CC-BY-SA`, `Public Domain`.
* **And** **loại bỏ hoàn toàn** các sách có giấy phép `MIT` (code), `OpenStax-License` (không chuẩn), hoặc các nguồn mang điều khoản phi thương mại `NC` (như phần lớn MIT OCW CC BY-NC-SA).
* **And** script sử dụng cơ chế idempotent `ON CONFLICT (source_url) DO UPDATE`, lưu đủ `source_url`, `license`, `author`, `imported_at`.

### Story 5.7: Gỡ Bỏ 100% Nút Nhắn Tin Người Lạ Trên Toàn Bộ Thẻ Cộng Đồng
As a **Học viên tham gia cộng đồng**,  
I want **không thấy nút nhắn tin trực tiếp trên các bài đăng của người lạ**,  
So that **tôi không bị quấy rối và tuân thủ đúng nguyên tắc chỉ bạn bè mới được nhắn tin.**

**Tham chiếu:** FR-6.  
**Acceptance Criteria:**
* **Given** các thẻ bài đăng trên `/community`, hồ sơ công khai của người lạ,
* **When** kiểm tra giao diện và mã nguồn frontend,
* **Then** 100% không còn nút "Nhắn tin" gửi tới người dùng chưa có quan hệ bạn bè hợp lệ.
* **And** chỉ hiển thị nút "Kết bạn" hoặc xem thông tin học thuật công khai.

---

## Epic 6: Hệ Thống Kết Nối Bạn Bè & Tin Nhắn Riêng Tư

**Mục tiêu Epic 6:** Migration nâng cấp `friendships` (sao lưu bảng + in cặp trùng trước khi dedupe, bỏ 'blocked', có script down) và `messages` (thêm `receiver_id`, backfill từ hội thoại, `read_at TIMESTAMPTZ` làm nguồn chân lý duy nhất, có script down); Service phân quyền 2 lớp (`user_blocks` trước trả 403, `friendships` `accepted` trả 403); giao diện `/friends` và `/messages` (Phương án A: hội thoại cũ chỉ đọc + nút gửi lời mời kết bạn 1-click); chặn người lạ, báo cáo vi phạm, rate limiting đề xuất; Smart Polling phân tầng (active chat 3-5s, unread badge Navbar 30-60s); chuông thông báo.

### Story 6.1: Migration Bảng Quan Hệ Bạn Bè `friendships` Theo Quy Trình 5 Bước & Kiểm Tra Hồi Quy Mã Nguồn
As a **Kỹ sư Cơ sở dữ liệu & Backend**,  
I want **migration nâng cấp bảng `friendships` tuân thủ quy trình 5 bước an toàn nghiêm ngặt (giữ nguyên tên cột `user_id`/`friend_id`, sao lưu bảng, in danh sách dedupe, tạo unique index vô hướng, bỏ 'blocked', test rollback down) và rà soát hồi quy toàn bộ mã nguồn**,  
So that **quan hệ bạn bè không bị trùng lặp chiều, có khả năng rollback sạch sẽ 100% và không làm gãy bất kỳ câu truy vấn hiện có nào trong hệ thống.**

**Tham chiếu:** FR-14, NFR-4, AR-2.  
**Acceptance Criteria:**
* **Given** bảng `friendships` hiện có trong PostgreSQL,
* **When** thực hiện migration theo quy trình 5 bước bắt buộc:
  1. *Bước 1 (Backup):* Chạy `docker exec -i myproject-postgres pg_dump -U tu -t friendships cognito > backups/pre_migration_friendships_YYYYMMDD.sql` (đồng thời tạo bảng backup nội bộ `friendships_backup_YYYYMMDD`).
  2. *Bước 2 (Up):* 
     - Script thực thi câu lệnh phát hiện và in/ghi nhận log các cặp trùng lặp (A→B và B→A) trước khi xóa gộp (giữ lại bản ghi có trạng thái 'accepted' hoặc id nhỏ hơn).
     - **CHỌN PHƯƠNG ÁN 1: GIỮ NGUYÊN tên cột `user_id` và `friend_id`** (quy ước: `user_id` = requester/người gửi lời mời, `friend_id` = addressee/người nhận). Tuyệt đối KHÔNG đổi tên cột trong DB.
     - Loại bỏ hoàn toàn `'blocked'` khỏi ràng buộc CHECK, chỉ giữ `CHECK (status IN ('pending', 'accepted'))`.
     - Tạo Unique Index vô hướng: `CREATE UNIQUE INDEX idx_friendships_unique_pair ON friendships (LEAST(user_id, friend_id), GREATEST(user_id, friend_id))`.
     - Tạo các chỉ mục tìm kiếm cần thiết: `CREATE INDEX idx_friendships_user_status ON friendships (user_id, status)` và `CREATE INDEX idx_friendships_friend_status ON friendships (friend_id, status)`.
  3. *Bước 3 (Kiểm tra):* Xác minh các ràng buộc mới, chỉ mục và số lượng bản ghi không bị suy hao.
  4. *Bước 4 (Test Down):* Thực thi `npm run migrate down` trên DB tạm / bản restore từ backup, xác nhận khôi phục cấu trúc và dữ liệu sạch sẽ 100%.
  5. *Bước 5 (Up lại):* Chạy `npm run migrate up` lần 2 đưa DB về trạng thái mục tiêu hoàn chỉnh.
* **And (Tiêu chí Nghiệm thu Rà Soát Mã Nguồn & Hồi Quy):**
  - Thực hiện lệnh `grep` rà soát toàn bộ backend và frontend tất cả các truy vấn và logic đụng bảng `friendships` (bao gồm `backend/src/repositories/profile.repository.ts` và mọi nơi khác: service, controller, notification, search, community, admin).
  - Lập báo cáo liệt kê chi tiết danh sách kết quả grep các câu truy vấn `friendships`.
  - Xác nhận 100% các câu query hiện hữu vẫn tương thích và không bị gãy vỡ (do đã giữ nguyên tên cột `user_id`/`friend_id`).
  - Chạy test kiểm thử hồi quy cho trang Hồ sơ cá nhân (`/profile`) và tính năng bạn bè cả TRƯỚC và SAU khi chạy migration, đảm bảo không xảy ra bất kỳ lỗi SQL hay hồi quy chức năng nào.

### Story 6.2: Migration Bảng Tin Nhắn `messages` Theo Quy Trình 5 Bước & Backfill `receiver_id`
As a **Kỹ sư Cơ sở dữ liệu**,  
I want **migration thêm `receiver_id`, `read_at` cho `messages`, backfill dữ liệu cũ từ hội thoại tuân thủ quy trình 5 bước an toàn**,  
So that **tin nhắn cũ có đủ thông tin người nhận, chốt `read_at` làm nguồn chân lý duy nhất và có khả năng rollback sạch sẽ.**

**Tham chiếu:** FR-14, NFR-4, AR-2.  
**Acceptance Criteria:**
* **Given** bảng `messages` hiện có trong PostgreSQL,
* **When** thực hiện migration theo quy trình 5 bước bắt buộc:
  1. *Bước 1 (Backup):* Chạy `docker exec -i myproject-postgres pg_dump -U tu -t messages cognito > backups/pre_migration_messages_YYYYMMDD.sql`.
  2. *Bước 2 (Up):* Bổ sung `receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE` và `read_at TIMESTAMPTZ`; backfill `receiver_id` từ `conversation_members` và `conversations` cho 100% tin nhắn cũ; chốt `read_at TIMESTAMPTZ` làm nguồn chân lý duy nhất (đồng bộ ngược với `is_read`, backfill `read_at = created_at` cho tin cũ có `is_read = true`); tạo chỉ mục tối ưu `idx_messages_pair_created` và `idx_messages_conversation_created`.
  3. *Bước 3 (Kiểm tra):* Xác minh 100% tin nhắn cũ có `receiver_id` hợp lệ và chỉ mục hoạt động tối ưu.
  4. *Bước 4 (Test Down):* Thực thi `npm run migrate down` trên DB tạm / bản restore từ backup, kiểm chứng rollback hoàn nguyên sạch sẽ.
  5. *Bước 5 (Up lại):* Chạy `npm run migrate up` lần 2 đảm bảo tính lặp lại (idempotency).

### Story 6.3: Tầng Dịch Vụ Phân Quyền Chat Hai Lớp (`user_blocks` & `friendships`)
As a **Kỹ sư Backend**,  
I want **phương thức `MessageService.sendMessage` kiểm tra tuần tự quan hệ chặn (`user_blocks`) rồi đến quan hệ bạn bè (`friendships`)**,  
So that **ngăn chặn tuyệt đối người lạ hoặc người bị chặn gửi tin nhắn vào hệ thống.**

**Tham chiếu:** FR-14, AR-3, NFR-3.  
**Acceptance Criteria:**
* **Given** yêu cầu gửi tin nhắn mới qua `POST /api/messages/conversations/:id/messages`,
* **When** người gửi và người nhận nằm trong quan hệ chặn tại `user_blocks`,
* **Then** ném ngay mã lỗi **HTTP 403 Forbidden** (*"Không thể gửi tin nhắn do giới hạn chặn"*).
* **When** hai người dùng chưa có quan hệ bạn bè hợp lệ (`friendships.status = 'accepted'`),
* **Then** ném mã lỗi **HTTP 403 Forbidden** (*"Hai người dùng chưa là bạn bè"*).
* **When** người dùng thực hiện thao tác Chặn (Block):
  - Ghi bản ghi vào `user_blocks(blocker_id, blocked_id)`.
  - Tự động xóa bản ghi quan hệ trong `friendships`.
  - Tự động hủy toàn bộ lời mời kết bạn đang chờ (`pending`) giữa hai người.

### Story 6.4: Giao Diện Quản Lý Bạn Bè `/friends`
As a **Học viên**,  
I want **trang `/friends` quản lý danh sách bạn bè hiện tại, lời mời kết bạn đến và gửi lời mời kết bạn mới**,  
So that **tôi chủ động kết nối mạng lưới học tập của mình.**

**Tham chiếu:** FR-14, UX-DR2, NFR-7.  
**Acceptance Criteria:**
* **Given** trang `/friends` (`AppLayout`),
* **When** xem danh sách,
* **Then** hiển thị rõ ràng 2 khu vực: "Bạn bè của tôi" và "Lời mời kết bạn".
* **And** cho phép chấp nhận (`accept`), từ chối (`reject`) hoặc hủy kết bạn (`unfriend`).
* **And** áp dụng Rate Limiting đề xuất: tối đa 10 lời mời kết bạn / 15 phút.
* **And** hỗ trợ đủ 4 trạng thái giao diện: Loading Skeleton, EmptyState khi chưa có bạn, ErrorState khi mất mạng, Dark mode nền than ấm.

### Story 6.5: Giao Diện Hộp Thư Tin Nhắn `/messages` (Phương Án A + Nút Kết Bạn 1-Click)
As a **Học viên**,  
I want **giao diện `/messages` hiển thị lịch sử hội thoại cũ ở chế độ chỉ đọc kèm nút "Gửi lời mời kết bạn" ngay trên màn hình**,  
So that **tôi xem lại được tin nhắn cũ và kết bạn ngay lập tức chỉ với 1 click để tiếp tục trò chuyện.**

**Tham chiếu:** FR-14, NFR-6, UX-DR3.  
**Acceptance Criteria:**
* **Given** hội thoại giữa hai người dùng chưa là bạn bè (`friendships.status != 'accepted'`),
* **When** mở hội thoại tại `/messages` (`WorkspaceLayout`, không Footer),
* **Then** giao diện hoạt động ở **Chế độ Chỉ Đọc (Read-only)**:
  - Hiển thị đầy đủ nội dung các tin nhắn cũ.
  - Ô nhập văn bản bị khóa (disabled) và nút gửi tin bị ẩn.
  - Hiển thị banner thông báo: *"Hai bạn chưa kết bạn. Cần kết bạn để tiếp tục trò chuyện"* kèm **nút "Gửi lời mời kết bạn" 1-click ngay trên màn hình**.
* **When** người dùng bấm nút kết bạn, hệ thống gửi lời mời ngay tại chỗ và chuyển nút thành *"Đã gửi lời mời"*.
* **And** nội dung tin nhắn được kết xuất 100% bằng **Text thuần (Plain text)** qua `<span>{msg.content}</span>`, triệt tiêu lỗ hổng XSS (NFR-6).
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 6.6: Cơ Chế Smart Polling Phân Tầng & Chuông Thông Báo Navbar
As a **Học viên đang online**,  
I want **tin nhắn mới cập nhật mượt mà khi đang chat và huy hiệu tin nhắn chưa đọc trên Navbar cập nhật định kỳ**,  
So that **tôi không bỏ lỡ tin nhắn mà hệ thống không bị quá tải request.**

**Tham chiếu:** FR-14, AR-4.  
**Acceptance Criteria:**
* **Given** người dùng đang ở trang chat `/messages`,
* **When** tab trình duyệt đang mở và hiển thị (`visibilityState === 'visible'`),
* **Then** cơ chế Short Polling gọi API tin nhắn mới mỗi **3 đến 5 giây**. Dừng ngay khi chuyển tab hoặc thoát chat.
* **Given** người dùng ở bất kỳ trang nào trên nền tảng,
* **When** kiểm tra huy hiệu tin nhắn chưa đọc trên Navbar,
* **Then** tuyến API riêng `GET /api/messages/unread-count` chạy polling chu kỳ dài **30 đến 60 giây**.
* **And** chuông thông báo hiển thị đúng số lượng tin nhắn chưa đọc và cập nhật `read_at = NOW(), is_read = true` khi người dùng đọc tin.

### Story 6.7: Giới Hạn Tần Suất Gọi API (Rate Limiting) Bằng Thư Viện Có Sẵn
As a **Kỹ sư Backend**,  
I want **thiết lập middleware Rate Limiting sử dụng thư viện `express-rate-limit` (^8.7.0) đã có sẵn trong `backend/package.json`**,  
So that **hệ thống phòng chống tấn công brute-force, chống spam tin nhắn và bảo vệ hạn ngạch Gemini AI mà không cần cài đặt thêm thư viện mới.**

**Tham chiếu:** NFR-7, Architecture Quyết định 2.3.  
**Acceptance Criteria:**
* **Given** ứng dụng backend Express,
* **When** cấu hình middleware Rate Limiting,
* **Then** sử dụng trực tiếp thư viện **`express-rate-limit` (phiên bản `^8.7.0` đã có sẵn)** hoặc code thuần Express middleware. Tuyệt đối không cài thêm bất kỳ thư viện ngoài mới nào (nếu cần phải ghi "chờ duyệt" và chờ Tu phê duyệt).
* **And** áp dụng cấu hình giới hạn phân tầng:
  - Auth (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`): 5 lần thất bại / 15 phút trên mỗi IP.
  - AI & Sinh đề (`/api/ai/*`, `/api/test-sets/generate`): tối đa 10 lượt gọi / phút / người dùng.
  - Nhắn tin riêng (`/api/messages/*`): tối đa 30 tin nhắn / phút / người dùng.
  - Lời mời kết bạn & Báo cáo vi phạm: tối đa 5-10 yêu cầu / 10 phút.
* **And** khi vượt quá ngưỡng, API trả về mã lỗi **HTTP 429 Too Many Requests** kèm thông báo tiếng Việt: *"Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau ít phút."*

---

## [CỔNG KIỂM SOÁT DỮ LIỆU GIAI ĐOẠN 2]: Story FR-4b

### Story FR-4b: Thực Thi Xóa Dữ Liệu Thử Nghiệm Trong Transaction & Đối Chiếu Số Lượng
As a **Quản trị viên hệ thống**,  
I want **thực thi script xóa sạch dữ liệu rác trong Transaction sau khi Chủ dự án duyệt danh sách ID và chạy lại script đếm đối chiếu**,  
So that **cơ sở dữ liệu được thanh lọc an toàn tuyệt đối trước khi mở rộng các tính năng người dùng.**

**Tham chiếu:** FR-4b, AR-2.  
**Thực thi:** Chạy trước khi bắt đầu Epic 7.  
**Điều kiện tiên quyết:** 
1. Đã có số liệu baseline tại Story 1.0.
2. Đã có văn bản đồng ý phê duyệt từ Chủ dự án đối với danh sách ID từ Story FR-4a.  
**Acceptance Criteria:**
* **Given** danh sách ID cụ thể đã được phê duyệt,
* **When** thực thi script xóa trong Transaction bọc bởi `BEGIN ... COMMIT`,
* **Then** **CHỈ xóa đúng danh sách ID đã duyệt (`WHERE id IN (...)`)**, **TUYỆT ĐỐI KHÔNG dùng lệnh `LIKE`**.
* **And** bảo vệ nguyên vẹn 100% các tài khoản ID: `1`, `3`, `5`, `5035`.
* **And** giữ lại nguyên trạng và cách ly an toàn các tài khoản tạm giữ ID: `2`, `7`, `8`, `21`, `22`.
* **And** dọn sạch 155 tài khoản test rác khỏi `users` và các bảng phụ thuộc khóa ngoại liên quan.
* **When** chạy lại script đếm số lượng bản ghi sau khi xóa,
* **Then** số lượng bản ghi bị xóa thực tế khớp 100% với số lượng đã thống kê trong báo cáo dry-run được duyệt.

---

## Epic 7: Trang Chủ / Landing Page & Hệ Sinh Thái Học Tập

**Mục tiêu Epic 7:** Tái thiết kế trang chủ với font Serif `Playfair Display`, điểm nhấn gạch thẳng mint, lưới 5 công cụ bento, khu vực Showcase hiển thị 6 bộ thẻ thật lấy từ API cộng đồng (dữ liệu thật sau khi đã dọn rác), bảng so sánh tính năng và FAQ; đối với người dùng đã đăng nhập hiển thị khối cá nhân hóa "Tiếp tục học" (Streak, thẻ đến hạn, tài liệu gần nhất).

### Story 7.1: Giao Diện Landing Page Chuẩn Typography Playfair Display & Bento Grid
As a **Khách truy cập**,  
I want **trang chủ ấn tượng với tiêu đề font Playfair Display, gạch thẳng mint và lưới 5 công cụ học tập bento**,  
So that **tôi nắm bắt trực quan toàn bộ hệ sinh thái học tập thông minh của Cognito.**

**Tham chiếu:** FR-5, UX-DR4.  
**Acceptance Criteria:**
* **Given** trang chủ `/` khi chưa đăng nhập,
* **When** tải trang,
* **Then** tiêu đề chính sử dụng đúng font Serif `Playfair Display` với đường gạch thẳng màu mint `#BFEAD6` (không có đường cong lượn sóng).
* **And** lưới 5 khối bento giới thiệu 5 công cụ cốt lõi: Trình đọc tài liệu AI, Sổ tay ghi chú Markdown, Sơ đồ tư duy, Đề thi trắc nghiệm, và Thẻ ghi nhớ Flashcards SM-2.
* **And** hỗ trợ đủ 4 trạng thái giao diện: Loading Skeleton, Empty, Error, Dark Mode nền than ấm `#161916`.

### Story 7.2: Khối Showcase 6 Bộ Thẻ Flashcard Thật Từ API Cộng Đồng
As a **Khách truy cập**,  
I want **khu vực Showcase hiển thị 6 bộ thẻ flashcard thật có nhiều lượt thích nhất từ cộng đồng**,  
So that **tôi trải nghiệm học liệu thực tế của nền tảng thay vì dữ liệu mẫu giả định.**

**Tham chiếu:** FR-5, FR-20.  
**Acceptance Criteria:**
* **Given** khối Showcase trên Landing Page,
* **When** tải dữ liệu,
* **Then** hệ thống gọi API `GET /api/community/flashcards?limit=6&sort=popular` để lấy 6 bộ thẻ thật.
* **And** mỗi thẻ hiển thị tên bộ thẻ, môn học, số lượng thẻ, tên tác giả, lượt tim và nút "Học ngay".
* **And** khi API chậm hiển thị Skeleton tương ứng; khi API lỗi hiển thị Toast tiếng Việt thân thiện.

### Story 7.3: Bảng So Sánh Tính Năng & Khu Vực Câu Hỏi Thường Gặp (FAQ)
As a **Khách truy cập**,  
I want **xem bảng so sánh quyền lợi giữa Gói Miễn Phí và Gói Pro cùng các câu hỏi thường gặp**,  
So that **tôi hiểu rõ giá trị của nền tảng trước khi quyết định nâng cấp.**

**Tham chiếu:** FR-5, FR-18.  
**Acceptance Criteria:**
* **Given** khu vực Bảng giá và FAQ trên Landing Page,
* **When** xem nội dung,
* **Then** bảng so sánh thể hiện rõ tính năng theo token màu hổ phách `var(--color-premium)`.
* **And** khối FAQ dạng accordion cho phép mở/đóng từng câu hỏi mượt mà, giải đáp thắc mắc về tính năng AI, tài liệu OER và phương thức thanh toán.

### Story 7.4: Khối Cá Nhân Hóa "Tiếp Tục Học" Cho Người Dùng Đã Đăng Nhập
As a **Học viên đã đăng nhập**,  
I want **trang chủ hiển thị khối "Tiếp tục học" với chuỗi ngày Streak, thẻ đến hạn ôn và tài liệu gần nhất**,  
So that **tôi tiếp tục tiến trình học tập nhanh chóng chỉ với 1 cú nhấp chuột.**

**Tham chiếu:** FR-5, FR-13.  
**Acceptance Criteria:**
* **Given** người dùng đã đăng nhập truy cập trang chủ,
* **Then** Hero chuyển đổi thành khối "Tiếp tục học":
  - Số ngày chuỗi Streak hiện tại kèm biểu tượng ngọn lửa xanh mint.
  - Số thẻ Flashcard đến hạn ôn tập hôm nay kèm nút "Ôn ngay".
  - Tài liệu học tập gần nhất đang đọc dở kèm nút "Mở lại".
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading Skeleton, EmptyState khi học viên mới chưa có bài, ErrorState, Dark Mode).

---

## Epic 8: Chuẩn Hóa & Đồng Bộ Giao Diện 17 Tuyến Đường Chức Năng

**Mục tiêu Epic 8:** Triển khai 17 stories độc lập áp dụng Design Token, chuẩn hóa bố cục và hoàn thiện ma trận 4 trạng thái (*Loading, Empty, Error, Dark Mode*) trên toàn bộ 17 tuyến đường chức năng (bao gồm cả `/shared/[token]`, `/flashcards/new`, `/flashcards/[deckId]/edit`, tách biệt `/quiz` và `/quiz/[testSetId]`).

### Story 8.1: Đồng Bộ Giao Diện Kho Tài Liệu Cá Nhân (`/library`)
As a **Học viên**,  
I want **trang `/library` đồng bộ token xanh rừng, lưới bento tài liệu và modal tải file an toàn**,  
So that **tôi quản lý kho học liệu cá nhân trực quan và tiện lợi.**

**Tham chiếu:** FR-10, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/library` (`AppLayout`),
* **Then** giao diện sử dụng 100% token từ `design-tokens.css`, thẻ tài liệu bo góc 16-20px viền mảnh.
* **And** hỗ trợ đủ 4 trạng thái: Loading Skeleton, EmptyState (hộp minh họa + nút tải tài liệu đầu tiên), ErrorState, Dark mode nền `#161916`.

### Story 8.2a: Đồng Bộ Giao Diện Danh Sách Đề Thi & Tạo Đề Trắc Nghiệm AI (`/quiz` & `/ai-test`)
As a **Học viên**,  
I want **trang danh sách đề thi `/quiz` và tạo đề `/ai-test` đồng bộ design token, hỗ trợ tìm kiếm, lọc theo môn học và tạo đề mới bằng AI**,  
So that **tôi nhanh chóng lựa chọn hoặc khởi tạo bài luyện tập phù hợp với nhu cầu.**

**Tham chiếu:** FR-11, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/quiz` và `/ai-test` (`AppLayout`),
* **Then** giao diện hiển thị danh sách các bộ đề thi đã tạo/đã làm dưới dạng lưới bento card.
* **And** hỗ trợ bộ lọc môn học, độ khó và thanh tìm kiếm đề thi nhanh.
* **And** trang `/ai-test` cung cấp form nhập chủ đề / tải tài liệu để AI sinh bộ câu hỏi trắc nghiệm kèm loading skeleton sinh động.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, EmptyState khi chưa có đề thi, ErrorState, Dark Mode than ấm).

### Story 8.2b: Đồng Bộ Giao Diện Phòng Thi & Làm Bài Trắc Nghiệm Tập Trung (`/quiz/[testSetId]`)
As a **Học viên**,  
I want **phòng làm bài trắc nghiệm `/quiz/[testSetId]` có khung tập trung `max-w-4xl`, đồng hồ đếm ngược và bảng câu hỏi tương tác**,  
So that **tôi làm bài thi nghiêm túc, chọn đáp án highlight xanh rừng và xem kết quả giải thích chi tiết.**

**Tham chiếu:** FR-11, UX-DR3, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/quiz/[testSetId]` (`WorkspaceLayout`, không Footer),
* **Then** bố cục sử dụng khung hẹp `max-w-4xl` căn giữa màn hình tránh bè ngang, có thanh tiến độ số câu đã làm và đồng hồ đếm ngược thời gian.
* **When** học viên chọn đáp án trắc nghiệm, khung đáp án chuyển màu highlight xanh rừng `var(--color-primary)` với hiệu ứng chuyển động mượt mà.
* **When** bấm "Nộp bài", hệ thống hiển thị màn hình tổng kết điểm số, tỷ lệ đúng/sai và lời giải thích chi tiết cho từng câu hỏi.
* **And** kết quả bài thi tự động lưu vào cơ sở dữ liệu và đồng bộ vào tab Lịch sử tại `/progress?tab=history`.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.3: Đồng Bộ Giao Diện Sổ Tay Ghi Chú Markdown (`/notes`)
As a **Học viên**,  
I want **không gian ghi chú `/notes` toàn màn hình không Footer, hỗ trợ soạn thảo Markdown thời gian thực**,  
So that **tôi ghi chép bài học liên kết tài liệu một cách liền mạch.**

**Tham chiếu:** FR-8, NFR-6, UX-DR3.  
**Acceptance Criteria:**
* **Given** trang `/notes` (`WorkspaceLayout`, chiều cao `100vh - var(--navbar-height)`, không Footer),
* **Then** cột trái hiển thị danh sách ghi chú, cột phải là trình soạn thảo Markdown kết xuất an toàn (không bật `rehype-raw`).
* **And** hiển thị trạng thái tự động lưu bằng tiếng Việt (*Đang lưu... / Đã lưu lúc HH:mm*).
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.4: Đồng Bộ Giao Diện Sơ Đồ Tư Duy Tương Tác (`/mindmap`)
As a **Học viên**,  
I want **trang `/mindmap` toàn màn hình không Footer, hiển thị đồ thị Mermaid SVG tương tác**,  
So that **tôi trực quan hóa cấu trúc kiến thức và phóng to/thu nhỏ dễ dàng.**

**Tham chiếu:** FR-9, UX-DR3.  
**Acceptance Criteria:**
* **Given** trang `/mindmap` (`WorkspaceLayout`, không Footer),
* **Then** đồ thị Mermaid SVG hỗ trợ zoom, pan và hiển thị nút đồ thị viền mint, nền tối hài hòa với bảng màu than ấm `#161916`.
* **And** cú pháp Mermaid sai hiển thị thông báo lỗi tiếng Việt thân thiện thay vì làm sập trang.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.5: Đồng Bộ Giao Diện Danh Sách & Lật Thẻ Ôn Tập 3D (`/flashcards` & `/flashcards/[deckId]`)
As a **Học viên**,  
I want **trang danh sách `/flashcards` và phòng ôn tập `/flashcards/[deckId]` hỗ trợ lật thẻ 3D mượt mà và đánh giá phản xạ ghi nhớ theo thuật toán SM-2**,  
So that **tôi ghi nhớ kiến thức lâu dài qua phương pháp Spaced Repetition.**

**Tham chiếu:** FR-20, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang danh sách `/flashcards` (`AppLayout`) và phòng ôn tập `/flashcards/[deckId]` (`WorkspaceLayout`, không Footer),
* **Then** trang danh sách hiển thị các bộ thẻ cá nhân và bộ thẻ đã sao chép từ cộng đồng.
* **And** phòng ôn tập hỗ trợ lật thẻ 3D mượt mà khi nhấn phím `Space` hoặc nhấp chuột; hiển thị 4 nút đánh giá phản xạ (*Lại / Khó / Tốt / Dễ*).
* **And** cập nhật chính xác các thông số `ease_factor`, `interval_days`, `next_review_at` vào cơ sở dữ liệu.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.5a: Giao Diện Tạo Mới Bộ Thẻ Flashcard (`/flashcards/new`)
As a **Học viên**,  
I want **trang `/flashcards/new` để nhập tiêu đề, mô tả, môn học và thêm danh sách các thẻ ghi nhớ (mặt trước / mặt sau)**,  
So that **tôi chủ động tạo bộ tài liệu ôn tập cá nhân nhanh chóng và dễ dàng.**

**Tham chiếu:** FR-20, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/flashcards/new` (`AppLayout`),
* **When** người dùng tạo bộ thẻ mới,
* **Then** form nhập liệu bao gồm: Tên bộ thẻ, Mô tả ngắn, Môn học, Toggle trạng thái công khai (`is_public`), và danh sách các cặp thẻ Mặt trước (Thuật ngữ/Câu hỏi) / Mặt sau (Định nghĩa/Câu trả lời).
* **And** hỗ trợ thêm thẻ mới với phím tắt, kéo thả sắp xếp thứ tự và xóa thẻ.
* **And** validate bắt buộc: tiêu đề không để trống, bộ thẻ phải có tối thiểu 1 thẻ hoàn chỉnh trước khi lưu.
* **And** lưu thành công chuyển hướng về `/flashcards/[deckId]` và hiển thị Toast thông báo tiếng Việt.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.5b: Giao Diện Chỉnh Sửa Bộ Thẻ Flashcard (`/flashcards/[deckId]/edit`)
As a **Chủ sở hữu bộ thẻ**,  
I want **trang `/flashcards/[deckId]/edit` để cập nhật thông tin và chỉnh sửa/bổ sung các thẻ ghi nhớ trong bộ thẻ**,  
So that **tôi duy trì và bổ sung nội dung kiến thức theo tiến độ học tập.**

**Tham chiếu:** FR-20, NFR-3, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/flashcards/[deckId]/edit` (`AppLayout`),
* **Then** hệ thống kiểm tra quyền sở hữu: nếu người dùng hiện tại không phải là chủ sở hữu của `deckId`, chuyển hướng về `/flashcards` và hiển thị Toast lỗi quyền truy cập.
* **When** chủ sở hữu chỉnh sửa thông tin hoặc thêm/sửa/xóa từng thẻ,
* **Then** form điền sẵn dữ liệu hiện tại của bộ thẻ và danh sách toàn bộ các thẻ con.
* **And** cho phép thay đổi trạng thái công khai `is_public` (chuyển giữa riêng tư và công khai).
* **And** lưu cập nhật thành công và hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.6: Đồng Bộ Giao Diện Phòng Tập Trung Pomodoro (`/focus`)
As a **Học viên**,  
I want **phòng tập trung Pomodoro `/focus` toàn màn hình buồng tối `#121412` tĩnh lặng tuyệt đối**,  
So that **tôi học tập chuyên sâu không bị xao nhãng.**

**Tham chiếu:** FR-12, UX-DR3.  
**Acceptance Criteria:**
* **Given** trang `/focus` (`WorkspaceLayout`, không Footer),
* **Then** giao diện chuyển sang chế độ buồng tối `#121412`, vòng tiến trình đếm ngược màu xanh mint sáng (25/45/60 phút).
* **And** kết thúc phiên học, thời gian tập trung tự động lưu và đồng bộ vào bảng tiến độ.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.7: Đồng Bộ Giao Diện Tiến Độ Học Tập & Biểu Đồ Streak (`/progress`)
As a **Học viên**,  
I want **trang `/progress` hiển thị trực quan biểu đồ giờ học, chuỗi ngày Streak và mục tiêu tuần**,  
So that **tôi có động lực duy trì thói quen học tập đều đặn.**

**Tham chiếu:** FR-13, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/progress` (`AppLayout`),
* **Then** biểu đồ Recharts thể hiện số giờ học theo tuần/tháng với gam màu xanh rừng và mint hài hòa.
* **And** bảng thống kê hiển thị số ngày Streak, số thẻ đã thuộc và số bài trắc nghiệm đã hoàn thành.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.8: Đồng Bộ Giao Diện Tìm Kiếm Toàn Sàn Đa Đối Tượng (`/search`)
As a **Học viên**,  
I want **trang `/search` hỗ trợ tìm kiếm nhanh debounce 300ms với bộ lọc đa danh mục**,  
So that **tôi tìm thấy chính xác tài liệu, bộ thẻ, đề thi hoặc bạn bè trên toàn sàn.**

**Tham chiếu:** FR-15, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/search` (`AppLayout`),
* **When** nhập từ khóa,
* **Then** ô tìm kiếm tự động debounce 300ms và hiển thị các tab lọc: *Tất cả, Tài liệu, Flashcard, Đề thi, Bạn bè*.
* **And** khi không tìm thấy kết quả, hiển thị EmptyState kèm các từ khóa học tập gợi ý.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading Skeleton, Empty, Error, Dark Mode).

### Story 8.9: Đồng Bộ Giao Diện Hồ Sơ Cá Nhân & Công Khai (`/profile`)
As a **Học viên**,  
I want **trang `/profile` hiển thị thông tin học viên, danh hiệu đạt được và tài nguyên đã đóng góp**,  
So that **tôi xây dựng hồ sơ học thuật cá nhân uy tín trên nền tảng.**

**Tham chiếu:** FR-16, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/profile` (`AppLayout`),
* **Then** phân quyền hiển thị rõ ràng: Chủ sở hữu thấy nút "Chỉnh sửa hồ sơ"; khách chỉ thấy thông tin công khai và nút "Kết bạn".
* **And** hiển thị bảng thành tích (Streak, tài liệu đóng góp, thẻ chia sẻ) đạt chuẩn tương phản WCAG AA.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.10: Đồng Bộ Giao Diện Cài Đặt Tài Khoản & Theme Switcher (`/settings`)
As a **Học viên**,  
I want **trang `/settings` đổi mật khẩu an toàn và chuyển đổi Theme Sáng / Tối ấm tức thì**,  
So that **tôi tùy biến trải nghiệm cá nhân mà không cần reload lại trang web.**

**Tham chiếu:** FR-17, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/settings` (`AppLayout`),
* **When** người dùng chọn chuyển sang chế độ Dark Mode,
* **Then** giao diện đổi ngay lập tức sang nền than ấm `#161916` không reload trang.
* **And** form đổi mật khẩu yêu cầu xác thực mật khẩu cũ và mật khẩu mới tối thiểu 6 ký tự.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.11: Đồng Bộ Giao Diện Gói Hội Viên Premium (`/premium` - Chỉ Token UI)
As a **Học viên quan tâm gói Pro**,  
I want **trang `/premium` hiển thị bảng so sánh gói với token màu cam hổ phách đồng bộ**,  
So that **tôi dễ dàng đăng ký gói hội viên (giữ nguyên 100% logic backend PayOS hiện có).**

**Tham chiếu:** FR-18, UX-DR6.  
**Acceptance Criteria:**
* **Given** trang `/premium` (`AppLayout`),
* **Then** giao diện áp dụng token màu hổ phách `var(--color-premium)` cho nút CTA và viền thẻ gói Pro.
* **And** **tuyệt đối giữ nguyên 100% logic backend PayOS**, không can thiệp code xử lý thanh toán.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.12: Đồng Bộ Giao Diện Modal Xác Thực & Trang Đặt Lại MK (`/reset-password` CÓ Footer)
As a **Người dùng**,  
I want **modal Đăng nhập/Đăng ký và trang `/reset-password` có Footer chuẩn mực và thông báo 100% tiếng Việt**,  
So that **tôi đăng nhập và khôi phục tài khoản an toàn, dễ hiểu.**

**Tham chiếu:** FR-19, UX-DR3, NFR-5.  
**Acceptance Criteria:**
* **Given** modal xác thực (`RegisterModal`/`LoginModal`) và trang `/reset-password`,
* **Then** trang `/reset-password` sử dụng `AppLayout` và **CÓ Footer** theo đúng quy tắc layout thống nhất.
* **And** mọi thông báo lỗi (sai mật khẩu, tài khoản chưa kích hoạt) hiển thị 100% bằng tiếng Việt dưới từng ô input.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.13: Đồng Bộ Giao Diện Cổng Quản Trị Hệ Thống (`/admin/*`)
As a **Quản trị viên (Admin)**,  
I want **cổng quản trị `/admin/*` toàn màn hình không Footer, quản lý người dùng và xử lý báo cáo vi phạm**,  
So that **tôi điều hành nền tảng thuận tiện trên giao diện tối ấm hiện đại.**

**Tham chiếu:** Admin, UX-DR3, UX-DR6.  
**Acceptance Criteria:**
* **Given** cổng `/admin/*` (`WorkspaceLayout`, không Footer),
* **Then** giao diện sử dụng toàn bộ token và component từ `components/common/`.
* **And** hỗ trợ bảng danh sách người dùng, kiểm duyệt báo cáo vi phạm (`content_reports`) và duyệt tài liệu OER.
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

### Story 8.14: Giao Diện Xem Tài Liệu Chia Sẻ Công Khai (`/shared/[token]`)
As a **Người nhận liên kết chia sẻ (học viên hoặc khách vãng lai)**,  
I want **truy cập tuyến đường `/shared/[token]` để đọc nội dung tài liệu được chia sẻ mà không bắt buộc phải đăng nhập**,  
So that **tôi tiếp cận nhanh chóng tài liệu học tập được chia sẻ từ bạn bè hoặc cộng đồng.**

**Tham chiếu:** FR-7, UX-DR3, UX-DR6, NFR-5.  
**Acceptance Criteria:**
* **Given** đường dẫn `/shared/[token]` (`AppLayout`, CÓ Footer),
* **When** người dùng (kể cả khách chưa đăng nhập) mở liên kết chia sẻ với `token` hợp lệ,
* **Then** trang kết xuất nội dung tài liệu tương ứng qua `DocumentViewerWrapper` an toàn (ảnh, PDF, word, inline Markdown).
* **And** giao diện chỉ ở chế độ xem đọc: ẩn toàn bộ các công cụ chỉnh sửa, xóa hoặc quản trị của chủ sở hữu; hiển thị tên tài liệu, tác giả chia sẻ và nút "Lưu vào Thư viện của tôi" (yêu cầu đăng nhập nếu là khách).
* **When** `token` chia sẻ hết hạn, bị thu hồi hoặc không tồn tại,
* **Then** kết xuất component `ErrorState` thông báo rõ ràng bằng tiếng Việt: *"Liên kết chia sẻ không tồn tại hoặc đã hết hạn"* kèm nút "Về trang chủ".
* **And** hỗ trợ đủ 4 trạng thái giao diện (Loading, Empty, Error, Dark Mode).

---

## Epic 9: Đo Lường Baseline, Kiểm Thử Nghiệm Thu & Báo Cáo Before/After

**Mục tiêu Epic 9:** Thực thi toàn bộ kiểm thử tự động ma trận phân quyền chat, clone bộ thẻ, tính toàn vẹn migration hai chiều, redirect HTTP 308; đo đạc lại các chỉ số hiệu năng và lập báo cáo nghiệm thu Before/After hoàn chỉnh.

### Story 9.1: Kiểm Thử Tự Động Phân Quyền Chat & Bảo Vệ Bạn Bè
As a **Kỹ sư Đảm bảo Chất lượng (QA)**,  
I want **test suite tự động kiểm thử 4 kịch bản gửi tin nhắn và phân quyền bạn bè**,  
So that **đảm bảo 100% không có lỗ hổng gửi tin nhắn cho người lạ hay người bị chặn.**

**Tham chiếu:** FR-14, NFR-3.  
**Acceptance Criteria:**
* **Given** test suite `test/chat-auth.test.ts`,
* **When** thực thi kiểm thử,
* **Then** Test Case 1 (Người lạ gửi tin): trả về đúng **HTTP 403 Forbidden**.
* **And** Test Case 2 (Người bị chặn gửi tin): trả về đúng **HTTP 403 Forbidden**.
* **And** Test Case 3 (Bạn bè hợp lệ gửi tin): trả về đúng **HTTP 201 Created**.
* **And** Test Case 4 (Hội thoại cũ chưa là bạn bè): xem lại tin nhắn trả về **HTTP 200 OK** kèm cờ `read_only: true`.

### Story 9.2: Kiểm Thử Tự Động Phân Quyền Clone Bộ Thẻ Flashcard
As a **Kỹ sư Đảm bảo Chất lượng (QA)**,  
I want **test suite kiểm thử phân quyền sao chép bộ thẻ**,  
So that **người dùng không thể clone các bộ thẻ riêng tư của người khác.**

**Tham chiếu:** FR-20, AR-3.  
**Acceptance Criteria:**
* **Given** API clone bộ thẻ `/api/community/flashcards/:id/clone`,
* **When** clone bộ thẻ có `is_public = false`,
* **Then** trả về đúng **HTTP 403 Forbidden**.
* **When** clone bộ thẻ có `is_public = true`,
* **Then** trả về đúng **HTTP 201 Created** kèm bản sao độc lập có `source_deck_id` và ghi công tác giả.

### Story 9.3: Kiểm Thử Tính Toàn Vẹn Migration Hai Chiều (`up` & `down`) & Quy Trình 5 Bước
As a **Kỹ sư Cơ sở dữ liệu**,  
I want **kiểm thử tự động chạy `migrate:up` rồi `migrate:down` trên cơ sở dữ liệu tạm đối với toàn bộ 5 tệp migration**,  
So that **xác nhận mọi migration đều có khả năng rollback sạch sẽ không gây lỗi cấu trúc DB.**

**Tham chiếu:** NFR-4, AR-2.  
**Acceptance Criteria:**
* **Given** toàn bộ 5 file migration mới (`friendships`, `messages`, `documents`, `content_reports`, `flashcard_decks`),
* **When** thực thi kiểm thử migration theo quy trình 5 bước trên cơ sở dữ liệu tạm hoặc bản restore từ backup:
  1. Chạy `npm run migrate:up` lần 1: cấu trúc bảng, chỉ mục và ràng buộc được tạo và nâng cấp thành công 100%.
  2. Kiểm tra tính toàn vẹn schema và dữ liệu hiện hữu.
  3. Chạy `npm run migrate:down`: toàn bộ thay đổi được hoàn tác sạch sẽ, không để lại khóa ngoại hay chỉ mục mồ côi.
  4. Chạy `npm run migrate:up` lần 2: đưa database về trạng thái mục tiêu hoàn chỉnh, xác nhận tính lặp lại (idempotency).
* **Then** hệ thống ghi nhận kết quả kiểm thử migration đạt 100% tiêu chí an toàn dữ liệu.

### Story 9.4: Kiểm Thử Chuyển Hướng Vĩnh Viễn HTTP 308 Bảo Toàn Query Params
As a **Kỹ sư Đảm bảo Chất lượng (QA)**,  
I want **kiểm thử tự động request tới `/study-sessions`**,  
So that **xác nhận chuyển hướng trả về mã HTTP 308 và giữ nguyên toàn bộ tham số URL.**

**Tham chiếu:** NFR-9.  
**Acceptance Criteria:**
* **Given** endpoint chuyển hướng,
* **When** gửi request tới `/study-sessions?filter=month&page=2`,
* **Then** nhận mã trạng thái phản hồi **HTTP 308**.
* **And** header `Location` trỏ chính xác tới `/progress?tab=history&filter=month&page=2`.

### Story 9.5: Đo Đạc Đối Chiếu Nghiệm Thu Hiệu Năng & Báo Cáo Before/After
As a **Chủ nhiệm Dự án & Chủ dự án**,  
I want **bảng tổng kết đối chiếu các chỉ số kỹ thuật trước và sau khi hoàn thiện dự án**,  
So that **nghiệm thu toàn bộ sản phẩm đạt 100% tiêu chí PRD và Architecture.**

**Tham chiếu:** NFR-1, NFR-2, AR-6.  
**Acceptance Criteria:**
* **Given** hệ thống đã hoàn thiện toàn bộ các Epic từ 1 đến 8,
* **When** tiến hành đo đạc lại các chỉ số hiệu năng (FCP, CLS, latency API, error rate),
* **Then** các chỉ số được ghi nhận và lập thành báo cáo đối chiếu chi tiết trong [acceptance-report.md](file:///d:/Ky_7/EXE101/Cognito/docs/acceptance-report.md) so với mốc tại Story 1.0.
* **And** kiểm tra đối chiếu xác nhận: 0 màn hình trắng, 0 màu xanh cũ ngoài tokens, 100% trang hỗ trợ đủ 4 trạng thái giao diện, dữ liệu rác đã được dọn sạch sẽ và các tài khoản thật được bảo vệ an toàn tuyệt đối.

---
