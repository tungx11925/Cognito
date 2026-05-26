---
stepsCompleted: [1, 2, 3]
inputDocuments: ["IMPLEMENTATION_PLAN.md"]
---

# Cognito - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Cognito, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Tải lên & Quản lý Tài liệu kèm Lời giải (Hỗ trợ định dạng PDF, Word, Ảnh; phân loại theo môn học, lớp, thẻ tag).
FR2: Xem Tài liệu trực quan & Đặt thời gian học (Tích hợp đồng hồ Pomodoro, tự động ghi nhận tiến độ thời gian học).
FR3: Học cùng trợ lý AI (Tích hợp Chatbox AI song song với tài liệu để giải thích, tóm tắt và tự động sinh câu hỏi trắc nghiệm).
FR4: Ghi chép thông minh (Tạo ghi chú Rich Text/Markdown liên kết chặt chẽ với tài liệu đang đọc).
FR5: Hệ thống Flashcards học tập (Cho phép tạo thủ công hoặc nhờ AI tự động tạo từ tài liệu; tích hợp thuật toán lặp lại ngắt quãng - SRS).

### NonFunctional Requirements

NFR1: Kiến trúc triển khai Monorepo hoàn toàn trên Docker Compose (Frontend, Backend, DB, pgAdmin).
NFR2: Tech stack chính: Next.js (Frontend) và Express.js (Backend), đảm bảo hiệu năng và tính mở rộng.
NFR3: Hệ quản trị cơ sở dữ liệu: PostgreSQL.

### Additional Requirements

- Sử dụng `node-pg-migrate` để quản lý Schema database (đã có thiết kế chi tiết các bảng users, documents, notes, flashcards...).
- Tích hợp Multer & Cloudinary để xử lý lưu trữ file tài liệu upload.
- Tích hợp API của Gemini AI làm core engine cho trợ lý học tập.
- Các API Endpoints đã được định tuyến rõ ràng cho 5 module chính (Documents, Sessions, AI, Notes, Flashcards).

### UX Design Requirements

UX-DR1: Thiết kế giao diện Frontend Premium (mang lại cảm giác cao cấp, mượt mà).
UX-DR2: Giao diện chia bố cục thông minh (Document Viewer kết hợp Sidebar chứa Timer, AI Chat và Note Editor trên cùng một màn hình).

### FR Coverage Map

FR1: Epic 1 (Platform Auth) & Epic 2 (Document Management)
FR2: Epic 2 (Document Viewer) - Note: Pomodoro timer deferred or as a minor story
FR3: Epic 4 (AI Study Assistant)
FR4: Epic 3 (Smart Notes Workspace)
FR5: Epic 5 (SRS Flashcards)

## Epic List

## Epic 1: Nền tảng Xác thực (User Auth & Profile)

Người dùng có thể đăng ký, đăng nhập và quản lý tài khoản an toàn với JWT để chuẩn bị sử dụng các tính năng học tập cá nhân hóa.
**FRs covered:** FR1 (phần Auth)

### Story 1.1: Đăng ký tài khoản mới

As a Người dùng chưa có tài khoản,
I want đăng ký một tài khoản mới bằng email và mật khẩu,
So that tôi có thể lưu trữ và theo dõi tiến độ học tập cá nhân.

**Acceptance Criteria:**

**Given** người dùng đang ở trang Đăng ký
**When** người dùng điền đầy đủ tên, email hợp lệ, mật khẩu (tối thiểu 6 ký tự) và bấm "Đăng ký"
**Then** hệ thống tạo bản ghi mới trong bảng `users` (mật khẩu được mã hóa bằng bcrypt)
**And** trả về mã 201 Created cùng thông báo đăng ký thành công
**And** Nếu email đã tồn tại, hiển thị thông báo lỗi phù hợp

### Story 1.2: Đăng nhập vào hệ thống

As a Người dùng đã có tài khoản,
I want đăng nhập bằng email và mật khẩu,
So that tôi có thể truy cập vào kho tài liệu của riêng mình.

**Acceptance Criteria:**

**Given** người dùng đang ở trang Đăng nhập
**When** người dùng nhập đúng thông tin email và mật khẩu đã đăng ký
**Then** hệ thống xác thực thành công và trả về JWT Token (cùng thông tin user cơ bản)
**And** Frontend lưu trữ Token và chuyển hướng vào màn hình Dashboard
**And** Nếu sai mật khẩu hoặc email không tồn tại, trả về mã 401 Unauthorized kèm câu báo lỗi

## Epic 2: Quản lý & Đọc Tài Liệu (Document Management & Viewer)

Người dùng có thể tải lên tài liệu học tập (PDF/Ảnh) lên Cloudinary, phân loại danh mục và xem tài liệu trực tuyến ngay trên nền tảng.
**FRs covered:** FR1, FR2 (phần Document Viewer)

### Story 2.1: Tải lên tài liệu mới (Upload Document)

As a Học viên,
I want tải lên tài liệu PDF hoặc Ảnh từ máy tính,
So that tôi có thể lưu trữ tài liệu trên hệ thống để học sau này.

**Acceptance Criteria:**

**Given** người dùng đang ở trang Quản lý tài liệu (Dashboard)
**When** bấm nút "Tải lên", chọn file (PDF/Image, < 10MB), nhập tên và chọn thẻ tag
**Then** hệ thống tải file lên Cloudinary
**And** lưu URL và thông tin vào bảng `documents` trong database
**And** hiển thị thông báo tải lên thành công

### Story 2.2: Xem Danh sách & Lọc tài liệu (Document Dashboard)

As a Học viên,
I want xem danh sách tài liệu tôi đã tải lên và lọc theo thẻ,
So that tôi có thể tìm kiếm tài liệu nhanh chóng.

**Acceptance Criteria:**

**Given** người dùng ở trang Dashboard
**When** trang load xong
**Then** hệ thống hiển thị danh sách tài liệu dưới dạng lưới (Grid) hoặc danh sách (List)
**And** khi chọn "Thẻ tag" hoặc tìm kiếm tên, danh sách tự động lọc ra các kết quả tương ứng

### Story 2.3: Trình xem tài liệu trực tuyến (Document Viewer)

As a Học viên,
I want click vào một tài liệu và xem trực tiếp nội dung trên trình duyệt,
So that tôi không cần phải tải file về máy.

**Acceptance Criteria:**

**Given** người dùng chọn mở một tài liệu từ danh sách
**When** hệ thống chuyển sang trang Study Room
**Then** hiển thị giao diện Document Viewer ở vùng chính màn hình
**And** hỗ trợ hiển thị mượt mà cả định dạng PDF (qua thư viện `react-pdf` hoặc tương đương) và Ảnh
**And** có chức năng cuộn, phóng to, thu nhỏ

### Story 2.4: Widget Đếm giờ Pomodoro (Study Timer)

As a Học viên,
I want có một đồng hồ đếm giờ ngay cạnh màn hình tài liệu,
So that tôi có thể áp dụng phương pháp Pomodoro để duy trì sự tập trung.

**Acceptance Criteria:**

**Given** người dùng đang trong trang Study Room
**When** bấm nút "Bắt đầu học" trên Timer
**Then** đồng hồ đếm ngược (mặc định 25 phút) bắt đầu chạy
**And** có các nút Tạm dừng (Pause), Đặt lại (Reset)
**And** khi hết giờ, hệ thống phát âm thanh báo hiệu và lưu phiên học (Study Session) vào database

## Epic 3: Không gian Ghi chú (Smart Notes Workspace)

Người dùng có thể tạo, chỉnh sửa và lưu trữ các ghi chú định dạng Rich Text/Markdown được liên kết chặt chẽ với tài liệu đang đọc.
**FRs covered:** FR4

### Story 3.1: Trình soạn thảo Ghi chú (Rich Text Editor)

As a Học viên,
I want sử dụng trình soạn thảo Rich Text/Markdown ngay cạnh tài liệu,
So that tôi có thể highlight và ghi chép lại các ý chính mà không cần mở tab khác.

**Acceptance Criteria:**

**Given** người dùng đang ở trang Study Room
**When** bấm mở tab "Ghi chú" (Notes) ở thanh Sidebar
**Then** hiển thị một vùng soạn thảo văn bản (Rich Text) cho phép định dạng cơ bản (Bold, Italic, List...)

### Story 3.2: Quản lý Kho Ghi chú (Notes Archive)

As a Học viên,
I want ghi chú tự động lưu lại và có một "Kho Ghi chú" để tôi xem lại sau này,
So that tôi không bao giờ sợ mất dữ liệu đã học.

**Acceptance Criteria:**

**Given** người dùng đang gõ ghi chú
**When** ngừng gõ 2 giây (Auto-save) hoặc bấm "Lưu"
**Then** cập nhật nội dung ghi chú vào bảng `notes` trong database (liên kết với `document_id`)
**And** tự động tải lại ghi chú cũ khi mở lại tài liệu

### Story 3.3: Tùy chọn Tạo Flashcard từ Ghi chú

As a Học viên,
I want khi mở xem lại một bản ghi chú, tôi có tùy chọn để tạo Flashcard từ chính bản ghi chú đó,
So that tôi có thể chủ động quyết định xem mình có muốn biến ghi chú này thành thẻ học hay không.

**Acceptance Criteria:**

**Given** người dùng đang ở trang Xem lại Ghi chú (Saved Notes)
**When** người dùng mở xem một bản ghi chú đã lưu
**Then** hiển thị thêm một nút/tùy chọn: "Tạo Flashcard từ Ghi chú này"
**And** khi bấm nút đó, hệ thống trích xuất nội dung tạo thành bộ thẻ trong bảng `flashcards` liên kết với ghi chú này

## Epic 4: Trợ lý AI (AI Workspace)

Người dùng có thể trò chuyện với AI tích hợp ở khung làm việc song song để nhờ giải thích các khái niệm khó và tương tác trực quan.
**FRs covered:** FR3

### Story 4.1: Giao diện AI Workspace (Side-by-Side Assistant)

As a Học viên,
I want AI hiển thị ở một khung làm việc (Panel) song song chuyên nghiệp chứ không phải popup chatbot,
So that tôi có thể học tập cùng AI một cách thoải mái với không gian rộng rãi.

**Acceptance Criteria:**

**Given** người dùng đang ở trang Study Room
**When** mở tab AI
**Then** hiển thị giao diện AI Workspace ở dạng Split-pane
**And** AI tự động nhận biết context (tài liệu đang xem, trang số mấy) để trả lời sát ngữ cảnh
**And** hỗ trợ render Markdown (để hiển thị code, in đậm, danh sách...)

### Story 4.2: Tương tác trực quan qua Artifacts (Mini-Apps)

As a Học viên,
I want khi AI tạo bài tập hoặc bảng biểu, nó hiển thị dưới dạng giao diện trực quan (UI Component) để tương tác ngay lập tức,
So that tôi không phải đọc những đoạn text thô nhàm chán.

**Acceptance Criteria:**

**Given** người dùng yêu cầu AI tạo câu hỏi trắc nghiệm (Quiz) hoặc bài tập
**When** AI trả lời
**Then** thay vì text thuần, AI render ra một Component tương tác (Artifact) ngay trong khung chat
**And** người dùng có thể click chọn đáp án A, B, C, D trên Component đó
**And** hệ thống tự động chấm điểm Xanh/Đỏ ngay lập tức khi click chọn

### Story 4.3: Cross-Document AI (Hỏi đáp xuyên tài liệu)

As a Học viên,
I want AI có thể đọc và liên kết kiến thức từ tất cả các tài liệu và ghi chú của tôi,
So that tôi có thể hỏi một câu và AI sẽ tổng hợp câu trả lời từ nhiều nguồn học liệu khác nhau.

**Acceptance Criteria:**

**Given** người dùng đặt câu hỏi tổng hợp trong khung AI Workspace
**When** gửi câu hỏi
**Then** AI sẽ tra cứu (RAG/Vector Search) qua toàn bộ kho tài liệu PDF và Ghi chú của user
**And** trả về câu trả lời tổng hợp có trích dẫn nguồn (ví dụ: "Theo tài liệu Toán trang 5 và Ghi chú bài 2...")

## Epic 5: Hệ thống Flashcards SRS (Spaced Repetition System)

Người dùng có thể nhận dữ liệu từ AI để tạo thành bộ thẻ ghi nhớ, và học theo thuật toán lặp lại ngắt quãng (SRS) để tối ưu việc ghi nhớ.
**FRs covered:** FR5

### Story 5.1: Quản lý Bộ thẻ (Decks & Cards Management)

As a Học viên,
I want xem danh sách các bộ thẻ (Decks) và chỉnh sửa từng thẻ (Cards) bên trong,
So that tôi có thể kiểm soát và tự điều chỉnh nội dung học theo ý mình.

**Acceptance Criteria:**

**Given** người dùng truy cập trang Flashcards
**When** mở một Bộ thẻ (Deck)
**Then** hiển thị danh sách tất cả các Thẻ (Mặt trước/Mặt sau)
**And** cho phép Thêm mới, Sửa nội dung, hoặc Xóa các thẻ không cần thiết

### Story 5.2: Giao diện Ôn tập (Study Session UI)

As a Học viên,
I want có một giao diện lật thẻ mượt mà để ôn tập,
So that tôi có thể học từ vựng/khái niệm một cách tập trung.

**Acceptance Criteria:**

**Given** người dùng chọn "Bắt đầu học" một Bộ thẻ
**When** vào màn hình Study Session
**Then** hiển thị Thẻ đầu tiên (chỉ hiện Mặt trước)
**And** khi bấm "Lật thẻ", thẻ xoay sang Mặt sau (hiệu ứng 3D flip mượt mà)
**And** hiển thị các nút đánh giá mức độ nhớ: "Quên", "Khó", "Tốt", "Dễ"

### Story 5.3: Thuật toán Spaced Repetition (SRS Engine)

As a Học viên,
I want hệ thống tự động tính toán thời gian lặp lại của từng thẻ dựa trên đánh giá của tôi,
So that tôi chỉ phải học lại những thẻ tôi hay quên và bỏ qua những thẻ đã thuộc.

**Acceptance Criteria:**

**Given** người dùng đang ở giao diện ôn tập (đã lật thẻ sang mặt sau)
**When** bấm chọn một mức độ nhớ
**Then** hệ thống gọi API tính toán SRS (dựa trên thuật toán SuperMemo-2 hoặc tương đương)
**And** cập nhật trường `next_review_date`, `interval`, `ease_factor` của thẻ đó vào Database
**And** tự động chuyển sang thẻ tiếp theo cần học trong ngày hôm nay

## Epic 6: EduShare Marketplace (Cộng đồng Chia sẻ)

Người dùng có thể quyết định công khai (public) bộ Ghi chú & Flashcards của mình cho cộng đồng hoặc giữ riêng tư (private). Người khác có thể xem, tìm kiếm và sao chép các bộ tài liệu public về tài khoản của họ.
**FRs covered:** Tương tác cộng đồng (Mở rộng từ FR1, FR4, FR5)

### Story 6.1: Thiết lập Quyền riêng tư (Privacy Controls)

As a Học viên,
I want có tùy chọn chuyển trạng thái Ghi chú và Bộ Flashcards của tôi thành Công khai (Public) hoặc Riêng tư (Private),
So that tôi có thể bảo vệ quyền riêng tư cá nhân nhưng vẫn có thể chia sẻ kiến thức nếu muốn.

**Acceptance Criteria:**

**Given** người dùng đang ở trang quản lý Ghi chú hoặc Bộ Flashcards
**When** bật/tắt công tắc "Công khai cho cộng đồng" (Public Toggle)
**Then** hệ thống cập nhật trường `is_public` (boolean) trong database
**And** chỉ những tài liệu có `is_public = true` mới xuất hiện trên trang Cộng đồng

### Story 6.2: Khám phá & Lưu trữ từ Cộng đồng (Community Explorer)

As a Học viên,
I want có một trang "Cộng đồng" để tìm kiếm các bộ Ghi chú & Flashcards hay từ người khác,
So that tôi có thể học hỏi và lưu chúng về làm tài liệu của riêng mình.

**Acceptance Criteria:**

**Given** người dùng truy cập trang "Cộng đồng" (Community/Marketplace)
**When** lướt xem hoặc tìm kiếm theo từ khóa/môn học
**Then** hiển thị danh sách các Ghi chú/Flashcards đang để chế độ Public của user khác
**And** khi bấm "Lưu vào kho của tôi" (Clone), hệ thống sẽ nhân bản (clone) dữ liệu đó sang tài khoản của user hiện tại để họ tùy ý chỉnh sửa và ôn tập
