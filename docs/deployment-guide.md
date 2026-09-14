# Cognito — Deployment Guide

> **Generated:** 2026-09-07

---

## Overview

Cognito is containerized using Docker. The `docker-compose.yml` at the root orchestrates 4 services:

| Service | Image | Port | Role |
|---|---|---|---|
| `frontend` | Custom Next.js Dockerfile | 3000 | Web UI |
| `backend` | Custom Express Dockerfile | 5000 | REST API |
| `postgres` | `postgres:15-alpine` | 5432 | Database |
| `pgadmin` | `dpage/pgadmin4:8` | 5050 | DB Management UI |

All services share the `app-network` Docker bridge network.

---

## Infrastructure Requirements

### Local / Development

- Docker Desktop with Compose V2
- 4GB RAM minimum
- Ports 3000, 5000, 5432, 5050 free

### Production (Minimum Recommended)

- VPS or Cloud VM: 2 vCPU, 4GB RAM
- Docker Engine + Docker Compose
- A reverse proxy (Nginx / Caddy) for SSL termination
- External PostgreSQL database (recommended: AWS RDS, Supabase, etc.)
- Domain name with DNS configured

---

## Docker Compose Architecture

```yaml
services:
  frontend: (Next.js) → depends_on: backend
  backend:  (Express) → depends_on: postgres
  postgres: (PostgreSQL 15)
  pgadmin:  (pgAdmin 4) → depends_on: postgres

networks:
  app-network: bridge

volumes:
  postgres-data:   # Persistent DB storage
  pgadmin-data:    # Persistent pgAdmin settings
```

---

## Local Deployment Steps

```bash
# 1. Configure environment files (see Development Guide)
# 2. Build and start
docker-compose up -d --build

# 3. Run migrations
docker-compose exec backend npm run migrate:up

# 4. Verify services
curl http://localhost:5000/health
# → {"status":"OK"}
```

---

## Production Deployment

### Step 1: Prepare the Server

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin
```

### Step 2: Transfer Project Files

```bash
# Option A: Git clone
git clone <repo-url> /opt/cognito
cd /opt/cognito

# Option B: SCP / SFTP from local
```

### Step 3: Configure Production Environment

```bash
# Root .env
cp .env.example .env
nano .env  # Fill in strong passwords

# Backend .env
cd backend
cp .env.example .env
nano .env  # Fill in all API keys, DB URL, JWT secret

# Frontend .env.local
echo "NEXT_PUBLIC_API_URL=https://api.yourdomain.com" > frontend/.env.local
```

### Step 4: Build and Start

```bash
docker-compose -f docker-compose.yml up -d --build
docker-compose exec backend npm run migrate:up
```

### Step 5: Configure Nginx Reverse Proxy (Recommended)

```nginx
# /etc/nginx/sites-available/cognito
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    # SSL certs (use Certbot/Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Backend API
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Container Management

| Command | Description |
|---|---|
| `docker-compose ps` | Check running services |
| `docker-compose logs -f backend` | Tail backend logs |
| `docker-compose logs -f frontend` | Tail frontend logs |
| `docker-compose restart backend` | Restart backend only |
| `docker-compose down` | Stop all containers |
| `docker-compose up -d` | Start without rebuilding |
| `docker-compose up -d --build` | Rebuild and restart |
| `docker-compose exec backend npm run migrate:up` | Run DB migrations |

---

## Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U admin app_db > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U admin app_db < backup_20260907.sql
```

---

## Health Monitoring

```bash
# Backend health check
curl http://localhost:5000/health

# Container status
docker-compose ps

# Resource usage
docker stats
```

---

## External Services Configuration

| Service | Where to Configure |
|---|---|
| Cloudinary | https://cloudinary.com → Dashboard → API Keys |
| Google OAuth | https://console.cloud.google.com → APIs → Credentials → OAuth |
| PayOS | https://payos.vn → Developer Dashboard |
| Google Gemini | https://aistudio.google.com → API Keys |
| OpenAI | https://platform.openai.com → API Keys |
| Groq | https://console.groq.com → API Keys |
| SMTP | Gmail: Enable App Passwords → 16-char app password |

---

## CI/CD Notes

No CI/CD pipeline is configured yet. Recommended approach:

```
GitHub Actions → Docker Build → Docker Push → SSH deploy → docker-compose pull && up -d
```

The `.github/` directory is present for future GitHub Actions workflows.
