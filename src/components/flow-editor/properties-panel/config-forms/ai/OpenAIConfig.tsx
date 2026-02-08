"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function OpenAIConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="openai"
        label="OpenAI Integration"
        required
      />
      <FormField label="Model">
        <select
          value={(config.model as string) || "gpt-4"}
          onChange={(e) => onChange({ ...config, model: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <option value="gpt-4o">GPT-4o (Recommended)</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </FormField>
      <FormField label="System Prompt" hint="Optional" tooltip="Instructions for how the AI should behave">
        <VariableInput
          value={(config.systemPrompt as string) || ""}
          onChange={(val) => onChange({ ...config, systemPrompt: val })}
          placeholder="You are a helpful assistant..."
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="User Message" required tooltip="The message/prompt to send to the AI">
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
