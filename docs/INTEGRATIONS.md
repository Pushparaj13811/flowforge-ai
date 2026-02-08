# FlowForge AI - Integration Setup Guide

This guide documents all external service integrations available in FlowForge AI, including setup instructions, required credentials, and implementation status.

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [Fully Functional Integrations](#fully-functional-integrations)
3. [OAuth Providers](#oauth-providers)
4. [Frontend-Only Features](#frontend-only-features)
5. [Environment Variables Reference](#environment-variables-reference)

---

## Integration Overview

FlowForge AI supports three types of credential management:

| Type | Description | Use Case |
|------|-------------|----------|
| **User-Provided** | User configures their own API keys in Settings | Full control, no limits |
| **Platform-Provided** | FlowForge provides shared credentials | Quick start, usage limits apply |
| **OAuth** | User authorizes via OAuth flow | Google Sheets, GitHub, etc. |

---

## Fully Functional Integrations

### 1. Slack

**Status:** Fully Implemented
**Handler:** `src/lib/execution/handlers/slack-handler.ts`

#### Setup Instructions

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app or select existing one
3. Navigate to **OAuth & Permissions**
4. Add Bot Token Scopes:
   - `chat:write` - Send messages
   - `channels:read` - List channels
   - `users:read` - List users
5. Install the app to your workspace
6. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

#### Required Credentials

| Field | Description |
|-------|-------------|
| `botToken` | Bot User OAuth Token (xoxb-...) |

#### Workflow Node Configuration

```json
{
  "integrationId": "your-integration-id",
  "channel": "#general",
  "message": "Hello from FlowForge!"
}
```

---

### 2. Discord

**Status:** Fully Implemented
**Handler:** `src/lib/execution/handlers/discord-handler.ts`

#### Setup Instructions

1. Go to your Discord server settings
2. Navigate to **Integrations** > **Webhooks**
3. Create a new webhook
4. Copy the webhook URL

#### Required Credentials

| Field | Description |
|-------|-------------|
| `webhookUrl` | Discord webhook URL |

#### Workflow Node Configuration

```json
{
  "webhookUrl": "https://discord.com/api/webhooks/...",
  "content": "Hello from FlowForge!",
  "username": "FlowForge Bot",
  "avatarUrl": "https://example.com/avatar.png"
}
```

---

### 3. Microsoft Teams

**Status:** Fully Implemented
**Handler:** `src/lib/execution/handlers/teams-handler.ts`

#### Setup Instructions

1. Open Microsoft Teams
2. Go to the channel where you want notifications
3. Click **...** > **Connectors**
4. Find **Incoming Webhook** and click **Configure**
5. Name your webhook and copy the URL

#### Required Credentials

| Field | Description |
|-------|-------------|
| `webhookUrl` | Teams incoming webhook URL |

#### Workflow Node Configuration

```json
{
  "webhookUrl": "https://outlook.office.com/webhook/...",
  "title": "Workflow Alert",
  "text": "Your workflow completed successfully!"
}
```

---

### 4. Email (Resend)

**Status:** Fully Implemented (Hybrid Credentials)
**Handler:** `src/lib/execution/handlers/resend-handler.ts`

This integration supports both platform-provided and user-provided credentials.

#### Platform-Provided Mode

No setup required! FlowForge provides email sending with usage limits:
- **Limit:** 100 emails/month per user (configurable via `PLATFORM_EMAIL_MONTHLY_LIMIT`)

#### User-Provided Mode

1. Sign up at [Resend](https://resend.com)
2. Navigate to **API Keys**
3. Create a new API key with **Full Access**
4. Verify your sending domain

#### Required Credentials

| Field | Description |
|-------|-------------|
| `apiKey` | Resend API key |
| `fromEmail` | Verified sender email address |

#### Environment Variables (Platform Mode)

```bash
RESEND_API_KEY=re_xxxxx
EMAIL_FROM="FlowForge <noreply@flowforge.ai>"
PLATFORM_EMAIL_MONTHLY_LIMIT=100
```

---

### 5. OpenAI

**Status:** Fully Implemented
**Handler:** `src/lib/execution/handlers/openai-handler.ts`

#### Setup Instructions

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to **API Keys**
3. Create a new secret key
4. (Optional) Set up organization ID for team usage

#### Required Credentials

| Field | Description |
|-------|-------------|
| `apiKey` | OpenAI API key (sk-...) |
| `organization` | (Optional) Organization ID |

#### Supported Actions

- **Chat Completion** - GPT-4, GPT-3.5 conversations
- **Embeddings** - Text embeddings for RAG

#### Workflow Node Configuration

```json
{
  "integrationId": "your-integration-id",
  "model": "gpt-4-turbo-preview",
  "prompt": "Summarize this document...",
  "systemPrompt": "You are a helpful assistant.",
  "temperature": 0.7,
  "maxTokens": 1000
}
```

---

### 6. Anthropic Claude

**Status:** Fully Implemented
**Handler:** `src/lib/execution/handlers/anthropic-handler.ts`

#### Setup Instructions

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Navigate to **API Keys**
3. Create a new API key

#### Required Credentials

| Field | Description |
|-------|-------------|
| `apiKey` | Anthropic API key |

#### Workflow Node Configuration

```json
{
  "integrationId": "your-integration-id",
  "model": "claude-3-5-sonnet-20241022",
  "prompt": "Analyze this data...",
  "system": "You are an expert data analyst.",
  "maxTokens": 1024
}
```

---

### 7. Stripe

**Status:** Fully Implemented
**Handler:** `src/lib/execution/handlers/stripe-handler.ts`

#### Setup Instructions

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **API Keys**
3. Copy the **Secret key** (use test key for development)
4. (Optional) Set up webhook endpoint for event notifications

#### Required Credentials

| Field | Description |
|-------|-------------|
| `apiKey` | Stripe secret key (sk_live_... or sk_test_...) |
| `webhookSecret` | (Optional) Webhook signing secret |

#### Supported Actions

- Create Payment Intent
- Create Customer
- Create Checkout Session
- List Payments
- Retrieve Payment

---

### 8. Twilio (SMS/MMS)

**Status:** Fully Implemented
**Handler:** `src/lib/execution/handlers/twilio-handler.ts`

#### Setup Instructions

1. Sign up at [Twilio](https://www.twilio.com)
2. Go to **Console Dashboard**
3. Copy your **Account SID** and **Auth Token**
4. Buy or port a phone number

#### Required Credentials

| Field | Description |
|-------|-------------|
| `accountSid` | Twilio Account SID |
| `authToken` | Twilio Auth Token |
| `fromNumber` | Your Twilio phone number (E.164 format) |

#### Supported Actions

- **Send SMS** - Text messages
- **Send MMS** - Messages with media
- **Lookup** - Phone number validation

#### Workflow Node Configuration

```json
{
  "integrationId": "your-integration-id",
  "to": "+15555551234",
  "body": "Your order has shipped!"
}
```

---

### 9. Google Sheets

**Status:** Fully Implemented (OAuth)
**Handler:** `src/lib/execution/handlers/google-sheets-handler.ts`

#### Setup Instructions

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google Sheets API** and **Google Drive API**
4. Navigate to **OAuth consent screen** and configure
5. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
6. Select **Web application**
7. Add authorized redirect URI: `https://your-domain.com/api/oauth/google/callback`
8. Copy **Client ID** and **Client Secret**

#### Environment Variables

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### OAuth Scopes

- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/userinfo.email`

#### Supported Actions

- **Read Rows** - Fetch data from spreadsheet
- **Append Rows** - Add new rows
- **Update Rows** - Modify existing rows
- **Create Spreadsheet** - Create new spreadsheet

---

### 10. HTTP/Webhooks

**Status:** Fully Implemented
**Handler:** `src/lib/execution/handlers/http-handler.ts`

Generic HTTP requests for any REST API.

#### Workflow Node Configuration

```json
{
  "url": "https://api.example.com/endpoint",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer token"
  },
  "body": {
    "key": "value"
  }
}
```

---

## OAuth Providers

The following OAuth providers are configured for integration connections:

### Google

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Scopes:** Drive, Sheets, User Email

### GitHub

```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

**Scopes:** repo, user:email, read:org

### Microsoft

```bash
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
```

**Scopes:** Files.ReadWrite, Calendars.ReadWrite

### Dropbox

```bash
DROPBOX_CLIENT_ID=your-client-id
DROPBOX_CLIENT_SECRET=your-client-secret
```

**Scopes:** files.content.write, files.content.read
**Note:** Uses PKCE flow

### HubSpot

```bash
HUBSPOT_CLIENT_ID=your-client-id
HUBSPOT_CLIENT_SECRET=your-client-secret
```

**Scopes:** contacts, crm.objects.contacts.read, crm.objects.contacts.write

---

## Frontend-Only Features

The following features have UI components but are NOT connected to real backend services:

### 1. Push Notifications

**Location:** `src/lib/integrations/notifications.ts`

**Status:** Mock implementation only

The push notification system currently:
- Logs notifications to console
- Returns a mock notification ID
- Does NOT integrate with real push services

**To implement fully, choose one of:**
- Firebase Cloud Messaging (FCM)
- OneSignal
- Pusher Beams
- Custom Web Push with VAPID keys

**Required Environment Variables (not yet implemented):**
```bash
PUSH_NOTIFICATION_KEY=your-key
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### 2. Notification Preferences UI

**Location:** `src/app/app/settings/components/sections/NotificationsSection.tsx`

The notification preferences in Settings:
- UI toggles work and save to database
- Email notifications are sent via Resend (working)
- Push notifications are NOT delivered (mock only)

---

## Environment Variables Reference

### Required for Core Functionality

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Security
ENCRYPTION_KEY=32-byte-hex-key-for-credential-encryption
```

### Optional Integrations

```bash
# Email (Platform-provided)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM="FlowForge <noreply@flowforge.ai>"
PLATFORM_EMAIL_MONTHLY_LIMIT=100

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
DROPBOX_CLIENT_ID=
DROPBOX_CLIENT_SECRET=
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=

# Slack (Platform-provided, optional)
SLACK_BOT_TOKEN=xoxb-xxxx

# Logging
LOG_LEVEL=info
```

---

## Integration Status Summary

| Integration | Backend Handler | OAuth | User Credentials | Platform Credentials |
|-------------|-----------------|-------|------------------|---------------------|
| Slack | Implemented | - | Supported | Optional |
| Discord | Implemented | - | Webhook URL | - |
| Teams | Implemented | - | Webhook URL | - |
| Email (Resend) | Implemented | - | Supported | Supported |
| OpenAI | Implemented | - | Supported | - |
| Anthropic | Implemented | - | Supported | - |
| Stripe | Implemented | - | Supported | - |
| Twilio | Implemented | - | Supported | - |
| Google Sheets | Implemented | Google | OAuth Token | - |
| HTTP/Webhooks | Implemented | - | Per-request | - |
| Push Notifications | Mock Only | - | - | Not Implemented |

---

## Adding New Integrations

To add a new integration:

1. Create handler in `src/lib/execution/handlers/`
2. Register handler in `src/lib/execution/handlers/index.ts`
3. Add integration type to `src/types/workflow.ts`
4. Create config component in `src/components/flow-editor/properties-panel/config-forms/`
5. Add OAuth provider if needed in `src/lib/oauth/providers.ts`
6. Document in this guide
