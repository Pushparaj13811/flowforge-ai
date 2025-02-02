"use client";

import * as React from "react";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useFlowStore } from "../../store";
import { extractTextFromContent } from "../utils";
import { apiNodesToFlowNodes, apiEdgesToFlowEdges } from "../types";

interface UseWorkflowUpdatesOptions {
  messages: TamboThreadMessage[] | undefined;
}

export function useWorkflowUpdates({ messages }: UseWorkflowUpdatesOptions) {
  const { setNodes, setEdges, saveToHistory } = useFlowStore();
  const [lastAppliedUpdate, setLastAppliedUpdate] = React.useState<string | null>(null);
  const lastAppliedUpdateRef = React.useRef<string | null>(null);
  const isApplyingUpdateRef = React.useRef(false);

  React.useEffect(() => {
    if (!messages) return;
    if (isApplyingUpdateRef.current) {
      return;
    }

    // Find the most recent tool response message with workflow data
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];

      // Check for tool response messages (role === "tool")
      if (msg.role === 'tool') {
        const textContent = extractTextFromContent(msg.content);

        if (textContent) {
          try {
            const result = JSON.parse(textContent);

            // Check if this is a workflow update result
            if (result.success && result.workflow && Array.isArray(result.workflow.nodes)) {
              const workflow = result.workflow;
              const updateId = `${msg.id}-${workflow.nodes.length}-${workflow.nodes.map((n: { id: string }) => n.id).join(',')}`;

              // Only apply if we haven't already applied this update
              if (updateId !== lastAppliedUpdateRef.current) {
                // Set flag to prevent concurrent updates
                isApplyingUpdateRef.current = true;

                const flowNodes = apiNodesToFlowNodes(workflow.nodes);
                const flowEdges = apiEdgesToFlowEdges(workflow.edges || []);

                // Mark as applied in ref
                lastAppliedUpdateRef.current = updateId;
                setLastAppliedUpdate(updateId);

                // Batch state updates together
                setNodes(flowNodes);
                setEdges(flowEdges);

                // Save to history and reset flag after state updates
                queueMicrotask(() => {
                  saveToHistory();
                  setTimeout(() => {
                    isApplyingUpdateRef.current = false;
                  }, 100);
                });

                return;
              }
            }
          } catch {
            // Not valid JSON, skip
          }
        }
      }
    }
  }, [messages, setNodes, setEdges, saveToHistory]);

  return { lastAppliedUpdate };
}
