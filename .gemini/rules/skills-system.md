---
trigger: always_on
description: Skills system configuration - curated skills in .gemini/skills/ organized by domain.
---

# 📚 Hệ thống Kỹ năng (Skills System)

Dự án này sử dụng bộ kỹ năng chuyên sâu đã được **chọn lọc** trong `.gemini/skills/`. Mỗi thư mục chứa file `SKILL.md` với best practices, patterns, và code examples.

## Cách sử dụng

Trước khi bắt đầu tác vụ mới, hãy:
1. Xác định domain liên quan (Backend, Frontend, Database...)
2. Đọc `SKILL.md` trong thư mục skill tương ứng tại `.gemini/skills/`
3. Tuân thủ patterns và best practices được mô tả

## Skills theo domain

### 🖥️ Backend (.NET 8 + C#)
| Skill | Mục đích |
|-------|---------|
| `dotnet-backend` | ASP.NET Core APIs, EF Core, JWT Auth, Background Services |
| `dotnet-backend-patterns` | Production-grade patterns, DI, caching, resilience |
| `csharp-pro` | Modern C# features, records, pattern matching, async |
| `backend-security-coder` | Secure coding: input validation, CSRF, CORS, API security |
| `performance-profiling` | Measure → Identify → Fix → Validate workflow |

### 🎨 Frontend (Next.js + React + TypeScript)
| Skill | Mục đích |
|-------|---------|
| `nextjs-best-practices` | App Router, Server/Client Components, caching |
| `react-patterns` | Hooks, composition, state management, TypeScript |
| `react-component-performance` | Diagnose slow components, reduce re-renders |
| `shadcn` | Component library, styling rules, CLI workflow |
| `tailwind-patterns` | CSS-first config, container queries, design tokens |
| `typescript-pro` | Advanced types, generics, strict mode |
| `zustand-store-ts` | State management với TypeScript patterns |
| `frontend-design` | Design thinking, aesthetic direction, DFII scoring |
| `design-spells` | Micro-interactions, hover magic, premium details |
| `animejs-animation` | Complex timelines, stagger, SVG animations |
| `web-performance-optimization` | Core Web Vitals, bundle size, image optimization |

### 🗃️ Database
| Skill | Mục đích |
|-------|---------|
| `postgresql` | PostgreSQL optimization, indexing, queries |
| `database-admin` | Database operations, migrations, monitoring |

### 🚀 Deployment & DevOps
| Skill | Mục đích |
|-------|---------|
| `docker-expert` | Dockerfile, compose, container best practices |
| `vercel-deployment` | Frontend deployment to Vercel |
| `aws-skills` | AWS EC2, infrastructure, cloud patterns |
| `github` | gh CLI, issues, PRs, Actions |
| `github-actions-templates` | CI/CD workflows |
| `powershell-windows` | Windows shell patterns |

### 🛡️ Quality & Security
| Skill | Mục đích |
|-------|---------|
| `code-reviewer` | AI-powered code review, quality assurance |
| `security-auditor` | Security posture, compliance, DevSecOps |
| `debugger` | Error diagnosis, test failures |
| `systematic-debugging` | Root cause analysis, 4-phase debugging process |
