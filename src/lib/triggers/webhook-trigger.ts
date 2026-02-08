/**
 * @file webhook-trigger.ts
 * @description Webhook trigger system
 */

import { db } from '@/db';
import { workflows, executions } from '@/db/schema';
// TODO: workflowTriggers table needs to be added to schema
import { eq, and } from 'drizzle-orm';
import { queueWorkflowExecution } from '../queue/queues';
import { workflowLogger } from '../monitoring/logger';

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

    // TODO: Validate trigger exists and is enabled
    // For now, we'll skip this check

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
