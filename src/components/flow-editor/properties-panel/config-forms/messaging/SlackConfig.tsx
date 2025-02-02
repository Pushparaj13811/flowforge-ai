"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function SlackConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="slack"
        label="Slack Integration"
        required
      />
      <FormField label="Channel" required hint="e.g., #general" tooltip="Enter a channel name starting with # for public channels, or @username for direct messages. You can also use variables.">
        <VariableInput
          value={(config.channel as string) || ""}
          onChange={(val) => onChange({ ...config, channel: val })}
          placeholder="#channel or {{$trigger.data.channel}}"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Message" required tooltip="Use {{variables}} to include dynamic data from the trigger or previous nodes">
        <VariableInput
          value={(config.message as string) || ""}
          onChange={(val) => onChange({ ...config, message: val })}
          placeholder="Enter your message..."
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Bot Name" hint="Optional">
        <Input
          value={(config.botName as string) || ""}
          onChange={(e) => onChange({ ...config, botName: e.target.value })}
          placeholder="FlowForge Bot"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
