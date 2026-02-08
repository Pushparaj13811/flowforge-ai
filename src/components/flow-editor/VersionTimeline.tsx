/**
 * @file flow-editor/VersionTimeline.tsx
 * @description Timeline component displaying workflow version history
 * Follows Single Responsibility Principle - only handles version timeline display
 */

"use client";

import * as React from "react";
import { History, Clock, User, Bot, RotateCcw, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { workflowVersionAPIService } from "@/lib/conversation";
import { formatDistanceToNow } from "date-fns";

/**
 * Version data interface
 */
interface WorkflowVersionData {
  id: string;
  messageId: string | null;
  changeDescription: string | null;
  changeType: string | null;
  changedBy: string;
  nodeCount: number;
  createdAt: string;
  message?: {
    role: string;
    content: string;
  };
}

/**
 * Props for VersionTimeline
 */
interface VersionTimelineProps {
  workflowId: string;
  onPreview?: (versionId: string) => void;
  onRestore?: (versionId: string) => void;
  className?: string;
}

/**
 * VersionTimeline Component
 * Displays workflow version history with preview and restore options
 */
export function VersionTimeline({
  workflowId,
  onPreview,
  onRestore,
  className,
}: VersionTimelineProps) {
  const [versions, setVersions] = React.useState<WorkflowVersionData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCollapsed, setIsCollapsed] = React.useState(true);
  const [selectedVersionId, setSelectedVersionId] = React.useState<string | null>(null);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);

  /**
   * Load versions on mount and periodically
   */
  React.useEffect(() => {
    loadVersions();

    // Refresh every 10 seconds to catch new versions
    const intervalId = setInterval(() => {
      if (!isCollapsed) {
        loadVersions();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [workflowId, isCollapsed]);

  /**
   * Load versions from API
   */
  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const data = await workflowVersionAPIService.getVersions(workflowId);
      setVersions(data as WorkflowVersionData[]);
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle preview click
   */
  const handlePreview = async (versionId: string) => {
    setIsPreviewing(true);
    setSelectedVersionId(versionId);
    try {
      await onPreview?.(versionId);
    } catch (error) {
      console.error("Preview failed:", error);
    } finally {
      setIsPreviewing(false);
    }
  };

  /**
   * Handle restore click
   */
  const handleRestore = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore to this version?\n\nThis will update your workflow to match this historical state.")) {
      return;
    }

    setIsRestoring(true);
    try {
      await onRestore?.(versionId);
      // Reload versions to show the new rollback version
      await loadVersions();
      setSelectedVersionId(null);
    } catch (error) {
      console.error("Failed to restore version:", error);
      alert("Failed to restore version. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className={cn("border-t border-border/50 bg-white dark:bg-card", className)}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm font-medium">Version History</span>
            {versions.length > 0 && (
              <Badge variant="secondary" className="h-5 text-xs">
                {versions.length}
              </Badge>
            )}
          </div>
          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("border-t border-border/50 bg-white dark:bg-card relative", className)}>
      {/* Restoring Overlay */}
      {isRestoring && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-card shadow-lg border border-border">
              <RotateCcw className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Restoring version...</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Version History</h3>
          {versions.length > 0 && (
            <Badge variant="secondary" className="h-5 text-xs">
              {versions.length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsCollapsed(true)}
          title="Collapse"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Version List */}
      <ScrollArea className="h-64">
        <div className="p-3 space-y-2">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-muted/50 animate-pulse"
              />
            ))
          ) : versions.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No version history yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Versions will appear here as you make changes
              </p>
            </div>
          ) : (
            // Version items
            versions.map((version, index) => (
              <VersionItem
                key={version.id}
                version={version}
                isLatest={index === 0}
                isSelected={version.id === selectedVersionId}
                onPreview={() => handlePreview(version.id)}
                onRestore={() => handleRestore(version.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Individual version item component
 */
interface VersionItemProps {
  version: WorkflowVersionData;
  isLatest: boolean;
  isSelected: boolean;
  onPreview: () => void;
  onRestore: () => void;
}

function VersionItem({
  version,
  isLatest,
  isSelected,
  onPreview,
  onRestore,
}: VersionItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-3 transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : isLatest
          ? "border-green-500/20 bg-green-50/50 dark:bg-green-950/10"
          : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded",
            version.changedBy === "ai"
              ? "bg-purple-100 dark:bg-purple-950/30"
              : "bg-blue-100 dark:bg-blue-950/30"
          )}>
            {version.changedBy === "ai" ? (
              <Bot className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            ) : (
              <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
              {version.changeDescription || "Workflow update"}
            </p>
          </div>

          {isLatest && (
            <Badge variant="success" className="h-5 text-[10px] shrink-0">
              Current
            </Badge>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>•</span>
          <span>{version.nodeCount} nodes</span>
        </div>
      </div>

      {/* Message preview */}
      {version.message && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {version.message.content}
        </p>
      )}

      {/* Actions (shown on hover or when selected) */}
      {(isHovered || isSelected) && !isLatest && (
        <div className="flex gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs flex-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700"
            onClick={onPreview}
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs flex-1 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-300 dark:hover:border-green-700"
            onClick={onRestore}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restore
          </Button>
        </div>
      )}

      {/* Latest version info */}
      {isLatest && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          This is your current workflow state
        </div>
      )}
    </div>
  );
}
