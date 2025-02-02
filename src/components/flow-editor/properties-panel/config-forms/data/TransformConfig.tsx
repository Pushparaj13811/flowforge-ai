"use client";

import { Input } from "@/components/ui/input";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function TransformConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <FormField label="Transform Type" required>
        <select
          value={(config.transformType as string) || "extract"}
          onChange={(e) => onChange({ ...config, transformType: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <option value="extract">Extract Fields</option>
          <option value="map">Map/Rename Fields</option>
          <option value="merge">Merge Objects</option>
          <option value="template">Text Template</option>
          <option value="json">Parse/Stringify JSON</option>
        </select>
      </FormField>
      {config.transformType === "extract" && (
        <FormField label="Fields to Extract" required tooltip="Comma-separated field names">
          <Input
            value={(config.fields as string) || ""}
            onChange={(e) => onChange({ ...config, fields: e.target.value })}
            placeholder="name, email, phone"
            className="h-8 text-sm"
          />
        </FormField>
      )}
      {config.transformType === "template" && (
        <FormField label="Template" required tooltip="Use {{variables}} for dynamic values">
          <VariableInput
            value={(config.template as string) || ""}
            onChange={(val) => onChange({ ...config, template: val })}
            placeholder="Hello {{$trigger.data.name}}, your order #{{$trigger.data.orderId}} is ready."
            multiline={true}
            nodeId={nodeId}
          />
        </FormField>
      )}
      {config.transformType === "map" && (
        <FormField label="Field Mapping" required tooltip="JSON object mapping old names to new names">
          <VariableInput
            value={(config.mapping as string) || "{}"}
            onChange={(val) => onChange({ ...config, mapping: val })}
            placeholder='{"oldName": "newName", "email": "userEmail"}'
            multiline={true}
            nodeId={nodeId}
          />
        </FormField>
      )}
      <FormField label="Input Data" required>
        <VariableInput
          value={(config.input as string) || ""}
          onChange={(val) => onChange({ ...config, input: val })}
          placeholder="{{$trigger.data}}"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
    </>
  );
}
