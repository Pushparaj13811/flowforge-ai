"use client";

import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function ConditionConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  const operator = (config.operator as string) || "equals";
  const isUnary = operator === "is_empty" || operator === "is_not_empty";

  return (
    <>
      <FormField
        label="Field to Check"
        required
        tooltip="The value to evaluate. Use the variable picker to select data from the trigger or previous steps."
      >
        <VariableInput
          value={(config.field as string) || ""}
          onChange={(val) => onChange({ ...config, field: val })}
          placeholder="{{$trigger.data.amount}}"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>

      <FormField label="Condition" required tooltip="How to compare the field value">
        <select
          value={operator}
          onChange={(e) => onChange({ ...config, operator: e.target.value })}
          className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <optgroup label="Comparison">
            <option value="equals">Equals (==)</option>
            <option value="not_equals">Not Equals (!=)</option>
            <option value="greater_than">Greater Than (&gt;)</option>
            <option value="greater_than_or_equal">Greater or Equal (&gt;=)</option>
            <option value="less_than">Less Than (&lt;)</option>
            <option value="less_than_or_equal">Less or Equal (&lt;=)</option>
          </optgroup>
          <optgroup label="Text">
            <option value="contains">Contains</option>
            <option value="starts_with">Starts With</option>
            <option value="ends_with">Ends With</option>
          </optgroup>
          <optgroup label="Existence">
            <option value="is_empty">Is Empty</option>
            <option value="is_not_empty">Is Not Empty</option>
          </optgroup>
        </select>
      </FormField>

      {!isUnary && (
        <FormField
          label="Compare With"
          required
          tooltip="The value to compare against. Can be a static value or a variable from trigger/previous steps."
        >
          <VariableInput
            value={(config.value as string) || ""}
            onChange={(val) => onChange({ ...config, value: val })}
            placeholder="100 or {{$trigger.data.threshold}}"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      <div className="p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <p className="font-medium mb-1">How it works</p>
        <p>
          If the condition is <span className="font-medium text-emerald-600">true</span>, the workflow follows the <span className="font-medium">Yes</span> branch.
          If <span className="font-medium text-red-500">false</span>, it follows the <span className="font-medium">No</span> branch.
        </p>
      </div>
    </>
  );
}
