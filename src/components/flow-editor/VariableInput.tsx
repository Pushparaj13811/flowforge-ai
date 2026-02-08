/**
 * @file VariableInput.tsx
 * @description User-friendly variable input with autocomplete
 *
 * Key UX Principles:
 * - Users see human-readable labels, not internal IDs
 * - Variables from trigger show the expected data fields
 * - Previous node outputs are named by their node label
 * - Search and category filtering for easy navigation
 */

"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Variable, Zap, Box, Settings, Globe, X, Search, HelpCircle } from "lucide-react";
import { useFlowStore } from "./store";

// Variable with category for grouping
interface VariableItem {
  path: string;          // Internal path like "$trigger.data.email"
  displayPath: string;   // What user sees: "Trigger → email"
  fullPath: string;      // With {{ }} for insertion
  example: string;
  description?: string;
  category: "trigger" | "node" | "workflow" | "env";
  sourceLabel?: string;  // "Form Webhook" or "Send Email"
}

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  nodeId?: string;       // Current node to determine which nodes come before
  multiline?: boolean;
  label?: string;
  helpText?: string;
}

// Category config for display
const categoryConfig = {
  trigger: { icon: Zap, label: "From Trigger", color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  node: { icon: Box, label: "From Previous Steps", color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950/30" },
  workflow: { icon: Settings, label: "Workflow Info", color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  env: { icon: Globe, label: "Environment", color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
};

/**
 * Generate available variables based on workflow context
 * Uses node LABELS (not IDs) for user-friendly display
 */
function useAvailableVariables(currentNodeId?: string): VariableItem[] {
  const { nodes, edges } = useFlowStore();

  return React.useMemo(() => {
    const variables: VariableItem[] = [];

    // Find trigger node
    const triggerNode = nodes.find((n) => n.data.nodeType === "trigger");

    if (triggerNode) {
      const triggerLabel = triggerNode.data.label || "Trigger";
      const triggerConfig = (triggerNode.data.config || {}) as Record<string, unknown>;

      // Check if trigger has defined form fields (for Form triggers)
      const formFields = triggerConfig.formFields as Array<{ name: string; type: string }> | undefined;

      if (formFields && formFields.length > 0) {
        // Use the actual form fields defined by the user
        formFields.forEach((field) => {
          if (field.name) {
            variables.push({
              path: `$trigger.data.${field.name}`,
              displayPath: `${triggerLabel} → ${field.name}`,
              fullPath: `{{$trigger.data.${field.name}}}`,
              example: field.type === "email" ? "user@example.com" :
                       field.type === "number" ? "123" :
                       field.type === "boolean" ? "true" :
                       `Sample ${field.name}`,
              description: `${field.type} field from your form`,
              category: "trigger",
              sourceLabel: triggerLabel,
            });
          }
        });
      } else {
        // Default webhook data - common fields
        const defaultFields = [
          { name: "email", example: "user@example.com", desc: "Email address" },
          { name: "name", example: "John Doe", desc: "Name" },
          { name: "message", example: "Hello...", desc: "Message content" },
          { name: "amount", example: "99.99", desc: "Numeric amount" },
          { name: "status", example: "completed", desc: "Status value" },
          { name: "id", example: "abc123", desc: "Unique identifier" },
        ];

        // Add hint that these are examples
        variables.push({
          path: "$trigger.data",
          displayPath: `${triggerLabel} → (all data)`,
          fullPath: "{{$trigger.data}}",
          example: '{ "email": "...", "name": "..." }',
          description: "All data from the webhook payload",
          category: "trigger",
          sourceLabel: triggerLabel,
        });

        defaultFields.forEach((field) => {
          variables.push({
            path: `$trigger.data.${field.name}`,
            displayPath: `${triggerLabel} → ${field.name}`,
            fullPath: `{{$trigger.data.${field.name}}}`,
            example: field.example,
            description: field.desc,
            category: "trigger",
            sourceLabel: triggerLabel,
          });
        });
      }

      // Trigger timestamp always available
      variables.push({
        path: "$trigger.timestamp",
        displayPath: `${triggerLabel} → timestamp`,
        fullPath: "{{$trigger.timestamp}}",
        example: "2024-01-15T10:30:00Z",
        description: "When the workflow was triggered",
        category: "trigger",
        sourceLabel: triggerLabel,
      });
    }

    // Find nodes that come BEFORE the current node
    if (currentNodeId) {
      const predecessorIds = new Set<string>();

      // BFS to find all predecessors
      const findPredecessors = (nodeId: string) => {
        edges.forEach((edge) => {
          if (edge.target === nodeId && !predecessorIds.has(edge.source)) {
            predecessorIds.add(edge.source);
            findPredecessors(edge.source);
          }
        });
      };

      findPredecessors(currentNodeId);

      // Add variables from predecessor nodes (not including trigger, handled above)
      nodes.forEach((node) => {
        if (predecessorIds.has(node.id) && node.data.nodeType !== "trigger") {
          const nodeLabel = node.data.label || "Previous Step";

          // Use a slug from the label for the variable path (more readable than IDs)
          const labelSlug = nodeLabel
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "")
            .slice(0, 20);

          variables.push(
            {
              path: `$steps.${labelSlug}.output`,
              displayPath: `${nodeLabel} → output`,
              fullPath: `{{$steps.${labelSlug}.output}}`,
              example: "{ success: true, data: {...} }",
              description: `Full output from "${nodeLabel}"`,
              category: "node",
              sourceLabel: nodeLabel,
            },
            {
              path: `$steps.${labelSlug}.output.data`,
              displayPath: `${nodeLabel} → data`,
              fullPath: `{{$steps.${labelSlug}.output.data}}`,
              example: "{ ... }",
              description: `Data returned by "${nodeLabel}"`,
              category: "node",
              sourceLabel: nodeLabel,
            },
            {
              path: `$steps.${labelSlug}.success`,
              displayPath: `${nodeLabel} → success`,
              fullPath: `{{$steps.${labelSlug}.success}}`,
              example: "true",
              description: `Whether "${nodeLabel}" succeeded`,
              category: "node",
              sourceLabel: nodeLabel,
            }
          );
        }
      });
    }

    // Workflow variables
    variables.push(
      {
        path: "$workflow.id",
        displayPath: "Workflow → ID",
        fullPath: "{{$workflow.id}}",
        example: "wf_abc123",
        description: "Current workflow ID",
        category: "workflow",
      },
      {
        path: "$workflow.name",
        displayPath: "Workflow → Name",
        fullPath: "{{$workflow.name}}",
        example: "My Workflow",
        description: "Workflow name",
        category: "workflow",
      },
      {
        path: "$workflow.executionId",
        displayPath: "Workflow → Execution ID",
        fullPath: "{{$workflow.executionId}}",
        example: "exec_xyz789",
        description: "Current execution ID (unique per run)",
        category: "workflow",
      },
      {
        path: "$workflow.timestamp",
        displayPath: "Workflow → Current Time",
        fullPath: "{{$workflow.timestamp}}",
        example: "2024-01-15T10:30:00Z",
        description: "Current execution timestamp",
        category: "workflow",
      }
    );

    // Environment variables
    variables.push(
      {
        path: "$env.API_URL",
        displayPath: "Environment → API URL",
        fullPath: "{{$env.API_URL}}",
        example: "https://api.example.com",
        description: "API base URL from your settings",
        category: "env",
      },
      {
        path: "$env.APP_NAME",
        displayPath: "Environment → App Name",
        fullPath: "{{$env.APP_NAME}}",
        example: "FlowForge",
        description: "Application name",
        category: "env",
      }
    );

    return variables;
  }, [nodes, edges, currentNodeId]);
}

export function VariableInput({
  value,
  onChange,
  placeholder,
  className,
  nodeId,
  multiline = false,
  label,
  helpText,
}: VariableInputProps) {
  const [showPicker, setShowPicker] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const pickerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const availableVariables = useAvailableVariables(nodeId);

  // Filter variables based on search and category
  const filteredVariables = React.useMemo(() => {
    let filtered = availableVariables;

    if (selectedCategory) {
      filtered = filtered.filter((v) => v.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.displayPath.toLowerCase().includes(query) ||
          v.path.toLowerCase().includes(query) ||
          v.description?.toLowerCase().includes(query) ||
          v.sourceLabel?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [availableVariables, selectedCategory, searchQuery]);

  // Group variables by category
  const groupedVariables = React.useMemo(() => {
    const groups: Record<string, VariableItem[]> = {};
    filteredVariables.forEach((v) => {
      if (!groups[v.category]) {
        groups[v.category] = [];
      }
      groups[v.category].push(v);
    });
    return groups;
  }, [filteredVariables]);

  // Handle input change - detect {{ for autocomplete
  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    // Check if user just typed {{
    const textBeforeCursor = newValue.slice(0, cursorPosition + 1);
    const lastTwoChars = textBeforeCursor.slice(-2);

    if (lastTwoChars === "{{") {
      setShowPicker(true);
      setSearchQuery("");
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  // Insert variable at cursor position
  const insertVariable = (variable: VariableItem) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);

    // Check if we're replacing an incomplete variable
    const lastOpenBraces = textBeforeCursor.lastIndexOf("{{");
    let before = textBeforeCursor;

    if (lastOpenBraces !== -1 && !textBeforeCursor.slice(lastOpenBraces).includes("}}")) {
      before = textBeforeCursor.slice(0, lastOpenBraces);
    }

    const newValue = `${before}${variable.fullPath}${textAfterCursor}`;
    onChange(newValue);

    // Move cursor after inserted variable
    const newCursorPos = before.length + variable.fullPath.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = newCursorPos;
        inputRef.current.selectionEnd = newCursorPos;
        inputRef.current.focus();
      }
    }, 0);

    setShowPicker(false);
    setSearchQuery("");
  };

  // Keyboard navigation in picker
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPicker && filteredVariables.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredVariables.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredVariables.length - 1
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertVariable(filteredVariables[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowPicker(false);
      }
    }
  };

  // Track cursor position
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart || 0);
  };

  // Close picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selected index when filtered results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredVariables.length]);

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          {helpText && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              {helpText}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Input with variable button */}
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("font-mono text-sm pr-10", className)}
            rows={multiline ? 4 : 2}
          />

          {/* Variable picker toggle button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowPicker(!showPicker);
              if (!showPicker) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }
            }}
            className={cn(
              "absolute right-1 top-1 h-7 w-7 p-0",
              showPicker && "bg-primary/10 text-primary"
            )}
            title="Insert variable (or type {{)"
          >
            <Variable className="h-4 w-4" />
          </Button>
        </div>

        {/* Variable Picker Dropdown */}
        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-card border border-border rounded-xl shadow-xl max-h-96 overflow-hidden"
          >
            {/* Search Header */}
            <div className="p-3 border-b border-border bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for data..."
                  className="w-full pl-9 pr-9 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-1.5 p-2 border-b border-border overflow-x-auto">
              <Button
                type="button"
                variant={selectedCategory === null ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="h-7 text-xs shrink-0"
              >
                All
              </Button>
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                const hasItems = availableVariables.some((v) => v.category === key);
                if (!hasItems) return null;
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={selectedCategory === key ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(key)}
                    className={cn("h-7 text-xs shrink-0 gap-1.5", selectedCategory === key && config.color)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </Button>
                );
              })}
            </div>

            {/* Variables List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredVariables.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <p>No variables found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                Object.entries(groupedVariables).map(([category, variables]) => {
                  const config = categoryConfig[category as keyof typeof categoryConfig];
                  const Icon = config?.icon || Box;

                  return (
                    <div key={category}>
                      <div className={cn("px-3 py-2 text-xs font-medium flex items-center gap-2", config?.bgColor, config?.color)}>
                        <Icon className="h-3.5 w-3.5" />
                        {config?.label || category}
                      </div>
                      {variables.map((variable) => {
                        const globalIndex = filteredVariables.indexOf(variable);
                        return (
                          <button
                            key={variable.path}
                            onClick={() => insertVariable(variable)}
                            className={cn(
                              "w-full text-left px-4 py-2.5 hover:bg-muted/50 flex flex-col gap-0.5 transition-colors border-b border-border/30 last:border-0",
                              globalIndex === selectedIndex && "bg-primary/10"
                            )}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {variable.displayPath}
                              </span>
                              {variable.sourceLabel && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {variable.sourceLabel}
                                </span>
                              )}
                            </div>
                            {variable.description && (
                              <span className="text-xs text-muted-foreground">
                                {variable.description}
                              </span>
                            )}
                            <code className="text-[10px] text-primary/70 font-mono">
                              Example: {variable.example}
                            </code>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Help */}
            <div className="p-2 border-t border-border bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">↑↓</kbd>
                Navigate
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">Enter</kbd>
                Insert
              </span>
              <span className="text-muted-foreground/60">
                Type <code className="font-mono">{"{{"}</code> anywhere to open
              </span>
            </div>
          </div>
        )}

        {/* Helper text below input */}
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            Click <Variable className="h-3 w-3 inline mx-0.5" /> or type{" "}
            <code className="font-mono bg-muted px-1 rounded">{"{{"}</code> to insert dynamic data
          </p>
        </div>
      </div>
    </div>
  );
}
