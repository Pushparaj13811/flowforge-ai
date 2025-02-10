/**
 * @file route.ts
 * @description Health check endpoint for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRedisHealth } from '@/lib/queue/redis';
import { getQueueHealth } from '@/lib/queue/queues';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET(req: NextRequest) {
  try {
    // Check Redis connection
    const redisHealthy = await checkRedisHealth();

    // Check queue status
    const queueHealth = await getQueueHealth();

    // Check database (basic check - can be enhanced)
    const dbHealthy = true; // TODO: Add actual database health check

    const healthy = redisHealthy && queueHealth.healthy && dbHealthy;

    return NextResponse.json(
      {
        status: healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          redis: redisHealthy ? 'ok' : 'failed',
          queues: queueHealth.healthy ? 'ok' : 'failed',
          database: dbHealthy ? 'ok' : 'failed',
        },
        details: {
          queues: queueHealth.queues,
        },
      },
      { status: healthy ? 200 : 503 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
