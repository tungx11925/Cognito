# 📚 Cognito

Dự án Monorepo bao gồm: **Next.js** (Frontend) + **Node.js/Express** (Backend) + **PostgreSQL** (Database).

## 🚀 Hướng Dẫn Chạy Dự Án

### 1. Cấu hình biến môi trường (.env)
Dự án sử dụng các biến môi trường để cấu hình. Bạn cần tạo các file môi trường (copy từ file `.example` tương ứng hoặc tự tạo mới) ở 3 nơi:

```bash
# 1. Thư mục gốc (Cho cấu hình Database & pgAdmin trong Docker)
cp .env.example .env
# (Nếu không có .env.example ở root, hãy tự tạo file .env với các biến POSTGRES_USER, POSTGRES_PASSWORD, PGADMIN_DEFAULT_EMAIL, PGADMIN_DEFAULT_PASSWORD...)

# 2. Thư mục Backend (Cấu hình Server, DB URL...)
cd backend
cp .env.example .env
cd ..

# 3. Thư mục Frontend (Cấu hình URL kết nối tới Backend...)
cd frontend
cp .env.example .env.local
cd ..
```

> **Lưu ý:** Hãy mở các file `.env` và `.env.local` vừa tạo để điền/chỉnh sửa các thông số thực tế cho phù hợp.

### 2. Khởi chạy toàn bộ hệ thống
```bash
docker-compose up -d --build
```
> Lệnh này sẽ tự động chạy Frontend (Port 3000), Backend (Port 5000), PostgreSQL (Port 5432) và pgAdmin (Port 5050).

### 3. Quản lý và Cập nhật Database
Dự án sử dụng **`node-pg-migrate`** (không dùng ORM Prisma) và quản lý database thông qua **pgAdmin**.
Khi bạn cần chạy các file migrate trong thư mục `backend/migrations` để cập nhật Database, hãy chạy lệnh:
```bash
docker-compose exec backend npm run migrate:up
```

*Một số lệnh migrate khác (chạy trong thư mục backend):*
- Tạo migrate mới: `npm run migrate:create tên_migrate`
- Rollback migrate: `npm run migrate:down`

---

## 🌐 Các Đường Dẫn Quan Trọng Sau Khi Chạy

- **Trang chủ Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Quản lý Database (pgAdmin):** [http://localhost:5050](http://localhost:5050)
  - Đăng nhập: Dùng email/password khai báo ở file `.env` root (vd: `admin@example.com` / `admin`).
  - Kết nối DB: Chọn Add New Server, khai báo Host name là `postgres`, Username & Password theo file `.env` root.
