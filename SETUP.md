# FlowForge AI — First-Time Setup Guide

This guide walks you through getting FlowForge AI running for the first time.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Option A — Single-Click Launcher (Linux, recommended)](#3-option-a--single-click-launcher-linux-recommended)
4. [Option B — Manual Setup (any OS)](#4-option-b--manual-setup-any-os)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [OAuth Integration Setup](#6-oauth-integration-setup)
7. [Database Management](#7-database-management)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### Required on all platforms

| Tool | Minimum version | Check |
|------|----------------|-------|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Docker | 20.x | `docker --version` |
| Docker Compose | v2 (plugin) or v1 | `docker compose version` |

### Required accounts

| Service | Purpose | Sign up |
|---------|---------|---------|
| **Tambo AI** | Powers the AI chat and generative UI | [app.tambo.co](https://app.tambo.co/dashboard) — free tier available |

### Install on Ubuntu / Debian

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 nodejs npm curl postgresql-client xdg-utils

# Add your user to the docker group (avoids needing sudo for docker)
sudo usermod -aG docker $USER

# Log out and back in for the group change to take effect
```

### Install on macOS

```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop/
# Then install Node.js from https://nodejs.org/ or via nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/Pushparaj13811/flowforge-ai.git
cd flowforge-ai
```

---

## 3. Option A — Single-Click Launcher (Linux, recommended)

This is the fastest path. One script handles everything: Docker services, database setup, Next.js server, worker, and opens your browser.

### Step 1 — Run the installer (once)

```bash
chmod +x install.sh && ./install.sh
```

The installer:
- Makes `start.sh` executable
- Registers "FlowForge AI" in your Linux app menu
- Optionally creates a Desktop shortcut for double-click launch

### Step 2 — Get your Tambo API key

Go to [app.tambo.co/dashboard](https://app.tambo.co/dashboard) and copy your API key. You will be prompted for it on first launch.

### Step 3 — Launch the app

**Option A1 — From your app menu or Desktop:**
Search "FlowForge AI" in your app launcher and click it, or double-click the Desktop shortcut.

**Option A2 — From the terminal:**
```bash
./start.sh
```

### What happens on first launch

```
[INFO ] Checking prerequisites          ← verifies docker, node, npm, etc.
[INFO ] Populating .env.local           ← asks for Tambo API key, auto-fills the rest
[INFO ] Installing npm dependencies     ← only on first run (~30s)
[INFO ] Starting Docker services        ← spins up PostgreSQL + Redis
[INFO ] Running database migrations     ← pushes schema + seeds template workflows
[INFO ] Starting Next.js on port 3001   ← dev server
[INFO ] Starting BullMQ worker          ← workflow execution engine
[INFO ] Waiting for /api/health         ← polls until app is ready
[OK   ] Opening browser at http://localhost:3001
```

Subsequent launches skip migrations and npm install — startup takes about 10–15 seconds.

### Stopping the app

Press `Ctrl+C` in the terminal. Docker services are stopped (data is preserved). To wipe all data:
```bash
docker compose down -v
```

---

## 4. Option B — Manual Setup (any OS)

Use this if you're not on Linux or prefer full control.

### Step 1 — Start infrastructure

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Verify both are healthy
docker compose ps
```

Expected output — both services should show `healthy`:
```
NAME                 STATUS
flowforge_postgres   running (healthy)
flowforge_redis      running (healthy)
```

### Step 2 — Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.local .env.local.backup  # if you already have one
```

Open `.env.local` and set at minimum:

```bash
# Required
DATABASE_URL=postgresql://flowforge:flowforge_dev_password@localhost:5432/flowforge
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here   # from app.tambo.co

# Auto-generated — leave as-is if already set, otherwise generate:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_char_hex_key_here
```

See [Section 5](#5-environment-variables-reference) for all available variables.

### Step 3 — Install dependencies

```bash
npm install
```

### Step 4 — Set up the database

**First time only:**

```bash
# Push the schema (fast, dev-friendly — no migration files needed)
npm run db:push

# Seed the database with 6 example workflow templates
npm run db:seed
```

> For production or teams, use migration files instead:
> ```bash
> npm run db:generate   # generate SQL migration files
> npm run db:migrate    # apply migrations
> ```

### Step 5 — Start the app

You need **two terminal windows** running simultaneously:

**Terminal 1 — Next.js dev server:**
```bash
npm run dev
```
The app runs at [http://localhost:3001](http://localhost:3001)

**Terminal 2 — BullMQ workflow worker:**
```bash
npm run worker:dev
```

> The worker is required for workflow execution. Without it, workflows will queue but never run.

### Step 6 — Open the app

Navigate to [http://localhost:3001](http://localhost:3001) in your browser.

---

## 5. Environment Variables Reference

All variables go in `.env.local` in the project root. This file is gitignored — never commit it.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://flowforge:flowforge_dev_password@localhost:5432/flowforge` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `ENCRYPTION_KEY` | 64-char hex key (32 bytes) for encrypting stored credentials. **Generate once and keep it.** Changing it makes all stored credentials unreadable. | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app — used for OAuth redirect URIs and webhook base URLs | `http://localhost:3001` |
| `NEXT_PUBLIC_TAMBO_API_KEY` | Tambo AI API key for the conversational UI | Get from [app.tambo.co](https://app.tambo.co/dashboard) |

### Optional — OAuth integrations

Only needed when users connect external services. Register an OAuth app in each provider's developer console. Use this redirect URI:
```
{NEXT_PUBLIC_APP_URL}/api/oauth/{provider}/callback
```

| Variable | Provider | Developer Console |
|----------|----------|------------------|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub | [github.com/settings/developers](https://github.com/settings/developers) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google (Drive, Sheets, Gmail) | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | Microsoft / Azure AD | [portal.azure.com](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps) |
| `DROPBOX_CLIENT_ID` / `DROPBOX_CLIENT_SECRET` | Dropbox | [dropbox.com/developers](https://www.dropbox.com/developers/apps) |
| `HUBSPOT_CLIENT_ID` / `HUBSPOT_CLIENT_SECRET` | HubSpot | [developers.hubspot.com](https://developers.hubspot.com) |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | Slack OAuth | [api.slack.com/apps](https://api.slack.com/apps) |

### Optional — Email and workflow actions

| Variable | Default | Description |
|----------|---------|-------------|
| `SLACK_BOT_TOKEN` | — | Bot token for Slack workflow actions (separate from OAuth) |
| `RESEND_API_KEY` | — | API key for sending emails via [resend.com](https://resend.com) |
| `EMAIL_FROM` | `noreply@flowforge.ai` | Default sender address for platform emails |
| `PLATFORM_EMAIL_MONTHLY_LIMIT` | `100` | Per-user monthly email cap |
| `NEXT_PUBLIC_TAMBO_URL` | `https://api.tambo.co` | Tambo API base URL (only change for self-hosted) |
| `LOG_LEVEL` | `info` | Log verbosity: `debug` \| `info` \| `warn` \| `error` |
| `DEBUG` | `false` | Set `true` for verbose worker debug output |

---

## 6. OAuth Integration Setup

To let users connect external services (GitHub, Google, Slack, etc.) to their workflows:

### GitHub

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. Set **Authorization callback URL** to: `http://localhost:3001/api/oauth/github/callback`
3. Copy **Client ID** and **Client Secret** to `.env.local`

### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create Credentials** → **OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Add authorized redirect URI: `http://localhost:3001/api/oauth/google/callback`
4. Enable these APIs: Google Drive API, Google Sheets API (as needed)
5. Copy **Client ID** and **Client Secret** to `.env.local`

### Slack

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Under **OAuth & Permissions** → add redirect URL: `http://localhost:3001/api/oauth/slack/callback`
3. Add required bot scopes (e.g., `chat:write`, `channels:read`)
4. Copy **Client ID** and **Client Secret** to `.env.local`
5. Install the app to your workspace and copy the **Bot User OAuth Token** as `SLACK_BOT_TOKEN`

> For production, replace `localhost:3001` with your actual domain in all redirect URIs.

---

## 7. Database Management

### View data visually (Drizzle Studio)

```bash
npm run db:studio
```

Opens a local web UI at `https://local.drizzle.studio` to browse and edit your database.

### Reset the database (wipe all data)

```bash
# Stop the app first, then:
docker compose down -v           # removes Docker volumes (all data wiped)
docker compose up -d             # restart fresh containers
npm run db:push                  # re-apply schema
npm run db:seed                  # re-seed templates
```

### Apply schema changes during development

```bash
npm run db:push       # fast — directly syncs schema, no migration files
```

### Generate and apply migration files (for teams / production)

```bash
npm run db:generate   # creates a new SQL file in drizzle/
npm run db:migrate    # applies pending migrations
```

### Back up your data

```bash
docker exec flowforge_postgres pg_dump \
  -U flowforge flowforge > backup_$(date +%Y%m%d).sql
```

### Restore from backup

```bash
docker exec -i flowforge_postgres psql \
  -U flowforge flowforge < backup_20260101.sql
```

---

## 8. Troubleshooting

### Docker permission denied

```
Error: permission denied while trying to connect to the Docker daemon
```

**Fix:**
```bash
sudo usermod -aG docker $USER
# Log out and back in, then retry
```

### Port already in use

```
Error: listen EADDRINUSE :::3001
```

**Fix:** Find and stop the process using port 3001:
```bash
lsof -ti:3001 | xargs kill -9
```

For PostgreSQL (port 5432) or Redis (port 6379), stop any locally running instances:
```bash
sudo systemctl stop postgresql
sudo systemctl stop redis
```

### ENCRYPTION_KEY changed / credentials unreadable

If you see `Error: Invalid key length` or credentials fail to decrypt, your `ENCRYPTION_KEY` in `.env.local` doesn't match what was used to encrypt the stored credentials.

**Fix (development):**
```bash
# Wipe stored integrations from the database and re-connect them:
docker exec -it flowforge_postgres psql -U flowforge -d flowforge \
  -c "DELETE FROM integrations;"
```
Then reconnect your integrations via the Settings page.

### Database schema out of date

```
Error: column "xyz" does not exist
```

**Fix:** Push the latest schema:
```bash
npm run db:push
```

### Worker not processing jobs

Workflows queue but never run. Check the worker is running:
```bash
# If using manual setup — ensure this is running in a second terminal:
npm run worker:dev

# Check worker logs (if using start.sh):
tail -f logs/worker.log
```

Also verify Redis is healthy:
```bash
docker compose ps        # should show redis as healthy
redis-cli ping           # should return PONG
```

### Next.js dev server not starting

Check the logs:
```bash
# If using start.sh:
tail -f logs/nextjs.log

# Manual check — ensure DATABASE_URL and REDIS_URL are set:
cat .env.local | grep -E "DATABASE_URL|REDIS_URL|ENCRYPTION_KEY|NEXT_PUBLIC_"
```

### App starts but AI chat doesn't work

Ensure `NEXT_PUBLIC_TAMBO_API_KEY` is set to a valid key (not the placeholder `YOUR_TAMBO_API_KEY_HERE`):
```bash
grep NEXT_PUBLIC_TAMBO_API_KEY .env.local
```

Get a free key at [app.tambo.co/dashboard](https://app.tambo.co/dashboard).

---

## Quick Reference

```bash
# Start everything (Linux single-click)
./start.sh

# Start infrastructure only
docker compose up -d

# Start Next.js dev server
npm run dev                  # http://localhost:3001

# Start workflow worker (required for execution)
npm run worker:dev

# View / edit database
npm run db:studio

# Push schema changes
npm run db:push

# Stop Docker services (data preserved)
docker compose stop

# Wipe all data
docker compose down -v
```

---

*For questions or issues, open a GitHub issue at [github.com/Pushparaj13811/flowforge-ai](https://github.com/Pushparaj13811/flowforge-ai).*
