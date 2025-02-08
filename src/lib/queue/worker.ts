/**
 * @file worker.ts
 * @description BullMQ worker for processing workflow execution jobs
 */

import { Worker, Job } from 'bullmq';
import { createRedisConnection } from './redis';
import { QUEUE_NAMES, WorkflowExecutionJob } from './queues';

// Simple logger with timestamps
const log = {
  info: (msg: string, data?: object) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (msg: string, data?: object) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (msg: string, error?: unknown) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, error);
  },
  debug: (msg: string, data?: object) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[${new Date().toISOString()}] [DEBUG] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
};

/**
 * Workflow execution worker
 * Processes jobs from the workflow-execution queue
 */
export class WorkflowExecutionWorker {
  private worker: Worker<WorkflowExecutionJob> | null = null;

  /**
   * Start the worker
   */
  async start() {
    if (this.worker) {
      log.warn('Worker already started');
      return;
    }

    log.info('Connecting to Redis...', { queue: QUEUE_NAMES.WORKFLOW_EXECUTION });

    this.worker = new Worker<WorkflowExecutionJob>(
      QUEUE_NAMES.WORKFLOW_EXECUTION,
      async (job: Job<WorkflowExecutionJob>) => {
        return await this.processJob(job);
      },
      {
        connection: createRedisConnection(),
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // per second
        },
      }
    );

    // Event listeners
    this.worker.on('ready', () => {
      log.info('Worker is ready and listening for jobs');
    });

    this.worker.on('active', (job) => {
      log.info(`Job ${job.id} started processing`, {
        workflowId: job.data.workflowId,
        executionId: job.data.executionId,
        triggeredBy: job.data.triggeredBy,
      });
    });

    this.worker.on('completed', (job, result) => {
      log.info(`Job ${job.id} completed successfully`, {
        workflowId: job.data.workflowId,
        executionId: job.data.executionId,
        duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 'unknown',
      });
    });

    this.worker.on('failed', (job, error) => {
      log.error(`Job ${job?.id} failed`, error);
      if (job) {
        log.error('Failed job details:', {
          workflowId: job.data.workflowId,
          executionId: job.data.executionId,
          attemptsMade: job.attemptsMade,
        });
      }
    });

    this.worker.on('error', (error) => {
      log.error('Worker error', error);
    });

    this.worker.on('stalled', (jobId) => {
      log.warn(`Job ${jobId} stalled`);
    });

    log.info('Workflow execution worker started', {
      concurrency: 5,
      rateLimitMax: 10,
      rateLimitDuration: 1000,
    });
  }

  /**
   * Process a workflow execution job
   */
  private async processJob(job: Job<WorkflowExecutionJob>) {
    const { workflowId, executionId, triggerData, triggeredBy, userId } = job.data;
    const startTime = Date.now();

    log.info('Processing workflow execution', {
      executionId,
      workflowId,
      triggeredBy,
      userId: userId || 'anonymous',
      jobId: job.id,
      attemptNumber: job.attemptsMade + 1,
    });

    log.debug('Trigger data', triggerData);

    // Update job progress
    await job.updateProgress(0);

    try {
      // Import WorkflowRuntime dynamically to avoid circular dependencies
      log.debug('Loading WorkflowRuntime...');
      const { WorkflowRuntime } = await import('../execution/workflow-runtime');
      const runtime = new WorkflowRuntime();

      log.info('Starting workflow execution...', { executionId, workflowId });
      await job.updateProgress(10);

      // Execute the workflow
      const context = await runtime.executeWorkflow(
        workflowId,
        executionId,
        triggerData,
        userId || undefined
      );

      await job.updateProgress(100);
      const duration = Date.now() - startTime;

      log.info('Workflow execution completed successfully', {
        executionId,
        workflowId,
        duration: `${duration}ms`,
        stepsExecuted: Object.keys(context.results || {}).length,
      });

      return {
        success: true,
        executionId,
        duration,
        stepsCompleted: Object.keys(context.results || {}).length,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(`Workflow execution failed: ${executionId}`, error);
      log.error('Failure details', {
        workflowId,
        executionId,
        duration: `${duration}ms`,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error; // Let BullMQ handle retry logic
    }
  }

  /**
   * Stop the worker gracefully
   */
  async stop() {
    if (this.worker) {
      log.info('Stopping workflow execution worker...');
      await this.worker.close();
      this.worker = null;
      log.info('Workflow execution worker stopped');
    }
  }

  /**
   * Pause the worker
   */
  async pause() {
    if (this.worker) {
      await this.worker.pause();
      log.info('Worker paused');
    }
  }

  /**
   * Resume the worker
   */
  async resume() {
    if (this.worker) {
      await this.worker.resume();
      log.info('Worker resumed');
    }
  }

  /**
   * Get worker status
   */
  isRunning(): boolean {
    return this.worker !== null && !this.worker.closing;
  }
}

/**
 * Singleton worker instance
 */
let workerInstance: WorkflowExecutionWorker | null = null;

/**
 * Get the worker instance
 */
export function getWorker(): WorkflowExecutionWorker {
  if (!workerInstance) {
    workerInstance = new WorkflowExecutionWorker();
  }
  return workerInstance;
}

/**
 * Start the worker (convenience function)
 */
export async function startWorker() {
  const worker = getWorker();
  await worker.start();
}

/**
 * Stop the worker (convenience function)
 */
export async function stopWorker() {
  if (workerInstance) {
    await workerInstance.stop();
    workerInstance = null;
  }
}
