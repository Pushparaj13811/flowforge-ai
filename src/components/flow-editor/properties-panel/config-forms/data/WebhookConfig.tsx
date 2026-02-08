"use client";

import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function WebhookConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <FormField label="URL" required tooltip="Enter the API endpoint URL. Use variables to include dynamic data in the URL.">
        <VariableInput
          value={(config.url as string) || ""}
          onChange={(val) => onChange({ ...config, url: val })}
          placeholder="https://api.example.com/{{$trigger.data.id}}"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Method">
        <select
          value={(config.method as string) || "POST"}
          onChange={(e) => onChange({ ...config, method: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </FormField>
      <FormField label="Headers" hint="JSON format" tooltip="Enter custom headers in JSON format. You can use variables inside strings.">
        <VariableInput
          value={(config.headers as string) || "{}"}
          onChange={(val) => onChange({ ...config, headers: val })}
          placeholder='{"Authorization": "Bearer {{$env.API_KEY}}"}'
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Body" hint="JSON format" tooltip="Enter the request body in JSON format. Use variables to include dynamic data.">
        <VariableInput
          value={(config.body as string) || "{}"}
          onChange={(val) => onChange({ ...config, body: val })}
          placeholder='{"email": "{{$trigger.data.email}}"}'
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
    </>
  );
}
