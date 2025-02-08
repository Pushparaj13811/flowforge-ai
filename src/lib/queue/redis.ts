/**
 * @file redis.ts
 * @description Redis connection configuration for BullMQ
 */

import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Create a new Redis connection
 * BullMQ requires separate connections for different purposes
 */
export function createRedisConnection(): Redis {
  const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('error', (error) => {
    console.error('Redis connection error:', error);
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });

  return redis;
}

/**
 * Singleton Redis instance for general use
 */
let redisInstance: Redis | null = null;

export function getRedisInstance(): Redis {
  if (!redisInstance) {
    redisInstance = createRedisConnection();
  }
  return redisInstance;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}

/**
 * Health check for Redis
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const redis = getRedisInstance();
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}
