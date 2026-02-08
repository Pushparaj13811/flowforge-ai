"use client";

import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function SMSConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="twilio"
        label="Twilio Integration"
        required
      />
      <FormField label="To Phone" required tooltip="The recipient's phone number in E.164 format (e.g., +1234567890)">
        <VariableInput
          value={(config.to as string) || ""}
          onChange={(val) => onChange({ ...config, to: val })}
          placeholder="+1234567890 or {{$trigger.data.phone}}"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Message" required>
        <VariableInput
          value={(config.message as string) || ""}
          onChange={(val) => onChange({ ...config, message: val })}
          placeholder="Your SMS message..."
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
    </>
  );
}
