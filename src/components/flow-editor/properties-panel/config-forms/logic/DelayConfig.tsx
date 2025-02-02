"use client";

import { Input } from "@/components/ui/input";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function DelayConfig({ config, onChange }: ConfigComponentProps) {
  return (
    <>
      <FormField label="Duration" required>
        <div className="flex gap-2">
          <Input
            type="number"
            value={(config.duration as number) || 1}
            onChange={(e) =>
              onChange({ ...config, duration: parseInt(e.target.value) || 1 })
            }
            min={1}
            className="h-8 text-sm flex-1"
          />
          <select
            value={(config.unit as string) || "minutes"}
            onChange={(e) => onChange({ ...config, unit: e.target.value })}
            className="h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
          >
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
      </FormField>
    </>
  );
}
