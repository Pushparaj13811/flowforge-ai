/**
 * @file webhook-trigger.ts
 * @description Webhook trigger system
 */

import { db } from '@/db';
import { workflows, executions, webhookTriggers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { queueWorkflowExecution } from '../queue/queues';
import { workflowLogger } from '../monitoring/logger';
import { verifyWebhookSignature } from './webhook-generator';

/**
 * Handle incoming webhook request
 */
export async function handleWebhook(params: {
  workflowId: string;
  triggerId: string;
  payload: any;
  headers: Record<string, string>;
  query: Record<string, string>;
}): Promise<{ success: boolean; executionId?: string; error?: string }> {
  const { workflowId, triggerId, payload, headers, query } = params;

  try {
    workflowLogger.info(
      { workflowId, triggerId },
      'Received webhook request'
    );

    // Load workflow and trigger
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      workflowLogger.warn({ workflowId }, 'Workflow not found');
      return { success: false, error: 'Workflow not found' };
    }

    if (workflow.status !== 'active') {
      workflowLogger.warn(
        { workflowId, status: workflow.status },
        'Workflow is not active'
      );
      return { success: false, error: 'Workflow is not active' };
    }

    // Validate trigger exists, is enabled, and auth credentials are valid.
    // Uses a sentinel to distinguish "table unavailable" from "record not found".
    const SCHEMA_UNAVAILABLE = Symbol('schema_unavailable');
    type TriggerLookup =
      | typeof webhookTriggers.$inferSelect
      | undefined
      | typeof SCHEMA_UNAVAILABLE;

    let triggerLookup: TriggerLookup;

    try {
      triggerLookup = await db.query.webhookTriggers.findFirst({
        where: and(
          eq(webhookTriggers.workflowId, workflowId),
          eq(webhookTriggers.nodeId, triggerId),
        ),
      });
    } catch (schemaError) {
      // Table may not exist in this environment yet (migration not run).
      workflowLogger.warn(
        { workflowId, triggerId, error: schemaError },
        'webhook_triggers table query failed'
      );

      if (process.env.NODE_ENV === 'production') {
        workflowLogger.error(
          { workflowId, triggerId },
          'Rejecting webhook: trigger table unavailable in production'
        );
        return { success: false, error: 'Trigger validation unavailable' };
      }

      // Development: allow through with a warning and skip auth checks.
      workflowLogger.warn(
        { workflowId, triggerId },
        'Allowing webhook in development despite missing trigger table'
      );
      triggerLookup = SCHEMA_UNAVAILABLE;
    }

    if (triggerLookup === undefined) {
      // Table is healthy but no matching record was found.
      workflowLogger.warn(
        { workflowId, triggerId },
        'Webhook trigger record not found'
      );
      return { success: false, error: 'Trigger not found' };
    }

    if (triggerLookup !== SCHEMA_UNAVAILABLE) {
      // Record found — enforce enabled check and auth.
      const triggerRecord = triggerLookup;

      if (!triggerRecord.isActive) {
        workflowLogger.warn(
          { workflowId, triggerId },
          'Webhook trigger is inactive'
        );
        return { success: false, error: 'Trigger is not enabled' };
      }

      const authMethod = triggerRecord.authMethod ?? 'url_token';

      switch (authMethod) {
        case 'bearer': {
          const authHeader = headers['authorization'] ?? headers['Authorization'];
          if (!authHeader) {
            workflowLogger.warn({ workflowId, triggerId }, 'Missing Authorization header for bearer auth');
            return { success: false, error: 'Authorization header required' };
          }
          const providedToken = authHeader.replace(/^Bearer\s+/i, '');
          if (!triggerRecord.bearerToken || providedToken !== triggerRecord.bearerToken) {
            workflowLogger.warn({ workflowId, triggerId }, 'Invalid bearer token');
            return { success: false, error: 'Invalid bearer token' };
          }
          break;
        }

        case 'hmac': {
          const signature = headers['x-webhook-signature'] ?? headers['X-Webhook-Signature'];
          if (!signature) {
            workflowLogger.warn({ workflowId, triggerId }, 'Missing x-webhook-signature header for HMAC auth');
            return { success: false, error: 'x-webhook-signature header required' };
          }
          if (!triggerRecord.hmacSecret) {
            workflowLogger.error({ workflowId, triggerId }, 'HMAC secret not configured on trigger');
            return { success: false, error: 'HMAC secret not configured' };
          }
          // Re-serialise the payload for signature comparison.
          // The route handler parses JSON before calling handleWebhook, so we
          // reconstruct the string here. Raw-text payloads arrive as strings.
          const payloadString =
            typeof payload === 'string' ? payload : JSON.stringify(payload);
          const isValid = verifyWebhookSignature(payloadString, signature, triggerRecord.hmacSecret);
          if (!isValid) {
            workflowLogger.warn({ workflowId, triggerId }, 'Invalid HMAC webhook signature');
            return { success: false, error: 'Invalid webhook signature' };
          }
          break;
        }

        case 'url_token':
        default: {
          // The URL itself contains the trigger ID — knowing the URL is the credential.
          workflowLogger.info({ workflowId, triggerId }, 'Webhook authenticated via url_token');
          break;
        }
      }
    }

    // Create execution record
    const [execution] = await db
      .insert(executions)
      .values({
        workflowId,
        status: 'pending',
      })
      .returning({ id: executions.id });

    // Queue execution with webhook data
    await queueWorkflowExecution({
      workflowId,
      executionId: execution.id,
      triggerData: {
        type: 'webhook',
        payload,
        headers,
        query,
        timestamp: new Date().toISOString(),
      },
      triggeredBy: 'webhook',
      triggerId,
      userId: workflow.userId || 'anonymous',
    });

    workflowLogger.info(
      { workflowId, executionId: execution.id },
      'Webhook execution queued'
    );

    return {
      success: true,
      executionId: execution.id,
    };
  } catch (error) {
    workflowLogger.error(
      { workflowId, triggerId, error },
      'Webhook handling failed'
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
