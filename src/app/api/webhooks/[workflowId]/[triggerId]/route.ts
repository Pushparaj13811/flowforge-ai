/**
 * @file route.ts
 * @description Webhook endpoint for workflow triggers
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook } from '@/lib/triggers/webhook-trigger';
import { createErrorResponse } from '@/types/api';

export const dynamic = 'force-dynamic';

type WebhookPayload = Record<string, unknown> | string;

/**
 * POST /api/webhooks/:workflowId/:triggerId
 * Receive webhook and trigger workflow execution
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workflowId: string; triggerId: string }> }
) {
  try {
    const { workflowId, triggerId } = await params;

    // Parse payload
    const contentType = req.headers.get('content-type') || '';
    let payload: WebhookPayload;

    if (contentType.includes('application/json')) {
      payload = await req.json() as Record<string, unknown>;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      payload = await req.text();
    }

    // Extract headers and query params
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const query: Record<string, string> = {};
    req.nextUrl.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    // Handle webhook
    const result = await handleWebhook({
      workflowId,
      triggerId,
      payload,
      headers,
      query,
    });

    if (!result.success) {
      return createErrorResponse(result.error || 'Webhook processing failed', 400);
    }

    return NextResponse.json({
      success: true,
      executionId: result.executionId,
      message: 'Workflow execution triggered',
    });
  } catch (error) {
    console.error('[Webhook] Handler error:', error);
    return createErrorResponse(
      'Failed to process webhook',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * GET /api/webhooks/:workflowId/:triggerId
 * Verify webhook endpoint (for services that need GET confirmation)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workflowId: string; triggerId: string }> }
) {
  const { workflowId, triggerId } = await params;

  return NextResponse.json({
    status: 'active',
    workflowId,
    triggerId,
    message: 'Webhook endpoint is active',
  });
}
