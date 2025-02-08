/**
 * @file worker.ts
 * @description Standalone worker process for executing workflow jobs
 *
 * Run this in a separate process:
 * ```
 * npm run worker        # Production
 * npm run worker:dev    # Development with auto-reload
 * ```
 *
 * Environment variables:
 * - DATABASE_URL: PostgreSQL connection URL
 * - REDIS_URL: Redis connection URL (default: redis://localhost:6379)
 * - DEBUG: Set to 'true' for verbose logging
 */

// Load environment variables from .env.local file FIRST before any other imports
// Next.js uses .env.local for local development
import dotenv from 'dotenv';
import path from 'path';

// Try .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // Fallback

import { startWorker, stopWorker } from './src/lib/queue/worker';
import { closeQueues, getQueueHealth } from './src/lib/queue/queues';
import { closeRedis, checkRedisHealth } from './src/lib/queue/redis';

const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);
const logError = (msg: string, err?: unknown) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, err || '');

async function main() {
  log('='.repeat(60));
  log('FlowForge Workflow Execution Worker');
  log('='.repeat(60));
  log('');

  // Check required environment variables
  log('Checking environment variables...');
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL is not set. Please check your .env file.');
    process.exit(1);
  }
  log('✓ DATABASE_URL is set');

  // Mask the password in the URL for logging
  const dbUrlForLog = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  log(`  Database: ${dbUrlForLog}`);

  // Check Redis connection
  log('Checking Redis connection...');
  const redisHealthy = await checkRedisHealth();
  if (!redisHealthy) {
    logError('Redis is not available. Please ensure Redis is running.');
    logError('REDIS_URL: ' + (process.env.REDIS_URL || 'redis://localhost:6379'));
    process.exit(1);
  }
  log('✓ Redis connection successful');

  // Check queue status
  log('Checking queue status...');
  const queueHealth = await getQueueHealth();
  if (!queueHealth.healthy) {
    logError('Queue health check failed:', queueHealth.error);
    process.exit(1);
  }
  log('✓ Queue status:');
  Object.entries(queueHealth.queues || {}).forEach(([name, counts]) => {
    log(`  - ${name}: waiting=${(counts as any).waiting || 0}, active=${(counts as any).active || 0}, completed=${(counts as any).completed || 0}, failed=${(counts as any).failed || 0}`);
  });

  log('');
  log('Starting worker...');

  try {
    await startWorker();
    log('');
    log('='.repeat(60));
    log('Worker is running and listening for jobs');
    log('Press Ctrl+C to stop');
    log('='.repeat(60));
    log('');
  } catch (error) {
    logError('Failed to start worker:', error);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    log('');
    log(`Received ${signal}. Shutting down gracefully...`);

    try {
      await stopWorker();
      log('✓ Worker stopped');
      await closeQueues();
      log('✓ Queues closed');
      await closeRedis();
      log('✓ Redis connection closed');
      log('');
      log('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logError('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logError('Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logError('Unhandled rejection:', reason);
  });
}

main();
