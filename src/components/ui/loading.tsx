"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <svg
      className={cn("animate-spin", sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}

interface LoadingPulseProps {
  className?: string;
}

export function LoadingPulse({ className }: LoadingPulseProps) {
  return (
    <div className={cn("relative", className)}>
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/30"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/50"
        animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      />
      <div className="relative h-3 w-3 rounded-full bg-primary" />
    </div>
  );
}

interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = "Loading..." }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Animated Logo */}
        <motion.div
          className="relative h-16 w-16 rounded-2xl bg-gradient-flow flex items-center justify-center"
          animate={{
            boxShadow: [
              "0 0 20px rgba(99, 102, 241, 0.3)",
              "0 0 40px rgba(99, 102, 241, 0.5)",
              "0 0 20px rgba(99, 102, 241, 0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Workflow className="h-8 w-8 text-white" />
        </motion.div>

        {/* Loading text */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground animate-thinking-gradient">
            {message}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-flow rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

interface LoadingCardSkeletonProps {
  className?: string;
}

export function LoadingCardSkeleton({ className }: LoadingCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded skeleton" />
          <div className="h-3 w-1/3 rounded skeleton" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-3 w-4/5 rounded skeleton" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="h-3 w-20 rounded skeleton" />
        <div className="h-8 w-16 rounded-lg skeleton" />
      </div>
    </div>
  );
}

interface LoadingListSkeletonProps {
  count?: number;
  className?: string;
}

export function LoadingListSkeleton({ count = 3, className }: LoadingListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl border border-border"
        >
          <div className="h-10 w-10 rounded-xl skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded skeleton" />
            <div className="h-3 w-1/4 rounded skeleton" />
          </div>
          <div className="h-2 w-2 rounded-full skeleton" />
        </div>
      ))}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: "default" | "gradient" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  variant = "default",
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "bg-primary",
    gradient: "bg-gradient-flow",
    success: "bg-flow-green",
    warning: "bg-flow-orange",
    error: "bg-destructive",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}
      >
        <motion.div
          className={cn("h-full rounded-full", variantClasses[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
