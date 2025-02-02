"use client";

import { Input } from "@/components/ui/input";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function FilterConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <FormField label="Array to Filter" required tooltip="The array to filter items from">
        <VariableInput
          value={(config.array as string) || ""}
          onChange={(val) => onChange({ ...config, array: val })}
          placeholder="{{$trigger.data.items}}"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Filter Field" required tooltip="The field in each item to check">
        <Input
          value={(config.field as string) || ""}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
          placeholder="status"
          className="h-8 text-sm"
        />
      </FormField>
      <FormField label="Operator" required>
        <select
          value={(config.operator as string) || "eq"}
          onChange={(e) => onChange({ ...config, operator: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <option value="eq">Equals</option>
          <option value="ne">Not Equals</option>
          <option value="gt">Greater Than</option>
          <option value="gte">Greater or Equal</option>
          <option value="lt">Less Than</option>
          <option value="lte">Less or Equal</option>
          <option value="contains">Contains</option>
          <option value="exists">Exists (not null)</option>
        </select>
      </FormField>
      <FormField label="Value" tooltip="The value to compare against">
        <Input
          value={(config.filterValue as string) || ""}
          onChange={(e) => onChange({ ...config, filterValue: e.target.value })}
          placeholder="active"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
