"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { TypingIndicator } from "@/components/chat/message-bubble";
import { WorkflowSuccessBanner } from "@/components/workflow/workflow-success-banner";
import { Streamdown } from "streamdown";
import { markdownComponents } from "@/components/tambo/markdown-components";
import type { ConsolidatedMessage } from "../utils/message-utils";
import { isWorkflowCanvasComponent } from "../utils/message-utils";

interface ChatMessagesProps {
  messages: ConsolidatedMessage[];
  isPending: boolean;
  isPanelOpen: boolean;
}

export function ChatMessages({ messages, isPending, isPanelOpen }: ChatMessagesProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className={cn("space-y-6", !isPanelOpen && "max-w-4xl mx-auto")}>
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isPending && <TypingIndicator />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ConsolidatedMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-4", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <Avatar size="md" fallback="U" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-flow flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 space-y-3 max-w-[85%]", isUser && "flex flex-col items-end")}>
        {/* Text Content */}
        {message.textContent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "px-4 py-3 rounded-2xl transition-all duration-200",
              isUser
                ? "bg-gradient-flow text-white rounded-br-md shadow-md hover:shadow-lg"
                : "glass border border-glass-border rounded-tl-md shadow-sm hover:shadow-md"
            )}
          >
            <div className={cn("text-sm leading-relaxed", !isUser && "text-foreground")}>
              <Streamdown components={markdownComponents}>
                {message.textContent}
              </Streamdown>
            </div>
          </motion.div>
        )}

        {/* Rendered Component */}
        {message.renderedComponent && (
          <RenderedComponent component={message.renderedComponent} />
        )}
      </div>
    </motion.div>
  );
}

interface RenderedComponentProps {
  component: React.ReactNode;
}

function RenderedComponent({ component }: RenderedComponentProps) {
  // Check if it's a WorkflowCanvas and show success banner
  const showSuccessBanner = React.useMemo(() => {
    if (!React.isValidElement(component)) return null;

    if (isWorkflowCanvasComponent(component)) {
      const props = component.props as { workflowId?: string; name?: string; nodes?: unknown[] };
      return (
        <WorkflowSuccessBanner
          workflowId={props.workflowId || "draft"}
          workflowName={props.name || "Untitled Workflow"}
          nodeCount={props.nodes?.length || 0}
          className="mb-4"
        />
      );
    }
    return null;
  }, [component]);

  return (
    <>
      {showSuccessBanner}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full relative z-0 card-hover"
      >
        {component}
      </motion.div>
    </>
  );
}
