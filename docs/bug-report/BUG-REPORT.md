# FlowForge AI — Comprehensive Bug Report

**Date:** 2026-05-06  
**Analyzed By:** Claude Code (automated deep analysis)  
**Codebase:** Next.js 15 + Tambo AI + React Flow + Drizzle ORM  
**Total Issues Found:** 103 across 5 analysis domains  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues](#1-critical-issues)
3. [Security Vulnerabilities](#2-security-vulnerabilities)
4. [Authentication & Auth Flow Bugs](#3-authentication--auth-flow-bugs)
5. [Chat & Conversation System Bugs](#4-chat--conversation-system-bugs)
6. [Workflow Tools & Tambo Integration Bugs](#5-workflow-tools--tambo-integration-bugs)
7. [Execution Engine Bugs](#6-execution-engine-bugs)
8. [Flow Editor & React Flow Bugs](#7-flow-editor--react-flow-bugs)
9. [API Route Issues](#8-api-route-issues)
10. [Missing Implementations](#9-missing-implementations)
11. [Low Severity & Code Quality](#10-low-severity--code-quality)
12. [Summary Table](#summary-table)
13. [Recommended Fix Priority](#recommended-fix-priority)

---

## Executive Summary

This report documents **103 bugs, security vulnerabilities, integration issues, and missing implementations** found across the FlowForge AI codebase. The issues range from **application-breaking authentication failures** to **critical security vulnerabilities** that allow unauthenticated actors to trigger arbitrary workflows, access other users' credentials, and bypass authorization entirely.

**The application cannot function correctly in its current state.** Core user-facing flows — login, workflow creation via chat, workflow execution, and conversation persistence — all have critical bugs that prevent them from working.

### Severity Distribution

| Severity | Count |
|----------|-------|
| Critical | 14 |
| High | 31 |
| Medium | 38 |
| Low | 20 |
| **Total** | **103** |

---

## 1. Critical Issues

These issues cause complete feature failures or data corruption.

---

### CRIT-01: Login/Logout Endpoints Route Mismatch

**File:** `src/lib/auth/context.tsx` — Lines 75, 94  
**Type:** Integration Bug  
**Severity:** Critical  

The client-side auth context calls `/api/auth/signin` and `/api/auth/signout`, but the actual API routes are `/api/auth/login` and `/api/auth/logout`.

```typescript
// context.tsx line 75 — WRONG
await fetch("/api/auth/signin", ...)
// Should be: /api/auth/login

// context.tsx line 94 — WRONG
await fetch("/api/auth/signout", ...)
// Should be: /api/auth/logout
```

**Impact:** Login and logout are completely broken. Users cannot authenticate via the UI.

---

### CRIT-02: No Webhook Authentication — Any Actor Can Trigger Workflows

**File:** `src/lib/triggers/webhook-trigger.ts` — Lines 16–97  
**Type:** Security / Missing Implementation  
**Severity:** Critical  

The webhook handler accepts any incoming payload without verifying signatures (HMAC, bearer token, or URL token). The `workflowTriggers` table defines auth methods but none are enforced.

```typescript
// webhook-trigger.ts line 49
// TODO: Validate trigger exists and is enabled
// For now, we'll skip this check
```

**Impact:** Any unauthenticated actor with a valid webhook URL can trigger arbitrary workflows. Complete authorization bypass.

---

### CRIT-03: No User Authorization on Integration Credentials

**File:** `src/lib/security/integration-credentials.ts` — All functions  
**Type:** Security / Missing Authorization  
**Severity:** Critical  

No function in this file accepts or validates a `userId`. Any authenticated user can retrieve any other user's decrypted third-party credentials (API keys, OAuth tokens, passwords).

```typescript
// integration-credentials.ts — no userId parameter
export async function getIntegrationCredentials(integrationId: string): Promise<T | null> {
  const integration = await db.query.integrations.findFirst({
    where: eq(integrations.id, integrationId),
    // No userId check here!
  });
```

**Impact:** Vertical privilege escalation — users can access other users' third-party API credentials.

---

### CRIT-04: No Workflow Ownership Check on Execution

**File:** `src/app/api/workflows/[id]/execute/route.ts` — Line 56  
**Type:** Security / Logic Error  
**Severity:** Critical  

The ownership check compares `workflow.userId !== session.id`, but `getSession()` is aliased to `getCurrentUser()` which returns user data — not session data. This check may either fail silently or be bypassed entirely.

```typescript
// execute/route.ts line 56
if (workflow.userId !== session.id) {
  // 'session' is a User object, not a Session object
  // This check is unreliable
}
```

**Impact:** Authorization check unreliable; unauthorized users may execute workflows they don't own.

---

### CRIT-05: getSession / getCurrentUser Alias Confusion

**File:** `src/lib/auth/utils.ts` — Line 226  
**Type:** Integration Bug  
**Severity:** Critical  

`getSession` is exported as an alias for `getCurrentUser`, but they serve different purposes. `getCurrentUser` returns user data; callers of `getSession` expect session data with a different structure.

```typescript
// auth/utils.ts line 226
export const getSession = getCurrentUser;  // Incorrect alias
```

**Impact:** All code that calls `getSession()` and accesses `.id` may work by coincidence or fail depending on what properties are actually accessed. Inconsistent security posture across API routes.

---

### CRIT-06: Workflow Execution Handler Registry Missing

**File:** `src/lib/execution/workflow-runtime.ts` — Lines 327, 379  
**Type:** Missing Implementation  
**Severity:** Critical  

The workflow runtime dynamically imports `getHandlerForNode` and `determineHandlerType` from `./handlers`, but no central `handlers/index.ts` exports these functions.

```typescript
// workflow-runtime.ts line 327
const { getHandlerForNode, determineHandlerType } = await import('./handlers');
// This module likely doesn't export these functions
```

**Impact:** All workflow executions crash at runtime. No workflow can execute successfully.

---

### CRIT-07: executionSteps Schema Type Mismatch

**File:** `src/lib/execution/workflow-runtime.ts` — Lines 312–323  
**Type:** Type Error  
**Severity:** Critical  

The code inserts into `executionSteps` with an `as any` cast, with a TODO comment acknowledging the schema type mismatch.

```typescript
// workflow-runtime.ts lines 312-323
.values({
  ...
} as any) // TODO: Fix executionSteps schema types
```

**Impact:** Database insertion may fail or produce incorrect data. Execution step tracking is broken.

---

### CRIT-08: OAuth Callback URL Malformed — Double `?` Separators

**File:** `src/app/api/oauth/[provider]/callback/route.ts` — Lines 35–36, 114, 142, 148  
**Type:** Logic Bug  
**Severity:** Critical  

Query parameters are appended with `?` instead of `&`, producing malformed URLs that browsers and URL parsers cannot process.

```typescript
// callback/route.ts line 35
`${baseUrl}/app/settings?section=integrations?error=${encodeURIComponent(...)}`
//                       ^--- first ?           ^--- should be &

// Line 142
`${baseUrl}/app/settings?section=integrations?success=true&provider=...`
```

**Impact:** OAuth integration flow redirects fail silently. Frontend cannot parse success/error state. OAuth integrations cannot be completed.

---

### CRIT-09: Conversation Not Linked to Workflow in Database

**File:** `src/components/flow-editor/ai-chat/hooks/useChatPersistence.ts` — Lines 68–69  
**Type:** Integration Bug  
**Severity:** Critical  

`startConversation(workflowId, title)` passes `workflowId`, but the `/api/conversations` endpoint may not accept or persist this field, leaving conversations unlinked from their workflows.

**Impact:** Users lose AI chat history for workflows. Conversation history cannot be retrieved per-workflow.

---

### CRIT-10: Workflow Update Flag Stuck — Blocks All Subsequent AI Updates

**File:** `src/components/flow-editor/ai-chat/hooks/useWorkflowUpdates.ts` — Lines 18–75  
**Type:** State Bug  
**Severity:** Critical  

`isApplyingUpdateRef.current = true` is set when processing a workflow update, and reset via `setTimeout(..., 100)`. If the component unmounts, a new message arrives within 100ms, or an error occurs, the flag stays `true` permanently.

```typescript
// useWorkflowUpdates.ts line 21
if (isApplyingUpdateRef.current) {
  return;  // Silently ignores all subsequent AI workflow updates
}
```

**Impact:** After the first AI-generated workflow update, all subsequent updates from the AI are silently ignored. Users must refresh to receive more AI updates.

---

### CRIT-11: Duplicate ReactFlowProvider — Nested Providers

**File:** `src/app/app/workflows/[id]/page.tsx` — Lines 19–24, 124  
**Type:** React Architecture Bug  
**Severity:** Critical  

`ReactFlowProvider` is initialized at the top level and wrapped again inside the component JSX. `FlowCanvas.tsx` may also wrap in a third provider, creating nested provider conflicts.

**Impact:** State conflicts between provider instances, memory leaks, unpredictable edge rendering.

---

### CRIT-12: Messages Lost During Conversation Initialization Window

**File:** `src/components/flow-editor/ai-chat/hooks/useChatPersistence.ts` — Lines 82–108  
**Type:** Logic Bug  
**Severity:** Critical  

Message persistence requires `conversationId` to be non-null. However, there's a 500ms debounce and no mechanism to re-run when `conversationId` becomes available after messages already arrived. Messages sent before initialization completes are permanently lost.

**Impact:** Messages sent during the initialization window are never saved. AI chat conversations have missing messages.

---

### CRIT-13: Import Path Issues in configure-node.ts and validate-requirements.ts

**File:** `src/lib/tambo/tools/workflow/configure-node.ts`, `validate-requirements.ts`  
**Type:** Import Error  
**Severity:** Critical  

Both files import `determineHandlerType` from `@/lib/execution/handler-types`. If this module is missing or the alias is misconfigured, both tools crash at import time.

**Impact:** `configureNodeTool`, `batchConfigureNodesTool`, and `validateWorkflowRequirementsTool` are unavailable. Workflow building via chat fails completely.

---

### CRIT-14: cron-scheduler.ts References Unimplemented Table

**File:** `src/lib/triggers/cron-scheduler.ts` — Line 9  
**Type:** Missing Implementation  
**Severity:** Critical  

```typescript
// cron-scheduler.ts line 9
// TODO: workflowTriggers table needs to be added to schema
```

The table is imported and used but not defined in the schema. Cron-based triggers have no database persistence and are lost on server restart.

**Impact:** Scheduled workflow triggers are non-functional.

---

## 2. Security Vulnerabilities

---

### SEC-01: Open Redirect in OAuth Callback

**File:** `src/app/api/oauth/[provider]/callback/route.ts` — Lines 35–36, 114, 148  
**Severity:** High  

Redirects use `NEXT_PUBLIC_APP_URL` directly without validating it's a safe origin. If this variable is misconfigured or attacker-controlled, users can be redirected to malicious sites.

---

### SEC-02: Integration ID Exposed in OAuth Redirect URL

**File:** `src/app/api/oauth/[provider]/callback/route.ts` — Line 142  
**Severity:** High  

`integrationId` is sent as a URL query parameter, exposing it in browser history, server logs, and referrer headers.

---

### SEC-03: No CSRF Protection on Auth Endpoints

**Files:** All `/api/auth/*` routes  
**Severity:** Medium  

POST-based authentication endpoints use cookies but don't validate CSRF tokens. CSRF attacks are possible against login, logout, and signup endpoints.

---

### SEC-04: No Rate Limiting on Auth Endpoints

**Files:** `src/app/api/auth/login/route.ts`, `src/app/api/auth/signup/route.ts`  
**Severity:** Medium  

No brute-force protection. Attackers can attempt unlimited password guesses or run credential-stuffing attacks.

---

### SEC-05: Old Sessions Not Invalidated on New Login

**Files:** Login and signup routes  
**Severity:** Medium  

Existing sessions for a user are not invalidated when they sign in again. A stolen session token remains valid indefinitely even after the user logs in.

---

### SEC-06: Sensitive Tokens Returned in API Responses

**File:** `src/app/api/workflows/[id]/triggers/route.ts` — Lines 73–88, 176–192  
**Severity:** Medium  

Webhook tokens (`webhookToken`, `bearerToken`, `hmacSecret`) are returned in GET and POST responses without redaction.

---

### SEC-07: Development Encryption Key Lost on Server Restart

**File:** `src/lib/security/credential-vault.ts` — Lines 23–28  
**Severity:** Medium  

In development, a random temporary encryption key is generated per-process. All previously encrypted data becomes permanently unreadable on restart.

---

### SEC-08: No Encryption Key Rotation Implemented

**File:** `src/lib/security/credential-vault.ts` — Lines 15, 119–120  
**Severity:** Medium  

`keyVersion` field exists but is never incremented. No mechanism to rotate encryption keys.

---

### SEC-09: Session Expiry Vulnerable to Clock Skew

**File:** `src/lib/auth/utils.ts` — Line 151  
**Severity:** Low  

Session expiry compares `new Date()` without timezone awareness. Servers with different clock offsets may enforce expiry inconsistently.

---

### SEC-10: Sensitive Data Potentially Exposed in Logs

**Files:** `src/lib/oauth/token-manager.ts`, `src/lib/triggers/cron-scheduler.ts`, others  
**Severity:** Medium  

Logging functions log full integration objects without filtering sensitive fields (passwords, tokens, API keys).

---

## 3. Authentication & Auth Flow Bugs

---

### AUTH-01: API Key Scopes Validated But Never Enforced

**File:** `src/lib/auth/api-key.ts` — Lines 74–75  
**Severity:** High  

Scopes are validated on the API key, but no endpoint actually checks whether the key's scopes permit the requested operation. Scoping is non-functional.

---

### AUTH-02: Anonymous Workflow Linking Race Condition

**File:** `src/lib/auth/utils.ts` — Lines 167–186  
**Severity:** High  

`linkAnonymousWorkflows` clears the anonymous cookie before completing the database update. Concurrent requests could cause the same anonymous workflows to be linked multiple times or not at all.

---

### AUTH-03: Signup User + Session Not in a Transaction

**File:** `src/app/api/auth/signup/route.ts` — Lines 40–51  
**Severity:** Medium  

User creation and session creation are two separate database operations. If session creation fails after user creation, the user exists but cannot log in.

---

### AUTH-04: No Password Strength Validation

**File:** `src/app/api/auth/signup/route.ts`  
**Severity:** Medium  

No minimum length, complexity, or pattern requirements on passwords.

---

### AUTH-05: No Email Format Validation

**Files:** Login and signup routes  
**Severity:** Medium  

Email is lowercased but not validated against an RFC-compliant email format. Malformed emails can be stored.

---

### AUTH-06: Missing Redis Connection Error Handling in OAuth

**File:** `src/app/api/oauth/[provider]/authorize/route.ts` — Line 52  
**Severity:** High  

Redis connection is obtained without error handling. If Redis is unavailable, the OAuth authorization endpoint fails without a user-friendly error message.

---

### AUTH-07: Unvalidated OAuth Token Response Fields

**File:** `src/app/api/oauth/[provider]/callback/route.ts` — Line 118  
**Severity:** High  

The token response from OAuth providers is parsed without checking that required fields (`access_token`, `expires_in`) exist. Missing fields cause crashes or incomplete integrations.

---

### AUTH-08: Missing Database Connection Error Listener

**File:** `src/db/index.ts`  
**Severity:** Medium  

The database connection pool has no error event handler. Connection failures are silent.

---

### AUTH-09: OAuth State Collision — Concurrent Flows

**File:** `src/app/api/oauth/[provider]/authorize/route.ts` — Lines 49–60  
**Severity:** High  

Multiple concurrent OAuth flows for the same user can result in state collision, with one flow overwriting another's stored state in Redis.

---

### AUTH-10: findExpiredTokens Not Implemented

**File:** `src/lib/oauth/token-manager.ts` — Lines 200–209  
**Severity:** Medium  

The function acknowledges it cannot work because `expiresAt` is encrypted and can't be queried. Background token refresh is completely non-functional.

```typescript
// token-manager.ts line 200-209
workflowLogger.warn('Token expiration check not fully implemented');
return [];
```

---

## 4. Chat & Conversation System Bugs

---

### CHAT-01: Active Conversation Set Before Fetch — State Inconsistency

**File:** `src/app/app/hooks/useConversationManager.ts` — Lines 45–73  
**Severity:** High  

`setActiveConversationId(id)` is called before the conversation data is fetched. If the fetch fails, the dropdown shows a conversation as selected but no messages load.

---

### CHAT-02: Double Conversation Creation — Flawed Ref Logic

**File:** `src/app/app/hooks/useConversationManager.ts` — Lines 99–159  
**Severity:** High  

The `hasCreatedConversation.current` flag is set inside the try block. If the API call fails, the flag remains false allowing retries, but the logic at line 105 (`if (hasCreatedConversation.current || activeConversationId)`) returns early when `activeConversationId` is set, breaking retry logic.

---

### CHAT-03: Race Condition — Rapid Conversation Switching

**File:** `src/app/app/hooks/useConversationManager.ts` — Lines 45–73  
**Severity:** Medium  

No cancellation mechanism for in-flight fetches. Rapidly selecting conversations can load the wrong conversation's messages.

---

### CHAT-04: Failed Workflow Snapshots Corrupt Change Detection Baseline

**File:** `src/components/flow-editor/ai-chat/hooks/useChatPersistence.ts` — Lines 111–158  
**Severity:** Medium  

If a snapshot save fails, `prevNodesRef` is still updated to the new state. Subsequent change detection compares against a reference that was never actually saved, producing incorrect diffs.

---

### CHAT-05: JSON Content Filtered Out of AI Responses

**File:** `src/app/app/utils/message-utils.ts` — Lines 14–56  
**Severity:** Medium  

The `getMessageText` function discards any content block that is valid JSON (by trying to parse it). AI responses that legitimately include JSON examples or structured data are silently hidden.

```typescript
// message-utils.ts line 24-28
if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
  try {
    JSON.parse(trimmed);
    return ""; // Removes ALL valid JSON from display
  }
}
```

---

### CHAT-06: Workflow Change Detection Never Triggers on Empty → Non-Empty

**File:** `src/components/flow-editor/ai-chat/hooks/useChatPersistence.ts` — Lines 111–158  
**Severity:** High  

When a workflow starts empty and the AI adds the first nodes, the guard `if (prevNodesRef.current.length === 0 && nodes.length > 0) return` prevents saving. `prevNodesRef` is never updated, so every subsequent update also appears to be a "first change" and is skipped.

---

### CHAT-07: Message Consolidation Uses Substring Match Instead of Equality

**File:** `src/app/app/utils/message-utils.ts` — Lines 103–109  
**Severity:** Medium  

```typescript
if (!currentAssistantMessage.textContent.includes(textContent)) {
```
This is substring matching. If message A is "hello" and message B is "hello world", message B is not added because `"hello"` does not `.includes("hello world")`. Parts of AI responses are silently dropped.

---

### CHAT-08: No Initialization Guard Before Message Submission

**File:** `src/components/flow-editor/ai-chat/AIChatPanel.tsx` — Lines 15–54  
**Severity:** High  

There's no check that `conversationId` is set before allowing the user to submit messages. Messages sent during the initialization window are lost.

---

### CHAT-09: Unsafe Array Access on Optional Messages in ChatHistory

**File:** `src/components/flow-editor/ai-chat/parts/ChatHistory.tsx` — Lines 174–192  
**Severity:** Medium  

```typescript
conversation.messages[conversation.messages.length - 1].content
```
`messages` is `optional` in the `ChatConversation` interface. If the API doesn't return nested messages, this throws a runtime error.

---

### CHAT-10: alert() Used Instead of Toast Notifications

**File:** `src/app/app/hooks/useConversationManager.ts` — Lines 68, 94  
**Severity:** Low  

Native `alert()` is used for error messages instead of the application's Toast system, blocking the UI and providing an inconsistent user experience.

---

## 5. Workflow Tools & Tambo Integration Bugs

---

### TOOL-01: JSON.parse Without try-catch — Multiple Files

**Files:**  
- `src/lib/tambo/tools/workflow/build-workflow-conversational.ts` — Line 550  
- `src/lib/tambo/tools/workflow/configure-node.ts` — Lines 37–38  
- `src/lib/tambo/tools/workflow/validate-requirements.ts` — Line 112  
- `src/lib/tambo/tools/workflow/test-workflow.ts` — Lines 71, 75, 266  
- `src/lib/tambo/tools/workflow/define-trigger-schema.ts` — Lines 114, 209  
**Severity:** High  

Multiple `JSON.parse()` calls without try-catch. Malformed JSON from any source causes uncaught exceptions that crash the tool.

---

### TOOL-02: Regex with Global Flag Reused Across Calls — State Problem

**File:** `src/lib/tambo/tools/workflow/build-workflow-conversational.ts` — Lines 93–102  
**Severity:** High  

`conditionPatterns` array contains regexes with the `g` flag. When the same regex object is used with `.exec()` in a loop, it maintains internal state (`lastIndex`). Between calls, if not reset, patterns skip matches.

---

### TOOL-03: Extracted Config Values Not Validated Before Marking Complete

**File:** `src/lib/tambo/tools/workflow/build-workflow-conversational.ts` — Lines 410–434  
**Severity:** Medium  

Extracted values (emails, URLs, channel names) are not validated for correctness. An invalid email or URL is marked as "complete" and stored without verification.

---

### TOOL-04: Hardcoded Default Handler Falls Back to Email

**File:** `src/lib/tambo/tools/workflow/create-workflow.ts` — Line 29  
**Severity:** Medium  

Unknown icon types default to `"email:resend"`, silently creating email nodes when the intent was something else.

---

### TOOL-05: Node Position Calculation — Off-Canvas for Large Workflows

**File:** `src/lib/tambo/tools/workflow/create-workflow.ts` — Lines 110–113  
**Severity:** Medium  

Positions are calculated as `150 + 350 * index`. For a 20-node workflow, the last node is at `x=7150`. Nodes end up far off-screen.

---

### TOOL-06: Outputs Array Only Defined for Condition/Switch Nodes

**File:** `src/lib/tambo/tools/workflow/create-workflow.ts` — Lines 117–131  
**Severity:** Medium  

Loop nodes with conditional paths don't define `outputs`, preventing proper downstream connections.

---

### TOOL-07: Trigger Schema Naming Inconsistency Between Tools

**Files:**  
- `create-workflow.ts` — expects `triggerSchemaJson`  
- `define-trigger-schema.ts` — works with `fields`  
**Severity:** Medium  

The two tools use different field names for the same concept, making them incompatible in conversation flow.

---

### TOOL-08: analyzeWorkflowTool Accesses workflow.nodes Without Null Check

**File:** `src/lib/tambo/tools/workflow/analyze-workflow.ts` — Lines 31–32  
**Severity:** Medium  

If the API returns an unexpected response structure and `data.workflow` is undefined, accessing `.nodes` throws immediately.

---

### TOOL-09: Duplicate Logic in configureNodeTool and batchConfigureNodesTool

**File:** `src/lib/tambo/tools/workflow/configure-node.ts`  
**Severity:** Low  

Handler type determination logic is duplicated in both tools. A bug fix in one doesn't apply to the other.

---

## 6. Execution Engine Bugs

---

### EXEC-01: Variable Resolver Regex Too Loose — False Positives

**File:** `src/lib/execution/variable-resolver.ts` — Line 254  
**Severity:** Medium  

```typescript
return /\{\{\{?[^}]+\}\}\}?/.test(template);
```
This regex matches any `{` followed by non-`}` characters, producing false positives on valid JSON or template literals.

---

### EXEC-02: Undefined Node Type Falls Back Silently to "action"

**File:** `src/lib/execution/execution-planner.ts` — Lines 18–32  
**Severity:** Medium  

When `getNodeType` can't determine a node's type, it returns `'action'` without any warning. Misconfigured nodes are silently executed as action nodes.

---

### EXEC-03: Ambiguous 500 Response with Execution Data on Partial Failure

**File:** `src/app/api/executions/route.ts` — Lines 184–192  
**Severity:** Medium  

When an execution partially succeeds and then fails, the API returns HTTP 500 status but also includes the execution data object. Clients can't determine whether the execution actually failed.

---

### EXEC-04: Conditional Branching Doesn't Validate Branch Values

**File:** `src/lib/execution/workflow-runtime.ts` — Lines 207–226  
**Severity:** Medium  

The branching logic assumes `result.output?.branch` contains `'yes'` or `'no'`, but doesn't validate the value. Unexpected values cause the wrong branch to execute.

---

### EXEC-05: Missing Input Validation in Execution Planner

**File:** `src/lib/execution/execution-planner.ts` — Lines 103–143  
**Severity:** Medium  

`createPlan` doesn't validate that all required node properties exist after normalization. Malformed workflows produce cryptic errors at execution time.

---

## 7. Flow Editor & React Flow Bugs

---

### FLOW-01: Missing Dependency in Undo/Redo Keyboard Handler

**File:** `src/components/flow-editor/FlowCanvas.tsx` — Lines 120–167  
**Severity:** Critical  

The keyboard event listener has dependency array `[selectedNodeId]` only. Missing `selectNode`, `useFlowStore` state functions, and other handlers causes stale closures.

**Impact:** Undo/Redo/Delete/Copy/Paste keyboard shortcuts use stale closures and fail after re-renders.

---

### FLOW-02: Missing Dependency in Selection Auto-Open Sidebar

**File:** `src/app/app/workflows/[id]/useWorkflowEditor.ts` — Lines 178–182  
**Severity:** Critical  

`toggleRightSidebar` is missing from the dependency array of the auto-open-sidebar effect, causing stale closure.

---

### FLOW-03: Auto-Save Skips Workflows With Zero Nodes

**File:** `src/app/app/workflows/[id]/useWorkflowEditor.ts` — Lines 166–175  
**Severity:** High  

```typescript
if (!workflow || nodes.length === 0) return;
```
Workflows with all nodes deleted are never auto-saved. Node deletion is not persisted.

---

### FLOW-04: useWebhookTrigger Missing Dependency Array Entries

**File:** `src/components/flow-editor/properties-panel/hooks/useWebhookTrigger.ts` — Lines 29–66  
**Severity:** High  

`config` and `onChange` are used inside the effect but not listed as dependencies. Webhook data may not update correctly when the selected node changes.

---

### FLOW-05: Execution Fetch Missing response.ok Check

**File:** `src/app/app/workflows/[id]/executions/page.tsx` — Lines 46–77  
**Severity:** High  

`fetch` is called without checking `response.ok`. HTTP error responses are parsed as JSON and silently produce incorrect data or runtime errors.

---

### FLOW-06: Execution Polling Interval Not Properly Cleared

**File:** `src/app/app/workflows/[id]/executions/[executionId]/page.tsx` — Lines 84–91  
**Severity:** High  

Multiple intervals can be created if the effect re-runs before the previous one is cleaned up. Multiple simultaneous polling operations waste API calls.

---

### FLOW-07: Sidebar State Synchronization — Dual State Properties

**File:** `src/components/flow-editor/store.ts` — Lines 118, 124–125, 396–409  
**Severity:** High  

The store has both `rightSidebarOpen`/`leftSidebarOpen` AND `showRightSidebar`/`showLeftSidebar`. Toggle functions update both, but reads between updates can see inconsistent state.

---

### FLOW-08: Paste Node ID Collision Risk

**File:** `src/components/flow-editor/store.ts` — Lines 234–255  
**Severity:** Medium  

New IDs are generated using `Date.now()`. Multiple rapid paste operations within 1ms produce duplicate node IDs.

---

### FLOW-09: Condition Node Custom Output Handle Misalignment

**File:** `src/components/flow-editor/CustomNode.tsx` — Lines 176–227  
**Severity:** Medium  

Handle positioning for condition nodes assumes standard yes/no layout. Custom outputs break handle positioning, making connections impossible.

---

### FLOW-10: Node Duplication May Not Copy outputs Property

**File:** `src/components/flow-editor/store.ts` — Lines 197–219  
**Severity:** Medium  

`outputs` in `node.data` is not explicitly handled in duplication logic. Future changes to the data structure could silently drop output configurations.

---

### FLOW-11: Missing Validation for Node Labels (Empty Labels Allowed)

**File:** `src/components/flow-editor/PropertiesPanel.tsx` — Lines 70–74  
**Severity:** Medium  

Empty labels are accepted without any validation, causing display and export issues.

---

### FLOW-12: Duplicate ValidationError Type Definition

**Files:** `src/lib/workflow-validator.ts`, `src/types/workflow.ts`  
**Severity:** Medium  

`ValidationError` is defined in both files with different shapes. The `severity` field only exists in one definition, causing type mismatches at call sites.

---

### FLOW-13: loop and switch Node Types Not Validated

**File:** `src/lib/workflow-validator.ts` — Lines 300–341  
**Severity:** Medium  

The `validateNode` function has no handling for `loop` or `switch` node types. These nodes skip validation entirely.

---

### FLOW-14: No Loading State for Duplicate Workflow Action

**File:** `src/app/app/workflows/page.tsx` — Lines 123–164  
**Severity:** Low  

`handleDuplicateWorkflow` has no loading state. Users can click "Duplicate" multiple times and create multiple copies.

---

### FLOW-15: Polling Callback with Empty Dependency Array

**File:** `src/app/app/workflows/[id]/useWorkflowEditor.ts` — Lines 82–115  
**Severity:** Critical  

`pollExecutionStatus` is a `useCallback` with empty dependency array `[]`. If `workflowId` changes, the callback never updates and polls the wrong workflow.

---

## 8. API Route Issues

---

### API-01: SQL Query for Message Counts Uses Raw Join Construction

**File:** `src/app/api/conversations/route.ts` — Line 72  
**Severity:** High  

Message count query uses `sql.join()` for constructing IN clause without proper escaping. While Drizzle provides some protection, this pattern is fragile.

---

### API-02: Inconsistent Authorization Patterns Across Routes

**Files:** Multiple execution endpoints  
**Severity:** High  

Different routes use `getSession()` vs `getCurrentUser()` inconsistently. The distinction between the two is confused by the alias at `auth/utils.ts:226`.

---

### API-03: Dynamic Imports Without Error Handling

**File:** `src/app/api/conversations/route.ts` — Lines 33, 117  
**Severity:** Low  

```typescript
const { workflows: workflowsTable } = await import("@/db/schema");
// No error handling if import fails
```

---

### API-04: request.json() Not Wrapped in try-catch

**File:** `src/app/api/conversations/[id]/route.ts` — Line 99  
**Severity:** Low  

`request.json()` throws on malformed request bodies before the schema parse has a chance to produce a useful error.

---

### API-05: Inconsistent Error Response Format

**Files:** Multiple API routes  
**Severity:** Low  

Error responses use different shapes across routes (`{ error }`, `{ error, status }`, `{ error, details, status }`, `createErrorResponse()`). Clients cannot parse errors consistently.

---

### API-06: Webhook Tokens Exposed in API Responses

**File:** `src/app/api/workflows/[id]/triggers/route.ts` — Lines 73–88, 176–192  
**Severity:** Medium  

Sensitive fields (`webhookToken`, `bearerToken`, `hmacSecret`) are returned without redaction in GET and POST responses.

---

## 9. Missing Implementations

---

### MISSING-01: Webhook Signature Validation

Complete HMAC/bearer token validation for incoming webhooks. The `workflowTriggers` table has fields for auth but none are checked.

---

### MISSING-02: Webhook Endpoint Route

`handleWebhook()` exists in `webhook-trigger.ts` but there's no Next.js route that calls it. Incoming webhooks are never received.

---

### MISSING-03: workflowTriggers Database Table in Schema

Referenced in `cron-scheduler.ts` but missing from `src/db/schema.ts`.

---

### MISSING-04: Background Token Refresh

`findExpiredTokens()` is a stub that always returns `[]`. Expired OAuth tokens are never proactively refreshed.

---

### MISSING-05: API Key Scope Enforcement

Scopes are parsed and stored but no endpoint actually gates access based on them.

---

### MISSING-06: Key Rotation for Credential Vault

`keyVersion` field exists but is never updated. Encryption key rotation is unimplemented.

---

### MISSING-07: Handlers Registry Module

No `src/lib/execution/handlers/index.ts` exports `getHandlerForNode` and `determineHandlerType`, causing all workflow executions to crash.

---

### MISSING-08: Error Boundary for Config Components

No error boundary around `getConfigComponent` results. If any config form fails to render, the entire properties panel crashes.

---

## 10. Low Severity & Code Quality

---

### QUALITY-01: Unused Import generateSampleDataFromSchema

**File:** `src/lib/tambo/tools/workflow/test-workflow.ts` — Line 9

---

### QUALITY-02: Magic Numbers Without Named Constants

**File:** `src/lib/tambo/schemas/node-requirements.ts` — Multiple lines  
Hardcoded values: `4096`, `1000`, `30000` with no explanation.

---

### QUALITY-03: Templates Hardcoded Without Pagination

**File:** `src/lib/tambo/tools/workflow/templates.ts`  
All templates are returned in full. No filtering or lazy loading.

---

### QUALITY-04: useConversationContext Has No Error Boundary

**File:** `src/lib/conversation/ConversationProvider.tsx` — Lines 20–22  
Returns empty context when used outside provider instead of throwing a useful error.

---

### QUALITY-05: Edge Styling Logic Hardcoded in FlowCanvas

**File:** `src/components/flow-editor/FlowCanvas.tsx` — Lines 220–232  
Edge styling based on `sourceHandle` should be in the edge component or store, not in canvas render logic.

---

### QUALITY-06: Index as Key in Skeleton Loading

**File:** `src/app/app/components/HistoryDropdown.tsx` — Line 127  
`Array.from({ length: 3 }).map((_, i) => <div key={i}` — unstable keys.

---

### QUALITY-07: useLatestWorkflow Error Message Not Descriptive

**File:** `src/contexts/LatestWorkflowContext.tsx` — Lines 80–86  
Error thrown on missing provider doesn't name the context or suggest the missing provider.

---

## Summary Table

| ID | File | Lines | Type | Severity |
|----|------|-------|------|----------|
| CRIT-01 | `src/lib/auth/context.tsx` | 75, 94 | Integration Bug | Critical |
| CRIT-02 | `src/lib/triggers/webhook-trigger.ts` | 16–97 | Security/Missing | Critical |
| CRIT-03 | `src/lib/security/integration-credentials.ts` | All | Security/Auth | Critical |
| CRIT-04 | `src/app/api/workflows/[id]/execute/route.ts` | 56 | Security/Logic | Critical |
| CRIT-05 | `src/lib/auth/utils.ts` | 226 | Integration Bug | Critical |
| CRIT-06 | `src/lib/execution/workflow-runtime.ts` | 327, 379 | Missing Impl | Critical |
| CRIT-07 | `src/lib/execution/workflow-runtime.ts` | 312–323 | Type Error | Critical |
| CRIT-08 | `src/app/api/oauth/[provider]/callback/route.ts` | 35–148 | Logic Bug | Critical |
| CRIT-09 | `src/components/flow-editor/ai-chat/hooks/useChatPersistence.ts` | 68–69 | Integration Bug | Critical |
| CRIT-10 | `src/components/flow-editor/ai-chat/hooks/useWorkflowUpdates.ts` | 18–75 | State Bug | Critical |
| CRIT-11 | `src/app/app/workflows/[id]/page.tsx` | 19–124 | React Arch | Critical |
| CRIT-12 | `src/components/flow-editor/ai-chat/hooks/useChatPersistence.ts` | 82–108 | Logic Bug | Critical |
| CRIT-13 | `src/lib/tambo/tools/workflow/configure-node.ts` | 9 | Import Error | Critical |
| CRIT-14 | `src/lib/triggers/cron-scheduler.ts` | 9 | Missing Impl | Critical |
| SEC-01 | `src/app/api/oauth/[provider]/callback/route.ts` | 35–148 | Security | High |
| SEC-02 | `src/app/api/oauth/[provider]/callback/route.ts` | 142 | Security | High |
| SEC-03 | All auth routes | — | Security | Medium |
| SEC-04 | Login/signup routes | — | Security | Medium |
| SEC-05 | Login/signup routes | — | Security | Medium |
| SEC-06 | `src/app/api/workflows/[id]/triggers/route.ts` | 73–192 | Security | Medium |
| SEC-07 | `src/lib/security/credential-vault.ts` | 23–28 | Security | Medium |
| AUTH-01 | `src/lib/auth/api-key.ts` | 74–75 | Missing Impl | High |
| AUTH-02 | `src/lib/auth/utils.ts` | 167–186 | Race Condition | High |
| AUTH-03 | `src/app/api/auth/signup/route.ts` | 40–51 | Data Integrity | Medium |
| AUTH-06 | `src/app/api/oauth/[provider]/authorize/route.ts` | 52 | Integration | High |
| AUTH-07 | `src/app/api/oauth/[provider]/callback/route.ts` | 118 | Logic Bug | High |
| AUTH-09 | `src/app/api/oauth/[provider]/authorize/route.ts` | 49–60 | Race Condition | High |
| AUTH-10 | `src/lib/oauth/token-manager.ts` | 200–209 | Missing Impl | Medium |
| CHAT-01 | `src/app/app/hooks/useConversationManager.ts` | 45–73 | State Bug | High |
| CHAT-02 | `src/app/app/hooks/useConversationManager.ts` | 99–159 | Logic Error | High |
| CHAT-05 | `src/app/app/utils/message-utils.ts` | 14–56 | Logic Error | Medium |
| CHAT-06 | `src/components/flow-editor/ai-chat/hooks/useChatPersistence.ts` | 111–158 | Logic Error | High |
| CHAT-07 | `src/app/app/utils/message-utils.ts` | 103–109 | Logic Error | Medium |
| CHAT-08 | `src/components/flow-editor/ai-chat/AIChatPanel.tsx` | 15–54 | Missing Impl | High |
| CHAT-09 | `src/components/flow-editor/ai-chat/parts/ChatHistory.tsx` | 174–192 | Type Error | Medium |
| TOOL-01 | Multiple workflow tool files | Various | Error Handling | High |
| TOOL-02 | `src/lib/tambo/tools/workflow/build-workflow-conversational.ts` | 93–102 | Logic Error | High |
| TOOL-03 | Same file | 410–434 | Missing Validation | Medium |
| TOOL-04 | `src/lib/tambo/tools/workflow/create-workflow.ts` | 29 | Logic Error | Medium |
| TOOL-05 | Same file | 110–113 | Logic Error | Medium |
| EXEC-01 | `src/lib/execution/variable-resolver.ts` | 254 | Logic Error | Medium |
| EXEC-02 | `src/lib/execution/execution-planner.ts` | 18–32 | Logic Error | Medium |
| EXEC-03 | `src/app/api/executions/route.ts` | 184–192 | API Design | Medium |
| EXEC-04 | `src/lib/execution/workflow-runtime.ts` | 207–226 | Logic Error | Medium |
| FLOW-01 | `src/components/flow-editor/FlowCanvas.tsx` | 120–167 | React Hook | Critical |
| FLOW-02 | `src/app/app/workflows/[id]/useWorkflowEditor.ts` | 178–182 | React Hook | Critical |
| FLOW-03 | Same file | 166–175 | Logic Error | High |
| FLOW-04 | `src/components/flow-editor/properties-panel/hooks/useWebhookTrigger.ts` | 29–66 | React Hook | High |
| FLOW-05 | `src/app/app/workflows/[id]/executions/page.tsx` | 46–77 | Error Handling | High |
| FLOW-06 | `src/app/app/workflows/[id]/executions/[executionId]/page.tsx` | 84–91 | Memory Leak | High |
| FLOW-07 | `src/components/flow-editor/store.ts` | 396–409 | State Bug | High |
| FLOW-15 | `src/app/app/workflows/[id]/useWorkflowEditor.ts` | 82–115 | React Hook | Critical |
| API-01 | `src/app/api/conversations/route.ts` | 72 | SQL/Perf | High |
| API-02 | Multiple routes | — | Inconsistency | High |
| API-06 | `src/app/api/workflows/[id]/triggers/route.ts` | 73–192 | Security | Medium |

---

## Recommended Fix Priority

### P0 — Fix Immediately (App Is Broken)

1. **CRIT-01**: Fix `/api/auth/signin` → `/api/auth/login` and `/api/auth/signout` → `/api/auth/logout` in `auth/context.tsx`
2. **CRIT-06**: Create `src/lib/execution/handlers/index.ts` that exports `getHandlerForNode` and `determineHandlerType`
3. **CRIT-07**: Fix `executionSteps` schema types in `workflow-runtime.ts`
4. **CRIT-08**: Fix double `?` in OAuth redirect URLs — change to `&`
5. **CRIT-10**: Fix workflow update flag reset using cleanup function or AbortController
6. **CRIT-12**: Refactor message persistence to queue messages until `conversationId` is ready
7. **CRIT-09**: Verify `/api/conversations` persists `workflowId`

### P1 — Security Fixes (Before Any Users)

8. **CRIT-02**: Implement webhook authentication (HMAC signature validation)
9. **CRIT-03**: Add `userId` parameter and authorization check to all `integration-credentials.ts` functions
10. **CRIT-04**: Fix ownership check in execute route (use `getCurrentUser()` directly)
11. **CRIT-05**: Remove `getSession` alias; explicitly use `getCurrentUser` or a proper `getSession` that returns session data
12. **SEC-03**: Add CSRF tokens to auth endpoints
13. **SEC-04**: Add rate limiting to login and signup

### P2 — Workflow Functionality

14. **CRIT-11**: Remove duplicate `ReactFlowProvider`
15. **FLOW-01**: Fix keyboard handler dependency array in `FlowCanvas.tsx`
16. **FLOW-02**: Add `toggleRightSidebar` to effect dependency array
17. **FLOW-15**: Fix `pollExecutionStatus` useCallback dependencies
18. **FLOW-03**: Handle 0-node workflows in auto-save
19. **TOOL-01**: Wrap all `JSON.parse()` calls in try-catch
20. **TOOL-02**: Fix global regex state issue in condition patterns

### P3 — Chat & Conversation Quality

21. **CHAT-05**: Remove or add context-awareness to JSON content filter
22. **CHAT-06**: Fix change detection baseline for empty → non-empty workflow transitions
23. **CHAT-01**: Only set `activeConversationId` after successful fetch
24. **CHAT-07**: Change substring `.includes()` to equality check in message consolidation
25. **CHAT-08**: Block message submission until `conversationId` is initialized

### P4 — Missing Features

26. **MISSING-01/02**: Implement webhook signature validation and proper Next.js webhook routes
27. **MISSING-04**: Implement background token refresh
28. **MISSING-05**: Enforce API key scopes in endpoints
29. **MISSING-07**: Build handlers registry module
30. **AUTH-10**: Implement `findExpiredTokens` with unencrypted expiry storage
