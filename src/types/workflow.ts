/**
 * @file workflow.ts
 * @description Central type definitions for workflow system
 */

import { z } from 'zod';

// ============================================================================
// TRIGGER DATA
// ============================================================================

/**
 * Webhook metadata added to all webhook-triggered executions
 */
export const WebhookMetadataSchema = z.object({
  triggerId: z.string().uuid(),
  triggerType: z.string(),
  nodeId: z.string(),
  timestamp: z.string().datetime(),
  headers: z.record(z.string()),
});

export type WebhookMetadata = z.infer<typeof WebhookMetadataSchema>;

/**
 * Data passed to workflow execution from triggers
 * Can be any JSON-serializable data + optional webhook metadata
 */
export const TriggerDataSchema = z.record(z.unknown()).and(
  z.object({
    _webhookMetadata: WebhookMetadataSchema.optional(),
  })
);

export type TriggerData = z.infer<typeof TriggerDataSchema>;

// ============================================================================
// NODE CONFIGURATIONS (Discriminated Unions)
// ============================================================================

/**
 * Email Node Configuration
 */
export const EmailNodeConfigSchema = z.object({
  _type: z.literal('email'),
  integrationId: z.string().uuid().optional(),
  usePlatform: z.boolean().optional(),
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export type EmailNodeConfig = z.infer<typeof EmailNodeConfigSchema>;

/**
 * Slack Node Configuration
 */
export const SlackNodeConfigSchema = z.object({
  _type: z.literal('slack'),
  integrationId: z.string().uuid(),
  channel: z.string().min(1),
  message: z.string().min(1),
  threadTs: z.string().optional(),
  username: z.string().optional(),
  iconEmoji: z.string().optional(),
});

export type SlackNodeConfig = z.infer<typeof SlackNodeConfigSchema>;

/**
 * Discord Node Configuration
 */
export const DiscordNodeConfigSchema = z.object({
  _type: z.literal('discord'),
  integrationId: z.string().uuid(),
  message: z.string().min(1),
  username: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  tts: z.boolean().optional(),
});

export type DiscordNodeConfig = z.infer<typeof DiscordNodeConfigSchema>;

/**
 * HTTP Request Node Configuration
 */
export const HTTPNodeConfigSchema = z.object({
  _type: z.literal('http'),
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  timeout: z.number().int().positive().max(300000).optional(), // max 5 minutes
  followRedirects: z.boolean().optional(),
});

export type HTTPNodeConfig = z.infer<typeof HTTPNodeConfigSchema>;

/**
 * Condition Node Configuration
 */
export const ConditionNodeConfigSchema = z.object({
  _type: z.literal('condition'),
  condition: z.string().min(1),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'regex']).optional(),
});

export type ConditionNodeConfig = z.infer<typeof ConditionNodeConfigSchema>;

/**
 * Delay Node Configuration
 */
export const DelayNodeConfigSchema = z.object({
  _type: z.literal('delay'),
  duration: z.number().int().positive(),
  unit: z.enum(['seconds', 'minutes', 'hours', 'days']),
});

export type DelayNodeConfig = z.infer<typeof DelayNodeConfigSchema>;

/**
 * Webhook Trigger Configuration
 */
export const WebhookTriggerConfigSchema = z.object({
  _type: z.literal('webhook'),
  webhookUrl: z.string().url().optional(), // Generated, read-only
  requireSignature: z.boolean().optional(),
  allowedIPs: z.array(z.string()).optional(), // CIDR notation
  customHeaders: z.record(z.string()).optional(),
});

export type WebhookTriggerConfig = z.infer<typeof WebhookTriggerConfigSchema>;

/**
 * Schedule Trigger Configuration
 */
export const ScheduleTriggerConfigSchema = z.object({
  _type: z.literal('schedule'),
  cronExpression: z.string().min(1),
  timezone: z.string().optional(),
});

export type ScheduleTriggerConfig = z.infer<typeof ScheduleTriggerConfigSchema>;

/**
 * Discriminated union of all node configurations
 */
export const NodeConfigSchema = z.discriminatedUnion('_type', [
  EmailNodeConfigSchema,
  SlackNodeConfigSchema,
  DiscordNodeConfigSchema,
  HTTPNodeConfigSchema,
  ConditionNodeConfigSchema,
  DelayNodeConfigSchema,
  WebhookTriggerConfigSchema,
  ScheduleTriggerConfigSchema,
]);

export type NodeConfig = z.infer<typeof NodeConfigSchema>;

// ============================================================================
// EXECUTION TYPES
// ============================================================================

/**
 * Execution status
 */
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';

/**
 * Step status
 */
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * Execution step
 */
export const ExecutionStepSchema = z.object({
  nodeId: z.string(),
  nodeLabel: z.string(),
  nodeType: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  duration: z.number().int().nonnegative().nullable(), // milliseconds
  input: z.record(z.unknown()),
  output: z.record(z.unknown()).nullable(),
  error: z.string().nullable(),
  retryCount: z.number().int().nonnegative().default(0),
});

export type ExecutionStep = z.infer<typeof ExecutionStepSchema>;

/**
 * Execution result
 */
export const ExecutionResultSchema = z.object({
  executionId: z.string(),
  workflowId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'paused', 'cancelled']),
  triggeredBy: z.enum(['manual', 'webhook', 'cron', 'event']),
  triggerId: z.string().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  duration: z.number().int().nonnegative().nullable(), // milliseconds
  steps: z.array(ExecutionStepSchema),
  error: z.string().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook trigger from database
 */
export interface WebhookTrigger {
  id: string;
  workflowId: string;
  nodeId: string;
  triggerType: string;
  webhookUrl: string;
  webhookToken: string; // Should NOT be exposed to client
  config: WebhookTriggerConfig | null;
  isActive: boolean;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook trigger response (client-safe, no token)
 */
export interface WebhookTriggerResponse {
  id: string;
  nodeId: string;
  triggerType: string;
  webhookUrl: string;
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Webhook execution response
 */
export interface WebhookExecutionResponse {
  success: boolean;
  executionId: string;
  message: string;
}

/**
 * Webhook execution error response
 */
export interface WebhookErrorResponse {
  error: string;
  details?: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation error for a specific node/field
 */
export interface ValidationError {
  nodeId?: string;
  nodeLabel?: string;
  field?: string;
  message: string;
  severity?: 'error' | 'warning';
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

// ============================================================================
// WORKFLOW EXECUTION JOB
// ============================================================================

/**
 * Job data for BullMQ workflow execution queue
 */
export interface WorkflowExecutionJob {
  workflowId: string;
  executionId: string;
  triggerData: TriggerData;
  triggeredBy: 'manual' | 'webhook' | 'cron' | 'event';
  triggerId?: string;
  userId: string | null;
  priority?: number;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface SlackIntegrationConfig {
  botToken: string;
  channelId?: string;
}

export interface EmailIntegrationConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  secure?: boolean;
}

export interface DiscordIntegrationConfig {
  webhookUrl: string;
}

export interface TeamsIntegrationConfig {
  webhookUrl: string;
}

export interface WebhookIntegrationConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
}

export interface AnthropicIntegrationConfig {
  apiKey: string;
}

export interface TwilioIntegrationConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export type IntegrationConfig =
  | SlackIntegrationConfig
  | EmailIntegrationConfig
  | DiscordIntegrationConfig
  | TeamsIntegrationConfig
  | WebhookIntegrationConfig
  | AnthropicIntegrationConfig
  | TwilioIntegrationConfig;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isEmailConfig(config: NodeConfig): config is EmailNodeConfig {
  return config._type === 'email';
}

export function isSlackConfig(config: NodeConfig): config is SlackNodeConfig {
  return config._type === 'slack';
}

export function isDiscordConfig(config: NodeConfig): config is DiscordNodeConfig {
  return config._type === 'discord';
}

export function isHTTPConfig(config: NodeConfig): config is HTTPNodeConfig {
  return config._type === 'http';
}

export function isConditionConfig(config: NodeConfig): config is ConditionNodeConfig {
  return config._type === 'condition';
}

export function isDelayConfig(config: NodeConfig): config is DelayNodeConfig {
  return config._type === 'delay';
}

export function isWebhookTriggerConfig(config: NodeConfig): config is WebhookTriggerConfig {
  return config._type === 'webhook';
}

export function isScheduleTriggerConfig(config: NodeConfig): config is ScheduleTriggerConfig {
  return config._type === 'schedule';
}
