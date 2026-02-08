/**
 * @file route.ts
 * @description Execute workflow API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workflows, executions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { queueWorkflowExecution } from '@/lib/queue/queues';
import { getSession } from '@/lib/auth/utils';
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
    // Get session
    const session = await getSession();
    if (!session) {
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

    // Check ownership
    if (workflow.userId !== session.id) {
      return createErrorResponse('Forbidden', 403);
    }

    // Check if workflow is active
    if (workflow.status !== 'active') {
      return createErrorResponse('Workflow must be active to execute', 400);
    }

    // Create execution record
    const [execution] = await db
      .insert(executions)
      .values({
        workflowId,
        status: 'pending',
      })
      .returning({ id: executions.id });

    // Queue the execution
    await queueWorkflowExecution({
      workflowId,
      executionId: execution.id,
      triggerData: triggerData || {},
      triggeredBy: 'manual',
      userId: session.id,
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
