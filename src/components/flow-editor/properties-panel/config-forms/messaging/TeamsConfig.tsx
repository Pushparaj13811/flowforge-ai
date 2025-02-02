"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function TeamsConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="teams"
        label="Teams Integration"
        required
      />
      <FormField label="Message" required tooltip="The message to post to Teams. Supports basic markdown.">
        <VariableInput
          value={(config.message as string) || ""}
          onChange={(val) => onChange({ ...config, message: val })}
          placeholder="Enter your message..."
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Title" hint="Optional">
        <Input
          value={(config.title as string) || ""}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder="Message Title"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
