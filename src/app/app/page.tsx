"use client";

import * as React from "react";
import { useTamboThreadInput } from "@tambo-ai/react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartInput } from "@/components/chat/smart-input";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { FullCanvasModal, useFlowStore } from "@/components/flow-editor";
import { LatestWorkflowProvider, useLatestWorkflow } from "@/contexts/LatestWorkflowContext";
import { StickyWorkflowPanel } from "@/components/workflow/StickyWorkflowPanel";

import { useConversationManager } from "./hooks";
import { HistoryDropdown, ChatMessages } from "./components";
import {
  consolidateMessages,
  extractWorkflowFromComponent,
  isWorkflowCanvasComponent,
} from "./utils";

function AppPageContent() {
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { isPanelOpen } = useLatestWorkflow();
  const { loadWorkflow } = useFlowStore();

  const [isCanvasOpen, setIsCanvasOpen] = React.useState(false);
  const [currentWorkflow, setCurrentWorkflow] = React.useState<{
    name?: string;
    description?: string;
  } | null>(null);

  const {
    thread,
    conversations,
    activeConversationId,
    isLoadingConversations,
    isHistoryOpen,
    loadingConversation,
    groupedConversations,
    setIsHistoryOpen,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
  } = useConversationManager();

  // Listen for workflow expand events from WorkflowCanvas
  React.useEffect(() => {
    const handleWorkflowExpand = (event: Event) => {
      const customEvent = event as CustomEvent<{
        workflowData: {
          name?: string;
          description?: string;
          nodes?: Array<{
            id: string;
            type?: string;
            label: string;
            position?: { x: number; y: number };
          }>;
          edges?: Array<{
            id: string;
            source: string;
            target: string;
          }>;
        };
      }>;

      const { workflowData } = customEvent.detail;
      if (workflowData.nodes && workflowData.nodes.length > 0) {
        type NodeType = "trigger" | "action" | "condition" | "delay" | "loop";
        type StatusType = "idle" | "pending" | "running" | "success" | "error";

        const flowNodes = workflowData.nodes.map((n, index) => ({
          id: n.id || `node-${index}`,
          type: "custom" as const,
          position: n.position || { x: 100, y: 50 + index * 130 },
          data: {
            label: n.label,
            description: (n as { description?: string }).description,
            icon: (n as { icon?: string }).icon,
            nodeType: (n.type || "action") as NodeType,
            status: ((n as { status?: string }).status || "idle") as StatusType,
          },
        }));

        const flowEdges = (workflowData.edges || []).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: (e as { sourceHandle?: string }).sourceHandle,
          targetHandle: (e as { targetHandle?: string }).targetHandle,
          label: (e as { label?: string }).label,
          type: "smoothstep" as const,
          animated: true,
        }));

        loadWorkflow(flowNodes, flowEdges);
        setCurrentWorkflow({
          name: workflowData.name,
          description: workflowData.description,
        });
        setIsCanvasOpen(true);
      }
    };

    window.addEventListener("workflow-expand", handleWorkflowExpand);
    return () => window.removeEventListener("workflow-expand", handleWorkflowExpand);
  }, [loadWorkflow]);

  const handleSubmit = () => {
    if (value.trim() && !isPending) {
      submit();
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setValue(prompt);
  };

  const handleExpandClick = (component: React.ReactNode) => {
    const workflowData = extractWorkflowFromComponent(component);

    if (workflowData && workflowData.nodes) {
      loadWorkflow(workflowData.nodes, workflowData.edges || []);
      setCurrentWorkflow({
        name: workflowData.name,
        description: workflowData.description,
      });
      setIsCanvasOpen(true);
    }
  };

  const hasMessages = thread?.messages && thread.messages.length > 0;

  // Consolidate messages and inject onExpand handler
  const consolidatedMessages = React.useMemo(() => {
    if (!thread?.messages) return [];
    const messages = consolidateMessages(thread.messages);

    return messages.map((message) => {
      if (message.renderedComponent && React.isValidElement(message.renderedComponent)) {
        const component = message.renderedComponent;

        if (isWorkflowCanvasComponent(component)) {
          const originalComponent = component;
          const props = component.props as Record<string, unknown> | null;
          const clonedComponent = React.cloneElement(
            component as React.ReactElement<{ onExpand?: () => void }>,
            {
              ...(props || {}),
              onExpand: () => handleExpandClick(originalComponent),
            }
          );

          return { ...message, renderedComponent: clonedComponent };
        }
      }
      return message;
    });
  }, [thread?.messages]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex bg-gradient-to-br from-background via-background to-muted/20">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with History Dropdown */}
        <div className="h-14 border-b border-border/50 bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 relative z-[95]">
          <div className="flex items-center gap-3">
            <HistoryDropdown
              conversations={conversations}
              activeConversationId={activeConversationId}
              isOpen={isHistoryOpen}
              isLoading={isLoadingConversations}
              groupedConversations={groupedConversations}
              onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
              onClose={() => setIsHistoryOpen(false)}
              onNewConversation={handleNewConversation}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd> to send,{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted">Shift + Enter</kbd> for new line
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {loadingConversation ? (
            <LoadingState />
          ) : !hasMessages ? (
            <WelcomeScreen onPromptSelect={handlePromptSelect} />
          ) : (
            <ChatMessages
              messages={consolidatedMessages}
              isPending={isPending}
              isPanelOpen={isPanelOpen}
            />
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-sm px-6 py-4">
          <div className={cn(!isPanelOpen && "max-w-4xl mx-auto")}>
            <SmartInput
              value={value}
              onChange={setValue}
              onSubmit={handleSubmit}
              isLoading={isPending}
              placeholder="Describe your workflow..."
            />
          </div>
        </div>

        {/* Full Canvas Modal */}
        <FullCanvasModal
          isOpen={isCanvasOpen}
          onClose={() => setIsCanvasOpen(false)}
          workflowName={currentWorkflow?.name || "Workflow Editor"}
          workflowDescription={currentWorkflow?.description}
          workflowStatus="draft"
        />
      </div>

      {/* Sticky Workflow Panel */}
      <StickyWorkflowPanel />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 rounded-full bg-gradient-flow flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    </div>
  );
}

export default function AppPage() {
  return (
    <LatestWorkflowProvider>
      <AppPageContent />
    </LatestWorkflowProvider>
  );
}
