# FlowForge AI — Quick Wins: Highest-Impact Easy Fixes

This file lists issues that are either a 1–5 line fix and/or block core functionality.

---

## Fix 1: Login/Logout Broken (1 file, 2 line changes)

**File:** `src/lib/auth/context.tsx` — Lines 75, 94  

```typescript
// Change:
await fetch("/api/auth/signin", ...)
await fetch("/api/auth/signout", ...)

// To:
await fetch("/api/auth/login", ...)
await fetch("/api/auth/logout", ...)
```

**Result:** Users can log in and out.

---

## Fix 2: OAuth Redirect URLs Malformed (1 file, ~6 line changes)

**File:** `src/app/api/oauth/[provider]/callback/route.ts`

Every redirect like:
```
?section=integrations?error=...
```
Should be:
```
?section=integrations&error=...
```

There are 4 occurrences at lines 35, 114, 142, 148. Change the second `?` to `&`.

**Result:** OAuth integration flow completes successfully.

---

## Fix 3: Workflow Update Flag Never Resets (1 file, ~10 line changes)

**File:** `src/components/flow-editor/ai-chat/hooks/useWorkflowUpdates.ts`

Replace the `setTimeout` reset with a cleanup function:

```typescript
useEffect(() => {
  if (!latestMessage) return;
  
  isApplyingUpdateRef.current = true;
  
  // ... apply update logic ...
  
  return () => {
    isApplyingUpdateRef.current = false;  // Reset on cleanup
  };
}, [latestMessage, ...]);
```

**Result:** AI can generate multiple workflow updates in a single session.

---

## Fix 4: Create Handlers Registry Index File

**Create:** `src/lib/execution/handlers/index.ts`

This file needs to export `getHandlerForNode` and `determineHandlerType`. These likely already exist in individual handler files — they just need to be exported from the index.

**Result:** Workflow execution stops crashing immediately on any node execution.

---

## Fix 5: Webhook Trigger Validation Skipped

**File:** `src/lib/triggers/webhook-trigger.ts` — Line 49

Remove the TODO skip and add basic validation:
1. Look up the trigger record by `workflowId` + `triggerId`
2. Check the trigger is enabled
3. Verify auth credentials match

**Result:** Webhooks require proper authentication.

---

## Fix 6: Auto-Save Skips Zero-Node Workflows

**File:** `src/app/app/workflows/[id]/useWorkflowEditor.ts` — Line 166

```typescript
// Change:
if (!workflow || nodes.length === 0) return;

// To:
if (!workflow) return;
```

**Result:** Deleting all nodes is auto-saved.

---

## Fix 7: Execution Page Missing response.ok Check

**File:** `src/app/app/workflows/[id]/executions/page.tsx` — Line 50

```typescript
const response = await fetch(...);
if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
const data = await response.json();
```

**Result:** Execution list page shows errors instead of crashing.

---

## Fix 8: Remove Duplicate ReactFlowProvider

**File:** `src/app/app/workflows/[id]/page.tsx`

Remove the extra `ReactFlowProvider` wrapper in JSX, keeping only the one at the top level or inside `FlowCanvas`. Check which provider the flow state hook is attached to and keep that one.

**Result:** Fixes state conflicts in the flow editor.

---

## Fix 9: Add Missing getSession / getCurrentUser Clarity

**File:** `src/lib/auth/utils.ts` — Line 226

Remove the alias entirely. In every route that calls `getSession()`, replace it with `getCurrentUser()` directly. The session concept vs user concept needs to be consistent.

---

## Fix 10: JSON Filter Removing Valid AI Responses

**File:** `src/app/app/utils/message-utils.ts` — Lines 24–28

Either remove the JSON filter entirely, or only filter at the top level and not inside code blocks:

```typescript
// Remove or comment out this block:
if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
  try {
    JSON.parse(trimmed);
    return "";
  } catch {}
}
```

**Result:** AI responses with JSON examples or structured data are displayed correctly.
