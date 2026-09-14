# Cognito — Project Documentation Index

> **Generated:** 2026-09-07 | **Scan:** Initial Deep Scan | **Tool:** BMad Document Project Workflow

---

## Project Overview

| Property | Value |
|---|---|
| **Project Name** | Cognito |
| **Type** | Multi-part Monorepo (Frontend + Backend) |
| **Primary Language** | TypeScript |
| **Architecture** | Client–Server, RESTful API |
| **Status** | Active Development |

---

## Quick Reference

### Frontend (Part: `frontend`)

| Property | Value |
|---|---|
| **Type** | Web Application |
| **Framework** | Next.js 14 (App Router) |
| **UI** | React 18 + Tailwind CSS + Framer Motion |
| **Root** | `frontend/` |
| **Dev Port** | 3000 |
| **Entry Point** | `frontend/src/app/layout.tsx` |

### Backend (Part: `backend`)

| Property | Value |
|---|---|
| **Type** | REST API |
| **Framework** | Express.js 4 + TypeScript |
| **Database** | PostgreSQL 15 (raw SQL, node-pg-migrate) |
| **Root** | `backend/` |
| **Dev Port** | 5000 |
| **Entry Point** | `backend/src/server.ts` |

---

## Getting Started

```bash
# 1. Configure environment files
cp backend/.env.example backend/.env
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > frontend/.env.local
# Edit root .env with PostgreSQL credentials

# 2. Start all services
docker-compose up -d --build

# 3. Run database migrations
docker-compose exec backend npm run migrate:up

# 4. Open the app
# → http://localhost:3000
# → Demo: hocvien@edushare.com / user123
```

---

## Generated Documentation

### Core

| Document | Description |
|---|---|
| [Project Overview](./project-overview.md) | Feature overview, tech stack summary, service ports |
| [Architecture](./architecture.md) | Frontend + backend architecture, patterns, security |
| [Source Tree Analysis](./source-tree-analysis.md) | Annotated directory tree for both parts |
| [Integration Architecture](./integration-architecture.md) | How parts communicate + external service flows |

### API & Data

| Document | Description |
|---|---|
| [API Contracts](./api-contracts.md) | All REST endpoints grouped by route module |
| [Data Models](./data-models.md) | PostgreSQL schema: 11 tables, relationships, migration history |

### Frontend

| Document | Description |
|---|---|
| [Component Inventory](./component-inventory.md) | All UI components, pages, design libraries |

### Setup & Operations

| Document | Description |
|---|---|
| [Development Guide](./development-guide.md) | Local setup, env vars, scripts, troubleshooting |
| [Deployment Guide](./deployment-guide.md) | Docker deployment, production config, Nginx, backups |

---

## Existing Documentation

| Document | Description |
|---|---|
| [README.md](../README.md) | Project setup guide (Vietnamese) |
| [docker_setup_guide.md](../docker_setup_guide.md) | Detailed Docker setup guide |
| [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) | BMad implementation plan |

---

## Project Stats

| Metric | Count |
|---|---|
| Frontend pages (routes) | 16 |
| Component groups | 7 |
| Backend route files | 11 |
| API endpoints | ~60+ |
| Database tables | 11 |
| Database migrations | 14 |
| External integrations | 6 (Cloudinary, Gemini, OpenAI, Groq, PayOS, SMTP) |
| Docker services | 4 |

---

## Key Features at a Glance

| Feature | Tech |
|---|---|
| 📄 Document Management | Cloudinary storage, multer upload, multi-format preview |
| 🃏 Flashcard Spaced Repetition | SM-2 algorithm, server-calculated next review |
| 🧠 AI Study Tools | Gemini + OpenAI + Groq for summarize/quiz/mindmap |
| 🤖 AI Test Practice | Structured AI-graded exam sessions |
| 🗺️ Mind Maps | Mermaid.js diagram generation from document content |
| 🛒 Marketplace | Public document listings |
| 👥 Community & Friends | Social graph, shared documents, public decks |
| 📊 Streak Tracking | Vietnam-timezone streak calculation, daily task system |
| 💳 Premium Subscription | PayOS payment gateway integration |
| 🔐 Auth | JWT + Google OAuth + Email 2FA |
| 🛡️ Admin Panel | User management, stats, content moderation |
