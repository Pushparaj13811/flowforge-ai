"use client";

import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps, SwitchCase } from "../../types";

export function SwitchConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  const cases = (config.cases as SwitchCase[]) || [];

  const addCase = () => {
    const newCases = [...cases, { value: "", label: `Case ${cases.length + 1}` }];
    onChange({ ...config, cases: newCases });
  };

  const updateCase = (index: number, field: Partial<SwitchCase>) => {
    const newCases = cases.map((c, i) => (i === index ? { ...c, ...field } : c));
    onChange({ ...config, cases: newCases });
  };

  const removeCase = (index: number) => {
    const newCases = cases.filter((_, i) => i !== index);
    onChange({ ...config, cases: newCases });
  };

  return (
    <>
      <FormField label="Value to Check" required tooltip="The variable to compare against each case">
        <VariableInput
          value={(config.switchValue as string) || ""}
          onChange={(val) => onChange({ ...config, switchValue: val })}
          placeholder="{{$trigger.data.status}}"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Cases" tooltip="Define the values to match and their output branches">
        <div className="space-y-2">
          {cases.map((caseItem, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border">
              <Input
                value={caseItem.value}
                onChange={(e) => updateCase(index, { value: e.target.value })}
                placeholder="Value to match"
                className="h-7 text-xs flex-1"
              />
              <Input
                value={caseItem.label}
                onChange={(e) => updateCase(index, { label: e.target.value })}
                placeholder="Output label"
                className="h-7 text-xs flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeCase(index)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={addCase}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Case
          </Button>
        </div>
      </FormField>
      <FormField label="Default Output" hint="When no case matches">
        <Input
          value={(config.defaultLabel as string) || "default"}
          onChange={(e) => onChange({ ...config, defaultLabel: e.target.value })}
          placeholder="default"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
