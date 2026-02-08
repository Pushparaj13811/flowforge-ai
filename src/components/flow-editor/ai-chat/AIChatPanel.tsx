"use client";

import * as React from "react";
import { X, Sparkles, History as HistoryIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTamboThreadInput, useTamboThread } from "@tambo-ai/react";
import { useFlowStore } from "../store";

import type { AIChatPanelProps } from "./types";
import { buildWorkflowContext } from "./utils";
import { useWorkflowUpdates, useChatPersistence } from "./hooks";
import { ChatMessagesList, EmptyState, ChatInput, ChatHistory } from "./parts";

export function AIChatPanel({ onClose, className, workflowId, workflowName }: AIChatPanelProps) {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending, error, isError } = useTamboThreadInput();
  const { nodes, edges } = useFlowStore();

  const [activeTab, setActiveTab] = React.useState<'chat' | 'history'>('chat');

  // Workflow update handling
  const { lastAppliedUpdate } = useWorkflowUpdates({ messages: thread?.messages });

  // Chat persistence
  useChatPersistence({
    workflowId,
    workflowName,
    threadId: thread?.id,
    messages: thread?.messages,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;

    const contextMessage = buildWorkflowContext(
      workflowId || "current-canvas",
      workflowName || "Current Workflow",
      nodes,
      edges,
      value
    );

    try {
      await submit({
        additionalContext: {
          workflowContext: contextMessage,
        },
      });
    } catch (err) {
      console.error("[AIChatPanel] Submit error:", err);
    }
  };

  // Filter messages for display
  const displayMessages = React.useMemo(() => {
    if (!thread?.messages) return [];

    return thread.messages.filter((msg) => {
      if (msg.role === "tool") return false;

      const content = msg.content as unknown;

      if (typeof content === "string") {
        const trimmed = content.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            JSON.parse(trimmed);
            return false;
          } catch {
            // Not valid JSON, keep it
          }
        }
        return trimmed.length > 0;
      }

      if (Array.isArray(content)) {
        const textParts = content.filter((part: unknown) =>
          typeof part === 'object' && part !== null && 'type' in part && (part as { type: string }).type === 'text'
        );
        return textParts.length > 0;
      }

      return false;
    });
  }, [thread?.messages]);

  return (
    <div className={cn("h-full flex flex-col bg-white dark:bg-card", className)}>
      {/* Header */}
      <div className="border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-medium">AI Assistant</span>
              {nodes.length > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  {nodes.length} nodes
                </span>
              )}
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-2 pb-2">
          <Button
            variant={activeTab === 'chat' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setActiveTab('chat')}
          >
            <Sparkles className="h-3 w-3" />
            Chat
          </Button>
          <Button
            variant={activeTab === 'history' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setActiveTab('history')}
          >
            <HistoryIcon className="h-3 w-3" />
            History
          </Button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'chat' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {displayMessages.length === 0 ? (
            <EmptyState onSelectSuggestion={setValue} />
          ) : (
            <ChatMessagesList
              messages={displayMessages}
              isPending={isPending}
              isError={isError}
              error={error}
              lastAppliedUpdate={lastAppliedUpdate}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <ChatHistory
            workflowId={workflowId || ''}
            className="h-full"
          />
        </div>
      )}

      {/* Input (only show for chat tab) */}
      {activeTab === 'chat' && (
        <ChatInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      )}
    </div>
  );
}
