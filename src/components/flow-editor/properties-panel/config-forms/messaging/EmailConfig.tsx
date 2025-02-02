"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function EmailConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  // Set usePlatform: true by default if no integrationId is selected
  // This enables the platform email fallback (100 emails/month free)
  React.useEffect(() => {
    if (!config.integrationId && config.usePlatform === undefined) {
      onChange({ ...config, usePlatform: true });
    }
  }, []);

  const handleIntegrationChange = (integrationId: string) => {
    if (integrationId) {
      // User selected a custom integration
      onChange({ ...config, integrationId, usePlatform: false });
    } else {
      // User selected platform email (no integration)
      onChange({ ...config, integrationId: "", usePlatform: true });
    }
  };

  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={handleIntegrationChange}
        filterType={["email", "resend", "smtp", "sendgrid"]}
        label="Email Integration"
      />
      <FormField label="To" required hint="Comma-separated" tooltip="Enter recipient email addresses. Use {{$trigger.data.email}} to send to the email from your trigger data.">
        <VariableInput
          value={(config.to as string) || ""}
          onChange={(val) => onChange({ ...config, to: val })}
          placeholder="{{$trigger.data.email}} or email@example.com"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Subject" required tooltip="The email subject line. Click the variable button to insert dynamic data.">
        <VariableInput
          value={(config.subject as string) || ""}
          onChange={(val) => onChange({ ...config, subject: val })}
          placeholder="Email subject"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Body" required tooltip="The main email content. Supports HTML for rich formatting.">
        <VariableInput
          value={(config.body as string) || ""}
          onChange={(val) => onChange({ ...config, body: val })}
          placeholder="Email body..."
          multiline={true}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="CC" hint="Optional">
        <Input
          value={(config.cc as string) || ""}
          onChange={(e) => onChange({ ...config, cc: e.target.value })}
          placeholder="cc@example.com"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
