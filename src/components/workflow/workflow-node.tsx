"use client";

import * as React from "react";
import { motion } from "framer-motion";
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
  Play,
  Send,
  Globe,
  AlertCircle,
  CheckCircle,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type NodeType,
  type NodeStatus,
  nodeTypeSchema,
  nodeStatusSchema,
} from "@/lib/validation";
import { BranchingIndicator } from "./branching-indicator";

// Re-export types for convenience
export type { NodeType, NodeStatus };

interface WorkflowNodeProps {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  icon?: string;
  status?: NodeStatus;
  isSelected?: boolean;
  isActive?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  className?: string;
  outputEdgeCount?: number;
  outputEdgeLabels?: string[];
}

const nodeTypeConfig: Record<
  NodeType,
  {
    icon: LucideIcon;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }
> = {
  trigger: {
    icon: Webhook,
    color: "text-flow-blue",
    bgColor: "bg-flow-blue/10",
    borderColor: "border-flow-blue/30",
    label: "Trigger",
  },
  action: {
    icon: Cog,
    color: "text-flow-green",
    bgColor: "bg-flow-green/10",
    borderColor: "border-flow-green/30",
    label: "Action",
  },
  condition: {
    icon: GitBranch,
    color: "text-flow-purple",
    bgColor: "bg-flow-purple/10",
    borderColor: "border-flow-purple/30",
    label: "Condition",
  },
  delay: {
    icon: Clock,
    color: "text-flow-orange",
    bgColor: "bg-flow-orange/10",
    borderColor: "border-flow-orange/30",
    label: "Delay",
  },
  loop: {
    icon: Repeat,
    color: "text-flow-cyan",
    bgColor: "bg-flow-cyan/10",
    borderColor: "border-flow-cyan/30",
    label: "Loop",
  },
};

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
  teams: MessageSquare,
  filter: Filter,
  database: Database,
  bell: Bell,
  notification: Bell,
  zap: Zap,
  event: Zap,
  play: Play,
  send: Send,
  globe: Globe,
  http: Globe,
  api: Globe,
  error: AlertCircle,
  success: CheckCircle,
  check: CheckCircle,
};

const statusConfig: Record<NodeStatus, { dot: string; animate: boolean }> = {
  idle: { dot: "bg-muted-foreground", animate: false },
  pending: { dot: "bg-flow-orange", animate: true },
  running: { dot: "bg-flow-blue", animate: true },
  success: { dot: "bg-flow-green", animate: false },
  error: { dot: "bg-destructive", animate: false },
};

export function WorkflowNode({
  id,
  type,
  label,
  description,
  icon,
  status = "idle",
  isSelected = false,
  isActive = false,
  isHighlighted = false,
  onClick,
  className,
  outputEdgeCount = 0,
  outputEdgeLabels = [],
}: WorkflowNodeProps) {
  // Validate type with fallback
  const validType = nodeTypeSchema.safeParse(type).success ? type : "action";
  const validStatus = nodeStatusSchema.safeParse(status).success ? status : "idle";

  const config = nodeTypeConfig[validType];
  const statusCfg = statusConfig[validStatus];

  // Safe icon lookup with fallback
  const IconComponent = React.useMemo(() => {
    if (icon && typeof icon === "string" && icon in iconMap) {
      return iconMap[icon];
    }
    return config.icon;
  }, [icon, config.icon]);

  return (
    <motion.div
      className={cn(
        "relative group cursor-pointer",
        "w-[220px]",
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={
        isHighlighted
          ? {
              scale: [1, 1.05, 1],
              transition: { duration: 0.6, ease: "easeInOut" },
            }
          : {}
      }
      layout
    >
      {/* Glow effect when active */}
      {isActive && (
        <motion.div
          className={cn(
            "absolute -inset-2 rounded-2xl opacity-50 blur-xl -z-10",
            config.bgColor
          )}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main Card */}
      <div
        className={cn(
          "relative rounded-xl border-2 p-4 transition-all duration-200",
          "bg-card",
          config.borderColor,
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20",
          isActive && "animate-node-active",
          "hover:shadow-lg"
        )}
      >
        {/* Top Handle (for incoming connections) */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <div
            className={cn(
              "h-4 w-4 rounded-full border-2 bg-background",
              config.borderColor,
              "group-hover:border-primary group-hover:bg-primary/20",
              "transition-colors"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center",
              config.bgColor
            )}
          >
            <IconComponent className={cn("h-5 w-5", config.color)} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{label}</h3>
              {/* Status indicator */}
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  statusCfg.dot,
                  statusCfg.animate && "animate-pulse"
                )}
              />
            </div>
            {description ? (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.label}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Handle (for outgoing connections) */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <div
            className={cn(
              "h-4 w-4 rounded-full border-2 bg-background",
              config.borderColor,
              "group-hover:border-primary group-hover:bg-primary/20",
              "transition-colors"
            )}
          />
        </div>

        {/* Condition branches (Yes/No) */}
        {validType === "condition" && (
          <>
            <div className="absolute -bottom-2 left-[30%] -translate-x-1/2">
              <div className="relative">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 bg-background",
                    "border-flow-green",
                    "transition-colors"
                  )}
                />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-flow-green font-medium">
                  Yes
                </span>
              </div>
            </div>
            <div className="absolute -bottom-2 left-[70%] -translate-x-1/2">
              <div className="relative">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 bg-background",
                    "border-destructive",
                    "transition-colors"
                  )}
                />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-destructive font-medium">
                  No
                </span>
              </div>
            </div>
          </>
        )}

        {/* Branching Indicator for nodes with 3+ outputs */}
        {outputEdgeCount >= 3 && (
          <BranchingIndicator
            edgeCount={outputEdgeCount}
            edgeLabels={outputEdgeLabels}
            isCompact={false}
          />
        )}
      </div>
    </motion.div>
  );
}

// Compact version for lists
export function WorkflowNodeCompact({
  type,
  label,
  status = "idle",
  onClick,
}: {
  type: NodeType;
  label: string;
  status?: NodeStatus;
  onClick?: () => void;
}) {
  const validType = nodeTypeSchema.safeParse(type).success ? type : "action";
  const validStatus = nodeStatusSchema.safeParse(status).success ? status : "idle";

  const config = nodeTypeConfig[validType];
  const statusCfg = statusConfig[validStatus];
  const IconComponent = config.icon;

  return (
    <motion.button
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl",
        "border border-border bg-card",
        "hover:border-primary/50 hover:bg-muted/50",
        "transition-all duration-200 text-left"
      )}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          config.bgColor
        )}
      >
        <IconComponent className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground">{config.label}</p>
      </div>
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          statusCfg.dot,
          statusCfg.animate && "animate-pulse"
        )}
      />
    </motion.button>
  );
}
