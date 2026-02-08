"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { checkHasContent } from "@/lib/thread-hooks";
import { markdownComponents } from "../../markdown-components";
import { useMessageContext } from "../context";
import { formatReasoningDuration } from "../utils";

/**
 * Props for the ReasoningInfo component.
 */
export type ReasoningInfoProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content"
>;

/**
 * Internal component to render reasoning status text
 */
function ReasoningStatusText({
  isLoading,
  reasoningDurationMS,
  reasoningSteps,
}: {
  isLoading: boolean | undefined;
  reasoningDurationMS?: number;
  reasoningSteps: number;
}) {
  let statusText: string;
  if (isLoading) {
    statusText = "Thinking ";
  } else if (reasoningDurationMS) {
    statusText = formatReasoningDuration(reasoningDurationMS) + " ";
  } else {
    statusText = "Done Thinking ";
  }

  return (
    <>
      {statusText}
      {reasoningSteps > 1 ? `(${reasoningSteps} steps)` : ""}
    </>
  );
}

/**
 * Displays reasoning information in a collapsible dropdown.
 */
export const ReasoningInfo = React.forwardRef<HTMLDivElement, ReasoningInfoProps>(
  ({ className, ...props }, ref) => {
    const { message, isLoading } = useMessageContext();
    const reasoningDetailsId = React.useId();
    const [isExpanded, setIsExpanded] = useState(true);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Auto-collapse when content arrives and reasoning is not loading
    React.useEffect(() => {
      if (checkHasContent(message.content) && !isLoading) {
        setIsExpanded(false);
      }
    }, [message.content, isLoading]);

    // Auto-scroll to bottom when reasoning content changes
    React.useEffect(() => {
      if (scrollContainerRef.current && isExpanded && message.reasoning) {
        const scroll = () => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        };

        if (isLoading) {
          requestAnimationFrame(scroll);
        } else {
          const timeoutId = setTimeout(scroll, 50);
          return () => clearTimeout(timeoutId);
        }
      }
    }, [message.reasoning, isExpanded, isLoading]);

    if (!message.reasoning?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-start text-xs opacity-50",
          className,
        )}
        data-slot="reasoning-info"
        {...props}
      >
        <div className="flex flex-col w-full">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={reasoningDetailsId}
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-1 cursor-pointer hover:bg-muted-foreground/10 rounded-md px-3 py-1 select-none w-fit",
            )}
          >
            <span className={isLoading ? "animate-thinking-gradient" : ""}>
              <ReasoningStatusText
                isLoading={isLoading}
                reasoningDurationMS={message.reasoningDurationMS}
                reasoningSteps={message.reasoning.length}
              />
            </span>
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform duration-200",
                !isExpanded && "-rotate-90",
              )}
            />
          </button>
          <div
            ref={scrollContainerRef}
            id={reasoningDetailsId}
            className={cn(
              "flex flex-col gap-1 px-3 py-3 overflow-auto transition-[max-height,opacity,padding] duration-300 w-full",
              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 p-0",
            )}
          >
            {message.reasoning.map((reasoningStep, index) => (
              <div key={index} className="flex flex-col gap-1">
                {message.reasoning?.length && message.reasoning.length > 1 && (
                  <span className="text-muted-foreground text-xs font-medium">
                    Step {index + 1}:
                  </span>
                )}
                {reasoningStep ? (
                  <div className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto overflow-y-auto max-w-full">
                    <div className="whitespace-pre-wrap break-words">
                      <Streamdown components={markdownComponents}>
                        {reasoningStep}
                      </Streamdown>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

ReasoningInfo.displayName = "ReasoningInfo";
