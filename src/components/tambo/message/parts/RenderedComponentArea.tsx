"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessageContext } from "../context";

/**
 * Props for the MessageRenderedComponentArea component.
 */
export type MessageRenderedComponentAreaProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays the `renderedComponent` associated with an assistant message.
 */
export const MessageRenderedComponentArea = React.forwardRef<
  HTMLDivElement,
  MessageRenderedComponentAreaProps
>(({ className, children, ...props }, ref) => {
  const { message, role } = useMessageContext();
  const [canvasExists, setCanvasExists] = React.useState(false);

  React.useEffect(() => {
    const checkCanvasExists = () => {
      const canvas = document.querySelector('[data-canvas-space="true"]');
      setCanvasExists(!!canvas);
    };

    checkCanvasExists();
    window.addEventListener("resize", checkCanvasExists);

    return () => {
      window.removeEventListener("resize", checkCanvasExists);
    };
  }, []);

  if (
    !message.renderedComponent ||
    role !== "assistant" ||
    message.isCancelled
  ) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(className)}
      data-slot="message-rendered-component-area"
      {...props}
    >
      {children ??
        (canvasExists ? (
          <div className="flex justify-start pl-4">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("tambo:showComponent", {
                      detail: {
                        messageId: message.id,
                        component: message.renderedComponent,
                      },
                    }),
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group"
              aria-label="View component in canvas"
            >
              View component
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-full pt-2 px-2">{message.renderedComponent}</div>
        ))}
    </div>
  );
});
MessageRenderedComponentArea.displayName = "Message.RenderedComponentArea";
