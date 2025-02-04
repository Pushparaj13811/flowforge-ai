"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  Play,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Workflow {
  id: string;
  name: string;
  status: "draft" | "active" | "paused";
  executionCount: number;
  nodeCount: number;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
}

export default function DashboardPage() {
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [executions, setExecutions] = React.useState<Execution[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [workflowsRes, executionsRes] = await Promise.all([
          fetch("/api/workflows"),
          fetch("/api/executions"),
        ]);

        const workflowsData = await workflowsRes.json();
        const executionsData = await executionsRes.json();

        setWorkflows(workflowsData.workflows || []);
        setExecutions(executionsData.executions || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter((w) => w.status === "active").length;
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(
      (e) => e.status === "completed"
    ).length;
    const successRate =
      totalExecutions > 0
        ? Math.round((successfulExecutions / totalExecutions) * 100)
        : 0;
    const avgDuration =
      executions.length > 0
        ? Math.round(
            executions.reduce((sum, e) => sum + (e.duration || 0), 0) /
              executions.length
          )
        : 0;

    return {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successRate,
      avgDuration,
    };
  }, [workflows, executions]);

  // Prepare chart data
  const executionTrendData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last7Days.map((date) => {
      const dayExecutions = executions.filter((e) => {
        const execDate = new Date(e.startedAt);
        execDate.setHours(0, 0, 0, 0);
        return execDate.getTime() === date.getTime();
      });

      return {
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        executions: dayExecutions.length,
        successful: dayExecutions.filter((e) => e.status === "completed").length,
        failed: dayExecutions.filter((e) => e.status === "failed").length,
      };
    });
  }, [executions]);

  const workflowStatusData = React.useMemo(() => {
    return [
      { name: "Active", value: workflows.filter((w) => w.status === "active").length },
      { name: "Draft", value: workflows.filter((w) => w.status === "draft").length },
      { name: "Paused", value: workflows.filter((w) => w.status === "paused").length },
    ].filter((item) => item.value > 0);
  }, [workflows]);

  const COLORS = {
    Active: "hsl(var(--chart-1))",
    Draft: "hsl(var(--chart-2))",
    Paused: "hsl(var(--chart-3))",
  };

  // Recent activity
  const recentActivity = React.useMemo(() => {
    return executions
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        type: "execution",
        workflowName: e.workflowName,
        status: e.status,
        timestamp: e.startedAt,
      }));
  }, [executions]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fafbfc] dark:bg-background">
      {/* Page Header */}
      <div className="sticky top-14 z-20 h-14 flex items-center justify-between px-6 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div>
          <h1 className="text-sm font-semibold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Overview of your workflows and executions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Workflows"
            value={stats.totalWorkflows}
            subtitle={`${stats.activeWorkflows} active`}
            icon={GitBranch}
            trend={stats.activeWorkflows > 0 ? "up" : undefined}
            color="primary"
          />
          <StatCard
            title="Total Executions"
            value={stats.totalExecutions}
            subtitle="All time"
            icon={Play}
            color="blue"
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            subtitle={`${stats.totalExecutions} runs`}
            icon={CheckCircle2}
            trend={stats.successRate >= 80 ? "up" : stats.successRate >= 50 ? undefined : "down"}
            color="green"
          />
          <StatCard
            title="Avg Duration"
            value={`${stats.avgDuration}ms`}
            subtitle="Per execution"
            icon={Clock}
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Execution Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border-2 border-border/50 bg-white dark:bg-card p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Execution Trend</h2>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={executionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="successful"
                  stackId="a"
                  fill="hsl(var(--chart-1))"
                  name="Successful"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="failed"
                  stackId="a"
                  fill="hsl(var(--destructive))"
                  name="Failed"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Workflow Status Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border-2 border-border/50 bg-white dark:bg-card p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Workflow Status</h2>
                <p className="text-xs text-muted-foreground">Distribution</p>
              </div>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </div>
            {workflowStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={workflowStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {workflowStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name as keyof typeof COLORS]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-60">
                <p className="text-sm text-muted-foreground">No workflows yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border-2 border-border/50 bg-white dark:bg-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Recent Activity</h2>
              <p className="text-xs text-muted-foreground">Latest workflow executions</p>
            </div>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        activity.status === "completed" && "bg-green-500",
                        activity.status === "running" && "bg-blue-500 animate-pulse",
                        activity.status === "failed" && "bg-red-500"
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium">{activity.workflowName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {activity.status}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Zap className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run a workflow to see activity
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down";
  color?: "primary" | "blue" | "green" | "purple";
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "primary",
}: StatCardProps) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border-2 border-border/50 bg-white dark:bg-card p-4 hover:shadow-lg hover:border-border transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {trend && (
              <TrendingUp
                className={cn(
                  "h-3.5 w-3.5",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500 rotate-180"
                )}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
};
