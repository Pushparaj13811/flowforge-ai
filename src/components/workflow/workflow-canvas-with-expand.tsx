"use client";

import * as React from "react";
import { WorkflowCanvas } from "./workflow-canvas";
import type { WorkflowNode, WorkflowEdge, WorkflowStatus } from "@/lib/validation";
import { useLatestWorkflow } from "@/contexts/LatestWorkflowContext";
import { cn } from "@/lib/utils";

interface WorkflowCanvasWithExpandProps {
  workflowId?: string;
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  status?: WorkflowStatus;
  className?: string;
}

/**
 * WorkflowCanvasWithExpand
 * Wrapper around WorkflowCanvas that automatically provides expand functionality
 * for use in chat messages and pushes workflow updates to global context.
 *
 * Note: This component hides itself when the sticky panel is active to avoid duplication.
 */
export function WorkflowCanvasWithExpand(props: WorkflowCanvasWithExpandProps) {
  const { workflow: stickyPanelWorkflow, updateWorkflow } = useLatestWorkflow();

  const handleExpand = React.useCallback(() => {
    // Dispatch custom event that the parent page can listen to
    const event = new CustomEvent('workflow-expand', {
      detail: {
        workflowData: {
          name: props.name,
          description: props.description,
          nodes: props.nodes,
          edges: props.edges,
        }
      },
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
  }, [props.name, props.description, props.nodes, props.edges]);

  // Push workflow updates to global context
  // This enables the sticky panel to always show the latest workflow
  React.useEffect(() => {
    // Only update if we have valid nodes (avoid empty state)
    if (props.nodes && props.nodes.length > 0) {
      updateWorkflow({
        workflowId: props.workflowId,
        name: props.name || "Untitled Workflow",
        description: props.description,
        nodes: props.nodes,
        edges: props.edges || [],
        status: props.status || "draft",
        lastUpdated: Date.now(),
      });
    }
  }, [
    props.workflowId,
    props.name,
    props.description,
    props.nodes,
    props.edges,
    props.status,
    updateWorkflow,
  ]);

  // Hide this inline canvas if the sticky panel is showing a workflow
  // This prevents duplication - the sticky panel becomes the single source of truth
  const shouldHide = stickyPanelWorkflow && stickyPanelWorkflow.nodes.length > 0;

  if (shouldHide) {
    // Return a placeholder that indicates the workflow is in the side panel
    return (
      <div className={cn("relative rounded-2xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden p-8", props.className)}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Workflow Visible in Side Panel</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your live workflow is displayed in the panel on the right. It will update automatically as we make changes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WorkflowCanvas
      {...props}
      onExpand={handleExpand}
    />
  );
}
