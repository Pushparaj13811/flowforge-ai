"use client";

import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

const methodColors: Record<string, string> = {
  GET: "text-emerald-600",
  POST: "text-blue-600",
  PUT: "text-amber-600",
  PATCH: "text-orange-600",
  DELETE: "text-red-600",
};

export function WebhookConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  const method = (config.method as string) || "POST";
  const showBody = method !== "GET" && method !== "DELETE";

  return (
    <>
      <FormField label="URL" required tooltip="The API endpoint to call. Variables will be resolved at execution time.">
        <VariableInput
          value={(config.url as string) || ""}
          onChange={(val) => onChange({ ...config, url: val })}
          placeholder="https://api.example.com/endpoint"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>

      <FormField label="Method" tooltip="HTTP method to use for the request">
        <div className="flex gap-1.5">
          {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ ...config, method: m })}
              className={`flex-1 h-8 text-xs font-medium rounded-md border transition-all ${
                method === m
                  ? `${methodColors[m]} border-current bg-current/5 shadow-sm`
                  : "text-muted-foreground border-border hover:border-muted-foreground/30"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </FormField>

      <FormField
        label="Headers"
        hint="Optional - JSON format"
        tooltip="Custom HTTP headers. Use variables for dynamic values like API keys."
      >
        <VariableInput
          value={(config.headers as string) || ""}
          onChange={(val) => onChange({ ...config, headers: val })}
          placeholder='{"Authorization": "Bearer {{$env.API_KEY}}"}'
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>

      {showBody && (
        <FormField
          label="Request Body"
          hint="JSON format"
          tooltip="The data to send with the request. Use variables to include dynamic data from triggers or previous steps."
        >
          <VariableInput
            value={(config.body as string) || ""}
            onChange={(val) => onChange({ ...config, body: val })}
            placeholder='{"email": "{{$trigger.data.email}}", "name": "{{$trigger.data.name}}"}'
            multiline={true}
            nodeId={nodeId}
          />
        </FormField>
      )}

      <FormField label="Timeout" hint="Optional" tooltip="Maximum time to wait for a response in milliseconds">
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={(config.timeout as number) || 30000}
            onChange={(e) => onChange({ ...config, timeout: parseInt(e.target.value) || 30000 })}
            min={1000}
            max={120000}
            step={1000}
            className="h-8 w-24 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
          />
          <span className="text-xs text-muted-foreground">ms ({((config.timeout as number) || 30000) / 1000}s)</span>
        </div>
      </FormField>
    </>
  );
}
