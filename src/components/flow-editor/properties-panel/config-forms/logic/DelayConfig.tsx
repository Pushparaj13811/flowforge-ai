"use client";

import { Input } from "@/components/ui/input";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function DelayConfig({ config, onChange }: ConfigComponentProps) {
  const duration = (config.duration as number) || 1;
  const unit = (config.unit as string) || "minutes";

  // Calculate human-readable summary
  const getSummary = () => {
    if (unit === "seconds" && duration >= 60) {
      return `(${Math.round(duration / 60)} min)`;
    }
    if (unit === "minutes" && duration >= 60) {
      return `(${Math.round(duration / 60)} hr)`;
    }
    if (unit === "hours" && duration >= 24) {
      return `(${Math.round(duration / 24)} days)`;
    }
    return "";
  };

  return (
    <>
      <FormField
        label="Wait Duration"
        required
        tooltip="The workflow will pause at this step for the specified duration before continuing to the next node."
      >
        <div className="flex gap-2">
          <Input
            type="number"
            value={duration}
            onChange={(e) =>
              onChange({ ...config, duration: parseInt(e.target.value) || 1 })
            }
            min={1}
            className="h-9 text-sm flex-1"
          />
          <select
            value={unit}
            onChange={(e) => onChange({ ...config, unit: e.target.value })}
            className="h-9 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none min-w-[110px]"
          >
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
        {getSummary() && (
          <p className="text-xs text-muted-foreground mt-1">{getSummary()}</p>
        )}
      </FormField>

      <div className="p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <p className="font-medium mb-1">How it works</p>
        <p>
          The workflow pauses for <span className="font-medium text-foreground">{duration} {unit}</span> before
          proceeding to the next step. Useful for rate limiting, follow-up sequences, or scheduled actions.
        </p>
      </div>
    </>
  );
}
