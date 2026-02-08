# FlowForge AI

**AI-Powered Workflow Automation Platform** — Build complex automation workflows through natural language conversation.

FlowForge AI combines the power of conversational AI (via [Tambo AI](https://tambo.co)) with a visual workflow builder to let users create, configure, and execute automation workflows without writing code.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Production Deployment](#production-deployment)
- [Integrations Setup](#integrations-setup)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Conversational Workflow Builder** — Describe what you want to automate in plain English
- **Visual Workflow Editor** — Drag-and-drop interface with React Flow
- **20+ Integration Handlers** — Email, Slack, Discord, Stripe, Google Sheets, AI models, and more
- **Conditional Logic** — Branch workflows based on data conditions
- **Loop & Transform** — Process arrays and transform data between steps
- **Secure Credential Storage** — AES-256-GCM encrypted credential vault
- **Background Job Processing** — BullMQ-powered reliable execution
- **OAuth 2.0 Integrations** — Connect Google, GitHub, Microsoft, and more
- **Webhook Triggers** — Start workflows via HTTP webhooks
- **Version Control** — Workflow versioning with rollback support

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **UI** | React 19, Tailwind CSS 4, Radix UI, Framer Motion |
| **Workflow Editor** | React Flow (@xyflow/react) |
| **AI Integration** | Tambo AI SDK |
| **Database** | PostgreSQL + Drizzle ORM |
| **Job Queue** | BullMQ + Redis |
| **Authentication** | Custom session-based auth with bcrypt |
| **Encryption** | AES-256-GCM (Node.js crypto) |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 14+
- **Redis** 6+ (local or cloud like Upstash)
- **Tambo AI API Key** from [tambo.co](https://tambo.co)

### Installation

```bash
# Clone the repository
git clone https://github.com/Pushparaj13811/flowforge-ai.git
cd flowforge-ai

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your values (see Environment Variables section)

# Push database schema
npm run db:push

# Start development server
npm run dev

# In a separate terminal, start the worker
npm run worker:dev
```

The app will be running at `http://localhost:3001`

---

## Environment Variables

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `NEXT_PUBLIC_TAMBO_API_KEY` | Tambo AI API key for conversational UI | Sign up at [tambo.co](https://tambo.co) |
| `DATABASE_URL` | PostgreSQL connection string | Your PostgreSQL instance |
| `ENCRYPTION_KEY` | 64-character hex key for credential encryption | Generate below |
| `NEXT_PUBLIC_APP_URL` | Your application URL | `http://localhost:3001` (dev) or your domain |

#### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional Variables

#### Redis & Queue System

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection for BullMQ |

#### Platform Email (Resend)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for platform emails |
| `EMAIL_FROM` | Sender address (e.g., `FlowForge <noreply@yourdomain.com>`) |
| `PLATFORM_EMAIL_MONTHLY_LIMIT` | Monthly email limit (default: 100) |

#### Slack Integration

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Bot token (`xoxb-...`) for Slack messaging |

#### OAuth Providers

| Provider | Variables | Console URL |
|----------|-----------|-------------|
| **Google** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| **GitHub** | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | [GitHub Developer Settings](https://github.com/settings/developers) |
| **Microsoft** | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) |
| **Dropbox** | `DROPBOX_CLIENT_ID`, `DROPBOX_CLIENT_SECRET` | [Dropbox Developers](https://www.dropbox.com/developers/apps) |
| **HubSpot** | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` | [HubSpot Developer](https://app.hubspot.com/developer) |

---

## Database Setup

### Using Local PostgreSQL

```bash
# Create database
createdb flowforge

# Set DATABASE_URL in .env.local
DATABASE_URL=postgresql://username:password@localhost:5432/flowforge
```

### Using Cloud PostgreSQL (Neon, Supabase, etc.)

1. Create a PostgreSQL database in your cloud provider
2. Copy the connection string to `DATABASE_URL`
3. Ensure SSL is enabled if required

### Run Migrations

```bash
# Push schema to database (development)
npm run db:push

# Generate migration files (production)
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

---

## Running the Application

### Development

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start background worker
npm run worker:dev
```

### Production

```bash
# Build the application
npm run build

# Start the production server
npm start

# Start the worker (in separate process/container)
npm run worker
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 3001) |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run worker` | Start production worker |
| `npm run worker:dev` | Start worker with hot reload |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed initial data |

---

## Production Deployment

### Vercel Deployment

1. **Connect Repository** to Vercel
2. **Set Environment Variables** in Vercel dashboard
3. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Worker Process**: Vercel doesn't support long-running processes. Options:
   - Use Vercel Cron for scheduled workflows
   - Deploy worker to Railway, Render, or Fly.io
   - Use Upstash QStash for serverless queuing

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - NEXT_PUBLIC_TAMBO_API_KEY=${NEXT_PUBLIC_TAMBO_API_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    depends_on:
      - redis
      - postgres

  worker:
    build: .
    command: npm run worker
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=flowforge
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=flowforge
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Railway/Render Deployment

1. Create a new project
2. Add PostgreSQL and Redis addons
3. Set environment variables
4. Deploy from GitHub
5. Create separate service for worker process

---

## Integrations Setup

### Google OAuth (Sheets, Drive, Calendar)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable APIs: Google Sheets API, Google Drive API
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URI: `{YOUR_APP_URL}/api/oauth/google/callback`
6. Copy Client ID and Secret to `.env.local`

### Slack Bot

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app
3. Add Bot Token Scopes: `chat:write`, `chat:write.public`
4. Install to workspace
5. Copy Bot Token (`xoxb-...`) to `.env.local`

### Stripe

Users add their own Stripe API keys through the integrations UI. No global configuration needed.

### Twilio

Users add their own Twilio credentials through the integrations UI:
- Account SID
- Auth Token
- Phone Number

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List workflows |
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows/:id` | Get workflow |
| PATCH | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/workflows/:id/execute` | Execute workflow |
| GET | `/api/workflows/:id/versions` | Get versions |
| POST | `/api/workflows/:id/rollback` | Rollback version |

### Executions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/executions` | List executions |
| GET | `/api/executions/:id` | Get execution details |

### Integrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations` | List integrations |
| POST | `/api/integrations` | Add integration |
| DELETE | `/api/integrations/:id` | Remove integration |
| POST | `/api/integrations/:id/test` | Test integration |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/:workflowId/:triggerId` | Trigger workflow |
| POST | `/api/webhooks/trigger/:token` | Token-based trigger |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Tambo Chat  │  │ Flow Editor  │  │ Dashboard/Settings │  │
│  │ (AI Builder)│  │ (React Flow) │  │   (Integrations)   │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                      │
│  ┌───────────┐  ┌────────────┐  ┌─────────────────────────┐ │
│  │ Workflows │  │ Executions │  │ Integrations (OAuth)    │ │
│  │   CRUD    │  │   Queue    │  │ Credential Vault        │ │
│  └───────────┘  └────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │     Redis     │ │   BullMQ Worker  │
│   (Drizzle ORM)  │ │  (Job Queue)  │ │  (Execution)     │
│                  │ │               │ │                  │
│ • Users          │ │ • Job Queue   │ │ • Node Handlers  │
│ • Workflows      │ │ • Session     │ │ • Retry Logic    │
│ • Executions     │ │   Cache       │ │ • Error Handling │
│ • Integrations   │ │               │ │                  │
│   (encrypted)    │ │               │ │                  │
└──────────────────┘ └───────────────┘ └──────────────────┘
                                                │
                                                ▼
                              ┌─────────────────────────────┐
                              │     External Services       │
                              │ • Slack, Discord, Teams     │
                              │ • Email (Resend)            │
                              │ • Stripe, Twilio            │
                              │ • Google Sheets             │
                              │ • OpenAI, Anthropic         │
                              └─────────────────────────────┘
```

### Node Handlers

The system supports these workflow node types:

| Category | Handler Types |
|----------|---------------|
| **Triggers** | `trigger:webhook`, `trigger:schedule`, `trigger:form`, `trigger:manual` |
| **Email** | `email:resend`, `email:smtp`, `email:sendgrid` |
| **Messaging** | `slack:send-message`, `discord:webhook`, `teams:webhook` |
| **AI** | `openai:chat`, `anthropic:claude` |
| **Data** | `google-sheets:read`, `google-sheets:append`, `google-sheets:update` |
| **Payments** | `stripe:create-payment-intent`, `stripe:create-customer`, `stripe:refund` |
| **SMS** | `twilio:send-sms`, `twilio:send-mms` |
| **HTTP** | `http:request` |
| **Logic** | `condition`, `delay`, `loop:foreach`, `loop:repeat`, `filter`, `switch`, `transform` |

---

## Troubleshooting

### Common Issues

#### "Failed to connect to database"
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall rules for cloud databases

#### "Worker not processing jobs"
- Ensure Redis is running
- Verify `REDIS_URL` is correct
- Check worker logs: `npm run worker:dev`

#### "OAuth callback failed"
- Verify `NEXT_PUBLIC_APP_URL` matches your domain
- Check redirect URIs in OAuth provider console
- Ensure client ID and secret are correct

#### "Encryption error"
- Ensure `ENCRYPTION_KEY` is exactly 64 hex characters
- Generate a new key if needed
- Don't change key after storing credentials

#### "Tambo AI not responding"
- Verify `NEXT_PUBLIC_TAMBO_API_KEY` is valid
- Check Tambo service status at [tambo.co](https://tambo.co)

### Logs

```bash
# View application logs
npm run dev 2>&1 | tee app.log

# View worker logs
npm run worker:dev 2>&1 | tee worker.log

# Set debug mode for worker
DEBUG=true npm run worker:dev
```

### Health Check

```bash
# Check if API is healthy
curl http://localhost:3001/api/health
```

---

## License

MIT License - see LICENSE file for details.

---

## Support

- **Documentation**: This README
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Tambo AI**: [tambo.co/docs](https://docs.tambo.co)
