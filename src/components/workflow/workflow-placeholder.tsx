"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Maximize2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WorkflowPlaceholderProps {
  name: string;
  description?: string;
  nodeCount?: number;
  onExpand?: () => void;
  className?: string;
}

/**
 * Placeholder shown in chat when workflow is displayed in sticky panel
 * Prevents duplicate content and guides user to the panel
 */
export function WorkflowPlaceholder({
  name,
  description,
  nodeCount = 0,
  onExpand,
  className,
}: WorkflowPlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "glass border border-glass-border rounded-xl p-6 max-w-2xl",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      {/* Icon Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-lg bg-flow-blue/10 flex items-center justify-center border border-flow-blue/20">
          <Layers className="h-6 w-6 text-flow-blue" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-flow-green animate-pulse" />
          Workflow is now in the side panel
          <ArrowRight className="h-4 w-4" />
        </p>
        {nodeCount > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'} configured
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onExpand && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExpand}
            className="gap-2"
          >
            <Maximize2 className="h-4 w-4" />
            Open Full Editor
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Scroll to sticky panel (right side)
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="gap-2"
        >
          View in Panel
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Hint */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          💡 Tip: Click nodes in the panel to configure them directly
        </p>
      </div>
    </motion.div>
  );
}
