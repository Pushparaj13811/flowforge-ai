"use client";

import { Input } from "@/components/ui/input";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function PushNotificationConfig({ config, onChange }: ConfigComponentProps) {
  return (
    <>
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 mb-3">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Note:</strong> Push notifications require a configured push service (Firebase, OneSignal, etc.)
          to be set up in your project settings.
        </p>
      </div>
      <FormField label="Title" required>
        <Input
          value={(config.title as string) || ""}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder="New Notification"
          className="h-8 text-sm"
        />
      </FormField>
      <FormField label="Message" required>
        <VariableInput
          value={(config.body as string) || ""}
          onChange={(val) => onChange({ ...config, body: val })}
          placeholder="You have a new message from {{$trigger.data.sender}}"
          multiline={true}
        />
      </FormField>
      <FormField label="User ID" hint="Optional - target specific user">
        <Input
          value={(config.userId as string) || ""}
          onChange={(e) => onChange({ ...config, userId: e.target.value })}
          placeholder="Leave empty to broadcast"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
