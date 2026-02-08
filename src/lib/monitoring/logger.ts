/**
 * @file logger.ts
 * @description Structured logging with Pino
 */

import pino from 'pino';

/**
 * Create logger instance
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Pretty print in development
  ...(process.env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'apiKey',
      'botToken',
      'webhookUrl',
      'encryptedConfig',
      'credentials',
      'config.password',
      'config.apiKey',
    ],
    remove: true,
  },
});

/**
 * Logger for specific modules
 */
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

/**
 * Workflow execution logger
 */
export const workflowLogger = createModuleLogger('workflow');

/**
 * Queue logger
 */
export const queueLogger = createModuleLogger('queue');

/**
 * Security logger
 */
export const securityLogger = createModuleLogger('security');

/**
 * Integration logger
 */
export const integrationLogger = createModuleLogger('integration');

/**
 * API logger
 */
export const apiLogger = createModuleLogger('api');

/**
 * Database logger
 */
export const dbLogger = createModuleLogger('database');

/**
 * Log execution metrics
 */
export function logExecutionMetrics(data: {
  executionId: string;
  workflowId: string;
  duration: number;
  status: 'success' | 'failed';
  stepCount: number;
  error?: string;
}) {
  workflowLogger.info(
    {
      ...data,
      event: 'execution_completed',
    },
    `Workflow execution ${data.status}: ${data.executionId}`
  );
}

/**
 * Log integration usage
 */
export function logIntegrationUsage(data: {
  integrationId: string;
  integrationType: string;
  action: string;
  success: boolean;
  duration?: number;
}) {
  integrationLogger.info(
    {
      ...data,
      event: 'integration_used',
    },
    `Integration ${data.integrationType}.${data.action} ${data.success ? 'succeeded' : 'failed'}`
  );
}

/**
 * Log security events
 */
export function logSecurityEvent(data: {
  event: 'auth_attempt' | 'auth_success' | 'auth_failure' | 'credential_access' | 'permission_denied';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}) {
  securityLogger.info(
    {
      ...data,
      timestamp: new Date().toISOString(),
    },
    `Security event: ${data.event}`
  );
}

/**
 * Log API requests
 */
export function logAPIRequest(data: {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  error?: string;
}) {
  const level = data.statusCode >= 500 ? 'error' : data.statusCode >= 400 ? 'warn' : 'info';

  apiLogger[level](
    {
      ...data,
      event: 'api_request',
    },
    `${data.method} ${data.path} ${data.statusCode} ${data.duration}ms`
  );
}
