"use client";

import * as React from "react";
import { useState } from "react";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import stringify from "json-stringify-pretty-compact";
import { useTambo } from "@tambo-ai/react";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import { useMessageContext } from "../context";
import {
  getToolCallRequest,
  getToolStatusMessage,
  keyifyParameters,
  formatToolResult,
} from "../utils";
import { SamplingSubThread } from "./SamplingSubThread";

/**
 * Props for the ToolcallInfo component.
 */
export interface ToolcallInfoProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content"
> {
  markdown?: boolean;
}

/**
 * Internal component to render tool call status icon
 */
function ToolcallStatusIcon({
  hasToolError,
  isLoading,
}: {
  hasToolError: boolean | undefined;
  isLoading: boolean | undefined;
}) {
  if (hasToolError) {
    return <X className="w-3 h-3 text-bold text-red-500" />;
  }
  if (isLoading) {
    return (
      <Loader2 className="w-3 h-3 text-muted-foreground text-bold animate-spin" />
    );
  }
  return <Check className="w-3 h-3 text-bold text-green-500" />;
}

/**
 * Displays tool call information in a collapsible dropdown.
 */
export const ToolcallInfo = React.forwardRef<HTMLDivElement, ToolcallInfoProps>(
  ({ className, markdown = true, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { message, isLoading } = useMessageContext();
    const { thread } = useTambo();
    const toolDetailsId = React.useId();

    const associatedToolResponse = React.useMemo(() => {
      if (!thread?.messages) return null;
      const currentMessageIndex = thread.messages.findIndex(
        (m: TamboThreadMessage) => m.id === message.id,
      );
      if (currentMessageIndex === -1) return null;
      for (let i = currentMessageIndex + 1; i < thread.messages.length; i++) {
        const nextMessage = thread.messages[i];
        if (nextMessage.role === "tool") {
          return nextMessage;
        }
        if (
          nextMessage.role === "assistant" &&
          getToolCallRequest(nextMessage)
        ) {
          break;
        }
      }
      return null;
    }, [message, thread?.messages]);

    if (message.role !== "assistant" || !getToolCallRequest(message)) {
      return null;
    }

    const toolCallRequest = getToolCallRequest(message);
    const hasToolError = !!message.error;
    const toolStatusMessage = getToolStatusMessage(message, isLoading);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-start text-xs opacity-50",
          className,
        )}
        data-slot="toolcall-info"
        {...props}
      >
        <div className="flex flex-col w-full">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={toolDetailsId}
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-1 cursor-pointer hover:bg-muted rounded-md p-1 select-none w-fit",
            )}
          >
            <ToolcallStatusIcon
              hasToolError={hasToolError}
              isLoading={isLoading}
            />
            <span>{toolStatusMessage}</span>
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform duration-200",
                !isExpanded && "-rotate-90",
              )}
            />
          </button>
          <div
            id={toolDetailsId}
            className={cn(
              "flex flex-col gap-1 p-3 pl-7 overflow-auto transition-[max-height,opacity,padding] duration-300 w-full truncate",
              isExpanded ? "max-h-auto opacity-100" : "max-h-0 opacity-0 p-0",
            )}
          >
            <span className="whitespace-pre-wrap pl-2">
              tool: {toolCallRequest?.toolName}
            </span>
            <span className="whitespace-pre-wrap pl-2">
              parameters:{"\n"}
              {stringify(keyifyParameters(toolCallRequest?.parameters))}
            </span>
            <SamplingSubThread parentMessageId={message.id} />
            {associatedToolResponse && (
              <div className="pl-2">
                <span className="whitespace-pre-wrap">result:</span>
                <div>
                  {!associatedToolResponse.content ? (
                    <span className="text-muted-foreground italic">
                      Empty response
                    </span>
                  ) : (
                    formatToolResult(associatedToolResponse.content, markdown)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

ToolcallInfo.displayName = "ToolcallInfo";
