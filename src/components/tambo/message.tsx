"use client";

/**
 * Message Component
 *
 * This file re-exports from the modular message/ directory structure.
 * All implementation has been moved to separate files for better maintainability.
 */

import * as React from "react";
import type { TamboThreadMessage } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Import from modular structure
import { MessageContext, messageVariants } from "./message/index";

// Re-export everything from parts
export {
  MessageContent,
  LoadingIndicator,
  ToolcallInfo,
  SamplingSubThread,
  ReasoningInfo,
  MessageImages,
  MessageRenderedComponentArea,
  type MessageContentProps,
  type ToolcallInfoProps,
  type ReasoningInfoProps,
  type MessageImagesProps,
  type MessageRenderedComponentAreaProps,
} from "./message/parts";

// Re-export utilities
export { messageVariants, getToolCallRequest } from "./message/utils";

/**
 * Props for the Message component.
 */
export interface MessageProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content"
> {
  role: "user" | "assistant";
  message: TamboThreadMessage;
  variant?: VariantProps<typeof messageVariants>["variant"];
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * The root container for a message component.
 * It establishes the context for its children and applies alignment styles based on the role.
 */
const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  (
    { children, className, role, variant, isLoading, message, ...props },
    ref,
  ) => {
    const contextValue = React.useMemo(
      () => ({ role, variant, isLoading, message }),
      [role, variant, isLoading, message],
    );

    // Don't render tool response messages as they're shown in tool call dropdowns
    if (message.role === "tool") {
      return null;
    }

    return (
      <MessageContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(messageVariants({ variant }), className)}
          data-message-role={role}
          data-message-id={message.id}
          {...props}
        >
          {children}
        </div>
      </MessageContext.Provider>
    );
  },
);
Message.displayName = "Message";

export { Message };
