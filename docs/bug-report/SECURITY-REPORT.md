# FlowForge AI — Security Vulnerability Report

**Date:** 2026-05-06  
**Classification:** Internal  

This document focuses exclusively on security vulnerabilities that must be resolved before exposing this application to real users.

---

## SEVERITY CRITICAL

### [S-CRIT-01] Unauthenticated Webhook Execution

**File:** `src/lib/triggers/webhook-trigger.ts`  
**Impact:** Any actor on the internet can trigger any workflow.

No authentication is checked on incoming webhook requests. The code explicitly skips trigger validation with a TODO comment:

```typescript
// TODO: Validate trigger exists and is enabled
// For now, we'll skip this check
```

Webhooks also have no HMAC signature verification. Even if authentication tokens are configured in the database (`webhookToken`, `bearerToken`, `hmacSecret`), none are enforced.

**Fix:** Implement signature verification. For each request:
1. Look up the trigger record
2. Check auth method (`bearer`, `hmac`, `token`)
3. Validate the appropriate credential from the request

---

### [S-CRIT-02] Authorization Bypass — Integration Credentials

**File:** `src/lib/security/integration-credentials.ts`

Any authenticated user can retrieve any other user's decrypted third-party credentials (Slack tokens, GitHub tokens, Stripe keys, etc.) by providing any `integrationId`.

```typescript
// No userId parameter — no ownership check
export async function getIntegrationCredentials(integrationId: string) {
  const integration = await db.query.integrations.findFirst({
    where: eq(integrations.id, integrationId),
    // Missing: and(eq(integrations.id, integrationId), eq(integrations.userId, userId))
  });
```

**Fix:** Add `userId: string` parameter to all functions in this file. Add user ownership check to every query.

---

### [S-CRIT-03] Workflow Execution Authorization Broken

**File:** `src/app/api/workflows/[id]/execute/route.ts` — Line 56  
**File:** `src/lib/auth/utils.ts` — Line 226

`getSession` is aliased to `getCurrentUser`. `getCurrentUser` returns a user object. The ownership check `workflow.userId !== session.id` may work coincidentally (both have an `id` field) but the intent and semantics are wrong. More critically, webhook-triggered executions have no authorization at all.

---

## SEVERITY HIGH

### [S-HIGH-01] Open Redirect in OAuth Callback

**File:** `src/app/api/oauth/[provider]/callback/route.ts`

Redirects use `process.env.NEXT_PUBLIC_APP_URL` and `req.headers.get("origin")` without validation against an allowlist. If these values are attacker-influenced, users can be redirected to malicious sites.

**Fix:** Validate redirect targets against a hardcoded allowlist of known-good domains.

---

### [S-HIGH-02] Integration ID in OAuth Redirect URL

**File:** `src/app/api/oauth/[provider]/callback/route.ts` — Line 142

```
/app/settings?section=integrations?success=true&provider=github&integrationId=abc123
```

`integrationId` is sensitive — it can be used to probe for integration credentials. It appears in browser history, server access logs, and Referer headers on any subsequent navigation.

**Fix:** Use POST redirect or store `integrationId` in session/cookie and read it client-side.

---

### [S-HIGH-03] No CSRF Protection

All auth endpoints (`/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`, `/api/auth/change-password`) use cookie-based sessions but don't validate CSRF tokens.

**Fix:** Implement double-submit cookie pattern or SameSite=Strict cookies with a separate CSRF token header.

---

### [S-HIGH-04] No Rate Limiting on Auth Endpoints

Login, signup, and password change have no rate limiting. Brute-force and credential-stuffing attacks are unrestricted.

**Fix:** Implement rate limiting at the middleware level (e.g., using Upstash Redis rate limiter already available via the existing Redis client).

---

### [S-HIGH-05] Webhook Tokens Returned in API Responses

**File:** `src/app/api/workflows/[id]/triggers/route.ts`

`webhookToken`, `bearerToken`, and `hmacSecret` are returned in GET and POST responses. These should be treated like passwords and never returned after creation.

**Fix:** Redact these fields (return `"***"` or omit entirely) from API responses. Only show them once at creation time.

---

### [S-HIGH-06] Sessions Not Invalidated on New Login

When a user logs in, previously issued session tokens remain valid indefinitely. A stolen session token cannot be invalidated by the legitimate user simply by logging in again.

**Fix:** On login, either:
- Delete all other active sessions for the user, or
- Allow users to explicitly invalidate sessions via the Sessions management endpoint.

---

### [S-HIGH-07] API Key Scopes Not Enforced

**File:** `src/lib/auth/api-key.ts`

Scopes are stored and validated on the API key record but no endpoint actually checks whether the key's scopes permit the requested operation. A read-only API key can write data.

**Fix:** Define scope requirements per endpoint and check them in auth middleware.

---

### [S-HIGH-08] OAuth State Collision for Concurrent Flows

**File:** `src/app/api/oauth/[provider]/authorize/route.ts`

A user can initiate multiple concurrent OAuth flows, with each overwriting the previous state in Redis. The callback for the first flow will fail because the state was overwritten.

**Fix:** Use user+provider as the Redis key but also include a nonce. Store multiple pending states per user if needed.

---

## SEVERITY MEDIUM

### [S-MED-01] Development Encryption Key Lost on Restart

**File:** `src/lib/security/credential-vault.ts`

A new random key is generated every time the server starts in development. All previously encrypted credentials become permanently unreadable.

**Fix:** In development, use a deterministic key stored in `.env.local` (not committed). Add startup validation that the key is set.

---

### [S-MED-02] No Encryption Key Rotation

`keyVersion` is stored but never incremented. There's no mechanism to rotate the encryption key.

**Fix:** Implement a key rotation process: re-encrypt all values with new key, increment `keyVersion`.

---

### [S-MED-03] Sensitive Data in Logs

Integration objects with credentials may be logged in full. Apply a log sanitizer that strips keys like `accessToken`, `refreshToken`, `apiKey`, `secret`, `password` before logging.

---

### [S-MED-04] No Email Validation

**Files:** Login and signup routes

Email addresses are stored without validation. Malformed emails could bypass downstream validation or be used to probe user enumeration.

---

### [S-MED-05] No Password Strength Requirements

**File:** `src/app/api/auth/signup/route.ts`

Accepts passwords of any length and complexity. A minimum of 8 characters and at least 1 non-alpha character should be required.

---

### [S-MED-06] Missing Transaction on Signup

**File:** `src/app/api/auth/signup/route.ts`

User creation and session creation are not wrapped in a transaction. A failed session creation leaves an orphaned user that can never authenticate.

---

## Summary

| ID | Description | Severity | File |
|----|-------------|----------|------|
| S-CRIT-01 | No webhook authentication | Critical | `webhook-trigger.ts` |
| S-CRIT-02 | No integration credentials authorization | Critical | `integration-credentials.ts` |
| S-CRIT-03 | Workflow execution auth broken | Critical | `execute/route.ts`, `auth/utils.ts` |
| S-HIGH-01 | Open redirect in OAuth | High | `callback/route.ts` |
| S-HIGH-02 | Integration ID in URL | High | `callback/route.ts` |
| S-HIGH-03 | No CSRF protection | High | All auth routes |
| S-HIGH-04 | No rate limiting | High | Login/signup routes |
| S-HIGH-05 | Tokens in API responses | High | `triggers/route.ts` |
| S-HIGH-06 | Sessions not invalidated | High | Login/signup routes |
| S-HIGH-07 | Scopes not enforced | High | `api-key.ts` |
| S-HIGH-08 | OAuth state collision | High | `authorize/route.ts` |
| S-MED-01 | Dev key lost on restart | Medium | `credential-vault.ts` |
| S-MED-02 | No key rotation | Medium | `credential-vault.ts` |
| S-MED-03 | Sensitive data in logs | Medium | Multiple |
| S-MED-04 | No email validation | Medium | Auth routes |
| S-MED-05 | Weak passwords allowed | Medium | `signup/route.ts` |
| S-MED-06 | No transaction on signup | Medium | `signup/route.ts` |
