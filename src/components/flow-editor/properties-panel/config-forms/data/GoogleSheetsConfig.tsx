"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function GoogleSheetsConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="google"
        label="Google Integration"
        required
      />
      <FormField label="Operation" required>
        <select
          value={(config.operation as string) || "read"}
          onChange={(e) => onChange({ ...config, operation: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <option value="read">Read Rows</option>
          <option value="append">Append Row</option>
          <option value="update">Update Row</option>
        </select>
      </FormField>
      <FormField label="Spreadsheet ID" required tooltip="Found in the Google Sheets URL after /d/">
        <VariableInput
          value={(config.spreadsheetId as string) || ""}
          onChange={(val) => onChange({ ...config, spreadsheetId: val })}
          placeholder="1BxiMVs0XRA5nFMdKvBd..."
          multiline={false}
          nodeId={nodeId}
        />
      </FormField>
      <FormField label="Sheet Name" required>
        <Input
          value={(config.sheetName as string) || ""}
          onChange={(e) => onChange({ ...config, sheetName: e.target.value })}
          placeholder="Sheet1"
          className="h-8 text-sm"
        />
      </FormField>
      <FormField label="Range" hint="e.g., A1:D10" tooltip="The cell range to read from or write to">
        <Input
          value={(config.range as string) || ""}
          onChange={(e) => onChange({ ...config, range: e.target.value })}
          placeholder="A1:D10"
          className="h-8 text-sm"
        />
      </FormField>
      {(config.operation === "append" || config.operation === "update") && (
        <FormField label="Values" required tooltip="JSON array of values to write">
          <VariableInput
            value={(config.values as string) || ""}
            onChange={(val) => onChange({ ...config, values: val })}
            placeholder='[["Name", "Email"]]'
            multiline={true}
            nodeId={nodeId}
          />
        </FormField>
      )}
    </>
  );
}
