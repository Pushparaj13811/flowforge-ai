"use client";

import * as React from "react";
import { MessageSquare, Clock, User, Bot, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatConversation {
  id: string;
  title: string;
  messages?: ChatMessage[];
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatHistoryProps {
  workflowId: string;
  onSelectConversation?: (conversationId: string) => void;
  className?: string;
}

/**
 * ChatHistory Component
 * Displays chat conversation history for a specific workflow
 */
export function ChatHistory({ workflowId, onSelectConversation, className }: ChatHistoryProps) {
  const [conversations, setConversations] = React.useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Load chat history for this workflow
  React.useEffect(() => {
    const loadChatHistory = async () => {
      if (!workflowId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/conversations?workflowId=${workflowId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [workflowId]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    onSelectConversation?.(conversationId);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
        <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground text-center">
          No chat history for this workflow
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1 text-center">
          Your AI conversations will appear here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-3 space-y-2">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              "group relative rounded-lg border p-3 cursor-pointer transition-all",
              selectedId === conversation.id
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
            )}
            onClick={() => handleSelectConversation(conversation.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                  <MessageSquare className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm font-medium leading-tight truncate">
                  {conversation.title || "Untitled conversation"}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteConversation(e, conversation.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Timestamp and message count */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(conversation.updatedAt || conversation.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {conversation.messageCount !== undefined && conversation.messageCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{conversation.messageCount} messages</span>
                </div>
              )}
            </div>

            {/* Message preview - show last message */}
            {conversation.messages && conversation.messages.length > 0 && (
              <div className="mt-2 flex items-start gap-2">
                <div className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded",
                  conversation.messages[conversation.messages.length - 1].role === "assistant"
                    ? "bg-purple-100 dark:bg-purple-950/30"
                    : "bg-blue-100 dark:bg-blue-950/30"
                )}>
                  {conversation.messages[conversation.messages.length - 1].role === "assistant" ? (
                    <Bot className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <User className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                  {conversation.messages[conversation.messages.length - 1].content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
