/**
 * @file route.ts
 * @description Get execution details API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { executions, executionSteps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/executions/:id
 * Get execution details with steps
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

    const { id: executionId } = await params;

    // Load execution with steps
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
      with: {
        workflow: true,
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.stepOrder)],
        },
      },
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (execution.workflow.userId !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        workflowName: execution.workflow.name,
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        duration: execution.duration,
        error: execution.error,
        createdAt: execution.createdAt,
      },
      steps: execution.steps.map((step) => ({
        id: step.id,
        nodeId: step.nodeId,
        name: step.name,
        type: step.type,
        status: step.status,
        duration: step.duration,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        inputSummary: step.inputSummary,
        outputSummary: step.outputSummary,
        error: step.error,
        stepOrder: step.stepOrder,
      })),
    });
  } catch (error) {
    console.error('Get execution error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get execution details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
