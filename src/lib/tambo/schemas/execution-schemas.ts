import { z } from "zod";

/**
 * Execution Step Schema
 */
export const executionStepSchema = z.object({
  id: z.string().describe("Unique step identifier"),
  nodeId: z.string().describe("ID of the corresponding workflow node"),
  name: z.string().describe("Display name of the step"),
  type: z.string().describe("Type of step (trigger, action, condition, etc.)"),
  status: z.enum(["pending", "running", "completed", "failed", "skipped"]).describe("Execution status"),
  duration: z.number().optional().describe("Duration in milliseconds"),
  startedAt: z.string().optional().describe("ISO timestamp when step started"),
  completedAt: z.string().optional().describe("ISO timestamp when step completed"),
  inputSummary: z.string().optional().describe("Summary of input data for this step"),
  outputSummary: z.string().optional().describe("Summary of output data from this step"),
  error: z.string().optional().describe("Error message if step failed"),
});

/**
 * Execution Timeline Schema
 */
export const executionTimelineSchema = z.object({
  executionId: z.string().describe("Unique execution identifier"),
  workflowName: z.string().describe("Name of the workflow being executed"),
  status: z.enum(["pending", "running", "completed", "failed"]).describe("Overall execution status"),
  startedAt: z.string().optional().describe("ISO timestamp when execution started"),
  completedAt: z.string().optional().describe("ISO timestamp when execution completed"),
  totalDuration: z.number().optional().describe("Total duration in milliseconds"),
  steps: z.array(executionStepSchema).describe("Array of execution steps"),
  currentStepId: z.string().optional().describe("ID of the currently running step"),
});

export type ExecutionStep = z.infer<typeof executionStepSchema>;
export type ExecutionTimeline = z.infer<typeof executionTimelineSchema>;
