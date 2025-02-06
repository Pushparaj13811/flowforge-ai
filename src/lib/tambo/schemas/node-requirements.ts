/**
 * @file node-requirements.ts
 * @description Node Requirements Registry - Defines required/optional configuration fields for all handler types
 * This enables the AI to know what information it needs to collect before creating a complete workflow
 */

import { z } from "zod";

/**
 * Field type definitions for configuration prompts
 */
export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "number"
  | "select"
  | "integration-select"
  | "channel-picker"
  | "spreadsheet-picker"
  | "variable-mapper"
  | "json"
  | "phone"
  | "currency";

/**
 * Schema for a field prompt configuration
 */
export interface FieldPrompt {
  /** Question to ask the user */
  question: string;
  /** Type of input field */
  type: FieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Whether this field supports {{variable}} syntax */
  supportsVariables?: boolean;
  /** For select fields, available options */
  options?: Array<{ value: string; label: string }>;
  /** Default value */
  defaultValue?: unknown;
  /** Validation pattern (regex string) */
  pattern?: string;
  /** Minimum value (for numbers) */
  min?: number;
  /** Maximum value (for numbers) */
  max?: number;
  /** Helper text / description */
  helpText?: string;
}

/**
 * Schema for a node type's requirements
 */
export interface NodeRequirements {
  /** Required fields that must be filled */
  required: string[];
  /** Optional fields */
  optional?: string[];
  /** Integration type required (e.g., "slack", "google-sheets") */
  integrationRequired?: string;
  /** Whether platform fallback is available (e.g., email can use platform SMTP) */
  platformFallback?: boolean;
  /** Prompts for each field */
  prompts: Record<string, FieldPrompt>;
  /** Description of what this node type does */
  description: string;
  /** Suggested icon for this node type */
  suggestedIcon: string;
}

/**
 * Complete registry of node requirements for all handler types
 */
export const NODE_REQUIREMENTS: Record<string, NodeRequirements> = {
  // ============================================
  // MESSAGING - Slack
  // ============================================
  "slack:send-message": {
    required: ["integrationId", "channel", "message"],
    optional: ["blocks", "username", "iconEmoji"],
    integrationRequired: "slack",
    description: "Send a message to a Slack channel or user",
    suggestedIcon: "message-square",
    prompts: {
      integrationId: {
        question: "Which Slack workspace should I use?",
        type: "integration-select",
        helpText: "Select your connected Slack workspace",
      },
      channel: {
        question: "Which Slack channel should I post to?",
        type: "channel-picker",
        placeholder: "#general",
        supportsVariables: true,
        helpText: "Enter a channel name (e.g., #general) or use a variable",
      },
      message: {
        question: "What message should I send?",
        type: "textarea",
        placeholder: "Enter your message...",
        supportsVariables: true,
        helpText: "You can use variables like {{$trigger.data.name}} to personalize the message",
      },
      blocks: {
        question: "Do you want to add rich formatting blocks? (Advanced)",
        type: "json",
        placeholder: "[]",
        supportsVariables: true,
        helpText: "Optional: Slack Block Kit JSON for rich formatting",
      },
    },
  },

  // ============================================
  // MESSAGING - Discord
  // ============================================
  "discord:webhook": {
    required: ["webhookUrl", "content"],
    optional: ["username", "avatarUrl", "embeds"],
    description: "Send a message to Discord via webhook",
    suggestedIcon: "message-square",
    prompts: {
      webhookUrl: {
        question: "What's the Discord webhook URL?",
        type: "url",
        placeholder: "https://discord.com/api/webhooks/...",
        helpText: "Get this from Discord channel settings > Integrations > Webhooks",
      },
      content: {
        question: "What message should I send?",
        type: "textarea",
        placeholder: "Enter your message...",
        supportsVariables: true,
      },
      username: {
        question: "What username should the bot use? (Optional)",
        type: "text",
        placeholder: "Workflow Bot",
      },
      embeds: {
        question: "Do you want to add rich embeds? (Advanced)",
        type: "json",
        placeholder: "[]",
        supportsVariables: true,
      },
    },
  },

  // ============================================
  // MESSAGING - Microsoft Teams
  // ============================================
  "teams:webhook": {
    required: ["webhookUrl", "text"],
    optional: ["title", "themeColor", "sections"],
    description: "Send a message to Microsoft Teams via webhook",
    suggestedIcon: "users",
    prompts: {
      webhookUrl: {
        question: "What's the Teams webhook URL?",
        type: "url",
        placeholder: "https://outlook.office.com/webhook/...",
        helpText: "Get this from Teams channel connectors",
      },
      text: {
        question: "What message should I send?",
        type: "textarea",
        placeholder: "Enter your message...",
        supportsVariables: true,
      },
      title: {
        question: "What should be the message title? (Optional)",
        type: "text",
        placeholder: "Notification",
        supportsVariables: true,
      },
      themeColor: {
        question: "What color theme? (Optional)",
        type: "text",
        placeholder: "0076D7",
        helpText: "Hex color code without #",
      },
    },
  },

  // ============================================
  // EMAIL - Resend
  // ============================================
  "email:resend": {
    required: ["to", "subject", "body"],
    optional: ["integrationId", "from", "replyTo", "cc", "bcc"],
    integrationRequired: "resend",
    platformFallback: true,
    description: "Send an email using Resend",
    suggestedIcon: "mail",
    prompts: {
      to: {
        question: "Who should receive this email?",
        type: "email",
        placeholder: "recipient@example.com",
        supportsVariables: true,
        helpText: "Email address of the recipient",
      },
      subject: {
        question: "What's the email subject?",
        type: "text",
        placeholder: "Your subject here",
        supportsVariables: true,
      },
      body: {
        question: "What should the email say?",
        type: "textarea",
        placeholder: "Email content...",
        supportsVariables: true,
        helpText: "Supports HTML formatting",
      },
      from: {
        question: "Who should the email be from? (Optional)",
        type: "email",
        placeholder: "sender@yourdomain.com",
        helpText: "Defaults to platform sender if not specified",
      },
      replyTo: {
        question: "Where should replies go? (Optional)",
        type: "email",
        placeholder: "replies@yourdomain.com",
      },
    },
  },

  // ============================================
  // EMAIL - SMTP
  // ============================================
  "email:smtp": {
    required: ["integrationId", "to", "subject", "body"],
    optional: ["from", "replyTo", "cc", "bcc"],
    integrationRequired: "smtp",
    description: "Send an email using SMTP",
    suggestedIcon: "mail",
    prompts: {
      integrationId: {
        question: "Which SMTP server should I use?",
        type: "integration-select",
        helpText: "Select your configured SMTP integration",
      },
      to: {
        question: "Who should receive this email?",
        type: "email",
        placeholder: "recipient@example.com",
        supportsVariables: true,
      },
      subject: {
        question: "What's the email subject?",
        type: "text",
        placeholder: "Your subject here",
        supportsVariables: true,
      },
      body: {
        question: "What should the email say?",
        type: "textarea",
        placeholder: "Email content...",
        supportsVariables: true,
      },
    },
  },

  // ============================================
  // SMS - Twilio
  // ============================================
  "twilio:send-sms": {
    required: ["integrationId", "to", "body"],
    optional: ["from", "statusCallback"],
    integrationRequired: "twilio",
    description: "Send an SMS using Twilio",
    suggestedIcon: "phone",
    prompts: {
      integrationId: {
        question: "Which Twilio account should I use?",
        type: "integration-select",
        helpText: "Select your connected Twilio account",
      },
      to: {
        question: "What phone number should receive the SMS?",
        type: "phone",
        placeholder: "+1234567890",
        supportsVariables: true,
        helpText: "Include country code (e.g., +1 for US)",
      },
      body: {
        question: "What message should I send?",
        type: "textarea",
        placeholder: "Your SMS message...",
        supportsVariables: true,
        helpText: "Keep under 160 characters for single SMS",
      },
      from: {
        question: "Which Twilio phone number to send from? (Optional)",
        type: "phone",
        placeholder: "+1234567890",
        helpText: "Defaults to your Twilio number if not specified",
      },
    },
  },

  "twilio:send-mms": {
    required: ["integrationId", "to", "body", "mediaUrl"],
    optional: ["from"],
    integrationRequired: "twilio",
    description: "Send an MMS with media using Twilio",
    suggestedIcon: "phone",
    prompts: {
      integrationId: {
        question: "Which Twilio account should I use?",
        type: "integration-select",
      },
      to: {
        question: "What phone number should receive the MMS?",
        type: "phone",
        placeholder: "+1234567890",
        supportsVariables: true,
      },
      body: {
        question: "What message should I send?",
        type: "textarea",
        placeholder: "Your MMS message...",
        supportsVariables: true,
      },
      mediaUrl: {
        question: "What's the URL of the media to attach?",
        type: "url",
        placeholder: "https://example.com/image.jpg",
        supportsVariables: true,
      },
    },
  },

  // ============================================
  // AI - OpenAI
  // ============================================
  "openai:chat": {
    required: ["integrationId", "prompt"],
    optional: ["model", "maxTokens", "temperature", "systemPrompt"],
    integrationRequired: "openai",
    description: "Generate text using OpenAI's chat models",
    suggestedIcon: "brain",
    prompts: {
      integrationId: {
        question: "Which OpenAI API key should I use?",
        type: "integration-select",
        helpText: "Select your connected OpenAI account",
      },
      prompt: {
        question: "What should I ask the AI?",
        type: "textarea",
        placeholder: "Enter your prompt...",
        supportsVariables: true,
        helpText: "You can include data from previous steps using variables",
      },
      model: {
        question: "Which model should I use?",
        type: "select",
        options: [
          { value: "gpt-4o", label: "GPT-4o (Most capable)" },
          { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast & affordable)" },
          { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
          { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Legacy)" },
        ],
        defaultValue: "gpt-4o-mini",
      },
      maxTokens: {
        question: "Maximum response length? (Optional)",
        type: "number",
        placeholder: "1000",
        min: 1,
        max: 4096,
        defaultValue: 1000,
      },
      temperature: {
        question: "How creative should the response be? (0-2)",
        type: "number",
        placeholder: "0.7",
        min: 0,
        max: 2,
        defaultValue: 0.7,
        helpText: "Lower = more focused, Higher = more creative",
      },
      systemPrompt: {
        question: "Any specific instructions for the AI? (Optional)",
        type: "textarea",
        placeholder: "You are a helpful assistant...",
        helpText: "System prompt to set the AI's behavior",
      },
    },
  },

  // ============================================
  // AI - Anthropic Claude
  // ============================================
  "anthropic:claude": {
    required: ["integrationId", "prompt"],
    optional: ["model", "maxTokens", "temperature", "systemPrompt"],
    integrationRequired: "anthropic",
    description: "Generate text using Anthropic's Claude models",
    suggestedIcon: "brain",
    prompts: {
      integrationId: {
        question: "Which Anthropic API key should I use?",
        type: "integration-select",
        helpText: "Select your connected Anthropic account",
      },
      prompt: {
        question: "What should I ask Claude?",
        type: "textarea",
        placeholder: "Enter your prompt...",
        supportsVariables: true,
      },
      model: {
        question: "Which Claude model should I use?",
        type: "select",
        options: [
          { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Recommended)" },
          { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Most capable)" },
          { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku (Fastest)" },
        ],
        defaultValue: "claude-3-5-sonnet-20241022",
      },
      maxTokens: {
        question: "Maximum response length? (Optional)",
        type: "number",
        placeholder: "1000",
        min: 1,
        max: 4096,
        defaultValue: 1000,
      },
      temperature: {
        question: "How creative should the response be? (0-1)",
        type: "number",
        placeholder: "0.7",
        min: 0,
        max: 1,
        defaultValue: 0.7,
      },
    },
  },

  // ============================================
  // Google Sheets
  // ============================================
  "google-sheets:read": {
    required: ["integrationId", "spreadsheetId", "range"],
    optional: ["valueRenderOption"],
    integrationRequired: "google-sheets",
    description: "Read data from a Google Sheets spreadsheet",
    suggestedIcon: "table",
    prompts: {
      integrationId: {
        question: "Which Google account should I use?",
        type: "integration-select",
        helpText: "Select your connected Google account",
      },
      spreadsheetId: {
        question: "What's the spreadsheet ID or URL?",
        type: "spreadsheet-picker",
        placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
        helpText: "Found in the spreadsheet URL after /d/",
        supportsVariables: true,
      },
      range: {
        question: "Which cells should I read?",
        type: "text",
        placeholder: "Sheet1!A1:D10",
        supportsVariables: true,
        helpText: "Use A1 notation (e.g., Sheet1!A1:D10)",
      },
    },
  },

  "google-sheets:append": {
    required: ["integrationId", "spreadsheetId", "range", "values"],
    optional: ["valueInputOption"],
    integrationRequired: "google-sheets",
    description: "Append rows to a Google Sheets spreadsheet",
    suggestedIcon: "table",
    prompts: {
      integrationId: {
        question: "Which Google account should I use?",
        type: "integration-select",
      },
      spreadsheetId: {
        question: "What's the spreadsheet ID or URL?",
        type: "spreadsheet-picker",
        placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
        supportsVariables: true,
      },
      range: {
        question: "Which sheet should I append to?",
        type: "text",
        placeholder: "Sheet1!A:D",
        supportsVariables: true,
        helpText: "Just the sheet name and columns (e.g., Sheet1!A:D)",
      },
      values: {
        question: "What values should I add?",
        type: "variable-mapper",
        placeholder: '[[\"value1\", \"value2\"]]',
        supportsVariables: true,
        helpText: "Map fields from your data to spreadsheet columns",
      },
    },
  },

  "google-sheets:update": {
    required: ["integrationId", "spreadsheetId", "range", "values"],
    optional: ["valueInputOption"],
    integrationRequired: "google-sheets",
    description: "Update cells in a Google Sheets spreadsheet",
    suggestedIcon: "table",
    prompts: {
      integrationId: {
        question: "Which Google account should I use?",
        type: "integration-select",
      },
      spreadsheetId: {
        question: "What's the spreadsheet ID or URL?",
        type: "spreadsheet-picker",
        supportsVariables: true,
      },
      range: {
        question: "Which cells should I update?",
        type: "text",
        placeholder: "Sheet1!A1:D1",
        supportsVariables: true,
      },
      values: {
        question: "What values should I set?",
        type: "variable-mapper",
        supportsVariables: true,
      },
    },
  },

  // ============================================
  // Stripe
  // ============================================
  "stripe:create-payment-intent": {
    required: ["integrationId", "amount", "currency"],
    optional: ["customerId", "paymentMethodId", "description", "metadata"],
    integrationRequired: "stripe",
    description: "Create a Stripe payment intent",
    suggestedIcon: "credit-card",
    prompts: {
      integrationId: {
        question: "Which Stripe account should I use?",
        type: "integration-select",
        helpText: "Select your connected Stripe account",
      },
      amount: {
        question: "What's the payment amount (in cents)?",
        type: "number",
        placeholder: "1000",
        supportsVariables: true,
        helpText: "Amount in smallest currency unit (e.g., 1000 = $10.00)",
      },
      currency: {
        question: "What currency?",
        type: "select",
        options: [
          { value: "usd", label: "USD - US Dollar" },
          { value: "eur", label: "EUR - Euro" },
          { value: "gbp", label: "GBP - British Pound" },
          { value: "cad", label: "CAD - Canadian Dollar" },
          { value: "aud", label: "AUD - Australian Dollar" },
        ],
        defaultValue: "usd",
      },
      customerId: {
        question: "Stripe customer ID? (Optional)",
        type: "text",
        placeholder: "cus_xxxxx",
        supportsVariables: true,
      },
      description: {
        question: "Payment description? (Optional)",
        type: "text",
        placeholder: "Payment for order #123",
        supportsVariables: true,
      },
    },
  },

  "stripe:create-customer": {
    required: ["integrationId", "email"],
    optional: ["name", "phone", "description", "metadata"],
    integrationRequired: "stripe",
    description: "Create a new Stripe customer",
    suggestedIcon: "credit-card",
    prompts: {
      integrationId: {
        question: "Which Stripe account should I use?",
        type: "integration-select",
      },
      email: {
        question: "What's the customer's email?",
        type: "email",
        placeholder: "customer@example.com",
        supportsVariables: true,
      },
      name: {
        question: "What's the customer's name? (Optional)",
        type: "text",
        placeholder: "John Doe",
        supportsVariables: true,
      },
      phone: {
        question: "What's the customer's phone? (Optional)",
        type: "phone",
        placeholder: "+1234567890",
        supportsVariables: true,
      },
    },
  },

  "stripe:refund": {
    required: ["integrationId", "paymentIntentId"],
    optional: ["amount", "reason"],
    integrationRequired: "stripe",
    description: "Refund a Stripe payment",
    suggestedIcon: "credit-card",
    prompts: {
      integrationId: {
        question: "Which Stripe account should I use?",
        type: "integration-select",
      },
      paymentIntentId: {
        question: "What's the payment intent ID to refund?",
        type: "text",
        placeholder: "pi_xxxxx",
        supportsVariables: true,
      },
      amount: {
        question: "Refund amount (in cents)? Leave blank for full refund",
        type: "number",
        placeholder: "Leave blank for full refund",
        supportsVariables: true,
      },
      reason: {
        question: "Reason for refund? (Optional)",
        type: "select",
        options: [
          { value: "duplicate", label: "Duplicate charge" },
          { value: "fraudulent", label: "Fraudulent" },
          { value: "requested_by_customer", label: "Customer request" },
        ],
      },
    },
  },

  // ============================================
  // HTTP/Webhook
  // ============================================
  "http:request": {
    required: ["url", "method"],
    optional: ["headers", "body", "timeout", "auth"],
    description: "Make an HTTP request to any API endpoint",
    suggestedIcon: "globe",
    prompts: {
      url: {
        question: "What's the URL to call?",
        type: "url",
        placeholder: "https://api.example.com/endpoint",
        supportsVariables: true,
      },
      method: {
        question: "What HTTP method?",
        type: "select",
        options: [
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "PATCH", label: "PATCH" },
          { value: "DELETE", label: "DELETE" },
        ],
        defaultValue: "POST",
      },
      headers: {
        question: "Any custom headers? (Optional)",
        type: "json",
        placeholder: '{"Authorization": "Bearer xxx"}',
        supportsVariables: true,
        helpText: "JSON object with header key-value pairs",
      },
      body: {
        question: "Request body? (Optional)",
        type: "json",
        placeholder: '{"key": "value"}',
        supportsVariables: true,
        helpText: "JSON body for POST/PUT/PATCH requests",
      },
      timeout: {
        question: "Request timeout in ms? (Optional)",
        type: "number",
        placeholder: "30000",
        defaultValue: 30000,
        min: 1000,
        max: 120000,
      },
    },
  },

  // ============================================
  // Control Flow - Condition
  // ============================================
  "condition": {
    required: ["field", "operator", "value"],
    optional: ["logicOperator"],
    description: "Branch workflow based on a condition",
    suggestedIcon: "git-branch",
    prompts: {
      field: {
        question: "What field should I check?",
        type: "text",
        placeholder: "amount",
        supportsVariables: true,
        helpText: "Field from trigger data or previous step (e.g., $trigger.data.amount)",
      },
      operator: {
        question: "What comparison?",
        type: "select",
        options: [
          { value: "equals", label: "Equals (==)" },
          { value: "not_equals", label: "Not Equals (!=)" },
          { value: "greater_than", label: "Greater Than (>)" },
          { value: "greater_than_or_equal", label: "Greater Than or Equal (>=)" },
          { value: "less_than", label: "Less Than (<)" },
          { value: "less_than_or_equal", label: "Less Than or Equal (<=)" },
          { value: "contains", label: "Contains" },
          { value: "starts_with", label: "Starts With" },
          { value: "ends_with", label: "Ends With" },
          { value: "is_empty", label: "Is Empty" },
          { value: "is_not_empty", label: "Is Not Empty" },
        ],
        defaultValue: "equals",
      },
      value: {
        question: "What value to compare against?",
        type: "text",
        placeholder: "100",
        supportsVariables: true,
      },
    },
  },

  // ============================================
  // Control Flow - Delay
  // ============================================
  "delay": {
    required: ["duration"],
    optional: ["unit"],
    description: "Pause workflow execution for a specified time",
    suggestedIcon: "clock",
    prompts: {
      duration: {
        question: "How long should I wait?",
        type: "number",
        placeholder: "5",
        min: 1,
        helpText: "Duration value (works with the unit setting)",
      },
      unit: {
        question: "What time unit?",
        type: "select",
        options: [
          { value: "seconds", label: "Seconds" },
          { value: "minutes", label: "Minutes" },
          { value: "hours", label: "Hours" },
        ],
        defaultValue: "seconds",
      },
    },
  },

  // ============================================
  // Control Flow - Loop
  // ============================================
  "loop:foreach": {
    required: ["collection", "itemVariable"],
    optional: ["maxIterations"],
    description: "Loop through each item in a collection",
    suggestedIcon: "repeat",
    prompts: {
      collection: {
        question: "What collection should I loop through?",
        type: "text",
        placeholder: "$trigger.data.items",
        supportsVariables: true,
        helpText: "Array variable to iterate over",
      },
      itemVariable: {
        question: "What name for each item?",
        type: "text",
        placeholder: "item",
        helpText: "Variable name to access current item (e.g., $loop.item)",
        defaultValue: "item",
      },
      maxIterations: {
        question: "Maximum iterations? (Safety limit)",
        type: "number",
        placeholder: "100",
        min: 1,
        max: 1000,
        defaultValue: 100,
      },
    },
  },

  "loop:repeat": {
    required: ["count"],
    optional: ["indexVariable"],
    description: "Repeat actions a specific number of times",
    suggestedIcon: "repeat",
    prompts: {
      count: {
        question: "How many times should I repeat?",
        type: "number",
        placeholder: "5",
        min: 1,
        max: 1000,
        supportsVariables: true,
      },
      indexVariable: {
        question: "What name for the index variable?",
        type: "text",
        placeholder: "index",
        defaultValue: "index",
        helpText: "Variable name to access current iteration (e.g., $loop.index)",
      },
    },
  },

  // ============================================
  // Control Flow - Filter
  // ============================================
  "filter": {
    required: ["collection", "field", "operator", "value"],
    optional: [],
    description: "Filter items in a collection based on a condition",
    suggestedIcon: "filter",
    prompts: {
      collection: {
        question: "What collection should I filter?",
        type: "text",
        placeholder: "$trigger.data.items",
        supportsVariables: true,
      },
      field: {
        question: "Which field to check on each item?",
        type: "text",
        placeholder: "status",
        supportsVariables: false,
      },
      operator: {
        question: "What comparison?",
        type: "select",
        options: [
          { value: "equals", label: "Equals" },
          { value: "not_equals", label: "Not Equals" },
          { value: "greater_than", label: "Greater Than" },
          { value: "less_than", label: "Less Than" },
          { value: "contains", label: "Contains" },
        ],
        defaultValue: "equals",
      },
      value: {
        question: "Filter to items where field matches what value?",
        type: "text",
        placeholder: "active",
        supportsVariables: true,
      },
    },
  },

  // ============================================
  // Control Flow - Switch
  // ============================================
  "switch": {
    required: ["field", "cases"],
    optional: ["defaultCase"],
    description: "Route workflow based on multiple possible values",
    suggestedIcon: "git-branch",
    prompts: {
      field: {
        question: "What field should I check?",
        type: "text",
        placeholder: "$trigger.data.type",
        supportsVariables: true,
      },
      cases: {
        question: "What are the possible values and their targets?",
        type: "json",
        placeholder: '[{"value": "order", "target": "node1"}, {"value": "refund", "target": "node2"}]',
        helpText: "Array of {value, target} pairs mapping values to target nodes",
      },
      defaultCase: {
        question: "What's the default target if no match? (Optional)",
        type: "text",
        placeholder: "node3",
      },
    },
  },

  // ============================================
  // Data - Transform
  // ============================================
  "transform": {
    required: ["mappings"],
    optional: ["input"],
    description: "Transform and map data between steps",
    suggestedIcon: "shuffle",
    prompts: {
      input: {
        question: "What data should I transform? (Optional, defaults to previous step)",
        type: "text",
        placeholder: "$steps.previous.output",
        supportsVariables: true,
      },
      mappings: {
        question: "How should I map the fields?",
        type: "variable-mapper",
        placeholder: '{"outputField": "$input.sourceField"}',
        supportsVariables: true,
        helpText: "Define how input fields map to output fields",
      },
    },
  },

  // ============================================
  // Triggers
  // ============================================
  "trigger:webhook": {
    required: [],
    optional: ["expectedFields", "authentication"],
    description: "Trigger workflow when a webhook is received",
    suggestedIcon: "webhook",
    prompts: {
      expectedFields: {
        question: "What data fields will the webhook send?",
        type: "json",
        placeholder: '[{"name": "email", "type": "string"}, {"name": "amount", "type": "number"}]',
        helpText: "Define expected fields to enable variable suggestions in later steps",
      },
      authentication: {
        question: "How should I authenticate incoming requests? (Optional)",
        type: "select",
        options: [
          { value: "none", label: "No authentication" },
          { value: "secret", label: "Secret token in header" },
          { value: "hmac", label: "HMAC signature" },
        ],
        defaultValue: "none",
      },
    },
  },

  "trigger:schedule": {
    required: ["schedule"],
    optional: ["timezone"],
    description: "Trigger workflow on a schedule (cron)",
    suggestedIcon: "clock",
    prompts: {
      schedule: {
        question: "When should the workflow run?",
        type: "text",
        placeholder: "0 9 * * 1-5",
        helpText: "Cron expression (e.g., '0 9 * * 1-5' for weekdays at 9am)",
      },
      timezone: {
        question: "What timezone?",
        type: "text",
        placeholder: "America/New_York",
        defaultValue: "UTC",
      },
    },
  },

  "trigger:form": {
    required: ["formFields"],
    optional: ["successMessage"],
    description: "Trigger workflow when a form is submitted",
    suggestedIcon: "file-text",
    prompts: {
      formFields: {
        question: "What fields should the form have?",
        type: "json",
        placeholder: '[{"name": "email", "type": "email", "required": true}]',
        helpText: "Define form fields with name, type, and required status",
      },
      successMessage: {
        question: "What message to show after submission? (Optional)",
        type: "text",
        placeholder: "Thank you for your submission!",
        defaultValue: "Form submitted successfully!",
      },
    },
  },

  "trigger:manual": {
    required: [],
    optional: ["inputSchema"],
    description: "Manually trigger workflow with custom data",
    suggestedIcon: "play",
    prompts: {
      inputSchema: {
        question: "What data will you provide when triggering? (Optional)",
        type: "json",
        placeholder: '{"email": "string", "name": "string"}',
        helpText: "Define the shape of data you'll provide",
      },
    },
  },
};

/**
 * Get requirements for a node type
 */
export function getNodeRequirements(nodeType: string): NodeRequirements | null {
  return NODE_REQUIREMENTS[nodeType] || null;
}

/**
 * Check if a node type has requirements defined
 */
export function hasNodeRequirements(nodeType: string): boolean {
  return nodeType in NODE_REQUIREMENTS;
}

/**
 * Get all node types that require a specific integration
 */
export function getNodeTypesForIntegration(integrationType: string): string[] {
  return Object.entries(NODE_REQUIREMENTS)
    .filter(([, req]) => req.integrationRequired === integrationType)
    .map(([nodeType]) => nodeType);
}

/**
 * List all supported node types
 */
export function getSupportedNodeTypes(): string[] {
  return Object.keys(NODE_REQUIREMENTS);
}

/**
 * Zod schema for node configuration based on requirements
 */
export function createConfigSchemaForNode(nodeType: string): z.ZodObject<any> | null {
  const requirements = getNodeRequirements(nodeType);
  if (!requirements) return null;

  const schemaShape: Record<string, z.ZodTypeAny> = {};

  // Add required fields
  for (const field of requirements.required) {
    const prompt = requirements.prompts[field];
    if (prompt) {
      let fieldSchema: z.ZodTypeAny;
      switch (prompt.type) {
        case "number":
          fieldSchema = z.number();
          if (prompt.min !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(prompt.min);
          if (prompt.max !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(prompt.max);
          break;
        case "email":
          fieldSchema = z.string().email();
          break;
        case "url":
          fieldSchema = z.string().url();
          break;
        case "json":
          fieldSchema = z.string().or(z.record(z.any()));
          break;
        default:
          fieldSchema = z.string();
      }
      schemaShape[field] = fieldSchema.describe(prompt.question);
    } else {
      schemaShape[field] = z.string();
    }
  }

  // Add optional fields
  for (const field of requirements.optional || []) {
    const prompt = requirements.prompts[field];
    if (prompt) {
      let fieldSchema: z.ZodTypeAny;
      switch (prompt.type) {
        case "number":
          fieldSchema = z.number().optional();
          break;
        case "email":
          fieldSchema = z.string().email().optional();
          break;
        case "url":
          fieldSchema = z.string().url().optional();
          break;
        case "json":
          fieldSchema = z.string().or(z.record(z.any())).optional();
          break;
        default:
          fieldSchema = z.string().optional();
      }
      schemaShape[field] = fieldSchema.describe(prompt.question);
    } else {
      schemaShape[field] = z.string().optional();
    }
  }

  return z.object(schemaShape);
}
