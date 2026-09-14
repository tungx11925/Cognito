# Cognito — Project Overview

> **Generated:** 2026-09-07 | **Scan Level:** Quick | **Language:** English

---

## Executive Summary

**Cognito** is a full-stack educational platform designed to help students learn more effectively. It combines document management, AI-powered study tools, flashcard learning (with spaced repetition), mind maps, a social community layer, and a marketplace — all in one cohesive web application.

The platform integrates multiple AI providers (Google Gemini, OpenAI, Groq) to power intelligent features such as document summarization, quiz generation, AI-assisted test practice, and mind map creation.

---

## Key Features

| Feature | Description |
|---|---|
| 📄 Document Library | Upload, organize, and share study documents (PDF, DOCX, XLSX) |
| 🃏 Flashcards | AI-generated flashcards with SM-2 spaced repetition algorithm |
| 🧠 AI Lab | Summarization, quiz generation, mind maps via Gemini / OpenAI / Groq |
| 🤖 AI Test Practice | Structured AI-graded practice exams |
| 🗺️ Mind Maps | Auto-generate visual mind maps from document content |
| 🛒 Marketplace | Buy/sell study materials between users |
| 👥 Community | Social features: friend system, shared documents, public decks |
| 📊 Study Sessions | Track study time and daily learning streaks |
| 💳 Premium | Subscription via PayOS payment gateway |
| 🔔 Task Notifications | Daily tasks and progress tracking |
| 🛡️ Admin Panel | User management, content moderation |

---

## Technology Stack Summary

| Layer | Technology | Version |
|---|---|---|
| **Frontend Framework** | Next.js | ^14.0.0 |
| **Frontend Language** | TypeScript | ^5.0.0 |
| **UI Styling** | Tailwind CSS | ^3.3.0 |
| **Animations** | Framer Motion | ^12.40.0 |
| **Charts** | Recharts | ^3.8.1 |
| **Document Preview** | pdfjs-dist, docx-preview, mammoth | - |
| **Diagram Rendering** | Mermaid.js | ^11.17.1 |
| **Backend Framework** | Express.js | ^4.18.2 |
| **Backend Language** | TypeScript / Node.js | ^5.0.0 |
| **Database** | PostgreSQL 15 | - |
| **DB Migration Tool** | node-pg-migrate | ^6.2.2 |
| **Authentication** | JWT + Google OAuth | - |
| **File Storage** | Cloudinary | ^2.10.0 |
| **AI Providers** | Google Gemini, OpenAI, Groq | - |
| **Payment** | PayOS | - |
| **Email** | Nodemailer (SMTP) | ^8.0.10 |
| **Containerization** | Docker + Docker Compose | - |

---

## Architecture Type

- **Repository Type:** Multi-part (Monorepo layout)
- **Architecture Pattern:** Client–Server with RESTful API
- **Parts:**
  - `frontend/` — Next.js web application (React, TypeScript, Tailwind CSS)
  - `backend/` — Express.js REST API server (TypeScript, PostgreSQL)
  - **Infrastructure:** Docker Compose orchestrates all services

---

## Service Ports (Local / Docker)

| Service | Port | URL |
|---|---|---|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (Express) | 5000 | http://localhost:5000 |
| PostgreSQL | 5432 | - |
| pgAdmin (DB UI) | 5050 | http://localhost:5050 |

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Student | `hocvien@edushare.com` | `user123` |
| Admin | `admin@edushare.com` | `admin123` |

---

## Links to Detailed Documentation

- [Architecture Overview](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
- [Integration Architecture](./integration-architecture.md)
- [Component Inventory](./component-inventory.md)
