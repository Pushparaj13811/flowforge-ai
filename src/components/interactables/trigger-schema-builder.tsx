"use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook,
  Plus,
  X,
  Sparkles,
  Code,
  Copy,
  Check,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Schema for a trigger field
 */
const triggerFieldSchema = z.object({
  id: z.string().describe("Unique identifier for the field"),
  name: z.string().describe("Field name"),
  type: z.enum(["string", "number", "boolean", "email", "url", "phone", "date", "object", "array"])
    .describe("Data type"),
  description: z.string().optional().describe("Description"),
  required: z.boolean().default(true).describe("Is required"),
  example: z.string().optional().describe("Example value"),
});

/**
 * Schema for TriggerSchemaBuilder props
 */
export const triggerSchemaBuilderSchema = z.object({
  triggerId: z.string().default("trigger-1").describe("Trigger node ID"),
  triggerType: z.enum(["webhook", "form", "schedule", "manual"]).default("webhook")
    .describe("Type of trigger"),
  fields: z.array(triggerFieldSchema).default([]).describe("Defined fields"),
  showSuggestions: z.boolean().default(true).describe("Show common field suggestions"),
  showPreview: z.boolean().default(true).describe("Show variable preview"),
});

type TriggerSchemaBuilderProps = z.infer<typeof triggerSchemaBuilderSchema>;
type TriggerField = z.infer<typeof triggerFieldSchema>;

/**
 * Common field suggestions
 */
const FIELD_SUGGESTIONS = [
  { name: "email", type: "email", description: "Email address", icon: "✉️" },
  { name: "name", type: "string", description: "Full name", icon: "👤" },
  { name: "phone", type: "phone", description: "Phone number", icon: "📱" },
  { name: "amount", type: "number", description: "Numeric amount", icon: "💰" },
  { name: "orderId", type: "string", description: "Order identifier", icon: "🛒" },
  { name: "status", type: "string", description: "Status value", icon: "📊" },
  { name: "message", type: "string", description: "Text message", icon: "💬" },
  { name: "timestamp", type: "date", description: "Date/time", icon: "📅" },
];

/**
 * Type options with icons
 */
const TYPE_OPTIONS = [
  { value: "string", label: "Text", icon: "Aa" },
  { value: "number", label: "Number", icon: "#" },
  { value: "boolean", label: "Yes/No", icon: "✓" },
  { value: "email", label: "Email", icon: "@" },
  { value: "url", label: "URL", icon: "🔗" },
  { value: "phone", label: "Phone", icon: "📞" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "object", label: "Object", icon: "{}" },
  { value: "array", label: "Array", icon: "[]" },
];

/**
 * Base TriggerSchemaBuilder component
 */
function TriggerSchemaBuilderBase(props: TriggerSchemaBuilderProps) {
  // Ensure fields is always an array
  const initialConfig = {
    ...props,
    fields: props.fields || [],
    triggerId: props.triggerId || "trigger-1",
    triggerType: props.triggerType || "webhook",
    showSuggestions: props.showSuggestions ?? true,
    showPreview: props.showPreview ?? true,
  };
  const [config, setConfig] = useState<TriggerSchemaBuilderProps>(initialConfig);
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const prevPropsRef = useRef<TriggerSchemaBuilderProps>(initialConfig);

  // Update state when props change
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    const changedFieldIds = new Set<string>();

    const currentFields = config.fields || [];
    const newFields = props.fields || [];

    // Check for changes (with null safety for field properties)
    if (newFields.length !== currentFields.length) {
      newFields.forEach((f) => {
        if (f && f.id) changedFieldIds.add(f.id);
      });
    } else {
      newFields.forEach((field, idx) => {
        if (!field) return;
        const prev = currentFields[idx];
        if (!prev || field.name !== prev?.name || field.type !== prev?.type) {
          if (field.id) changedFieldIds.add(field.id);
        }
      });
    }

    if (changedFieldIds.size > 0 || props.triggerId !== prevProps.triggerId) {
      setConfig(props);
      setUpdatedFields(changedFieldIds);
      prevPropsRef.current = props;

      const timer = setTimeout(() => setUpdatedFields(new Set()), 1000);
      return () => clearTimeout(timer);
    }
  }, [props, config.fields]);

  const handleAddField = (suggestion?: typeof FIELD_SUGGESTIONS[0]) => {
    const newField: TriggerField = {
      id: `field-${Date.now()}`,
      name: suggestion?.name || "",
      type: (suggestion?.type as TriggerField["type"]) || "string",
      description: suggestion?.description || "",
      required: true,
    };
    setConfig((prev) => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }));
  };

  const handleFieldChange = (fieldId: string, updates: Partial<TriggerField>) => {
    setConfig((prev) => ({
      ...prev,
      fields: (prev.fields || []).map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    }));
  };

  const handleRemoveField = (fieldId: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: (prev.fields || []).filter((f) => f.id !== fieldId),
    }));
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(`{{${path}}}`);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Get used field names (ensure fields is always an array and names are defined)
  const fields = config.fields || [];
  const usedNames = new Set(
    fields
      .filter((f) => f && f.name) // Filter out undefined/null fields or fields without names
      .map((f) => f.name.toLowerCase())
  );
  const availableSuggestions = FIELD_SUGGESTIONS.filter(
    (s) => !usedNames.has(s.name.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass border border-glass-border rounded-xl p-6 max-w-3xl shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-flow-orange/10 flex items-center justify-center border border-flow-orange/20">
          <Webhook className="h-5 w-5 text-flow-orange" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">Trigger Data Schema</h3>
          <p className="text-xs text-muted-foreground">
            Define what data your {config.triggerType} will receive
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-flow-orange/10 text-flow-orange text-xs font-medium">
          {config.triggerType}
        </div>
      </div>

      {/* Field Suggestions */}
      {config.showSuggestions && availableSuggestions.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-flow-yellow" />
            <span className="text-xs font-medium text-foreground">Common fields</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion.name}
                onClick={() => handleAddField(suggestion)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border hover:border-flow-purple/50 hover:bg-flow-purple/5 transition-colors text-xs"
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fields List */}
      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "p-4 rounded-lg border transition-all duration-200",
                updatedFields.has(field.id)
                  ? "bg-flow-green/5 border-flow-green animate-pulse"
                  : "bg-background/50 border-border"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Field Number */}
                <div className="h-6 w-6 rounded-full bg-flow-orange/10 flex items-center justify-center shrink-0 mt-2">
                  <span className="text-xs font-medium text-flow-orange">{index + 1}</span>
                </div>

                {/* Field Inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Field Name
                    </label>
                    <input
                      type="text"
                      value={field.name ?? ""}
                      onChange={(e) => handleFieldChange(field.id, { name: e.target.value })}
                      placeholder="fieldName"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-flow-orange/50"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Type
                    </label>
                    <select
                      value={field.type ?? "string"}
                      onChange={(e) => handleFieldChange(field.id, { type: e.target.value as TriggerField["type"] })}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-flow-orange/50"
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={field.description || ""}
                      onChange={(e) => handleFieldChange(field.id, { description: e.target.value })}
                      placeholder="Optional description"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-flow-orange/50"
                    />
                  </div>

                  {/* Required Toggle */}
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required ?? true}
                        onChange={(e) => handleFieldChange(field.id, { required: e.target.checked })}
                        className="rounded border-border"
                      />
                      <span className="text-xs text-muted-foreground">Required</span>
                    </label>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveField(field.id)}
                  className="h-8 w-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive transition-colors shrink-0 mt-6"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Variable Preview */}
              {field.name && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Variable:</span>
                  <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">
                    {"{{$trigger.data." + field.name + "}}"}
                  </code>
                  <button
                    onClick={() => handleCopyPath(`$trigger.data.${field.name}`)}
                    className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    {copiedPath === `$trigger.data.${field.name}` ? (
                      <Check className="h-3 w-3 text-flow-green" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Field Button */}
      <button
        onClick={() => handleAddField()}
        className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-flow-orange/50 hover:bg-flow-orange/5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-flow-orange transition-all"
      >
        <Plus className="h-4 w-4" />
        Add Field
      </button>

      {/* Variable Preview Section */}
      {config.showPreview && fields.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-flow-blue" />
            <span className="text-sm font-medium text-foreground">Available Variables</span>
          </div>
          <div className="space-y-1.5">
            {fields.filter((f) => f.name).map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-2 rounded bg-background"
              >
                <div className="flex items-center gap-2">
                  <code className="px-2 py-0.5 rounded bg-flow-blue/10 text-flow-blue text-xs font-mono">
                    {"{{$trigger.data." + field.name + "}}"}
                  </code>
                  <span className="text-xs text-muted-foreground">{field.type}</span>
                </div>
                <button
                  onClick={() => handleCopyPath(`$trigger.data.${field.name}`)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {copiedPath === `$trigger.data.${field.name}` ? (
                    <>
                      <Check className="h-3 w-3 text-flow-green" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-flow-orange" />
            <span>
              {fields.length} field{fields.length !== 1 ? "s" : ""} defined
            </span>
          </div>
          <span className="font-mono">{config.triggerId}</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Wrapped interactable component
 */
export const TriggerSchemaBuilder = withInteractable(TriggerSchemaBuilderBase, {
  componentName: "TriggerSchemaBuilder",
  description: `Interactive component for defining trigger data schemas.

Use this when:
- Setting up a webhook trigger and user needs to define expected fields
- Creating a form trigger with specific field requirements
- Documenting what data the trigger will receive
- Making variables available for downstream workflow nodes

Features:
- Add/remove fields with name, type, and description
- Quick-add common fields (email, name, phone, amount, etc.)
- Shows variable path preview ({{$trigger.data.fieldName}})
- Copy variable paths to clipboard
- Mark fields as required or optional
- Supports multiple data types (string, number, email, etc.)`,
  propsSchema: triggerSchemaBuilderSchema,
});
