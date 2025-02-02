/**
 * @file ConditionNode.tsx
 * @description Custom condition node with separate Yes/No output handles
 */

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "./types";

export function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const statusColors = {
    idle: "border-border",
    pending: "border-amber-400 bg-amber-50 dark:bg-amber-950/20",
    running: "border-blue-500 bg-blue-50 dark:bg-blue-950/20 animate-pulse",
    success: "border-green-500 bg-green-50 dark:bg-green-950/20",
    error: "border-red-500 bg-red-50 dark:bg-red-950/20",
  };

  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-lg border-2 bg-white dark:bg-card shadow-sm transition-all",
        selected ? "border-purple-500 shadow-lg ring-2 ring-purple-500/20" : statusColors[nodeData.status || "idle"],
        "min-w-[200px]"
      )}
    >
      {/* Input handle (top center) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-card"
        style={{ top: -6 }}
      />

      {/* Node content */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
            <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{nodeData.label}</p>
            {nodeData.description && typeof nodeData.description === 'string' && (
              <p className="text-xs text-muted-foreground truncate">{nodeData.description}</p>
            )}
          </div>
        </div>

        {/* Show condition if configured */}
        {(() => {
          const condition = nodeData.config?.condition;
          if (condition && typeof condition === 'string') {
            return (
              <div className="mt-1 p-2 bg-muted/50 rounded text-xs font-mono truncate">
                {condition}
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* YES handle (bottom-left) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white dark:!border-card"
        style={{ bottom: -6, left: "30%" }}
      />
      <div
        className="absolute text-[10px] font-semibold text-green-600 dark:text-green-400 bg-white dark:bg-card px-1.5 py-0.5 rounded border border-green-500/30"
        style={{ bottom: -22, left: "20%" }}
      >
        YES
      </div>

      {/* NO handle (bottom-right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white dark:!border-card"
        style={{ bottom: -6, left: "70%" }}
      />
      <div
        className="absolute text-[10px] font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-card px-1.5 py-0.5 rounded border border-red-500/30"
        style={{ bottom: -22, left: "63%" }}
      >
        NO
      </div>

      {/* Status indicator */}
      {nodeData.status && nodeData.status !== "idle" && (
        <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full border-2 border-white dark:border-card flex items-center justify-center text-[10px] font-bold shadow-sm">
          {nodeData.status === "pending" && <span className="text-amber-600">⏳</span>}
          {nodeData.status === "running" && <span className="text-blue-600">▶</span>}
          {nodeData.status === "success" && <span className="text-green-600">✓</span>}
          {nodeData.status === "error" && <span className="text-red-600">✗</span>}
        </div>
      )}
    </div>
  );
}
