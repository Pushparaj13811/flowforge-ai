"use client";

import * as React from "react";
import { CheckCircle2, Edit, Play, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface WorkflowSuccessBannerProps {
  workflowId: string;
  workflowName: string;
  nodeCount: number;
  onRunTest?: () => void;
  className?: string;
}

/**
 * Success banner shown after workflow is created
 * Provides clear next steps: Open Editor or Run Test
 */
export function WorkflowSuccessBanner({
  workflowId,
  workflowName,
  nodeCount,
  onRunTest,
  className,
}: WorkflowSuccessBannerProps) {
  const router = useRouter();

  const handleOpenEditor = () => {
    router.push(`/app/workflows/${workflowId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border shadow-sm",
        "bg-green-50 dark:bg-green-950/20",
        "border-green-200 dark:border-green-800",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </div>
        <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
          Workflow Created Successfully!
        </h4>
      </div>

      {/* Details */}
      <p className="text-sm text-green-800 dark:text-green-200 mb-3 ml-7">
        Your <strong>&quot;{workflowName}&quot;</strong> workflow has been saved with{" "}
        <strong>{nodeCount}</strong> {nodeCount === 1 ? "node" : "nodes"}.
        You can now edit it in the full visual editor or run a test.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 ml-7">
        <Button
          onClick={handleOpenEditor}
          size="sm"
          className="gap-1.5 h-8 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
        >
          <Edit className="h-3.5 w-3.5" />
          Open in Editor
        </Button>

        {onRunTest && (
          <Button
            onClick={onRunTest}
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900"
          >
            <Play className="h-3.5 w-3.5" />
            Run Test
          </Button>
        )}

        <Button
          onClick={handleOpenEditor}
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Details
        </Button>
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800 ml-7">
        <p className="text-xs text-green-700 dark:text-green-300">
          💡 Tip: The workflow is also shown in the preview panel on the right →
        </p>
      </div>
    </motion.div>
  );
}
