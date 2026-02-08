"use client";

/**
 * Full Canvas Modal - Full-screen workflow editor overlay with AI chat
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Play,
  PanelLeftClose,
  PanelRightClose,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlowCanvas } from "./FlowCanvas";
import { NodePalette } from "./NodePalette";
import { PropertiesPanel } from "./PropertiesPanel";
import { AIChatPanel } from "./AIChatPanel";
import { useFlowStore } from "./store";
import { ReactFlowProvider } from "@xyflow/react";

interface FullCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId?: string;
  workflowName?: string;
  workflowDescription?: string;
  workflowStatus?: "draft" | "active" | "paused";
  onSave?: () => Promise<void>;
  onRun?: () => void;
}

function FullCanvasModalInner({
  onClose,
  workflowId,
  workflowName = "Untitled Workflow",
  workflowDescription,
  workflowStatus = "draft",
  onSave,
  onRun,
}: Omit<FullCanvasModalProps, "isOpen">) {
  const { showLeftSidebar, showRightSidebar, toggleLeftSidebar, toggleRightSidebar, selectedNodeId } =
    useFlowStore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [showAIChat, setShowAIChat] = React.useState(false);

  // Handle escape key to close
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const statusConfig = {
    draft: { label: "Draft", variant: "secondary" as const },
    active: { label: "Active", variant: "success" as const },
    paused: { label: "Paused", variant: "warning" as const },
  };

  const status = statusConfig[workflowStatus];

  // Auto-show properties when a node is selected (unless AI chat is open)
  const showPropertiesPanel = (showRightSidebar || selectedNodeId) && !showAIChat;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-[#fafbfc] dark:bg-background"
    >
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-border/50 bg-white dark:bg-card">
          {/* Left: Close + Title */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-semibold text-sm leading-tight">{workflowName}</h1>
                {workflowDescription && (
                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {workflowDescription}
                  </p>
                )}
              </div>
              <Badge variant={status.variant} className="h-5 text-[10px]">
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Sidebar Toggles */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleLeftSidebar}
              title={showLeftSidebar ? "Hide Nodes" : "Show Nodes"}
            >
              <PanelLeftClose className={cn("h-4 w-4 transition-transform", !showLeftSidebar && "rotate-180")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleRightSidebar}
              title={showRightSidebar ? "Hide Properties" : "Show Properties"}
            >
              <PanelRightClose className={cn("h-4 w-4 transition-transform", !showRightSidebar && "rotate-180")} />
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* AI Chat Toggle */}
            <Button
              variant={showAIChat ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setShowAIChat(!showAIChat)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Save & Run */}
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save
              </Button>
            )}
            {onRun && (
              <Button size="sm" className="h-8 gap-1.5 bg-primary hover:bg-primary/90" onClick={onRun}>
                <Play className="h-3.5 w-3.5" />
                Run
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Node Palette */}
          <AnimatePresence mode="wait">
            {showLeftSidebar && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="border-r border-border/50 bg-white dark:bg-card overflow-hidden flex-shrink-0"
              >
                <NodePalette className="w-[260px]" />
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Canvas Area */}
          <div className="flex-1 relative">
            <FlowCanvas className="h-full" />
          </div>

          {/* Right Sidebar - Properties Panel */}
          <AnimatePresence mode="wait">
            {showPropertiesPanel && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="border-l border-border/50 bg-white dark:bg-card overflow-hidden flex-shrink-0"
              >
                <PropertiesPanel className="w-[320px]" />
              </motion.aside>
            )}
          </AnimatePresence>

          {/* AI Chat Panel */}
          <AnimatePresence mode="wait">
            {showAIChat && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 360, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="border-l border-border/50 overflow-hidden flex-shrink-0"
              >
                <AIChatPanel
                  onClose={() => setShowAIChat(false)}
                  className="w-[360px]"
                  workflowId={workflowId}
                  workflowName={workflowName}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function FullCanvasModal({ isOpen, ...props }: FullCanvasModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <ReactFlowProvider>
          <FullCanvasModalInner {...props} />
        </ReactFlowProvider>
      )}
    </AnimatePresence>
  );
}
