/**
 * @file validation.ts
 * @description Shared validation schemas and types for workflows
 */

import { z } from "zod";

// ============================================================================
// Node Types
// ============================================================================

export const nodeTypeSchema = z.enum([
  "trigger",
  "action",
  "condition",
  "delay",
  "loop",
]);
export type NodeType = z.infer<typeof nodeTypeSchema>;

export const nodeStatusSchema = z.enum([
  "idle",
  "pending",
  "running",
  "success",
  "error",
]);
export type NodeStatus = z.infer<typeof nodeStatusSchema>;

export const workflowStatusSchema = z.enum([
  "draft",
  "active",
  "paused",
  "error",
]);
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;

// ============================================================================
// Node Configuration
// ============================================================================

export const workflowNodeSchema = z.object({
  id: z.string(),
  type: nodeTypeSchema,
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  status: nodeStatusSchema.optional(),
  config: z.record(z.unknown()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;

export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
});
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;

// ============================================================================
// Workflow Definition
// ============================================================================

export const workflowDefinitionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  status: workflowStatusSchema.default("draft"),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
});
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;

// ============================================================================
// Execution Types
// ============================================================================

export const executionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export type ExecutionStatus = z.infer<typeof executionStatusSchema>;

// Step Status (for execution timeline)
export const stepStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);
export type StepStatus = z.infer<typeof stepStatusSchema>;

// Use stepStatusSchema for ExecutionStep since it includes "completed", "skipped" etc.
export const executionStepSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  name: z.string(),
  nodeName: z.string().optional(),
  type: z.string().optional(),
  status: stepStatusSchema,
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  duration: z.number().optional(),
  inputSummary: z.string().optional(),
  outputSummary: z.string().optional(),
  output: z.unknown().optional(),
  error: z.string().optional(),
});
export type ExecutionStep = z.infer<typeof executionStepSchema>;

export const workflowExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: executionStatusSchema,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  steps: z.array(executionStepSchema),
  triggerData: z.unknown().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
});
export type WorkflowExecution = z.infer<typeof workflowExecutionSchema>;

// ============================================================================
// API Response Types
// ============================================================================

export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});
export type ApiResponse = z.infer<typeof apiResponseSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateWorkflowNode(node: unknown): WorkflowNode {
  return workflowNodeSchema.parse(node);
}

export function validateWorkflowEdge(edge: unknown): WorkflowEdge {
  return workflowEdgeSchema.parse(edge);
}

export function validateWorkflowDefinition(workflow: unknown): WorkflowDefinition {
  return workflowDefinitionSchema.parse(workflow);
}

export function isValidNodeType(type: string): type is NodeType {
  return nodeTypeSchema.safeParse(type).success;
}

export function isValidNodeStatus(status: string): status is NodeStatus {
  return nodeStatusSchema.safeParse(status).success;
}

// ============================================================================
// Component Props Schemas (for Tambo)
// ============================================================================

export const executionTimelinePropsSchema = z.object({
  executionId: z.string().optional(),
  workflowName: z.string().optional(),
  status: executionStatusSchema.optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  totalDuration: z.number().optional(),
  steps: z.array(executionStepSchema).optional(),
  currentStepId: z.string().optional(),
  onRetry: z.function().optional(),
  onCancel: z.function().optional(),
  className: z.string().optional(),
});

export const workflowCanvasPropsSchema = z.object({
  workflowId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  nodes: z.array(workflowNodeSchema).optional(),
  edges: z.array(workflowEdgeSchema).optional(),
  status: workflowStatusSchema.optional(),
  hideHeader: z.boolean().optional(),
  hideControls: z.boolean().optional(),
  isInStickyPanel: z.boolean().optional(),
  className: z.string().optional(),
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely calculate a percentage, clamped to 0-100
 */
export function safePercentage(completed: number, total: number): number {
  if (typeof completed !== "number" || isNaN(completed)) return 0;
  if (typeof total !== "number" || isNaN(total) || total === 0) return 0;
  const percentage = (completed / total) * 100;
  return Math.min(100, Math.max(0, percentage));
}

/**
 * Ensure a value is an array
 */
export function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Safely get a position object
 */
export function safePosition(
  position: { x?: number; y?: number } | undefined
): { x: number; y: number } {
  return {
    x: position?.x ?? 0,
    y: position?.y ?? 0,
  };
}
