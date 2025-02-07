import type { ValidationError } from "@/lib/workflow-validator";
import type { ExecutionResult } from "@/types/workflow";

// Re-export from centralized location for backwards compatibility
export {
  type ApiNode,
  type ApiEdge,
  apiNodesToFlowNodes,
  apiEdgesToFlowEdges,
  flowNodesToApiNodes,
  flowEdgesToApiEdges,
} from "@/lib/workflow-conversion";

export type WorkflowStatus = "draft" | "active" | "paused";

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
}

export interface WorkflowEditorState {
  workflow: Workflow | null;
  isLoading: boolean;
  isSaving: boolean;
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  validationErrors: ValidationError[] | null;
  executionError: string | null;
  showAIChat: boolean;
  showExportImport: boolean;
  showSearch: boolean;
  showTestData: boolean;
}

export interface WorkflowEditorActions {
  setWorkflow: (workflow: Workflow | null) => void;
  setIsSaving: (saving: boolean) => void;
  setIsExecuting: (executing: boolean) => void;
  setExecutionResult: (result: ExecutionResult | null) => void;
  setValidationErrors: (errors: ValidationError[] | null) => void;
  setExecutionError: (error: string | null) => void;
  setShowAIChat: (show: boolean) => void;
  setShowExportImport: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setShowTestData: (show: boolean) => void;
}

export const STATUS_CONFIG = {
  draft: { label: "Draft", variant: "secondary" as const },
  active: { label: "Active", variant: "success" as const },
  paused: { label: "Paused", variant: "warning" as const },
} as const;

export const STATUS_CYCLE: Record<WorkflowStatus, WorkflowStatus> = {
  draft: "active",
  active: "paused",
  paused: "draft",
};
