---
title: 'PRD: Cognito (EduShare AI) - Nền Tảng Học Tập Thông Minh'
created: '2026-10-13'
updated: '2026-10-13'
status: 'approved'
version: '1.2.1'
author: 'Tu'
project_name: 'Cognito'
ux_spec_ref: 'docs/ux-design-specification.md'
project_context_ref: 'docs/project-context.md'
---

# PRD: COGNITO (EDUSHARE AI) - NỀN TẢNG HỌC TẬP THÔNG MINH

> **Tài liệu Yêu cầu Sản phẩm (Product Requirements Document) - Phiên bản 1.2.1**  
> **Mục tiêu:** Định hình tiêu chuẩn chức năng, kiến trúc giao diện, quy tắc xử lý dữ liệu và tiêu chí nghiệm thu có thể đo lường được cho đợt tái cấu trúc toàn diện web học tập Cognito. Toàn bộ nội dung gắn chặt với [Tài liệu Đặc tả Thiết kế UX/UI](file:///d:/Ky_7/EXE101/Cognito/docs/ux-design-specification.md) và [Quy tắc Dự án](file:///d:/Ky_7/EXE101/Cognito/docs/project-context.md).

---

## 0. Mục đích Tài liệu & Phạm vi Dự án (Document Purpose)

Tài liệu PRD này là chuẩn mực duy nhất (Single Source of Truth) phục vụ đội ngũ phát triển, kiểm thử chất lượng (QA/QC) và chủ dự án trong quá trình nâng cấp, chuẩn hóa nền tảng học tập trực tuyến Cognito từ trạng thái phân mảnh hiện tại (brownfield) sang một hệ sinh thái học tập tinh gọn, thẩm mỹ cao và ổn định tuyệt đối:
- **Ngôn ngữ thiết kế thống nhất:** Triệt tiêu hoàn toàn mã màu/font hardcode, chỉ dùng hệ thống Design Token chuẩn hóa (màu xanh rừng `#1a3d28`, nền kem `#F4F2EC`, bảng màu tối ấm `#161916`, tiêu đề Serif `Playfair Display`).
- **Phân định bố cục rõ ràng:** Phân tách rạch ròi 2 loại khung Layout: `AppLayout` (chứa Footer) và `WorkspaceLayout` (toàn màn hình, triệt tiêu phân tâm, KHÔNG Footer).
- **Trải nghiệm các màn hình:** Tất cả màn hình chức năng cốt lõi đều được quy định cấu trúc và ma trận 4 trạng thái bắt buộc: *Đang tải (Loading)*, *Trống (Empty)*, *Báo lỗi (Error)*, và *Chế độ tối (Dark Mode)*.
- **Tính toàn vẹn dữ liệu:** Không dùng dữ liệu mock/giả lập; quy trình dọn dẹp dữ liệu thử nghiệm tại FR-4 bắt buộc tuân thủ 4 bước an toàn nghiêm ngặt (`pg_dump`, `dry-run`, duyệt thủ công, xóa trong transaction).

---

## 1. Tầm nhìn & Mục tiêu Sản phẩm (Vision)

Cognito (EduShare AI) được định vị là **"The Operating System for Intellectual Mastery"** — Hệ điều hành phục vụ việc học tập sâu, tiếp thu tri thức có hệ thống và rèn luyện trí nhớ dài hạn dành cho học sinh, sinh viên và người tự học nghiêm túc.

Nền tảng tích hợp chặt chẽ 5 công cụ cốt lõi trong một chu trình học khép kín:
1. **Tiếp nhận & Nghiên cứu:** Trình đọc tài liệu đa định dạng kết hợp Trợ lý AI hỏi đáp theo ngữ cảnh thực tế.
2. **Hệ thống hóa:** Sổ tay ghi chép Markdown liên kết và Sơ đồ tư duy (Mindmap) trực quan.
3. **Ghi nhớ sâu:** Bộ thẻ ghi nhớ Flashcards vận hành theo thuật toán Lặp lại ngắt quãng (Spaced Repetition SM-2).
4. **Kiểm tra năng lực:** Hệ thống tạo đề thi và luyện trắc nghiệm AI với lời giải chi tiết.
5. **Kỷ luật & Tập trung:** Buồng Pomodoro sâu (Deep Focus) cùng bảng theo dõi tiến độ học tập (Streak & Focus Score).

---

## 2. Đối tượng Người dùng & Hành trình Người dùng (Target Users & Journeys)

### 2.1. Chân dung Người dùng Mục tiêu (Personas)
* **Persona 1 - Minh (Sinh viên Đại học / Người tự học chuyên sâu):** Thường xuyên phải đọc giáo trình, tài liệu chuyên ngành dài hàng trăm trang; cần trợ lý AI tóm tắt, giải thích khái niệm khó, tạo thẻ flashcard để ôn thi và cần không gian tĩnh lặng, không bị quảng cáo làm phiền.
* **Persona 2 - Lan (Học sinh THPT ôn thi học sinh giỏi / Đại học):** Cần làm đề trắc nghiệm thử sức, tạo sơ đồ tư duy để xâu chuỗi kiến thức lịch sử, sinh học, toán học; học tập ngắt quãng theo phiên Pomodoro 25-50 phút để duy trì phong độ.
* **Persona 3 - Quản trị viên & Tác giả Nội dung (Admin/Tác giả OER):** Quản lý kho tài liệu mở, kiểm duyệt nội dung cộng đồng, đảm bảo tính bản quyền và giám sát hệ thống.

### 2.2. Không phục vụ ở Phiên bản Hiện tại (Non-Users for v1)
* Nhóm người dùng tìm kiếm mạng xã hội giải trí hoặc phòng chat công cộng (Cognito không phải diễn đàn chat phi học thuật; chỉ cho phép bạn bè kết nối nhắn tin bài học).

### 2.3. Các Hành trình Người dùng Trọng yếu (Key User Journeys)

* **UJ-1. Nghiên cứu tài liệu chuyên sâu cùng Trợ lý AI:**
  - *Ngữ cảnh:* Người dùng đã đăng nhập, truy cập `/viewer/[id]`.
  - *Hành trình:* Khung đọc tài liệu hiển thị bên trái (nếu không có file vật lý thì render Markdown có sẵn trong DB); khung Trợ lý AI bên phải sẵn sàng nhận câu hỏi. Người dùng bôi đen đoạn văn bản, chọn "Giải thích bằng AI". AI phản hồi có trích dẫn. Người dùng nhấn nút "Tạo Flashcard từ câu trả lời này", hệ thống tự động lưu thẻ vào bộ thẻ ôn tập.
  - *Kết quả:* Tài liệu luôn hiển thị được hoặc có ErrorState thoát hiểm rõ ràng kèm nút báo lỗi, không có hiện tượng khung trắng hay lỗi cụt.

* **UJ-2. Phiên ôn tập Flashcard ngắt quãng hàng ngày (Spaced Repetition):**
  - *Ngữ cảnh:* Người dùng vào `/flashcards`, thấy thông báo có 15 thẻ đến hạn ôn hôm nay.
  - *Hành trình:* Bấm "Ôn tập ngay" (`/flashcards/[deckId]`), vào khung tập trung `max-w-4xl`. Thẻ hiển thị câu hỏi mặt trước; nhấn Space hoặc chạm thẻ để lật mặt sau xem đáp án. Người dùng đánh giá độ nhớ qua 4 nút (*Lại / Khó / Tốt / Dễ*). Hệ thống tính toán lại khoảng thời gian lặp lại theo thuật toán SM-2.
  - *Kết quả:* Hoàn thành phiên ôn, nhận điểm kinh nghiệm Streak, hiển thị màn hình chúc mừng.

* **UJ-3. Luyện đề thi trắc nghiệm do AI sinh từ tài liệu:**
  - *Ngữ cảnh:* Người dùng chọn tài liệu trong `/library`, bấm "Tạo đề thi trắc nghiệm" (`/ai-test`).
  - *Hành trình:* Chọn số lượng câu hỏi (10/20 câu), bấm tạo đề. Hệ thống chuyển sang `/quiz/[testSetId]` trong khung `max-w-4xl`. Người dùng chọn từng đáp án; thanh tiến trình cập nhật trực quan. Bấm "Nộp bài", hệ thống chấm điểm ngay lập tức kèm giải thích chi tiết cho từng câu đúng/sai.
  - *Kết quả:* Điểm số và lịch sử bài thi được lưu vào cơ sở dữ liệu và hiển thị trên tab Lịch sử học tại `/progress`.

* **UJ-4. Tra cứu & Chia sẻ Tài liệu Mở tại Cộng đồng:**
  - *Ngữ cảnh:* Người dùng vào `/community`.
  - *Hành trình:* Mặc định thấy Tab 1 (Bộ thẻ chia sẻ). Người dùng bấm sang Tab 2 (Tài liệu cộng đồng), tìm kiếm theo môn học, xem các tài liệu OER có giấy phép `CC-BY`. Người dùng bấm "Lưu vào kho cá nhân", "Xem trực tiếp" hoặc "Báo cáo vi phạm" nếu thấy sai lệch.
  - *Kết quả:* Không có bất kỳ nút nhắn tin riêng cho người lạ nào trên danh sách tài liệu công cộng.

* **UJ-5. Quản lý tài khoản & Tùy biến giao diện Tối Ấm:**
  - *Ngữ cảnh:* Người dùng học đêm, vào `/settings`.
  - *Hành trình:* Chuyển giao diện sang "Chế độ tối". Toàn bộ trang đổi sang nền than ấm `#161916`, thẻ card `#1F2420`, chữ `#EDECE6`. Độ tương phản cao, mắt không bị chói.
  - *Kết quả:* Trạng thái theme được lưu vào `localStorage`, đồng bộ trên toàn bộ các trang màn hình.

---

## 3. Thuật ngữ & Quy ước Khái niệm (Glossary)

* **Design Token (Biến giao diện):** Giá trị kiểu dáng (màu sắc, viền, font, bo góc) được định nghĩa duy nhất tại `frontend/src/styles/design-tokens.css` và ánh xạ qua `tailwind.config.js`. Không dùng class hardcode.
* **Primary Green (`#1a3d28`):** Màu xanh rừng thương hiệu chốt duy nhất làm `var(--color-primary)`.
* **Warm Dark Palette (Bảng màu tối ấm):** Hệ màu tối tông than ấm rêu sẫm `#161916` thay thế hoàn toàn màu xanh đen lạnh `#0B0F17`.
* **AppLayout:** Khung giao diện chuẩn có thanh điều hướng Sticky Navbar, nội dung căn giữa theo `max-w` quy định và có **Footer chuẩn ở chân trang**.
* **WorkspaceLayout:** Khung làm việc 2 cột toàn màn hình (`h-[calc(100vh-3.5rem)]`, `overflow-hidden`), tối ưu cho sự tập trung sâu, **tuyệt đối KHÔNG có Footer**.
* **Spaced Repetition System (SRS / SM-2):** Thuật toán ôn tập lặp lại ngắt quãng dựa trên độ khó và điểm nhớ của người dùng.
* **OER (Open Educational Resources):** Tài nguyên giáo dục mở thuộc Whitelist 4 giấy phép công khai (`CC0`, `CC-BY`, `CC-BY-SA`, `Public Domain`), loại bỏ hoàn toàn `MIT` (dành cho mã nguồn) và `OpenStax-License` (không chuẩn), nghiêm cấm tài liệu có điều khoản phi thương mại `NC` (như phần lớn MIT OCW `CC BY-NC-SA` gây rủi ro thương mại đối với nền tảng có gói trả phí). Bắt buộc lưu rõ nguồn, giấy phép, tác giả.
* **Test Set (Bộ đề thi):** Tập hợp các câu hỏi trắc nghiệm kèm đáp án và lời giải, sinh tự động bởi AI hoặc nhập thủ công.
* **Dry-Run (Chạy thử nghiệm kiểm kê):** Lệnh truy vấn kiểm tra số lượng và danh sách bản ghi trước khi thực hiện thao tác xóa dữ liệu vật lý.

---

## 4. Yêu cầu Chức năng & Bảng Ma trận Truy vết (Functional Requirements & Traceability)

### 4.0. Bảng Ma Trận Truy Vết: Danh Sách Yêu Cầu Gốc (FR1-FR11) → PRD (FR-1..FR-21)

Bảng đối chiếu minh bạch giữa danh sách **11 Yêu cầu Gốc (FR1-FR11)** do Chủ dự án cung cấp và danh mục FR trong PRD. Mọi yêu cầu không thuộc danh sách gốc FR1-FR11 đều được ghi rõ ở cột Yêu cầu gốc và Trạng thái là **`Tách thêm, chờ duyệt`** (tuyệt đối KHÔNG ghi "Đã khớp"). Riêng tính năng PayOS là ngoài phạm vi, chỉ giữ ở mức không đổi backend và chỉ áp token UI:

| Yêu Cầu Gốc | Tên Miền Nghiệp Vụ Gốc | Ánh Xạ Sang PRD | Ghi Chú Phân Loại / Chi Tiết | Trạng Thái Đối Chiếu |
| :--- | :--- | :--- | :--- | :--- |
| **FR1** | **Điều hướng** | **FR-3**: Cấu trúc Layout Toàn Cục & Điều hướng Navbar / Footer (phần Navbar) | Khớp yêu cầu điều hướng Navbar tập trung trong AppLayoutWrapper | **Đã khớp** |
| **FR2** | **Viewer** | **FR-7**: Trình đọc Tài liệu & Trợ lý AI (`/viewer/[id]`) | Khớp yêu cầu Viewer đa định dạng, triệt tiêu hoàn toàn khung trắng | **Đã khớp** |
| **FR3** | **Tài liệu** | **FR-10**: Kho Tài liệu Cá nhân (`/library`) | Khớp yêu cầu kho tài liệu cá nhân, tải lên, phân loại | **Đã khớp** |
| **FR4** | **Dọn dữ liệu** | **FR-4**: Quy trình Dọn dẹp Dữ liệu Thử nghiệm An toàn 4 Bước | Khớp yêu cầu backup pg_dump, dry-run, duyệt thủ công, bảo vệ ID 1, 3, 5, 5035 | **Đã khớp** |
| **FR5** | **Cộng đồng** | **FR-6**: Cộng đồng Học tập (`/community`) | Khớp yêu cầu 2 tab chia sẻ, gỡ nút chat người lạ, báo cáo vi phạm | **Đã khớp** |
| **FR6** | **Bản quyền** | **FR-21**: Quản lý Bản quyền & Nhập liệu Nguồn mở OER (phần Bản quyền) | Khớp yêu cầu cam kết bản quyền, chống cào dữ liệu lậu | **Đã khớp** |
| **FR7** | **Import OER** | **FR-21**: Quản lý Bản quyền & Nhập liệu Nguồn mở OER (phần OER) | Khớp yêu cầu nhập nguồn mở (OpenStax, Wikibooks), lưu source_url, license, author | **Đã khớp** |
| **FR8** | **Kết bạn** | **FR-14**: Bạn bè & Hộp thư Tin nhắn Riêng (phần `/friends`) | Khớp yêu cầu quan hệ bạn bè, gửi/nhận lời mời kết bạn | **Đã khớp** |
| **FR9** | **Tin nhắn** | **FR-14**: Bạn bè & Hộp thư Tin nhắn Riêng (phần `/messages`) | Khớp yêu cầu chỉ bạn bè mới chat, tin nhắn cũ chọn Phương án A (chỉ đọc + nút kết bạn) | **Đã khớp** |
| **FR10** | **Landing** | **FR-5**: Trang chủ / Landing Page (`/`, `/home`) | Khớp yêu cầu landing page, bento grid, showcase 6 bộ thẻ thật | **Đã khớp** |
| **FR11** | **Layout** | **FR-3**: Cấu trúc Layout Toàn Cục & Điều hướng Navbar / Footer (phần Layout & Footer) | Khớp yêu cầu AppLayout có Footer vs WorkspaceLayout không Footer | **Đã khớp** |
| **Tách thêm, chờ duyệt** | *Hệ thống Token UI* | **FR-1**: Hệ thống Design Token Toàn diện & Bảng Màu Tối Ấm | Nền tảng token hóa CSS, warm dark `#161916` theo UX Spec | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Bộ Component UI* | **FR-2**: Bộ UI Component Dùng Chung & Ma trận Trạng thái Chuẩn | Chuẩn hóa 14 core components & 4 trạng thái Loading/Empty/Error/Dark | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Ghi chú học tập* | **FR-8**: Sổ tay Ghi chú (`/notes`) | Không gian soạn thảo Markdown liên kết tài liệu | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Sơ đồ kiến thức (Mindmap)*| **FR-9**: Sơ đồ Tư duy (`/mindmap`) | Trực quan hóa đồ thị Mermaid SVG tương tác | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Luyện trắc nghiệm AI* | **FR-11**: Đề thi & Trắc nghiệm AI (`/quiz` & `/ai-test`) | Bộ tạo đề thi AI và phòng làm bài thi trắc nghiệm | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Đồng hồ Pomodoro* | **FR-12**: Phòng Tập trung Pomodoro (`/focus`) | Không gian tập trung sâu, đồng hồ đếm ngược | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Tiến độ & Streak* | **FR-13**: Tiến độ & Lịch sử Học tập (`/progress`) | Theo dõi biểu đồ học tập và nhận redirect từ `/study-sessions` | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Tìm kiếm toàn sàn (Search)*| **FR-15**: Tìm kiếm Toàn cầu Đa Đối tượng (`/search`) | Thanh tìm kiếm hợp nhất đa tài nguyên | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Hồ sơ học viên* | **FR-16**: Hồ sơ Cá nhân & Người dùng Công khai (`/profile`) | Quản lý thông tin cá nhân và tài nguyên đã đóng góp | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Cài đặt hệ thống* | **FR-17**: Cài đặt Tài khoản & Giao diện (`/settings`) | Đổi mật khẩu, chuyển đổi Theme Sáng/Tối ấm | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Gói cước Premium & PayOS*| **FR-18**: Gói Hội viên Premium & Thanh toán PayOS (`/premium`)| Ngoài phạm vi MVP; không đổi backend PayOS, chỉ áp token UI | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Xác thực đăng nhập* | **FR-19**: Xác thực Người dùng: Đăng nhập, Đăng ký & Đặt lại MK | Modal Auth và trang `/reset-password` có Footer | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Thẻ ghi nhớ SM-2* | **FR-20**: Bộ Thẻ Ghi Nhớ Flashcards & Ôn tập SM-2 (`/flashcards`)| Phòng lật thẻ 3D theo thuật toán Spaced Repetition SM-2 | **Tách thêm, chờ duyệt** |
| **Tách thêm, chờ duyệt** | *Quản trị viên (Admin)* | **Admin**: Cổng Quản trị Hệ thống (`/admin/*`) | Bảng quản trị người dùng và kiểm duyệt báo cáo vi phạm | **Tách thêm, chờ duyệt** |

---

### NHÓM 1: HỆ THỐNG DESIGN SYSTEM, TOKEN & KHUNG GIAO DIỆN (PHASE 1)

#### FR-1: Hệ thống Design Token Toàn diện & Bảng Màu Tối Ấm
* **Mô tả:** Hệ thống phải cung cấp file `frontend/src/styles/design-tokens.css` định nghĩa tập trung tất cả biến CSS cho cả 2 chế độ Sáng và Tối ấm, đồng thời ánh xạ vào `frontend/tailwind.config.js`.
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ nền tảng UI Design System & Warm Dark Mode.
* **Thực hiện hành trình:** UJ-5.
* **Tiêu chí nghiệm thu đo lường được (Acceptance Criteria):**
  1. *Đo lường Token:* `design-tokens.css` chứa đầy đủ 12 semantic tokens: `--color-bg`, `--color-card`, `--color-card-subtle`, `--color-border`, `--color-text-main`, `--color-text-muted`, `--color-primary`, `--color-primary-hover`, `--color-primary-fg`, `--color-mint-subtle`, `--color-mint-border`, `--color-premium`.
  2. *Giá trị chốt:* Light mode có `--color-primary: #1a3d28`, `--color-bg: #F4F2EC`. Dark mode có `--color-bg: #161916`, `--color-card: #1F2420`, `--color-primary: #2D6A4F`.
  3. *Loại bỏ hardcode:* Lệnh kiểm tra code không còn bất kỳ sự xuất hiện nào của các class `dark:text-emerald-400`, `dark:bg-emerald-700` hoặc mã màu `#0B0F17`.
  4. *Tiêu chuẩn Ngưỡng Tương Phản (Contrast Ratio Thresholds - Áp dụng cho CẢ Light mode và Dark mode):*
     - **Chữ thường (Regular text, < 18pt / 24px):** Tỷ lệ tương phản **≥ 4.5 : 1** (Đạt chuẩn WCAG AA).
     - **Chữ lớn (Large text ≥ 18pt hoặc bold ≥ 14pt) & Thành phần giao diện / icon / viền:** Tỷ lệ tương phản **≥ 3.0 : 1** (Đạt chuẩn WCAG AA).
     - *(Ghi chú tham khảo thực tế: Bảng màu dark ấm đề xuất đạt chữ chính `#EDECE6` trên `#161916` ~14.9:1; Nút chính `#2D6A4F` với chữ trắng ~5.2:1).*

#### FR-2: Bộ UI Component Dùng Chung & Ma trận Trạng thái Chuẩn
* **Mô tả:** Xây dựng bộ thư viện UI tại `frontend/src/components/common/`: `Button`, `Badge`, `Card`, `Tabs`, `Input`, `Select`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Avatar`, `ProgressBar`, `PageHeader`.
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ chuẩn hóa 14 UI components và ma trận 4 trạng thái.
* **Thực hiện hành trình:** UJ-1, UJ-2, UJ-3, UJ-4, UJ-5.
* **Tiêu chí nghiệm thu đo lường được (Acceptance Criteria):**
  1. *Button:* Hỗ trợ đủ 5 biến thể (`primary`, `secondary`, `ghost`, `premium`, `danger`). `Button primary` dùng nền `var(--color-primary)` với text trắng.
  2. *EmptyState:* Hiển thị icon minh họa dạng nét mảnh, tiêu đề, văn bản mô tả và nút CTA hành động bằng tiếng Việt.
  3. *ErrorState:* Hiển thị cảnh báo lỗi, nút "Thử lại" và nút "Quay lại" kích hoạt đúng callback.
  4. *Kiểm tra rác:* File rác `frontend/src/components/Button.tsx` (nút xanh blue-500) được kiểm tra 0 nơi phụ thuộc trước khi loại bỏ ở bước dọn dẹp.

#### FR-3: Cấu trúc Layout Toàn Cục & Điều hướng Navbar / Footer
* **Mô tả:** Chuẩn hóa bố cục phân tầng thông qua `AppLayoutWrapper`, tách biệt `AppLayout` và `WorkspaceLayout`. Navbar tập trung trong wrapper; Footer chỉ xuất hiện ở `AppLayout`. Dropdown điều hướng trên Navbar chốt tên gọi chính thức là **"Góc học tập"**.
* **Phân loại:** **Ánh xạ từ FR1 (Điều hướng) & FR11 (Layout)**.
* **Thực hiện hành trình:** UJ-1, UJ-4.
* **Tiêu chí nghiệm thu đo lường được (Acceptance Criteria):**
  1. *Thí điểm Navbar an toàn (FR1):* Đưa Navbar vào `AppLayoutWrapper` và thí điểm thành công trên 2 route `/notes` và `/community`. Kết quả: không xuất hiện 2 Navbar trùng nhau, không còn lỗi giật padding `pt-20`.
  2. *Quy chuẩn Footer (FR11):* Footer xuất hiện đúng ở các màn hình `AppLayout` (bao gồm cả `/reset-password` và `/shared/[token]`); và **100% biến mất (0 thẻ Footer trong DOM)** trên các trang `WorkspaceLayout` (`/viewer/*`, `/focus`, `/notes`, `/mindmap`, `/messages`, `/admin/*`).
  3. *Navbar Active State:* Mục menu hiện tại hiển thị rõ ranh giới với nền `var(--color-mint-subtle)`, viền `var(--color-mint-border)` và chữ `var(--color-primary)` in đậm. Dropdown **"Góc học tập"** active khi đường dẫn thuộc 5 công cụ con.
  4. *Mobile Drawer (< 768px):* Nút Hamburger mở Drawer hiển thị chính xác danh sách 12 mục theo quy chuẩn tại mục 5.3 của UX Spec.

---

### NHÓM 2: DỌN DẸP DỮ LIỆU, SAO LƯU & BẢO VỆ TÀI KHOẢN (PHASE 4 / FR-4)

#### FR-4: Quy trình Dọn dẹp Dữ liệu Thử nghiệm An toàn (Bắt buộc 4 Bước)
* **Mô tả:** Hệ thống thực hiện thanh lọc dữ liệu rác phát sinh trong quá trình chạy test suite tự động (`phase41_*`, `phase30_*`, `test_*`), loại bỏ các bộ đề test và tài liệu rác mà không gây tổn hại đến tài khoản thật và dữ liệu giáo trình.
* **Phân loại:** **Ánh xạ từ FR4 (Dọn dữ liệu)**.
* **Các bước bắt buộc thực hiện (Enforced Sequence):**
  1. **Bước 1 - Sao lưu vật lý (`pg_dump`) & Kiểm tra Tính hợp lệ:**
     * Lệnh thực thi: `docker exec -i myproject-postgres pg_dump -U tu cognito > backups/pre_cleanup_backup_YYYYMMDD.sql` *(sử dụng cờ `-i`, tuyệt đối không dùng cờ `-t` để tránh sinh ký tự điều khiển TTY `\r` làm hỏng tệp trên Windows; sử dụng đúng container `myproject-postgres` và user `tu` theo cấu hình docker-compose)*.
     * Kiểm tra tính hợp lệ của bản sao lưu: Chạy lệnh kiểm tra cấu trúc `pg_restore --list` (nếu sao lưu định dạng archive) hoặc tiến hành phục hồi thử nghiệm vào một cơ sở dữ liệu tạm (`cognito_test_restore`) để xác nhận tính toàn vẹn 100% dữ liệu, không chỉ dựa đơn thuần vào dung lượng file.
     * Cấu hình Git: Thư mục `backups/` và `**/backups/` bắt buộc phải được khai báo trong `.gitignore`.
  2. **Bước 2 - Kiểm kê thử nghiệm (`dry-run`) & Cơ chế Cảnh Báo Phân Tầng:**
     * Thực thi script SQL kiểm đếm thống kê `SELECT COUNT(*)` nhóm theo tiền tố người dùng và danh mục tài liệu.
     * **Báo cáo in thêm cột `owner_id` (hoặc `user_id` / `created_by`)** cho từng bộ thẻ, tài liệu, ghi chú và đề thi dự kiến xóa.
     * **Cơ chế Dừng Khẩn Cấp (Fail-Safe ABORT):** Script tự động kiểm tra trước: Nếu phát hiện bất kỳ bản ghi nào dự kiến xóa có `owner_id` thuộc danh sách tài khoản bảo vệ tuyệt đối (**`1`, `3`, `5`, `5035`**), script phải **ABORT / DỪNG NGAY LẬP TỨC** và báo lỗi đỏ, không cho phép tiếp tục.
     * **Cơ chế Cảnh Báo Vàng & Tách Riêng (Yellow Warning & Segregation):** Nếu phát hiện bản ghi dự kiến xóa có `owner_id` thuộc danh sách tài khoản tạm giữ (**`2`, `7`, `8`, `21`, `22`**), script phải gắn cờ **CẢNH BÁO VÀNG**, tự động **tách riêng các bản ghi này ra khỏi danh sách dự kiến xóa** và đưa vào danh sách chờ duyệt riêng từng ID từ Chủ dự án. Chỉ khi Chủ dự án duyệt từng ID cụ thể mới được xử lý tiếp.
     * Đếm chính xác số lượng `test_sets` rác và liệt kê chi tiết số lượng bản ghi phụ thuộc khóa ngoại (Foreign Key Dependencies) theo từng bảng liên quan: `questions`, `assignment_attempts`, `attempt_answers`, `flashcards`, `document_chunks`, `notes`, `mindmaps`... để đảm bảo cascade sạch sẽ, không gây lỗi ràng buộc FK constraint.
  3. **Bước 3 - Phê duyệt thủ công từ Chủ dự án (Manual Approval Gate):**
     * Trình báo cáo `dry-run` cho chủ dự án (Tu).
     * Tiêu chí đo lường: Chỉ khi chủ dự án xác nhận bằng văn bản ("Đồng ý thực hiện xóa") thì script xóa thực tế mới được phép kích hoạt.
  4. **Bước 4 - Thực thi xóa trong Transaction an toàn:**
     * Chạy migration xóa dữ liệu bọc trong `BEGIN ... COMMIT` với lệnh rollback nếu xảy ra bất kỳ lỗi ngoại lệ nào.
     * Tiêu chí đo lường an toàn tài khoản:
       - **Bảo vệ tuyệt đối (Không bao giờ xóa):** ID `1` (Admin), ID `3` (tu nguyen), ID `5` (tunek), ID `5035` (Thư viện mở Cognito). Truy vấn sau khi xóa xác nhận 4 ID này còn nguyên vẹn 100%.
       - **Tạm giữ chờ duyệt:** ID `2`, `7`, `8`, `21`, `22` được giữ lại nguyên trạng, tách riêng khỏi danh sách xóa và chờ Chủ dự án duyệt từng ID.
       - 155 tài khoản test rác được dọn sạch hoàn toàn khỏi bảng `users`.

---

### NHÓM 3: ĐẶC TẢ CHI TIẾT 16 MÀN HÌNH CHỨC NĂNG (PHASE 2 & PHASE 3)

Mỗi màn hình bắt buộc phải có đầy đủ 4 trạng thái giao diện: *Loading*, *Empty*, *Error*, *Dark Mode*.

#### FR-5: Trang chủ / Landing Page (`/` và `/home`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Phân loại:** **Ánh xạ từ FR10 (Landing)**.
* **Mô tả:** Điểm chạm đầu tiên giới thiệu hệ sinh thái. Người dùng chưa đăng nhập thấy Hero Playfair Display + 5 khối bento công cụ + Showcase 6 bộ thẻ thật + Bảng giá + FAQ. Người dùng đã đăng nhập thấy khối "Tiếp tục học" (Streak, thẻ đến hạn, tài liệu gần nhất).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Font tiêu đề:* Chữ tiêu đề dùng đúng font Serif `Playfair Display`. Điểm nhấn có đường gạch thẳng màu mint (`#BFEAD6`), không có đường cong SVG lượn sóng.
  2. *Dữ liệu thật:* 6 bộ thẻ trong Showcase lấy từ API thật của các bộ thẻ công khai có nhiều lượt lưu nhất, không hardcode mock data.
  3. *Trạng thái:* Khi mạng chậm, hiển thị Bento Skeleton tương ứng; khi API lỗi, hiển thị Toast báo lỗi tiếng Việt thân thiện.

#### FR-6: Cộng đồng Học tập (`/community`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Phân loại:** **Ánh xạ từ FR5 (Cộng đồng)**.
* **Mô tả:** Nền tảng chia sẻ học thuật với 2 Tab riêng biệt: Tab 1 "Flashcard chia sẻ" và Tab 2 "Tài liệu cộng đồng".
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Phân tách Tab:* Thẻ bài đăng Tab 1 hiển thị số thẻ, tác giả, tim, nút "Học ngay". Thẻ Tab 2 hiển thị nhãn giấy phép `CC-BY`, nút "Xem tài liệu".
  2. *Quyền riêng tư:* **100% không có nút nhắn tin trực tiếp người lạ** trên các thẻ bài đăng công cộng.
  3. *Báo cáo vi phạm:* Có nút "Báo cáo" trên từng tài nguyên công cộng cho phép học viên gửi phản ánh vi phạm bản quyền hoặc nội dung độc hại về hệ thống quản trị kiểm duyệt.
  4. *Trạng thái:* Tab không có dữ liệu hiển thị `EmptyState` chiếc hộp kèm nút "Chia sẻ tài nguyên".

#### FR-7: Trình đọc Tài liệu & Trợ lý AI (`/viewer/[id]`)
* **Layout:** `WorkspaceLayout` (Toàn màn hình, KHÔNG Footer) | **Container:** `w-full`
* **Phân loại:** **Ánh xạ từ FR2 (Viewer)**.
* **Mô tả:** Bố cục 2 cột Split-Pane. Cột trái: Trình đọc văn bản (PDF, Word/docx, Ảnh, Markdown, Plain text). Cột phải: Trợ lý AI tương tác trực tiếp theo nội dung.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Khắc phục lỗi Viewer:* Mọi tài liệu khi mở ra:
     - **Hoặc hiển thị được đầy đủ nội dung trực quan** tương ứng với định dạng (`PDF`, `Ảnh`, `Word / docx`, `Markdown`, `Plain text`). Nếu tài liệu trong DB có `doc_url = null` nhưng có `solution_text`, hệ thống tự động kết xuất Markdown qua `react-markdown` (không bật `rehype-raw` theo NFR-6).
     - **Hoặc nếu tệp bị lỗi / không tải được**, hệ thống hiển thị `ErrorState` rõ ràng kèm nút "Quay lại Thư viện" và nút "Báo lỗi tài liệu" (cho phép gửi phản hồi).
     - **Tuyệt đối không còn tình trạng khung trắng (blank screen)** hay thông báo cụt "Không có đường dẫn tài liệu".
  2. *Trợ lý AI:* Khung chat AI hỗ trợ bôi đen văn bản để giải thích, tóm tắt và tạo câu hỏi ôn tập.

#### FR-8: Sổ tay Ghi chú (`/notes`)
* **Layout:** `WorkspaceLayout` (Toàn màn hình, KHÔNG Footer) | **Container:** `w-full`
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ không gian học tập cá nhân.
* **Mô tả:** Giao diện 2 cột. Cột trái: Tìm kiếm ghi chú và danh sách phân loại. Cột phải: Khung soạn thảo Markdown thời gian thực (hiển thị qua `react-markdown` không bật `rehype-raw` theo NFR-6).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Đồng bộ Navbar:* Áp dụng thành công Navbar từ `AppLayoutWrapper`, không có Navbar kép, không giật màn hình.
  2. *Trạng thái:* Khi chưa có ghi chú nào, cột trái hiển thị `EmptyState` kèm nút "Tạo ghi chú đầu tiên".
  3. *Tự động lưu:* Trạng thái lưu (Đang lưu... / Đã lưu lúc HH:mm) hiển thị rõ ràng bằng tiếng Việt.

#### FR-9: Sơ đồ Tư duy (`/mindmap`)
* **Layout:** `WorkspaceLayout` (Toàn màn hình, KHÔNG Footer) | **Container:** `w-full`
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ không gian học tập cá nhân.
* **Mô tả:** Cột trái quản lý danh sách sơ đồ; Cột phải hiển thị kết xuất đồ thị Mermaid SVG tương tác (zoom, pan, copy code).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Dark Mode Mermaid:* Các nút đồ thị hiển thị viền mint, nền tối hài hòa với bảng màu `#161916`.
  2. *Báo lỗi cú pháp:* Cú pháp Mermaid sai sẽ hiển thị thông báo lỗi thân thiện thay vì làm sập trang.

#### FR-10: Kho Tài liệu Cá nhân (`/library`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Phân loại:** **Ánh xạ từ FR3 (Tài liệu)**.
* **Mô tả:** PageHeader chuẩn + Thống kê Streak + Lọc danh mục môn học + Lưới thẻ Bento tài liệu cá nhân + Modal tải file.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Upload an toàn:* Hỗ trợ tải file PDF/Word/Ảnh < 10MB lên Cloudinary, lưu trữ thông tin phân loại môn học vào cơ sở dữ liệu.
  2. *Trạng thái:* Khi người dùng mới chưa có tài liệu, hiển thị `EmptyState` hướng dẫn tải lên tài liệu đầu tiên.

#### FR-11: Đề thi & Trắc nghiệm AI (`/quiz` & `/ai-test`)
* **Layout:** `AppLayout` | **Container:** `max-w-4xl` (Khung hẹp tập trung, tránh bè ngang)
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ module thi trắc nghiệm.
* **Mô tả:** `/ai-test` phục vụ sinh đề thi từ tài liệu; `/quiz/[testSetId]` phục vụ làm bài trắc nghiệm với thanh tiến trình và tính điểm tự động.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Trải nghiệm làm bài:* Chọn đáp án chuyển màu highlight xanh rừng; nộp bài hiển thị bảng tổng kết điểm số kèm lời giải chi tiết cho từng câu hỏi.
  2. *Lưu trữ kết quả:* Kết quả bài thi được lưu vào DB và hiển thị trên tab Lịch sử học tại `/progress`.

#### FR-12: Phòng Tập trung Pomodoro (`/focus`)
* **Layout:** `WorkspaceLayout` (Toàn màn hình, KHÔNG Footer) | **Container:** `w-full`
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ module tập trung sâu Pomodoro.
* **Mô tả:** Chế độ tĩnh lặng tuyệt đối: Đồng hồ đếm ngược tối giản (25/45/60 phút), âm thanh nền thư giãn và bảng tổng kết điểm tập trung.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Môi trường Deep Work:* Màn hình buồng tối `#121412`, vòng tiến trình đếm ngược xanh mint sáng.
  2. *Ghi nhận phiên:* Kết thúc phiên Pomodoro, thời gian tập trung tự động đồng bộ vào bảng theo dõi tiến độ.

#### FR-13: Tiến độ & Lịch sử Học tập (`/progress`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ theo dõi tiến độ và nhận redirect 308 từ `/study-sessions`.
* **Mô tả:** Gồm 2 Tab: Tab 1 "Tiến độ & Mục tiêu" (biểu đồ Recharts, streak) và Tab 2 "Lịch sử học tập" (nhận dữ liệu hợp nhất từ `/study-sessions` cũ).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Bảo toàn chuyển hướng (Redirect 308):* Tuyến đường cũ `/study-sessions` phải được cấu hình chuyển hướng vĩnh viễn **HTTP 308** sang `/progress?tab=history`, bảo toàn toàn bộ tham số truy vấn (query parameters).
  2. *Hiển thị lịch sử:* Danh sách dòng thời gian hiển thị chi tiết các phiên học Pomodoro, bài thi trắc nghiệm và phiên lật thẻ.

#### FR-14: Bạn bè & Hộp thư Tin nhắn Riêng (`/friends` & `/messages`)
* **Layout:** `/friends` dùng `AppLayout` (`max-w-5xl`); `/messages` dùng `WorkspaceLayout` (`w-full`, KHÔNG Footer).
* **Phân loại:** **Ánh xạ từ FR8 (Kết bạn) & FR9 (Tin nhắn)**.
* **Mô tả:** Quản lý kết nối bạn bè và hệ thống chat thời gian thực.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Quy tắc bảo mật tin nhắn mới (FR8 & FR9):* **Chỉ người dùng có quan hệ bạn bè đã chấp nhận (`friendships.status = 'accepted'`) mới được mở hộp chat và gửi tin nhắn mới**. API backend từ chối trả về cuộc hội thoại (HTTP 403 Forbidden) nếu 2 người dùng chưa là bạn bè.
  2. *Xử lý dữ liệu tin nhắn cũ trong bảng `messages` (ĐÃ CHỐT: PHƯƠNG ÁN A):*
     - **Chế độ Chỉ Đọc (Read-only):** Giữ nguyên toàn bộ lịch sử tin nhắn cũ để hai bên xem lại nội dung cuộc trò chuyện trước đây.
     - **Khóa soạn thảo:** Khóa ô nhập văn bản (disabled) và ẩn nút gửi tin nhắn khi hai tài khoản chưa có quan hệ bạn bè hợp lệ (`friendships.status != 'accepted'`).
     - **Nút hành động chuyển đổi:** Hiển thị banner thông báo: *"Hai bạn chưa kết bạn. Cần kết bạn để tiếp tục trò chuyện"* kèm **nút "Gửi lời mời kết bạn" ngay ở màn hình chỉ đọc** để người dùng có thể gửi yêu cầu kết bạn chỉ với 1 click ngay tại chỗ.
  3. *Tính năng Chặn & Báo cáo:* Cho phép người dùng chặn tin nhắn (Block) hoặc gửi báo cáo vi phạm (Report) người dùng quấy rối.

#### FR-15: Tìm kiếm Toàn cầu Đa Đối tượng (`/search`)
* **Layout:** `AppLayout` | **Container:** `max-w-7xl`
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ thanh tìm kiếm toàn sàn.
* **Mô tả:** Ô tìm kiếm debounce 300ms + Bộ lọc đa đối tượng (Tài liệu, Flashcard, Đề thi, Bạn bè) + Lưới kết quả phân trang.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Bộ lọc chuẩn:* Chuyển tab lọc kết quả trả về tương ứng đúng loại tài nguyên.
  2. *Trạng thái:* Không có kết quả hiển thị `EmptyState` kèm các từ khóa học tập gợi ý.

#### FR-16: Hồ sơ Cá nhân & Người dùng Công khai (`/profile` & `/profile/[userId]`)
* **Layout:** `AppLayout` | **Container:** `max-w-5xl`
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ quản lý hồ sơ cá nhân.
* **Mô tả:** Banner thông tin học viên (Avatar, bio, trường lớp), bảng thành tích học tập (Streak, tài liệu đã đóng góp, thẻ đã thuộc) và danh mục tài nguyên công khai.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Phân quyền chỉnh sửa:* Chỉ chủ tài khoản mới thấy nút "Chỉnh sửa hồ sơ"; khách chỉ thấy thông tin công khai và nút "Kết bạn".

#### FR-17: Cài đặt Tài khoản & Giao diện (`/settings`)
* **Layout:** `AppLayout` | **Container:** `max-w-4xl`
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ cài đặt và chuyển đổi Theme.
* **Mô tả:** Quản lý thông tin tài khoản, đổi mật khẩu, bảo mật 2 lớp và tùy chọn chủ đề giao diện (Sáng / Tối ấm / Tự động theo hệ thống).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Đổi Theme lập tức:* Bấm chọn Dark Mode đổi ngay giao diện sang nền than ấm `#161916` mà không cần reload trang.
  2. *Xác thực an toàn:* Đổi mật khẩu yêu cầu nhập đúng mật khẩu cũ, mật khẩu mới tối thiểu 6 ký tự.

#### FR-18: Gói Hội viên Premium & Thanh toán PayOS (`/premium`)
* **Layout:** `AppLayout` | **Container:** `max-w-6xl`
* **Phân loại:** `[Tách thêm, chờ duyệt]` — **NGOÀI PHẠM VI MVP**.
* **Mô tả:** Bảng so sánh tính năng gói Miễn phí vs Gói Pro.
* **Quy chuẩn thực thi:** **Giữ nguyên toàn bộ logic thanh toán hiện có, không can thiệp backend PayOS; chỉ áp dụng Design Token UI cho giao diện đồng bộ với thương hiệu.**
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Giao diện đồng bộ:* Áp dụng token màu cam hổ phách `var(--color-premium)` cho nút CTA và viền thẻ.

#### FR-19: Xác thực Người dùng: Đăng nhập, Đăng ký & Đặt lại Mật khẩu
* **Layout:** Modal pop-up (`RegisterModal`) cho Đăng ký/Đăng nhập; Trang `/reset-password` dùng **`AppLayout` (`max-w-md`) và CÓ Footer** theo đúng quy tắc Layout thống nhất.
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ luồng xác thực tài khoản.
* **Mô tả:** Biểu mẫu xác thực hỗ trợ đăng nhập bằng Email/Password hoặc Google OAuth một chạm.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Xác thực tiếng Việt:* Thông báo sai mật khẩu hoặc tài khoản chưa kích hoạt hiển thị 100% bằng tiếng Việt dưới từng ô input.
  2. *Bảo mật:* Mật khẩu lưu trữ bắt buộc mã hóa qua `bcryptjs` với salt rounds ≥ 10. Áp dụng Rate Limiting tối đa 5 lần thử sai / 15 phút (mục tiêu đề xuất, cần đo baseline trước theo NFR-7).

#### FR-20: Bộ Thẻ Ghi Nhớ Flashcards & Ôn tập SM-2 (`/flashcards` & `/flashcards/[deckId]`)
* **Layout:** `AppLayout` | **Container:** `max-w-4xl`
* **Phân loại:** `[Tách thêm, chờ duyệt]` — Phục vụ module thẻ ghi nhớ Spaced Repetition.
* **Mô tả:** Trung tâm quản lý bộ thẻ (`/flashcards`) và phòng ôn tập lật thẻ 3D (`/flashcards/[deckId]`) theo thuật toán Lặp lại ngắt quãng SM-2.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Hiệu ứng lật thẻ 3D:* Thẻ lật mượt mà khi nhấn phím `Space` hoặc click chuột; hiển thị 4 nút đánh giá phản xạ ghi nhớ (*Lại / Khó / Tốt / Dễ*).
  2. *Cập nhật thuật toán:* Điểm đánh giá cập nhật chính xác các trường `ease_factor`, `interval_days`, `repetitions`, `next_review_at` trong cơ sở dữ liệu.

---

### NHÓM 4: BẢN QUYỀN & TÀI NGUYÊN GIÁO DỤC MỞ (OER)

#### FR-21: Quản lý Bản quyền & Nhập liệu Nguồn mở OER
* **Mô tả:** Hệ thống chỉ cho phép nhập tài liệu thuộc Whitelist 4 giấy phép mở (`CC0`, `CC-BY`, `CC-BY-SA`, `Public Domain`) từ các nguồn mở hợp pháp (OpenStax, Wikibooks...). Loại bỏ hoàn toàn giấy phép MIT (mã nguồn), OpenStax-License (không chuẩn) và các tài liệu mang điều khoản phi thương mại NC (như phần lớn MIT OCW `CC BY-NC-SA` tiềm ẩn rủi ro thương mại đối với nền tảng có gói trả phí). Đối chiếu giấy phép theo từng tài liệu cụ thể. Nghiêm cấm cào dữ liệu có bản quyền.
* **Phân loại:** **Ánh xạ từ FR6 (Bản quyền) & FR7 (Import OER)**.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. *Trường dữ liệu bắt buộc (FR7):* Mọi tài liệu nhập vào kho mở phải lưu trữ đầy đủ `source_url`, `license`, `author`, `imported_at`.
  2. *Quyền riêng tư mặc định (FR6):* Tài liệu do người dùng tải lên mặc định có trạng thái riêng tư (`is_public = false`). Khi người dùng chọn công khai, bắt buộc phải tích chọn cam kết bản quyền.

---

## 5. Yêu cầu Phi Chức năng Đầy đủ (NFR-1 đến NFR-9)

* **NFR-1 (Hiệu năng & Tốc độ tải - Performance):**
  - Thời gian tải trang ban đầu (First Contentful Paint - FCP) ≤ 1.5 giây trên mạng 4G tiêu chuẩn *(mục tiêu đề xuất, cần đo baseline trước)*.
  - Tỷ lệ giật khung hình (Cumulative Layout Shift - CLS) ≤ 0.05 khi chuyển đổi trang hoặc mở drawer mobile *(mục tiêu đề xuất, cần đo baseline trước)*.
  - **Quy trình đo Baseline:** Trước khi nghiệm thu hoàn tất, phải tiến hành đo đạc FCP/CLS hiện tại trên môi trường test để xác lập bộ số chuẩn đối chiếu (nằm trong Epic Nghiệm thu).
* **NFR-2 (Khả năng tiếp cận - Accessibility WCAG 2.1 AA):**
  - Tiêu chí ngưỡng tương phản: Chữ thường đạt **≥ 4.5 : 1**; Chữ lớn và icon/viền đạt **≥ 3.0 : 1** trên cả chế độ Sáng và Tối ấm.
  - Vòng sáng Focus ring hiển thị sắc nét trên mọi nút bấm và ô nhập liệu khi điều hướng bằng phím `Tab`.
  - 100% nút icon có thuộc tính `aria-label` mô tả bằng tiếng Việt.
* **NFR-3 (Bảo mật & Phân quyền - Security & Authorization):**
  - Mọi API Endpoint nhạy cảm (notes, flashcards, profile, messages) đều phải xác thực qua JWT Middleware (Access Token 15 phút, Refresh Token 7 ngày).
  - Phân quyền chặt chẽ: Chỉ chủ sở hữu mới có quyền sửa/xóa tài liệu và ghi chú của mình.
* **NFR-4 (Tính toàn vẹn Dữ liệu - Data Integrity):**
  - Mọi thay đổi schema cơ sở dữ liệu phải thông qua migration của `node-pg-migrate` và có script rollback `down` đầy đủ.
* **NFR-5 (Bản địa hóa 100% - Localization):**
  - Toàn bộ giao diện người dùng không được trộn lẫn tiếng Anh (tiêu đề, placeholder, nhãn nút, toast thông báo lỗi đều bằng tiếng Việt chuẩn mực).
* **NFR-6 (Phòng chống Lỗ hổng Bảo mật & XSS - Security & Sanitization):**
  - **Kiểm toán phụ thuộc:** Đã kiểm tra `frontend/package.json` và `backend/package.json`, xác nhận hiện tại **CHƯA có `DOMPurify` và `sanitize-html`**.
  - **Quy tắc bảo vệ không cần thêm thư viện mới:**
    - Nội dung tin nhắn chat (`messages`) bắt buộc kết xuất dưới dạng **Text thuần (Plain text)**, không parse HTML thô.
    - Nội dung tài liệu và ghi chú Markdown hiển thị qua `react-markdown` tuyệt đối **KHÔNG bật plugin `rehype-raw`** (nhằm ngăn chặn việc parse mã HTML thô nhúng trong Markdown, triệt tiêu nguy cơ tấn công XSS).
    - Thư viện sanitize bên thứ ba (`DOMPurify` / `sanitize-html`) chỉ được thêm khi có sự phê duyệt bằng văn bản từ Chủ dự án `[chờ duyệt]`.
  - **Cấu hình HTTP Header `Content-Security-Policy`:** Bắt đầu bằng chế độ giám sát `Content-Security-Policy-Report-Only` (cấu hình trong `next.config.js` hoặc middleware), liệt kê đầy đủ nguồn hợp lệ cho Next.js (`'self'`, `'unsafe-eval'`, `'unsafe-inline'`), Framer Motion, Mermaid (inline SVG), Cloudinary (`res.cloudinary.com`), và Google OAuth (`accounts.google.com`). Chỉ chuyển sang chế độ chặn thực thi (`Content-Security-Policy`) sau khi Chủ dự án (Tu) phê duyệt.
* **NFR-7 (Giới hạn Tần suất Truy cập - Rate Limiting & Anti-Abuse):**
  - Áp dụng middleware Rate Limiting trên các API trọng yếu bằng code thuần TypeScript hoặc thư viện `express-rate-limit` đã có sẵn trong `backend/package.json` (tuyệt đối không cài thêm thư viện mới, nếu cần thư viện ngoài ghi `[chờ duyệt]`):
    - Tuyến Xác thực (`/api/auth/*`): Tối đa 5 lần thử sai trong 15 phút *(mục tiêu đề xuất, cần đo baseline trước)*.
    - Tuyến Trí tuệ Nhân tạo (`/api/ai/*`, `/api/questions/generate`): Kiểm soát hạn ngạch số lượt gọi/phút theo gói tài khoản để chống cạn kiệt token và chống tấn công từ chối dịch vụ (DoS) *(mục tiêu đề xuất, cần đo baseline trước)*.
* **NFR-8 (Độ tin cậy & Xử lý Ngoại lệ - Reliability & Fault Tolerance):**
  - Các kết nối dịch vụ bên thứ ba (Cloudinary, Google Gemini AI) khi xảy ra sự cố mạng phải có cơ chế thử lại tự động: Exponential Backoff Retry tối đa 3 lần viết bằng code thuần.
  - **Ràng buộc an toàn:** Cơ chế Retry backoff **CHỈ áp dụng cho các thao tác đọc và thao tác idempotent** (truy vấn file Cloudinary, gọi API Gemini AI text generation/chat). **TUYỆT ĐỐI KHÔNG retry thao tác tạo đơn thanh toán PayOS** để tránh phát sinh đơn hàng hoặc giao dịch trùng lặp.
  - Nếu thử lại thất bại, hệ thống phải bắt lỗi (catch error) và trả về thông báo lỗi thân thiện, không làm sập tiến trình Node.js (tuyệt đối không để xảy ra `UnhandledPromiseRejection`).
* **NFR-9 (Bảo toàn Tuyến đường & Chuyển hướng URL - URL Redirection):**
  - Mọi tuyến đường cũ bị đổi tên (đặc biệt là `/study-sessions` cũ) phải được cấu hình chuyển hướng vĩnh viễn bằng mã trạng thái **HTTP 308 (Permanent Redirect)** sang tuyến đường mới `/progress?tab=history`, bảo toàn 100% tham số truy vấn (query string).

---

## 6. Những Điều Không Thuộc Phạm Vi v1 (Non-Goals)

1. **Không xây dựng mạng xã hội chat mở:** Không có tính năng nhắn tin cho người lạ, không có bảng tin chia sẻ trạng thái phi học thuật.
2. **Không thay đổi backend PayOS:** v1 chỉ áp dụng Design Token UI cho trang `/premium`, không can thiệp logic backend thanh toán PayOS.
3. **Không hỗ trợ tải tệp quá 10MB trong v1:** Giới hạn dung lượng tệp tải lên tối đa 10MB để đảm bảo chi phí lưu trữ Cloudinary.
4. **Không cài đặt thêm thư viện giao diện mới:** Không cài thêm MUI, Ant Design, Chakra UI; tận dụng tối đa Tailwind CSS và Framer Motion có sẵn. Thư viện sanitize HTML chỉ cài khi có duyệt riêng `[chờ duyệt]`.

---

## 7. Phạm vi Bản phát hành MVP (MVP Scope)

### 7.1. Trong Phạm vi (In Scope)
* Chuẩn hóa Design System với `design-tokens.css` và màu xanh rừng `#1a3d28`, nền tối ấm `#161916`.
* Hoàn thiện 14 Core UI Components tại `frontend/src/components/common/`.
* Tái cấu trúc thanh điều hướng Navbar vào `AppLayoutWrapper` và loại bỏ Footer khỏi `WorkspaceLayout`.
* Triển khai hoàn chỉnh 16 màn hình với đầy đủ ma trận 4 trạng thái (Loading, Empty, Error, Dark Mode).
* Sửa triệt để lỗi "Không có đường dẫn tài liệu" tại `/viewer/[id]`.
* Thực hiện quy trình dọn dẹp dữ liệu thử nghiệm an toàn 4 bước (FR-4): dừng ABORT nếu phát hiện ID `1, 3, 5, 5035`; cảnh báo vàng, tách riêng khỏi danh sách xóa và chờ duyệt từng ID đối với các ID `2, 7, 8, 21, 22`.
* Xử lý tin nhắn cũ trong `messages` theo Phương án A (chế độ chỉ đọc + khóa gửi tin + hiển thị nút "Gửi lời mời kết bạn" trực tiếp ngay trên màn hình chỉ đọc).
* Thực hiện đầy đủ bước đo Baseline thực tế trước khi nghiệm thu NFR trong Epic Nghiệm thu.

### 7.2. Ngoài Phạm vi (Out of Scope for MVP)
* Ứng dụng di động Native (iOS/Android) — v1 tập trung tối ưu Responsive Web trên trình duyệt di động.
* Tính năng học nhóm âm thanh/video thời gian thực (WebRTC).
* Tái cấu trúc luồng thanh toán PayOS (giữ nguyên backend, chỉ áp token UI).

---

## 8. Chỉ số Thành công, Đo Baseline & Epic Nghiệm Thu (Success Metrics & Acceptance Epic)

### 8.1. Các Chỉ số Thành công Cốt lõi (Success Metrics)
* **SM-1 (Độ nhất quán Giao diện):** 100% trang màn hình sử dụng semantic design tokens; 0 class hardcode màu xanh hoặc class `dark:text-emerald-*`. *(Đo lường qua công cụ kiểm tra tĩnh regex trên codebase).*
* **SM-2 (Khắc phục sự cố Viewer):** Mọi tài liệu hoặc hiển thị được nội dung trực quan hoặc hiển thị ErrorState có lối thoát kèm nút "Quay lại" và "Báo lỗi"; 0 màn hình trắng.
* **SM-3 (Hiệu quả Ôn tập SM-2):** Tỷ lệ học viên quay lại ôn tập thẻ đến hạn vào ngày hôm sau đạt **≥ 45%** *(mục tiêu đề xuất, cần đo baseline trước)*.
* **SM-4 (An toàn Dữ liệu Thực thi FR-4):** 100% tài khoản thật được bảo vệ nguyên vẹn (ID 1, 3, 5, 5035 có trong DB sau dọn dẹp); 0 sự cố mất dữ liệu giáo trình.
* **Chỉ số Đối trọng (Counter-Metric - SM-C1):** Không tối ưu hóa số lượng câu chat AI bằng cách spam gợi ý làm giảm độ tập trung đọc tài liệu của học viên.

### 8.2. Epic Nghiệm Thu & Quy Trình Đo Baseline (Acceptance Epic: Baseline Measurement & Verification)
Trước khi bàn giao và nghiệm thu sản phẩm, đội ngũ kỹ thuật bắt buộc phải hoàn thành trọn vẹn quy trình 3 bước nghiệm thu:

1. **Bước 1 - Khảo sát & Đo Baseline Thực Tế (Bắt buộc trước khi tối ưu NFR):**
   - Đo đạc chỉ số FCP (First Contentful Paint) và CLS (Cumulative Layout Shift) hiện tại trên môi trường test cho các trang đại diện (`/` Landing và `/viewer/[id]`).
   - Ghi nhận số liệu baseline tần suất truy cập đăng nhập thất bại và thời gian phản hồi trung bình của API xác thực.
   - Kiểm tra cơ chế xử lý lỗi mạng thực tế hiện tại khi gọi Cloudinary, Gemini AI và PayOS.
   - Lưu trữ bộ số liệu Baseline vào báo cáo nghiệm thu (`docs/baseline-metrics.md`) để làm căn cứ đối chiếu.
2. **Bước 2 - Đo Kiểm Sau Tối Ưu & Đối Chiếu Ngưỡng:**
   - Đối chiếu FCP sau tối ưu với ngưỡng mục tiêu đề xuất (≤ 1.5s trên mạng 4G tiêu chuẩn).
   - Đối chiếu CLS sau tối ưu với ngưỡng mục tiêu đề xuất (≤ 0.05).
   - Kiểm thử Rate Limiting tại `/api/auth/*` với ngưỡng đề xuất 5 lần sai / 15 phút.
   - Kiểm thử mô phỏng đứt kết nối API bên thứ ba để xác nhận cơ chế Exponential Backoff Retry 3 lần hoạt động ổn định, không gây sập ứng dụng.
3. **Bước 3 - Phê Duyệt Nghiệm Thu (Manual Sign-off Gate):**
   - Lập báo cáo tổng kết so sánh Before (Baseline) vs After (Thực tế).
   - Trình Chủ dự án (Tu) nghiệm thu và phê duyệt chính thức trước khi release.

---

## 9. Bảng Đối chiếu Các Màn hình & Kích thước Khung chứa (Layout Matrix)

| STT | Màn hình | Route | Bố cục Layout | Chiều rộng tối đa (`max-w`) | Footer | Trạng thái (L/E/Er/D) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Trang chủ | `/`, `/home` | `AppLayout` | `max-w-7xl` | **Có** | Đầy đủ 4 trạng thái |
| 2 | Cộng đồng | `/community` | `AppLayout` | `max-w-7xl` | **Có** | Đầy đủ 4 trạng thái |
| 3 | Trình đọc tài liệu | `/viewer/[id]` | `WorkspaceLayout` | `w-full` (100vw, `h-screen`) | **KHÔNG** | Đầy đủ 4 trạng thái |
| 4 | Sổ tay ghi chú | `/notes` | `WorkspaceLayout` | `w-full` (100vw, `h-screen`) | **KHÔNG** | Đầy đủ 4 trạng thái |
| 5 | Sơ đồ tư duy | `/mindmap` | `WorkspaceLayout` | `w-full` (100vw, `h-screen`) | **KHÔNG** | Đầy đủ 4 trạng thái |
| 6 | Kho tài liệu | `/library` | `AppLayout` | `max-w-7xl` | **Có** | Đầy đủ 4 trạng thái |
| 7a | Danh sách đề thi & Tạo đề AI | `/quiz`, `/ai-test` | `AppLayout` | `max-w-4xl` | **Có** | Đầy đủ 4 trạng thái |
| 7b | Phòng thi trắc nghiệm | `/quiz/[testSetId]` | `AppLayout` | `max-w-4xl` | **Có** | Đầy đủ 4 trạng thái |
| 8 | Phòng Pomodoro | `/focus` | `WorkspaceLayout` | `w-full` (100vw, `h-screen`) | **KHÔNG** | Đầy đủ 4 trạng thái |
| 9 | Tiến độ & Lịch sử | `/progress` | `AppLayout` | `max-w-7xl` | **Có** | Đầy đủ 4 trạng thái |
| 10 | Bạn bè & Tin nhắn | `/friends`, `/messages`| `AppLayout` (`/friends`) / `Workspace` (`/messages`)| `max-w-5xl` / `w-full` | `/friends` **Có**; `/messages` **KHÔNG** | Đầy đủ 4 trạng thái |
| 11 | Tìm kiếm toàn cầu | `/search` | `AppLayout` | `max-w-7xl` | **Có** | Đầy đủ 4 trạng thái |
| 12 | Hồ sơ cá nhân | `/profile`, `/profile/[id]` | `AppLayout` | `max-w-5xl` | **Có** | Đầy đủ 4 trạng thái |
| 13 | Cài đặt tài khoản | `/settings` | `AppLayout` | `max-w-4xl` | **Có** | Đầy đủ 4 trạng thái |
| 14 | Gói Premium | `/premium` | `AppLayout` | `max-w-6xl` | **Có** | Đầy đủ 4 trạng thái |
| 15 | Đặt lại mật khẩu / Auth | `/reset-password` (Modal cho Login/Register) | `AppLayout` cho `/reset-password` | `max-w-md` | **Có** (đối với `/reset-password`) | Đầy đủ 4 trạng thái |
| 16a | Hub quản lý bộ thẻ | `/flashcards` | `AppLayout` | `max-w-4xl` | **Có** | Đầy đủ 4 trạng thái |
| 16b | Tạo mới & Sửa bộ thẻ | `/flashcards/new`, `[deckId]/edit` | `AppLayout` | `max-w-4xl` | **Có** | Đầy đủ 4 trạng thái |
| 16c | Phiên ôn tập thẻ SM-2 | `/flashcards/[deckId]` | `AppLayout` | `max-w-4xl` | **Có** | Đầy đủ 4 trạng thái |
| 17 | Xem tài liệu chia sẻ công khai | `/shared/[token]` | `AppLayout` | `max-w-5xl` | **Có** | Đầy đủ 4 trạng thái |

---

## 10. Câu hỏi Mở & Danh mục Giả định (Assumptions Index)

### 10.1. Tình trạng Câu hỏi Mở & Quyết định Đã Chốt
1. *Xử lý tin nhắn cũ trong bảng `messages`:* **ĐÃ CHỐT: PHƯƠNG ÁN A** (Giữ chế độ chỉ đọc cho lịch sử cũ + Khóa ô gửi tin khi chưa là bạn bè + Hiển thị banner thông báo kèm nút "Gửi lời mời kết bạn" trực tiếp ngay trên màn hình chỉ đọc).
2. *Duyệt danh sách tài khoản tạm giữ:* Script dry-run (FR-4) sẽ tự động gắn cờ Cảnh báo vàng và bóc tách riêng các ID `2, 7, 8, 21, 22` thành một danh sách kiểm kê độc lập để Chủ dự án phê duyệt từng ID trước khi thực hiện bất kỳ thao tác nào.
3. *Thư viện Sanitize HTML:* Đã xác nhận không cài thư viện mới; tin nhắn render text thuần và tắt `rehype-raw` khi render Markdown bằng `react-markdown`. Thư viện sanitize bên thứ ba chỉ thêm khi Chủ dự án duyệt riêng `[chờ duyệt]`.
4. *Số liệu NFR:* FCP (≤ 1.5s), CLS (≤ 0.05), Rate Limit (5 lần/15 phút), Retry (3 lần) được quy định là mục tiêu đề xuất, bắt buộc có bước đo baseline thực tế trong Epic Nghiệm thu.
5. *Phạm vi PayOS:* Ngoài phạm vi MVP, giữ nguyên toàn bộ logic backend và chỉ áp dụng token UI cho giao diện `/premium`.

### 10.2. Danh mục Giả định (Assumptions Index)
* `[ASSUMPTION-1]`: Thuật toán SM-2 hiện tại trong `flashcards` đã tính toán đúng công thức và chỉ cần chuẩn hóa giao diện lật thẻ 3D cùng 4 nút đánh giá.
* `[ASSUMPTION-2]`: Mọi tài liệu có `doc_url = null` trong database đều có nội dung văn bản Markdown hợp lệ trong cột `solution_text`.
* `[ASSUMPTION-3]`: Cổng Docker Postgres hiện tại (5432) cho phép chạy lệnh `docker exec` để tạo bản sao lưu `pg_dump` trực tiếp từ máy chủ.
