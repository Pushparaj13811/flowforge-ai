"use client";

/**
 * LatestWorkflowContext
 *
 * Global context for tracking the latest workflow state across the entire conversation.
 * Enables the sticky workflow panel to always display the most recent workflow.
 */

import * as React from "react";
import type { WorkflowNode, WorkflowEdge, WorkflowStatus } from "@/lib/validation";

interface LatestWorkflowState {
  workflowId?: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: WorkflowStatus;
  lastUpdated: number; // timestamp for change detection
}

interface LatestWorkflowContextValue {
  workflow: LatestWorkflowState | null;
  previousWorkflow: LatestWorkflowState | null;
  isPanelOpen: boolean;
  updateWorkflow: (workflow: LatestWorkflowState) => void;
  clearWorkflow: () => void;
  setIsPanelOpen: (open: boolean) => void;
}

const LatestWorkflowContext = React.createContext<LatestWorkflowContextValue | undefined>(
  undefined
);

export function LatestWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{
    workflow: LatestWorkflowState | null;
    previousWorkflow: LatestWorkflowState | null;
  }>({
    workflow: null,
    previousWorkflow: null,
  });
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);

  const updateWorkflow = React.useCallback((newWorkflow: LatestWorkflowState) => {
    setState((current) => ({
      previousWorkflow: current.workflow,
      workflow: newWorkflow,
    }));
    setIsPanelOpen(true); // Auto-open panel when workflow is added
  }, []);

  const clearWorkflow = React.useCallback(() => {
    setState({
      workflow: null,
      previousWorkflow: null,
    });
  }, []);

  const value = React.useMemo<LatestWorkflowContextValue>(
    () => ({
      workflow: state.workflow,
      previousWorkflow: state.previousWorkflow,
      isPanelOpen,
      updateWorkflow,
      clearWorkflow,
      setIsPanelOpen,
    }),
    [state.workflow, state.previousWorkflow, isPanelOpen, updateWorkflow, clearWorkflow]
  );

  return (
    <LatestWorkflowContext.Provider value={value}>
      {children}
    </LatestWorkflowContext.Provider>
  );
}

export function useLatestWorkflow() {
  const context = React.useContext(LatestWorkflowContext);
  if (context === undefined) {
    throw new Error("useLatestWorkflow must be used within a LatestWorkflowProvider");
  }
  return context;
}
