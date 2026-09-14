# Cognito — API Contracts

> **Generated:** 2026-09-07 | **Backend:** Express.js REST API | **Base URL:** `http://localhost:5000`

---

## Authentication

All protected routes require a JWT Bearer token:
```
Authorization: Bearer <access_token>
```

Tokens are obtained via `/api/auth/login` or `/api/auth/google`.

---

## Route Groups

| Prefix | File | Description |
|---|---|---|
| `/api/auth` | `auth.routes.ts` | Authentication & user profile |
| `/api/documents` | `document.routes.ts` | Document management |
| `/api/shares` | `share.routes.ts` | Document sharing |
| `/api/payment` | `payment.routes.ts` | PayOS payment integration |
| `/api/ai` | `ai.routes.ts` + `ai-test.routes.ts` | AI features & AI test practice |
| `/api/marketplace` | `marketplace.routes.ts` | Document marketplace |
| `/api/admin` | `admin.routes.ts` | Admin operations |
| `/api/*` (app routes) | `app.routes.ts` | Flashcards, notes, study sessions, mindmaps, tasks, community, friends |

---

## Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create new account |
| POST | `/api/auth/login` | Public | Email/password login, returns JWT |
| POST | `/api/auth/google` | Public | Google OAuth login/register |
| POST | `/api/auth/logout` | Public | Logout (client-side token clear) |
| POST | `/api/auth/check-availability` | Public | Check if email/name is available |
| GET | `/api/auth/me` | Protected | Get current user profile |
| POST | `/api/auth/avatar` | Protected | Upload avatar image (multipart/form-data) |
| PUT | `/api/auth/profile` | Protected | Update profile (name, bio, school, major) |
| POST | `/api/auth/toggle-verification` | Protected | Toggle 2FA — sends OTP email |
| POST | `/api/auth/verify-2fa` | Public | Verify OTP code for 2FA login |
| PUT | `/api/auth/change-password` | Protected | Change password |
| POST | `/api/auth/upgrade-premium` | Protected | Upgrade to premium |

---

## Document Routes — `/api/documents`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/documents` | Protected | List user's documents |
| POST | `/api/documents` | Protected | Upload new document (multipart/form-data) |
| GET | `/api/documents/:id` | Protected | Get single document |
| PUT | `/api/documents/:id` | Protected | Update document metadata |
| DELETE | `/api/documents/:id` | Protected | Delete document |
| GET | `/api/documents/:id/download` | Protected | Get download URL |

---

## Share Routes — `/api/shares`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/shares` | Protected | Share document with another user |
| GET | `/api/shares` | Protected | List documents shared with me |
| DELETE | `/api/shares/:id` | Protected | Remove a share |

---

## Payment Routes — `/api/payment`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payment/create` | Protected | Create PayOS payment link for premium |
| GET | `/api/payment/webhook` | Public | PayOS payment webhook callback |
| POST | `/api/payment/webhook` | Public | PayOS payment webhook callback |

---

## AI Routes — `/api/ai`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/summarize` | Protected | Summarize document content |
| POST | `/api/ai/quiz` | Protected | Generate quiz questions from document |
| POST | `/api/ai/flashcards` | Protected | Generate flashcards from document |
| POST | `/api/ai/mindmap` | Protected | Generate Mermaid.js mind map from document |
| POST | `/api/ai/chat` | Protected | AI chat about document |

---

## AI Test Routes — `/api` (ai-test.routes.ts)

AI-powered structured test practice:

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/ai-tests` | Protected | List user's AI tests |
| POST | `/api/ai-tests` | Protected | Create new AI test session |
| GET | `/api/ai-tests/:id` | Protected | Get test with questions |
| POST | `/api/ai-tests/:id/submit` | Protected | Submit answers and get AI grading |
| GET | `/api/ai-tests/:id/result` | Protected | Get graded result |

---

## Marketplace Routes — `/api/marketplace`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/marketplace` | Public | Browse public documents for sale |
| POST | `/api/marketplace` | Protected | List a document on marketplace |
| GET | `/api/marketplace/:id` | Public | Get marketplace listing detail |
| DELETE | `/api/marketplace/:id` | Protected | Remove listing |

---

## Admin Routes — `/api/admin`

> Requires admin role.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| PUT | `/api/admin/users/:id` | Admin | Update user (role, premium, etc.) |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| GET | `/api/admin/documents` | Admin | List all documents |
| DELETE | `/api/admin/documents/:id` | Admin | Delete any document |

---

## App Routes — `/api` (app.routes.ts)

This is the main feature route file containing the majority of endpoints:

### Flashcards

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/flashcard-decks` | Protected | List user's flashcard decks |
| POST | `/api/flashcard-decks` | Protected | Create deck |
| GET | `/api/flashcard-decks/:id` | Protected | Get deck with cards |
| PUT | `/api/flashcard-decks/:id` | Protected | Update deck |
| DELETE | `/api/flashcard-decks/:id` | Protected | Delete deck |
| GET | `/api/flashcard-decks/:id/cards` | Protected | Get cards in deck |
| POST | `/api/flashcard-decks/:id/cards` | Protected | Add card to deck |
| PUT | `/api/flashcards/:id` | Protected | Update flashcard |
| DELETE | `/api/flashcards/:id` | Protected | Delete flashcard |
| POST | `/api/flashcards/:id/review` | Protected | Submit SM-2 review result |

### Notes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notes` | Protected | List user's notes |
| POST | `/api/notes` | Protected | Create note |
| GET | `/api/notes/:id` | Protected | Get note |
| PUT | `/api/notes/:id` | Protected | Update note |
| DELETE | `/api/notes/:id` | Protected | Delete note |

### Study Sessions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/study-sessions` | Protected | List user's study sessions |
| POST | `/api/study-sessions` | Protected | Log a study session |
| GET | `/api/study-sessions/stats` | Protected | Get study statistics |

### Mind Maps

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/mindmaps` | Protected | List user's mind maps |
| POST | `/api/mindmaps` | Protected | Create/save mind map |
| GET | `/api/mindmaps/:id` | Protected | Get mind map |
| PUT | `/api/mindmaps/:id` | Protected | Update mind map |
| DELETE | `/api/mindmaps/:id` | Protected | Delete mind map |

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | Protected | Get user's tasks |
| POST | `/api/tasks` | Protected | Create task |
| PUT | `/api/tasks/:id` | Protected | Update task (mark done, etc.) |
| DELETE | `/api/tasks/:id` | Protected | Delete task |
| GET | `/api/daily-tasks` | Protected | Get today's daily challenge tasks |
| POST | `/api/daily-tasks/:id/complete` | Protected | Mark daily task as complete |

### Community / Friends

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/community/documents` | Protected | Browse public documents |
| GET | `/api/friends` | Protected | List friends |
| POST | `/api/friends/request` | Protected | Send friend request |
| PUT | `/api/friends/:id/accept` | Protected | Accept friend request |
| DELETE | `/api/friends/:id` | Protected | Remove friend |
| GET | `/api/friends/requests` | Protected | List pending requests |

### User Streak

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/streak` | Protected | Get current streak |

---

## Common Response Formats

### Success Response
```json
{
  "data": { ... },
  "message": "Success"
}
```

### Error Response
```json
{
  "error": "Human readable error message"
}
```

### Health Check
```
GET /health
→ { "status": "OK" }
```
