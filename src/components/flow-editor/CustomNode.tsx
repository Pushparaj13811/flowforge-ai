"use client";

/**
 * Custom Node component for React Flow
 * Clean, modern design with handles, icons, and status indicators
 */

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Webhook,
  Cog,
  GitBranch,
  Clock,
  Repeat,
  Mail,
  MessageSquare,
  Filter,
  Database,
  Bell,
  Zap,
  Globe,
  Send,
  Play,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type WorkflowNodeData,
  type WorkflowNodeType,
  type NodeStatus,
  nodeTypeColors,
  statusColors,
} from "./types";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  webhook: Webhook,
  cog: Cog,
  "git-branch": GitBranch,
  clock: Clock,
  repeat: Repeat,
  mail: Mail,
  email: Mail,
  "message-square": MessageSquare,
  slack: MessageSquare,
  discord: MessageSquare,
  filter: Filter,
  database: Database,
  bell: Bell,
  notification: Bell,
  zap: Zap,
  event: Zap,
  globe: Globe,
  http: Globe,
  api: Globe,
  send: Send,
  play: Play,
};

// Default icons for node types
const defaultIcons: Record<WorkflowNodeType, LucideIcon> = {
  trigger: Webhook,
  action: Cog,
  condition: GitBranch,
  delay: Clock,
  loop: Repeat,
};

// Type-specific colors
const typeColorClasses: Record<WorkflowNodeType, { border: string; icon: string; iconBg: string }> = {
  trigger: {
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/50",
  },
  action: {
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-50 dark:bg-green-950/50",
  },
  condition: {
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-50 dark:bg-purple-950/50",
  },
  delay: {
    border: "border-orange-200 dark:border-orange-800",
    icon: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-50 dark:bg-orange-950/50",
  },
  loop: {
    border: "border-cyan-200 dark:border-cyan-800",
    icon: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-50 dark:bg-cyan-950/50",
  },
};

export function CustomNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const nodeType = nodeData.nodeType as WorkflowNodeType;
  const colors = typeColorClasses[nodeType];
  const status = (nodeData.status || "idle") as NodeStatus;
  const statusConfig = statusColors[status];

  // Get icon component
  const IconComponent = React.useMemo(() => {
    if (nodeData.icon && iconMap[nodeData.icon.toLowerCase()]) {
      return iconMap[nodeData.icon.toLowerCase()];
    }
    return defaultIcons[nodeType];
  }, [nodeData.icon, nodeType]);

  return (
    <div
      className={cn(
        "relative min-w-[220px] max-w-[280px] rounded-xl border-2 bg-white dark:bg-card shadow-sm transition-all duration-200",
        colors.border,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg",
        status === "running" && "shadow-lg"
      )}
    >
      {/* Input Handle (Top) */}
      {nodeType !== "trigger" && (
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            "!w-3 !h-3 !border-2 !bg-white dark:!bg-card !-top-1.5 transition-colors",
            "!border-gray-300 dark:!border-gray-600",
            "hover:!border-primary hover:!bg-primary/20"
          )}
        />
      )}

      {/* Node Content */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "shrink-0 h-10 w-10 rounded-lg flex items-center justify-center",
              colors.iconBg
            )}
          >
            <IconComponent className={cn("h-5 w-5", colors.icon)} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm leading-tight truncate pr-1">{nodeData.label}</h3>
              {/* Status indicator */}
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  statusConfig.dot,
                  statusConfig.animate && "animate-pulse"
                )}
              />
            </div>
            {nodeData.description ? (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {nodeData.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/60 mt-0.5 capitalize">
                {nodeType}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Output Handles */}
      {nodeData.outputs && nodeData.outputs.length > 0 ? (
        <>
          {nodeData.outputs.map((output, index) => {
            const outputCount = nodeData.outputs!.length;
            // Calculate handle position (1-4: bottom, 5-6: add sides)
            const leftPercent = outputCount <= 4
              ? (100 / (outputCount + 1)) * (index + 1)
              : index < 2 ? 33 * (index + 1) : index < 4 ? 33 * (index - 1) : 50;

            // Color based on type
            const getColorClass = () => {
              if (output.type === "success" || output.type === "yes") {
                return "!border-green-400 dark:!border-green-500 hover:!bg-green-100 dark:hover:!bg-green-900/50";
              } else if (output.type === "error" || output.type === "no") {
                return "!border-red-400 dark:!border-red-500 hover:!bg-red-100 dark:hover:!bg-red-900/50";
              }
              return "!border-gray-300 dark:!border-gray-600 hover:!border-primary hover:!bg-primary/20";
            };

            const getLabelColor = () => {
              if (output.type === "success" || output.type === "yes") {
                return "text-green-600 dark:text-green-400";
              } else if (output.type === "error" || output.type === "no") {
                return "text-red-500 dark:text-red-400";
              }
              return "text-muted-foreground";
            };

            return (
              <React.Fragment key={output.id}>
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={output.id}
                  className={cn(
                    "!w-3 !h-3 !border-2 !bg-white dark:!bg-card !-bottom-1.5 transition-colors",
                    getColorClass()
                  )}
                  style={{ left: `${leftPercent}%` }}
                />
                <div
                  className="absolute -bottom-5"
                  style={{ left: `${leftPercent}%`, transform: "translateX(-50%)" }}
                >
                  <span className={cn("text-[10px] font-medium", getLabelColor())}>
                    {output.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </>
      ) : (
        <>
          {/* Default single output for nodes without custom outputs */}
          {nodeType !== "condition" && (
            <Handle
              type="source"
              position={Position.Bottom}
              className={cn(
                "!w-3 !h-3 !border-2 !bg-white dark:!bg-card !-bottom-1.5 transition-colors",
                "!border-gray-300 dark:!border-gray-600",
                "hover:!border-primary hover:!bg-primary/20"
              )}
            />
          )}

          {/* Condition nodes default to Yes/No if no custom outputs */}
          {nodeType === "condition" && (
            <>
              <Handle
                type="source"
                position={Position.Bottom}
                id="yes"
                className={cn(
                  "!w-3 !h-3 !border-2 !bg-white dark:!bg-card !-bottom-1.5 transition-colors",
                  "!border-green-400 dark:!border-green-500",
                  "hover:!bg-green-100 dark:hover:!bg-green-900/50"
                )}
                style={{ left: "30%" }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                className={cn(
                  "!w-3 !h-3 !border-2 !bg-white dark:!bg-card !-bottom-1.5 transition-colors",
                  "!border-red-400 dark:!border-red-500",
                  "hover:!bg-red-100 dark:hover:!bg-red-900/50"
                )}
                style={{ left: "70%" }}
              />
              <div className="absolute -bottom-5 left-[30%] -translate-x-1/2">
                <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Yes</span>
              </div>
              <div className="absolute -bottom-5 left-[70%] -translate-x-1/2">
                <span className="text-[10px] font-medium text-red-500 dark:text-red-400">No</span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
