# PROJECT_STATE.md — Trạng thái dự án Cognito

File này được duy trì và cập nhật xuyên suốt toàn bộ các phase theo quy tắc vận hành tại mục 0.1.2 của `cognito-master-prompt-final.md`.

---

## PHASE 0 — FULL SOURCE CODE AUDIT — 2026-09-27
Status: DONE

### Gate Baseline Checks (Mục 0.1.3):
- **Backend TypeScript Build (`npm run build`)**: PASSED (0 errors)
- **Frontend TypeScript Check (`npx tsc --noEmit`)**: PASSED (0 errors)

---

### 1. Current Architecture `[PARTIAL]`
- **Mô hình tổng thể**: Monorepo gồm `backend/` và `frontend/`.
- **Backend Architecture**:
  - Nền tảng: Express + TypeScript chạy Node.js.
  - Tầng dữ liệu: PostgreSQL (`pg`) dùng kết nối Raw SQL Pool/Client trực tiếp, không sử dụng ORM (Prisma/TypeORM).
  - Quản lý Migration: `node-pg-migrate` với 23 file migration trong `backend/migrations/`.
  - Cơ chế Runtime Bootstrap (Bất thường): Tồn tại 2 hàm bootstrap chạy ngầm lúc server khởi động (`src/db/ai-test-schema.ts` và `src/db/lecture-schema.ts`) tự động chạy câu lệnh DDL (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN`).
  - Phân tầng mã nguồn: `routes/` -> `controllers/` -> `services/` -> `repositories/` -> `db/`.
  - Xác thực: JWT (`jsonwebtoken`) + mật khẩu mã hóa bcryptjs, hỗ trợ Google OAuth qua `google-auth-library`.
  - AI Adapter: Lớp trừu tượng hóa `AIProviderService` hỗ trợ song song **Groq** và **Google Gemini**, ghi nhận logs vào `ai_request_logs` và chọn model động qua bảng `ai_models`.
- **Frontend Architecture**:
  - Framework: Next.js 14 (App Router) + TypeScript + TailwindCSS + Framer Motion.
  - Quản lý State: React Context toàn cục (`StudyContext`, `AuthContext`).
  - Kết nối API: `axios` và `fetch` bọc qua hàm tiện ích `apiFetch`.
  - Render tài liệu: `@cyntler/react-doc-viewer`, `pdfjs-dist`, `mammoth`, `mermaid` (sơ đồ tư duy).
- **Vấn đề cấu trúc cốt lõi**:
  - Hệ thống đang tồn tại 2 định hướng sản phẩm xung đột: **School LMS cũ** (Quản lý trường, khoa, lớp, niên khóa, học kỳ, giáo viên, phân công bài giảng) và **Personal Learning Platform** (Học tập cá nhân, lưu tài liệu, AI Chat, Question Generator, Flashcards, Pomodoro).

---

### 2. Current Database `[PARTIAL]`
Toàn bộ database PostgreSQL hiện tại gồm 31 bảng và 5 enum types:

| Bảng dữ liệu | Khóa chính (PK) | Mục đích / Thuộc miền | Quan hệ ngoại (FK) chính | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `SERIAL (int)` | Tài khoản người dùng | `primary_organization_id` -> `organizations.id` | `PARTIAL` |
| `user_study_dates` | `SERIAL (int)` | Điểm danh streak học | `user_id` -> `users.id` | `WORKING` |
| `documents` | `SERIAL (int)` | Tài liệu học tập | `user_id` -> `users.id` | `WORKING` |
| `document_chunks` | `SERIAL (int)` | Vector chunks RAG | `document_id` -> `documents.id`, embedding vector(768) | `WORKING` |
| `notes` | `SERIAL (int)` | Ghi chú tài liệu | `user_id` -> `users.id`, `document_id` -> `documents.id` | `WORKING` |
| `flashcard_decks` | `SERIAL (int)` | Bộ thẻ ghi nhớ | `user_id` -> `users.id` | `WORKING` |
| `flashcards` | `SERIAL (int)` | Thẻ flashcard & SRS | `deck_id` -> `flashcard_decks.id` | `WORKING` |
| `mindmaps` | `SERIAL (int)` | Sơ đồ tư duy | `document_id` -> `documents.id`, `user_id` -> `users.id` | `WORKING` |
| `study_sessions` | `SERIAL (int)` | Phiên học tập / Pomodoro | `user_id` -> `users.id`, `document_id` -> `documents.id` | `WORKING` |
| `tasks` | `SERIAL (int)` | Nhiệm vụ học tập | `user_id` -> `users.id` | `WORKING` |
| `friends` | `SERIAL (int)` | Bạn bè / Mạng xã hội | `user_id` -> `users.id`, `friend_id` -> `users.id` | `WORKING` |
| `purchased_resources`| `SERIAL (int)` | Tài nguyên đã mở khóa | `user_id` -> `users.id`, `document_id` -> `documents.id` | `WORKING` |
| `transactions` | `SERIAL (int)` | Lịch sử xu / Coin | `user_id` -> `users.id` | `WORKING` |
| `ai_providers` | `SERIAL (int)` | Nhà cung cấp AI (Groq, Gemini)| Không có | `WORKING` |
| `ai_models` | `SERIAL (int)` | Danh mục model AI | `provider_id` -> `ai_providers.id` | `WORKING` |
| `ai_task_configs` | `SERIAL (int)` | Cấu hình tham số sinh đề | `user_id` -> `users.id` | `WORKING` |
| `test_sets` | `SERIAL (int)` | Bộ đề thi trắc nghiệm | `created_by` -> `users.id`, `config_id` -> `ai_task_configs.id` | `WORKING` |
| `questions` | `SERIAL (int)` | Câu hỏi chi tiết | `test_set_id` -> `test_sets.id`, `source_chunk_id` -> `document_chunks.id` | `WORKING` |
| `ai_request_logs` | `SERIAL (int)` | Nhật ký gọi LLM | `user_id` -> `users.id`, `model_id` -> `ai_models.id` | `WORKING` |
| `lectures` | `SERIAL (int)` | Bài giảng slide | `user_id` -> `users.id` | `REFACTOR` |
| `lecture_slides` | `SERIAL (int)` | Chi tiết từng slide | `lecture_id` -> `lectures.id` | `REFACTOR` |
| `organizations` | `UUID` | Trường học / Tổ chức | Không có | `REMOVE` |
| `majors` | `UUID` | Chuyên ngành học | `organization_id` -> `organizations.id` | `REMOVE` |
| `academic_years` | `UUID` | Niên khóa | `organization_id` -> `organizations.id` | `REMOVE` |
| `semesters` | `UUID` | Học kỳ | `academic_year_id` -> `academic_years.id` | `REMOVE` |
| `subjects` | `UUID` | Môn học nhà trường | `organization_id` -> `organizations.id`, `major_id` -> `majors.id` | `REMOVE` |
| `school_classes` | `UUID` | Lớp học | `organization_id`, `major_id`, `semester_id`, `subject_id`, `homeroom_teacher_id` | `REMOVE` |
| `organization_members`| `UUID` | Thành viên trường (gv, hs) | `organization_id`, `user_id`, `class_id` | `REMOVE` |
| `class_enrollments` | `UUID` | Học sinh vào lớp | `class_id` -> `school_classes.id`, `student_id` -> `users.id` | `REMOVE` |
| `class_teacher_assignments`| `UUID` | Phân công giáo viên | `class_id` -> `school_classes.id`, `teacher_id` -> `users.id` | `REMOVE` |
| `class_assignments` | `UUID` | Bài tập giao cho lớp | `class_id`, `test_set_id`, `document_id`, `assigned_by` | `REMOVE` |
| `assignment_attempts`| `UUID` | Lượt làm bài tập lớp | `assignment_id` -> `class_assignments.id`, `student_id` -> `users.id` | `REMOVE` |
| `attempt_answers` | `UUID` | Chi tiết câu trả lời bài tập | `attempt_id` -> `assignment_attempts.id`, `question_id` -> `questions.id` | `REMOVE` |

---

### 3. Current API (Audit theo từng Domain Nghiệp vụ) `[PARTIAL]`

| Domain API | Các Endpoint chính | Trạng thái | Đánh giá & Vấn đề tồn đọng |
| :--- | :--- | :--- | :--- |
| **AUTH** | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`GET /api/auth/me`<br>`PUT /api/auth/profile`<br>`POST /api/auth/change-password`<br>`POST /api/auth/forgot-password`<br>`POST /api/auth/reset-password`<br>`POST /api/auth/google`<br>`POST /api/auth/upgrade-premium` | `PARTIAL` | Các luồng login/register/reset pass hoạt động tốt (`WORKING`). Riêng `upgrade-premium` là MOCK (chỉ update cứng `users.role = 'premium'`). Logic đăng ký còn kiểm tra mã trường (`school_code`). |
| **DOCUMENT** | `POST /api/documents/upload`<br>`GET /api/documents`<br>`GET /api/documents/:id`<br>`DELETE /api/documents/:id`<br>`GET /api/documents/:id/download`<br>`POST /api/documents/:id/chat`<br>`POST /api/documents/:id/summary` | `WORKING` | Đầy đủ upload file (PDF, DOCX, Cloudinary, Disk), xử lý OCR, chunking văn bản và RAG Vector search. |
| **AI** | `POST /api/ai/chat`<br>`GET /api/ai/models`<br>`GET /api/ai/quota`<br>`GET /api/ai/request-logs` | `WORKING` | Quản lý model động qua database, rate-limiting quota AI, logging token đầy đủ. |
| **QUESTION** | `POST /api/questions/generate`<br>`PATCH /api/questions/:id`<br>`DELETE /api/questions/:id`<br>`POST /api/test-sets/:id/approve`<br>`GET /api/test-sets/:id`<br>`GET /api/documents/:id/keywords` | `WORKING` | Pipeline 6 giai đoạn: TF-IDF + AI Salience, sliding window context, Bloom templates, deduplication cosine similarity ($>0.90$), grounding check. |
| **AI TEST (LEGACY)**| `POST /api/test-sets/generate`<br>`GET /api/test-sets`<br>`GET /api/questions/test-sets/:testSetId`<br>`POST /api/test-sets/upload-exam` | `DUPLICATED` | Endpoint `POST /test-sets/generate` trùng lặp với `POST /questions/generate`. Parse đề thi PDF/DOCX qua `upload-exam` chạy tốt nhưng cần gom vào một router duy nhất. |
| **QUIZ (ATTEMPT)** | `POST /api/assignments/:id/start`<br>`POST /api/attempts/:id/submit`<br>`PUT /api/attempts/:id/answers`<br>`GET /api/assignments/:id/attempts` | `BROKEN / REMOVE` | **KHÔNG CÓ API LÀM BÀI CÁ NHÂN**. Luồng attempt hiện tại chỉ chạy qua bài tập lớp học (`class_assignments`). Người dùng cá nhân tạo đề xong không có API để tự làm bài thi độc lập. |
| **RESULT** | Không có endpoint riêng | `MISSING` | Thiếu hoàn toàn module xem kết quả chi tiết, thống kê điểm số bài thi cá nhân và chức năng "Ôn lại câu sai" (Mistake Review). |
| **NOTES** | `GET /api/notes/document/:docId`<br>`POST /api/notes` | `WORKING` | Tạo, lưu, cập nhật ghi chú theo tài liệu hoạt động ổn định. |
| **MINDMAP** | `GET /api/documents/:id/mindmap`<br>`POST /api/documents/:id/mindmap` | `WORKING` | Sinh mã Mermaid.js tự động từ tài liệu, parse và hiển thị mượt mà. |
| **FLASHCARD** | `GET /api/flashcards/decks`<br>`POST /api/flashcards/decks`<br>`GET /api/flashcards/decks/:id/cards`<br>`POST /api/flashcards/cards`<br>`POST /api/flashcards/cards/:id/review`<br>`GET /api/flashcards/public`<br>`POST /api/flashcards/fork/:id` | `WORKING` | Hoạt động đầy đủ thuật toán lặp lại ngắt quãng (SRS/Leitner), tạo thẻ thủ công và sinh bằng AI. |
| **FOCUS** | `POST /api/study-sessions`<br>`POST /api/study-sessions/active-ping`<br>`GET /api/study-sessions/stats` | `PARTIAL` | Đã có Pomodoro timer và active ping. Còn thiếu Distraction Detection và Break analytics. |
| **PROGRESS** | `GET /api/leaderboard`<br>`GET /api/tasks`<br>`POST /api/tasks/progress`<br>`GET /api/friends`<br>`GET /api/users/:targetUserId/profile` | `PARTIAL` | Có streak, leaderboard, task hàng ngày. Còn thiếu mục tiêu học tập (Learning Goals) và Daily Study Analytics theo tuần/tháng. |
| **COMMUNITY** | `GET /api/marketplace/resources`<br>`POST /api/marketplace/unlock`<br>`GET /api/shares` | `REBUILD / MISSING` | Chỉ có tính năng mở khóa tài liệu bằng coin. Thiếu Community Feed, Like, Comment, Bookmark, Reshare, Báo cáo vi phạm. |
| **CHAT** | Không có endpoint | `MISSING` | Thiếu hoàn toàn tính năng nhắn tin 1-1 giữa các thành viên trong cộng đồng. |
| **NOTIFICATION** | `GET /api/notifications/stream` | `PARTIAL` | Server-Sent Events (SSE) cho nhiệm vụ học tập, chưa có thông báo tương tác cộng đồng và hệ thống. |
| **PREMIUM** | `POST /api/payment/download/:documentId` | `BROKEN / MISSING` | Chỉ có trừ coin mua tài nguyên. Thiếu bảng gói cước (Plans), Subscription, Checkout, Webhook và Middleware chặn hạn mức (Entitlement). |
| **ADMIN** | `GET /api/admin/stats`<br>`GET /api/admin/users`<br>`PUT /api/admin/users/:id/role`<br>`PUT /api/admin/users/:id/status`<br>`GET /api/admin/documents`<br>`PUT /api/admin/documents/:id/status` | `WORKING` | Hoạt động tốt cho quản trị viên (Thống kê hệ thống, kiểm duyệt tài liệu, quản lý thành viên). |
| **SCHOOL** | `GET/POST /api/school/organizations`<br>`GET/POST /api/school/academic-years`<br>`GET/POST /api/school/classes`<br>`POST /api/school/import/students` | `REMOVE` | Nghiệp vụ trường học cần dọn dẹp hoàn toàn. |
| **TEACHER** | `GET/POST /api/lectures/*`<br>Quản lý lớp trong `school.routes.ts` | `REFACTOR / REMOVE` | Phần bài giảng slide (`lectures`) giữ lại và refactor thành Personal Presentation. Phần lớp/chấm điểm giáo viên bị loại bỏ. |

---

### 4. Current Frontend `[PARTIAL]`
- **Cấu trúc Routing (`frontend/src/app`)**:
  - `/` -> `/home`: Landing page (Navbar, Hero, Features, CTA, Footer) — `WORKING`.
  - `/library`: Thư viện học tập cá nhân đa năng (Tài liệu, Đề thi, Flashcard, Ghi chú, Mindmap) — `WORKING`.
  - `/viewer/[id]`: Trình đọc tài liệu PDF/DOCX tích hợp AI Chat, Ghi chú và tạo Mindmap — `WORKING`.
  - `/ai-test`: Giao diện tạo đề thi AI (chọn model, từ khóa, template Bloom, xem trước, sửa câu hỏi) — `WORKING`.
  - `/flashcards`: Giao diện học flashcard lật thẻ, chấm điểm SRS — `WORKING`.
  - `/study-sessions`: Phòng tự học Pomodoro — `WORKING`.
  - `/community`: Thư viện flashcard công khai "EduShare" — `PARTIAL`.
  - `/marketplace`: Chợ mua bán tài liệu bằng coin — `PARTIAL`.
  - `/leaderboard`: Bảng xếp hạng học tập — `WORKING`.
  - `/profile` & `/settings`: Trang hồ sơ cá nhân và đổi mật khẩu — `WORKING`.
  - `/admin`: Bảng điều khiển quản trị — `WORKING`.
  - `/premium`: Giao diện gói Premium — `MOCK`.
  - `/premium-preview`: Giao diện trùng lặp — `REMOVE`.
  - `/testhome`: Giao diện thử nghiệm mồ côi — `REMOVE`.
  - `/school/*` (4 subroutes: academic-years, classes, students, subjects) — `REMOVE`.
  - `/teacher/*` (4 subroutes: classes, exams, presentation, studio) — `REMOVE`.
  - `/student/*` (2 subroutes: assignments, attempt) — `REMOVE`.

---

### 5. Current AI `[WORKING]`
- **Provider & Model Abstraction**: Hoàn thiện qua `AIProviderService` tại `backend/src/services/ai-provider.service.ts`. Tự động fallback giữa Groq và Gemini, hỗ trợ `jsonMode`, cấu hình `temperature`, `maxTokens`.
- **RAG & Vector Search**: Quản lý qua `rag.service.ts` và `document_chunks.repository.ts`, sử dụng extension `vector` (pgvector 768 chiều), chia chunk thông minh, trích xuất từ khóa tự động qua TF-IDF và Heuristic.
- **Question Generator Engine**: Pipeline 6 giai đoạn tại `question-generation.service.ts`.
- **Prompt Injection Protection**: Hàm `sanitizeUserInstruction` kiểm tra regex chặn đứng các kỹ thuật bypass vai trò, bỏ qua quy tắc hoặc trích xuất system prompt.
- **Token & Cost Tracking**: Bảng `ai_request_logs` lưu trữ `input_tokens`, `output_tokens`, `latency_ms` cho từng yêu cầu.

---

### 6. Working Modules `[DONE]`
1. **Hệ thống Tài liệu (Document Management & RAG)**: Upload, trích xuất text, OCR trang scan, chia chunk, vector embedding, hỏi đáp tài liệu theo ngữ cảnh.
2. **AI Question Generator**: Sinh câu hỏi đa dạng (Multiple choice, Fill blank, True/False, Essay), căn chỉnh độ khó, lọc trùng bằng Cosine Similarity, gắn cờ kiểm định căn cứ tài liệu (Grounding).
3. **Thẻ ghi nhớ (Flashcards & SRS)**: Tạo bộ thẻ, sinh thẻ tự động từ tài liệu, thuật toán ôn tập lặp lại ngắt quãng.
4. **Sơ đồ tư duy (Mindmap)**: Tự động tổng hợp tài liệu thành sơ đồ Mermaid.js chuẩn cú pháp.
5. **Phiên học tập (Focus Timer / Pomodoro)**: Bấm giờ, đếm thời gian thực học, heartbeat ping.
6. **Xác thực & Quản trị**: Đăng ký, đăng nhập JWT, Google Auth, Admin Dashboard quản lý user & duyệt tài liệu.

---

### 7. Broken Modules `[BROKEN]`
1. **Personal Quiz Taking & Review**: Người dùng sau khi duyệt bộ đề DRAFT không thể thực hiện bài kiểm tra trắc nghiệm cho bản thân vì luồng làm bài hiện tại gắn chặt với `class_assignments` của trường học. Không có trang/API nộp bài, tính điểm và ôn lại câu làm sai.
2. **Hệ thống Thanh toán & Subscription**: Nút "Nâng cấp Premium" trên frontend gọi API giả lập gán trực tiếp `users.role = 'premium'`, không có bảng theo dõi gói, không có cổng thanh toán, không có webhook, không có cơ chế hết hạn.
3. **Phân mảnh Cộng đồng & Marketplace**: Tách rời thành 2 trang riêng lẻ (`/community` chỉ hiện flashcard và `/marketplace` chỉ bán tài liệu) với logic giao dịch sơ sài.

---

### 8. Bản đồ phụ thuộc School/LMS (School Dependencies Map) `[REMOVE]`

Dưới đây là bản đồ phụ thuộc toàn diện của 12 bảng School/LMS, các ràng buộc khóa ngoại (FK) và các thành phần mã nguồn đang sử dụng:

| Bảng School | Khóa ngoại trong bảng (Trỏ đi) | Bị bảng nào tham chiếu (Trỏ đến) | Controller / Service / Repository liên quan | Component / Route Frontend sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **`organizations`** | Không có | - `users.primary_organization_id`<br>- `majors.organization_id`<br>- `school_classes.organization_id`<br>- `organization_members.organization_id`<br>- `academic_years.organization_id`<br>- `subjects.organization_id` | `school.controller.ts`<br>`organization.service.ts`<br>`organization.repository.ts`<br>`auth.service.ts` | `frontend/src/app/school/*`<br>`RegisterModal.tsx` |
| **`majors`** | - `organization_id` -> `organizations.id` | - `school_classes.major_id`<br>- `subjects.major_id` | `school.controller.ts`<br>`academic.service.ts`<br>`major.repository.ts` | `frontend/src/app/school/classes`<br>`frontend/src/app/school/subjects` |
| **`academic_years`** | - `organization_id` -> `organizations.id` | - `semesters.academic_year_id` | `school.controller.ts`<br>`academic.service.ts`<br>`academic.repository.ts` | `frontend/src/app/school/academic-years` |
| **`semesters`** | - `academic_year_id` -> `academic_years.id` | - `school_classes.semester_id` | `school.controller.ts`<br>`academic.service.ts`<br>`academic.repository.ts` | `frontend/src/app/school/academic-years`<br>`frontend/src/app/school/classes` |
| **`subjects`** | - `organization_id` -> `organizations.id`<br>- `major_id` -> `majors.id` | - `school_classes.subject_id` | `school.controller.ts`<br>`academic.service.ts`<br>`academic.repository.ts` | `frontend/src/app/school/subjects` |
| **`school_classes`** | - `organization_id` -> `organizations.id`<br>- `major_id` -> `majors.id`<br>- `semester_id` -> `semesters.id`<br>- `subject_id` -> `subjects.id`<br>- `homeroom_teacher_id` -> `users.id` | - `organization_members.class_id`<br>- `class_assignments.class_id`<br>- `class_enrollments.class_id`<br>- `class_teacher_assignments.class_id` | `school.controller.ts`<br>`class.repository.ts`<br>`class-member.repository.ts` | `frontend/src/app/school/classes`<br>`frontend/src/app/teacher/classes`<br>`frontend/src/app/student/assignments` |
| **`organization_members`** | - `organization_id` -> `organizations.id`<br>- `user_id` -> `users.id`<br>- `class_id` -> `school_classes.id` | Không có (Bảng lá) | `organization-member.repository.ts`<br>`bulk-import.service.ts`<br>`auth.service.ts` | `frontend/src/app/school/students` |
| **`class_enrollments`** | - `class_id` -> `school_classes.id`<br>- `student_id` -> `users.id` | Không có (Bảng lá) | `class-member.repository.ts`<br>`academic.repository.ts`<br>`academic.service.ts` | `frontend/src/app/school/classes`<br>`frontend/src/app/teacher/classes` |
| **`class_teacher_assignments`** | - `class_id` -> `school_classes.id`<br>- `teacher_id` -> `users.id` | Không có (Bảng lá) | `academic.repository.ts`<br>`academic.service.ts` | `frontend/src/app/teacher/classes` |
| **`class_assignments`** | - `class_id` -> `school_classes.id`<br>- `test_set_id` -> `test_sets.id`<br>- `document_id` -> `documents.id`<br>- `assigned_by` -> `users.id` | - `assignment_attempts.assignment_id` | `assignment.service.ts`<br>`assignment.repository.ts`<br>`school.controller.ts` | `frontend/src/app/teacher/exams`<br>`frontend/src/app/student/assignments` |
| **`assignment_attempts`** | - `assignment_id` -> `class_assignments.id`<br>- `student_id` -> `users.id` | - `attempt_answers.attempt_id` | `assignment-attempt.service.ts`<br>`assignment-attempt.repository.ts`<br>`attempt.controller.ts` | `frontend/src/app/student/attempt/[id]` |
| **`attempt_answers`** | - `attempt_id` -> `assignment_attempts.id`<br>- `question_id` -> `questions.id` | Không có (Bảng lá) | `assignment-attempt.service.ts`<br>`attempt.controller.ts` | `frontend/src/app/student/attempt/[id]` |

---

### 9. Audit Dead Code & Files Dư Thừa `[REMOVE]`

1. **Files rỗng / Scripts tạm thời ở Backend**:
   - `backend/server2.ts`: File 0 bytes không sử dụng.
   - `backend/check_admin.js`, `backend/check_api.js`, `backend/check_role.js`, `backend/create_teacher.js`: Các script ad-hoc chạy thử nghiệm node đơn lẻ, chứa code hardcode kết nối database.
   - `backend/scripts/test-org.ts`: Script thử nghiệm tạo tổ chức/trường học.
   - `temp_freya.json` tại thư mục gốc repo.
2. **Routers & Controllers stub mồ côi (Commented-out code)**:
   - `backend/src/routes/course.routes.ts`: Toàn bộ logic bên trong bị comment out, không được import hay mount trong `app.ts`.
   - `backend/src/controllers/course.controller.ts`: Endpoint rỗng `res.json({ message: "Get courses endpoint" })`.
   - `backend/src/routes/user.routes.ts`: Bị comment out hoàn toàn, không được mount trong `app.ts`.
   - `backend/src/controllers/user.controller.ts`: Endpoint rỗng `res.json({ message: "Get user endpoint" })`.
3. **Frontend Dead Routes & Components**:
   - `frontend/src/app/testhome`: Trang landing thử nghiệm trùng lặp không có liên kết nào trỏ đến.
   - `frontend/src/app/premium-preview`: Giao diện thử nghiệm nhân bản từ `/premium`.
   - `frontend/src/components/teacher/TeacherStudioSection.tsx` (File lớn 21KB): Chỉ dùng cho giao diện giảng viên trường học.

---

### 10. Audit Mock Data & Dữ liệu Giả Lập `[PARTIAL]`

1. **Mock Nâng cấp Premium**:
   - Vị trí: `frontend/src/app/premium/page.tsx`, `frontend/src/components/layout/PremiumModal.tsx`, `backend/src/services/auth.service.ts:222`.
   - Thực trạng: Khi bấm nâng cấp, client gọi `POST /api/auth/upgrade-premium` và backend chỉ thực hiện đúng 1 lệnh SQL: `UPDATE users SET role = 'premium'`. Không có cổng thanh toán, không có giao dịch tiền thật, không có hóa đơn và thời hạn gói.
2. **Hardcoded Prompt Giảng viên Đại học CMC**:
   - Vị trí: `backend/src/db/ai-test-schema.ts:10`.
   - Thực trạng: Prompt mặc định chứa nội dung: *"Tôi là một giảng viên cho môn Đạo đức kinh doanh tại trường đại học CMC, 1 trường tư. Môn học này được giảng dạy cho sinh viên năm 2..."*. Đây là prompt bị hardcode cho trường học cụ thể, không phù hợp với nền tảng học tập cá nhân toàn cầu.
3. **Dữ liệu bài giảng mẫu Seed tĩnh**:
   - Vị trí: `backend/src/db/lecture-schema.ts:50-185`.
   - Thực trạng: Tự động seed cứng 24 slide của bài giảng *"Introduction to Machine Learning"* vào database mỗi khi server chạy lần đầu nếu bảng rỗng.
4. **Community Flashcard Data**:
   - Vị trí: `frontend/src/app/community/page.tsx`.
   - Thực trạng: Tiêu đề trang ghi *"Cộng Đồng EduShare - Khám phá hàng ngàn bộ thẻ và tài liệu"*, nhưng thực tế chỉ load danh sách flashcard decks, không có tài liệu hay đề thi.

---

### 11. Missing Features (Tính năng còn thiếu theo Master Prompt) `[MISSING]`

1. **Personal Quiz Engine (Hệ thống làm bài thi cá nhân)**:
   - Bảng `quiz_attempts` (id, user_id, test_set_id, score, total_questions, duration_seconds, started_at, completed_at, status).
   - Bảng `quiz_attempt_answers` (id, attempt_id, question_id, user_answer, is_correct, explanation).
   - Giao diện làm bài trắc nghiệm có đồng hồ đếm ngược, nộp bài, màn hình kết quả và tính năng **Ôn tập câu sai (Mistake Review)**.
2. **Unified Community Ecosystem (Cộng đồng học tập tập trung)**:
   - Bảng `community_resources` (cho phép xuất bản Documents, Test Sets, Flashcard Decks, Notes, Mindmaps ra cộng đồng).
   - Bảng `community_likes`, `community_comments`, `community_saves` (Bookmark), `community_reports`.
   - Trang Community Feed tương tác thời gian thực.
3. **1-on-1 Direct Messaging (Tin nhắn riêng tư giữa các thành viên)**:
   - Bảng `conversations`, `messages`, `user_blocks`, `conversation_participants`.
   - API nhắn tin, đếm tin nhắn chưa đọc, chặn người dùng và báo cáo quấy rối.
4. **Hệ thống Premium & Subscription thực thụ**:
   - Bảng `subscription_plans`, `user_subscriptions`, `payment_orders`.
   - Tích hợp cổng thanh toán Sandbox (PayOS / MoMo / VNPay / Stripe Test).
   - Webhook xác thực giao dịch tự động.
   - Middleware `checkEntitlement` kiểm soát hạn mức AI (Free: 10 lần/ngày, Premium: Không giới hạn).
5. **Personal Presentation Mode**:
   - Refactor module `lectures` thành chế độ trình chiếu tài liệu/bài học cá nhân, tách khỏi ngữ cảnh giảng dạy của giáo viên trường học.

---

### 12. Mục Phân Tích Rủi Ro Trọng Yếu (Critical Risks) `[CRITICAL]`

> [!CAUTION]
> 1. **Rủi ro Khóa ngoại chéo phá hủy dữ liệu (Cross-table Foreign Key Deadlock)**:
>    - `users.primary_organization_id` tham chiếu `organizations.id`.
>    - `class_assignments` tham chiếu `test_sets.id` và `documents.id`.
>    - `attempt_answers` tham chiếu `questions.id`.
>    - **Hậu quả nếu thao tác sai**: Nếu thực hiện `DROP TABLE organizations CASCADE` hoặc `DROP TABLE school_classes CASCADE` mà không tháo gỡ ràng buộc khóa ngoại trước, PostgreSQL có thể xóa lan (cascade delete) làm mất dữ liệu các bộ đề thi (`test_sets`), câu hỏi (`questions`) và tài liệu (`documents`) cá nhân.
>
> 2. **Rủi ro Xung đột Runtime Schema Bootstrap**:
>    - Hai file `ai-test-schema.ts` và `lecture-schema.ts` đang can thiệp cấu trúc bảng lúc runtime (mỗi lần server start) thay vì thông qua migration có số version.
>    - **Hậu quả**: Khi triển khai lên môi trường nhiều container/cluster hoặc môi trường test, các câu lệnh DDL chạy đồng thời sẽ gây lỗi lock transaction hoặc không đồng nhất schema.
>
> 3. **Rủi ro CHECK Constraint trên `users.role`**:
>    - PostgreSQL đang có ràng buộc: `CHECK (role IN ('student', 'teacher', 'admin', 'premium'))`.
>    - Master Prompt yêu cầu hệ thống chỉ có 2 role duy nhất: `USER` và `ADMIN`.
>    - **Hậu quả**: Nếu sửa code backend gán `role = 'user'` trước khi chạy migration cập nhật CHECK constraint, toàn bộ chức năng đăng ký tài khoản mới và cập nhật profile sẽ bị crash với lỗi `violates check constraint "users_role_check"`.
>
> 4. **Rủi ro gãy luồng điều hướng Frontend (Broken Route / Dead Link)**:
>    - `frontend/src/app/home/page.tsx` và `RegisterModal.tsx` đang có logic rẽ nhánh tự động: `if (activeUser.role === 'teacher') router.push('/teacher')`.
>    - **Hậu quả**: Khi xóa thư mục `frontend/src/app/teacher/`, bất kỳ tài khoản cũ nào mang role `teacher` đăng nhập vào sẽ lập tức bị chuyển hướng vào trang 404 Not Found.
>
> 5. **Rủi ro Mất hoàn toàn chức năng Làm bài kiểm tra**:
>    - Hiện tại, chức năng làm bài duy nhất nằm ở `frontend/src/app/student/attempt/[id]`.
>    - **Hậu quả**: Khi xóa thư mục `app/student/` ở Phase 2, nếu Phase 1 chưa kịp chuẩn hóa và tạo mới trang Quiz cá nhân thì hệ thống sẽ hoàn toàn không còn khả năng làm bài kiểm tra.

---

### 13. Recommended Migration Order (Thứ tự thực hiện đề xuất)

```text
PHASE 0: FULL SOURCE CODE AUDIT
   │   (Đã hoàn thành 100% — Kiểm tra baseline build thành công)
   ▼
PHASE 1: ARCHITECTURE + DATABASE FOUNDATION
   │   - Xóa bỏ runtime bootstrap (chuyển sang migration chuẩn)
   │   - Tháo gỡ các Foreign Key trỏ chéo từ School sang Core (Drop FK constraints)
   │   - Chuẩn hóa bảng Users: Update role về ('user', 'admin'), thêm cờ is_premium
   │   - Tạo bảng Quiz Attempt cá nhân: quiz_attempts, quiz_attempt_answers
   │   - Tạo khung bảng Community, Messaging, Subscription chuẩn
   ▼
PHASE 2: REMOVE SCHOOL / TEACHER SYSTEM
   │   - Thực hiện Checkpoint sao lưu
   │   - Drop an toàn 12 bảng School/LMS
   │   - Xóa bỏ school.routes.ts, academic, assignment services
   │   - Xóa các trang frontend: /school, /teacher, /student, /testhome
   │   - Dọn dẹp dead code (server2.ts, script adhoc, stub controller)
   ▼
PHASE 3 → 37: TRIỂN KHAI THEO MASTER PROMPT
       - Personal Quiz Engine & Review Mistakes
       - Focus & Pomodoro Analytics
       - Community Feed & Interaction
       - 1-on-1 Messaging
       - Real Payment & Subscription Gateway
```

---

## PHASE 1 — ARCHITECTURE + DATABASE FOUNDATION — 2026-09-27
Status: DONE

### Gate Checks:
- Backend Build (`npm run build`): PASSED (0 errors)
- Frontend TypeScript Check (`npx tsc --noEmit`): PASSED (0 errors)
- Frontend Linter (`npx eslint src`): PASSED (0 errors, 29 warnings) — Đã sửa lỗi vi phạm Rules of Hooks trong `DocumentViewerWrapper.tsx`.
- Migration Execution (`node-pg-migrate up`): PASSED (Migration `1790000000000_personal_platform_foundation` applied successfully)
- Git Checkpoint trước Phase 2: Đã commit thành công tại SHA `cc6e425` ("checkpoint(phase1): decouple school FKs, normalize user roles, formalize core schema, fix lint").

### Làm rõ 5 điểm trọng yếu trước khi bước sang Phase 2:
1. **Xác nhận về `attempt_answers` và bảng `questions` core**:
   - `attempt_answers` là bảng **School-only 100%** (chỉ lưu bài nộp của học sinh làm bài tập trường giao qua `assignment_attempts` -> `class_assignments`).
   - Cột `question_id` trong `attempt_answers` tham chiếu tới chính bảng `questions` core (dùng chung câu hỏi từ `test_sets`).
   - Ràng buộc cũ có `ON DELETE CASCADE`: nghĩa là nếu xóa câu hỏi ở bảng `questions` core thì bài nộp học sinh ở `attempt_answers` bị xóa theo, nhưng khi xóa `attempt_answers` thì câu hỏi ở `questions` KHÔNG bị xóa.
   - Việc tháo gỡ FK `attempt_answers_question_id_fkey` ở Phase 1 nhằm đảm bảo khi Phase 2 xóa bảng `attempt_answers`, PostgreSQL không cần kiểm tra đối chiếu bảng `questions`, giúp bảng `questions` core của Question Generator được bảo vệ tuyệt đối và độc lập 100%. Bảng `questions` thuộc nhóm KEEP và không hề bị xóa hay suy suyển dữ liệu.
2. **Xác nhận về `user.routes.ts` và `user.controller.ts` (Dead Code)**:
   - Hai file này là **Dead Code / Stub 100%**, hoàn toàn không được import hay mount trong `backend/src/app.ts`.
   - Toàn bộ API User thật đang hoạt động trong hệ thống nằm ở:
     - `backend/src/routes/auth.routes.ts` & `auth.controller.ts`: phục vụ `/api/auth/me` (lấy session/thông tin user), `/api/auth/profile` (cập nhật hồ sơ), `/api/auth/avatar` (cập nhật avatar), `/api/auth/change-password`.
     - `backend/src/routes/activity.routes.ts` & `activity.controller.ts`: phục vụ `/api/users/:targetUserId/profile` (xem hồ sơ công khai).
     - `backend/src/routes/admin.routes.ts` & `admin.controller.ts`: phục vụ `/api/admin/users/*` (quản trị người dùng).
   - Việc xóa `user.routes.ts` và `user.controller.ts` không làm ảnh hưởng đến bất kỳ API user nào đang chạy.
3. **Xác nhận quyền sở hữu Document / TestSet do cựu Teacher tạo ra**:
   - Bảng `documents` có cột sở hữu trực tiếp: `user_id INTEGER NOT NULL REFERENCES users(id)`.
   - Bảng `test_sets` có cột sở hữu trực tiếp: `created_by INTEGER REFERENCES users(id)`.
   - Bảng `class_assignments` chỉ là bảng liên kết trung gian (chứa `class_id`, `test_set_id`, `document_id`, `assigned_by`).
   - Khi cựu teacher tạo tài liệu hoặc đề thi, dữ liệu được lưu thẳng vào `documents` và `test_sets` với `owner_id = user.id`. Khi giao bài tập, nó chỉ tạo thêm một bản ghi trỏ ID trong `class_assignments`.
   - Ở Phase 1, ta đã tháo gỡ FK `class_assignments_test_set_id_fkey` và `class_assignments_document_id_fkey`. Khi Phase 2 xóa `class_assignments`, toàn bộ Documents và Test Sets do cựu teacher tạo ra **vẫn tồn tại nguyên vẹn 100% trong thư viện cá nhân của user đó**, với quyền sở hữu `user_id / created_by` trỏ chính xác về tài khoản của họ (hiện mang role `user`).
4. **Kế hoạch thực hiện Phase 2 (Soft-remove trước, Hard-delete sau)**:
   - Theo đúng Rule 0.1.4, Phase 2 KHÔNG DROP thẳng tay mà tuân thủ quy trình 2 bước:
     - **Bước 1 (Soft-remove)**: Tạo migration đổi tên 12 bảng School thành `_deprecated_organizations`, `_deprecated_school_classes`, v.v.; deprecated các route/controller của School. Chạy toàn bộ vòng kiểm tra Build (`tsc`) + Lint (`eslint`) + Test.
     - **Bước 2 (Hard-delete)**: Chỉ sau khi toàn bộ hệ thống pass 100% không còn bất kỳ dòng code nào phụ thuộc vào các bảng `_deprecated_*`, mới thực hiện lệnh DROP vĩnh viễn các bảng này.
5. **Lưu ý về phạm vi các bảng mới tạo ở Phase 1**:
   - Các bảng `community_*`, `conversations`, `messages`, `notifications`, `subscription_plans`, `subscriptions`, `payment_orders`, `user_usages`, `learning_goals`, `learning_activities` được tạo ở Phase 1 **mới chỉ là Schema Foundation (Nền móng cơ sở dữ liệu)**.
   - Chưa hề có service nghiệp vụ, endpoint API hoàn chỉnh hay giao diện tương ứng (những phần này sẽ được triển khai đầy đủ và audit kỹ lưỡng ở đúng từng Phase tương ứng: Phase 7 Focus, Phase 10-11 Community, Phase 12-14 Messaging & Social, Phase 17 Notification, Phase 19 Payment).

### Tóm tắt thay đổi:
1. **Tháo gỡ toàn bộ Foreign Key nguy hiểm trỏ từ School sang Core**:
   - Gỡ bỏ `fk_users_primary_organization` trên bảng `users`.
   - Gỡ bỏ `class_assignments_test_set_id_fkey` và `class_assignments_document_id_fkey` trên `class_assignments`.
   - Gỡ bỏ `attempt_answers_question_id_fkey` trên `attempt_answers`.
   - Kết quả: Không còn bất kỳ ràng buộc nào từ 12 bảng School/LMS có thể xóa lan (cascade delete) hoặc khóa chặt bảng cốt lõi (`users`, `documents`, `test_sets`, `questions`).
2. **Chuẩn hóa bảng `users`**:
   - Cập nhật CHECK constraint: `CHECK (role IN ('user', 'admin'))`.
   - Chuyển đổi dữ liệu role cũ: `student`, `teacher`, `premium` -> `user`.
   - Thêm cột: `is_premium` (boolean, default false), `premium_until` (timestamptz), `bio` (text), `headline` (varchar).
   - Đặt default role là `'user'`.
3. **Chuẩn hóa Schema vĩnh viễn (Formalize Schemas)**:
   - Đưa cấu trúc của `ai_task_configs`, `test_sets`, `questions`, `lectures`, `lecture_slides` vào migration chính thức có version kiểm soát thay vì dựa vào runtime bootstrap.
   - Làm sạch `DEFAULT_CUSTOM_PROMPT` trong `ai-test-schema.ts`: loại bỏ toàn bộ nội dung hardcode về giảng viên ĐH CMC.
4. **Chuẩn hóa cơ sở dữ liệu Personal Learning Platform**:
   - Tạo bảng `quiz_attempts` và `quiz_attempt_answers` phục vụ luồng làm bài trắc nghiệm cá nhân độc lập.
   - Bổ sung `distraction_count`, `break_seconds`, `notes_count` cho `study_sessions`.
   - Tạo bảng `learning_goals` và `learning_activities`.
   - Tạo hệ sinh thái cộng đồng: `community_resources`, `community_likes`, `community_comments`, `community_saves`.
   - Tạo hệ thống tin nhắn 1-1: `conversations`, `messages`.
   - Tạo hệ thống thông báo: `notifications`.
   - Tạo hệ thống gói cước và thanh toán: `subscription_plans`, `subscriptions`, `payment_orders`, `user_usages` (tracking hạn mức theo ngày).
5. **Dọn dẹp Dead Code & Repositories nền tảng**:
   - Xóa bỏ 5 file dead code/stubs: `backend/server2.ts`, `course.routes.ts`, `course.controller.ts`, `user.routes.ts`, `user.controller.ts`.
   - Tạo mới các repository chuẩn: `quiz-attempt.repository.ts`, `community.repository.ts`, `subscription.repository.ts`.
   - Cập nhật `user.repository.ts` và `auth.service.ts` hỗ trợ role chuẩn và trường premium.

### Bảng/API/Component đã đụng tới:
- Migration mới: `backend/migrations/1790000000000_personal_platform_foundation.js`
- Repositories:
  - Cập nhật: `backend/src/repositories/user.repository.ts`
  - Tạo mới: `backend/src/repositories/quiz-attempt.repository.ts`
  - Tạo mới: `backend/src/repositories/community.repository.ts`
  - Tạo mới: `backend/src/repositories/subscription.repository.ts`
- Services & Schemas:
  - Cập nhật: `backend/src/services/auth.service.ts`
  - Cập nhật: `backend/src/db/ai-test-schema.ts`
- Files đã xóa sạch:
  - `backend/server2.ts`
  - `backend/src/routes/course.routes.ts`
  - `backend/src/controllers/course.controller.ts`
  - `backend/src/routes/user.routes.ts`
  - `backend/src/controllers/user.controller.ts`

### Việc còn lại / rủi ro chuyển sang phase sau (PHASE 2):
- Đã hoàn thành toàn bộ trong Phase 2 bên dưới.

---

## PHASE 2 — REMOVE SCHOOL / TEACHER SYSTEM & AI FLASHCARD GENERATOR — 2026-09-27
Status: DONE
Checkpoint trước xóa: Commit SHA `cc6e425` / `a749b92` (đã commit và xác nhận backup đầy đủ trước khi thực hiện).

### Hai giai đoạn xóa (Two-Stage Removal - Quy tắc 0.1.4):
1. **Giai đoạn 1 (Soft-remove)**:
   - Áp dụng migration `1790100000000_soft_remove_school_tables.js`: Đổi tên toàn bộ 12 bảng School/LMS nếu tồn tại sang tiền tố `_deprecated_*`:
     `organizations`, `majors`, `academic_years`, `semesters`, `subjects`, `school_classes`, `organization_members`, `class_enrollments`, `class_teacher_assignments`, `class_assignments`, `assignment_attempts`, `attempt_answers`.
   - Gỡ bỏ toàn bộ routes, controllers, services, repositories và middleware của School khỏi backend codebase.
   - Gỡ bỏ AI Flashcard Generator khỏi route/controller AI.
   - Gỡ bỏ toàn bộ trang và component của School/Teacher và AI Flashcard Lab khỏi frontend codebase.
   - Vòng kiểm tra trung gian:
     - Backend `tsc`: PASSED (0 errors).
     - Frontend `npx tsc --noEmit`: PASSED (0 errors).
     - Frontend `npx eslint src`: PASSED (0 errors, 22 warnings pre-existing).
2. **Giai đoạn 2 (Hard-delete)**:
   - Áp dụng migration `1790200000000_drop_deprecated_school_tables.js`: Thực hiện DROP vĩnh viễn toàn bộ các bảng `_deprecated_*` và xóa sạch 4 ENUM School cũ (`academic_status`, `semester_status`, `enrollment_status`, `attempt_status`).
   - Kiểm tra xác nhận cuối cùng:
     - Backend `npm run build` (`tsc`): PASSED (0 errors).
     - Frontend `npx tsc --noEmit`: PASSED (0 errors).
     - Frontend `npx eslint src`: PASSED (0 errors).

### Tóm tắt thay đổi:
1. **Xóa bỏ hoàn toàn hệ thống School/LMS ở Backend**:
   - Routes đã xóa: `backend/src/routes/school.routes.ts`, `backend/src/routes/attempt.routes.ts`.
   - Controllers đã xóa: `backend/src/controllers/school.controller.ts`, `backend/src/controllers/attempt.controller.ts`, `backend/src/controllers/academic.controller.ts`.
   - Services đã xóa: `backend/src/services/academic.service.ts`, `backend/src/services/assignment.service.ts`, `backend/src/services/assignment-attempt.service.ts`, `backend/src/services/organization.service.ts`, `backend/src/services/bulk-import.service.ts`.
   - Repositories đã xóa: `backend/src/repositories/academic.repository.ts`, `backend/src/repositories/assignment.repository.ts`, `backend/src/repositories/assignment-attempt.repository.ts`, `backend/src/repositories/class.repository.ts`, `backend/src/repositories/class-member.repository.ts`, `backend/src/repositories/major.repository.ts`, `backend/src/repositories/organization.repository.ts`, `backend/src/repositories/organization-member.repository.ts`.
   - Middleware đã xóa: `backend/src/middlewares/orgRole.middleware.ts`.
   - Đã gỡ unmount `schoolRoutes` và `attemptRoutes` trong `backend/src/app.ts`.
   - Đã xóa sạch logic `PENDING_FIRST_LOGIN` (đổi mật khẩu lần đầu của tài khoản nhà trường cấp) và endpoint `/force-change-password` trong `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`.
2. **Xóa bỏ AI Flashcard Generator (Giữ nguyên toàn bộ tính năng Flashcard thủ công & Spaced Repetition)**:
   - Backend: Gỡ endpoint `POST /api/ai/generate-flashcards-from-file`, controller `generateFlashcardsFromFile`, và multer `uploadMem` khỏi `ai.routes.ts` & `ai.controller.ts`.
   - Frontend: Xóa file `frontend/src/components/flashcards/AIFlashcardLab.tsx`.
   - Giao diện Flashcards (`frontend/src/app/flashcards/page.tsx`): Gỡ nút "Tạo từ File" và modal `AIFlashcardLab`. Giữ nguyên đầy đủ: tạo bộ thẻ thủ công, tạo thẻ, chỉnh sửa thẻ, xóa thẻ, chia sẻ bộ thẻ, thuật toán Spaced Repetition, các chế độ ôn tập (Learn, MatchGame, Spell, Test, Write).
3. **Xóa bỏ toàn bộ giao diện School & Teacher Studio trên Frontend**:
   - Xóa thư mục trang:
     - `frontend/src/app/school/` (toàn bộ trang quản lý trường học)
     - `frontend/src/app/teacher/` (toàn bộ trang giáo viên/lớp học/bài tập)
     - `frontend/src/app/student/` (toàn bộ trang làm bài của học sinh theo lớp)
     - `frontend/src/app/testhome/` (trang landing page cũ redirect theo vai trò trường học)
   - Xóa component: `frontend/src/components/teacher/TeacherStudioSection.tsx` và thư mục `components/teacher/`.
   - Cập nhật trang Thư viện (`frontend/src/app/library/page.tsx`): Gỡ bỏ hoàn toàn tab `teacher_studio` và component `TeacherStudioSection`, hiển thị thư viện tài liệu cá nhân trực tiếp.
   - Cập nhật Navbar (`frontend/src/components/landing/Navbar.tsx`): Gỡ bỏ liên kết "Bảng điều khiển Trường học" (`/school`) và icon `Building2`.
   - Cập nhật Auth & Home (`RegisterModal.tsx`, `home/page.tsx`): Gỡ bỏ redirect `role === 'teacher'`, gỡ bỏ modal ép đổi mật khẩu của nhà trường cấp.
   - Xóa dead service: `frontend/src/services/course.service.ts`.

### Bảng/API/Component đã đụng tới:
- Migrations mới:
  - `backend/migrations/1790100000000_soft_remove_school_tables.js` (Soft-remove rename sang `_deprecated_*`)
  - `backend/migrations/1790200000000_drop_deprecated_school_tables.js` (Hard-delete DROP tables & types)
- Backend Files đã sửa:
  - `backend/src/app.ts`
  - `backend/src/routes/ai.routes.ts`
  - `backend/src/controllers/ai.controller.ts`
  - `backend/src/routes/auth.routes.ts`
  - `backend/src/controllers/auth.controller.ts`
  - `backend/src/services/auth.service.ts`
- Backend Files đã xóa (19 files):
  - `src/routes/school.routes.ts`
  - `src/routes/attempt.routes.ts`
  - `src/controllers/school.controller.ts`
  - `src/controllers/attempt.controller.ts`
  - `src/controllers/academic.controller.ts`
  - `src/services/academic.service.ts`
  - `src/services/assignment.service.ts`
  - `src/services/assignment-attempt.service.ts`
  - `src/services/organization.service.ts`
  - `src/services/bulk-import.service.ts`
  - `src/repositories/academic.repository.ts`
  - `src/repositories/assignment.repository.ts`
  - `src/repositories/assignment-attempt.repository.ts`
  - `src/repositories/class.repository.ts`
  - `src/repositories/class-member.repository.ts`
  - `src/repositories/major.repository.ts`
  - `src/repositories/organization.repository.ts`
  - `src/repositories/organization-member.repository.ts`
  - `src/middlewares/orgRole.middleware.ts`
- Frontend Files đã sửa:
  - `frontend/src/app/flashcards/page.tsx`
  - `frontend/src/app/library/page.tsx`
  - `frontend/src/app/home/page.tsx`
  - `frontend/src/components/landing/Navbar.tsx`
  - `frontend/src/components/auth/RegisterModal.tsx`
- Frontend Files & Dirs đã xóa:
  - `frontend/src/components/flashcards/AIFlashcardLab.tsx`
  - `frontend/src/components/teacher/TeacherStudioSection.tsx`
  - `frontend/src/services/course.service.ts`
  - `frontend/src/app/school/`
  - `frontend/src/app/teacher/`
  - `frontend/src/app/student/`
  - `frontend/src/app/testhome/`

### Việc còn lại / rủi ro chuyển sang phase sau (PHASE 3):
- Hệ thống đã hoàn toàn sạch bóng School/LMS và AI Flashcard Generator, đạt 100% tiêu chí Personal Learning Platform.
- Chuẩn bị bước vào **PHASE 3 — AUTH + USER CORE**:
  - Chuẩn hóa toàn diện 2 role (`user`, `admin`).
  - Kiểm tra và hoàn thiện trọn vẹn luồng Auth: Register, Login, Logout, Session, Refresh, Forgot Password, Reset Password, 401 Unauthorized, 403 Forbidden.
  - Chuẩn hóa User Profile: Avatar, Display Name, Bio, Settings, Privacy.
  - Đảm bảo tính bảo mật nghiêm ngặt cho Private Data (Documents, Notes, AI Chats, Quiz Attempts, Learning History).


