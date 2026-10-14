---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - 'docs/phase0-survey.md'
  - 'docs/architecture.md'
workflowType: 'architecture'
project_name: 'Cognito'
user_name: 'Tu'
date: '2026-10-13'
status: 'complete'
version: '1.2.0'
---

# TÀI LIỆU KIẾN TRÚC HỆ THỐNG: COGNITO (EDUSHARE AI)

> **Kiến Trúc Giải Pháp Kỹ Thuật (Architecture Solution Design) - Phiên bản 1.2.0**  
> **Căn cứ pháp lý & kỹ thuật:** [PRD v1.2.1](file:///d:/Ky_7/EXE101/Cognito/_bmad-output/planning-artifacts/prd.md), [UX Design Specification](file:///d:/Ky_7/EXE101/Cognito/_bmad-output/planning-artifacts/ux-design-specification.md), [Project Context](file:///d:/Ky_7/EXE101/Cognito/_bmad-output/project-context.md) và [Khảo sát Hiện trạng Phase 0](file:///d:/Ky_7/EXE101/Cognito/docs/phase0-survey.md).  
> **Chủ nhiệm kiến trúc:** Winston (Architect) & Tu (Chủ dự án).

---

## 1. Tóm Tắt Tổng Quan & Bối Cảnh Dự Án (Executive Summary)

Dự án Cognito (EduShare AI) là nền tảng học tập thông minh brownfield đang vận hành trên kiến trúc Client–Server:
- **Frontend:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Framer Motion (chạy cổng 3000).
- **Backend:** Node.js Express với TypeScript, mô hình Controller – Service – Repository (chạy cổng 5000).
- **Cơ sở dữ liệu:** PostgreSQL 15 chạy container Docker `myproject-postgres` (cổng 5432), kết nối bằng thư viện `pg` thuần (không ORM), quản lý migration bằng `node-pg-migrate`.
- **Dịch vụ tích hợp:** Cloudinary (lưu file), Google Gemini AI (`gemini-2.5-flash`), PayOS (thanh toán).

**Phạm vi kiến trúc được duyệt:**
1. Toàn bộ các hạng mục *"Tách thêm, chờ duyệt"* trong PRD v1.2.0 (Token UI, Component UI, Notes, Mindmap, Quiz/AI Test, Pomodoro, Progress, Search, Profile, Settings, Auth, Flashcards, Admin) đã được **Chủ dự án CHÍNH THỨC DUYỆT** (với nguyên tắc: chỉ áp dụng design token và chuẩn hóa layout lên trang có sẵn).
2. **Gói Premium & PayOS:** Nằm ngoài phạm vi MVP; giữ nguyên 100% logic backend PayOS, chỉ áp dụng design token UI cho trang `/premium`.
3. **Nguyên tắc công nghệ bất biến:** Giữ nguyên tech stack hiện tại; **tuyệt đối KHÔNG cài đặt thêm bất kỳ thư viện mới nào** (kể cả `DOMPurify` hay `sanitize-html`), tận dụng triệt để những gì đang có trong `package.json`.

---

## 2. Các Ràng Buộc & Nguyên Tắc Kiến Trúc Cốt Lõi (Architecture Principles)

1. **Nguyên tắc Token Hóa Duy Nhất (Single Token Source):** Mọi kiểu dáng giao diện phải bắt nguồn từ `frontend/src/styles/design-tokens.css` và ánh xạ qua `tailwind.config.js`. Nghiêm cấm hardcode mã màu hex hoặc class tailwind ad-hoc. Cấm tuyệt đối 4 mã màu xanh cũ (`#1a3d28` ngoài tokens, `#1a2e1c`, `#0D2B24`, `#1a3a2a`, `#143828`).
2. **Nguyên tắc Bảo Vệ Dữ Liệu An Toàn Tuyệt Đối (Data Safety Gate):** Mọi thao tác schema DB phải có migration `up` và `down` đối xứng. Thao tác dọn dữ liệu thử nghiệm bắt buộc tuân thủ 4 bước: sao lưu `pg_dump` qua cờ `-i`, kiểm tra tính toàn vẹn `pg_restore --list`, `dry-run` sinh danh sách ID cụ thể (ABORT với ID 1, 3, 5, 5035; Cảnh báo vàng cách ly với ID 2, 7, 8, 21, 22), duyệt thủ công trước khi xóa trong Transaction. Lúc xóa thật CHỈ xóa đúng danh sách ID đã duyệt, không dùng `LIKE`.
3. **Nguyên tắc Phân Quyền Bảo Vệ Riêng Tư Tại Tầng Dịch Vụ (Service-Level Authorization):** Mọi kiểm tra quyền riêng tư (chỉ bạn bè mới được nhắn tin, chặn người lạ, chỉ chủ sở hữu mới được sửa xóa) bắt buộc phải được thực thi tại tầng **Service**, không chỉ dựa vào middleware tại Route.
4. **Nguyên tắc Không Khung Trắng (No-Blank-Screen Resilience):** Trình đọc tài liệu phải hỗ trợ đa định dạng (PDF, Ảnh, Word, Markdown, Plain text) và luôn có `ErrorState` thoát hiểm rõ ràng khi tệp lỗi, triệt tiêu hoàn toàn màn hình trắng.

---

## 3. Quyết Định Kiến Trúc Chi Tiết (9 Trọng Tâm)

---

### QUYẾT ĐỊNH 1: THIẾT KẾ CƠ SỞ DỮ LIỆU & CHIẾN LƯỢC MIGRATION CÓ ROLLBACK

#### 1.1. Bảng Quan Hệ Bạn Bè (`friendships`)
* **Hiện trạng kiểm tra DB:** Bảng `friendships` **ĐÃ TỒN TẠI** trong cơ sở dữ liệu (từ migration `1781669900000`) với các cột `id`, `user_id`, `friend_id`, `status` (default 'pending'/'accepted'), `created_at`, và unique constraint có hướng `unique_user_friend UNIQUE (user_id, friend_id)`.
* **Quy trình Migration Nâng Cấp:**
  1. **Bước 1 - Phát hiện và gộp/xóa cặp trùng lặp (Deduplication Gate):**
     Trước khi tạo unique index vô hướng, migration bắt buộc phải thực thi câu lệnh làm sạch các cặp trùng lặp (ví dụ nếu có đồng thời A→B và B→A):
     ```sql
     DELETE FROM friendships f1
     USING friendships f2
     WHERE f1.id > f2.id
       AND LEAST(f1.user_id, f1.friend_id) = LEAST(f2.user_id, f2.friend_id)
       AND GREATEST(f1.user_id, f1.friend_id) = GREATEST(f2.user_id, f2.friend_id);
     ```
  2. **Bước 2 - Giữ nguyên tên cột & Chuẩn hóa ràng buộc trạng thái (Phương án 1):**
     - **GIỮ NGUYÊN tên cột `user_id` và `friend_id`** trong bảng `friendships` (Quy ước: `user_id` là người gửi yêu cầu/requester, `friend_id` là người nhận/addressee), đảm bảo tương thích 100% với mã nguồn hiện hữu (`profile.repository.ts`, v.v.).
     - Bổ sung cột (nếu chưa có): `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
     - Ràng buộc trạng thái: **BỎ hoàn toàn `'blocked'` khỏi bảng `friendships`**. Ràng buộc kiểm tra chỉ gồm 2 trạng thái:
       ```sql
       ALTER TABLE friendships ADD CONSTRAINT chk_friendships_status CHECK (status IN ('pending', 'accepted'));
       ```
  3. **Bước 3 - Thay thế Unique Constraint bằng Unique Index Vô Hướng:**
     ```sql
     ALTER TABLE friendships DROP CONSTRAINT IF EXISTS unique_user_friend;
     CREATE UNIQUE INDEX idx_friendships_unique_pair 
     ON friendships (LEAST(user_id, friend_id), GREATEST(user_id, friend_id));
     ```
  4. **Bước 4 - Tạo chỉ mục tìm kiếm:**
     ```sql
     CREATE INDEX idx_friendships_friend_status ON friendships (friend_id, status);
     CREATE INDEX idx_friendships_user_status ON friendships (user_id, status);
     ```
* **Quy tắc Chặn Người Dùng (Blocking Workflow):**
  - Khi Người A chặn Người B:
    1. Chèn bản ghi có hướng vào bảng riêng `user_blocks(blocker_id = A, blocked_id = B)`.
    2. **Tự động XÓA bản ghi quan hệ trong `friendships`** nếu đang tồn tại giữa A và B (bất kể `status` là 'accepted' hay 'pending').
    3. Hủy bỏ mọi lời mời kết bạn đang chờ (`pending`) giữa A và B.
    4. Trong `sendMessage`, Service bắt buộc kiểm tra `user_blocks` trước: Nếu A bị B chặn hoặc B bị A chặn → Ném **HTTP 403 Forbidden**. Sau đó mới kiểm tra `friendships` accepted.

#### 1.2. Bảng Tin Nhắn Trò Chuyện (`messages`)
* **Hiện trạng kiểm tra DB:** Bảng `messages` đã có sẵn trong DB với các cột: `id`, `conversation_id`, `sender_id`, `content`, `is_read` (boolean default false), `created_at`, `message_type`. Chưa có cột `receiver_id` và `read_at`.
* **Quy trình Migration Nâng Cấp:**
  1. **Bước 1 - ALTER TABLE thêm cột:**
     ```sql
     ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
     ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
     ```
  2. **Bước 2 - Backfill `receiver_id` cho tin nhắn cũ từ thành viên hội thoại:**
     ```sql
     -- Backfill từ conversation_members
     UPDATE messages m
     SET receiver_id = cm.user_id
     FROM conversation_members cm
     WHERE cm.conversation_id = m.conversation_id 
       AND cm.user_id != m.sender_id
       AND m.receiver_id IS NULL;

     -- Fallback từ conversations (user1_id / user2_id) nếu conversation_members rỗng
     UPDATE messages m
     SET receiver_id = CASE 
       WHEN c.user1_id = m.sender_id THEN c.user2_id 
       ELSE c.user1_id 
     END
     FROM conversations c
     WHERE c.id = m.conversation_id 
       AND m.receiver_id IS NULL;
     ```
  3. **Bước 3 - Chuẩn hóa cột trạng thái đã đọc (Single Source of Truth):**
     - **QUYẾT ĐỊNH:** Chọn **`read_at TIMESTAMPTZ`** làm nguồn chân lý duy nhất cho trạng thái đã đọc (`read_at IS NOT NULL` nghĩa là đã đọc, kèm thời gian đọc chính xác).
     - **Cơ chế đồng bộ ngược với `is_read`:** Để không làm gãy các câu query cũ trong frontend/backend đang đọc `is_read`, duy trì cột `is_read` và luôn đồng bộ:
       - Khi đánh dấu đã đọc: `UPDATE messages SET read_at = NOW(), is_read = true WHERE ...`
       - Dữ liệu cũ: Backfill `UPDATE messages SET read_at = created_at WHERE is_read = true AND read_at IS NULL`.
  4. **Bước 4 - Tạo chỉ mục tối ưu:**
     ```sql
     CREATE INDEX IF NOT EXISTS idx_messages_pair_created ON messages (sender_id, receiver_id, created_at DESC);
     CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at DESC);
     ```

#### 1.3. Bảng Tài Liệu Học Tập (`documents`)
* **Hiện trạng kiểm tra DB thực tế:**
  - Cột `visibility` **ĐÃ TỒN TẠI** kiểu `character varying(50)`, default `'private'`, có check constraint `chk_documents_visibility CHECK (visibility IN ('private', 'public'))`.
  - Phân bổ dữ liệu hiện tại: **13 bản ghi `public`** (12 bản ghi có `is_community_published = true`, 1 bản ghi có `is_community_published = false`) và **15 bản ghi `private`**.
  - Đã có các cột: `doc_url`, `solution_text`, `cloudinary_public_id`, `license`, `original_author`, `source_url`.
* **Quy trình Migration Nâng Cấp:**
  1. Thêm cột xác nhận bản quyền, thời gian nhập và thời gian admin duyệt:
     ```sql
     ALTER TABLE documents
       ADD COLUMN IF NOT EXISTS copyright_confirmed BOOLEAN NOT NULL DEFAULT false,
       ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ,
       ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMPTZ;
     ```
  2. **Quy tắc xử lý dữ liệu cũ:**
     - **Dữ liệu cũ nhận `copyright_confirmed = false` (tuyệt đối KHÔNG đặt true)**:
       ```sql
       UPDATE documents SET copyright_confirmed = false WHERE copyright_confirmed IS NULL;
       ```
     - **Quy tắc hiển thị Tab "Tài liệu cộng đồng" (`/community`):**
       Truy vấn public tài liệu cộng đồng bắt buộc lọc theo điều kiện:
       ```sql
       WHERE visibility = 'public' 
         AND is_community_published = true 
         AND (copyright_confirmed = true OR admin_approved_at IS NOT NULL)
       ```
       Do đó, **13 tài liệu cũ đang có `visibility = 'public'` nhưng chưa xác nhận (`copyright_confirmed = false` và `admin_approved_at IS NULL`) sẽ tự động bị ẨN khỏi tab Tài liệu cộng đồng** cho đến khi tác giả vào xác nhận cam kết bản quyền hoặc Quản trị viên (Admin) duyệt (`admin_approved_at IS NOT NULL`).

#### 1.4. Bảng Báo Cáo Vi Phạm Nội Dung (`content_reports`)
* **Hiện trạng:** Đã có trong DB từ migration `1791000000000`.
* **Nâng cấp `target_type` đối xứng UP / DOWN:**
  - **Mã UP (Migration Up):**
    ```sql
    ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS chk_content_reports_target_type;
    ALTER TABLE content_reports ADD CONSTRAINT chk_content_reports_target_type 
      CHECK (target_type IN ('resource', 'comment', 'user', 'message', 'deck', 'document'));
    ```
  - **Mã DOWN (Rollback Down):**
    ```sql
    ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS chk_content_reports_target_type;
    ALTER TABLE content_reports ADD CONSTRAINT chk_content_reports_target_type 
      CHECK (target_type IN ('resource', 'comment', 'user'));
    ```

#### 1.5. Bảng Bộ Thẻ Ghi Nhớ (`flashcard_decks`)
* **Hiện trạng:** Đã có bảng `flashcard_decks` nhưng chưa có trường tham chiếu nguồn và tác giả gốc khi sao chép.
* **Nâng cấp đối xứng UP / DOWN:**
  - **Mã UP (Migration Up):**
    ```sql
    ALTER TABLE flashcard_decks 
      ADD COLUMN IF NOT EXISTS source_deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS original_author_name VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_flashcard_decks_source ON flashcard_decks(source_deck_id);
    ```
  - **Mã DOWN (Rollback Down):**
    ```sql
    DROP INDEX IF EXISTS idx_flashcard_decks_source;
    ALTER TABLE flashcard_decks 
      DROP COLUMN IF EXISTS original_author_name,
      DROP COLUMN IF EXISTS source_deck_id;
    ```

#### 1.6. Quy Trình 5 Bước Bắt Buộc Cho Mọi Migration Schema DB (Mandatory Migration Protocol)
Áp dụng nghiêm ngặt cho toàn bộ các story migration (`Story 4.3`, `Story 5.4a`, `Story 5.5a`, `Story 6.1`, `Story 6.2`):
1. **Bước 1 - Backup Bảng/Schema Vật Lý:** Chạy `pg_dump -i` lưu snapshot dữ liệu của các bảng bị tác động trước khi migrate (`docker exec -i myproject-postgres pg_dump -U tu -t <table_name> cognito > backups/pre_migration_<table_name>_YYYYMMDD.sql`).
2. **Bước 2 - Thực thi Migration UP:** Chạy lệnh `npm run migrate up` trên môi trường DB thử nghiệm (hoặc DB tạm / bản restore từ backup).
3. **Bước 3 - Kiểm Tra Tính Toàn Vẹn:** Xác minh schema cột mới, chỉ mục (indexes), khóa ngoại (foreign keys) và dữ liệu hiện hữu không bị suy hao hay biến dạng.
4. **Bước 4 - Kiểm Thử Rollback DOWN:** Thực thi ngay `npm run migrate down` trên DB tạm / restore để kiểm chứng mã rollback chạy trơn tru, không sót orphan constraints hay lỗi cú pháp SQL.
5. **Bước 5 - Chạy lại Migration UP:** Thực thi `npm run migrate up` lần thứ hai để đưa DB về trạng thái mục tiêu hoàn chỉnh, đảm bảo 100% tính lặp lại (idempotency).

---

### QUYẾT ĐỊNH 2: KIẾN TRÚC API REST & MA TRẬN PHÂN QUYỀN

#### 2.1. Danh Sách Endpoint Cốt Lõi

| Nhóm API | Phương Thức & Tuyến Đường | Mục Đích Nghiệp Vụ | Phân Quyền & Rate Limit (Đề xuất) |
| :--- | :--- | :--- | :--- |
| **Friends** | `GET /api/friends` | Lấy danh sách bạn bè (`status = 'accepted'`) | JWT Auth (Chính chủ) |
| | `DELETE /api/friends/:friendId` | Hủy kết bạn (Xóa khỏi `friendships`) | JWT Auth (Chính chủ) |
| | `GET /api/friends/requests` | Lấy danh sách lời mời kết bạn gửi đến tôi | JWT Auth (`friend_id = me`) |
| | `POST /api/friends/requests` | Gửi lời mời kết bạn mới (`friend_id`) | JWT Auth + Rate Limit *(Đề xuất: 10 req/15m)* |
| | `PUT /api/friends/requests/:id` | Phê duyệt (`accept`) hoặc từ chối (`reject`) | JWT Auth (`friend_id = me`) |
| **Messages**| `GET /api/messages/conversations` | Lấy danh sách hội thoại kèm cờ `is_friend` | JWT Auth (Thành viên) |
| | `GET /api/messages/conversations/:id/messages` | Lấy tin nhắn (nếu chưa là bạn: `read_only: true`) | JWT Auth (Thành viên) |
| | `POST /api/messages/conversations/:id/messages` | Gửi tin nhắn (**Chặn 403 nếu bị block hoặc chưa là bạn**) | JWT Auth + Service check + Rate Limit *(Đề xuất: 30 tin/phút)* |
| | `POST /api/messages/conversations/:id/read` | Cập nhật `read_at = NOW(), is_read = true` | JWT Auth (Thành viên) |
| | `GET /api/messages/unread-count` | Trả về `{ unreadCount: number }` cho badge Navbar | JWT Auth (Polling riêng 30-60s) |
| **Community**| `GET /api/community/flashcards` | Danh sách bộ thẻ public, lọc môn học, sort likes | Public / Optional Auth |
| | `POST /api/community/flashcards/:id/clone` | Sao chép bộ thẻ public (**Private trả về 403**) | JWT Auth (Người lưu) |
| | `GET /api/community/documents` | Danh sách tài liệu OER/cộng đồng public đã duyệt bản quyền | Public / Optional Auth (Ẩn doc cũ chưa confirm) |
| **Reports** | `POST /api/reports` | Báo cáo vi phạm (resource, comment, user, message, deck, doc)| JWT Auth + Rate Limit *(Đề xuất: 5 req/10m)* |
| | `GET /api/reports/my-reports` | Xem lịch sử báo cáo của chính mình | JWT Auth |

#### 2.2. Kiểm Tra Quyền Hai Lớp Tại Tầng Service (`MessageService.sendMessage`)
```typescript
// 1. Kiểm tra quan hệ chặn (User Blocks)
const isBlocked = await safetyService.hasBlockRelationship(senderId, recipientId);
if (isBlocked) {
  throw new AppError('Không thể gửi tin nhắn do giới hạn chặn giữa hai người dùng', 403);
}

// 2. Kiểm tra quan hệ bạn bè (Friendships Accepted)
const friendship = await db.query(
  `SELECT status FROM friendships 
   WHERE status = 'accepted'
     AND ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
   LIMIT 1`,
  [senderId, recipientId]
);

if (friendship.rows.length === 0) {
  throw new AppError('Hai người dùng chưa là bạn bè. Cần kết bạn để tiếp tục trò chuyện.', 403);
}
```

#### 2.3. Giới Hạn Tần Suất Gọi API (NFR-7)
* **Nguyên tắc công nghệ:** Tận dụng thư viện **`express-rate-limit` (phiên bản `^8.7.0` đã có sẵn trong `backend/package.json`)** hoặc code thuần Express middleware. **Tuyệt đối KHÔNG cài thêm thư viện mới**. Nếu phát sinh nhu cầu thư viện mới, bắt buộc phải ghi trạng thái *"chờ duyệt"* và chờ Tu phê duyệt trước khi cài.
* **Cấu hình Rate Limit phân tầng:**
  - **Auth & Password Reset (`/api/auth/*`):** 5 lần đăng nhập/reset thất bại trên mỗi IP trong cửa sổ 15 phút.
  - **AI & Sinh đề (`/api/ai/*`, `/api/test-sets/generate`):** Giới hạn tối đa 10 lượt gọi / phút / người dùng (phòng chống cạn kiệt hạn ngạch Gemini API).
  - **Nhắn tin riêng (`/api/messages/*`):** Tối đa 30 tin nhắn / phút / người dùng (chống spam chat).
  - **Báo cáo vi phạm & Lời mời kết bạn:** Tối đa 5-10 yêu cầu / 10 phút.

#### 2.4. Chính Sách Retry Backoff (NFR-8)
* **Nguyên tắc công nghệ:** Viết tiện ích `retryWithBackoff(fn, retries = 3, initialDelay = 1000)` bằng code thuần TypeScript/JavaScript (Exponential Backoff kèm Jitter ngẫu nhiên để tránh hiện tượng thundering herd). Không dùng thư viện bên ngoài.
* **Quy tắc phân định Idempotency (BẮT BUỘC TUÂN THỦ):**
  - **CHỈ ÁP DỤNG RETRY cho thao tác ĐỌC / IDEMPOTENT:** Áp dụng cho các lệnh `GET` nạp dữ liệu OER, query metadata Cloudinary, đọc tài liệu, polling tin nhắn khi gặp lỗi mạng tạm thời hoặc HTTP 503/429.
  - **TUYỆT ĐỐI KHÔNG RETRY THAO TÁC TẠO GIAO DỊCH THANH TOÁN PAYOS (`POST /api/payment/create-payment-link`):** Thao tác khởi tạo thanh toán không phải là thao tác đọc, việc tự động retry khi gặp timeout có thể dẫn đến việc tạo nhiều đơn hàng thanh toán trùng lặp (duplicate order) hoặc trừ tiền nhiều lần của người dùng. Khi API PayOS lỗi, hệ thống phải trả thông báo lỗi trực tiếp cho người dùng thử lại thủ công.

---

### QUYẾT ĐỊNH 3: KIẾN TRÚC REALTIME TIN NHẮN (SMART POLLING PHÂN TẦNG)

* **QUYẾT ĐỊNH: Chọn Short Polling (REST API) phân tầng chu kỳ.**
* **Phân tầng chu kỳ Polling thông minh:**
  1. **Chu kỳ Hội thoại Đang Mở (Active Chat Polling: 3s – 5s):**
     - Chỉ kích hoạt khi tab chat đang mở và ở trạng thái hiển thị (`document.visibilityState === 'visible'`).
     - Gọi `GET /api/messages/conversations/:id/messages?afterId=...`. Dừng ngay lập tức khi người dùng chuyển tab hoặc thoát chat.
  2. **Chu kỳ Huy hiệu Thông báo Toàn Sàn (Navbar Unread Badge Polling: 30s – 60s):**
     - Tuyến đường `GET /api/messages/unread-count` chạy theo chu kỳ dài **30 đến 60 giây**.
     - Giảm tải 90% số lượng request lên hệ thống so với việc poll dồn dập, đồng thời vẫn đảm bảo cập nhật kịp thời badge tin nhắn chưa đọc trên Navbar.
* **Lý do chọn:** 0 thư viện mới, tận dụng REST API hiện có, tối ưu băng thông và không bao giờ rò rỉ kết nối socket.

---

### QUYẾT ĐỊNH 4: KIẾN TRÚC GIAO DIỆN FRONTEND & THƯ MỤC COMPONENT DUY NHẤT

#### 4.1. Chốt Thư Mục Component Dùng Chung Duy Nhất
* **QUYẾT ĐỊNH: Chốt duy nhất thư mục `frontend/src/components/common/`** (đã có sẵn `CardErrorBoundary.tsx`).
* **Lý do chọn:** Thư mục `frontend/src/components/common/` đã tồn tại sẵn trong cấu trúc dự án. Việc giữ nguyên thư mục này giúp tránh tạo thêm thư mục song song `components/ui` gây phân mảnh và nhầm lẫn đường dẫn import.
* Toàn bộ 14 Core Components (`Button`, `Badge`, `Card`, `Tabs`, `Input`, `Select`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Avatar`, `ProgressBar`, `PageHeader`) sẽ được đặt thống nhất tại `frontend/src/components/common/`.

#### 4.2. Hệ Thống Token & Cấm Tuyệt Đối 4 Mã Màu Xanh Cũ
* File nguồn: `frontend/src/styles/design-tokens.css` với `--color-primary: #1a3d28` (Light) và `--color-primary: #2D6A4F` (Warm Dark `#161916`).
* **Quy tắc Kiểm tra Tĩnh (Grep Ban):**
  - Cấm hoàn toàn sự xuất hiện của 4 mã màu xanh cũ ở bất kỳ đâu trong `frontend/src`:
    - `#1a2e1c` (xanh flashcard cũ) → BỊ CẤM.
    - `#0D2B24` (xanh notes/viewer cũ) → BỊ CẤM.
    - `#1a3a2a` (xanh community cũ) → BỊ CẤM.
    - `#143828` (màu xanh đề xuất cũ) → BỊ CẤM.
  - Mã màu `#1a3d28` **chỉ được phép xuất hiện duy nhất 1 lần** bên trong file `frontend/src/styles/design-tokens.css`. Mọi file `.tsx` và `.css` khác bắt buộc phải dùng biến `var(--color-primary)` hoặc class Tailwind `bg-primary`.

#### 4.3. Quản Lý Bố Cục `AppLayoutWrapper` & Chiều Cao `WorkspaceLayout`
* `AppLayoutWrapper` render `<Navbar />` tập trung ở đỉnh trang (chiều cao cố định `3.5rem` = 56px, `h-14`).
* **Công thức tính chiều cao WorkspaceLayout:**
  - `h-[calc(100vh-3.5rem)]` (hoặc `h-[calc(100vh-var(--navbar-height,3.5rem))]`), `overflow-hidden`.
  - Áp dụng cho: `/viewer/*`, `/focus`, `/notes`, `/mindmap`, `/messages`, `/admin/*`. **Tuyệt đối KHÔNG có Footer**.
* **AppLayout:** Có Footer ở chân trang.
* **Chiến lược gỡ Navbar cục bộ:** Thí điểm trên `/notes` và `/community` trước, sau đó lan tỏa theo từng Phase.

---

### QUYẾT ĐỊNH 5: STRATEGY RENDER TRÌNH XEM TÀI LIỆU (VIEWER) & BẢO MẬT NỘI DUNG

#### 5.1. Strategy Pattern Cho `DocumentViewerWrapper`
1. `isImage` → Render `<img>` có công cụ zoom/pan.
2. `isPdf` → Render PDF viewer iframe nhúng.
3. `isDocx` → Render qua `DocxPreviewRenderer` (dùng `docx-preview` / `mammoth` có sẵn).
4. `isMarkdown` HOẶC `url == null && content != null` → **Render inline Markdown bằng `react-markdown` + `remark-gfm` có sẵn**. Giải quyết triệt để lỗi "Không có đường dẫn tài liệu" cho các giáo trình OER và tài liệu sinh tự động.
5. `isText` → Render text trong thẻ `<pre>`.
6. **ErrorState Thoát Hiểm:** Khi file lỗi tải hoặc rỗng cả URL và Content, render `<ErrorState title="Không thể hiển thị tài liệu" message="..." onRetry={...} onReport={...} onBack={() => router.push('/library')} />`. **Tuyệt đối không còn khung trắng (blank screen)**.

#### 5.2. Chính Sách Khử Khuẩn XSS & Content Security Policy (NFR-6)
- **Cấu hình Content Security Policy (CSP):**
  - **Chế độ khởi động:** Bắt đầu bằng **`Content-Security-Policy-Report-Only`** để giám sát và ghi nhận vi phạm qua header báo cáo mà không chặn thực thi giao diện.
  - **Quy tắc chuyển đổi:** Chỉ chuyển sang chế độ chặn thực thi (`Content-Security-Policy` blocking mode) **sau khi Chủ dự án (Tu) trực tiếp xem xét và phê duyệt**.
  - **Danh mục nguồn tin cậy (Whitelisted Sources):**
    - **Next.js & React:** `'self'`, `'unsafe-inline'`, `'unsafe-eval'` (phục vụ hydrat hóa và dev tooling).
    - **Framer Motion:** style-src `'self'`, `'unsafe-inline'`.
    - **Mermaid.js:** worker-src `'self'` `blob:`, script-src `'self'`, style-src `'self'` `'unsafe-inline'`.
    - **Cloudinary:** img-src `'self'` `data:` `blob:` `https://res.cloudinary.com`, media-src `https://res.cloudinary.com`, connect-src `https://api.cloudinary.com`.
    - **Google OAuth:** script-src `https://accounts.google.com` `https://apis.google.com`, frame-src `https://accounts.google.com`, connect-src `https://accounts.google.com`, img-src `https://lh3.googleusercontent.com` `https://*.googleusercontent.com`.
    - **Fonts:** font-src `'self'` `https://fonts.gstatic.com` `data:`, style-src `https://fonts.googleapis.com`.
    - **PayOS:** frame-src `https://pay.payos.vn`, connect-src `https://api.payos.vn`.
- **Markdown:** Dùng `react-markdown` nhưng **tuyệt đối KHÔNG bật plugin `rehype-raw`** (triệt tiêu nguy cơ parse mã HTML độc hại).
- **Tin nhắn (`/messages`):** Render 100% **Text thuần (Plain text)** bằng `<span>{msg.content}</span>`.

---

### QUYẾT ĐỊNH 6: QUY TRÌNH NHẬP LIỆU GIÁO TRÌNH MỞ (OER) & BẢN QUYỀN

#### 6.1. Whitelist Giấy Phép Mở & Chuẩn Hóa Khớp Giấy Phép (Story 5.3)
- **Whitelist CHỈ gồm 4 loại giấy phép:**
  `['CC0', 'CC-BY', 'CC-BY-SA', 'Public Domain']`.
- **Loại bỏ hoàn toàn khỏi Whitelist:**
  - `'MIT'`: Loại bỏ (vì MIT là giấy phép dành cho phần mềm/mã nguồn, không phải giấy phép chuẩn cho tài liệu giáo trình).
  - `'OpenStax-License'`: Loại bỏ (vì OpenStax phát hành tài liệu dưới giấy phép quốc tế `CC-BY`, không có giấy phép riêng tên OpenStax-License).
- **Quy tắc So Khớp Bằng Chuẩn Hóa (License Normalization):**
  - **Không dùng so sánh chuỗi chính xác (`===`)**.
  - Xây dựng parser chuẩn hóa: phân tích chuỗi giấy phép thực tế về mã chuẩn:
    - `"Creative Commons CC-BY 4.0"` hoặc `"CC BY 4.0"` → chuẩn hóa về mã **`CC-BY`** (Hợp lệ).
    - `"CC0 1.0 Universal"` hoặc `"Public Domain Dedication"` → chuẩn hóa về **`CC0`** hoặc **`Public Domain`** (Hợp lệ).
    - `"Creative Commons CC-BY-SA 4.0"` → chuẩn hóa về **`CC-BY-SA`** (Hợp lệ).
- **Kịch bản Kiểm thử & Nghiệm thu Dữ liệu Hiện có (Story 5.3 Test Criteria):**
  - Hiện tại trong DB có đúng 12 tài liệu của user 5035 ("Thư viện mở Cognito") đều đã có sẵn `source_url` và `license`. Do đó **KHÔNG CẦN story điền nguồn thủ công**.
  - **Duyệt 11 tài liệu hợp lệ:** 11 tài liệu có giấy phép chuẩn hóa thuộc whitelist (như OpenStax `CC-BY 4.0`) được duyệt thành công và cập nhật `copyright_confirmed = true`.
  - **Từ chối & Cảnh báo tài liệu ID 10282:** Tài liệu ID 10282 có license `"Creative Commons CC-BY-NC-SA 4.0"` (từ nguồn MIT OCW) bị từ chối phê duyệt tự động do chứa điều khoản `NC` (NonCommercial), phát sinh cảnh báo vàng trong báo cáo và giữ nguyên `copyright_confirmed = false` để chờ ý kiến pháp lý.
- **Quy tắc Nguồn Mở & Rủi Ro Thương Mại (NonCommercial Conflict):**
  - **KHÔNG dùng MIT OCW làm nguồn mặc định:** Phần lớn học liệu trên MIT OpenCourseWare được phát hành dưới giấy phép `CC BY-NC-SA` (NonCommercial - Phi thương mại). Do nền tảng Cognito có mô hình hội viên trả phí Premium (`/premium`), việc phân phối học liệu gắn mác `NC` có thể dẫn đến tranh chấp pháp lý về bản quyền thương mại.
  - **Đối chiếu giấy phép theo từng tài liệu cụ thể:** Giấy phép phải được kiểm tra và ghi nhận riêng cho từng đầu sách / tài liệu nhập vào, **tuyệt đối không áp chung một giấy phép theo toàn bộ nguồn**.
  - **Ghi chú cảnh báo pháp lý:** Bắt buộc phải có **tư vấn pháp lý chuyên sâu trước khi quyết định nhập bất kỳ nguồn tài liệu nào có điều khoản NC (NonCommercial)**.

#### 6.2. Script Nhập Liệu Idempotent
- Bảng `documents` có `UNIQUE (source_url)`.
- Script nạp dữ liệu sử dụng câu lệnh `INSERT ... ON CONFLICT (source_url) DO UPDATE`, chạy n lần vẫn chỉ tạo đúng 1 bản ghi duy nhất, lưu đủ `source_url`, `license`, `author`, `imported_at`.

---

### QUYẾT ĐỊNH 7: QUY TRÌNH DỌN DẸP DỮ LIỆU THỬ NGHIỆM AN TOÀN (FR-4)

Tuân thủ nghiêm ngặt 4 bước an toàn:
1. **Bước 1 - Backup vật lý (`pg_dump`):**
   - Lệnh: `docker exec -i myproject-postgres pg_dump -U tu cognito > backups/pre_cleanup_backup_YYYYMMDD.sql` (cờ `-i`, không `-t`).
   - Kiểm tra tính hợp lệ bằng `pg_restore --list` hoặc restore thử nghiệm trên DB tạm. Đảm bảo `backups/` nằm trong `.gitignore`.
2. **Bước 2 - Dry-Run sinh danh sách ID cụ thể & Cloudinary Public IDs:**
   - Script SQL kiểm kê xuất ra danh sách mảng ID cụ thể:
     `deleted_user_ids = [101, 102, ...]` (155 IDs),
     `deleted_deck_ids = [531, 532, ...]`,
     `deleted_doc_ids = [...]`,
     `deleted_test_set_ids = [...]`.
   - **Fail-Safe ABORT:** Nếu phát hiện bất kỳ bản ghi cần xóa nào có `owner_id IN (1, 3, 5, 5035)`, script dừng khẩn cấp ngay lập tức và báo lỗi đỏ.
   - **Cảnh báo vàng & Tách riêng:** Nếu có `owner_id IN (2, 7, 8, 21, 22)`, gắn cờ cảnh báo vàng, tự động bóc tách riêng ra khỏi danh sách xóa để Chủ dự án duyệt từng ID.
   - **Xuất danh sách Cloudinary Public IDs:** Dry-run xuất thêm file `backups/deleted_cloudinary_public_ids_YYYYMMDD.json` chứa các `cloudinary_public_id` của tài liệu bị xóa để tiến hành dọn dẹp riêng trên Cloudinary sau khi Chủ dự án duyệt.
3. **Bước 3 - Phê duyệt thủ công:** Trình báo cáo dry-run cho Tu, chỉ chạy xóa khi có xác nhận văn bản.
4. **Bước 4 - Xóa an toàn trong Transaction:**
   - **CHỈ XÓA ĐÚNG DANH SÁCH ID ĐÃ DUYỆT (`WHERE id IN (...)`)**, **TUYỆT ĐỐI KHÔNG XÓA THEO PATTERN `LIKE` LÚC CHẠY THẬT**.
   - Bọc trong `BEGIN ... COMMIT`, xóa theo thứ tự khóa ngoại từ bảng con sâu nhất (`attempt_answers`) đến bảng cha, cuối cùng xóa đúng 155 ID test rác khỏi `users`.

---

### QUYẾT ĐỊNH 8: CƠ CHẾ SAO CHÉP BỘ THẺ CỘNG ĐỒNG: BẢN SAO ĐỘC LẬP & PHÂN QUYỀN

- **QUYẾT ĐỊNH: Chọn Bản sao độc lập (Deep Copy / Clone).**
- **Quy tắc Phân quyền Clone:**
  - **CHỈ cho phép clone các bộ thẻ công khai (`is_public = true`) và chưa bị gỡ/ẩn (`is_hidden = false` và `deleted_at IS NULL`).**
  - Nếu người dùng cố tình gọi API clone một bộ thẻ riêng tư (`is_public = false`) của người khác, Service lập tức **ném lỗi HTTP 403 Forbidden**.
- **Xử lý Khóa ngoại & Ghi công Tác giả:**
  - Bảng `flashcard_decks` lưu trường:
    ```sql
    source_deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE SET NULL,
    original_author_name VARCHAR(255)
    ```
  - Khi bộ thẻ gốc bị tác giả xóa: `source_deck_id` chuyển thành `NULL` an toàn (`ON DELETE SET NULL`), nhưng chuỗi ghi công `original_author_name` vẫn được lưu giữ vĩnh viễn trên bản sao.
- **Xử lý lịch ôn SM-2 của người sao chép:**
  - Khởi tạo trắng toàn bộ thông số học tập: `ease_factor = 2.5`, `interval_days = 0`, `repetitions = 0`, `next_review_at = CURRENT_TIMESTAMP` (sẵn sàng ôn tập ngay mà không bị ảnh hưởng bởi tiến độ của tác giả gốc).
- **Phương án đã loại:** Dùng con trỏ tham chiếu (bị loại vì gây xung đột lịch học SM-2 giữa nhiều người và mất dữ liệu khi tác giả xóa bộ thẻ gốc).

---

### QUYẾT ĐỊNH 9: CHIẾN LƯỢC KIỂM THỬ TỰ ĐỘNG & ĐO BASELINE TRƯỚC NGHIỆM THU

1. **Kiểm Thử Phân Quyền Chat & Bảo Vệ Bạn Bè (Authorization Tests):**
   - *Test Case 1 (Chặn người lạ):* Người lạ gửi tin nhắn → Trả về đúng **HTTP 403 Forbidden**.
   - *Test Case 2 (Người bị chặn):* Người dùng nằm trong `user_blocks` cố gửi tin nhắn → Trả về đúng **HTTP 403 Forbidden**.
   - *Test Case 3 (Bạn bè hợp lệ):* Bạn bè `accepted` gửi tin nhắn → Trả về **HTTP 201 Created**.
   - *Test Case 4 (Hội thoại cũ chế độ chỉ đọc):* Xem tin nhắn cũ giữa người chưa là bạn → Trả về **HTTP 200 OK** kèm cờ `read_only: true`.
2. **Kiểm Thử Phân Quyền Clone Bộ Thẻ:**
   - Gọi clone bộ thẻ `is_public = false` của người khác → Trả về đúng **HTTP 403 Forbidden**.
   - Gọi clone bộ thẻ `is_public = true` → Trả về **HTTP 201 Created**, khởi tạo đúng SM-2 mặc định.
3. **Kiểm Thử Chuyển Hướng Vĩnh Viễn HTTP 308:**
   - Request tới `/study-sessions?filter=week` trả về đúng mã trạng thái **HTTP 308** chuyển hướng sang `/progress?tab=history&filter=week`, bảo toàn 100% query parameters.
4. **Kiểm Tra Tĩnh (Static Code Grep):**
   - Quét regex codebase đảm bảo: 0 class `dark:text-emerald-*`, 0 class `dark:bg-emerald-*`.
   - Cấm hoàn toàn 4 mã màu xanh cũ: `grep -rE "(#1a2e1c|#0D2B24|#1a3a2a|#143828)" frontend/src` → 0 kết quả.
   - `#1a3d28` chỉ xuất hiện đúng 1 lần duy nhất trong `frontend/src/styles/design-tokens.css`.
5. **Kiểm Thử Migration Hai Chiều (Up/Down) & Quy Trình 5 Bước:**
   - Tuân thủ quy trình 5 bước bắt buộc tại Mục 1.6: Backup bằng `pg_dump -i`, thực thi `up`, kiểm tra schema & dữ liệu, thực thi `down` trên DB tạm / bản restore từ backup để xác nhận rollback sạch sẽ không sót ràng buộc orphan, sau đó thực thi `up` lại đảm bảo tính lặp lại.
6. **Đo đạc Baseline trước khi tối ưu (Epic Nghiệm Thu):**
   - Thiết lập `docs/baseline-metrics.md`, đo và ghi nhận FCP, CLS, latency API auth, và tỷ lệ lỗi mạng hiện tại để làm mốc đối chiếu trước khi nghiệm thu NFR.

---

## 4. Ma Trận Truy Vết: Yêu Cầu PRD → Quyết Định Kiến Trúc (Architecture Traceability)

| Yêu Cầu PRD (v1.2.1) | Miền Nghiệp Vụ | Quyết Định Kiến Trúc Ánh Xạ | Phương Pháp Thực Thi & File Liên Quan |
| :--- | :--- | :--- | :--- |
| **FR-1** | Design Token & Warm Dark | **Quyết định 4** | `design-tokens.css`, cấm 4 màu xanh cũ |
| **FR-2** | 14 Core UI Components | **Quyết định 4** | `frontend/src/components/common/*` duy nhất |
| **FR-3 (Gốc FR1 & FR11)** | Layout & Điều hướng | **Quyết định 4** | `AppLayoutWrapper`, Workspace `h-[calc(100vh-3.5rem)]`, Dropdown "Góc học tập" |
| **FR-4 (Gốc FR4)** | Dọn dẹp dữ liệu an toàn | **Quyết định 7** | Dry-run sinh ID cụ thể, xuất Cloudinary public_ids, container `myproject-postgres`, user `tu` |
| **FR-5 (Gốc FR10)** | Landing Page | **Quyết định 4** | Playfair Display, showcase dữ liệu thật, AppLayout |
| **FR-6 (Gốc FR5)** | Cộng đồng học thuật | **Quyết định 1, 2** | 2 Tab, ẩn doc cũ chưa confirm/chưa duyệt, `content_reports` |
| **FR-7 (Gốc FR2 & FR3)** | Trình đọc tài liệu Viewer | **Quyết định 5** | Strategy pattern, inline Markdown không rehype-raw, ErrorState, `/viewer/[id]`, `/shared/[token]` |
| **FR-8, FR-9** | Ghi chú & Sơ đồ tư duy | **Quyết định 4, 5** | WorkspaceLayout không Footer, an toàn XSS |
| **FR-10 (Gốc FR3)** | Kho tài liệu cá nhân | **Quyết định 1** | AppLayout, siêu dữ liệu OER, visibility có sẵn |
| **FR-11, FR-12, FR-13** | Quiz, Focus, Progress | **Quyết định 4, 9** | Tách `/quiz` và `/quiz/[testSetId]`; HTTP 308 redirect `/study-sessions` sang `/progress?tab=history` |
| **FR-14 (Gốc FR8 & FR9)** | Bạn bè & Tin nhắn riêng | **Quyết định 1, 2, 3**| `friendships` vô hướng, backfill receiver_id, Smart Polling |
| **FR-15, FR-16, FR-17** | Search, Profile, Settings | **Quyết định 4** | Theme switcher tức thì, tìm kiếm đa đối tượng |
| **FR-18** | Gói Premium & PayOS | **Quyết định 1, 4** | Ngoài phạm vi MVP; giữ nguyên backend, chỉ áp token UI |
| **FR-19** | Xác thực & Reset Password | **Quyết định 4, 9** | `/reset-password` có Footer, Rate Limiting Auth bằng thư viện có sẵn |
| **FR-20** | Flashcards SM-2 | **Quyết định 8** | Bản sao độc lập khi clone, chặn 403 nếu private, `/flashcards/new`, `/flashcards/[deckId]/edit` |
| **FR-21 (Gốc FR6 & FR7)** | Bản quyền & OER Import | **Quyết định 6** | Whitelist 4 license (loại bỏ NC), chuẩn hóa parse license (duyệt 11, từ chối/cảnh báo 10282) |
| **NFR-6** | An toàn mã nguồn & Trình duyệt | **Quyết định 5** | CSP Report-Only (chuyển chặn khi Tu duyệt), cấm rehype-raw, chat plain text |
| **NFR-7** | Giới hạn tần suất gọi API | **Quyết định 2** | `express-rate-limit` có sẵn (Auth 5 lần/15m, AI 10 req/m, chat 30 req/m) |
| **NFR-8** | Khả năng tự phục hồi & Retry | **Quyết định 2, 5** | Retry backoff chỉ áp cho thao tác đọc/idempotent; CẤM retry thanh toán PayOS |
| **NFR-1..5, NFR-9** | Hiệu năng, Phục hồi, Giám sát | **Quyết định 3, 4, 9** | Đo baseline trước (FCP, CLS, latency), Smart Polling phân tầng |

---

## 5. Hướng Dẫn Chuyển Giao Thực Thi (Implementation Guidance)

Tài liệu này là chuẩn mực kiến trúc thống nhất để triển khai tuần tự theo từng Phase:
1. **Phase 1 (Nền tảng):** Xây dựng `design-tokens.css`, ánh xạ Tailwind, bộ 14 UI components tại `components/common/`, đưa Navbar vào `AppLayoutWrapper` và thí điểm gỡ Navbar cục bộ trên `/notes` và `/community`.
2. **Phase 2 (Màn hình cốt lõi 1):** Chuẩn hóa Landing, Library, Viewer (Strategy render + ErrorState), Flashcards (Lật thẻ 3D).
3. **Phase 3 (Màn hình cốt lõi 2):** Chuẩn hóa Quiz/AI-Test, Focus, Progress (HTTP 308 redirect), Search, Profile, Settings, Messages (Phương án A + nút kết bạn 1-click), Admin.
4. **Phase 4 (An toàn dữ liệu & OER):** Chạy quy trình dọn dẹp dữ liệu 4 bước theo danh sách ID cụ thể (FR-4) và script nạp OER idempotent với whitelist 4 license (FR-21).
5. **Phase 5 (Nghiệm thu & Đo Baseline):** Thực hiện đo đạc bộ chỉ số baseline, kiểm thử phân quyền chat 403, kiểm tra tĩnh grep màu và ký biên bản nghiệm thu kỹ thuật.
