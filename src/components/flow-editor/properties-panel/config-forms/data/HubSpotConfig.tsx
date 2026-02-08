"use client";

import { Input } from "@/components/ui/input";
import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function HubSpotConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="hubspot"
        label="HubSpot Integration"
        required
      />
      <FormField label="Operation" required>
        <select
          value={(config.operation as string) || "create_contact"}
          onChange={(e) => onChange({ ...config, operation: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <optgroup label="Contacts">
            <option value="create_contact">Create Contact</option>
            <option value="update_contact">Update Contact</option>
            <option value="get_contact">Get Contact</option>
            <option value="search_contacts">Search Contacts</option>
          </optgroup>
          <optgroup label="Companies">
            <option value="create_company">Create Company</option>
            <option value="update_company">Update Company</option>
            <option value="get_company">Get Company</option>
          </optgroup>
          <optgroup label="Deals">
            <option value="create_deal">Create Deal</option>
            <option value="update_deal">Update Deal</option>
            <option value="get_deal">Get Deal</option>
          </optgroup>
          <optgroup label="Other">
            <option value="add_note">Add Note</option>
            <option value="create_task">Create Task</option>
          </optgroup>
        </select>
      </FormField>

      {/* Contact operations */}
      {config.operation === "create_contact" && (
        <>
          <FormField label="Email" required>
            <VariableInput
              value={(config.email as string) || ""}
              onChange={(val) => onChange({ ...config, email: val })}
              placeholder="contact@example.com"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="First Name">
            <VariableInput
              value={(config.firstName as string) || ""}
              onChange={(val) => onChange({ ...config, firstName: val })}
              placeholder="John"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Last Name">
            <VariableInput
              value={(config.lastName as string) || ""}
              onChange={(val) => onChange({ ...config, lastName: val })}
              placeholder="Doe"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Phone">
            <VariableInput
              value={(config.phone as string) || ""}
              onChange={(val) => onChange({ ...config, phone: val })}
              placeholder="+1234567890"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Company">
            <VariableInput
              value={(config.company as string) || ""}
              onChange={(val) => onChange({ ...config, company: val })}
              placeholder="Acme Corp"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
        </>
      )}

      {(config.operation === "update_contact" || config.operation === "get_contact") && (
        <FormField label="Contact ID or Email" required>
          <VariableInput
            value={(config.contactId as string) || ""}
            onChange={(val) => onChange({ ...config, contactId: val })}
            placeholder="{{steps.previous.contactId}}"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {config.operation === "search_contacts" && (
        <FormField label="Search Query" required hint="e.g., email:*@example.com">
          <VariableInput
            value={(config.query as string) || ""}
            onChange={(val) => onChange({ ...config, query: val })}
            placeholder="email:*@example.com"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {/* Company operations */}
      {config.operation === "create_company" && (
        <>
          <FormField label="Company Name" required>
            <VariableInput
              value={(config.name as string) || ""}
              onChange={(val) => onChange({ ...config, name: val })}
              placeholder="Acme Corporation"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Domain">
            <VariableInput
              value={(config.domain as string) || ""}
              onChange={(val) => onChange({ ...config, domain: val })}
              placeholder="acme.com"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Industry">
            <Input
              value={(config.industry as string) || ""}
              onChange={(e) => onChange({ ...config, industry: e.target.value })}
              placeholder="Technology"
              className="h-8 text-sm"
            />
          </FormField>
        </>
      )}

      {(config.operation === "update_company" || config.operation === "get_company") && (
        <FormField label="Company ID" required>
          <VariableInput
            value={(config.companyId as string) || ""}
            onChange={(val) => onChange({ ...config, companyId: val })}
            placeholder="{{steps.previous.companyId}}"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {/* Deal operations */}
      {config.operation === "create_deal" && (
        <>
          <FormField label="Deal Name" required>
            <VariableInput
              value={(config.dealName as string) || ""}
              onChange={(val) => onChange({ ...config, dealName: val })}
              placeholder="Enterprise Contract"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Amount">
            <VariableInput
              value={(config.amount as string) || ""}
              onChange={(val) => onChange({ ...config, amount: val })}
              placeholder="10000"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Pipeline">
            <Input
              value={(config.pipeline as string) || ""}
              onChange={(e) => onChange({ ...config, pipeline: e.target.value })}
              placeholder="default"
              className="h-8 text-sm"
            />
          </FormField>
          <FormField label="Stage">
            <Input
              value={(config.stage as string) || ""}
              onChange={(e) => onChange({ ...config, stage: e.target.value })}
              placeholder="qualifiedtobuy"
              className="h-8 text-sm"
            />
          </FormField>
        </>
      )}

      {(config.operation === "update_deal" || config.operation === "get_deal") && (
        <FormField label="Deal ID" required>
          <VariableInput
            value={(config.dealId as string) || ""}
            onChange={(val) => onChange({ ...config, dealId: val })}
            placeholder="{{steps.previous.dealId}}"
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}

      {/* Note and Task */}
      {config.operation === "add_note" && (
        <>
          <FormField label="Note Content" required>
            <VariableInput
              value={(config.noteContent as string) || ""}
              onChange={(val) => onChange({ ...config, noteContent: val })}
              placeholder="Meeting notes..."
              multiline={true}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Associate With" required>
            <select
              value={(config.associationType as string) || "contact"}
              onChange={(e) => onChange({ ...config, associationType: e.target.value })}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
            >
              <option value="contact">Contact</option>
              <option value="company">Company</option>
              <option value="deal">Deal</option>
            </select>
          </FormField>
          <FormField label="Record ID" required>
            <VariableInput
              value={(config.associationId as string) || ""}
              onChange={(val) => onChange({ ...config, associationId: val })}
              placeholder="Record ID to associate with"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
        </>
      )}

      {config.operation === "create_task" && (
        <>
          <FormField label="Task Title" required>
            <VariableInput
              value={(config.taskTitle as string) || ""}
              onChange={(val) => onChange({ ...config, taskTitle: val })}
              placeholder="Follow up call"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Due Date" hint="ISO format">
            <Input
              value={(config.dueDate as string) || ""}
              onChange={(e) => onChange({ ...config, dueDate: e.target.value })}
              placeholder="2024-12-31"
              className="h-8 text-sm"
              type="date"
            />
          </FormField>
          <FormField label="Priority">
            <select
              value={(config.priority as string) || "MEDIUM"}
              onChange={(e) => onChange({ ...config, priority: e.target.value })}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </FormField>
        </>
      )}
    </>
  );
}
