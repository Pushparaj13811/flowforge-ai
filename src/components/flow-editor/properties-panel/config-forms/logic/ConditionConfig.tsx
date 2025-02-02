"use client";

import { Input } from "@/components/ui/input";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function ConditionConfig({ config, onChange }: ConfigComponentProps) {
  return (
    <>
      <FormField label="Field" required hint="Variable to check" tooltip="Select a variable to compare. Click the variable button to see available data from your trigger and previous nodes.">
        <VariableInput
          value={(config.field as string) || ""}
          onChange={(val) => onChange({ ...config, field: val })}
          placeholder="Click the variable button to select a field..."
          multiline={false}
          nodeId={undefined}
        />
      </FormField>
      <FormField label="Operator" required tooltip="The comparison operation to perform between the field and value">
        <select
          value={(config.operator as string) || "equals"}
          onChange={(e) => onChange({ ...config, operator: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <option value="equals">Equals (==)</option>
          <option value="not_equals">Not Equals (!=)</option>
          <option value="greater_than">Greater Than (&gt;)</option>
          <option value="greater_than_or_equal">Greater or Equal (&gt;=)</option>
          <option value="less_than">Less Than (&lt;)</option>
          <option value="less_than_or_equal">Less or Equal (&lt;=)</option>
          <option value="contains">Contains</option>
          <option value="starts_with">Starts With</option>
          <option value="ends_with">Ends With</option>
          <option value="is_empty">Is Empty</option>
          <option value="is_not_empty">Is Not Empty</option>
        </select>
      </FormField>
      <FormField label="Value" required>
        <Input
          value={(config.value as string) || ""}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
          placeholder="1000"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
