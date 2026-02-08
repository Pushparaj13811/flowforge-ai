/**
 * @file cron-scheduler.ts
 * @description Cron-based workflow scheduler
 */

import cron from 'node-cron';
import { db } from '@/db';
import { workflows, executions } from '@/db/schema';
// TODO: workflowTriggers table needs to be added to schema
import { eq } from 'drizzle-orm';
import { queueWorkflowExecution } from '../queue/queues';
import { workflowLogger } from '../monitoring/logger';

/**
 * Cron job manager
 */
export class CronScheduler {
  private jobs = new Map<string, ReturnType<typeof cron.schedule>>();

  /**
   * Register a cron trigger
   */
  async registerTrigger(params: {
    triggerId: string;
    workflowId: string;
    schedule: string; // Cron expression
    userId: string;
  }) {
    const { triggerId, workflowId, schedule, userId } = params;

    // Validate cron expression
    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    // Remove existing job if any
    this.unregisterTrigger(triggerId);

    // Schedule new job
    const task = cron.schedule(schedule, async () => {
      try {
        workflowLogger.info(
          { workflowId, triggerId, schedule },
          'Cron trigger fired'
        );

        // Create execution record
        const [execution] = await db
          .insert(executions)
          .values({
            workflowId,
            status: 'pending',
          })
          .returning({ id: executions.id });

        // Queue execution
        await queueWorkflowExecution({
          workflowId,
          executionId: execution.id,
          triggerData: {
            type: 'cron',
            schedule,
            scheduledAt: new Date().toISOString(),
          },
          triggeredBy: 'cron',
          triggerId,
          userId,
        });

        workflowLogger.info(
          { workflowId, executionId: execution.id },
          'Cron execution queued'
        );
      } catch (error) {
        workflowLogger.error(
          { workflowId, triggerId, error },
          'Cron trigger failed'
        );
      }
    });

    this.jobs.set(triggerId, task);

    workflowLogger.info(
      { triggerId, workflowId, schedule },
      'Cron trigger registered'
    );
  }

  /**
   * Unregister a cron trigger
   */
  unregisterTrigger(triggerId: string) {
    const task = this.jobs.get(triggerId);
    if (task) {
      task.stop();
      this.jobs.delete(triggerId);

      workflowLogger.info({ triggerId }, 'Cron trigger unregistered');
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    for (const [triggerId, task] of this.jobs.entries()) {
      task.stop();
      workflowLogger.info({ triggerId }, 'Cron trigger stopped');
    }
    this.jobs.clear();
  }

  /**
   * Get active trigger count
   */
  getActiveCount(): number {
    return this.jobs.size;
  }

  /**
   * List active triggers
   */
  getActiveTriggers(): string[] {
    return Array.from(this.jobs.keys());
  }
}

/**
 * Singleton scheduler instance
 */
let schedulerInstance: CronScheduler | null = null;

export function getScheduler(): CronScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new CronScheduler();
  }
  return schedulerInstance;
}
