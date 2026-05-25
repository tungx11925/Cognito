---
trigger: always_on
---

# GEMINI.md - Cấu hình Agent Jarvis

Tệp này là điểm khởi đầu cấu hình cho AI Agent.
Các quy tắc, sub-agents, và skills đã được tổ chức trong `.gemini/`.

## Cấu trúc `.gemini/`

```
.gemini/
├── rules/                    ← quy tắc chi tiết
│   ├── agent-identity.md     ← danh tính Jarvis, hành vi SME
│   ├── language-protocol.md  ← giao thức ngôn ngữ (Việt/Anh)
│   ├── project-context.md    ← tổng quan dự án, stack
│   ├── coding-guidelines.md  ← quy tắc code, tính nhất quán
│   ├── skills-system.md      ← hệ thống kỹ năng, danh sách skills
│   ├── workflow.md           ← quy trình làm việc, commit, branching
│   └── design.md             ← nguyên tắc thiết kế UI/UX
│
├── agents/                   ← sub-agents chuyên dụng
│   ├── researcher.md         ← nghiên cứu công nghệ, đánh giá giải pháp
│   ├── reviewer.md           ← review code, security, performance
│   ├── frontend-architect.md ← thiết kế & xây dựng UI premium
│   └── backend-guardian.md   ← bảo vệ backend: security + performance
│
└── skills/                   ← kỹ năng tái sử dụng (28 skills chọn lọc)
    ├── dotnet-backend/       ← .NET 8 Backend
    ├── dotnet-backend-patterns/
    ├── csharp-pro/           ← Modern C#
    ├── nextjs-best-practices/← Next.js App Router
    ├── react-patterns/       ← React hooks, composition
    ├── react-component-performance/
    ├── shadcn/               ← Shadcn UI (kèm rules/, cli.md)
    ├── tailwind-patterns/    ← Tailwind CSS v4
    ├── typescript-pro/       ← TypeScript
    ├── zustand-store-ts/     ← Zustand state management
    ├── frontend-design/      ← Design thinking, aesthetics
    ├── design-spells/        ← Micro-interactions
    ├── animejs-animation/    ← Complex animations
    ├── web-performance-optimization/
    ├── postgresql/           ← PostgreSQL
    ├── database-admin/       ← Database operations
    ├── docker-expert/        ← Docker
    ├── vercel-deployment/    ← Vercel
    ├── aws-skills/           ← AWS
    ├── github/               ← GitHub CLI
    ├── github-actions-templates/
    ├── powershell-windows/   ← Windows shell
    ├── code-reviewer/        ← Code review
    ├── security-auditor/     ← Security audit
    ├── backend-security-coder/← Secure backend coding
    ├── performance-profiling/← Performance measurement
    ├── debugger/             ← Error diagnosis
    └── systematic-debugging/ ← Root cause analysis
```

---
*Được tạo bởi Antigravity IDE — Mô hình theo cấu trúc .claude/*
