"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text" | "card";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variants = {
    default: "rounded-lg",
    circular: "rounded-full",
    text: "rounded h-4",
    card: "rounded-2xl h-48",
  };

  return (
    <div
      className={cn(
        "skeleton",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12" variant="circular" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

function SkeletonMessage({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={cn("flex gap-3", align === "right" && "flex-row-reverse")}>
      <Skeleton className="h-8 w-8 flex-shrink-0" variant="circular" />
      <div className={cn("space-y-2 flex-1", align === "right" && "flex flex-col items-end")}>
        <Skeleton className={cn("h-4", align === "right" ? "w-24" : "w-32")} />
        <Skeleton className={cn("h-16 rounded-2xl", align === "right" ? "w-48" : "w-64")} />
      </div>
    </div>
  );
}

function SkeletonWorkflowNode() {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-4 w-48">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-10 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonMessage, SkeletonWorkflowNode, SkeletonStats };
