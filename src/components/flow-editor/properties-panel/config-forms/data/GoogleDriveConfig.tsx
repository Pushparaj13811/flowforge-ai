"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function GoogleDriveConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="google-drive"
        label="Google Drive Integration"
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
          <option value="share">Share File</option>
          <option value="create_folder">Create Folder</option>
        </select>
      </FormField>

      {config.operation === "list" && (
        <>
          <FormField label="Folder ID" hint="Leave empty for root folder">
            <VariableInput
              value={(config.folderId as string) || ""}
              onChange={(val) => onChange({ ...config, folderId: val })}
              placeholder="folder_id_here"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Query Filter" hint="e.g., name contains 'report'">
            <Input
              value={(config.query as string) || ""}
              onChange={(e) => onChange({ ...config, query: e.target.value })}
              placeholder="mimeType = 'application/pdf'"
              className="h-8 text-sm"
            />
          </FormField>
        </>
      )}

      {(config.operation === "download" || config.operation === "delete" || config.operation === "share") && (
        <FormField label="File ID" required>
          <VariableInput
            value={(config.fileId as string) || ""}
            onChange={(val) => onChange({ ...config, fileId: val })}
            placeholder="{{steps.previous.fileId}}"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {config.operation === "upload" && (
        <>
          <FormField label="File Name" required>
            <VariableInput
              value={(config.fileName as string) || ""}
              onChange={(val) => onChange({ ...config, fileName: val })}
              placeholder="report.pdf"
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
          <FormField label="Parent Folder ID" hint="Leave empty for root">
            <Input
              value={(config.parentFolderId as string) || ""}
              onChange={(e) => onChange({ ...config, parentFolderId: e.target.value })}
              placeholder="folder_id"
              className="h-8 text-sm"
            />
          </FormField>
        </>
      )}

      {config.operation === "share" && (
        <>
          <FormField label="Share With Email" required>
            <VariableInput
              value={(config.shareEmail as string) || ""}
              onChange={(val) => onChange({ ...config, shareEmail: val })}
              placeholder="user@example.com"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Permission">
            <select
              value={(config.permission as string) || "reader"}
              onChange={(e) => onChange({ ...config, permission: e.target.value })}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
            >
              <option value="reader">Viewer</option>
              <option value="commenter">Commenter</option>
              <option value="writer">Editor</option>
            </select>
          </FormField>
        </>
      )}

      {config.operation === "create_folder" && (
        <>
          <FormField label="Folder Name" required>
            <VariableInput
              value={(config.folderName as string) || ""}
              onChange={(val) => onChange({ ...config, folderName: val })}
              placeholder="New Folder"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Parent Folder ID" hint="Leave empty for root">
            <Input
              value={(config.parentFolderId as string) || ""}
              onChange={(e) => onChange({ ...config, parentFolderId: e.target.value })}
              placeholder="folder_id"
              className="h-8 text-sm"
            />
          </FormField>
        </>
      )}
    </>
  );
}
