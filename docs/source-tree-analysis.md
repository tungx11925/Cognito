# Cognito — Source Tree Analysis

> **Generated:** 2026-09-07 | **Repository Type:** Multi-part (Monorepo)

---

## Root Structure

```
Cognito/                              # Project root
├── frontend/                         # [PART 1] Next.js web application
├── backend/                          # [PART 2] Express.js REST API
├── docker-compose.yml                # Docker orchestration (all services)
├── .env                              # Root env — PostgreSQL & pgAdmin credentials
├── package.json                      # Root-level (minimal, no workspace)
├── README.md                         # Project setup & demo accounts
├── docker_setup_guide.md             # Detailed Docker setup guide
├── IMPLEMENTATION_PLAN.md            # BMad implementation plan
├── .github/                          # GitHub configuration
├── _bmad/                            # BMad agent configuration
├── _bmad-output/                     # BMad planning artifacts
└── .agents/                          # Agent skills (BMad framework)
```

---

## Frontend — `frontend/`

```
frontend/
├── Dockerfile                        # Docker image for Next.js
├── next.config.js                    # Next.js config (image domains, etc.)
├── tailwind.config.js                # Tailwind CSS config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Frontend dependencies
├── public/                           # Static assets served at /
│   └── (images, icons, etc.)
└── src/
    ├── app/                          # [ENTRY] Next.js App Router
    │   ├── layout.tsx                # Root layout — wraps all pages
    │   ├── page.tsx                  # Root page (→ /home redirect)
    │   ├── globals.css               # Global CSS
    │   ├── admin/                    # /admin — Admin dashboard
    │   ├── ai-lab/                   # /ai-lab — AI tools (summarize, quiz, mindmap)
    │   ├── ai-test/                  # /ai-test — AI-graded practice exams
    │   ├── community/                # /community — Browse public docs, social
    │   ├── flashcards/               # /flashcards — Deck management & study mode
    │   ├── home/                     # /home — Authenticated home dashboard
    │   ├── library/                  # /library — Personal document library
    │   ├── marketplace/              # /marketplace — Buy/sell documents
    │   ├── premium/                  # /premium — Upgrade page
    │   ├── premium-preview/          # /premium-preview — Feature preview
    │   ├── profile/                  # /profile — User profile page
    │   ├── settings/                 # /settings — Account settings
    │   ├── shared/                   # /shared — Shared doc viewer
    │   ├── study-sessions/           # /study-sessions — Study time history
    │   ├── testhome/                 # Test/scratch home
    │   └── viewer/                   # /viewer — Document file viewer
    ├── components/                   # Reusable UI components
    │   ├── Button.tsx                # Generic button component
    │   ├── Modal.tsx                 # Generic modal component
    │   ├── Navbar.tsx                # Top navigation bar
    │   ├── TaskNotifications.tsx     # Daily task notification system
    │   ├── auth/                     # Login, Register, Google OAuth UI
    │   ├── dashboard/                # Dashboard widgets (stats, streak, etc.)
    │   ├── documents/                # Document card, uploader, viewer
    │   ├── flashcards/               # Flashcard deck & study card UI
    │   ├── landing/                  # Landing page sections (hero, features)
    │   ├── layout/                   # Sidebar, header, page layout shell
    │   └── ai-test/                  # AI test session UI components
    ├── context/                      # React Context providers
    │   └── (auth context, theme, etc.)
    ├── hooks/                        # Custom React hooks
    │   └── (useAuth, useDocuments, etc.)
    ├── lib/                          # Shared utilities/configs
    ├── services/                     # API client layer (Axios wrappers)
    │   ├── api.ts                    # Axios base instance (base URL, interceptors)
    │   ├── auth.service.ts           # Auth API calls
    │   ├── document.service.ts       # Document API calls
    │   ├── flashcard.service.ts      # Flashcard API calls
    │   ├── note.service.ts           # Notes API calls
    │   ├── study.service.ts          # Study sessions API calls
    │   ├── ai.service.ts             # AI features API calls
    │   ├── ai-test.service.ts        # AI test API calls
    │   ├── admin.service.ts          # Admin panel API calls
    │   └── course.service.ts         # Course API calls
    ├── store/
    │   └── auth.store.ts             # Auth state (minimal)
    ├── styles/                       # Additional CSS
    ├── types/                        # Shared TypeScript interfaces/types
    └── utils/                        # Frontend utilities
```

---

## Backend — `backend/`

```
backend/
├── Dockerfile                        # Docker image for Express.js
├── tsconfig.json                     # TypeScript config
├── package.json                      # Backend dependencies
├── .env.example                      # Environment variable template
├── uploads/                          # Temporary file upload storage (before Cloudinary)
├── dist/                             # Compiled JS output (from tsc)
├── migrations/                       # [DB] node-pg-migrate SQL migrations
│   ├── 1779072038258_create-users-table.js
│   ├── 1779072038259_create-remaining-tables.js  # Core tables + seed data
│   ├── 1780900000000_add-phone-to-users.js
│   ├── 1780934967873_add-avatar-url-to-users.js
│   ├── 1780936000000_add_profile_fields_to_users.js
│   ├── 1780938917837_add-is-verified-to-users.js
│   ├── 1780978141069_add-is-public-to-decks.js
│   ├── 1781082183256_add-flashcard-advanced-features.js
│   ├── 1781517000000_add-streak-fields-to-users.js
│   ├── 1781666320288_create-user-study-dates-table.js
│   ├── 1781669900000_create_tasks_and_friends_tables.js
│   ├── 1781675000000_add_privacy_setting_to_users.js
│   ├── 1781700000000_create_mindmaps_table.js
│   └── 1782000000000_add-cloudinary-fields-to-documents.js
└── src/
    ├── server.ts                     # [ENTRY] HTTP server — binds port 5000
    ├── app.ts                        # Express app — registers middleware & routes
    ├── check_constraints.ts          # DB constraint verification utility
    ├── config/                       # Configuration (env loading)
    ├── controllers/                  # Route handlers
    │   ├── auth.controller.ts        # Register, login, OAuth, profile, 2FA, premium
    │   ├── admin.controller.ts       # Admin: user list, stats, moderation
    │   ├── document.controller.ts    # Document CRUD + file upload
    │   ├── marketplace.controller.ts # Marketplace listings
    │   ├── payment.controller.ts     # PayOS payment flow
    │   ├── share.controller.ts       # Document sharing
    │   ├── ai.controller.ts          # AI feature delegation
    │   ├── course.controller.ts      # Course management
    │   └── user.controller.ts        # User profile
    ├── routes/                       # Express Router definitions
    │   ├── app.routes.ts             # Main feature routes (large monolithic file)
    │   ├── auth.routes.ts            # Auth endpoints
    │   ├── document.routes.ts        # Document endpoints
    │   ├── share.routes.ts           # Share endpoints
    │   ├── payment.routes.ts         # Payment endpoints
    │   ├── ai.routes.ts              # AI endpoints
    │   ├── marketplace.routes.ts     # Marketplace endpoints
    │   ├── admin.routes.ts           # Admin endpoints
    │   ├── ai-test.routes.ts         # AI test practice endpoints
    │   └── course.routes.ts          # Course endpoints
    ├── middlewares/
    │   ├── auth.middleware.ts        # JWT Bearer token validation
    │   ├── checkResourceAccess.ts    # Resource ownership enforcement
    │   ├── error.middleware.ts       # Global JSON error handler
    │   └── rateLimiter.middleware.ts # API rate limiting
    ├── db/
    │   ├── index.ts                  # pg Pool setup + query wrapper
    │   └── ai-test-schema.ts         # AI test tables — auto-migrated on startup
    └── utils/
        └── ai-engine.service.ts      # AI provider abstraction (Gemini/OpenAI/Groq)
```

---

## Critical Integration Points

| Point | From | To | Method |
|---|---|---|---|
| API calls | Frontend `services/` | Backend `/api/*` | HTTP REST (Axios) |
| Auth token | Frontend (`api.ts` interceptor) | Backend `auth.middleware.ts` | JWT Bearer header |
| File upload | Frontend form | Backend → Cloudinary | multipart/form-data → SDK |
| Database queries | Backend `controllers/` | PostgreSQL | `pg` Pool + raw SQL |
| AI processing | Backend routes | Gemini/OpenAI/Groq | SDK calls |
| Payment flow | Frontend → Backend → PayOS | External | Webhook callback |
| Email (2FA, etc.) | Backend `auth.controller.ts` | SMTP server | Nodemailer |
