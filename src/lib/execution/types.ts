/**
 * @file types.ts
 * @description Types for workflow execution engine
 */

import type { WorkflowNodeData, WorkflowEdge } from '@/components/flow-editor/types';

/**
 * Execution context holds state during workflow execution
 */
export interface ExecutionContext {
  // Workflow metadata
  workflowId: string;
  executionId: string;
  userId?: string;

  // Trigger data
  triggerData: any;

  // Variables (global state)
  variables: Record<string, any>;

  // Results from completed nodes (keyed by node ID)
  results: Record<string, NodeExecutionResult>;

  // Results from completed nodes (keyed by label slug for $steps access)
  stepsByLabel?: Record<string, NodeExecutionResult>;

  // Current step being executed
  currentStep?: number;
}

/**
 * Result of a node execution
 */
export interface NodeExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  duration: number;
  startedAt: Date;
  completedAt: Date;
  // Optional: node label for label-based lookups
  nodeLabel?: string;
}

/**
 * Execution plan - ordered list of nodes to execute
 */
export interface ExecutionPlan {
  steps: ExecutionStep[];
  totalSteps: number;
}

/**
 * A single step in the execution plan
 */
export interface ExecutionStep {
  stepOrder: number;
  nodeId: string;
  node: WorkflowNodeData;
  dependencies: string[]; // Node IDs this step depends on
  edges: WorkflowEdge[]; // Outgoing edges from this node
}

/**
 * Node handler interface
 * All node implementations must follow this interface
 */
export interface NodeHandler {
  /**
   * Execute the node
   */
  execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult>;

  /**
   * Validate node configuration (optional)
   */
  validate?(node: WorkflowNodeData): boolean;
}

/**
 * Workflow execution status
 */
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Step execution status
 */
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
