"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Inbox,
  Search,
  FileQuestion,
  Wifi,
  AlertCircle,
  Plus,
  Zap,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "gradient" | "outline";
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative mb-4"
      >
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <motion.div
          className="absolute -inset-2 rounded-3xl bg-gradient-flow opacity-10 blur-xl -z-10"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>

      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}

      {action && (
        <Button
          variant={action.variant || "gradient"}
          onClick={action.onClick}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// Pre-configured empty states
export function NoWorkflowsEmpty({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <EmptyState
      icon={Zap}
      title="No workflows yet"
      description="Create your first workflow to automate tasks and save time."
      action={{
        label: "Create Workflow",
        onClick: onCreateNew,
        variant: "gradient",
      }}
    />
  );
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any matches for "${query}". Try adjusting your search.`}
    />
  );
}

export function NoDataEmpty() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="No data available"
      description="There's nothing to show here yet. Check back later."
    />
  );
}

export function OfflineEmpty() {
  return (
    <EmptyState
      icon={Wifi}
      title="You're offline"
      description="Please check your internet connection and try again."
    />
  );
}

export function ErrorEmpty({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something went wrong"
      description={message || "An unexpected error occurred. Please try again."}
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
              variant: "outline",
            }
          : undefined
      }
    />
  );
}
