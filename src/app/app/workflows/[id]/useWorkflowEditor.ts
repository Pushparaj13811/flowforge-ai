"use client";

import * as React from "react";
import { useFlowStore } from "@/components/flow-editor";
import { validateWorkflow } from "@/lib/workflow-validator";
import type { ValidationError } from "@/lib/workflow-validator";
import type { ExecutionResult } from "@/types/workflow";
import type { Workflow, WorkflowStatus } from "./types";
import { STATUS_CYCLE } from "./types";
import {
  fetchWorkflow,
  saveWorkflow,
  executeWorkflow,
  fetchExecutionStatus,
  updateWorkflowStatus,
} from "./workflow-api";

interface UseWorkflowEditorOptions {
  workflowId: string;
}

export function useWorkflowEditor({ workflowId }: UseWorkflowEditorOptions) {
  const [workflow, setWorkflow] = React.useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executionResult, setExecutionResult] = React.useState<ExecutionResult | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[] | null>(null);
  const [executionError, setExecutionError] = React.useState<string | null>(null);
  const [showAIChat, setShowAIChat] = React.useState(false);
  const [showExportImport, setShowExportImport] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showTestData, setShowTestData] = React.useState(false);

  const {
    nodes,
    edges,
    loadWorkflow,
    showLeftSidebar,
    showRightSidebar,
    toggleLeftSidebar,
    toggleRightSidebar,
    selectedNodeId,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFlowStore();

  // Fetch workflow on mount
  React.useEffect(() => {
    async function load() {
      try {
        const result = await fetchWorkflow(workflowId);
        if (result) {
          setWorkflow(result.workflow);
          loadWorkflow(result.nodes, result.edges);
        }
      } catch (error) {
        console.error("Failed to fetch workflow:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [workflowId, loadWorkflow]);

  // Save workflow handler
  const handleSave = React.useCallback(async () => {
    if (!workflow) return;
    setIsSaving(true);
    try {
      await saveWorkflow(workflowId, nodes, edges);
    } catch (error) {
      console.error("Failed to save workflow:", error);
    } finally {
      setIsSaving(false);
    }
  }, [workflow, workflowId, nodes, edges]);

  // Poll execution status
  const pollExecutionStatus = React.useCallback(async (executionId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const result = await fetchExecutionStatus(executionId);

        if (result.status === "completed" || result.status === "failed") {
          setExecutionResult(result);
          setIsExecuting(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          // The execution continues in the background - the polling just timed out
          setExecutionError(
            "Test execution polling timed out after 2 minutes. The workflow may still be running in the background. " +
            "Check the 'History' tab for the actual execution status. " +
            "Note: For webhook-triggered workflows, the workflow stays active and runs each time a request is received."
          );
          setIsExecuting(false);
        }
      } catch {
        setExecutionError("Failed to fetch execution status");
        setIsExecuting(false);
      }
    };

    poll();
  }, []);

  // Execute workflow with test data
  const handleExecuteWithData = React.useCallback(async (testData: Record<string, unknown>) => {
    if (!workflow) return;

    if (workflow.status !== "active") {
      setExecutionError("Workflow must be active to execute. Please activate it first.");
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      const result = await executeWorkflow(workflowId, testData);
      setExecutionResult(result);
      pollExecutionStatus(result.executionId);
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : "Failed to execute workflow");
      setIsExecuting(false);
    }
  }, [workflow, workflowId, pollExecutionStatus]);

  // Show test data modal before executing
  const handleExecute = React.useCallback(() => {
    const validation = validateWorkflow(nodes, edges);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }
    setShowTestData(true);
  }, [nodes, edges]);

  // Toggle workflow status
  const handleToggleStatus = React.useCallback(async () => {
    if (!workflow) return;

    const newStatus = STATUS_CYCLE[workflow.status];
    try {
      const success = await updateWorkflowStatus(workflowId, newStatus);
      if (success) {
        setWorkflow({ ...workflow, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }, [workflow, workflowId]);

  // Auto-save workflow with debouncing
  React.useEffect(() => {
    if (!workflow || nodes.length === 0) return;

    const timeoutId = setTimeout(() => {
      console.log("[WorkflowEditor] Auto-saving workflow...");
      handleSave();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, workflow, handleSave]);

  // Auto-open right sidebar when a node is selected
  React.useEffect(() => {
    if (selectedNodeId && !showRightSidebar && !showAIChat) {
      toggleRightSidebar();
    }
  }, [selectedNodeId, showRightSidebar, showAIChat, toggleRightSidebar]);

  // Keyboard shortcut for search (Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    // State
    workflow,
    isLoading,
    isSaving,
    isExecuting,
    executionResult,
    validationErrors,
    executionError,
    showAIChat,
    showExportImport,
    showSearch,
    showTestData,

    // Flow store state
    nodes,
    edges,
    showLeftSidebar,
    showRightSidebar,
    selectedNodeId,

    // Actions
    setWorkflow,
    setValidationErrors,
    setExecutionError,
    setExecutionResult,
    setShowAIChat,
    setShowExportImport,
    setShowSearch,
    setShowTestData,

    // Flow store actions
    loadWorkflow,
    toggleLeftSidebar,
    toggleRightSidebar,
    undo,
    redo,
    canUndo,
    canRedo,

    // Handlers
    handleSave,
    handleExecute,
    handleExecuteWithData,
    handleToggleStatus,
  };
}
