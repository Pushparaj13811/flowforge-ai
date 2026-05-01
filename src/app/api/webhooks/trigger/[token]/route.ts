/**
 * @file route.ts
 * @description Public webhook endpoint to receive external triggers
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookTriggers, workflows, executions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { queueWorkflowExecution } from '@/lib/queue/queues';
import { verifyWebhookSignature } from '@/lib/triggers/webhook-generator';
import { validateApiKey, extractApiKeyFromRequest } from '@/lib/auth/api-key';
import {
  WebhookTriggerRequestSchema,
  WebhookTriggerResponseSchema,
  WebhookVerifyResponseSchema,
  createErrorResponse,
} from '@/types/api';
import type { TriggerData, WebhookMetadata } from '@/types/workflow';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/:token
 * Public endpoint to trigger workflow via webhook
 *
 * Authentication Methods (in priority order):
 * 1. Bearer Token (Authorization: Bearer {token})
 * 2. HMAC Signature (x-webhook-signature header)
 * 3. URL Token (fallback, less secure)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // ========================================================================
    // API KEY VALIDATION: Optional - checked if provided, but not required
    // The webhook auth method (bearer/hmac/url_token) is the primary security
    // ========================================================================
    let apiKeyValidation: { valid: boolean; keyId?: string; userId?: string; error?: string } = { valid: true };
    const apiKey = extractApiKeyFromRequest(req);

    if (apiKey) {
      apiKeyValidation = await validateApiKey(apiKey, 'workflow:trigger');
      if (!apiKeyValidation.valid) {
        return createErrorResponse(
          apiKeyValidation.error || 'Invalid API key',
          401
        );
      }
    }

    // Find webhook trigger by token
    const trigger = await db.query.webhookTriggers.findFirst({
      where: eq(webhookTriggers.webhookToken, token),
      with: {
        workflow: true,
      },
    });

    if (!trigger) {
      return createErrorResponse('Webhook not found', 404);
    }

    if (!trigger.isActive) {
      return createErrorResponse('Webhook is inactive', 403);
    }

    // Check if workflow is not paused
    if (trigger.workflow.status === 'paused') {
      return createErrorResponse('Workflow is paused', 400);
    }

    // Parse request body
    const bodyText = await req.text();
    let parsedBody: Record<string, unknown> = {};

    try {
      parsedBody = JSON.parse(bodyText);
      // Validate JSON structure
      const validationResult = WebhookTriggerRequestSchema.safeParse(parsedBody);
      if (!validationResult.success) {
        return createErrorResponse(
          'Invalid JSON structure',
          400,
          validationResult.error.errors.map((e) => e.message).join(', ')
        );
      }
    } catch {
      // If body is not JSON, use as raw text
      parsedBody = { rawBody: bodyText };
    }

    // ========================================================================
    // AUTHENTICATION: Bearer token or HMAC signature required
    // URL token is only used for routing (finding the trigger), NOT for auth
    // ========================================================================

    const selectedAuthMethod = trigger.authMethod || 'bearer';

    switch (selectedAuthMethod) {
      case 'bearer': {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
          return createErrorResponse(
            'Authorization header required. Send: Authorization: Bearer <your_token>',
            401
          );
        }
        const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
        if (!trigger.bearerToken || bearerToken !== trigger.bearerToken) {
          return createErrorResponse('Invalid bearer token', 401);
        }
        break;
      }

      case 'hmac': {
        const signature = req.headers.get('x-webhook-signature');
        if (!signature) {
          return createErrorResponse(
            'x-webhook-signature header required. Sign the request body with your HMAC secret.',
            401
          );
        }
        if (!trigger.hmacSecret) {
          return createErrorResponse('HMAC secret not configured for this webhook', 500);
        }
        const isValid = verifyWebhookSignature(bodyText, signature, trigger.hmacSecret);
        if (!isValid) {
          return createErrorResponse('Invalid webhook signature', 401);
        }
        break;
      }

      default: {
        // No url_token fallback - always require proper auth
        return createErrorResponse(
          'Invalid auth method configured. Please update webhook to use bearer or hmac.',
          401
        );
      }
    }

    // Create execution record in the database first to get a valid UUID
    const [executionRecord] = await db
      .insert(executions)
      .values({
        workflowId: trigger.workflowId,
        status: 'pending',
      })
      .returning({ id: executions.id });

    const executionId = executionRecord.id;

    // Build webhook metadata
    const webhookMetadata: WebhookMetadata = {
      triggerId: trigger.id,
      triggerType: trigger.triggerType,
      nodeId: trigger.nodeId,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(req.headers.entries()),
    };

    // Build trigger data with metadata
    // Wrap the parsed body under 'data' so variables can access via $trigger.data.*
    const triggerData: TriggerData = {
      data: parsedBody,
      _webhookMetadata: webhookMetadata,
    };

    await queueWorkflowExecution({
      workflowId: trigger.workflowId,
      executionId,
      triggerData,
      triggeredBy: 'webhook',
      triggerId: trigger.id,
      userId: trigger.workflow.userId,
    });

    // Update last triggered timestamp
    await db
      .update(webhookTriggers)
      .set({
        lastTriggeredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(webhookTriggers.id, trigger.id));

    // Log successful trigger
    console.log(`[Webhook] Triggered workflow ${trigger.workflowId} via ${selectedAuthMethod} auth`, {
      executionId,
      triggerId: trigger.id,
      authMethod: selectedAuthMethod,
      apiKeyId: apiKeyValidation.keyId,
      apiKeyUserId: apiKeyValidation.userId,
    });

    const response = WebhookTriggerResponseSchema.parse({
      success: true,
      executionId,
      message: 'Workflow triggered successfully',
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Webhook] Execution error:', error);
    return createErrorResponse(
      'Failed to trigger workflow',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * GET /api/webhooks/:token
 * Verify webhook exists (useful for testing)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const trigger = await db.query.webhookTriggers.findFirst({
      where: eq(webhookTriggers.webhookToken, token),
      with: {
        workflow: true,
      },
    });

    if (!trigger) {
      return createErrorResponse('Webhook not found', 404);
    }

    const response = WebhookVerifyResponseSchema.parse({
      exists: true,
      triggerType: trigger.triggerType,
      workflowName: trigger.workflow.name,
      isActive: trigger.isActive,
      workflowStatus: trigger.workflow.status,
      lastTriggeredAt: trigger.lastTriggeredAt?.toISOString() ?? null,
      message: 'Send POST request with JSON body to trigger workflow',
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Webhook] Verification error:', error);
    return createErrorResponse(
      'Failed to verify webhook',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
