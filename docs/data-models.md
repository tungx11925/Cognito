# Cognito — Data Models

> **Generated:** 2026-09-07 | **Database:** PostgreSQL 15 | **Migration Tool:** node-pg-migrate

---

## Overview

The database uses raw SQL migrations (no ORM). Migrations are located in `backend/migrations/` and run with `npm run migrate:up`.

---

## Entity Relationship Summary

```
users
  ├── documents (user_id → FK)
  │     ├── study_sessions (document_id → FK)
  │     ├── notes (document_id → FK)
  │     └── flashcards (document_id → FK, optional)
  ├── flashcard_decks (user_id → FK)
  │     └── flashcards (deck_id → FK)
  ├── user_study_dates (user_id → FK)
  ├── user_daily_tasks (user_id → FK)
  ├── tasks (user_id → FK)
  ├── mindmaps (user_id → FK)
  └── friends (user_id, friend_id → FK)
```

---

## Table Definitions

### `users`

Primary user account table.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | Auto-increment user ID |
| `email` | varchar(255) | NOT NULL, UNIQUE | Login email |
| `password` | varchar(255) | | Bcrypt-hashed password (null for OAuth users) |
| `name` | varchar(255) | NOT NULL | Display name |
| `phone` | varchar(20) | | Optional phone number |
| `avatar_url` | varchar(500) | | Cloudinary avatar URL |
| `bio` | text | | Profile bio |
| `school` | varchar(255) | | School/university name |
| `major` | varchar(255) | | Field of study |
| `role` | varchar(50) | DEFAULT 'user' | User role: `user` or `admin` |
| `is_premium` | boolean | DEFAULT false | Premium subscription status |
| `is_verified` | boolean | DEFAULT false | Email verified status |
| `is_2fa_enabled` | boolean | DEFAULT false | Two-factor auth enabled |
| `streak` | integer | DEFAULT 0 | Current daily study streak (days) |
| `last_study_date` | timestamp | | Last time user studied |
| `privacy_setting` | varchar(50) | DEFAULT 'public' | Profile privacy: `public` or `private` |
| `created_at` | timestamp | NOT NULL, DEFAULT now | Account creation timestamp |

---

### `documents`

Study documents uploaded by users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | Auto-increment document ID |
| `user_id` | integer | NOT NULL, FK → users(id) CASCADE | Owner |
| `title` | varchar(255) | NOT NULL | Document title |
| `description` | text | | Short description |
| `doc_url` | varchar(255) | | Cloudinary URL (original file) |
| `solution_text` | text | | Text-based solution/notes |
| `solution_url` | varchar(255) | | URL to solution file |
| `category` | varchar(100) | | Subject category |
| `is_public` | boolean | DEFAULT false | Visible in marketplace/community |
| `cloudinary_public_id` | varchar(255) | | Cloudinary asset ID for deletion |
| `file_type` | varchar(50) | | MIME type or extension |
| `created_at` | timestamp | NOT NULL, DEFAULT now | Upload timestamp |

---

### `study_sessions`

Tracks how long a user studied a particular document.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `user_id` | integer | NOT NULL, FK → users(id) CASCADE | |
| `document_id` | integer | NOT NULL, FK → documents(id) CASCADE | |
| `duration_seconds` | integer | NOT NULL | Study time in seconds |
| `started_at` | timestamp | NOT NULL, DEFAULT now | Session start time |

---

### `notes`

User-created notes linked to a document.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `user_id` | integer | NOT NULL, FK → users(id) CASCADE | |
| `document_id` | integer | NOT NULL, FK → documents(id) CASCADE | |
| `title` | varchar(255) | | Note title |
| `content` | text | | Note content (Markdown supported) |
| `created_at` | timestamp | NOT NULL, DEFAULT now | |

---

### `flashcard_decks`

A named collection of flashcards.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `user_id` | integer | NOT NULL, FK → users(id) CASCADE | Owner |
| `name` | varchar(255) | NOT NULL | Deck name |
| `description` | text | | Deck description |
| `is_public` | boolean | DEFAULT false | Publicly visible in community |
| `created_at` | timestamp | NOT NULL, DEFAULT now | |

---

### `flashcards`

Individual flashcard with SM-2 Spaced Repetition fields.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `deck_id` | integer | NOT NULL, FK → flashcard_decks(id) CASCADE | Parent deck |
| `document_id` | integer | FK → documents(id) CASCADE | Source document (optional) |
| `front` | text | NOT NULL | Front side (question/term) |
| `back` | text | NOT NULL | Back side (answer/definition) |
| `ease_factor` | float | NOT NULL, DEFAULT 2.5 | SM-2 ease factor |
| `repetitions` | integer | NOT NULL, DEFAULT 0 | Number of successful reviews |
| `interval_days` | integer | NOT NULL, DEFAULT 0 | Days until next review |
| `next_review_at` | timestamp | NOT NULL, DEFAULT now | Next scheduled review |

---

### `user_study_dates`

One record per user per day they studied — used for streak calculation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | integer | NOT NULL, FK → users(id) CASCADE | |
| `study_date` | date | NOT NULL | Date studied |
| UNIQUE | (user_id, study_date) | | Prevents duplicate entries |

---

### `user_daily_tasks`

Gamified daily task system — tracks completion of study tasks per day.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `user_id` | integer | NOT NULL, FK → users(id) CASCADE | |
| `activity_date` | date | NOT NULL | Task date |
| `task_type` | varchar(100) | | Type of task (e.g., `study`, `flashcard`, `quiz`) |
| `is_completed` | boolean | DEFAULT false | Completion status |
| `completed_at` | timestamp | | When completed |

---

### `tasks`

General user task list (to-do style).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `user_id` | integer | NOT NULL, FK → users(id) CASCADE | |
| `title` | varchar(255) | NOT NULL | Task title |
| `is_done` | boolean | DEFAULT false | Completion flag |
| `due_date` | date | | Optional deadline |
| `created_at` | timestamp | NOT NULL, DEFAULT now | |

---

### `friends`

Friendship relationships between users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | integer | NOT NULL, FK → users(id) CASCADE | Requesting user |
| `friend_id` | integer | NOT NULL, FK → users(id) CASCADE | Target user |
| `status` | varchar(50) | | `pending`, `accepted`, `blocked` |
| `created_at` | timestamp | NOT NULL, DEFAULT now | |

---

### `mindmaps`

AI-generated mind maps saved by users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `user_id` | integer | NOT NULL, FK → users(id) CASCADE | Owner |
| `document_id` | integer | FK → documents(id) | Source document (optional) |
| `title` | varchar(255) | NOT NULL | Mind map title |
| `content` | text | NOT NULL | Mermaid.js diagram source |
| `created_at` | timestamp | NOT NULL, DEFAULT now | |

---

## Migration History

| File | Description |
|---|---|
| `1779072038258_create-users-table.js` | Initial users table |
| `1779072038259_create-remaining-tables.js` | documents, study_sessions, notes, flashcard_decks, flashcards + seed data |
| `1780900000000_add-phone-to-users.js` | Added `phone` column to users |
| `1780934967873_add-avatar-url-to-users.js` | Added `avatar_url` column |
| `1780936000000_add_profile_fields_to_users.js` | Added `bio`, `school`, `major` |
| `1780938917837_add-is-verified-to-users.js` | Added `is_verified`, `is_2fa_enabled` |
| `1780978141069_add-is-public-to-decks.js` | Added `is_public` to flashcard_decks |
| `1781082183256_add-flashcard-advanced-features.js` | SM-2 fields on flashcards |
| `1781517000000_add-streak-fields-to-users.js` | Added `streak`, `last_study_date` |
| `1781666320288_create-user-study-dates-table.js` | user_study_dates table |
| `1781669900000_create_tasks_and_friends_tables.js` | tasks, friends, user_daily_tasks |
| `1781675000000_add_privacy_setting_to_users.js` | Added `privacy_setting` |
| `1781700000000_create_mindmaps_table.js` | mindmaps table |
| `1782000000000_add-cloudinary-fields-to-documents.js` | cloudinary_public_id, file_type to documents |
