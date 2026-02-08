# FlowForge AI - Production Deployment Guide

Complete guide for deploying FlowForge AI to production environments.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Deployment Options](#deployment-options)
   - [Vercel](#vercel-deployment)
   - [Railway](#railway-deployment)
   - [Docker](#docker-deployment)
   - [VPS/Bare Metal](#vps-deployment)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Security Considerations](#security-considerations)
9. [Scaling Guide](#scaling-guide)

---

## Pre-Deployment Checklist

### Required Services

- [ ] **PostgreSQL Database** (Neon, Supabase, Railway, or self-hosted)
- [ ] **Redis Instance** (Upstash, Redis Cloud, or self-hosted)
- [ ] **Tambo AI Account** ([tambo.co](https://tambo.co))
- [ ] **Domain Name** (for production URL)
- [ ] **SSL Certificate** (usually handled by platform)

### Required Credentials

- [ ] Generate `ENCRYPTION_KEY`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Get Tambo AI API key from dashboard
- [ ] PostgreSQL connection string
- [ ] Redis connection string

### Optional Integrations

- [ ] Resend API key (for platform emails)
- [ ] Google OAuth credentials (for Sheets integration)
- [ ] Slack Bot token (for Slack messaging)
- [ ] Other OAuth providers as needed

---

## Infrastructure Requirements

### Minimum Specifications

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **App Server** | 1 vCPU, 512MB RAM | 2 vCPU, 2GB RAM |
| **Worker Process** | 1 vCPU, 512MB RAM | 2 vCPU, 1GB RAM |
| **PostgreSQL** | 1GB storage | 10GB+ storage |
| **Redis** | 25MB | 100MB+ |

---

## Environment Setup

### Step 1: Create `.env.production`

```bash
# ============ REQUIRED ============

# Tambo AI
NEXT_PUBLIC_TAMBO_API_KEY=your_production_key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/flowforge?sslmode=require

# Redis
REDIS_URL=redis://:password@host:6379

# Security
ENCRYPTION_KEY=your_64_char_hex_key_here

# URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# ============ OPTIONAL ============

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=FlowForge <noreply@yourdomain.com>

# Slack
SLACK_BOT_TOKEN=xoxb-xxxxx

# OAuth (add as needed)
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
```

### Step 2: Validate Configuration

```bash
# Test database connection
npx drizzle-kit studio

# Test Redis connection
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(r => console.log('Redis:', r)).catch(e => console.error(e));
"
```

---

## Database Setup

### Option A: Neon (Serverless PostgreSQL)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string (with `?sslmode=require`)
4. Run migrations:
   ```bash
   DATABASE_URL="your_neon_url" npm run db:push
   ```

### Option B: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings > Database > Connection string
3. Copy the URI (Transaction pooler for serverless)
4. Run migrations:
   ```bash
   DATABASE_URL="your_supabase_url" npm run db:push
   ```

### Option C: Railway

1. Add PostgreSQL plugin to your project
2. Copy `DATABASE_URL` from variables
3. Migrations run automatically with deploy

### Run Migrations

```bash
# Push schema (development/simple)
npm run db:push

# Or generate and run migrations (production)
npm run db:generate
npm run db:migrate
```

---

## Deployment Options

### Vercel Deployment

**Best for:** Serverless, auto-scaling, zero-config

**Limitations:** Worker needs separate deployment

#### Steps:

1. **Connect Repository**
   ```bash
   npx vercel link
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard > Project > Settings > Environment Variables
   - Add all variables from `.env.production`

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

4. **Deploy Worker Separately**

   Option A: Railway (recommended)
   ```bash
   # Create railway.json
   {
     "build": { "builder": "nixpacks" },
     "deploy": { "startCommand": "npm run worker" }
   }
   ```

   Option B: Upstash QStash (serverless)
   - Convert workflow execution to HTTP endpoints
   - Use QStash to trigger executions

#### Vercel Configuration (`vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

---

### Railway Deployment

**Best for:** All-in-one platform, easy setup, includes worker

#### Steps:

1. **Create Project**
   - Go to [railway.app](https://railway.app)
   - New Project > Deploy from GitHub

2. **Add Services**
   - Add PostgreSQL (click + New > Database > PostgreSQL)
   - Add Redis (click + New > Database > Redis)

3. **Configure App Service**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Add environment variables

4. **Create Worker Service**
   - Click + New > Empty Service
   - Connect same GitHub repo
   - Start Command: `npm run worker`
   - Share same environment variables

5. **Set Environment Variables**
   - `DATABASE_URL` → Click PostgreSQL service → Connect → copy URL
   - `REDIS_URL` → Click Redis service → Connect → copy URL
   - Add all other variables

---

### Docker Deployment

**Best for:** Self-hosted, full control, Kubernetes

#### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://flowforge:password@postgres:5432/flowforge
      - REDIS_URL=redis://redis:6379
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - NEXT_PUBLIC_TAMBO_API_KEY=${NEXT_PUBLIC_TAMBO_API_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - DATABASE_URL=postgresql://flowforge:password@postgres:5432/flowforge
      - REDIS_URL=redis://redis:6379
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    command: npm run worker

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=flowforge
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=flowforge
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Deploy Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f app worker

# Run migrations
docker-compose exec app npm run db:push

# Scale workers
docker-compose up -d --scale worker=3
```

---

### VPS Deployment

**Best for:** Budget hosting, full control

#### Using PM2

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem.config.js**
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'flowforge-app',
         script: 'npm',
         args: 'start',
         env: {
           NODE_ENV: 'production',
           PORT: 3000,
         },
       },
       {
         name: 'flowforge-worker',
         script: 'npm',
         args: 'run worker',
         env: {
           NODE_ENV: 'production',
         },
       },
     ],
   };
   ```

3. **Deploy**
   ```bash
   # Build
   npm run build

   # Start with PM2
   pm2 start ecosystem.config.js

   # Save process list
   pm2 save

   # Setup startup script
   pm2 startup
   ```

4. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Post-Deployment Steps

### 1. Verify Health

```bash
# Check app health
curl https://yourdomain.com/api/health

# Expected response:
# {"status":"healthy","timestamp":"..."}
```

### 2. Run Database Migrations

```bash
# If not done during deployment
npm run db:push
```

### 3. Create Admin User

Access the app and sign up. First user can be promoted to admin via database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

### 4. Configure OAuth Redirect URIs

Update OAuth apps with production URLs:

| Provider | Redirect URI |
|----------|--------------|
| Google | `https://yourdomain.com/api/oauth/google/callback` |
| GitHub | `https://yourdomain.com/api/oauth/github/callback` |
| Microsoft | `https://yourdomain.com/api/oauth/microsoft/callback` |

### 5. Test Workflows

1. Create a test workflow
2. Trigger via webhook
3. Verify execution completes

---

## Monitoring & Maintenance

### Health Checks

```bash
# App health
curl https://yourdomain.com/api/health

# Database connection
# Check logs for "Database connected" message

# Worker status
# Check logs for "Worker is running" message
```

### Log Management

```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f --tail=100

# Vercel logs
vercel logs
```

### Backup Strategy

```bash
# Database backup (PostgreSQL)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm ci

# Build
npm run build

# Run migrations
npm run db:push

# Restart services
pm2 restart all
# or
docker-compose up -d --build
```

---

## Security Considerations

### Environment Variables

- Never commit `.env.local` or `.env.production`
- Use platform secrets management
- Rotate `ENCRYPTION_KEY` only if credentials need reset

### Network Security

- Enable HTTPS only (redirect HTTP)
- Configure CORS properly
- Use WAF if available (Cloudflare, AWS WAF)

### Database Security

- Use strong passwords
- Enable SSL for connections
- Restrict network access (VPC, firewall rules)
- Regular backups

### Application Security

- Rate limiting on API routes
- Input validation (handled by Zod)
- SQL injection prevention (handled by Drizzle ORM)
- XSS prevention (React handles this)

---

## Scaling Guide

### Horizontal Scaling

**Workers:**
```bash
# Docker
docker-compose up -d --scale worker=5

# PM2
pm2 scale flowforge-worker 5

# Kubernetes
kubectl scale deployment flowforge-worker --replicas=5
```

**App (behind load balancer):**
```bash
# Run multiple instances
pm2 start ecosystem.config.js -i max
```

### Vertical Scaling

- Increase container/VM resources
- Upgrade database tier
- Upgrade Redis tier

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_workflows_user ON workflows(user_id);
CREATE INDEX idx_executions_workflow ON executions(workflow_id);
CREATE INDEX idx_executions_status ON executions(status);
```

### Redis Optimization

- Enable persistence for durability
- Configure max memory policy
- Use Redis Cluster for high availability

---

## Troubleshooting Production Issues

### App Won't Start

```bash
# Check logs
npm run build 2>&1 | tail -50

# Verify environment
node -e "console.log(process.env.DATABASE_URL ? 'DB OK' : 'DB MISSING')"
```

### Worker Not Processing

```bash
# Check Redis connection
redis-cli -u $REDIS_URL ping

# Check queue status
# Look for "waiting" or "active" jobs in logs
```

### OAuth Errors

- Verify redirect URIs match exactly
- Check client ID/secret are correct
- Ensure `NEXT_PUBLIC_APP_URL` matches production domain

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check SSL mode
# Add ?sslmode=require for cloud databases
```

---

## Support

- **Issues**: GitHub Issues
- **Logs**: Check platform-specific logging
- **Tambo AI**: [docs.tambo.co](https://docs.tambo.co)
