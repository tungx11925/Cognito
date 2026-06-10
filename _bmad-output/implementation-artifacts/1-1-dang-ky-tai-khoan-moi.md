# Story: 1-1-dang-ky-tai-khoan-moi

## Story
As a Người dùng chưa có tài khoản,
I want đăng ký một tài khoản mới bằng email và mật khẩu,
So that tôi có thể lưu trữ và theo dõi tiến độ học tập cá nhân.

## Acceptance Criteria
- [x] **Given** người dùng đang ở trang Đăng ký
- [x] **When** người dùng điền đầy đủ tên, email hợp lệ, mật khẩu (tối thiểu 6 ký tự) và bấm "Đăng ký"
- [x] **Then** hệ thống tạo bản ghi mới trong bảng `users` (mật khẩu được mã hóa bằng bcrypt)
- [x] **And** trả về mã 201 Created cùng thông báo đăng ký thành công
- [x] **And** Nếu email đã tồn tại, hiển thị thông báo lỗi phù hợp

## Tasks/Subtasks
- [x] Task 1: Thiết lập Backend API cho đăng ký tài khoản (tạo model User nếu chưa có, viết validation, controller xử lý đăng ký mã hóa mật khẩu, lưu vào DB).
- [x] Task 2: Cập nhật giao diện Frontend cho tính năng đăng ký (UI cho form đăng ký, gọi API backend, xử lý lỗi/thành công và hiển thị toast/chuyển hướng).

## Dev Notes
- Backend đang sử dụng Express.js và PostgreSQL (kết nối qua URL). Đã có config database trong `.env`. Cần sử dụng bcryptjs để hash mật khẩu.
- Frontend là Next.js (App router). Giao diện trang chủ (page.tsx) hiện tại có một form "Đăng nhập" trong một Modal. Có thể chuyển thành/ thêm Modal Đăng ký hoặc trang riêng tùy architecture.

## Dev Agent Record
- **Debug Log**: N/A
- **Completion Notes**: Đã thêm validation cho register API. Đã cập nhật frontend page.tsx để hỗ trợ chế độ Register ngay trên Modal.

## File List
- backend/src/controllers/auth.controller.ts
- frontend/src/services/auth.service.ts
- frontend/src/app/page.tsx

## Change Log
- Added register API validation and logic.
- Integrated register UI into existing login modal with toggle feature.

## Status
review
