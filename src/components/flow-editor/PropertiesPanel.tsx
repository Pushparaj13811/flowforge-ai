"use client";

/**
 * Properties Panel - Right sidebar for editing selected node
 * Includes configuration forms for different node types (Slack, Email, etc.)
 */

import * as React from "react";
import {
  X,
  Trash2,
  Copy,
  Webhook,
  Cog,
  GitBranch,
  Plus,
  HelpCircle,
  Database,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFlowStore } from "./store";
import { OUTPUT_TEMPLATES } from "./types";
import {
  typeIcons,
  typeColors,
  Section,
  FormField,
  getConfigComponent,
} from "./properties-panel";
import type { PropertiesPanelProps } from "./properties-panel";

export function PropertiesPanel({ className }: PropertiesPanelProps) {
  const {
    nodes,
    selectedNodeId,
    updateNode,
    deleteNode,
    duplicateNode,
    selectNode,
    toggleRightSidebar,
  } = useFlowStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              Select a node to view its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  const nodeData = selectedNode.data;
  const nodeType = nodeData.nodeType || "action";
  const TypeIcon = typeIcons[nodeType] || Cog;
  const config = (nodeData.config as Record<string, unknown>) || {};

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { label: e.target.value });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { description: e.target.value });
    }
  };

  const handleConfigChange = (newConfig: Record<string, unknown>) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { config: newConfig });
    }
  };

  const handleDelete = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  };

  const handleDuplicate = () => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
    }
  };

  const handleClose = () => {
    selectNode(null);
    toggleRightSidebar();
  };

  const ConfigComponent = getConfigComponent(
    nodeData.label,
    nodeData.icon,
    nodeType,
    config,
    handleConfigChange,
    selectedNodeId || undefined
  );

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", typeColors[nodeType])}>
            <TypeIcon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium truncate max-w-[180px]">{nodeData.label}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Basic Properties */}
        <Section title="Basic" defaultOpen={true}>
          <FormField label="Name" required>
            <Input
              value={nodeData.label}
              onChange={handleLabelChange}
              placeholder="Node name"
              className="h-8 text-sm"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={nodeData.description || ""}
              onChange={handleDescriptionChange}
              placeholder="Add a description..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none resize-none"
            />
          </FormField>
        </Section>

        {/* Configuration */}
        {ConfigComponent && (
          <Section title="Configuration" defaultOpen={true}>
            {ConfigComponent}
          </Section>
        )}

        {/* Outputs Section (for action and condition nodes) */}
        {(nodeType === "action" || nodeType === "condition") && (
          <Section title="Outputs" icon={GitBranch} defaultOpen={false}>
            <div className="space-y-3">
              {/* Quick Templates */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick Templates:</p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => {
                      updateNode(selectedNodeId!, {
                        outputs: OUTPUT_TEMPLATES.yesNo,
                      });
                    }}
                  >
                    Yes/No
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => {
                      updateNode(selectedNodeId!, {
                        outputs: OUTPUT_TEMPLATES.successError,
                      });
                    }}
                  >
                    Success/Error
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => {
                      updateNode(selectedNodeId!, {
                        outputs: OUTPUT_TEMPLATES.yesNoMaybe,
                      });
                    }}
                  >
                    Yes/No/Maybe
                  </Button>
                </div>
              </div>

              {/* Output List */}
              {nodeData.outputs && nodeData.outputs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Custom Outputs:</p>
                  {nodeData.outputs.map((output, idx) => (
                    <div key={output.id} className="flex items-center gap-2">
                      <Input
                        value={output.label}
                        onChange={(e) => {
                          const newOutputs = [...(nodeData.outputs || [])];
                          newOutputs[idx] = { ...output, label: e.target.value };
                          updateNode(selectedNodeId!, { outputs: newOutputs });
                        }}
                        className="h-8 text-sm flex-1"
                        placeholder="Output label"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const newOutputs = nodeData.outputs?.filter((_, i) => i !== idx);
                          updateNode(selectedNodeId!, { outputs: newOutputs });
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Output Button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full gap-1.5"
                onClick={() => {
                  const newOutput = {
                    id: `output-${Date.now()}`,
                    label: `Output ${(nodeData.outputs?.length || 0) + 1}`,
                    type: "custom" as const,
                  };
                  updateNode(selectedNodeId!, {
                    outputs: [...(nodeData.outputs || []), newOutput],
                  });
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Output
              </Button>

              {/* Clear Outputs */}
              {nodeData.outputs && nodeData.outputs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs text-muted-foreground"
                  onClick={() => {
                    updateNode(selectedNodeId!, { outputs: undefined });
                  }}
                >
                  Clear All Outputs
                </Button>
              )}
            </div>
          </Section>
        )}

        {/* Status */}
        <Section title="Status" defaultOpen={false}>
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                nodeData.status === "success" && "bg-green-500",
                nodeData.status === "error" && "bg-red-500",
                nodeData.status === "running" && "bg-blue-500 animate-pulse",
                nodeData.status === "pending" && "bg-orange-500 animate-pulse",
                (!nodeData.status || nodeData.status === "idle") && "bg-gray-400"
              )}
            />
            <span className="text-sm capitalize">{nodeData.status || "idle"}</span>
          </div>
        </Section>

        {/* Variables Quick Guide - Help users understand how to use variables */}
        {nodeType !== "trigger" && (
          <Section title="Variables Guide" icon={HelpCircle} defaultOpen={false}>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-2">Use variables to insert dynamic data:</p>
              </div>

              {/* Trigger Variables */}
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <Webhook className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">From Trigger</span>
                </div>
                <div className="space-y-1">
                  <code className="block text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                    {`{{$trigger.data.email}}`}
                  </code>
                  <code className="block text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                    {`{{$trigger.data.name}}`}
                  </code>
                </div>
              </div>

              {/* Node Outputs */}
              <div className="p-2.5 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <Database className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">From Previous Nodes</span>
                </div>
                <code className="block text-[10px] font-mono text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                  {`{{$node.<id>.output.data}}`}
                </code>
              </div>

              {/* Workflow Info */}
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <Filter className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Workflow Info</span>
                </div>
                <code className="block text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                  {`{{$workflow.id}}`}
                </code>
              </div>

              {/* Tip */}
              <div className="p-2 bg-muted rounded-md">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Tip:</span> Click the{" "}
                  <span className="inline-flex items-center justify-center h-4 w-4 bg-primary/10 rounded align-middle mx-0.5">
                    <span className="text-[8px]">x</span>
                  </span>{" "}
                  button in any text field to browse and insert variables.
                </p>
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-border/50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 gap-1.5"
          onClick={handleDuplicate}
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
