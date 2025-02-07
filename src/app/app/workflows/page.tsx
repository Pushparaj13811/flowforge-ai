"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Search, Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniStats, WorkflowList } from "@/components/dashboard";
import { useToast } from "@/components/ui/toast";

interface Workflow {
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

export default function WorkflowsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Fetch workflows from API
  const fetchWorkflows = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/workflows?${params.toString()}`);
      const data = await response.json();
      if (data.workflows) {
        setWorkflows(
          data.workflows.map((w: any) => ({
            id: w.id,
            name: w.name,
            description: w.description,
            status: w.status as "active" | "paused" | "draft",
            nodeCount: w.nodeCount,
            executionCount: w.executionCount,
            successRate: w.successRate,
            lastRunAt: w.lastRunAt,
            updatedAt: w.updatedAt,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Delete workflow handler
  const handleDeleteWorkflow = async (id: string) => {
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) return;

    if (!confirm(`Delete "${workflow.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
        addToast({ type: "success", title: "Workflow deleted successfully" });
      } else {
        const data = await response.json();
        addToast({ type: "error", title: data.error || "Failed to delete workflow" });
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      addToast({ type: "error", title: "Failed to delete workflow" });
    } finally {
      setDeletingId(null);
    }
  };

  // Run workflow handler
  const handleRunWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/workflows/${id}/execute`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        addToast({ type: "success", title: "Workflow execution started" });
        // Refresh workflows to update execution count
        fetchWorkflows();
      } else {
        const data = await response.json();
        addToast({ type: "error", title: data.error || "Failed to run workflow" });
      }
    } catch (error) {
      console.error("Failed to run workflow:", error);
      addToast({ type: "error", title: "Failed to run workflow" });
    }
  };

  // Duplicate workflow handler
  const handleDuplicateWorkflow = async (id: string) => {
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) return;

    try {
      // First get the full workflow data
      const getResponse = await fetch(`/api/workflows/${id}`, {
        credentials: "include",
      });

      if (!getResponse.ok) {
        addToast({ type: "error", title: "Failed to fetch workflow data" });
        return;
      }

      const { workflow: fullWorkflow } = await getResponse.json();

      // Create a new workflow with the same data
      const createResponse = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
          nodes: fullWorkflow.nodes || [],
          edges: fullWorkflow.edges || [],
        }),
      });

      if (createResponse.ok) {
        addToast({ type: "success", title: "Workflow duplicated" });
        fetchWorkflows();
      } else {
        const data = await createResponse.json();
        addToast({ type: "error", title: data.error || "Failed to duplicate workflow" });
      }
    } catch (error) {
      console.error("Failed to duplicate workflow:", error);
      addToast({ type: "error", title: "Failed to duplicate workflow" });
    }
  };

  // Filter workflows by search query
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === "active").length,
    drafts: workflows.filter((w) => w.status === "draft").length,
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fafbfc] dark:bg-background">
      {/* Page Header */}
      <div className="sticky top-14 z-20 h-14 flex items-center justify-between px-6 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-sm font-semibold">Workflows</h1>
            <p className="text-xs text-muted-foreground">
              Manage your workflow automations
            </p>
          </div>
          <MiniStats {...stats} />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Sort
          </Button>
          <Link href="/app">
            <Button size="sm" className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Search and Status Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-3 text-sm rounded-lg border border-border/50 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
            {["all", "active", "paused", "draft"].map((filter) => (
              <button
                key={filter}
                onClick={() =>
                  setStatusFilter(filter === "all" ? null : filter)
                }
                className={`px-3 h-7 text-xs font-medium rounded-md transition-colors ${
                  (filter === "all" && !statusFilter) ||
                  statusFilter === filter
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Workflows Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <WorkflowList
            workflows={filteredWorkflows}
            layout="grid"
            onWorkflowClick={(id) => router.push(`/app/workflows/${id}`)}
            onWorkflowDelete={handleDeleteWorkflow}
            onWorkflowRun={handleRunWorkflow}
            onWorkflowDuplicate={handleDuplicateWorkflow}
          />
        )}
      </div>
    </div>
  );
}
