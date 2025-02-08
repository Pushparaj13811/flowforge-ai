/**
 * @file error-handler.ts
 * @description Error handling and retry logic for workflow execution
 */

import { workflowLogger } from '../monitoring/logger';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: { nodeId?: string; nodeType?: string }
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < retryConfig.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt >= retryConfig.maxAttempts) {
        workflowLogger.error(
          { ...context, attempt, error: lastError },
          'Max retry attempts reached'
        );
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
        retryConfig.maxDelay
      );

      workflowLogger.warn(
        { ...context, attempt, delay, error: lastError },
        `Attempt ${attempt} failed, retrying in ${delay}ms`
      );

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Error types
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Workflow execution error with type
 */
export class WorkflowExecutionError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public retryable: boolean = true,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WorkflowExecutionError';
  }
}

/**
 * Classify an error
 */
export function classifyError(error: unknown): {
  type: ErrorType;
  retryable: boolean;
  message: string;
} {
  if (error instanceof WorkflowExecutionError) {
    return {
      type: error.type,
      retryable: error.retryable,
      message: error.message,
    };
  }

  const message = error instanceof Error ? error.message : String(error);

  // Network errors
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('ETIMEDOUT') ||
    message.includes('network')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      retryable: true,
      message,
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('AbortError')) {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      retryable: true,
      message,
    };
  }

  // Authentication errors
  if (
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('401')
  ) {
    return {
      type: ErrorType.AUTHENTICATION_ERROR,
      retryable: false, // Don't retry auth errors
      message,
    };
  }

  // Rate limit errors
  if (message.includes('rate limit') || message.includes('429')) {
    return {
      type: ErrorType.RATE_LIMIT_ERROR,
      retryable: true, // Retry with backoff
      message,
    };
  }

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required')
  ) {
    return {
      type: ErrorType.VALIDATION_ERROR,
      retryable: false, // Don't retry validation errors
      message,
    };
  }

  // Integration errors
  if (message.includes('integration') || message.includes('credentials')) {
    return {
      type: ErrorType.INTEGRATION_ERROR,
      retryable: false,
      message,
    };
  }

  // Default
  return {
    type: ErrorType.UNKNOWN_ERROR,
    retryable: true,
    message,
  };
}

/**
 * Determine if an error should be retried
 */
export function shouldRetry(error: unknown): boolean {
  const classification = classifyError(error);
  return classification.retryable;
}

/**
 * Format error for logging/storage
 */
export function formatError(error: unknown): {
  type: string;
  message: string;
  stack?: string;
  details?: Record<string, unknown>;
} {
  const classification = classifyError(error);

  return {
    type: classification.type,
    message: classification.message,
    stack: error instanceof Error ? error.stack : undefined,
    details: error instanceof WorkflowExecutionError ? error.details : undefined,
  };
}
