"use client";

import * as React from "react";
import { useState } from "react";
import { Info, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PreviewBannerProps {
  componentName?: string;
  onCreateWorkflow?: () => void;
  className?: string;
}

/**
 * Preview banner shown above demo components to indicate they're for editing only
 * This component should rarely be shown - AI should create workflows directly
 */
export function PreviewBanner({
  componentName = "component",
  onCreateWorkflow,
  className,
}: PreviewBannerProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleClick = () => {
    if (isCreating || !onCreateWorkflow) return;
    setIsCreating(true);
    onCreateWorkflow();
    // Reset after a short delay
    setTimeout(() => setIsCreating(false), 3000);
  };

  return (
    <div
      className={cn(
        "mb-4 p-3 rounded-lg border",
        "bg-amber-50 dark:bg-amber-950/20",
        "border-amber-200 dark:border-amber-800",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mt-0.5">
          <Info className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong className="font-semibold">Editing Mode:</strong> This {componentName} is for editing an existing node.
            To create a new workflow, just describe what you want in the chat.
          </p>
          {onCreateWorkflow && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClick}
              disabled={isCreating}
              className="h-7 gap-1.5 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
            >
              {isCreating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {isCreating ? "Requesting..." : "Request Workflow Creation"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
