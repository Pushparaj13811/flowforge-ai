"use client";

/**
 * @file page.tsx
 * @description Workflow execution history page
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
  ChevronRight,
  Play,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  error: string | null;
  createdAt: string;
}

export default function ExecutionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [executions, setExecutions] = React.useState<Execution[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [workflowName, setWorkflowName] = React.useState("");

  React.useEffect(() => {
    async function fetchExecutions() {
      try {
        // Fetch workflow name
        const workflowResponse = await fetch(`/api/workflows/${workflowId}`, {
          credentials: "include",
        });
        const workflowData = await workflowResponse.json();
        setWorkflowName(workflowData.workflow?.name || "Unknown Workflow");

        // Fetch executions
        const executionsResponse = await fetch(
          `/api/workflows/${workflowId}/executions`,
          {
            credentials: "include",
          }
        );
        const executionsData = await executionsResponse.json();
        setExecutions(executionsData.executions || []);
      } catch (error) {
        console.error("Failed to fetch executions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExecutions();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, [workflowId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
      completed: "success",
      failed: "destructive",
      running: "warning",
      pending: "secondary",
    };

    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-border/50 bg-white dark:bg-card">
        <div className="flex items-center gap-4">
          <Link href={`/app/workflows/${workflowId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Execution History</h1>
            <p className="text-sm text-muted-foreground">{workflowName}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => router.push(`/app/workflows/${workflowId}`)}
        >
          <Play className="h-3.5 w-3.5 mr-2" />
          Run Workflow
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {executions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Executions Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              This workflow hasn't been executed yet. Click "Run Workflow" to
              start your first execution.
            </p>
            <Button onClick={() => router.push(`/app/workflows/${workflowId}`)}>
              <Play className="h-4 w-4 mr-2" />
              Go to Workflow
            </Button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-3">
              {executions.map((execution) => (
                <Link
                  key={execution.id}
                  href={`/app/workflows/${workflowId}/executions/${execution.id}`}
                  className="block"
                >
                  <div
                    className={cn(
                      "p-4 rounded-lg border border-border bg-white dark:bg-card hover:border-primary/50 transition-all cursor-pointer",
                      execution.status === "running" && "border-blue-500/30 bg-blue-50/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getStatusIcon(execution.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-muted-foreground">
                              #{execution.id.slice(0, 8)}
                            </span>
                            {getStatusBadge(execution.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(execution.createdAt)}
                            </span>
                            {execution.duration && (
                              <span>Duration: {formatDuration(execution.duration)}</span>
                            )}
                          </div>
                          {execution.error && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400 truncate">
                              {execution.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
