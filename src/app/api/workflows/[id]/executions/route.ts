/**
 * @file route.ts
 * @description Get all executions for a workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { executions, workflows } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workflows/:id/executions
 * Get execution history for a workflow
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
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (workflow.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all executions for this workflow
    const workflowExecutions = await db.query.executions.findMany({
      where: eq(executions.workflowId, workflowId),
      orderBy: [desc(executions.createdAt)],
      limit: 100, // Limit to last 100 executions
    });

    return NextResponse.json({
      executions: workflowExecutions.map((exec) => ({
        id: exec.id,
        workflowId: exec.workflowId,
        status: exec.status,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        duration: exec.duration,
        error: exec.error,
        createdAt: exec.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get executions error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get executions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
