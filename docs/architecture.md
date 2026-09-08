# Cognito — Architecture Documentation

> **Generated:** 2026-09-07 | **Project Type:** Multi-part Web Application

---

## 1. Executive Summary

Cognito follows a classic **Client–Server** architecture split into two independently-deployable parts:

- **Frontend** (`frontend/`): Next.js 14 App Router SPA with React 18, TypeScript, Tailwind CSS. Runs on port 3000.
- **Backend** (`backend/`): Express.js 4 REST API with TypeScript. Connects to a PostgreSQL 15 database. Runs on port 5000.

Both parts are containerized via Docker and coordinated by a root-level `docker-compose.yml`.

```
Browser ──► Next.js Frontend (3000) ──► Express.js Backend (5000) ──► PostgreSQL (5432)
                                           │
                                           ├──► Cloudinary (File Storage)
                                           ├──► Google Gemini API (AI)
                                           ├──► OpenAI API (AI)
                                           ├──► Groq API (AI)
                                           ├──► PayOS (Payments)
                                           └──► SMTP / Nodemailer (Email)
```

---

## 2. Frontend Architecture

### 2.1 Framework & Routing

- **Next.js 14** with **App Router** (`src/app/`)
- File-system based routing — each folder under `src/app/` maps to a URL segment
- `layout.tsx` provides global layout wrapper

### 2.2 Directory Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin panel (protected)
│   ├── ai-lab/             # AI tools: summarize, quiz, mindmap
│   ├── ai-test/            # AI-graded test practice
│   ├── community/          # Social: friends, shared documents
│   ├── flashcards/         # Flashcard decks and study mode
│   ├── home/               # Authenticated home dashboard
│   ├── library/            # Personal document library
│   ├── marketplace/        # Buy/sell study materials
│   ├── premium/            # Premium upgrade page
│   ├── premium-preview/    # Preview premium features
│   ├── profile/            # User profile
│   ├── settings/           # Account settings
│   ├── shared/             # Shared document viewer
│   ├── study-sessions/     # Study time tracking
│   ├── viewer/             # Document/file viewer
│   ├── layout.tsx          # Root layout (global styles, providers)
│   ├── page.tsx            # Landing page (redirects to /home)
│   └── globals.css         # Global CSS
├── components/             # Reusable UI components
│   ├── auth/               # Login, Register, Google OAuth components
│   ├── dashboard/          # Dashboard widgets
│   ├── documents/          # Document upload, card, viewer
│   ├── flashcards/         # Flashcard deck and card components
│   ├── landing/            # Landing page sections
│   ├── layout/             # Sidebar, header, navigation
│   ├── ai-test/            # AI test UI components
│   ├── Button.tsx          # Generic button
│   ├── Modal.tsx           # Generic modal
│   ├── Navbar.tsx          # Global navbar
│   └── TaskNotifications.tsx  # Daily task notification widget
├── context/                # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Shared utilities and clients
├── services/               # API client service layer
│   ├── api.ts              # Axios base client
│   ├── auth.service.ts     # Auth API calls
│   ├── document.service.ts # Document API calls
│   ├── flashcard.service.ts # Flashcard API calls
│   ├── note.service.ts     # Notes API calls
│   ├── study.service.ts    # Study session API calls
│   ├── ai.service.ts       # AI feature API calls
│   ├── ai-test.service.ts  # AI test API calls
│   ├── admin.service.ts    # Admin API calls
│   └── course.service.ts   # Course API calls
├── store/                  # State management
│   └── auth.store.ts       # Auth state store
├── styles/                 # Additional global styles
├── types/                  # TypeScript type definitions
└── utils/                  # Frontend utility functions
```

### 2.3 State Management

- Primarily **React Context API** (`src/context/`) for global state
- `auth.store.ts` for auth state
- Local component state with React hooks

### 2.4 UI Layer

- **Tailwind CSS** for utility-first styling
- **Framer Motion** for animations and transitions
- **Lucide React** for icons
- **Recharts** for analytics/chart visualizations
- **Mermaid.js** for mind map and diagram rendering
- **react-hook-form** for form management
- **react-hot-toast** / **react-toastify** for notifications

---

## 3. Backend Architecture

### 3.1 Framework & Pattern

- **Express.js 4** with TypeScript
- **Controller–Route** pattern (no ORM; raw SQL via `pg`)
- **Middleware-based** request pipeline

### 3.2 Directory Structure

```
backend/src/
├── app.ts              # Express app setup — registers all routes, CORS, middleware
├── server.ts           # HTTP server entry point (binds port)
├── config/             # Configuration loading (env vars)
├── controllers/        # Request handlers (business logic)
│   ├── auth.controller.ts      # Registration, login, OAuth, profile, 2FA, premium
│   ├── admin.controller.ts     # Admin: user management, stats
│   ├── document.controller.ts  # Document CRUD, file upload
│   ├── marketplace.controller.ts # Marketplace listings
│   ├── payment.controller.ts   # PayOS integration
│   ├── share.controller.ts     # Document sharing
│   ├── ai.controller.ts        # AI feature dispatching
│   ├── course.controller.ts    # Course features
│   └── user.controller.ts      # User profile management
├── routes/             # Express Router definitions
│   ├── app.routes.ts        # Main monolithic route file (flashcards, notes, study, mindmap, tasks, community, friends...)
│   ├── auth.routes.ts       # Authentication routes
│   ├── document.routes.ts   # Document routes
│   ├── share.routes.ts      # Share routes
│   ├── payment.routes.ts    # Payment routes
│   ├── ai.routes.ts         # AI routes
│   ├── marketplace.routes.ts # Marketplace routes
│   ├── admin.routes.ts      # Admin routes
│   ├── ai-test.routes.ts    # AI test practice routes
│   └── course.routes.ts     # Course routes
├── middlewares/        # Express middleware
│   ├── auth.middleware.ts       # JWT authentication guard
│   ├── checkResourceAccess.ts  # Resource ownership check
│   ├── error.middleware.ts     # Global error handler
│   └── rateLimiter.middleware.ts # API rate limiting
├── db/                 # Database layer
│   ├── index.ts         # pg Pool configuration and query wrapper
│   └── ai-test-schema.ts # AI test tables auto-migration on startup
└── utils/              # Backend utility services
    └── ai-engine.service.ts  # AI provider abstraction (Gemini, OpenAI, Groq)
```

### 3.3 Authentication Architecture

1. **Email/Password** — bcryptjs hashing, JWT access + refresh tokens
2. **Google OAuth** — `google-auth-library` for token verification
3. **Two-Factor Authentication (2FA)** — email-based OTP via Nodemailer
4. **JWT Middleware** — `auth.middleware.ts` validates Bearer tokens on protected routes

### 3.4 AI Integration Architecture

Multiple AI providers are used through an abstraction layer:

| Provider | SDK | Use Cases |
|---|---|---|
| Google Gemini | `@google/generative-ai` | Summarization, quiz generation, mind maps, general AI |
| OpenAI | `openai` | Alternative AI backbone |
| Groq | `groq-sdk` | Fast inference alternative |

The `utils/ai-engine.service.ts` provides a unified interface. File content extraction (PDF, DOCX, XLSX) is done server-side before passing to AI.

### 3.5 File Handling

- **Upload:** `multer` handles multipart file uploads (temp local storage)
- **Storage:** `cloudinary` SDK uploads files to Cloudinary CDN
- **Document Parsing:** `pdf-parse` (PDF), `mammoth` (DOCX), `xlsx` (Excel)

---

## 4. Database Architecture

- **PostgreSQL 15** (managed via Docker)
- **Migration Tool:** `node-pg-migrate` (raw SQL migrations, no ORM)
- **Connection:** `pg` Pool in `backend/src/db/index.ts`

### 4.1 Core Tables

| Table | Purpose |
|---|---|
| `users` | User accounts — auth, profile, streak, premium status |
| `documents` | Uploaded study documents |
| `study_sessions` | Time-tracking records per document per user |
| `notes` | User notes attached to documents |
| `flashcard_decks` | Flashcard collection groups |
| `flashcards` | Individual flashcards with SM-2 spaced repetition fields |
| `user_study_dates` | Daily study date log for streak calculation |
| `user_daily_tasks` | Gamified daily task system |
| `tasks` | General task list |
| `friends` | Friend relationships between users |
| `mindmaps` | Saved AI-generated mind maps |

See [data-models.md](./data-models.md) for full schema.

---

## 5. Deployment Architecture

All services run as Docker containers coordinated by `docker-compose.yml`:

| Container | Image | Port |
|---|---|---|
| `myproject-frontend` | Custom Dockerfile (Node/Next.js) | 3000 |
| `myproject-backend` | Custom Dockerfile (Node/Express) | 5000 |
| `myproject-postgres` | `postgres:15-alpine` | 5432 |
| `myproject-pgadmin` | `dpage/pgadmin4:8` | 5050 |

All containers share the `app-network` bridge network. Postgres data persisted via Docker volume `postgres-data`.

---

## 6. Security

| Concern | Implementation |
|---|---|
| Password hashing | bcryptjs (cost factor 10) |
| Authentication | JWT (access + refresh token pattern) |
| Authorization | JWT middleware on all protected routes |
| File upload validation | MIME type filtering in multer |
| CORS | Dynamic origin allow-all with credentials |
| Rate limiting | `rateLimiter.middleware.ts` |
| 2FA | Email OTP via SMTP |
| Resource ownership | `checkResourceAccess.ts` middleware |
