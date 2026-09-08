# Cognito — Integration Architecture

> **Generated:** 2026-09-07 | **Repository Type:** Multi-part

---

## Overview

Cognito has two internal parts and communicates with multiple external third-party services.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND  (Next.js — Port 3000)                │
│  src/services/*.service.ts  →  HTTP REST via Axios          │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API calls
                            │ Authorization: Bearer <JWT>
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND  (Express.js — Port 5000)              │
│  Routes → Middleware → Controllers → DB / External          │
└──────┬──────────┬──────────┬───────────┬────────────────────┘
       │          │          │           │
       ▼          ▼          ▼           ▼
  PostgreSQL  Cloudinary  AI APIs    External
   (5432)      CDN       (Gemini/    Services
               Storage   OpenAI/    (PayOS, SMTP)
                         Groq)
```

---

## Internal Part Integration

### Frontend → Backend

| Integration Point | Details |
|---|---|
| **Protocol** | HTTP REST (JSON) |
| **Client** | Axios instance in `frontend/src/services/api.ts` |
| **Base URL** | Configured via `NEXT_PUBLIC_API_URL` env var |
| **Authentication** | JWT Bearer token in `Authorization` header |
| **Token handling** | Axios request interceptor attaches token from storage |
| **File uploads** | multipart/form-data for documents and avatars |

### Backend → PostgreSQL

| Integration Point | Details |
|---|---|
| **Driver** | `pg` (node-postgres) |
| **Connection** | `pg.Pool` in `backend/src/db/index.ts` |
| **Queries** | Raw SQL (no ORM) |
| **Migrations** | `node-pg-migrate` — files in `backend/migrations/` |
| **Docker network** | `postgres` hostname within `app-network` |

---

## External Service Integrations

### Cloudinary (File Storage)

- **SDK:** `cloudinary` v2
- **Flow:** 
  1. User uploads file → `multer` saves to `backend/uploads/` (temp)
  2. Backend reads temp file → `cloudinary.uploader.upload()`
  3. Cloudinary returns URL → stored in `documents.doc_url` / `users.avatar_url`
  4. Temp file deleted from `uploads/`
- **Config:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Google Gemini AI

- **SDK:** `@google/generative-ai`
- **Entry point:** `backend/src/utils/ai-engine.service.ts`
- **Used for:** Summarization, quiz generation, flashcard generation, mind map creation
- **Config:** `GEMINI_API_KEY`

### OpenAI

- **SDK:** `openai`
- **Entry point:** `backend/src/utils/ai-engine.service.ts`
- **Used for:** Alternative AI backbone for document analysis
- **Config:** `OPENAI_API_KEY`

### Groq

- **SDK:** `groq-sdk`
- **Entry point:** `backend/src/utils/ai-engine.service.ts`
- **Used for:** Fast inference alternative
- **Config:** `GROQ_API_KEY`

### Document Content Extraction

Before sending to AI APIs, backend extracts text:

| File Type | Library | Process |
|---|---|---|
| PDF | `pdf-parse` | Extract text from PDF buffer |
| DOCX | `mammoth` | Convert DOCX to text/HTML |
| XLSX | `xlsx` | Parse spreadsheet to text |

### Google OAuth

- **Library:** `google-auth-library`
- **Flow:**
  1. Frontend uses Google Sign-In button → receives `id_token`
  2. Frontend sends `id_token` to `POST /api/auth/google`
  3. Backend verifies token with `google-auth-library`
  4. Creates/finds user → issues JWT
- **Config:** `GOOGLE_CLIENT_ID`

### PayOS (Payment Gateway)

- **Flow:**
  1. User clicks upgrade premium
  2. Frontend calls `POST /api/payment/create`
  3. Backend creates PayOS payment link (returns URL)
  4. User is redirected to PayOS to pay
  5. PayOS calls webhook `GET/POST /api/payment/webhook`
  6. Backend upgrades `users.is_premium = true`
- **Config:** `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`

### Nodemailer (Email / 2FA)

- **Library:** `nodemailer`
- **Used for:**
  - Two-factor authentication OTP emails
  - Welcome emails (if configured)
- **Config:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`

---

## Data Flow Diagrams

### Document Upload Flow

```
User → Frontend Upload Form
  → POST /api/documents (multipart/form-data)
    → multer saves to uploads/
    → pdf-parse / mammoth extracts text
    → cloudinary.upload() → CDN URL
    → INSERT INTO documents (url, title, ...)
    → DELETE temp file from uploads/
  ← Return document record
```

### AI Study Session Flow

```
User → AI Lab page
  → POST /api/ai/summarize { documentId }
    → SELECT doc_url FROM documents WHERE id = ?
    → Download file from Cloudinary
    → Extract text (pdf-parse / mammoth)
    → Send to Gemini API: "Summarize: <text>"
    → Return summary markdown
  ← Display formatted summary
```

### Flashcard Spaced Repetition Flow

```
User reviews flashcard
  → POST /api/flashcards/:id/review { quality: 0-5 }
    → Fetch current ease_factor, repetitions, interval_days
    → Apply SM-2 algorithm:
        if quality >= 3: update interval, increment repetitions
        else: reset repetitions, interval = 1
    → UPDATE flashcards SET next_review_at, ease_factor, ...
    → INSERT/UPDATE user_study_dates for streak tracking
    → updateUserStreak(userId) → UPDATE users SET streak
  ← Return updated card + new streak
```

### Authentication Flow (2FA)

```
User enables 2FA
  → POST /api/auth/toggle-verification
    → Generate OTP code
    → Send email via Nodemailer
    → Store hashed OTP in users table

User logs in with 2FA
  → POST /api/auth/login { email, password }
    ← { requires2FA: true, tempToken }
  → POST /api/auth/verify-2fa { tempToken, otp }
    → Verify OTP
    ← { accessToken, refreshToken, user }
```

---

## Port Summary

| Service | Internal Port | External Port | Network |
|---|---|---|---|
| Frontend | 3000 | 3000 | app-network |
| Backend | 5000 | 5000 | app-network |
| PostgreSQL | 5432 | 5432 | app-network |
| pgAdmin | 80 | 5050 | app-network |
