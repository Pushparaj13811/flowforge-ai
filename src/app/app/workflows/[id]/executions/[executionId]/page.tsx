"use client";

/**
 * @file page.tsx
 * @description Detailed execution view with step-by-step logs
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  PlayCircle,
  Code,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExecutionStep {
  id: string;
  nodeId: string;
  name: string;
  type: string;
  status: string;
  duration: number | null;
  startedAt: string | null;
  completedAt: string | null;
  inputSummary: any;
  outputSummary: any;
  error: string | null;
  stepOrder: number;
}

interface ExecutionDetails {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  error: string | null;
  createdAt: string;
}

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const executionId = params.executionId as string;

  const [execution, setExecution] = React.useState<ExecutionDetails | null>(null);
  const [steps, setSteps] = React.useState<ExecutionStep[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    async function fetchExecution() {
      try {
        const response = await fetch(`/api/executions/${executionId}`, {
          credentials: "include",
        });
        const data = await response.json();
        setExecution(data.execution);
        setSteps(data.steps || []);
      } catch (error) {
        console.error("Failed to fetch execution:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExecution();

    // Poll for updates if execution is running
    const interval = setInterval(() => {
      if (execution?.status === "running" || execution?.status === "pending") {
        fetchExecution();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [executionId, execution?.status]);

  const toggleStepExpansion = (stepId: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "skipped":
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-amber-600" />;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Execution not found</h2>
          <Link href={`/app/workflows/${workflowId}/executions`}>
            <Button variant="outline">Back to History</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-border/50 bg-white dark:bg-card">
        <div className="flex items-center gap-4">
          <Link href={`/app/workflows/${workflowId}/executions`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Execution Details</h1>
            <p className="text-sm text-muted-foreground">
              {execution.workflowName} • #{executionId.slice(0, 8)}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Execution Summary */}
          <div className="p-6 rounded-lg border border-border bg-white dark:bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Execution Summary</h2>
              <Badge
                variant={
                  execution.status === "completed"
                    ? "success"
                    : execution.status === "failed"
                    ? "destructive"
                    : "warning"
                }
                className="capitalize"
              >
                {execution.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Started:</span>
                <p className="font-medium">
                  {execution.startedAt
                    ? new Date(execution.startedAt).toLocaleString()
                    : "Not started"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <p className="font-medium">
                  {execution.completedAt
                    ? new Date(execution.completedAt).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <p className="font-medium">{formatDuration(execution.duration)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Steps:</span>
                <p className="font-medium">
                  {steps.filter((s) => s.status === "completed").length} / {steps.length}{" "}
                  completed
                </p>
              </div>
            </div>
            {execution.error && (
              <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <strong>Error:</strong> {execution.error}
                </p>
              </div>
            )}
          </div>

          {/* Execution Steps */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Execution Steps</h2>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="rounded-lg border border-border bg-white dark:bg-card overflow-hidden"
              >
                <button
                  onClick={() => toggleStepExpansion(step.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </div>
                    {getStatusIcon(step.status)}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{step.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {step.type} • {step.status}
                      </p>
                    </div>
                    {step.duration && (
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(step.duration)}
                      </span>
                    )}
                  </div>
                  {expandedSteps.has(step.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedSteps.has(step.id) && (
                  <div className="px-4 pb-4 border-t border-border bg-muted/20">
                    {step.error && (
                      <div className="mt-3 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          <strong>Error:</strong> {step.error}
                        </p>
                      </div>
                    )}
                    {step.inputSummary && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Code className="h-3 w-3" />
                          Input
                        </p>
                        <pre className="p-3 rounded-md bg-muted text-xs font-mono overflow-x-auto">
                          {JSON.stringify(step.inputSummary, null, 2)}
                        </pre>
                      </div>
                    )}
                    {step.outputSummary && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Code className="h-3 w-3" />
                          Output
                        </p>
                        <pre className="p-3 rounded-md bg-muted text-xs font-mono overflow-x-auto">
                          {JSON.stringify(step.outputSummary, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
