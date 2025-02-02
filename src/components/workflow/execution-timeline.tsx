"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Loader2,
  Clock,
  SkipForward,
  ChevronDown,
  AlertCircle,
  Copy,
  RefreshCw,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  executionTimelinePropsSchema,
  stepStatusSchema,
  executionStatusSchema,
  safePercentage,
  ensureArray,
  type StepStatus,
  type ExecutionStep,
  type ExecutionStatus,
} from "@/lib/validation";
import { useTamboComponentState } from "@tambo-ai/react";

// Re-export types for convenience
export type { StepStatus, ExecutionStep };

// Type for the execution state stored in Tambo
interface ExecutionTimelineState {
  executionId?: string;
  workflowName?: string;
  status?: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  totalDuration?: number;
  steps?: ExecutionStep[];
  currentStepId?: string;
}

interface ExecutionTimelineProps {
  executionId?: string;
  workflowName?: string;
  status?: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  totalDuration?: number;
  steps?: ExecutionStep[];
  currentStepId?: string;
  onRetry?: () => void;
  className?: string;
}

const statusConfig: Record<
  StepStatus,
  {
    icon: typeof Check;
    color: string;
    bgColor: string;
    animate: boolean;
  }
> = {
  pending: {
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    animate: false,
  },
  running: {
    icon: Loader2,
    color: "text-flow-blue",
    bgColor: "bg-flow-blue/10",
    animate: true,
  },
  completed: {
    icon: Check,
    color: "text-flow-green",
    bgColor: "bg-flow-green/10",
    animate: false,
  },
  failed: {
    icon: X,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    animate: false,
  },
  skipped: {
    icon: SkipForward,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    animate: false,
  },
};

const overallStatusConfig: Record<
  ExecutionStatus,
  { label: string; variant: "secondary" | "info" | "success" | "destructive"; color: string }
> = {
  pending: { label: "Pending", variant: "secondary", color: "text-muted-foreground" },
  running: { label: "Running", variant: "info", color: "text-flow-blue" },
  completed: { label: "Completed", variant: "success", color: "text-flow-green" },
  failed: { label: "Failed", variant: "destructive", color: "text-destructive" },
  cancelled: { label: "Cancelled", variant: "secondary", color: "text-muted-foreground" },
};

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "0ms";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function ExecutionTimeline(props: ExecutionTimelineProps) {
  // Validate and apply defaults
  const validatedProps = React.useMemo(() => {
    const result = executionTimelinePropsSchema.safeParse(props);
    if (result.success) {
      return result.data;
    }
    // Return safe defaults if validation fails
    return {
      executionId: props.executionId ?? "",
      workflowName: props.workflowName ?? "Workflow",
      status: props.status ?? "pending",
      startedAt: props.startedAt,
      completedAt: props.completedAt,
      totalDuration: props.totalDuration,
      steps: ensureArray(props.steps),
      currentStepId: props.currentStepId,
    };
  }, [props]);

  // Build the current props as state object for streaming
  const propsAsState = React.useMemo<ExecutionTimelineState>(() => ({
    executionId: validatedProps.executionId,
    workflowName: validatedProps.workflowName,
    status: validatedProps.status,
    startedAt: validatedProps.startedAt,
    completedAt: validatedProps.completedAt,
    totalDuration: validatedProps.totalDuration,
    steps: validatedProps.steps,
    currentStepId: validatedProps.currentStepId,
  }), [validatedProps]);

  // Use Tambo component state to sync execution data with Tambo
  // This enables receiving streaming updates during execution
  const [executionState] = useTamboComponentState<ExecutionTimelineState>(
    "execution-timeline",
    propsAsState,
    propsAsState
  );

  // Use state from Tambo - this will receive streaming updates
  const currentState = executionState ?? propsAsState;
  const { executionId, workflowName, status, totalDuration, currentStepId } = currentState;
  const steps = ensureArray(currentState.steps);

  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set());
  const { copyToClipboard } = useCopyToClipboard();

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  // Safe status lookups
  const validStatus = (executionStatusSchema.safeParse(status).success ? status : "pending") as ExecutionStatus;
  const overallConfig = overallStatusConfig[validStatus];

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progress = safePercentage(completedSteps, steps.length);

  // Empty state
  if (steps.length === 0) {
    return (
      <Card className={cn("overflow-hidden", props.className)}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No execution data</h3>
            <p className="text-sm text-muted-foreground">
              Run a workflow to see execution details here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", props.className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{workflowName}</h3>
              <Badge variant={overallConfig.variant} dot pulse={validStatus === "running"}>
                {overallConfig.label}
              </Badge>
            </div>
            {executionId && (
              <p className="text-xs text-muted-foreground">
                Execution: {executionId.slice(0, 12)}...
              </p>
            )}
          </div>
          <div className="text-right">
            {totalDuration != null && totalDuration > 0 && (
              <p className="text-sm font-medium">{formatDuration(totalDuration)}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {completedSteps}/{steps.length} steps
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                validStatus === "failed" ? "bg-destructive" : "bg-gradient-flow"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Timeline */}
        <div className="space-y-0">
          <AnimatePresence>
            {steps.map((step, index) => {
              // Safe status lookup
              const validStepStatus = stepStatusSchema.safeParse(step.status).success
                ? step.status
                : "pending";
              const config = statusConfig[validStepStatus];
              const Icon = config.icon;
              const isLast = index === steps.length - 1;
              const isExpanded = expandedSteps.has(step.id);
              const isCurrent = step.id === currentStepId;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex gap-4">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          config.bgColor,
                          isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                        animate={
                          config.animate
                            ? { scale: [1, 1.1, 1] }
                            : undefined
                        }
                        transition={
                          config.animate
                            ? { duration: 1, repeat: Infinity }
                            : undefined
                        }
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            config.color,
                            config.animate && "animate-spin"
                          )}
                        />
                      </motion.div>
                      {!isLast && (
                        <div
                          className={cn(
                            "w-0.5 flex-1 min-h-11",
                            validStepStatus === "completed"
                              ? "bg-flow-green"
                              : "bg-border"
                          )}
                        />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
                      <button
                        className="w-full text-left"
                        onClick={() => toggleStep(step.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{step.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {step.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {step.duration != null && step.duration > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(step.duration)}
                              </span>
                            )}
                            {(step.inputSummary || step.outputSummary || step.error) && (
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expandable Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-3 space-y-3"
                          >
                            {/* Error Message */}
                            {step.error && (
                              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm text-destructive font-medium">
                                      Error
                                    </p>
                                    <p className="text-xs text-destructive/80 mt-1">
                                      {step.error}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => copyToClipboard(step.error || "", `error-${step.id}`)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Input */}
                            {step.inputSummary && (
                              <div className="p-3 rounded-lg bg-muted">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Input
                                </p>
                                <p className="text-xs overflow-x-auto">
                                  {step.inputSummary}
                                </p>
                              </div>
                            )}

                            {/* Output */}
                            {step.outputSummary && (
                              <div className="p-3 rounded-lg bg-flow-green/5 border border-flow-green/20">
                                <p className="text-xs font-medium text-flow-green mb-2">
                                  Output
                                </p>
                                <p className="text-xs overflow-x-auto">
                                  {step.outputSummary}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Retry Button */}
        {validStatus === "failed" && props.onRetry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-border"
          >
            <Button variant="outline" onClick={props.onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Execution
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
