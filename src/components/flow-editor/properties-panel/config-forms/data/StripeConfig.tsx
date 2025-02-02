"use client";

import { IntegrationSelector } from "../../../IntegrationSelector";
import { VariableInput } from "../../../VariableInput";
import { FormField } from "../../ui/FormField";
import type { ConfigComponentProps } from "../../types";

export function StripeConfig({ config, onChange, nodeId }: ConfigComponentProps) {
  return (
    <>
      <IntegrationSelector
        value={(config.integrationId as string) || ""}
        onChange={(integrationId) => onChange({ ...config, integrationId })}
        filterType="stripe"
        label="Stripe Integration"
        required
      />
      <FormField label="Operation" required>
        <select
          value={(config.operation as string) || "create-payment-intent"}
          onChange={(e) => onChange({ ...config, operation: e.target.value })}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
        >
          <option value="create-payment-intent">Create Payment Intent</option>
          <option value="create-customer">Create Customer</option>
          <option value="get-customer">Get Customer</option>
          <option value="create-subscription">Create Subscription</option>
          <option value="refund">Refund Payment</option>
        </select>
      </FormField>
      {config.operation === "create-payment-intent" && (
        <>
          <FormField label="Amount" required tooltip="Amount in cents (e.g., 1000 = $10.00)">
            <VariableInput
              value={(config.amount as string) || ""}
              onChange={(val) => onChange({ ...config, amount: val })}
              placeholder="1000 or {{$trigger.data.amount}}"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Currency">
            <select
              value={(config.currency as string) || "usd"}
              onChange={(e) => onChange({ ...config, currency: e.target.value })}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
              <option value="cad">CAD</option>
              <option value="aud">AUD</option>
            </select>
          </FormField>
          <FormField label="Customer ID" hint="Optional">
            <VariableInput
              value={(config.customerId as string) || ""}
              onChange={(val) => onChange({ ...config, customerId: val })}
              placeholder="cus_..."
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
        </>
      )}
      {config.operation === "create-customer" && (
        <>
          <FormField label="Email" required>
            <VariableInput
              value={(config.email as string) || ""}
              onChange={(val) => onChange({ ...config, email: val })}
              placeholder="{{$trigger.data.email}}"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
          <FormField label="Name" hint="Optional">
            <VariableInput
              value={(config.name as string) || ""}
              onChange={(val) => onChange({ ...config, name: val })}
              placeholder="{{$trigger.data.name}}"
              multiline={false}
              nodeId={nodeId}
            />
          </FormField>
        </>
      )}
      {config.operation === "get-customer" && (
        <FormField label="Customer ID" required>
          <VariableInput
            value={(config.customerId as string) || ""}
            onChange={(val) => onChange({ ...config, customerId: val })}
            placeholder="cus_..."
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}
      {config.operation === "refund" && (
        <FormField label="Payment Intent ID" required>
          <VariableInput
            value={(config.paymentIntentId as string) || ""}
            onChange={(val) => onChange({ ...config, paymentIntentId: val })}
            placeholder="pi_..."
            multiline={false}
            nodeId={nodeId}
          />
        </FormField>
      )}
    </>
  );
}
