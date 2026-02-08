"use client";

import * as React from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { checkHasContent } from "@/lib/thread-hooks";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { markdownComponents } from "../../markdown-components";
import { useMessageContext } from "../context";
import { convertContentToMarkdown } from "../utils";

/**
 * Loading indicator with bouncing dots animation
 */
export const LoadingIndicator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
    </div>
  );
};
LoadingIndicator.displayName = "LoadingIndicator";

/**
 * Internal component to render message content based on its type
 */
function MessageContentRenderer({
  contentToRender,
  markdownContent,
  markdown,
}: {
  contentToRender: unknown;
  markdownContent: string;
  markdown: boolean;
}) {
  if (!contentToRender) {
    return <span className="text-muted-foreground italic">Empty message</span>;
  }
  if (React.isValidElement(contentToRender)) {
    return contentToRender;
  }
  if (markdown) {
    return (
      <Streamdown components={markdownComponents}>{markdownContent}</Streamdown>
    );
  }
  return markdownContent;
}

/**
 * Props for the MessageContent component.
 */
export interface MessageContentProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content"
> {
  content?: string | TamboThreadMessage["content"];
  markdown?: boolean;
}

/**
 * Displays the message content with optional markdown formatting.
 */
export const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  (
    { className, children, content: contentProp, markdown = true, ...props },
    ref,
  ) => {
    const { message, isLoading } = useMessageContext();
    const contentToRender = children ?? contentProp ?? message.content;

    const markdownContent = React.useMemo(() => {
      const result = convertContentToMarkdown(contentToRender);
      return result;
    }, [contentToRender]);
    const hasContent = React.useMemo(
      () => checkHasContent(contentToRender),
      [contentToRender],
    );

    const showLoading = isLoading && !hasContent;

    return (
      <div
        ref={ref}
        className={cn(
          "relative block rounded-3xl px-4 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full [&_p]:py-1 [&_li]:list-item",
          className,
        )}
        data-slot="message-content"
        {...props}
      >
        {showLoading && !message.reasoning ? (
          <div
            className="flex items-center justify-start h-4 py-1"
            data-slot="message-loading-indicator"
          >
            <LoadingIndicator />
          </div>
        ) : (
          <div
            className={cn("break-words", !markdown && "whitespace-pre-wrap")}
            data-slot="message-content-text"
          >
            <MessageContentRenderer
              contentToRender={contentToRender}
              markdownContent={markdownContent}
              markdown={markdown}
            />
            {message.isCancelled && (
              <span className="text-muted-foreground text-xs">cancelled</span>
            )}
          </div>
        )}
      </div>
    );
  },
);
MessageContent.displayName = "MessageContent";
