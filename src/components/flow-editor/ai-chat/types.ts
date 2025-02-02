// Re-export from centralized location for backwards compatibility
export {
  type ApiNode,
  type ApiEdge,
  apiNodesToFlowNodes,
  apiEdgesToFlowEdges,
  flowNodesToApiNodes,
  flowEdgesToApiEdges,
} from "@/lib/workflow-conversion";

export interface AIChatPanelProps {
  onClose?: () => void;
  className?: string;
  workflowId?: string;
  workflowName?: string;
}
