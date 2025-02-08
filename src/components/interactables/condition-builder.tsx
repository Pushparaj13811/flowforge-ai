"use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Plus,
  X,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewBanner } from "@/components/ui/preview-banner";

/**
 * Schema for a single condition rule
 */
const conditionRuleSchema = z.object({
  id: z.string().describe("Unique identifier for the rule"),
  field: z.string().describe("Field name to check (e.g., amount, status, email)"),
  operator: z.enum(["equals", "not_equals", "greater_than", "greater_than_or_equal", "less_than", "less_than_or_equal", "contains", "starts_with", "ends_with", "is_empty", "is_not_empty"]).describe("Comparison operator"),
  value: z.string().describe("Value to compare against"),
});

/**
 * Schema for ConditionBuilder props
 */
export const conditionBuilderSchema = z.object({
  nodeId: z.string().default("condition-1").describe("Unique identifier for the condition node"),
  conditions: z.array(conditionRuleSchema).default([]).describe("Array of condition rules to evaluate"),
  logicOperator: z.enum(["AND", "OR"]).default("AND").describe("How to combine multiple conditions (AND = all must pass, OR = any must pass)"),

  // Preview
  showPreview: z.boolean().optional().describe("Whether to show condition preview"),
  previewResult: z.boolean().optional().describe("Result of preview evaluation (true/false)"),

  // Available fields (optional - for field suggestions)
  availableFields: z.array(z.object({
    name: z.string(),
    type: z.enum(["string", "number", "boolean"]),
    source: z.string().optional(),
  })).optional().describe("List of fields available from previous workflow nodes"),
});

type ConditionBuilderProps = z.infer<typeof conditionBuilderSchema>;
type ConditionRule = z.infer<typeof conditionRuleSchema>;

/**
 * Operator display names
 */
const operatorLabels: Record<string, string> = {
  equals: "equals",
  not_equals: "not equals",
  greater_than: "greater than",
  greater_than_or_equal: "greater or equal",
  less_than: "less than",
  less_than_or_equal: "less or equal",
  contains: "contains",
  starts_with: "starts with",
  ends_with: "ends with",
  is_empty: "is empty",
  is_not_empty: "is not empty",
};

/**
 * Base ConditionBuilder component
 */
function ConditionBuilderBase(props: ConditionBuilderProps) {
  const [config, setConfig] = useState<ConditionBuilderProps>(props);
  const [updatedRules, setUpdatedRules] = useState<Set<string>>(new Set());
  const prevPropsRef = useRef<ConditionBuilderProps>(props);

  // Update state when props change (AI updates)
  useEffect(() => {
    const prevProps = prevPropsRef.current;

    // Check which rules changed
    const changedRuleIds = new Set<string>();

    const currentConditions = config.conditions || [];
    const prevConditions = prevProps.conditions || [];

    if (currentConditions.length !== prevConditions.length) {
      // Rules added or removed - highlight all
      currentConditions.forEach(rule => changedRuleIds.add(rule.id));
    } else {
      // Check each rule for changes
      currentConditions.forEach((rule, index) => {
        const prevRule = prevConditions[index];
        if (prevRule && (
          rule.field !== prevRule.field ||
          rule.operator !== prevRule.operator ||
          rule.value !== prevRule.value
        )) {
          changedRuleIds.add(rule.id);
        }
      });
    }

    if (changedRuleIds.size > 0 || props.logicOperator !== prevProps.logicOperator) {
      setConfig(props);
      setUpdatedRules(changedRuleIds);
      prevPropsRef.current = props;

      // Clear highlights after animation
      const timer = setTimeout(() => {
        setUpdatedRules(new Set());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [props, config.conditions]);

  const handleChange = (updates: Partial<ConditionBuilderProps>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleRuleChange = (ruleId: string, updates: Partial<ConditionRule>) => {
    setConfig((prev) => ({
      ...prev,
      conditions: prev.conditions.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    }));
  };

  const handleAddRule = () => {
    const newRule: ConditionRule = {
      id: `rule-${Date.now()}`,
      field: "",
      operator: "equals",
      value: "",
    };
    setConfig((prev) => ({
      ...prev,
      conditions: [...prev.conditions, newRule],
    }));
  };

  const handleRemoveRule = (ruleId: string) => {
    setConfig((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((rule) => rule.id !== ruleId),
    }));
  };

  return (
    <>
      {/* Preview Banner - Shows this is a demo */}
      <PreviewBanner
        componentName="condition builder"
        onCreateWorkflow={() => {
          // Trigger suggestion to create workflow
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('suggest-create-workflow', {
              detail: { feature: 'conditions' }
            });
            window.dispatchEvent(event);
          }
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass border border-glass-border rounded-xl p-6 max-w-3xl shadow-lg"
      >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-flow-purple/10 flex items-center justify-center border border-flow-purple/20">
          <GitBranch className="h-5 w-5 text-flow-purple" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">Condition Logic</h3>
          <p className="text-xs text-muted-foreground">
            Define rules to branch your workflow
          </p>
        </div>
        {/* Logic Operator Toggle */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted border border-border">
          <button
            onClick={() => handleChange({ logicOperator: "AND" })}
            className={cn(
              "px-3 py-1 rounded text-xs font-medium transition-all",
              config.logicOperator === "AND"
                ? "bg-flow-purple text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            AND
          </button>
          <button
            onClick={() => handleChange({ logicOperator: "OR" })}
            className={cn(
              "px-3 py-1 rounded text-xs font-medium transition-all",
              config.logicOperator === "OR"
                ? "bg-flow-purple text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            OR
          </button>
        </div>
      </div>

      {/* Logic Operator Explanation */}
      <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
        <p className="text-xs text-muted-foreground">
          {config.logicOperator === "AND" ? (
            <>
              <strong className="text-foreground">AND</strong>: All conditions must be true for the workflow to continue
            </>
          ) : (
            <>
              <strong className="text-foreground">OR</strong>: At least one condition must be true for the workflow to continue
            </>
          )}
        </p>
      </div>

      {/* Condition Rules */}
      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {(config.conditions || []).map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "p-4 rounded-lg border transition-all duration-200",
                updatedRules.has(rule.id)
                  ? "bg-flow-green/5 border-flow-green animate-pulse"
                  : "bg-background/50 border-border hover:border-border/80"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Rule Number */}
                <div className="h-6 w-6 rounded-full bg-flow-purple/10 flex items-center justify-center shrink-0 mt-2">
                  <span className="text-xs font-medium text-flow-purple">{index + 1}</span>
                </div>

                {/* Rule Inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Field */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Field
                    </label>
                    <input
                      type="text"
                      value={rule.field}
                      onChange={(e) => handleRuleChange(rule.id, { field: e.target.value })}
                      placeholder="e.g., amount"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-flow-purple/50"
                    />
                  </div>

                  {/* Operator */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Operator
                    </label>
                    <select
                      value={rule.operator}
                      onChange={(e) => handleRuleChange(rule.id, { operator: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-flow-purple/50"
                    >
                      {Object.entries(operatorLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                      placeholder="e.g., 100"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-flow-purple/50"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                {config.conditions.length > 1 && (
                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    className="h-8 w-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive transition-colors shrink-0 mt-6"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Rule Preview */}
              <div className="mt-2 text-xs text-muted-foreground">
                If <code className="px-1.5 py-0.5 rounded bg-muted font-mono">{rule.field || "field"}</code>{" "}
                <span className="font-medium">{operatorLabels[rule.operator]}</span>{" "}
                <code className="px-1.5 py-0.5 rounded bg-muted font-mono">{rule.value || "value"}</code>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Rule Button */}
      <button
        onClick={handleAddRule}
        className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-flow-purple/50 hover:bg-flow-purple/5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-flow-purple transition-all"
      >
        <Plus className="h-4 w-4" />
        Add Condition
      </button>

      {/* Preview Result */}
      {config.showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-4 p-4 rounded-lg border-2 flex items-center gap-3",
            config.previewResult
              ? "bg-flow-green/10 border-flow-green/30"
              : "bg-destructive/10 border-destructive/30"
          )}
        >
          {config.previewResult ? (
            <>
              <div className="h-8 w-8 rounded-full bg-flow-green flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-flow-green">Condition passed</p>
                <p className="text-xs text-muted-foreground">Workflow will continue on the "Yes" path</p>
              </div>
            </>
          ) : (
            <>
              <div className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">Condition failed</p>
                <p className="text-xs text-muted-foreground">Workflow will continue on the "No" path</p>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-flow-purple" />
            <span>
              {config.conditions.length} condition{config.conditions.length !== 1 ? "s" : ""} ({config.logicOperator})
            </span>
          </div>
          <span className="font-mono">{config.nodeId}</span>
        </div>
      </div>
    </motion.div>
    </>
  );
}

/**
 * Wrapped interactable component
 */
export const ConditionBuilder = withInteractable(ConditionBuilderBase, {
  componentName: "ConditionBuilder",
  description: "Interactive condition builder for workflow branching logic",
  propsSchema: conditionBuilderSchema,
});
