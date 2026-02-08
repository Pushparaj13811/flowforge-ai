"use client";

import * as React from "react";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useConversation } from "@/lib/conversation";
import { useFlowStore } from "../../store";
import type { WorkflowNode, WorkflowEdge } from "../../types";
import { detectWorkflowChanges } from "@/lib/utils/workflow-diff";
import { extractTextFromContent } from "../utils";
import { flowNodesToApiNodes, flowEdgesToApiEdges } from "../types";

interface UseChatPersistenceOptions {
  workflowId?: string;
  workflowName?: string;
  threadId?: string;
  messages: TamboThreadMessage[] | undefined;
}

export function useChatPersistence({
  workflowId,
  workflowName,
  threadId,
  messages,
}: UseChatPersistenceOptions) {
  const { nodes, edges, setConversation } = useFlowStore();
  const {
    conversationId,
    startConversation,
    addMessage,
    saveWorkflowSnapshot,
  } = useConversation();

  // Track previous nodes/edges for change detection
  const prevNodesRef = React.useRef<WorkflowNode[]>(nodes);
  const prevEdgesRef = React.useRef<WorkflowEdge[]>(edges);
  const persistedMessageIdsRef = React.useRef<Set<string>>(new Set());
  const lastSnapshotMessageIdRef = React.useRef<string | null>(null);

  // Track if we've already initialized for this workflow
  const initializedWorkflowRef = React.useRef<string | null>(null);

  // Initialize conversation for this workflow
  React.useEffect(() => {
    const initConversation = async () => {
      if (!workflowId) return;

      // Skip if we've already initialized for this workflow
      if (initializedWorkflowRef.current === workflowId) return;

      try {
        // First check if there's an existing conversation for this workflow
        const response = await fetch(`/api/conversations?workflowId=${workflowId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.conversations && data.conversations.length > 0) {
            // Use the most recent existing conversation
            const existingConv = data.conversations[0];
            setConversation(existingConv.id);
            initializedWorkflowRef.current = workflowId;
            return;
          }
        }

        // No existing conversation, create a new one
        const convId = await startConversation(workflowId, `${workflowName} - AI Chat`);
        setConversation(convId);
        initializedWorkflowRef.current = workflowId;
      } catch (error) {
        console.error("[AIChatPanel] Failed to initialize conversation:", error);
      }
    };

    if (workflowId && !conversationId) {
      initConversation();
    }
  }, [workflowId, workflowName, conversationId, startConversation, setConversation]);

  // Persist Tambo messages to database (debounced)
  React.useEffect(() => {
    if (!messages || !conversationId) return;

    const timeoutId = setTimeout(async () => {
      for (const message of messages) {
        if (persistedMessageIdsRef.current.has(message.id)) continue;
        if (message.role !== "user" && message.role !== "assistant") continue;

        try {
          const content = extractTextFromContent(message.content);
          if (!content) continue;

          await addMessage(message.role, content, {
            tamboThreadId: threadId,
            tamboMessageId: message.id,
            workflowId,
          });

          persistedMessageIdsRef.current.add(message.id);
        } catch (error) {
          console.error("[AIChatPanel] Failed to persist message:", error);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [messages, conversationId, addMessage, threadId, workflowId]);

  // Save workflow snapshot when AI makes changes
  React.useEffect(() => {
    if (!messages || !conversationId || !workflowId) return;

    // Skip on initial mount
    if (prevNodesRef.current.length === 0 && nodes.length > 0) {
      prevNodesRef.current = nodes;
      prevEdgesRef.current = edges;
      return;
    }

    // Find the most recent assistant message
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "assistant");

    if (!lastAssistantMessage) return;

    // Skip if we already saved a snapshot for this message
    if (lastSnapshotMessageIdRef.current === lastAssistantMessage.id) return;

    const timeoutId = setTimeout(() => {
      const { changes, summary } = detectWorkflowChanges(
        prevNodesRef.current,
        nodes,
        prevEdgesRef.current,
        edges
      );

      if (changes.length > 0) {
        const apiNodes = flowNodesToApiNodes(nodes);
        const apiEdges = flowEdgesToApiEdges(edges);

        saveWorkflowSnapshot(apiNodes, apiEdges, summary)
          .then(() => {
            lastSnapshotMessageIdRef.current = lastAssistantMessage.id;
            prevNodesRef.current = nodes;
            prevEdgesRef.current = edges;
          })
          .catch((error) => {
            console.error("[AIChatPanel] Failed to save snapshot:", error);
          });
      } else {
        lastSnapshotMessageIdRef.current = lastAssistantMessage.id;
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [messages, nodes, edges, conversationId, workflowId, saveWorkflowSnapshot]);

  return { conversationId };
}
