/**
 * @file route.ts
 * @description Webhook triggers CRUD API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookTriggers, workflows } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/utils';
import {
  generateWebhookToken,
  generateWebhookUrl,
} from '@/lib/triggers/webhook-generator';
import {
  CreateTriggerRequestSchema,
  CreateTriggerResponseSchema,
  GetTriggersResponseSchema,
  parseRequestBody,
  createErrorResponse,
} from '@/types/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/workflows/:id/triggers
 * Create a new webhook trigger for a workflow node
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session
    const session = await getSession();
    if (!session) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id: workflowId } = await params;

    // Parse and validate request body
    const result = await parseRequestBody(req, CreateTriggerRequestSchema);
    if (!result.success) {
      return createErrorResponse('Invalid request body', 400, result.error);
    }

    const { nodeId, triggerType, config } = result.data;

    // Verify workflow ownership
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return createErrorResponse('Workflow not found', 404);
    }

    if (workflow.userId !== session.id) {
      return createErrorResponse('Forbidden', 403);
    }

    // Check if trigger already exists for this node
    const existingTrigger = await db.query.webhookTriggers.findFirst({
      where: and(
        eq(webhookTriggers.workflowId, workflowId),
        eq(webhookTriggers.nodeId, nodeId)
      ),
    });

    if (existingTrigger) {
      // Return existing trigger with all tokens
      return NextResponse.json({
        trigger: {
          id: existingTrigger.id,
          nodeId: existingTrigger.nodeId,
          triggerType: existingTrigger.triggerType,
          webhookUrl: existingTrigger.webhookUrl,
          webhookToken: existingTrigger.webhookToken,
          bearerToken: existingTrigger.bearerToken,
          hmacSecret: existingTrigger.hmacSecret,
          authMethod: existingTrigger.authMethod || 'url_token',
          isActive: existingTrigger.isActive,
          config: existingTrigger.config,
          createdAt: existingTrigger.createdAt,
        },
        message: 'Webhook already exists for this node',
      });
    }

    // Generate separate tokens for different auth methods
    const urlToken = generateWebhookToken();      // Token embedded in URL
    const bearerToken = generateWebhookToken();   // Separate token for Bearer auth
    const hmacSecret = generateWebhookToken();    // Separate secret for HMAC signing
    const webhookUrl = generateWebhookUrl(urlToken);

    // Create trigger with all tokens
    const [trigger] = await db
      .insert(webhookTriggers)
      .values({
        workflowId,
        nodeId,
        triggerType,
        webhookUrl,
        webhookToken: urlToken,
        bearerToken,
        hmacSecret,
        authMethod: 'url_token', // Default auth method
        config,
        isActive: true,
      })
      .returning();

    // Return trigger with all auth tokens
    return NextResponse.json({
      trigger: {
        id: trigger.id,
        nodeId: trigger.nodeId,
        triggerType: trigger.triggerType,
        webhookUrl: trigger.webhookUrl,
        webhookToken: trigger.webhookToken,
        bearerToken: trigger.bearerToken,
        hmacSecret: trigger.hmacSecret,
        authMethod: trigger.authMethod,
        isActive: trigger.isActive,
        lastTriggeredAt: trigger.lastTriggeredAt?.toISOString() ?? null,
        createdAt: trigger.createdAt.toISOString(),
        updatedAt: trigger.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] Create webhook trigger error:', error);
    return createErrorResponse(
      'Failed to create webhook trigger',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * GET /api/workflows/:id/triggers
 * Get all webhook triggers for a workflow
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await params;

    // Verify workflow ownership
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return createErrorResponse('Workflow not found', 404);
    }

    if (workflow.userId !== session.id) {
      return createErrorResponse('Forbidden', 403);
    }

    // Get all triggers for this workflow
    const triggers = await db.query.webhookTriggers.findMany({
      where: eq(webhookTriggers.workflowId, workflowId),
    });

    // Return triggers with auth tokens
    const response = {
      triggers: triggers.map((t) => ({
        id: t.id,
        nodeId: t.nodeId,
        triggerType: t.triggerType,
        webhookUrl: t.webhookUrl,
        webhookToken: t.webhookToken,  // URL token
        bearerToken: t.bearerToken,    // Bearer auth token
        hmacSecret: t.hmacSecret,      // HMAC signing secret
        authMethod: t.authMethod || 'url_token',
        isActive: t.isActive,
        lastTriggeredAt: t.lastTriggeredAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Get webhook triggers error:', error);
    return createErrorResponse(
      'Failed to get webhook triggers',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * DELETE /api/workflows/:id/triggers
 * Delete a webhook trigger
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await params;
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get('nodeId');

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify workflow ownership
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return createErrorResponse('Workflow not found', 404);
    }

    if (workflow.userId !== session.id) {
      return createErrorResponse('Forbidden', 403);
    }

    // Delete trigger
    await db
      .delete(webhookTriggers)
      .where(
        and(
          eq(webhookTriggers.workflowId, workflowId),
          eq(webhookTriggers.nodeId, nodeId)
        )
      );

    return NextResponse.json({
      message: 'Webhook trigger deleted successfully',
    });
  } catch (error) {
    console.error('Delete webhook trigger error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete webhook trigger',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/:id/triggers
 * Update a webhook trigger (auth method, regenerate tokens)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await params;
    const body = await req.json();
    const { nodeId, authMethod, regenerateTokens } = body;

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId is required' },
        { status: 400 }
      );
    }

    // Verify workflow ownership
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return createErrorResponse('Workflow not found', 404);
    }

    if (workflow.userId !== session.id) {
      return createErrorResponse('Forbidden', 403);
    }

    // Find existing trigger
    const existingTrigger = await db.query.webhookTriggers.findFirst({
      where: and(
        eq(webhookTriggers.workflowId, workflowId),
        eq(webhookTriggers.nodeId, nodeId)
      ),
    });

    if (!existingTrigger) {
      return createErrorResponse('Trigger not found', 404);
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Update auth method if provided
    if (authMethod && ['url_token', 'bearer', 'hmac'].includes(authMethod)) {
      updateData.authMethod = authMethod;
    }

    // Regenerate specific tokens if requested
    if (regenerateTokens) {
      if (regenerateTokens === 'bearer' || regenerateTokens === 'all') {
        updateData.bearerToken = generateWebhookToken();
      }
      if (regenerateTokens === 'hmac' || regenerateTokens === 'all') {
        updateData.hmacSecret = generateWebhookToken();
      }
      if (regenerateTokens === 'url' || regenerateTokens === 'all') {
        const newUrlToken = generateWebhookToken();
        updateData.webhookToken = newUrlToken;
        updateData.webhookUrl = generateWebhookUrl(newUrlToken);
      }
    }

    // Update trigger
    const [updatedTrigger] = await db
      .update(webhookTriggers)
      .set(updateData)
      .where(
        and(
          eq(webhookTriggers.workflowId, workflowId),
          eq(webhookTriggers.nodeId, nodeId)
        )
      )
      .returning();

    return NextResponse.json({
      trigger: {
        id: updatedTrigger.id,
        nodeId: updatedTrigger.nodeId,
        triggerType: updatedTrigger.triggerType,
        webhookUrl: updatedTrigger.webhookUrl,
        webhookToken: updatedTrigger.webhookToken,
        bearerToken: updatedTrigger.bearerToken,
        hmacSecret: updatedTrigger.hmacSecret,
        authMethod: updatedTrigger.authMethod,
        isActive: updatedTrigger.isActive,
        updatedAt: updatedTrigger.updatedAt.toISOString(),
      },
      message: 'Trigger updated successfully',
    });
  } catch (error) {
    console.error('Update webhook trigger error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update webhook trigger',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
