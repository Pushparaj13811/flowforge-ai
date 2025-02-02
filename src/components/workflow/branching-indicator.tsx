"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

interface BranchingIndicatorProps {
  edgeCount: number;
  edgeLabels?: string[];
  isCompact?: boolean;
  className?: string;
}

export function BranchingIndicator({
  edgeCount,
  edgeLabels = [],
  isCompact = false,
  className,
}: BranchingIndicatorProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Only show if 3+ outputs
  if (edgeCount < 3) {
    return null;
  }

  const displayText = `${edgeCount} branches`;

  return (
    <motion.div
      className={cn(
        "absolute -bottom-1 -right-1 z-20",
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Main badge */}
      <div
        className={cn(
          "rounded-full border-2 border-card bg-flow-blue/20 flex items-center justify-center",
          "cursor-pointer transition-all duration-200",
          "hover:bg-flow-blue/30 hover:ring-2 hover:ring-flow-blue/40",
          isCompact ? "w-6 h-6" : "px-2 py-1 h-6"
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isCompact ? (
          <GitBranch className="h-3 w-3 text-flow-blue flex-shrink-0" />
        ) : (
          <>
            <GitBranch className="h-3 w-3 text-flow-blue mr-1 flex-shrink-0" />
            <span className="text-[10px] font-semibold text-flow-blue whitespace-nowrap">
              {edgeCount}
            </span>
          </>
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className={cn(
              "absolute top-0 right-full mr-2 z-30",
              "bg-card border border-border rounded-lg shadow-lg",
              "px-3 py-2 min-w-max text-xs"
            )}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="font-semibold text-foreground mb-1">
              {displayText}
            </div>
            {edgeLabels.length > 0 && (
              <div className="text-muted-foreground space-y-0.5">
                {edgeLabels.slice(0, 5).map((label, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-flow-blue" />
                    {label}
                  </div>
                ))}
                {edgeLabels.length > 5 && (
                  <div className="text-[10px] text-muted-foreground/70 mt-1">
                    +{edgeLabels.length - 5} more
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
