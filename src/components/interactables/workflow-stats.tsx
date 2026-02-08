"use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Zap,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Schema for WorkflowStats props
 */
export const workflowStatsSchema = z.object({
  workflowId: z.string().describe("Unique identifier for the workflow"),
  workflowName: z.string().describe("Name of the workflow"),

  // Execution metrics
  totalExecutions: z.number().describe("Total number of executions"),
  successfulExecutions: z.number().describe("Number of successful executions"),
  failedExecutions: z.number().describe("Number of failed executions"),

  // Performance metrics
  averageDuration: z.number().describe("Average execution duration in milliseconds"),
  lastExecutedAt: z.string().optional().describe("ISO timestamp of last execution"),

  // Workflow structure
  nodeCount: z.number().describe("Number of nodes in the workflow"),
  edgeCount: z.number().describe("Number of edges/connections in the workflow"),

  // Status
  isActive: z.boolean().optional().describe("Whether the workflow is active"),
});

type WorkflowStatsProps = z.infer<typeof workflowStatsSchema>;

/**
 * Format duration in milliseconds to human readable
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Format date to relative time
 */
function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "Never";

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Base WorkflowStats component
 */
function WorkflowStatsBase(props: WorkflowStatsProps) {
  const [stats, setStats] = useState<WorkflowStatsProps>(props);
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
  const prevPropsRef = useRef<WorkflowStatsProps>(props);

  // Update state when props change (AI updates)
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    const changedFields = new Set<string>();

    // Check all numeric fields for changes
    const numericFields = [
      'totalExecutions', 'successfulExecutions', 'failedExecutions',
      'averageDuration', 'nodeCount', 'edgeCount'
    ] as const;

    numericFields.forEach((field) => {
      if (props[field] !== prevProps[field]) {
        changedFields.add(field);
      }
    });

    if (changedFields.size > 0) {
      setStats(props);
      setUpdatedFields(changedFields);
      prevPropsRef.current = props;

      // Clear highlights after animation
      const timer = setTimeout(() => {
        setUpdatedFields(new Set());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [props]);

  // Calculate success rate
  const successRate = stats.totalExecutions > 0
    ? (stats.successfulExecutions / stats.totalExecutions) * 100
    : 0;

  // Calculate failure rate
  const failureRate = stats.totalExecutions > 0
    ? (stats.failedExecutions / stats.totalExecutions) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass border border-glass-border rounded-xl p-6 max-w-3xl shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-flow-blue/10 flex items-center justify-center border border-flow-blue/20">
            <BarChart3 className="h-5 w-5 text-flow-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{stats.workflowName}</h3>
            <p className="text-xs text-muted-foreground">Workflow Statistics</p>
          </div>
        </div>
        {/* Status Badge */}
        {stats.isActive !== undefined && (
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
            stats.isActive
              ? "bg-flow-green/10 text-flow-green border border-flow-green/20"
              : "bg-muted text-muted-foreground border border-border"
          )}>
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              stats.isActive ? "bg-flow-green animate-pulse" : "bg-muted-foreground"
            )} />
            {stats.isActive ? "Active" : "Inactive"}
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Executions */}
        <motion.div
          animate={updatedFields.has('totalExecutions') ? {
            scale: [1, 1.05, 1],
            backgroundColor: ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0)']
          } : {}}
          className="p-4 rounded-lg bg-muted/50 border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-flow-blue" />
            <span className="text-xs font-medium text-muted-foreground">Total Runs</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalExecutions}</p>
        </motion.div>

        {/* Success Rate */}
        <motion.div
          animate={updatedFields.has('successfulExecutions') ? {
            scale: [1, 1.05, 1],
            backgroundColor: ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0)']
          } : {}}
          className="p-4 rounded-lg bg-muted/50 border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-flow-green" />
            <span className="text-xs font-medium text-muted-foreground">Success Rate</span>
          </div>
          <p className="text-2xl font-bold text-flow-green">{successRate.toFixed(1)}%</p>
        </motion.div>

        {/* Average Duration */}
        <motion.div
          animate={updatedFields.has('averageDuration') ? {
            scale: [1, 1.05, 1],
            backgroundColor: ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0)']
          } : {}}
          className="p-4 rounded-lg bg-muted/50 border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-flow-purple" />
            <span className="text-xs font-medium text-muted-foreground">Avg Duration</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatDuration(stats.averageDuration)}
          </p>
        </motion.div>

        {/* Node Count */}
        <motion.div
          animate={updatedFields.has('nodeCount') ? {
            scale: [1, 1.05, 1],
            backgroundColor: ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0)']
          } : {}}
          className="p-4 rounded-lg bg-muted/50 border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-flow-orange" />
            <span className="text-xs font-medium text-muted-foreground">Nodes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.nodeCount}</p>
        </motion.div>
      </div>

      {/* Success/Failure Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Execution Results</span>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-flow-green" />
              <span className="text-muted-foreground">
                {stats.successfulExecutions} Success
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3 w-3 text-destructive" />
              <span className="text-muted-foreground">
                {stats.failedExecutions} Failed
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-gradient-to-r from-flow-green to-flow-green/80"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${failureRate}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="bg-gradient-to-r from-destructive to-destructive/80"
          />
        </div>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Last Executed</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {formatRelativeTime(stats.lastExecutedAt)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Workflow Complexity</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            {stats.nodeCount} nodes, {stats.edgeCount} connections
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">{stats.workflowId}</span>
          <span>Updated just now</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Wrapped interactable component
 */
export const WorkflowStats = withInteractable(WorkflowStatsBase, {
  componentName: "WorkflowStats",
  description: "Workflow statistics and metrics display",
  propsSchema: workflowStatsSchema,
});
