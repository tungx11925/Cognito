---
trigger: always_on
description: Development workflow rules - planning, execution, commit, and PR conventions.
---

# ⚡ Quy trình Làm việc (Workflow)

## 1. Khi nào cần Plan vs Thực thi trực tiếp

| Tình huống | Hành động |
|-----------|-----------|
| Thay đổi kiến trúc, thêm tính năng lớn | Tạo plan chi tiết, xin phê duyệt |
| Fix bug đơn giản, chỉnh UI nhỏ | Thực thi trực tiếp |
| Refactor > 3 files | Tạo plan, liệt kê files ảnh hưởng |
| Thêm dependency mới | Giải thích lý do, so sánh với alternatives |

## 2. Quy tắc Commit

- **Format**: `type(scope): message` (Tiếng Anh)
  - `feat(auth): add JWT refresh token rotation`
  - `fix(courses): resolve pagination offset error`
  - `refactor(ui): migrate CourseCard to Shadcn`
- **Nguyên tắc**: Mỗi commit = 1 thay đổi logic duy nhất
- **Không commit**: Files tạm, `.env`, `node_modules/`, `bin/`, `obj/`

## 3. Quy tắc Branching

- `main` — production, luôn stable
- `develop` — integration branch
- `feature/<tên>` — tính năng mới
- `fix/<tên>` — sửa lỗi
- `refactor/<tên>` — cải tiến code

## 4. Trước khi Push

- [ ] Chạy build thành công (cả Frontend lẫn Backend)
- [ ] Không có lỗi TypeScript / C# compiler
- [ ] Format code (Prettier, dotnet format)
- [ ] Kiểm tra .env không bị commit
