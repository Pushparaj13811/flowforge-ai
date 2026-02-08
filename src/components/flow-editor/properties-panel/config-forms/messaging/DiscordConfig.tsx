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
        required
      />
      <FormField label="Message" required>
        <VariableInput
          value={(config.message as string) || ""}
          onChange={(val) => onChange({ ...config, message: val })}
          placeholder="Enter your message..."
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Username" hint="Optional">
        <Input
          value={(config.username as string) || ""}
          onChange={(e) => onChange({ ...config, username: e.target.value })}
          placeholder="Bot Name"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
