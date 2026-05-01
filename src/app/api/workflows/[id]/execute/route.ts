/**
 * @file route.ts
 * @description Execute workflow API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workflows, executions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { queueWorkflowExecution } from '@/lib/queue/queues';
import { getCurrentUser, getAnonymousId } from '@/lib/auth/utils';
import {
  ExecuteWorkflowRequestSchema,
  ExecuteWorkflowResponseSchema,
  parseRequestBody,
  createErrorResponse,
} from '@/types/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/workflows/:id/execute
 * Execute a workflow (queue it for execution)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const anonymousId = await getAnonymousId();

    // Must be either logged in or have anonymous ID
    if (!user && !anonymousId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id: workflowId } = await params;

    // Parse and validate request body
    const result = await parseRequestBody(req, ExecuteWorkflowRequestSchema);
    if (!result.success) {
      return createErrorResponse('Invalid request body', 400, result.error);
    }

    const { triggerData } = result.data;

    // Load workflow
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return createErrorResponse('Workflow not found', 404);
    }

    // Check ownership - support both authenticated and anonymous users
    const isOwner =
      (user && workflow.userId === user.id) ||
      (!user && anonymousId && workflow.anonymousId === anonymousId);

    if (!isOwner) {
      return createErrorResponse('Forbidden', 403);
    }

    // Allow draft and active workflows to execute (paused workflows are blocked)
    if (workflow.status === 'paused') {
      return createErrorResponse('Workflow is paused. Resume it before executing.', 400);
    }

    // Create execution record
    const [execution] = await db
      .insert(executions)
      .values({
        workflowId,
        status: 'pending',
      })
      .returning({ id: executions.id });

    // Queue the execution via BullMQ
    await queueWorkflowExecution({
      workflowId,
      executionId: execution.id,
      triggerData: triggerData || {},
      triggeredBy: 'manual',
      userId: user?.id || anonymousId || 'anonymous',
    });

    const response = ExecuteWorkflowResponseSchema.parse({
      success: true,
      executionId: execution.id,
      message: 'Workflow execution queued successfully',
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Execute workflow error:', error);
    return createErrorResponse(
      'Failed to execute workflow',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
