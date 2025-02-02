"use client";

/**
 * StickyWorkflowPanel
 *
 * A fixed-position panel that displays the latest workflow state during conversation.
 * Always shows the most recent workflow with visual highlights for changes.
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelRightClose, PanelRightOpen, Maximize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLatestWorkflow } from "@/contexts/LatestWorkflowContext";
import { WorkflowCanvas } from "./workflow-canvas";

export function StickyWorkflowPanel() {
  const { workflow, previousWorkflow, isPanelOpen, setIsPanelOpen } = useLatestWorkflow();
  const [changedNodeIds, setChangedNodeIds] = React.useState<Set<string>>(new Set());

  // Helper to check if a node has changed
  const hasNodeChanged = React.useCallback(
    (
      prev: { id: string; type: string; label: string; description?: string; status?: string; position?: { x: number; y: number } },
      current: { id: string; type: string; label: string; description?: string; status?: string; position?: { x: number; y: number } }
    ) => {
      return (
        prev.label !== current.label ||
        prev.description !== current.description ||
        prev.status !== current.status ||
        prev.type !== current.type ||
        prev.position?.x !== current.position?.x ||
        prev.position?.y !== current.position?.y
      );
    },
    []
  );

  // Detect changes between previous and current workflow
  React.useEffect(() => {
    if (!workflow || !previousWorkflow) {
      setChangedNodeIds(new Set());
      return;
    }

    const changed = new Set<string>();

    // Check for new or modified nodes
    workflow.nodes.forEach((node) => {
      const prevNode = previousWorkflow.nodes.find((n) => n.id === node.id);
      if (!prevNode) {
        // New node
        changed.add(node.id);
      } else if (hasNodeChanged(prevNode, node)) {
        // Modified node
        changed.add(node.id);
      }
    });

    setChangedNodeIds(changed);

    // Clear highlights after animation completes
    const timeout = setTimeout(() => {
      setChangedNodeIds(new Set());
    }, 2000);

    return () => clearTimeout(timeout);
  }, [workflow, previousWorkflow, hasNodeChanged]);

  // Handle expand to full editor
  const handleExpand = React.useCallback(() => {
    if (!workflow) return;

    const event = new CustomEvent("workflow-expand", {
      detail: {
        workflowData: {
          name: workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
      },
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
  }, [workflow]);

  // Don't render if no workflow exists
  if (!workflow || workflow.nodes.length === 0) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 border-l border-border bg-background overflow-hidden"
          >
          <div className="w-full h-full flex flex-col">
            <div className="shrink-0 h-14 px-4 border-b border-border flex items-center justify-between bg-background">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Workflow Icon */}
                <div className="h-8 w-8 rounded-lg bg-flow-blue/10 flex items-center justify-center border border-flow-blue/20 shrink-0">
                  <Sparkles className="h-4 w-4 text-flow-blue" />
                </div>

                {/* Workflow Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate text-foreground">
                    {workflow.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Live Preview</span>
                    <span>•</span>
                    <span>{workflow.nodes.length} {workflow.nodes.length === 1 ? 'node' : 'nodes'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Edit Button - Primary CTA */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleExpand}
                  className="h-8 gap-1.5"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Edit
                </Button>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsPanelOpen(false)}
                  aria-label="Close panel"
                  title="Close panel"
                  className="h-8 w-8"
                >
                  <PanelRightClose className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Canvas Container - Full Space */}
            <div className="flex-1 overflow-hidden bg-background">
              <WorkflowCanvas
                workflowId={workflow.workflowId}
                name={workflow.name}
                description={workflow.description}
                nodes={workflow.nodes}
                edges={workflow.edges}
                status={workflow.status}
                highlightNodeIds={changedNodeIds}
                hideHeader={true}
                hideControls={true}
                isInStickyPanel={true}
                className="h-full"
              />
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Toggle Button */}
      <AnimatePresence>
        {!isPanelOpen && (
          <motion.button
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setIsPanelOpen(true)}
            className={cn(
              "fixed right-0 top-20 z-[95]",
              "bg-background border-y border-l border-border",
              "rounded-l-lg px-2 py-3",
              "hover:bg-muted/50 transition-colors",
              "pointer-events-auto"
            )}
            aria-label="Show workflow panel"
            title="Show workflow panel"
          >
            <PanelRightOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
