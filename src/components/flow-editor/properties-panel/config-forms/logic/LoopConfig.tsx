"use client";

import { Input } from "@/components/ui/input";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

interface LoopConfigProps extends ConfigComponentProps {
  loopType?: "foreach" | "repeat";
}

export function LoopConfig({ config, onChange, nodeId, loopType = "foreach" }: LoopConfigProps) {
  if (loopType === "repeat") {
    return (
      <>
        <FormField label="Repeat Count" required tooltip="Number of times to repeat the loop">
          <Input
            type="number"
            value={(config.count as number) || 1}
            onChange={(e) => onChange({ ...config, count: parseInt(e.target.value) || 1 })}
            min={1}
            max={1000}
            className="h-8 text-sm"
          />
        </FormField>
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">Available in loop body:</p>
          <code className="block font-mono bg-muted px-1.5 py-0.5 rounded text-primary">
            {`{{$loop.index}}`} - Current iteration (0-based)
          </code>
        </div>
      </>
    );
  }

  return (
    <>
      <FormField label="Array to Iterate" required tooltip="Select the array variable to loop through">
        <VariableInput
          value={(config.array as string) || ""}
          onChange={(val) => onChange({ ...config, array: val })}
          placeholder="{{$trigger.data.items}}"
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <p className="font-medium mb-1">Available in loop body:</p>
        <div className="space-y-1">
          <code className="block font-mono bg-muted px-1.5 py-0.5 rounded text-primary">
            {`{{$loop.item}}`} - Current item
          </code>
          <code className="block font-mono bg-muted px-1.5 py-0.5 rounded text-primary">
            {`{{$loop.index}}`} - Current index (0-based)
          </code>
        </div>
      </div>
    </>
  );
}
