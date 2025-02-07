"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Undo2, Redo2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FlowCanvas,
  NodePalette,
  PropertiesPanel,
  AIChatPanel,
} from "@/components/flow-editor";
import { VersionTimeline } from "@/components/flow-editor/VersionTimeline";
import { ExportImportModal } from "@/components/flow-editor/ExportImportModal";
import { SearchModal } from "@/components/flow-editor/SearchModal";
import { TestDataModal } from "@/components/flow-editor/TestDataModal";
import { ReactFlowProvider } from "@xyflow/react";
import { TamboProvider } from "@tambo-ai/react";
import { components, tools } from "@/lib/tambo";
import { ConversationProvider } from "@/lib/conversation";

import { useWorkflowEditor } from "./useWorkflowEditor";
import { fetchVersion, rollbackToVersion } from "./workflow-api";
import { WorkflowHeader, ExecutionBanner } from "./components";

export default function WorkflowEditorPage() {
  const params = useParams();
  const workflowId = params.id as string;

  const {
    // State
    workflow,
    isLoading,
    isSaving,
    isExecuting,
    executionResult,
    validationErrors,
    executionError,
    showAIChat,
    showExportImport,
    showSearch,
    showTestData,

    // Flow store state
    showLeftSidebar,
    showRightSidebar,

    // Actions
    setValidationErrors,
    setExecutionError,
    setExecutionResult,
    setShowAIChat,
    setShowExportImport,
    setShowSearch,
    setShowTestData,

    // Flow store actions
    loadWorkflow,
    toggleLeftSidebar,
    toggleRightSidebar,
    undo,
    redo,
    canUndo,
    canRedo,

    // Handlers
    handleSave,
    handleExecute,
    handleExecuteWithData,
    handleToggleStatus,
  } = useWorkflowEditor({ workflowId });

  // Version handlers
  const handlePreviewVersion = async (versionId: string) => {
    try {
      const { nodes, edges } = await fetchVersion(workflowId, versionId);
      loadWorkflow(nodes, edges);
    } catch (error) {
      console.error("Preview failed:", error);
      alert("Failed to preview version. Please try again.");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const { nodes, edges } = await rollbackToVersion(workflowId, versionId);
      loadWorkflow(nodes, edges);
    } catch (error) {
      console.error("Rollback failed:", error);
      alert("Failed to rollback workflow. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Workflow not found</h2>
          <Link href="/app/workflows">
            <Button variant="outline">Back to Workflows</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ConversationProvider workflowId={workflowId}>
      <TamboProvider
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
        components={components}
        tools={tools}
      >
        <ReactFlowProvider>
          <div className="h-screen flex flex-col bg-[#fafbfc] dark:bg-background">
            <WorkflowHeader
              workflow={workflow}
              workflowId={workflowId}
              isSaving={isSaving}
              isExecuting={isExecuting}
              showLeftSidebar={showLeftSidebar}
              showRightSidebar={showRightSidebar}
              showAIChat={showAIChat}
              onToggleLeftSidebar={toggleLeftSidebar}
              onToggleRightSidebar={toggleRightSidebar}
              onToggleAIChat={() => setShowAIChat(!showAIChat)}
              onToggleStatus={handleToggleStatus}
              onShowExportImport={() => setShowExportImport(true)}
              onSave={handleSave}
              onExecute={handleExecute}
            />

            <ExecutionBanner
              validationErrors={validationErrors}
              executionError={executionError}
              executionResult={executionResult}
              isExecuting={isExecuting}
              onDismissValidation={() => setValidationErrors(null)}
              onDismissError={() => setExecutionError(null)}
              onDismissResult={() => setExecutionResult(null)}
            />

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
              <div className="flex-1 relative flex flex-col">
                <div className="flex-1 relative">
                  {/* Canvas Toolbar */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                    <div className="flex items-center bg-white dark:bg-card rounded-lg border border-border/50 shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={() => undo()}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="w-px h-4 bg-border" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={() => redo()}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                      >
                        <Redo2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <FlowCanvas className="h-full" />
                </div>

                <VersionTimeline
                  workflowId={workflowId}
                  onPreview={handlePreviewVersion}
                  onRestore={handleRestoreVersion}
                />
              </div>

              {/* Right Sidebar - Properties Panel */}
              <AnimatePresence mode="wait">
                {showRightSidebar && !showAIChat && (
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
                      workflowName={workflow.name}
                    />
                  </motion.aside>
                )}
              </AnimatePresence>
            </div>

            {/* Modals */}
            <ExportImportModal
              open={showExportImport}
              onClose={() => setShowExportImport(false)}
              workflowName={workflow.name}
            />

            <SearchModal
              open={showSearch}
              onClose={() => setShowSearch(false)}
            />

            <TestDataModal
              open={showTestData}
              onClose={() => setShowTestData(false)}
              onExecute={handleExecuteWithData}
            />
          </div>
        </ReactFlowProvider>
      </TamboProvider>
    </ConversationProvider>
  );
}
