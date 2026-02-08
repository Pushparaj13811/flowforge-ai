"use client";

import * as React from "react";
import { Bot, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import { markdownComponents } from "@/components/tambo/markdown-components";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { getMessageContent } from "../utils";

interface ChatMessagesListProps {
  messages: TamboThreadMessage[];
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  lastAppliedUpdate: string | null;
}

export function ChatMessagesList({
  messages,
  isPending,
  isError,
  error,
  lastAppliedUpdate,
}: ChatMessagesListProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {messages.map((msg) => {
        const content = getMessageContent(msg.content);
        if (!content) return null;

        return (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {msg.role === "user" ? (
                <span className="text-[10px] font-medium">U</span>
              ) : (
                <Bot className="h-3 w-3" />
              )}
            </div>
            <div
              className={cn(
                "px-3 py-2 rounded-lg text-sm max-w-[85%]",
                "[&_pre]:max-w-full [&_pre]:text-xs [&_pre]:border-0 [&_pre]:shadow-none",
                "[&_code]:text-xs",
                "[&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:block",
                "[&_.markdown-code-header]:hidden",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {msg.role === "assistant" ? (
                <Streamdown components={markdownComponents}>
                  {content}
                </Streamdown>
              ) : (
                content
              )}
            </div>
          </div>
        );
      })}

      {/* Pending indicator */}
      {isPending && <PendingIndicator />}

      {/* Error indicator */}
      {isError && error && <ErrorIndicator error={error} />}

      {/* Update applied indicator */}
      {lastAppliedUpdate && !isError && <UpdateAppliedIndicator />}

      <div ref={messagesEndRef} />
    </>
  );
}

function PendingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
        <Bot className="h-3 w-3" />
      </div>
      <div className="px-3 py-2 rounded-lg bg-muted">
        <div className="flex gap-1">
          <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function ErrorIndicator({ error }: { error: Error }) {
  return (
    <div className="flex items-center gap-2 p-3 mx-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{error.message || "Failed to send message. Please try again."}</span>
    </div>
  );
}

function UpdateAppliedIndicator() {
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      <span>Canvas updated</span>
    </div>
  );
}
