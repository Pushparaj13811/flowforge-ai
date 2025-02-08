"use client";

import { withInteractable, useTamboThreadInput } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Webhook,
  Clock,
  GitBranch,
  Check,
  Sparkles,
  CreditCard,
  Phone,
  Brain,
  Table,
  Globe,
  Repeat,
  Filter,
  Shuffle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewBanner } from "@/components/ui/preview-banner";

/**
 * Extended Schema for NodeConfigurator props - supports all node types
 */
export const nodeConfiguratorSchema = z.object({
  nodeId: z.string().default("node-1").describe("Unique identifier for the node being configured"),
  nodeType: z.enum(["trigger", "action", "condition", "delay", "loop", "filter", "transform", "switch"]).default("action").describe("Type of workflow node"),
  nodeLabel: z.string().default("Untitled Node").describe("Display name of the node"),

  // Action-specific configs
  actionType: z.enum([
    "slack", "email", "discord", "webhook", "teams", "sms",
    "openai", "claude", "google-sheets", "stripe", "http", "transform"
  ]).optional().describe("Type of action for action nodes"),

  // Integration ID (for nodes requiring connected integrations)
  integrationId: z.string().optional().describe("ID of the connected integration to use"),

  // Slack configuration
  slackChannel: z.string().optional().describe("Slack channel name (e.g., #general)"),
  slackMessage: z.string().optional().describe("Message to send to Slack"),

  // Email configuration
  emailTo: z.string().optional().describe("Recipient email address"),
  emailSubject: z.string().optional().describe("Email subject line"),
  emailBody: z.string().optional().describe("Email message body"),
  emailFrom: z.string().optional().describe("Sender email address"),

  // Discord configuration
  discordWebhookUrl: z.string().optional().describe("Discord webhook URL"),
  discordMessage: z.string().optional().describe("Message to send to Discord"),

  // Teams configuration
  teamsWebhookUrl: z.string().optional().describe("Teams webhook URL"),
  teamsMessage: z.string().optional().describe("Message to send to Teams"),
  teamsTitle: z.string().optional().describe("Message card title"),

  // SMS/Twilio configuration
  smsTo: z.string().optional().describe("Recipient phone number"),
  smsBody: z.string().optional().describe("SMS message content"),
  smsFrom: z.string().optional().describe("Sender phone number"),

  // HTTP/Webhook configuration
  webhookUrl: z.string().optional().describe("HTTP webhook URL"),
  webhookMethod: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional().describe("HTTP method"),
  webhookHeaders: z.string().optional().describe("JSON string of HTTP headers"),
  webhookBody: z.string().optional().describe("Request body (JSON)"),

  // OpenAI configuration
  openaiPrompt: z.string().optional().describe("Prompt for OpenAI"),
  openaiModel: z.enum(["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]).optional().describe("OpenAI model"),
  openaiMaxTokens: z.number().optional().describe("Maximum tokens in response"),
  openaiTemperature: z.number().optional().describe("Temperature (0-2)"),
  openaiSystemPrompt: z.string().optional().describe("System prompt"),

  // Claude configuration
  claudePrompt: z.string().optional().describe("Prompt for Claude"),
  claudeModel: z.enum(["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"]).optional().describe("Claude model"),
  claudeMaxTokens: z.number().optional().describe("Maximum tokens in response"),

  // Google Sheets configuration
  sheetsSpreadsheetId: z.string().optional().describe("Google Sheets spreadsheet ID"),
  sheetsRange: z.string().optional().describe("Cell range (e.g., Sheet1!A1:D10)"),
  sheetsOperation: z.enum(["read", "append", "update"]).optional().describe("Operation type"),
  sheetsValues: z.string().optional().describe("Values to write (JSON array)"),

  // Stripe configuration
  stripeAmount: z.number().optional().describe("Amount in cents"),
  stripeCurrency: z.enum(["usd", "eur", "gbp", "cad", "aud"]).optional().describe("Currency"),
  stripeCustomerId: z.string().optional().describe("Stripe customer ID"),
  stripeDescription: z.string().optional().describe("Payment description"),
  stripeOperation: z.enum(["create-payment-intent", "create-customer", "refund"]).optional().describe("Stripe operation"),

  // Condition configuration
  conditionField: z.string().optional().describe("Field name to check in condition"),
  conditionOperator: z.enum([
    "equals", "not_equals", "greater_than", "greater_than_or_equal",
    "less_than", "less_than_or_equal", "contains", "starts_with",
    "ends_with", "is_empty", "is_not_empty"
  ]).optional().describe("Comparison operator"),
  conditionValue: z.string().optional().describe("Value to compare against"),

  // Delay configuration
  delayDuration: z.number().optional().describe("Duration to wait"),
  delayUnit: z.enum(["seconds", "minutes", "hours"]).optional().describe("Time unit"),
  delayReason: z.string().optional().describe("Reason for the delay"),

  // Loop configuration
  loopCollection: z.string().optional().describe("Collection to iterate over"),
  loopItemVariable: z.string().optional().describe("Variable name for current item"),
  loopMaxIterations: z.number().optional().describe("Maximum iterations"),
  loopType: z.enum(["foreach", "repeat"]).optional().describe("Loop type"),
  loopCount: z.number().optional().describe("Number of times to repeat (for repeat loops)"),

  // Filter configuration
  filterCollection: z.string().optional().describe("Collection to filter"),
  filterField: z.string().optional().describe("Field to check"),
  filterOperator: z.enum(["equals", "not_equals", "greater_than", "less_than", "contains"]).optional().describe("Filter operator"),
  filterValue: z.string().optional().describe("Value to filter by"),

  // Transform configuration
  transformInput: z.string().optional().describe("Input data source"),
  transformMappings: z.string().optional().describe("Field mappings (JSON)"),

  // Switch configuration
  switchField: z.string().optional().describe("Field to check for switch"),
  switchCases: z.string().optional().describe("Cases configuration (JSON)"),
  switchDefault: z.string().optional().describe("Default target node"),

  // Visual state
  isHighlighted: z.boolean().optional().describe("Whether to highlight changed fields"),
});

type NodeConfiguratorProps = z.infer<typeof nodeConfiguratorSchema>;

/**
 * Icon mapping for node types
 */
const ICON_MAP: Record<string, typeof Sparkles> = {
  slack: MessageSquare,
  discord: MessageSquare,
  teams: Users,
  email: Mail,
  webhook: Webhook,
  http: Globe,
  sms: Phone,
  openai: Brain,
  claude: Brain,
  "google-sheets": Table,
  stripe: CreditCard,
  transform: Shuffle,
  trigger: Webhook,
  condition: GitBranch,
  delay: Clock,
  loop: Repeat,
  filter: Filter,
  switch: GitBranch,
};

/**
 * Get icon for node type
 */
function getNodeIcon(nodeType: string, actionType?: string) {
  if (nodeType === "action" && actionType) {
    return ICON_MAP[actionType] || Sparkles;
  }
  return ICON_MAP[nodeType] || Sparkles;
}

/**
 * Get color for node type
 */
function getNodeColor(nodeType: string) {
  switch (nodeType) {
    case "trigger":
      return "text-flow-orange bg-flow-orange/10 border-flow-orange/20";
    case "action":
      return "text-flow-blue bg-flow-blue/10 border-flow-blue/20";
    case "condition":
    case "switch":
      return "text-flow-purple bg-flow-purple/10 border-flow-purple/20";
    case "delay":
      return "text-flow-yellow bg-flow-yellow/10 border-flow-yellow/20";
    case "loop":
    case "filter":
    case "transform":
      return "text-flow-green bg-flow-green/10 border-flow-green/20";
    default:
      return "text-flow-blue bg-flow-blue/10 border-flow-blue/20";
  }
}

/**
 * Reusable input field component
 */
function ConfigField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  isHighlighted,
  helpText,
  required,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "email" | "url" | "textarea";
  isHighlighted?: boolean;
  helpText?: string;
  required?: boolean;
}) {
  const baseClass = cn(
    "w-full px-3 py-2 rounded-lg bg-background border border-border",
    "focus:outline-none focus:ring-2 focus:ring-flow-blue/50",
    "transition-all duration-200 text-sm",
    isHighlighted && "animate-pulse ring-2 ring-flow-green"
  );

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cn(baseClass, "resize-none")}
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
      {helpText && (
        <p className="mt-1 text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Reusable select field component
 */
function SelectField({
  label,
  value,
  onChange,
  options,
  isHighlighted,
  helpText,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  isHighlighted?: boolean;
  helpText?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <select
        value={value || options[0]?.value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 rounded-lg bg-background border border-border",
          "focus:outline-none focus:ring-2 focus:ring-flow-blue/50",
          "transition-all duration-200 text-sm",
          isHighlighted && "animate-pulse ring-2 ring-flow-green"
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {helpText && (
        <p className="mt-1 text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Base NodeConfigurator component
 */
function NodeConfiguratorBase(props: NodeConfiguratorProps) {
  // Ensure required fields have defaults
  const initialConfig: NodeConfiguratorProps = {
    ...props,
    nodeId: props.nodeId || "node-1",
    nodeType: props.nodeType || "action",
    nodeLabel: props.nodeLabel || "Untitled Node",
  };

  const [config, setConfig] = useState<NodeConfiguratorProps>(initialConfig);
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
  const prevPropsRef = useRef<NodeConfiguratorProps>(initialConfig);
  const [isCreating, setIsCreating] = useState(false);

  // Use Tambo thread input to send messages to AI
  let threadInput: ReturnType<typeof useTamboThreadInput> | null = null;
  try {
    threadInput = useTamboThreadInput();
  } catch {
    // Hook may not be available if not inside TamboThreadInputProvider
  }

  // Handler for the "Create Workflow" button
  const handleCreateWorkflow = () => {
    if (isCreating) return;
    setIsCreating(true);

    // Build the configuration object from current state
    const configData: Record<string, unknown> = {
      nodeId: config.nodeId,
      nodeType: config.nodeType,
      nodeLabel: config.nodeLabel,
      actionType: config.actionType,
    };

    // Add action-specific config based on action type
    if (config.actionType === "email") {
      configData.to = config.emailTo;
      configData.subject = config.emailSubject;
      configData.body = config.emailBody;
      if (config.emailFrom) configData.from = config.emailFrom;
    } else if (config.actionType === "slack") {
      configData.channel = config.slackChannel;
      configData.message = config.slackMessage;
    } else if (config.actionType === "discord") {
      configData.webhookUrl = config.discordWebhookUrl;
      configData.content = config.discordMessage;
    } else if (config.actionType === "webhook" || config.actionType === "http") {
      configData.url = config.webhookUrl;
      configData.method = config.webhookMethod;
      configData.body = config.webhookBody;
    }

    // Send a message to AI to create the workflow
    if (threadInput && threadInput.setValue && threadInput.submit) {
      const message = `Please create the workflow now with this configuration: ${JSON.stringify(configData)}`;
      threadInput.setValue(message);
      // Small delay to ensure value is set before submitting
      setTimeout(() => {
        threadInput?.submit?.();
        setIsCreating(false);
      }, 100);
    } else {
      // Fallback: dispatch custom event for other listeners
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('create-workflow-request', {
          detail: { config: configData }
        });
        window.dispatchEvent(event);
      }
      setIsCreating(false);
    }
  };

  // Update state when props change (AI updates)
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    const changedFields = new Set<string>();

    // Ensure defaults are applied to new props
    const newConfig: NodeConfiguratorProps = {
      ...props,
      nodeId: props.nodeId || "node-1",
      nodeType: props.nodeType || "action",
      nodeLabel: props.nodeLabel || "Untitled Node",
    };

    Object.keys(newConfig).forEach((key) => {
      const propKey = key as keyof NodeConfiguratorProps;
      if (newConfig[propKey] !== prevProps[propKey]) {
        changedFields.add(key);
      }
    });

    if (changedFields.size > 0) {
      setConfig(newConfig);
      setUpdatedFields(changedFields);
      prevPropsRef.current = newConfig;

      const timer = setTimeout(() => setUpdatedFields(new Set()), 1000);
      return () => clearTimeout(timer);
    }
  }, [props]);

  const handleChange = (updates: Partial<NodeConfiguratorProps>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const NodeIcon = getNodeIcon(config.nodeType, config.actionType);
  const colorClass = getNodeColor(config.nodeType);

  const isFieldHighlighted = (field: string) => updatedFields.has(field);

  return (
    <>
      <PreviewBanner
        componentName="node configurator"
        onCreateWorkflow={handleCreateWorkflow}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass border border-glass-border rounded-xl p-6 max-w-2xl shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border", colorClass)}>
            <NodeIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{config.nodeLabel || "Untitled Node"}</h3>
            <p className="text-xs text-muted-foreground">
              {(config.nodeType || "action").charAt(0).toUpperCase() + (config.nodeType || "action").slice(1)} Node
              {config.actionType && ` • ${config.actionType.charAt(0).toUpperCase() + config.actionType.slice(1)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-flow-green animate-pulse" />
            <span className="text-xs text-muted-foreground">Ready</span>
          </div>
        </div>

        {/* Configuration Fields */}
        <div className="space-y-4">
          {/* SLACK */}
          {config.nodeType === "action" && config.actionType === "slack" && (
            <>
              <ConfigField
                label="Slack Channel"
                value={config.slackChannel}
                onChange={(v) => handleChange({ slackChannel: v })}
                placeholder="#general"
                isHighlighted={isFieldHighlighted("slackChannel")}
                helpText="Enter a channel name or use a variable"
                required
              />
              <ConfigField
                label="Message"
                value={config.slackMessage}
                onChange={(v) => handleChange({ slackMessage: v })}
                placeholder="Enter your message..."
                type="textarea"
                isHighlighted={isFieldHighlighted("slackMessage")}
                helpText="Use {{$trigger.data.field}} for dynamic content"
                required
              />
            </>
          )}

          {/* EMAIL */}
          {config.nodeType === "action" && config.actionType === "email" && (
            <>
              <ConfigField
                label="To"
                value={config.emailTo}
                onChange={(v) => handleChange({ emailTo: v })}
                placeholder="recipient@example.com"
                type="email"
                isHighlighted={isFieldHighlighted("emailTo")}
                required
              />
              <ConfigField
                label="Subject"
                value={config.emailSubject}
                onChange={(v) => handleChange({ emailSubject: v })}
                placeholder="Email subject..."
                isHighlighted={isFieldHighlighted("emailSubject")}
                required
              />
              <ConfigField
                label="Body"
                value={config.emailBody}
                onChange={(v) => handleChange({ emailBody: v })}
                placeholder="Email message..."
                type="textarea"
                isHighlighted={isFieldHighlighted("emailBody")}
                helpText="Supports HTML formatting"
                required
              />
              <ConfigField
                label="From (Optional)"
                value={config.emailFrom}
                onChange={(v) => handleChange({ emailFrom: v })}
                placeholder="sender@yourdomain.com"
                type="email"
                isHighlighted={isFieldHighlighted("emailFrom")}
                helpText="Defaults to platform sender if not specified"
              />
            </>
          )}

          {/* DISCORD */}
          {config.nodeType === "action" && config.actionType === "discord" && (
            <>
              <ConfigField
                label="Webhook URL"
                value={config.discordWebhookUrl}
                onChange={(v) => handleChange({ discordWebhookUrl: v })}
                placeholder="https://discord.com/api/webhooks/..."
                type="url"
                isHighlighted={isFieldHighlighted("discordWebhookUrl")}
                required
              />
              <ConfigField
                label="Message"
                value={config.discordMessage}
                onChange={(v) => handleChange({ discordMessage: v })}
                placeholder="Enter your message..."
                type="textarea"
                isHighlighted={isFieldHighlighted("discordMessage")}
                required
              />
            </>
          )}

          {/* TEAMS */}
          {config.nodeType === "action" && config.actionType === "teams" && (
            <>
              <ConfigField
                label="Webhook URL"
                value={config.teamsWebhookUrl}
                onChange={(v) => handleChange({ teamsWebhookUrl: v })}
                placeholder="https://outlook.office.com/webhook/..."
                type="url"
                isHighlighted={isFieldHighlighted("teamsWebhookUrl")}
                required
              />
              <ConfigField
                label="Title (Optional)"
                value={config.teamsTitle}
                onChange={(v) => handleChange({ teamsTitle: v })}
                placeholder="Notification"
                isHighlighted={isFieldHighlighted("teamsTitle")}
              />
              <ConfigField
                label="Message"
                value={config.teamsMessage}
                onChange={(v) => handleChange({ teamsMessage: v })}
                placeholder="Enter your message..."
                type="textarea"
                isHighlighted={isFieldHighlighted("teamsMessage")}
                required
              />
            </>
          )}

          {/* SMS/TWILIO */}
          {config.nodeType === "action" && config.actionType === "sms" && (
            <>
              <ConfigField
                label="To Phone Number"
                value={config.smsTo}
                onChange={(v) => handleChange({ smsTo: v })}
                placeholder="+1234567890"
                isHighlighted={isFieldHighlighted("smsTo")}
                helpText="Include country code"
                required
              />
              <ConfigField
                label="Message"
                value={config.smsBody}
                onChange={(v) => handleChange({ smsBody: v })}
                placeholder="Your SMS message..."
                type="textarea"
                isHighlighted={isFieldHighlighted("smsBody")}
                helpText="Keep under 160 characters for single SMS"
                required
              />
              <ConfigField
                label="From Number (Optional)"
                value={config.smsFrom}
                onChange={(v) => handleChange({ smsFrom: v })}
                placeholder="+1234567890"
                isHighlighted={isFieldHighlighted("smsFrom")}
                helpText="Defaults to your Twilio number"
              />
            </>
          )}

          {/* HTTP/WEBHOOK */}
          {config.nodeType === "action" && (config.actionType === "webhook" || config.actionType === "http") && (
            <>
              <ConfigField
                label="URL"
                value={config.webhookUrl}
                onChange={(v) => handleChange({ webhookUrl: v })}
                placeholder="https://api.example.com/endpoint"
                type="url"
                isHighlighted={isFieldHighlighted("webhookUrl")}
                required
              />
              <SelectField
                label="Method"
                value={config.webhookMethod}
                onChange={(v) => handleChange({ webhookMethod: v as any })}
                options={[
                  { value: "GET", label: "GET" },
                  { value: "POST", label: "POST" },
                  { value: "PUT", label: "PUT" },
                  { value: "PATCH", label: "PATCH" },
                  { value: "DELETE", label: "DELETE" },
                ]}
                isHighlighted={isFieldHighlighted("webhookMethod")}
              />
              <ConfigField
                label="Headers (JSON)"
                value={config.webhookHeaders}
                onChange={(v) => handleChange({ webhookHeaders: v })}
                placeholder='{"Authorization": "Bearer xxx"}'
                type="textarea"
                isHighlighted={isFieldHighlighted("webhookHeaders")}
              />
              <ConfigField
                label="Body (JSON)"
                value={config.webhookBody}
                onChange={(v) => handleChange({ webhookBody: v })}
                placeholder='{"key": "value"}'
                type="textarea"
                isHighlighted={isFieldHighlighted("webhookBody")}
              />
            </>
          )}

          {/* OPENAI */}
          {config.nodeType === "action" && config.actionType === "openai" && (
            <>
              <ConfigField
                label="Prompt"
                value={config.openaiPrompt}
                onChange={(v) => handleChange({ openaiPrompt: v })}
                placeholder="Enter your prompt..."
                type="textarea"
                isHighlighted={isFieldHighlighted("openaiPrompt")}
                helpText="Use variables from previous steps"
                required
              />
              <SelectField
                label="Model"
                value={config.openaiModel}
                onChange={(v) => handleChange({ openaiModel: v as any })}
                options={[
                  { value: "gpt-4o", label: "GPT-4o (Most capable)" },
                  { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast & affordable)" },
                  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
                  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Legacy)" },
                ]}
                isHighlighted={isFieldHighlighted("openaiModel")}
              />
              <div className="grid grid-cols-2 gap-4">
                <ConfigField
                  label="Max Tokens"
                  value={config.openaiMaxTokens}
                  onChange={(v) => handleChange({ openaiMaxTokens: parseInt(v) || undefined })}
                  placeholder="1000"
                  type="number"
                  isHighlighted={isFieldHighlighted("openaiMaxTokens")}
                />
                <ConfigField
                  label="Temperature"
                  value={config.openaiTemperature}
                  onChange={(v) => handleChange({ openaiTemperature: parseFloat(v) || undefined })}
                  placeholder="0.7"
                  type="number"
                  isHighlighted={isFieldHighlighted("openaiTemperature")}
                  helpText="0 = focused, 2 = creative"
                />
              </div>
              <ConfigField
                label="System Prompt (Optional)"
                value={config.openaiSystemPrompt}
                onChange={(v) => handleChange({ openaiSystemPrompt: v })}
                placeholder="You are a helpful assistant..."
                type="textarea"
                isHighlighted={isFieldHighlighted("openaiSystemPrompt")}
              />
            </>
          )}

          {/* CLAUDE */}
          {config.nodeType === "action" && config.actionType === "claude" && (
            <>
              <ConfigField
                label="Prompt"
                value={config.claudePrompt}
                onChange={(v) => handleChange({ claudePrompt: v })}
                placeholder="Enter your prompt..."
                type="textarea"
                isHighlighted={isFieldHighlighted("claudePrompt")}
                required
              />
              <SelectField
                label="Model"
                value={config.claudeModel}
                onChange={(v) => handleChange({ claudeModel: v as any })}
                options={[
                  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Recommended)" },
                  { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Most capable)" },
                  { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku (Fastest)" },
                ]}
                isHighlighted={isFieldHighlighted("claudeModel")}
              />
              <ConfigField
                label="Max Tokens"
                value={config.claudeMaxTokens}
                onChange={(v) => handleChange({ claudeMaxTokens: parseInt(v) || undefined })}
                placeholder="1000"
                type="number"
                isHighlighted={isFieldHighlighted("claudeMaxTokens")}
              />
            </>
          )}

          {/* GOOGLE SHEETS */}
          {config.nodeType === "action" && config.actionType === "google-sheets" && (
            <>
              <ConfigField
                label="Spreadsheet ID"
                value={config.sheetsSpreadsheetId}
                onChange={(v) => handleChange({ sheetsSpreadsheetId: v })}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                isHighlighted={isFieldHighlighted("sheetsSpreadsheetId")}
                helpText="Found in the spreadsheet URL after /d/"
                required
              />
              <SelectField
                label="Operation"
                value={config.sheetsOperation}
                onChange={(v) => handleChange({ sheetsOperation: v as any })}
                options={[
                  { value: "read", label: "Read data" },
                  { value: "append", label: "Append rows" },
                  { value: "update", label: "Update cells" },
                ]}
                isHighlighted={isFieldHighlighted("sheetsOperation")}
              />
              <ConfigField
                label="Range"
                value={config.sheetsRange}
                onChange={(v) => handleChange({ sheetsRange: v })}
                placeholder="Sheet1!A1:D10"
                isHighlighted={isFieldHighlighted("sheetsRange")}
                helpText="Use A1 notation"
                required
              />
              {config.sheetsOperation !== "read" && (
                <ConfigField
                  label="Values (JSON)"
                  value={config.sheetsValues}
                  onChange={(v) => handleChange({ sheetsValues: v })}
                  placeholder='[["value1", "value2"]]'
                  type="textarea"
                  isHighlighted={isFieldHighlighted("sheetsValues")}
                  helpText="2D array of values"
                />
              )}
            </>
          )}

          {/* STRIPE */}
          {config.nodeType === "action" && config.actionType === "stripe" && (
            <>
              <SelectField
                label="Operation"
                value={config.stripeOperation}
                onChange={(v) => handleChange({ stripeOperation: v as any })}
                options={[
                  { value: "create-payment-intent", label: "Create Payment Intent" },
                  { value: "create-customer", label: "Create Customer" },
                  { value: "refund", label: "Refund Payment" },
                ]}
                isHighlighted={isFieldHighlighted("stripeOperation")}
              />
              {config.stripeOperation === "create-payment-intent" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <ConfigField
                      label="Amount (cents)"
                      value={config.stripeAmount}
                      onChange={(v) => handleChange({ stripeAmount: parseInt(v) || undefined })}
                      placeholder="1000"
                      type="number"
                      isHighlighted={isFieldHighlighted("stripeAmount")}
                      helpText="1000 = $10.00"
                      required
                    />
                    <SelectField
                      label="Currency"
                      value={config.stripeCurrency}
                      onChange={(v) => handleChange({ stripeCurrency: v as any })}
                      options={[
                        { value: "usd", label: "USD" },
                        { value: "eur", label: "EUR" },
                        { value: "gbp", label: "GBP" },
                        { value: "cad", label: "CAD" },
                        { value: "aud", label: "AUD" },
                      ]}
                      isHighlighted={isFieldHighlighted("stripeCurrency")}
                    />
                  </div>
                  <ConfigField
                    label="Customer ID (Optional)"
                    value={config.stripeCustomerId}
                    onChange={(v) => handleChange({ stripeCustomerId: v })}
                    placeholder="cus_xxxxx"
                    isHighlighted={isFieldHighlighted("stripeCustomerId")}
                  />
                  <ConfigField
                    label="Description (Optional)"
                    value={config.stripeDescription}
                    onChange={(v) => handleChange({ stripeDescription: v })}
                    placeholder="Payment for order #123"
                    isHighlighted={isFieldHighlighted("stripeDescription")}
                  />
                </>
              )}
            </>
          )}

          {/* CONDITION */}
          {config.nodeType === "condition" && (
            <>
              <ConfigField
                label="Field"
                value={config.conditionField}
                onChange={(v) => handleChange({ conditionField: v })}
                placeholder="e.g., $trigger.data.amount"
                isHighlighted={isFieldHighlighted("conditionField")}
                helpText="Variable or field to check"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Operator"
                  value={config.conditionOperator}
                  onChange={(v) => handleChange({ conditionOperator: v as any })}
                  options={[
                    { value: "equals", label: "Equals" },
                    { value: "not_equals", label: "Not Equals" },
                    { value: "greater_than", label: "Greater Than" },
                    { value: "greater_than_or_equal", label: "Greater or Equal" },
                    { value: "less_than", label: "Less Than" },
                    { value: "less_than_or_equal", label: "Less or Equal" },
                    { value: "contains", label: "Contains" },
                    { value: "starts_with", label: "Starts With" },
                    { value: "ends_with", label: "Ends With" },
                    { value: "is_empty", label: "Is Empty" },
                    { value: "is_not_empty", label: "Is Not Empty" },
                  ]}
                  isHighlighted={isFieldHighlighted("conditionOperator")}
                />
                <ConfigField
                  label="Value"
                  value={config.conditionValue}
                  onChange={(v) => handleChange({ conditionValue: v })}
                  placeholder="Value to compare"
                  isHighlighted={isFieldHighlighted("conditionValue")}
                />
              </div>
            </>
          )}

          {/* DELAY */}
          {config.nodeType === "delay" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <ConfigField
                  label="Duration"
                  value={config.delayDuration}
                  onChange={(v) => handleChange({ delayDuration: parseInt(v) || undefined })}
                  placeholder="5"
                  type="number"
                  isHighlighted={isFieldHighlighted("delayDuration")}
                  required
                />
                <SelectField
                  label="Unit"
                  value={config.delayUnit}
                  onChange={(v) => handleChange({ delayUnit: v as any })}
                  options={[
                    { value: "seconds", label: "Seconds" },
                    { value: "minutes", label: "Minutes" },
                    { value: "hours", label: "Hours" },
                  ]}
                  isHighlighted={isFieldHighlighted("delayUnit")}
                />
              </div>
              <ConfigField
                label="Reason (Optional)"
                value={config.delayReason}
                onChange={(v) => handleChange({ delayReason: v })}
                placeholder="Wait for rate limit"
                isHighlighted={isFieldHighlighted("delayReason")}
              />
            </>
          )}

          {/* LOOP */}
          {config.nodeType === "loop" && (
            <>
              <SelectField
                label="Loop Type"
                value={config.loopType}
                onChange={(v) => handleChange({ loopType: v as any })}
                options={[
                  { value: "foreach", label: "For Each (iterate collection)" },
                  { value: "repeat", label: "Repeat (fixed count)" },
                ]}
                isHighlighted={isFieldHighlighted("loopType")}
              />
              {config.loopType === "foreach" ? (
                <>
                  <ConfigField
                    label="Collection"
                    value={config.loopCollection}
                    onChange={(v) => handleChange({ loopCollection: v })}
                    placeholder="$trigger.data.items"
                    isHighlighted={isFieldHighlighted("loopCollection")}
                    helpText="Array to iterate over"
                    required
                  />
                  <ConfigField
                    label="Item Variable Name"
                    value={config.loopItemVariable}
                    onChange={(v) => handleChange({ loopItemVariable: v })}
                    placeholder="item"
                    isHighlighted={isFieldHighlighted("loopItemVariable")}
                    helpText="Access as $loop.item"
                  />
                </>
              ) : (
                <ConfigField
                  label="Repeat Count"
                  value={config.loopCount}
                  onChange={(v) => handleChange({ loopCount: parseInt(v) || undefined })}
                  placeholder="5"
                  type="number"
                  isHighlighted={isFieldHighlighted("loopCount")}
                  required
                />
              )}
              <ConfigField
                label="Max Iterations (Safety)"
                value={config.loopMaxIterations}
                onChange={(v) => handleChange({ loopMaxIterations: parseInt(v) || undefined })}
                placeholder="100"
                type="number"
                isHighlighted={isFieldHighlighted("loopMaxIterations")}
              />
            </>
          )}

          {/* FILTER */}
          {config.nodeType === "filter" && (
            <>
              <ConfigField
                label="Collection"
                value={config.filterCollection}
                onChange={(v) => handleChange({ filterCollection: v })}
                placeholder="$trigger.data.items"
                isHighlighted={isFieldHighlighted("filterCollection")}
                required
              />
              <ConfigField
                label="Field"
                value={config.filterField}
                onChange={(v) => handleChange({ filterField: v })}
                placeholder="status"
                isHighlighted={isFieldHighlighted("filterField")}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Operator"
                  value={config.filterOperator}
                  onChange={(v) => handleChange({ filterOperator: v as any })}
                  options={[
                    { value: "equals", label: "Equals" },
                    { value: "not_equals", label: "Not Equals" },
                    { value: "greater_than", label: "Greater Than" },
                    { value: "less_than", label: "Less Than" },
                    { value: "contains", label: "Contains" },
                  ]}
                  isHighlighted={isFieldHighlighted("filterOperator")}
                />
                <ConfigField
                  label="Value"
                  value={config.filterValue}
                  onChange={(v) => handleChange({ filterValue: v })}
                  placeholder="active"
                  isHighlighted={isFieldHighlighted("filterValue")}
                />
              </div>
            </>
          )}

          {/* TRANSFORM */}
          {config.nodeType === "transform" || (config.nodeType === "action" && config.actionType === "transform") ? (
            <>
              <ConfigField
                label="Input (Optional)"
                value={config.transformInput}
                onChange={(v) => handleChange({ transformInput: v })}
                placeholder="$steps.previous.output"
                isHighlighted={isFieldHighlighted("transformInput")}
                helpText="Defaults to previous step output"
              />
              <ConfigField
                label="Mappings (JSON)"
                value={config.transformMappings}
                onChange={(v) => handleChange({ transformMappings: v })}
                placeholder='{"newField": "$input.oldField"}'
                type="textarea"
                isHighlighted={isFieldHighlighted("transformMappings")}
                helpText="Map input fields to output fields"
                required
              />
            </>
          ) : null}

          {/* SWITCH */}
          {config.nodeType === "switch" && (
            <>
              <ConfigField
                label="Field to Check"
                value={config.switchField}
                onChange={(v) => handleChange({ switchField: v })}
                placeholder="$trigger.data.type"
                isHighlighted={isFieldHighlighted("switchField")}
                required
              />
              <ConfigField
                label="Cases (JSON)"
                value={config.switchCases}
                onChange={(v) => handleChange({ switchCases: v })}
                placeholder='[{"value": "order", "target": "node1"}]'
                type="textarea"
                isHighlighted={isFieldHighlighted("switchCases")}
                helpText="Array of {value, target} pairs"
                required
              />
              <ConfigField
                label="Default Target (Optional)"
                value={config.switchDefault}
                onChange={(v) => handleChange({ switchDefault: v })}
                placeholder="node3"
                isHighlighted={isFieldHighlighted("switchDefault")}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-flow-green" />
              <span>Configuration ready</span>
            </div>
            <span className="font-mono">{config.nodeId}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/**
 * Wrapped interactable component
 */
export const NodeConfigurator = withInteractable(NodeConfiguratorBase, {
  componentName: "NodeConfigurator",
  description: `Interactive node configuration panel for ALL workflow node types.

Supports configuration for:
- **Messaging**: Slack, Discord, Teams, Email, SMS (Twilio)
- **AI**: OpenAI (GPT-4o, GPT-4, GPT-3.5), Claude (Opus, Sonnet, Haiku)
- **Data**: Google Sheets (read, append, update), HTTP/Webhook
- **Payments**: Stripe (payment intents, customers, refunds)
- **Control Flow**: Condition, Delay, Loop (foreach/repeat), Filter, Switch, Transform

Use this when the user wants to configure any node in their workflow.
The AI can update any field and the component will animate changes with a green pulse effect.
Fields are conditional based on nodeType and actionType - only relevant fields are shown.`,
  propsSchema: nodeConfiguratorSchema,
});
