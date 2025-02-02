"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function ClaudeConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="anthropic"
        label="Anthropic Integration"
        required
      />
      <FormField label="Model">
        <select
          value={(config.model as string) || "claude-3-5-sonnet-20241022"}
          onChange={(e) => onChange({ ...config, model: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <option value="claude-sonnet-4-5-20250929">Claude 4.5 Sonnet (Latest)</option>
          <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
          <option value="claude-3-opus-20240229">Claude 3 Opus</option>
          <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
        </select>
      </FormField>
      <FormField label="System Prompt" hint="Optional">
        <VariableInput
          value={(config.systemPrompt as string) || ""}
          onChange={(val) => onChange({ ...config, systemPrompt: val })}
          placeholder="You are a helpful assistant..."
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="User Message" required>
        <VariableInput
          value={(config.userMessage as string) || ""}
          onChange={(val) => onChange({ ...config, userMessage: val })}
          placeholder="{{$trigger.data.question}}"
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Max Tokens" hint="Optional">
        <Input
          type="number"
          value={(config.maxTokens as number) || ""}
          onChange={(e) => onChange({ ...config, maxTokens: parseInt(e.target.value) || undefined })}
          placeholder="1024"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
