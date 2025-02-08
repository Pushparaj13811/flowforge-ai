/**
 * @file queues.ts
 * @description BullMQ queue configuration for workflow execution
 */

import { Queue, QueueOptions } from 'bullmq';
import { createRedisConnection } from './redis';
import type { WorkflowExecutionJob } from '@/types/workflow';

// Re-export types
export type { WorkflowExecutionJob };

/**
 * Queue names
 */
export const QUEUE_NAMES = {
  WORKFLOW_EXECUTION: 'workflow-execution',
  WEBHOOK_PROCESSING: 'webhook-processing',
  SCHEDULED_TASKS: 'scheduled-tasks',
} as const;

/**
 * Default queue options
 */
const defaultQueueOptions: QueueOptions = {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1 second
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

/**
 * Workflow execution queue
 * Handles all workflow execution jobs
 */
export const workflowExecutionQueue = new Queue<WorkflowExecutionJob>(
  QUEUE_NAMES.WORKFLOW_EXECUTION,
  {
    ...defaultQueueOptions,
    defaultJobOptions: {
      ...defaultQueueOptions.defaultJobOptions,
      priority: 1, // Normal priority
    },
  }
);

/**
 * Webhook processing queue
 * Handles incoming webhook requests
 */
export const webhookQueue = new Queue(
  QUEUE_NAMES.WEBHOOK_PROCESSING,
  {
    ...defaultQueueOptions,
    defaultJobOptions: {
      ...defaultQueueOptions.defaultJobOptions,
      priority: 2, // Higher priority for real-time webhooks
      attempts: 1, // Don't retry webhooks
    },
  }
);

/**
 * Scheduled tasks queue
 * Handles cron-triggered workflows
 */
export const scheduledTasksQueue = new Queue(
  QUEUE_NAMES.SCHEDULED_TASKS,
  {
    ...defaultQueueOptions,
    defaultJobOptions: {
      ...defaultQueueOptions.defaultJobOptions,
      priority: 1,
    },
  }
);

/**
 * Add a workflow execution job to the queue
 */
export async function queueWorkflowExecution(
  data: WorkflowExecutionJob,
  options?: {
    priority?: number;
    delay?: number;
  }
) {
  console.log(`[Queue] Adding workflow execution job to queue...`, {
    executionId: data.executionId,
    workflowId: data.workflowId,
    triggeredBy: data.triggeredBy,
    priority: options?.priority,
    delay: options?.delay,
  });

  try {
    const job = await workflowExecutionQueue.add(
      'execute-workflow',
      data,
      {
        priority: options?.priority,
        delay: options?.delay,
        jobId: data.executionId, // Use execution ID as job ID for idempotency
      }
    );

    console.log(`[Queue] Successfully queued workflow execution: ${data.executionId} (Job ${job.id})`);

    // Log queue stats
    const counts = await workflowExecutionQueue.getJobCounts();
    console.log(`[Queue] Current queue stats: waiting=${counts.waiting}, active=${counts.active}, completed=${counts.completed}, failed=${counts.failed}`);

    return job;
  } catch (error) {
    console.error(`[Queue] Failed to queue workflow execution: ${data.executionId}`, error);
    throw error;
  }
}

/**
 * Close all queues gracefully
 */
export async function closeQueues(): Promise<void> {
  await Promise.all([
    workflowExecutionQueue.close(),
    webhookQueue.close(),
    scheduledTasksQueue.close(),
  ]);
  console.log('All queues closed');
}

/**
 * Get queue health status
 */
export async function getQueueHealth() {
  try {
    const [executionCounts, webhookCounts, scheduledCounts] = await Promise.all([
      workflowExecutionQueue.getJobCounts(),
      webhookQueue.getJobCounts(),
      scheduledTasksQueue.getJobCounts(),
    ]);

    return {
      healthy: true,
      queues: {
        [QUEUE_NAMES.WORKFLOW_EXECUTION]: executionCounts,
        [QUEUE_NAMES.WEBHOOK_PROCESSING]: webhookCounts,
        [QUEUE_NAMES.SCHEDULED_TASKS]: scheduledCounts,
      },
    };
  } catch (error) {
    console.error('Queue health check failed:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Pause/Resume queues
 */
export async function pauseQueue(queueName: keyof typeof QUEUE_NAMES) {
  const queue = getQueueByName(queueName);
  await queue.pause();
  console.log(`Queue ${queueName} paused`);
}

export async function resumeQueue(queueName: keyof typeof QUEUE_NAMES) {
  const queue = getQueueByName(queueName);
  await queue.resume();
  console.log(`Queue ${queueName} resumed`);
}

function getQueueByName(queueName: keyof typeof QUEUE_NAMES): Queue {
  switch (QUEUE_NAMES[queueName]) {
    case QUEUE_NAMES.WORKFLOW_EXECUTION:
      return workflowExecutionQueue;
    case QUEUE_NAMES.WEBHOOK_PROCESSING:
      return webhookQueue;
    case QUEUE_NAMES.SCHEDULED_TASKS:
      return scheduledTasksQueue;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }
}
