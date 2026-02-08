"use client";

import * as React from "react";
import { useTamboThread } from "@tambo-ai/react";
import type { Conversation } from "@/lib/conversation/types";

export function useConversationManager() {
  const { thread, startNewThread, switchCurrentThread } = useTamboThread();
  const hasCreatedConversation = React.useRef(false);

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [loadingConversation, setLoadingConversation] = React.useState(false);

  // Fetch conversations on mount
  React.useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/conversations");
        const data = await response.json();
        if (data.conversations) {
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, []);

  // Handle new conversation
  const handleNewConversation = React.useCallback(() => {
    setActiveConversationId(null);
    setIsHistoryOpen(false);
    hasCreatedConversation.current = false;
    startNewThread();
  }, [startNewThread]);

  // Handle conversation selection
  const handleSelectConversation = React.useCallback(async (id: string) => {
    setActiveConversationId(id);
    setIsHistoryOpen(false);
    setLoadingConversation(true);

    try {
      const response = await fetch(`/api/conversations/${id}`);

      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }

      const data = await response.json();

      if (data.conversation.tamboThreadId) {
        switchCurrentThread(data.conversation.tamboThreadId, true);
      } else {
        console.warn("Conversation does not have an associated Tambo thread. Starting new thread.");
        startNewThread();
        hasCreatedConversation.current = false;
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      alert("Failed to load conversation. Please try again.");
      startNewThread();
    } finally {
      setLoadingConversation(false);
    }
  }, [startNewThread, switchCurrentThread]);

  // Handle conversation deletion
  const handleDeleteConversation = React.useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      alert("Failed to delete conversation");
    }
  }, [activeConversationId]);

  // Auto-create conversation and link to Tambo thread when user sends first message
  React.useEffect(() => {
    const createConversationForThread = async () => {
      if (!thread || !thread.id || !thread.messages || thread.messages.length === 0) {
        return;
      }

      if (hasCreatedConversation.current || activeConversationId) {
        return;
      }

      if (thread.id === "placeholder") {
        return;
      }

      const firstUserMessage = thread.messages.find((m) => m.role === "user");

      let titleText = "New Conversation";
      if (firstUserMessage) {
        const content = firstUserMessage.content;
        if (typeof content === "string") {
          titleText = content;
        } else if (Array.isArray(content)) {
          const textParts = content
            .filter((part: { type?: string; text?: string }) => part.type === "text" && part.text)
            .map((part: { text?: string }) => part.text);
          titleText = textParts.join(" ");
        }
      }

      const title = titleText.substring(0, 50) + (titleText.length > 50 ? "..." : "");

      try {
        hasCreatedConversation.current = true;

        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            tamboThreadId: thread.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setActiveConversationId(data.conversation.id);

          const conversationsResponse = await fetch("/api/conversations");
          const conversationsData = await conversationsResponse.json();
          if (conversationsData.conversations) {
            setConversations(conversationsData.conversations);
          }
        }
      } catch (error) {
        console.error("Failed to create conversation:", error);
        hasCreatedConversation.current = false;
      }
    };

    createConversationForThread();
  }, [thread, thread?.id, thread?.messages, activeConversationId]);

  // Group conversations by date
  const groupedConversations = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    return {
      today: conversations.filter((c) => new Date(c.createdAt) >= today),
      yesterday: conversations.filter(
        (c) => new Date(c.createdAt) >= yesterday && new Date(c.createdAt) < today
      ),
      lastWeek: conversations.filter(
        (c) => new Date(c.createdAt) >= lastWeek && new Date(c.createdAt) < yesterday
      ),
      older: conversations.filter((c) => new Date(c.createdAt) < lastWeek),
    };
  }, [conversations]);

  return {
    thread,
    conversations,
    activeConversationId,
    isLoadingConversations,
    isHistoryOpen,
    loadingConversation,
    groupedConversations,
    setIsHistoryOpen,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
  };
}
