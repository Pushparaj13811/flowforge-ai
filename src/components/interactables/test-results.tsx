"use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  SkipForward,
  ArrowRight,
  RefreshCw,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Schema for a test step result
 */
const testStepSchema = z.object({
  stepNumber: z.number().describe("Step number in sequence"),
  nodeId: z.string().describe("Node ID"),
  nodeName: z.string().describe("Display name of the node"),
  nodeType: z.string().describe("Type of node"),
  status: z.enum(["pending", "running", "completed", "failed", "skipped"]).describe("Execution status"),
  duration: z.number().optional().describe("Execution time in ms"),
  input: z.string().optional().describe("Input data summary"),
  output: z.string().optional().describe("Output data summary"),
  error: z.string().optional().describe("Error message if failed"),
  branch: z.string().optional().describe("Branch taken (for conditions)"),
});

/**
 * Schema for TestResults props
 */
export const testResultsSchema = z.object({
  workflowId: z.string().optional().describe("Workflow ID"),
  workflowName: z.string().default("Workflow Test").describe("Workflow name"),
  executionId: z.string().optional().describe("Execution ID"),
  status: z.enum(["pending", "running", "completed", "failed"]).default("pending")
    .describe("Overall test status"),
  steps: z.array(testStepSchema).default([]).describe("Test step results"),
  testDataJson: z.string().optional().describe("Test trigger data as JSON string"),
  duration: z.number().optional().describe("Total execution time in ms"),
  startedAt: z.string().optional().describe("Test start time"),
  onRetest: z.function().returns(z.void()).optional().describe("Callback to rerun test"),
});

type TestResultsProps = z.infer<typeof testResultsSchema>;
type TestStep = z.infer<typeof testStepSchema>;

/**
 * Status colors and icons
 */
function getStatusConfig(status: string) {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle2,
        color: "text-flow-green",
        bg: "bg-flow-green/10",
        border: "border-flow-green/30",
        label: "Passed",
      };
    case "failed":
      return {
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/30",
        label: "Failed",
      };
    case "running":
      return {
        icon: RefreshCw,
        color: "text-flow-blue",
        bg: "bg-flow-blue/10",
        border: "border-flow-blue/30",
        label: "Running",
      };
    case "skipped":
      return {
        icon: SkipForward,
        color: "text-muted-foreground",
        bg: "bg-muted/50",
        border: "border-border",
        label: "Skipped",
      };
    default:
      return {
        icon: Clock,
        color: "text-muted-foreground",
        bg: "bg-muted/50",
        border: "border-border",
        label: "Pending",
      };
  }
}

/**
 * Format duration
 */
function formatDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Base TestResults component
 */
function TestResultsBase(props: TestResultsProps) {
  const [config, setConfig] = useState<TestResultsProps>(props);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showTestData, setShowTestData] = useState(false);
  const prevPropsRef = useRef<TestResultsProps>(props);

  // Update state when props change
  useEffect(() => {
    if (JSON.stringify(props) !== JSON.stringify(prevPropsRef.current)) {
      setConfig(props);
      prevPropsRef.current = props;

      // Auto-expand failed steps
      const failedStepIds = new Set(
        (props.steps || []).filter((s) => s.status === "failed").map((s) => s.nodeId)
      );
      setExpandedSteps(failedStepIds);
    }
  }, [props]);

  const toggleStep = (nodeId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const overallConfig = getStatusConfig(config.status);
  const OverallIcon = overallConfig.icon;

  const completedCount = config.steps.filter((s) => s.status === "completed").length;
  const failedCount = config.steps.filter((s) => s.status === "failed").length;
  const totalSteps = config.steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass border border-glass-border rounded-xl p-6 max-w-3xl shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center border", overallConfig.bg, overallConfig.border)}>
          <OverallIcon className={cn("h-6 w-6", overallConfig.color, config.status === "running" && "animate-spin")} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{config.workflowName}</h3>
          <p className="text-xs text-muted-foreground">
            Test {overallConfig.label.toLowerCase()}
            {config.executionId && ` • ${config.executionId.substring(0, 8)}...`}
          </p>
        </div>
        {config.onRetest && (
          <button
            onClick={() => config.onRetest?.()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retest
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold text-foreground">{totalSteps}</div>
          <div className="text-xs text-muted-foreground">Total Steps</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-flow-green/10">
          <div className="text-2xl font-bold text-flow-green">{completedCount}</div>
          <div className="text-xs text-muted-foreground">Passed</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-destructive/10">
          <div className="text-2xl font-bold text-destructive">{failedCount}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold text-foreground">{formatDuration(config.duration)}</div>
          <div className="text-xs text-muted-foreground">Duration</div>
        </div>
      </div>

      {/* Test Data Toggle */}
      {config.testDataJson && (
        <button
          onClick={() => setShowTestData(!showTestData)}
          className="w-full mb-4 p-3 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-between hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-flow-blue" />
            <span className="text-sm font-medium">Test Data</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showTestData && "rotate-180")} />
        </button>
      )}
      <AnimatePresence>
        {showTestData && config.testDataJson && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <pre className="p-4 rounded-lg bg-background text-xs font-mono overflow-x-auto">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(config.testDataJson), null, 2);
                } catch {
                  return config.testDataJson;
                }
              })()}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps */}
      <div className="space-y-2">
        {config.steps.map((step, index) => {
          const stepConfig = getStatusConfig(step.status);
          const StepIcon = stepConfig.icon;
          const isExpanded = expandedSteps.has(step.nodeId);

          return (
            <motion.div
              key={step.nodeId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-lg border transition-all",
                stepConfig.bg,
                stepConfig.border,
                step.status === "failed" && "ring-1 ring-destructive/30"
              )}
            >
              {/* Step Header */}
              <button
                onClick={() => toggleStep(step.nodeId)}
                className="w-full p-3 flex items-center gap-3"
              >
                {/* Step Number & Icon */}
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-background flex items-center justify-center text-xs font-medium">
                    {step.stepNumber}
                  </div>
                  <StepIcon className={cn("h-4 w-4", stepConfig.color, step.status === "running" && "animate-spin")} />
                </div>

                {/* Step Info */}
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground">{step.nodeName}</div>
                  <div className="text-xs text-muted-foreground">{step.nodeType}</div>
                </div>

                {/* Branch Badge */}
                {step.branch && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    step.branch === "yes" ? "bg-flow-green/20 text-flow-green" : "bg-flow-orange/20 text-flow-orange"
                  )}>
                    {step.branch}
                  </span>
                )}

                {/* Duration */}
                <div className="text-xs text-muted-foreground">
                  {formatDuration(step.duration)}
                </div>

                {/* Expand Icon */}
                {(step.input || step.output || step.error) && (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )
                )}
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/50">
                      {step.input && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Input</div>
                          <div className="p-2 rounded bg-background text-xs font-mono">{step.input}</div>
                        </div>
                      )}
                      {step.output && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Output</div>
                          <div className="p-2 rounded bg-background text-xs font-mono">{step.output}</div>
                        </div>
                      )}
                      {step.error && (
                        <div>
                          <div className="text-xs font-medium text-destructive mb-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Error
                          </div>
                          <div className="p-2 rounded bg-destructive/10 text-xs text-destructive">
                            {step.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {config.startedAt ? (
              <span>Started {new Date(config.startedAt).toLocaleTimeString()}</span>
            ) : (
              <span>Test results</span>
            )}
          </div>
          {config.workflowId && (
            <span className="font-mono">{config.workflowId.substring(0, 8)}...</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Wrapped interactable component
 */
export const TestResults = withInteractable(TestResultsBase, {
  componentName: "TestResults",
  description: `Display workflow test execution results with step-by-step details.

Use this when:
- Showing results after testing a workflow
- Debugging workflow execution issues
- Displaying which steps passed/failed
- Showing the data flow between steps

Features:
- Overall pass/fail status with summary stats
- Step-by-step execution timeline
- Expandable details for each step (input/output)
- Error messages for failed steps
- Duration tracking
- Test data preview
- Branch indicators for conditions`,
  propsSchema: testResultsSchema,
});
