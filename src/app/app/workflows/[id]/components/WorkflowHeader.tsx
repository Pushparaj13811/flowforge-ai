"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Play,
  PanelLeftClose,
  PanelRightClose,
  Loader2,
  Sparkles,
  FileJson,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Workflow, WorkflowStatus } from "../types";
import { STATUS_CONFIG } from "../types";

interface WorkflowHeaderProps {
  workflow: Workflow;
  workflowId: string;
  isSaving: boolean;
  isExecuting: boolean;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  showAIChat: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onToggleAIChat: () => void;
  onToggleStatus: () => void;
  onShowExportImport: () => void;
  onSave: () => void;
  onExecute: () => void;
}

export function WorkflowHeader({
  workflow,
  workflowId,
  isSaving,
  isExecuting,
  showLeftSidebar,
  showRightSidebar,
  showAIChat,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onToggleAIChat,
  onToggleStatus,
  onShowExportImport,
  onSave,
  onExecute,
}: WorkflowHeaderProps) {
  const status = STATUS_CONFIG[workflow.status];

  return (
    <header className="flex items-center justify-between px-4 h-14 border-b border-border/50 bg-white dark:bg-card">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3">
        <Link href="/app/workflows">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-semibold text-sm leading-tight">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                {workflow.description}
              </p>
            )}
          </div>
          <button
            onClick={onToggleStatus}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            title={`Click to cycle status (current: ${workflow.status})`}
          >
            <Badge variant={status.variant} className="h-5 text-[10px]">
              {status.label}
            </Badge>
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Sidebar Toggles */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleLeftSidebar}
          title={showLeftSidebar ? "Hide Nodes" : "Show Nodes"}
        >
          <PanelLeftClose className={cn("h-4 w-4 transition-transform", !showLeftSidebar && "rotate-180")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleRightSidebar}
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
          onClick={onToggleAIChat}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* History */}
        <Link href={`/app/workflows/${workflowId}/executions`}>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
            <History className="h-3.5 w-3.5" />
            History
          </Button>
        </Link>

        {/* Export/Import */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onShowExportImport}
        >
          <FileJson className="h-3.5 w-3.5" />
          Export/Import
        </Button>

        {/* Save & Run */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-primary hover:bg-primary/90"
          onClick={onExecute}
          disabled={isExecuting || workflow.status !== "active"}
        >
          {isExecuting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isExecuting ? "Running..." : "Run"}
        </Button>
      </div>
    </header>
  );
}
