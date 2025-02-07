import type { WorkflowNode, WorkflowEdge } from "@/components/flow-editor";
import type { ExecutionResult } from "@/types/workflow";
import {
  type Workflow,
  type WorkflowStatus,
  type ApiNode,
  type ApiEdge,
  apiNodesToFlowNodes,
  apiEdgesToFlowEdges,
  flowNodesToApiNodes,
  flowEdgesToApiEdges,
} from "./types";

export interface FetchWorkflowResult {
  workflow: Workflow;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export async function fetchWorkflow(workflowId: string): Promise<FetchWorkflowResult | null> {
  const response = await fetch(`/api/workflows/${workflowId}`, {
    credentials: "include",
  });
  const data = await response.json();

  if (!data.workflow) {
    return null;
  }

  const wf = data.workflow;
  const workflow: Workflow = {
    id: wf.id,
    name: wf.name,
    description: wf.description,
    status: wf.status as WorkflowStatus,
  };

  const nodes = apiNodesToFlowNodes(wf.nodes || []);
  const edges = apiEdgesToFlowEdges(wf.edges || []);

  return { workflow, nodes, edges };
}

export async function saveWorkflow(
  workflowId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Promise<boolean> {
  const apiNodes = flowNodesToApiNodes(nodes);
  const apiEdges = flowEdgesToApiEdges(edges);

  const response = await fetch(`/api/workflows/${workflowId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ nodes: apiNodes, edges: apiEdges }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[WorkflowEditor] Save failed:", errorData);
    return false;
  }

  return true;
}

export async function updateWorkflowStatus(
  workflowId: string,
  newStatus: WorkflowStatus
): Promise<boolean> {
  const response = await fetch(`/api/workflows/${workflowId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: newStatus }),
  });

  return response.ok;
}

export async function executeWorkflow(
  workflowId: string,
  testData: Record<string, unknown>
): Promise<{ executionId: string } & ExecutionResult> {
  const response = await fetch(`/api/workflows/${workflowId}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ triggerData: testData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || "Execution failed");
  }

  return response.json();
}

export async function fetchExecutionStatus(executionId: string): Promise<ExecutionResult> {
  const response = await fetch(`/api/executions/${executionId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch execution status");
  }

  const data = await response.json();
  const execution = data.execution;

  return {
    executionId: execution.id,
    workflowId: execution.workflowId,
    status: execution.status,
    triggeredBy: execution.triggeredBy || "manual",
    triggerId: execution.triggerId,
    startedAt: execution.startedAt,
    completedAt: execution.completedAt,
    duration: execution.completedAt
      ? new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()
      : null,
    steps: execution.steps || [],
    error: execution.error,
    metadata: execution.metadata,
  };
}

export async function fetchVersion(
  workflowId: string,
  versionId: string
): Promise<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }> {
  const response = await fetch(`/api/workflows/${workflowId}/versions/${versionId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch version");
  }

  const data = await response.json();
  const version = data.version;

  return {
    nodes: apiNodesToFlowNodes(version.nodes || []),
    edges: apiEdgesToFlowEdges(version.edges || []),
  };
}

export async function rollbackToVersion(
  workflowId: string,
  versionId: string
): Promise<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }> {
  const response = await fetch(`/api/workflows/${workflowId}/rollback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ versionId }),
  });

  if (!response.ok) {
    throw new Error("Rollback failed");
  }

  const data = await response.json();
  const restoredWorkflow = data.workflow;

  return {
    nodes: apiNodesToFlowNodes(restoredWorkflow.nodes || []),
    edges: apiEdgesToFlowEdges(restoredWorkflow.edges || []),
  };
}
