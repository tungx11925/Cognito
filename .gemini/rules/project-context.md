---
trigger: always_on
description: Project overview, tech stack, architecture, and key feature contexts.
---

# 📋 Ngữ cảnh Dự án

## 1. Tổng quan dự án

Đây là một **Dự án Web App Monorepo** (Next.js + Node.js) có cấu trúc chuẩn hóa dành cho phát triển các hệ thống E-Learning, SaaS hoặc Management Dashboard.

## 2. Stack công nghệ chi tiết

- **Frontend:** Next.js (App Router), React 18/19, TypeScript, Tailwind CSS v4.
- **Backend:** Node.js, Express, TypeScript, kiến trúc MVC-like (Routes, Controllers, Services, Repositories).
- **Database / ORM:** PostgreSQL kết hợp Prisma ORM. 
- **DevOps:** Toàn bộ được Containerize qua Docker Compose (chạy cục bộ gồm Frontend, Backend, Postgres và pgAdmin).

## 3. Kiến trúc tính năng ngữ cảnh thiết yếu

- **Hệ thống xác thực (Auth):** Sử dụng JWT Token, mã hóa mật khẩu bằng bcryptjs, bảo mật Route an toàn.
- **Tương tác Database:** Toàn bộ Query database PHẢI đi qua Prisma Client trong thư mục `repositories`.
- **Yêu cầu UI/UX:** Phong cách thiết kế hiện đại (Premium, sạch, thoáng), hiệu năng cao, tập trung sử dụng Tailwind CSS tối ưu. Mọi UI Component đặt trong `frontend/src/components`.
- **Quản lý biến môi trường:** Tách bạch rõ ràng `.env.local` cho frontend và `.env` cho backend để tránh xung đột cấu hình.
