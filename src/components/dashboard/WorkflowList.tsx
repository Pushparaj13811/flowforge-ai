/**
 * @file WorkflowList.tsx
 * @description Workflow list/grid component for displaying workflows
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  ExternalLink,
  Workflow,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "draft";
  nodeCount: number;
  executionCount: number;
  successRate?: number;
  lastRunAt?: string;
  updatedAt: string;
}

interface WorkflowListProps {
  workflows: WorkflowItem[];
  layout?: "grid" | "list";
  onWorkflowClick?: (id: string) => void;
  onWorkflowDelete?: (id: string) => void;
  onWorkflowRun?: (id: string) => void;
  onWorkflowDuplicate?: (id: string) => void;
}

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-700 dark:text-green-400",
  },
  paused: {
    label: "Paused",
    color: "bg-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-700 dark:text-amber-400",
  },
  draft: {
    label: "Draft",
    color: "bg-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800/50",
    textColor: "text-gray-600 dark:text-gray-400",
  },
};

export function WorkflowList({
  workflows,
  layout = "grid",
  onWorkflowClick,
  onWorkflowDelete,
  onWorkflowRun,
  onWorkflowDuplicate,
}: WorkflowListProps) {
  if (workflows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Workflow className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-sm font-semibold mb-1">No workflows found</h3>
        <p className="text-xs text-muted-foreground">
          Create your first workflow to get started
        </p>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "flex flex-col gap-2"
      )}
    >
      {workflows.map((workflow, index) => {
        const status = statusConfig[workflow.status];

        return (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div
              className={cn(
                "group rounded-xl border-2 border-border/50 bg-white dark:bg-card p-4 hover:shadow-lg hover:border-border transition-all cursor-pointer",
                layout === "list" && "flex items-center justify-between"
              )}
              onClick={() => onWorkflowClick?.(workflow.id)}
            >
              <div className={cn(layout === "list" && "flex items-center gap-4 flex-1")}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-flow flex items-center justify-center shrink-0">
                      <Workflow className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold line-clamp-1">
                        {workflow.name}
                      </h3>
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium mt-0.5",
                          status.bgColor,
                          status.textColor
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", status.color)} />
                        {status.label}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onWorkflowClick?.(workflow.id);
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onWorkflowRun?.(workflow.id);
                        }}
                      >
                        <Play className="h-3.5 w-3.5 mr-2" />
                        Run
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onWorkflowDuplicate?.(workflow.id);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWorkflowDelete?.(workflow.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
                {workflow.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {workflow.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{workflow.nodeCount}</span>
                    <span>nodes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{workflow.executionCount}</span>
                    <span>runs</span>
                  </div>
                  {workflow.successRate !== undefined && (
                    <div className="flex items-center gap-1">
                      {workflow.successRate >= 90 ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                      )}
                      <span>{workflow.successRate}%</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onWorkflowRun?.(workflow.id);
                    }}
                  >
                    <Play className="h-3 w-3" />
                    Run
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
