"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";
import { useTamboThread, useIsTamboTokenUpdating } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import { useMessageInputContext } from "../../context";
import type { MessageInputSubmitButtonProps } from "../../types";

/**
 * Submit button component for sending messages.
 * Automatically connects to the context to handle submission state.
 * @component MessageInput.SubmitButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <div className="flex justify-end mt-2 p-1">
 *     <MessageInput.SubmitButton />
 *   </div>
 * </MessageInput>
 * ```
 */
export const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
  const { isPending } = useMessageInputContext();
  const { cancel, isIdle } = useTamboThread();
  const isUpdatingToken = useIsTamboTokenUpdating();

  // Show cancel button if either:
  // 1. A mutation is in progress (isPending), OR
  // 2. Thread is stuck in a processing state (e.g., after browser refresh during tool execution)
  const showCancelButton = isPending || !isIdle;

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await cancel();
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer",
    className,
  );

  return (
    <button
      ref={ref}
      type={showCancelButton ? "button" : "submit"}
      disabled={isUpdatingToken}
      onClick={showCancelButton ? handleCancel : undefined}
      className={buttonClasses}
      aria-label={showCancelButton ? "Cancel message" : "Send message"}
      data-slot={
        showCancelButton ? "message-input-cancel" : "message-input-submit"
      }
      {...props}
    >
      {children ??
        (showCancelButton ? (
          <Square className="w-4 h-4" fill="currentColor" />
        ) : (
          <ArrowUp className="w-5 h-5" />
        ))}
    </button>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";
