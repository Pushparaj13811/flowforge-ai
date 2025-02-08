/**
 * @file useConversation.ts
 * @description Hook for managing conversation state and API calls
 */

"use client";

import * as React from "react";

interface UseConversationReturn {
  conversationId: string | null;
  startConversation: (workflowId: string, title: string) => Promise<string>;
  addMessage: (
    role: "user" | "assistant",
    content: string,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
  saveWorkflowSnapshot: (
    nodes: unknown[],
    edges: unknown[],
    changeDescription: string
  ) => Promise<void>;
}

export function useConversation(): UseConversationReturn {
  const [conversationId, setConversationId] = React.useState<string | null>(null);

  const startConversation = React.useCallback(
    async (workflowId: string, title: string): Promise<string> => {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowId,
            title,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to start conversation");
        }

        const data = await response.json();
        const id = data.conversation?.id;

        if (id) {
          setConversationId(id);
        }

        return id;
      } catch (error) {
        console.error("[useConversation] Failed to start conversation:", error);
        throw error;
      }
    },
    []
  );

  const addMessage = React.useCallback(
    async (
      role: "user" | "assistant",
      content: string,
      metadata?: Record<string, unknown>
    ): Promise<void> => {
      if (!conversationId) {
        console.warn("[useConversation] No active conversation");
        return;
      }

      try {
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            content,
            metadata,
          }),
          credentials: "include",
        });
      } catch (error) {
        console.error("[useConversation] Failed to add message:", error);
      }
    },
    [conversationId]
  );

  const saveWorkflowSnapshot = React.useCallback(
    async (
      nodes: unknown[],
      edges: unknown[],
      changeDescription: string
    ): Promise<void> => {
      if (!conversationId) {
        console.warn("[useConversation] No active conversation for snapshot");
        return;
      }

      try {
        await fetch(`/api/conversations/${conversationId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodes,
            edges,
            changeDescription,
          }),
          credentials: "include",
        });
      } catch (error) {
        console.error("[useConversation] Failed to save workflow snapshot:", error);
      }
    },
    [conversationId]
  );

  return {
    conversationId,
    startConversation,
    addMessage,
    saveWorkflowSnapshot,
  };
}
