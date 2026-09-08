# Cognito — Component Inventory

> **Generated:** 2026-09-07 | **Framework:** Next.js 14 + React 18

---

## Overview

Frontend components are located in `frontend/src/components/` and `frontend/src/app/` (page-level components). The project uses Tailwind CSS for styling and Framer Motion for animations.

---

## Global / Shared Components

Located in `frontend/src/components/`

| Component | File | Description |
|---|---|---|
| `Button` | `Button.tsx` | Generic reusable button |
| `Modal` | `Modal.tsx` | Generic overlay modal |
| `Navbar` | `Navbar.tsx` | Global navigation bar |
| `TaskNotifications` | `TaskNotifications.tsx` | Daily task notification widget with progress tracking |

---

## Auth Components — `components/auth/`

Authentication flow UI components.

| Component | Description |
|---|---|
| Login form | Email/password login with validation |
| Register form | New account registration |
| Google OAuth button | Google Sign-In integration |
| Two-factor auth | OTP verification form |

---

## Dashboard Components — `components/dashboard/`

Home dashboard widgets displayed after login.

| Component | Description |
|---|---|
| Study stats widget | Hours studied, documents read |
| Streak display | Daily streak counter with animation |
| Recent documents | Last accessed documents list |
| Daily tasks progress | Gamified task completion tracker |
| Quick actions | Shortcuts to key features |

---

## Document Components — `components/documents/`

Document management UI.

| Component | Description |
|---|---|
| Document card | Grid card with title, category, metadata |
| Document uploader | Drag-and-drop + file picker for upload |
| Document viewer | Multi-format viewer (PDF, DOCX, XLSX) |
| Document search/filter | Category and text search |

---

## Flashcard Components — `components/flashcards/`

Flashcard study interface.

| Component | Description |
|---|---|
| Deck card | Visual representation of a flashcard deck |
| Flashcard viewer | Flip animation card for study mode |
| Study session player | SM-2 review interface (rate 0-5) |
| Deck creator | Form to create new deck |
| Card editor | Add/edit individual flashcards |

---

## Landing Components — `components/landing/`

Marketing/landing page sections (unauthenticated).

| Component | Description |
|---|---|
| Hero section | Main headline, CTA, feature highlight |
| Features grid | Key feature cards with icons |
| How it works | Step-by-step explainer |
| Testimonials | Social proof section |
| CTA section | Sign up / Get started call to action |

---

## Layout Components — `components/layout/`

Page shell and navigation structure.

| Component | Description |
|---|---|
| Sidebar | Left sidebar navigation with links to all sections |
| Header | Page-level header with user menu |
| Page layout | Consistent page wrapper with sidebar + main area |
| User menu | Avatar dropdown with profile/logout links |

---

## AI Test Components — `components/ai-test/`

AI-powered test practice UI.

| Component | Description |
|---|---|
| Test creator | Form to set up a new AI-generated test |
| Question renderer | Displays AI-generated questions |
| Answer input | Various answer type inputs (MC, text, etc.) |
| Result viewer | Shows AI-graded results with feedback |

---

## Page Components (App Router)

Each folder under `frontend/src/app/` is a Next.js route with `page.tsx`:

| Route | Page File | Description |
|---|---|---|
| `/` | `page.tsx` | Entry point / redirect |
| `/home` | `home/page.tsx` | Authenticated dashboard |
| `/library` | `library/page.tsx` | Personal document library |
| `/flashcards` | `flashcards/page.tsx` | Flashcard decks & study |
| `/ai-lab` | `ai-lab/page.tsx` | AI tools (summarize, quiz, mindmap) |
| `/ai-test` | `ai-test/page.tsx` | AI practice exams |
| `/community` | `community/page.tsx` | Social: browse public docs, friends |
| `/marketplace` | `marketplace/page.tsx` | Buy/sell documents |
| `/profile` | `profile/page.tsx` | User profile |
| `/settings` | `settings/page.tsx` | Account settings |
| `/premium` | `premium/page.tsx` | Premium upgrade + pricing |
| `/premium-preview` | `premium-preview/page.tsx` | Premium feature preview |
| `/study-sessions` | `study-sessions/page.tsx` | Study time history & stats |
| `/viewer` | `viewer/page.tsx` | Document file viewer |
| `/shared` | `shared/page.tsx` | Shared document access |
| `/admin` | `admin/page.tsx` | Admin control panel (role-gated) |

---

## Key UI Libraries

| Library | Version | Use |
|---|---|---|
| Tailwind CSS | ^3.3.0 | Utility-first styling |
| Framer Motion | ^12.40.0 | Animations, page transitions, card flips |
| Lucide React | ^1.17.0 | SVG icon set |
| Recharts | ^3.8.1 | Analytics charts (study time, progress) |
| Mermaid.js | ^11.17.1 | Mind map diagram rendering |
| react-hook-form | ^7.79.0 | Form state management & validation |
| react-hot-toast | ^2.6.0 | Success/error toast notifications |
| react-toastify | ^11.1.0 | Additional toast notifications |
| lottie-react | ^2.4.1 | Lottie animation playback |
| canvas-confetti | ^1.9.4 | Celebration confetti effect |
| react-slick | ^0.31.0 | Carousel/slider component |
| react-resizable-panels | ^4.11.2 | Resizable panel layout |
| pdfjs-dist | ^6.0.227 | PDF rendering in browser |
| docx-preview | ^0.3.7 | DOCX preview in browser |
| mammoth | ^1.12.0 | DOCX to HTML conversion |
| @cyntler/react-doc-viewer | ^1.17.1 | Multi-format document viewer |

---

## Design System

- **CSS Framework:** Tailwind CSS (utility classes)
- **Color Scheme:** Dark/light mode support via Tailwind
- **Typography:** System fonts + Tailwind typography
- **Animations:** Framer Motion for micro-interactions
- **Icons:** Lucide React icon library
- **Layout:** CSS Grid + Flexbox via Tailwind
