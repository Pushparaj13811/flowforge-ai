"use client";

import { Input } from "@/components/ui/input";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function ScheduleTriggerConfig({ config, onChange }: ConfigComponentProps) {
  return (
    <>
      <FormField label="Schedule" required hint="Cron expression">
        <Input
          value={(config.cron as string) || ""}
          onChange={(e) => onChange({ ...config, cron: e.target.value })}
          placeholder="0 9 * * *"
          className="h-8 text-sm font-mono"
        />
      </FormField>
      <FormField label="Timezone">
        <Input
          value={(config.timezone as string) || "UTC"}
          onChange={(e) => onChange({ ...config, timezone: e.target.value })}
          placeholder="America/New_York"
          className="h-8 text-sm"
        />
      </FormField>
    </>
  );
}
