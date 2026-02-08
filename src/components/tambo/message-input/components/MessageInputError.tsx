"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMessageInputContext } from "../context";
import type { MessageInputErrorProps } from "../types";

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 * @component MessageInput.Error
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
export const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ className, ...props }, ref) => {
  const { error, submitError, imageError } = useMessageInputContext();

  if (!error && !submitError && !imageError) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm text-destructive mt-2", className)}
      data-slot="message-input-error"
      {...props}
    >
      {error?.message ?? submitError ?? imageError}
    </p>
  );
});
MessageInputError.displayName = "MessageInput.Error";
