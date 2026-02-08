import type { WorkflowNode, WorkflowEdge } from "@/components/flow-editor/types";
import type { WorkflowNodeType, NodeStatus } from "@/components/flow-editor/types";

export interface ApiNode {
  id: string;
  type?: string;
  label: string;
  description?: string;
  icon?: string;
  status?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
}

export interface ApiEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
}

export const apiNodesToFlowNodes = (apiNodes: ApiNode[]): WorkflowNode[] =>
  apiNodes.map((n, index) => ({
    id: n.id || `node-${index}`,
    type: n.type === "condition" ? "condition" : "custom",
    position: n.position || { x: 250, y: 50 + index * 150 },
    data: {
      label: n.label,
      description: n.description,
      icon: n.icon,
      nodeType: (n.type as WorkflowNodeType) || "action",
      status: (n.status as NodeStatus) || "idle",
      config: n.config || {},
    },
  }));

export const apiEdgesToFlowEdges = (apiEdges: ApiEdge[]): WorkflowEdge[] =>
  apiEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    label: e.label,
    type: "smoothstep",
    animated: true,
  }));

export const flowNodesToApiNodes = (nodes: WorkflowNode[]): ApiNode[] =>
  nodes
    .filter((n) => n.data?.nodeType && n.data?.label)
    .map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      label: n.data.label,
      description: n.data.description,
      icon: n.data.icon,
      status: n.data.status,
      position: n.position,
      config: n.data.config,
    }));

export const flowEdgesToApiEdges = (edges: WorkflowEdge[]): ApiEdge[] =>
  edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    label: typeof e.label === "string" ? e.label : undefined,
  }));
