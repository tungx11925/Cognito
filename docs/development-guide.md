# Cognito — Development Guide

> **Generated:** 2026-09-07

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 LTS | Frontend & Backend runtime |
| npm | ≥ 9 | Package management |
| Docker Desktop | Latest | Containerized run (recommended) |
| PostgreSQL | 15 | Database (or run via Docker) |
| Git | Latest | Version control |

---

## Quick Start (Docker — Recommended)

### Step 1: Clone the Repository

```bash
git clone <repo-url>
cd Cognito
```

### Step 2: Configure Environment Variables

The project uses environment files at **three** locations:

**A. Root `.env`** — PostgreSQL & pgAdmin credentials for Docker:
```bash
# Cognito/.env (create from scratch or copy template)
POSTGRES_USER=admin
POSTGRES_PASSWORD=secret
POSTGRES_DB=app_db
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin
```

**B. Backend `.env`** — Server config:
```bash
cd backend
cp .env.example .env
# Edit .env and fill in real values
```

Key variables in `backend/.env`:
| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | 64-char random secret for JWT |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `PAYOS_CLIENT_ID` | PayOS payment client ID |
| `PAYOS_API_KEY` | PayOS API key |
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `SMTP_HOST` | Email server host |
| `SMTP_USERNAME` | Email sender account |
| `SMTP_PASSWORD` | Email app password |
| `FRONTEND_URL` | Frontend base URL (for CORS/redirects) |

**C. Frontend `.env.local`**:
```bash
cd frontend
# Create frontend/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```

### Step 3: Start All Services

```bash
# From project root
docker-compose up -d --build
```

This starts:
- **Frontend** on http://localhost:3000
- **Backend** on http://localhost:5000
- **PostgreSQL** on port 5432
- **pgAdmin** on http://localhost:5050

### Step 4: Run Database Migrations

```bash
docker-compose exec backend npm run migrate:up
```

### Step 5: Access the Application

- 🌐 **App:** http://localhost:3000
- 🔧 **API:** http://localhost:5000/health
- 🗄️ **DB Admin:** http://localhost:5050
  - Login: credentials from root `.env` (`PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD`)
  - Add server: Host = `postgres`, DB = `app_db`, User/Pass from `.env`

---

## Local Development (Without Docker)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL to your local PostgreSQL

# Run migrations
npm run migrate:up

# Start dev server (hot reload via nodemon)
npm run dev
# → Listening on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
# Create .env.local with:
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Start dev server (hot reload via Next.js)
npm run dev
# → Listening on http://localhost:3000
```

---

## Build for Production

### Backend
```bash
cd backend
npm run build    # Compiles TypeScript → dist/
npm run start    # Runs dist/server.js
```

### Frontend
```bash
cd frontend
npm run build    # Next.js production build
npm run start    # Next.js production server
```

---

## Database Management

All database operations use `node-pg-migrate` (no ORM, raw SQL).

| Command | Description |
|---|---|
| `npm run migrate:up` | Apply all pending migrations |
| `npm run migrate:down` | Rollback last migration |
| `npm run migrate:create <name>` | Create a new migration file |

> **Docker:** Prefix with `docker-compose exec backend` to run inside container.

Migration files are in `backend/migrations/` — timestamped JS files with `up` and `down` exports.

---

## Docker Commands

| Command | Description |
|---|---|
| `docker-compose up -d --build` | Build images and start all services |
| `docker-compose up -d` | Start services (reuse existing images) |
| `docker-compose down` | Stop and remove containers |
| `docker-compose down -v` | Stop and remove containers + volumes (⚠️ data loss) |
| `docker-compose logs -f backend` | Tail backend logs |
| `docker-compose logs -f frontend` | Tail frontend logs |
| `docker-compose exec backend npm run migrate:up` | Run migrations |

---

## Project Scripts Summary

### Backend (`backend/package.json`)

| Script | Command | Description |
|---|---|---|
| `dev` | `nodemon --watch src --ext ts --exec ts-node` | Hot-reload dev server |
| `build` | `tsc` | Compile TypeScript |
| `start` | `node dist/server.js` | Start production server |
| `migrate:up` | `node-pg-migrate up` | Apply pending migrations |
| `migrate:down` | `node-pg-migrate down` | Rollback last migration |
| `migrate:create` | `node-pg-migrate create` | Create new migration |

### Frontend (`frontend/package.json`)

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Hot-reload dev server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |

---

## Environment Variable Reference

### Backend Required Variables

```env
# Server
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET_KEY=<64-char random string>
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7

# Cloudinary (file storage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=

# AI Providers
GEMINI_API_KEY=

# Payment
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend Required Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Common Issues & Solutions

| Issue | Solution |
|---|---|
| Database connection refused | Ensure PostgreSQL is running; check `DATABASE_URL` |
| "Port 3000 already in use" | App auto-starts on 3001; or kill the process on 3000 |
| Migration errors | Run `npm run migrate:down` then `npm run migrate:up` |
| Cloudinary upload fails | Verify `CLOUDINARY_*` env vars are set correctly |
| CORS errors | Ensure `FRONTEND_URL` in backend `.env` matches frontend origin |
| Google OAuth fails | Verify `GOOGLE_CLIENT_ID` and OAuth redirect URIs in Google Console |
