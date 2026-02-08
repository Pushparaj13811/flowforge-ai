"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTambo } from "@tambo-ai/react";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import { getSafeContent } from "@/lib/thread-hooks";

/**
 * Displays a message's child messages in a collapsible dropdown.
 * Used for MCP sampling sub-threads.
 */
export const SamplingSubThread = ({
  parentMessageId,
  titleText = "finished additional work",
}: {
  parentMessageId: string;
  titleText?: string;
}) => {
  const { thread } = useTambo();
  const [isExpanded, setIsExpanded] = useState(false);
  const samplingDetailsId = React.useId();

  const childMessages = React.useMemo(() => {
    return thread?.messages?.filter(
      (m: TamboThreadMessage) => m.parentMessageId === parentMessageId,
    );
  }, [thread?.messages, parentMessageId]);

  if (!childMessages?.length) return null;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={samplingDetailsId}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-1 cursor-pointer hover:bg-muted-foreground/10 rounded-md p-2 select-none w-fit",
        )}
      >
        <span>{titleText}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>
      <div
        id={samplingDetailsId}
        className={cn(
          "transition-[max-height,opacity] duration-300",
          isExpanded
            ? "max-h-96 opacity-100 overflow-auto"
            : "max-h-0 opacity-0 overflow-hidden",
        )}
        aria-hidden={!isExpanded}
      >
        <div className="pl-2">
          <div className="border-l-2 border-muted-foreground p-2 flex flex-col gap-4">
            {childMessages?.map((m: TamboThreadMessage) => (
              <div key={m.id} className={`${m.role === "user" && "pl-2"}`}>
                <span
                  className={cn(
                    "whitespace-pre-wrap",
                    m.role === "assistant" &&
                      "bg-muted/50 rounded-md p-2 inline-block w-fit",
                  )}
                >
                  {getSafeContent(m.content)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
SamplingSubThread.displayName = "SamplingSubThread";
