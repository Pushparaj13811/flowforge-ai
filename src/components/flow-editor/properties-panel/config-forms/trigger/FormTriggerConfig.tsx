"use client";

import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps, FormFieldInfo } from "../../types";

export function FormTriggerConfig({ config, onChange }: ConfigComponentProps) {
  const formFields = (config.formFields as FormFieldInfo[]) || [];

  const addField = () => {
    const newFields = [...formFields, { name: "", type: "text", required: false }];
    onChange({ ...config, formFields: newFields });
  };

  const updateField = (index: number, field: Partial<FormFieldInfo>) => {
    const newFields = formFields.map((f, i) => (i === index ? { ...f, ...field } : f));
    onChange({ ...config, formFields: newFields });
  };

  const removeField = (index: number) => {
    const newFields = formFields.filter((_, i) => i !== index);
    onChange({ ...config, formFields: newFields });
  };

  return (
    <>
      <FormField label="Form Fields" tooltip="Define the fields your form will accept. These will be available as variables in subsequent nodes.">
        <div className="space-y-2">
          {formFields.length === 0 ? (
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              No fields defined yet. Add fields to specify what data your form will collect.
            </div>
          ) : (
            formFields.map((field, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border">
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
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                  <option value="textarea">Long Text</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="h-3 w-3"
                  />
                  Required
                </label>
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
            Add Field
          </Button>
        </div>
      </FormField>

      {formFields.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md space-y-2">
          <p className="font-medium">Available Variables:</p>
          <div className="space-y-1">
            {formFields.map((field) => (
              <div key={field.name} className="flex items-center gap-2">
                <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary">
                  {`{{$trigger.data.${field.name || "fieldName"}}}`}
                </code>
                <span className="text-muted-foreground/70">({field.type})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
