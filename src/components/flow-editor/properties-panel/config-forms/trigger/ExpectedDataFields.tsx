"use client";

import { X, Plus, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps, ExpectedField } from "../../types";

export function ExpectedDataFields({ config, onChange }: ConfigComponentProps) {
  const expectedFields = (config.expectedFields as ExpectedField[]) || [];

  const addField = () => {
    const newFields = [...expectedFields, { name: "", type: "string", description: "" }];
    onChange({ ...config, expectedFields: newFields });
  };

  const updateField = (index: number, field: Partial<ExpectedField>) => {
    const newFields = expectedFields.map((f, i) => (i === index ? { ...f, ...field } : f));
    onChange({ ...config, expectedFields: newFields });
  };

  const removeField = (index: number) => {
    const newFields = expectedFields.filter((_, i) => i !== index);
    onChange({ ...config, expectedFields: newFields });
  };

  return (
    <div className="space-y-3">
      <FormField label="Expected Data Fields" tooltip="Define the fields you expect to receive in the webhook payload. This helps you see available variables in subsequent nodes.">
        <div className="space-y-2">
          {expectedFields.length === 0 ? (
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <p className="mb-2">No fields defined yet.</p>
              <p>Add fields to document what data your webhook expects. This makes it easier to use variables in subsequent nodes.</p>
            </div>
          ) : (
            expectedFields.map((field, index) => (
              <div key={index} className="p-2.5 bg-muted/30 rounded-md border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    placeholder="Field name (e.g., email)"
                    className="h-7 text-xs flex-1"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value })}
                    className="h-7 px-2 text-xs rounded-md border border-input bg-background"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="object">Object</option>
                    <option value="array">Array</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeField(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Input
                  value={field.description}
                  onChange={(e) => updateField(index, { description: e.target.value })}
                  placeholder="Description (optional)"
                  className="h-6 text-[10px]"
                />
              </div>
            ))
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={addField}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Expected Field
          </Button>
        </div>
      </FormField>

      {/* Show available variables based on defined fields */}
      {expectedFields.length > 0 && (
        <div className="text-xs bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-700 dark:text-blue-300">Available Variables:</span>
          </div>
          <div className="space-y-1.5">
            {expectedFields.map((field) => (
              <div key={field.name} className="flex items-start gap-2">
                <code className="font-mono bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                  {`{{$trigger.data.${field.name || "fieldName"}}}`}
                </code>
                <span className="text-blue-600/70 dark:text-blue-400/70 text-[10px]">
                  ({field.type}){field.description ? ` - ${field.description}` : ""}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-blue-600/60 dark:text-blue-400/60 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
            Use these variables in any text field in subsequent nodes by clicking the variable picker button.
          </p>
        </div>
      )}

      {/* Example payload */}
      {expectedFields.length > 0 && (
        <div className="text-xs bg-muted/50 p-3 rounded-md space-y-2">
          <p className="font-medium text-muted-foreground">Example JSON Payload:</p>
          <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-x-auto">
{JSON.stringify(
  expectedFields.reduce((acc, field) => {
    let exampleValue: string | number | boolean | object | unknown[];
    switch (field.type) {
      case "number": exampleValue = 123; break;
      case "boolean": exampleValue = true; break;
      case "object": exampleValue = {}; break;
      case "array": exampleValue = []; break;
      default: exampleValue = "example value";
    }
    return { ...acc, [field.name || "fieldName"]: exampleValue };
  }, {}),
  null,
  2
)}
          </pre>
        </div>
      )}
    </div>
  );
}
