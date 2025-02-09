/**
 * @file metrics.ts
 * @description Application metrics tracking
 *
 * In production, these could be sent to Prometheus, DataDog, etc.
 * For now, we'll store them in memory and Redis for monitoring
 */

import { getRedisInstance } from '../queue/redis';
import { logger } from './logger';

/**
 * Metric types
 */
export type MetricType = 'counter' | 'gauge' | 'histogram';

/**
 * Metric data structure
 */
interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

/**
 * Metrics class for tracking application performance
 */
export class Metrics {
  private redis;

  constructor() {
    this.redis = getRedisInstance();
  }

  /**
   * Increment a counter metric
   */
  async incrementCounter(name: string, labels?: Record<string, string>, value: number = 1) {
    const key = this.getMetricKey('counter', name, labels);
    await this.redis.incrby(key, value);
    await this.redis.expire(key, 86400); // Expire after 24 hours
  }

  /**
   * Set a gauge metric
   */
  async setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getMetricKey('gauge', name, labels);
    await this.redis.set(key, value);
    await this.redis.expire(key, 3600); // Expire after 1 hour
  }

  /**
   * Record a histogram value (for timing, sizes, etc.)
   */
  async recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getMetricKey('histogram', name, labels);
    // Store in a sorted set with timestamp as score
    await this.redis.zadd(key, Date.now(), JSON.stringify({ value, timestamp: Date.now() }));
    // Keep only last 1000 entries
    await this.redis.zremrangebyrank(key, 0, -1001);
    await this.redis.expire(key, 86400); // Expire after 24 hours
  }

  /**
   * Get counter value
   */
  async getCounter(name: string, labels?: Record<string, string>): Promise<number> {
    const key = this.getMetricKey('counter', name, labels);
    const value = await this.redis.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Get gauge value
   */
  async getGauge(name: string, labels?: Record<string, string>): Promise<number> {
    const key = this.getMetricKey('gauge', name, labels);
    const value = await this.redis.get(key);
    return value ? parseFloat(value) : 0;
  }

  /**
   * Get histogram statistics
   */
  async getHistogramStats(
    name: string,
    labels?: Record<string, string>
  ): Promise<{ count: number; sum: number; avg: number; min: number; max: number }> {
    const key = this.getMetricKey('histogram', name, labels);
    const entries = await this.redis.zrange(key, 0, -1);

    if (entries.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const values = entries.map((entry) => JSON.parse(entry).value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { count: values.length, sum, avg, min, max };
  }

  /**
   * Generate metric key
   */
  private getMetricKey(type: MetricType, name: string, labels?: Record<string, string>): string {
    const labelString = labels
      ? Object.entries(labels)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${v}`)
          .join(',')
      : '';

    return `metrics:${type}:${name}${labelString ? `:${labelString}` : ''}`;
  }
}

/**
 * Singleton metrics instance
 */
let metricsInstance: Metrics | null = null;

export function getMetrics(): Metrics {
  if (!metricsInstance) {
    metricsInstance = new Metrics();
  }
  return metricsInstance;
}

/**
 * Convenience functions for common metrics
 */

// Workflow execution metrics
export async function recordWorkflowExecution(workflowId: string, status: 'success' | 'failed', duration: number) {
  const metrics = getMetrics();
  await metrics.incrementCounter('workflow_executions_total', { workflow_id: workflowId, status });
  await metrics.recordHistogram('workflow_execution_duration_seconds', duration / 1000, { workflow_id: workflowId });
}

// Node execution metrics
export async function recordNodeExecution(nodeType: string, status: 'success' | 'failed', duration: number) {
  const metrics = getMetrics();
  await metrics.incrementCounter('node_executions_total', { node_type: nodeType, status });
  await metrics.recordHistogram('node_execution_duration_seconds', duration / 1000, { node_type: nodeType });
}

// Integration metrics
export async function recordIntegrationCall(
  integrationType: string,
  action: string,
  status: 'success' | 'failed',
  duration: number
) {
  const metrics = getMetrics();
  await metrics.incrementCounter('integration_calls_total', { type: integrationType, action, status });
  await metrics.recordHistogram('integration_call_duration_seconds', duration / 1000, { type: integrationType, action });
}

// Queue metrics
export async function recordQueueJob(queueName: string, status: 'completed' | 'failed') {
  const metrics = getMetrics();
  await metrics.incrementCounter('queue_jobs_total', { queue: queueName, status });
}

// API metrics
export async function recordAPIRequest(method: string, path: string, statusCode: number, duration: number) {
  const metrics = getMetrics();
  const status = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'client_error' : 'success';
  await metrics.incrementCounter('api_requests_total', { method, path, status });
  await metrics.recordHistogram('api_request_duration_seconds', duration / 1000, { method, path });
}

// Active workflows gauge
export async function setActiveWorkflows(count: number) {
  const metrics = getMetrics();
  await metrics.setGauge('active_workflows', count);
}

// Active executions gauge
export async function setActiveExecutions(count: number) {
  const metrics = getMetrics();
  await metrics.setGauge('active_executions', count);
}
