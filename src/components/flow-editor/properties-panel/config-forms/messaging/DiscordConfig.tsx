"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function DiscordConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="discord"
        label="Discord Integration"
        hint="Select a saved Discord webhook, or enter URL below"
      />

      {!config.integrationId && (
        <FormField
          label="Webhook URL"
          required
          tooltip="Create a webhook in your Discord server: Server Settings > Integrations > Webhooks > New Webhook"
        >
          <VariableInput
            value={(config.webhookUrl as string) || ""}
            onChange={(val) => onChange({ ...config, webhookUrl: val })}
            placeholder="https://discord.com/api/webhooks/..."
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      <FormField label="Message" required tooltip="The message to send to the Discord channel. Supports variables.">
        <VariableInput
          value={(config.message as string) || (config.content as string) || ""}
          onChange={(val) => onChange({ ...config, message: val, content: val })}
          placeholder="New event: {{$trigger.data.name}}"
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>

      <FormField label="Username" hint="Optional - Override bot display name">
        <Input
          value={(config.username as string) || ""}
          onChange={(e) => onChange({ ...config, username: e.target.value })}
          placeholder="FlowForge Bot"
          className="h-8 text-sm"
        />
      </FormField>

      <div className="p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <p className="font-medium mb-1">Setup</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Go to your Discord server settings</li>
          <li>Navigate to Integrations &rarr; Webhooks</li>
          <li>Create a new webhook and copy the URL</li>
          <li>Paste it above or save as an integration</li>
        </ol>
      </div>
    </>
  );
}
