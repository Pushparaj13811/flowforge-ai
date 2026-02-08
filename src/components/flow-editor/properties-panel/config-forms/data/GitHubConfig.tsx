"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function GitHubConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="github"
        label="GitHub Integration"
        required
      />
      <FormField label="Operation" required>
        <select
          value={(config.operation as string) || "create_issue"}
          onChange={(e) => onChange({ ...config, operation: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <optgroup label="Issues">
            <option value="create_issue">Create Issue</option>
            <option value="update_issue">Update Issue</option>
            <option value="close_issue">Close Issue</option>
            <option value="add_comment">Add Comment</option>
          </optgroup>
          <optgroup label="Pull Requests">
            <option value="create_pr">Create Pull Request</option>
            <option value="merge_pr">Merge Pull Request</option>
            <option value="list_prs">List Pull Requests</option>
          </optgroup>
          <optgroup label="Repository">
            <option value="get_file">Get File Content</option>
            <option value="create_file">Create/Update File</option>
            <option value="list_repos">List Repositories</option>
          </optgroup>
        </select>
      </FormField>

      {/* Repository fields for most operations */}
      {config.operation !== "list_repos" && (
        <>
          <FormField label="Repository Owner" required>
            <VariableInput
              value={(config.owner as string) || ""}
              onChange={(val) => onChange({ ...config, owner: val })}
              placeholder="username or org"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Repository Name" required>
            <VariableInput
              value={(config.repo as string) || ""}
              onChange={(val) => onChange({ ...config, repo: val })}
              placeholder="repository-name"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
        </>
      )}

      {/* Issue operations */}
      {config.operation === "create_issue" && (
        <>
          <FormField label="Issue Title" required>
            <VariableInput
              value={(config.title as string) || ""}
              onChange={(val) => onChange({ ...config, title: val })}
              placeholder="Bug: Something is broken"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Issue Body">
            <VariableInput
              value={(config.body as string) || ""}
              onChange={(val) => onChange({ ...config, body: val })}
              placeholder="Describe the issue..."
              multiline={true}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Labels" hint="Comma-separated">
            <Input
              value={(config.labels as string) || ""}
              onChange={(e) => onChange({ ...config, labels: e.target.value })}
              placeholder="bug, priority-high"
              className="h-8 text-sm"
            />
          </FormField>
        </>
      )}

      {(config.operation === "update_issue" || config.operation === "close_issue" || config.operation === "add_comment") && (
        <FormField label="Issue Number" required>
          <VariableInput
            value={(config.issueNumber as string) || ""}
            onChange={(val) => onChange({ ...config, issueNumber: val })}
            placeholder="{{steps.previous.issueNumber}}"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {config.operation === "add_comment" && (
        <FormField label="Comment" required>
          <VariableInput
            value={(config.body as string) || ""}
            onChange={(val) => onChange({ ...config, body: val })}
            placeholder="Comment text..."
            multiline={true}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {/* Pull Request operations */}
      {config.operation === "create_pr" && (
        <>
          <FormField label="Title" required>
            <VariableInput
              value={(config.title as string) || ""}
              onChange={(val) => onChange({ ...config, title: val })}
              placeholder="Add new feature"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Head Branch" required hint="Branch with changes">
            <Input
              value={(config.head as string) || ""}
              onChange={(e) => onChange({ ...config, head: e.target.value })}
              placeholder="feature-branch"
              className="h-8 text-sm"
            />
          </FormField>
          <FormField label="Base Branch" required hint="Target branch">
            <Input
              value={(config.base as string) || ""}
              onChange={(e) => onChange({ ...config, base: e.target.value })}
              placeholder="main"
              className="h-8 text-sm"
            />
          </FormField>
          <FormField label="Body">
            <VariableInput
              value={(config.body as string) || ""}
              onChange={(val) => onChange({ ...config, body: val })}
              placeholder="Description of changes..."
              multiline={true}
              nodeId={nodeId}
            />
          </FormField>
        </>
      )}

      {config.operation === "merge_pr" && (
        <>
          <FormField label="Pull Request Number" required>
            <VariableInput
              value={(config.prNumber as string) || ""}
              onChange={(val) => onChange({ ...config, prNumber: val })}
              placeholder="123"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Merge Method">
            <select
              value={(config.mergeMethod as string) || "merge"}
              onChange={(e) => onChange({ ...config, mergeMethod: e.target.value })}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
            >
              <option value="merge">Merge Commit</option>
              <option value="squash">Squash and Merge</option>
              <option value="rebase">Rebase and Merge</option>
            </select>
          </FormField>
        </>
      )}

      {/* File operations */}
      {(config.operation === "get_file" || config.operation === "create_file") && (
        <FormField label="File Path" required>
          <VariableInput
            value={(config.path as string) || ""}
            onChange={(val) => onChange({ ...config, path: val })}
            placeholder="src/config.json"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {config.operation === "create_file" && (
        <>
          <FormField label="File Content" required>
            <VariableInput
              value={(config.content as string) || ""}
              onChange={(val) => onChange({ ...config, content: val })}
              placeholder="File content here..."
              multiline={true}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Commit Message" required>
            <Input
              value={(config.message as string) || ""}
              onChange={(e) => onChange({ ...config, message: e.target.value })}
              placeholder="Update config file"
              className="h-8 text-sm"
            />
          </FormField>
          <FormField label="Branch">
            <Input
              value={(config.branch as string) || ""}
              onChange={(e) => onChange({ ...config, branch: e.target.value })}
              placeholder="main (default)"
              className="h-8 text-sm"
            />
          </FormField>
        </>
      )}
    </>
  );
}
