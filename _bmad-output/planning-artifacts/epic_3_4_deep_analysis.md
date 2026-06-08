# Phân Tích Nghiệp Vụ Chuyên Sâu: Epic 3 (Smart Notes) & Epic 4 (AI Workspace)

*Tài liệu này được tổng hợp thông qua phiên thảo luận "Party Mode" giữa các chuyên gia AI: Amelia (Senior Dev), Saga (Business Analyst), Winston (System Architect), và Murat (Test Architect).*

## 1. Phân Tích Nghiệp Vụ - Epic 3: Không Gian Ghi Chú (Smart Notes)

### 1.1. Story 3.1 & 3.2: Trình Soạn Thảo và Quản Lý Lưu Trữ Ghi Chú
**🔍 Saga (Business Analyst):**
- **Nghiệp vụ cốt lõi:** Người dùng cần một nơi để ghi chép song song với lúc đọc tài liệu. Mỗi ghi chú phải gắn liền với một `document_id` cụ thể để người dùng có thể tra cứu ngữ cảnh.
- **Auto-save (Lưu tự động):** Đây là tính năng sống còn. Thay vì bắt người dùng bấm "Lưu", hệ thống cần tự động lưu sau mỗi 1-2 giây ngừng gõ (debounce).
- **Validation (Ràng buộc nghiệp vụ):**
  - Không được lưu ghi chú trống (hoàn toàn không có text).
  - Phân quyền: Người dùng chỉ được sửa/xem ghi chú do chính họ tạo ra (trừ khi sau này Epic 6 mở chế độ Public).
  - Giới hạn độ dài: Cần giới hạn dung lượng text để tránh bị spam DB (ví dụ: max 50,000 ký tự mỗi ghi chú).

**🏗️ Winston (Architect):**
- **Database Schema:** Bảng `notes` đã có sẵn. Cần đảm bảo index trên `(user_id, document_id)` để truy xuất nhanh khi load Study Room.
- **API Design:**
  - `GET /api/notes/document/:docId` - Lấy danh sách ghi chú của tài liệu.
  - `POST /api/notes` - Tạo mới ghi chú.
  - `PUT /api/notes/:id` - Cập nhật nội dung.
  - `DELETE /api/notes/:id` - Xóa ghi chú.
- **Frontend Architecture:**
  - Sử dụng Markdown Editor (như `react-markdown` kết hợp với ô `textarea` hoặc `tiptap` editor).
  - State quản lý bằng `zustand` hoặc `React Query` (để quản lý auto-save mutation). Cần dùng kĩ thuật `useDebounce` để gọi API PUT/POST tự động.

### 1.2. Story 3.3: Tạo Flashcard từ Ghi Chú
**🔍 Saga (BA):**
- Nghiệp vụ: Chuyển đổi khối text (highlight) thành dạng Question/Answer (Front/Back) để đưa vào Deck.
- Validation: 
  - Khối lượng text chọn không quá dài (ví dụ max 500 ký tự cho front/back) để đảm bảo chất lượng flashcard.
  - Cần yêu cầu người dùng chọn Deck đích (hoặc tự tạo Deck mặc định "Flashcard từ Ghi chú X").

**🧪 Murat (QA/Test Architect):**
- *Cần test kĩ:* Các case khi mạng chập chờn, auto-save fail thì phải hiển thị cảnh báo UI để người dùng biết dữ liệu chưa được lưu, tránh mất bài.
- XSS Prevention: Nội dung ghi chú có dạng Markdown/Rich Text nên ở bước render (Frontend) phải dùng thư viện sanitize HTML để chống XSS.

---

## 2. Phân Tích Nghiệp Vụ - Epic 4: Trợ Lý AI (AI Workspace)

### 2.1. Story 4.1 & 4.3: Giao diện AI & Hỏi đáp xuyên tài liệu (Cross-Document RAG)
**🔍 Saga (BA):**
- **Nghiệp vụ:** Trợ lý AI không chỉ là chatbot thông thường. Nó phải có ngữ cảnh:
  - Ngữ cảnh Local: Tài liệu hiện tại đang mở (PDF trang số mấy).
  - Ngữ cảnh Global (Cross-doc): Tìm kiếm trong toàn bộ các tài liệu của user.
- **Luồng dữ liệu RAG (Retrieval-Augmented Generation):**
  - Khi user hỏi, hệ thống phải nhúng (embed) câu hỏi -> Tìm top K chunks liên quan từ Vector DB -> Đưa vào prompt cho Gemini -> Sinh câu trả lời.
- **Validation:**
  - Chỉ cho phép query trong phạm vi tài liệu của chính User đó (Data Isolation).
  - Rate limiting (giới hạn số lượng câu hỏi mỗi phút) để tiết kiệm API Cost.

**🏗️ Winston (Architect):**
- **Thách thức:** Bảng `documents` hiện tại chỉ lưu URL, không có Vector embeddings. 
  - *Giải pháp:* Chúng ta cần bổ sung xử lý file tải lên: extract text, chunking, tính toán vector embeddings, và lưu vào một Vector Database (hoặc dùng `pgvector` trong PostgreSQL).
  - Vì yêu cầu này rất lớn, để triển khai nhanh trong Sprint này, ta có thể áp dụng chiến lược RAG đơn giản: Truyền trực tiếp context từ Note/Solution (hoặc OCR trang hiện tại) lên Gemini nếu chưa setup pgvector.
- **Frontend Integration:** Dùng giao diện giống ChatGPT, bên phải màn hình. Có tính năng stream response (Server-Sent Events - SSE) để tạo cảm giác thời gian thực.

### 2.2. Story 4.2: Artifacts (Mini-Apps trực quan)
**🔍 Saga (BA):**
- **Nghiệp vụ:** AI trả về JSON thay vì text thuần khi nhận lệnh "Tạo bài tập". Ví dụ UI nhận JSON chứa danh sách câu hỏi trắc nghiệm, và tự render ra component React (giống Claude Artifacts).
- **Validation:** 
  - Cần thiết kế prompt cực kì chặt chẽ để ép Gemini luôn trả về đúng JSON Schema. Nếu Gemini trả sai format, hệ thống phải tự động fallback sang text hoặc yêu cầu gen lại.

**🏗️ Winston (Architect):**
- **Implementation Design:** 
  - Định nghĩa chuẩn JSON (ví dụ: `{"type": "quiz", "data": {...}}`). 
  - Trên Frontend, trong component ChatMessage, kiểm tra chuỗi trả về. Nếu là khối JSON có prefix tương ứng, parse và mount `<QuizWidget />`.

---

## 3. Lộ Trình Triển Khai Thực Tế (Execution Plan)

Dựa trên phân tích trên, Amelia (Dev) đề xuất chia nhỏ việc code ra làm các bước sau để đảm bảo không bị lỗi:

1. **Giai đoạn 1 (Ngay bây giờ): Xây dựng API và UI cho Notes (Epic 3.1 & 3.2)**
   - BE: Xây dựng CRUD endpoints cho `notes` table.
   - FE: Tạo Split-pane layout trong Study Room, tích hợp Markdown Editor với cơ chế Auto-save (debounce).
2. **Giai đoạn 2: Tích hợp AI cơ bản (Epic 4.1)**
   - BE: Tạo `/api/ai/chat` endpoint gọi Gemini API.
   - FE: Tạo Sidebar Chatbox, truyền text đang chọn vào prompt cho AI giải thích.
3. **Giai đoạn 3: AI Artifacts (Epic 4.2)**
   - FE: Tạo component `<QuizWidget />` và xử lý parsing AI response.
4. **Giai đoạn 4: Cross-Document RAG & Flashcards (Epic 4.3 & 3.3)**
   - Đòi hỏi cập nhật Backend để xử lý Text Extraction và Vector Search. Sẽ thực hiện sau.

*-- Hoàn tất phân tích nghiệp vụ, Amelia tiến hành triển khai Giai đoạn 1.*
