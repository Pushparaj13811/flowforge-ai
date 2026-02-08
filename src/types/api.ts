/**
 * @file api.ts
 * @description Centralized API request/response types and Zod schemas
 */

import { z } from 'zod';
import {
  TriggerDataSchema,
  WebhookMetadataSchema,
  ExecutionResultSchema,
  ExecutionStepSchema,
  NodeConfigSchema,
  ValidationError,
} from './workflow';

// ============================================================================
// WEBHOOK API SCHEMAS
// ============================================================================

/**
 * POST /api/webhooks/trigger/[token]
 * Request body schema
 */
export const WebhookTriggerRequestSchema = z.record(z.unknown());

export type WebhookTriggerRequest = z.infer<typeof WebhookTriggerRequestSchema>;

/**
 * POST /api/webhooks/trigger/[token]
 * Response schema
 */
export const WebhookTriggerResponseSchema = z.object({
  success: z.boolean(),
  executionId: z.string(),
  message: z.string(),
});

export type WebhookTriggerResponse = z.infer<typeof WebhookTriggerResponseSchema>;

/**
 * GET /api/webhooks/trigger/[token]
 * Response schema
 */
export const WebhookVerifyResponseSchema = z.object({
  exists: z.boolean(),
  triggerType: z.string(),
  workflowName: z.string(),
  isActive: z.boolean(),
  workflowStatus: z.string(),
  lastTriggeredAt: z.string().datetime().nullable(),
  message: z.string(),
});

export type WebhookVerifyResponse = z.infer<typeof WebhookVerifyResponseSchema>;

/**
 * POST /api/workflows/[id]/triggers
 * Request body schema
 */
export const CreateTriggerRequestSchema = z.object({
  nodeId: z.string(),
  triggerType: z.enum(['webhook', 'schedule', 'manual']),
  config: z.record(z.unknown()).optional(),
});

export type CreateTriggerRequest = z.infer<typeof CreateTriggerRequestSchema>;

/**
 * POST /api/workflows/[id]/triggers
 * Response schema
 */
export const CreateTriggerResponseSchema = z.object({
  trigger: z.object({
    id: z.string().uuid(),
    nodeId: z.string(),
    triggerType: z.string(),
    webhookUrl: z.string().url(),
    isActive: z.boolean(),
    lastTriggeredAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
});

export type CreateTriggerResponse = z.infer<typeof CreateTriggerResponseSchema>;

/**
 * GET /api/workflows/[id]/triggers
 * Response schema
 */
export const GetTriggersResponseSchema = z.object({
  triggers: z.array(
    z.object({
      id: z.string().uuid(),
      nodeId: z.string(),
      triggerType: z.string(),
      webhookUrl: z.string().url(),
      isActive: z.boolean(),
      lastTriggeredAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
  ),
});

export type GetTriggersResponse = z.infer<typeof GetTriggersResponseSchema>;

// ============================================================================
// WORKFLOW API SCHEMAS
// ============================================================================

/**
 * POST /api/workflows
 * Request body schema
 */
export const CreateWorkflowRequestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  nodes: z.array(z.unknown()).default([]),
  edges: z.array(z.unknown()).default([]),
});

export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;

/**
 * PATCH /api/workflows/[id]
 * Request body schema
 */
export const UpdateWorkflowRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'active', 'paused']).optional(),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
});

export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>;

/**
 * POST /api/workflows/[id]/execute
 * Request body schema
 */
export const ExecuteWorkflowRequestSchema = z.object({
  triggerData: z.record(z.unknown()).default({}),
});

export type ExecuteWorkflowRequest = z.infer<typeof ExecuteWorkflowRequestSchema>;

/**
 * POST /api/workflows/[id]/execute
 * Response schema
 */
export const ExecuteWorkflowResponseSchema = z.object({
  success: z.boolean(),
  executionId: z.string(),
  message: z.string(),
});

export type ExecuteWorkflowResponse = z.infer<typeof ExecuteWorkflowResponseSchema>;

/**
 * GET /api/workflows/[id]
 * Response schema
 */
export const GetWorkflowResponseSchema = z.object({
  workflow: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    status: z.enum(['draft', 'active', 'paused']),
    nodes: z.array(z.unknown()),
    edges: z.array(z.unknown()),
    nodeCount: z.number().int().nonnegative(),
    executionCount: z.number().int().nonnegative(),
    successRate: z.number().int().min(0).max(100).nullable(),
    lastRunAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
});

export type GetWorkflowResponse = z.infer<typeof GetWorkflowResponseSchema>;

/**
 * GET /api/workflows
 * Response schema
 */
export const GetWorkflowsResponseSchema = z.object({
  workflows: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().nullable(),
      status: z.enum(['draft', 'active', 'paused']),
      nodeCount: z.number().int().nonnegative(),
      executionCount: z.number().int().nonnegative(),
      successRate: z.number().int().min(0).max(100).nullable(),
      lastRunAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
  ),
});

export type GetWorkflowsResponse = z.infer<typeof GetWorkflowsResponseSchema>;

// ============================================================================
// EXECUTION API SCHEMAS
// ============================================================================

/**
 * GET /api/workflows/[id]/executions
 * Response schema
 */
export const GetExecutionsResponseSchema = z.object({
  executions: z.array(
    z.object({
      id: z.string(),
      workflowId: z.string().uuid(),
      status: z.enum(['pending', 'running', 'completed', 'failed', 'paused', 'cancelled']),
      triggeredBy: z.enum(['manual', 'webhook', 'cron', 'event']),
      startedAt: z.string().datetime(),
      completedAt: z.string().datetime().nullable(),
      duration: z.number().int().nonnegative().nullable(),
      error: z.string().nullable(),
      createdAt: z.string().datetime(),
    })
  ),
});

export type GetExecutionsResponse = z.infer<typeof GetExecutionsResponseSchema>;

/**
 * GET /api/workflows/[id]/executions/[executionId]
 * Response schema
 */
export const GetExecutionDetailsResponseSchema = z.object({
  execution: ExecutionResultSchema,
});

export type GetExecutionDetailsResponse = z.infer<typeof GetExecutionDetailsResponseSchema>;

/**
 * GET /api/workflows/[id]/executions/[executionId]/status
 * Response schema
 */
export const GetExecutionStatusResponseSchema = z.object({
  executionId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'paused', 'cancelled']),
  currentStep: z.string().nullable(),
  completedSteps: z.number().int().nonnegative(),
  totalSteps: z.number().int().nonnegative(),
  error: z.string().nullable(),
});

export type GetExecutionStatusResponse = z.infer<typeof GetExecutionStatusResponseSchema>;

// ============================================================================
// INTEGRATION API SCHEMAS
// ============================================================================

/**
 * All supported integration types
 */
export const IntegrationTypeSchema = z.enum([
  // Messaging
  'slack',
  'discord',
  'teams',
  // Email
  'email',
  'resend',
  'sendgrid',
  'smtp',
  // AI & LLM
  'openai',
  'anthropic',
  // Data & Storage
  'google-sheets',
  'google-drive',
  'dropbox',
  // Payments
  'stripe',
  // SMS & Voice
  'twilio',
  // Developer Tools
  'github',
  'webhook',
  // CRM & Marketing
  'hubspot',
  // Notifications
  'push',
]);

export type IntegrationType = z.infer<typeof IntegrationTypeSchema>;

/**
 * POST /api/integrations
 * Request body schema
 */
export const CreateIntegrationRequestSchema = z.object({
  name: z.string().min(1).max(255),
  type: IntegrationTypeSchema,
  config: z.record(z.unknown()),
});

export type CreateIntegrationRequest = z.infer<typeof CreateIntegrationRequestSchema>;

/**
 * GET /api/integrations
 * Response schema
 */
export const GetIntegrationsResponseSchema = z.object({
  integrations: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      type: z.string(),
      isActive: z.boolean(),
      lastUsedAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
    })
  ),
});

export type GetIntegrationsResponse = z.infer<typeof GetIntegrationsResponseSchema>;

/**
 * POST /api/integrations/[id]/test
 * Response schema
 */
export const TestIntegrationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type TestIntegrationResponse = z.infer<typeof TestIntegrationResponseSchema>;

// ============================================================================
// AUTH API SCHEMAS
// ============================================================================

/**
 * POST /api/auth/signup
 * Request body schema
 */
export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(255),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

/**
 * POST /api/auth/login
 * Request body schema
 */
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * POST /api/auth/signup or POST /api/auth/login
 * Response schema
 */
export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
  }),
  session: z.object({
    token: z.string(),
    expiresAt: z.string().datetime(),
  }),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ============================================================================
// ERROR RESPONSE SCHEMAS
// ============================================================================

/**
 * Standard error response
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Validation error response
 */
export const ValidationErrorResponseSchema = z.object({
  error: z.string(),
  validation_errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
    })
  ),
});

export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse request body with Zod schema
 */
export async function parseRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  details?: string
): Response {
  return Response.json(
    {
      error,
      details,
    } satisfies ErrorResponse,
    { status }
  );
}

/**
 * Create standardized validation error response
 */
export function createValidationErrorResponse(
  errors: Array<{ field: string; message: string }>
): Response {
  return Response.json(
    {
      error: 'Validation failed',
      validation_errors: errors,
    } satisfies ValidationErrorResponse,
    { status: 400 }
  );
}
