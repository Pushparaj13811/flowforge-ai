/**
 * @file types.ts
 * @description Type definitions for the Flow Editor components
 */

import type { Node, Edge } from "@xyflow/react";

// ============================================================================
// Node Types
// ============================================================================

export type WorkflowNodeType = "trigger" | "action" | "condition" | "delay" | "loop";

export type NodeStatus = "idle" | "pending" | "running" | "success" | "error";

export type OutputType = "success" | "error" | "yes" | "no" | "custom";

export interface NodeOutput {
  id: string;
  label: string;
  type: OutputType;
}

export interface WorkflowNodeData {
  label: string;
  description?: string;
  icon?: string;
  nodeType: WorkflowNodeType;
  status?: NodeStatus;
  config?: Record<string, unknown>;
  outputs?: NodeOutput[];
  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

export type WorkflowNode = Node<WorkflowNodeData>;

export type WorkflowEdge = Edge;

// ============================================================================
// Node Templates (for palette)
// ============================================================================

export interface NodeTemplate {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: string;
  category: string;
}

// ============================================================================
// Output Templates
// ============================================================================

export const OUTPUT_TEMPLATES = {
  yesNo: [
    { id: "yes", label: "Yes", type: "yes" as OutputType },
    { id: "no", label: "No", type: "no" as OutputType },
  ],
  successError: [
    { id: "success", label: "Success", type: "success" as OutputType },
    { id: "error", label: "Error", type: "error" as OutputType },
  ],
  yesNoMaybe: [
    { id: "yes", label: "Yes", type: "yes" as OutputType },
    { id: "no", label: "No", type: "no" as OutputType },
    { id: "maybe", label: "Maybe", type: "custom" as OutputType },
  ],
};

// ============================================================================
// Status Colors
// ============================================================================

export const statusColors: Record<NodeStatus, { dot: string; animate?: boolean }> = {
  idle: { dot: "bg-gray-400" },
  pending: { dot: "bg-orange-500", animate: true },
  running: { dot: "bg-blue-500", animate: true },
  success: { dot: "bg-green-500" },
  error: { dot: "bg-red-500" },
};

export const nodeTypeColors: Record<WorkflowNodeType, string> = {
  trigger: "#3b82f6",
  action: "#22c55e",
  condition: "#a855f7",
  delay: "#f97316",
  loop: "#06b6d4",
};
