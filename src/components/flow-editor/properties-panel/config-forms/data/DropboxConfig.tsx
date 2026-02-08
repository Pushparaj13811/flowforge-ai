"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function DropboxConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="dropbox"
        label="Dropbox Integration"
        required
      />
      <FormField label="Operation" required>
        <select
          value={(config.operation as string) || "list"}
          onChange={(e) => onChange({ ...config, operation: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <option value="list">List Files</option>
          <option value="upload">Upload File</option>
          <option value="download">Download File</option>
          <option value="delete">Delete File</option>
          <option value="move">Move File</option>
          <option value="copy">Copy File</option>
          <option value="create_folder">Create Folder</option>
          <option value="get_link">Get Share Link</option>
        </select>
      </FormField>

      {config.operation === "list" && (
        <FormField label="Folder Path" hint="Use / for root">
          <VariableInput
            value={(config.path as string) || ""}
            onChange={(val) => onChange({ ...config, path: val })}
            placeholder="/Documents"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {(config.operation === "download" || config.operation === "delete" || config.operation === "get_link") && (
        <FormField label="File Path" required>
          <VariableInput
            value={(config.path as string) || ""}
            onChange={(val) => onChange({ ...config, path: val })}
            placeholder="/Documents/report.pdf"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {config.operation === "upload" && (
        <>
          <FormField label="Destination Path" required hint="Include filename">
            <VariableInput
              value={(config.path as string) || ""}
              onChange={(val) => onChange({ ...config, path: val })}
              placeholder="/Documents/report.pdf"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="File Content" required tooltip="Base64 encoded content or text">
            <VariableInput
              value={(config.fileContent as string) || ""}
              onChange={(val) => onChange({ ...config, fileContent: val })}
              placeholder="{{steps.previous.content}}"
              multiline={true}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Write Mode">
            <select
              value={(config.writeMode as string) || "add"}
              onChange={(e) => onChange({ ...config, writeMode: e.target.value })}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
            >
              <option value="add">Add (fail if exists)</option>
              <option value="overwrite">Overwrite</option>
            </select>
          </FormField>
        </>
      )}

      {(config.operation === "move" || config.operation === "copy") && (
        <>
          <FormField label="Source Path" required>
            <VariableInput
              value={(config.fromPath as string) || ""}
              onChange={(val) => onChange({ ...config, fromPath: val })}
              placeholder="/Documents/old-name.pdf"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Destination Path" required>
            <VariableInput
              value={(config.toPath as string) || ""}
              onChange={(val) => onChange({ ...config, toPath: val })}
              placeholder="/Archive/new-name.pdf"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
        </>
      )}

      {config.operation === "create_folder" && (
        <FormField label="Folder Path" required>
          <VariableInput
            value={(config.path as string) || ""}
            onChange={(val) => onChange({ ...config, path: val })}
            placeholder="/Documents/New Folder"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}
    </>
  );
}
