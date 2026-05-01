"use client";

import type { WorkflowNodeType } from "../types";
import {
  SlackConfig,
  EmailConfig,
  DiscordConfig,
  TeamsConfig,
  SMSConfig,
  OpenAIConfig,
  ClaudeConfig,
  WebhookConfig,
  StripeConfig,
  TransformConfig,
  ConditionConfig,
  SwitchConfig,
  FilterConfig,
  LoopConfig,
  DelayConfig,
  TriggerConfig,
} from "./config-forms";

export function getConfigComponent(
  label: string,
  icon: string | undefined,
  nodeType: WorkflowNodeType,
  config: Record<string, unknown>,
  onChange: (config: Record<string, unknown>) => void,
  nodeId?: string
) {
  const labelLower = label.toLowerCase();
  const iconLower = (icon || "").toLowerCase();

  // Also check handlerType from config if available
  const handlerType = ((config as any)?.handlerType as string || "").toLowerCase();

  // --- Match by label first (user-visible names) ---

  if (labelLower.includes("slack") || labelLower.includes("message-square")) {
    return <SlackConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("email") || labelLower.includes("mail") || labelLower.includes("resend") || labelLower.includes("sendgrid")) {
    return <EmailConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("discord")) {
    return <DiscordConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("teams") || labelLower.includes("microsoft")) {
    return <TeamsConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("sms") || labelLower.includes("twilio") || labelLower.includes("text message")) {
    return <SMSConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("openai") || labelLower.includes("gpt") || labelLower.includes("chatgpt")) {
    return <OpenAIConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("claude") || labelLower.includes("anthropic")) {
    return <ClaudeConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("stripe") || labelLower.includes("payment") || labelLower.includes("charge")) {
    return <StripeConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("transform") || labelLower.includes("map data") || labelLower.includes("format")) {
    return <TransformConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("webhook") || labelLower.includes("http") || labelLower.includes("api call") || labelLower.includes("request")) {
    if (nodeType === "trigger") {
      return <TriggerConfig config={config} onChange={onChange} icon={iconLower} />;
    }
    return <WebhookConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }

  // Logic nodes by label
  if (labelLower.includes("switch") || labelLower.includes("route")) {
    return <SwitchConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("filter")) {
    return <FilterConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("for each") || labelLower.includes("foreach") || labelLower.includes("iterate") || labelLower.includes("loop")) {
    return <LoopConfig config={config} onChange={onChange} nodeId={nodeId} loopType="foreach" />;
  }
  if (labelLower.includes("repeat")) {
    return <LoopConfig config={config} onChange={onChange} nodeId={nodeId} loopType="repeat" />;
  }
  if (labelLower.includes("condition") || labelLower.includes("check") || labelLower.includes("if ")) {
    return <ConditionConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("wait") || labelLower.includes("delay") || labelLower.includes("pause")) {
    return <DelayConfig config={config} onChange={onChange} />;
  }

  // --- Fallback: match by icon (for AI-created nodes with custom labels) ---

  switch (iconLower) {
    case "mail":
      return <EmailConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "slack":
    case "hash":
    case "message-square":
      return <SlackConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "globe":
      if (nodeType === "trigger") {
        return <TriggerConfig config={config} onChange={onChange} icon={iconLower} />;
      }
      return <WebhookConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "brain":
      return <OpenAIConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "table":
      return <WebhookConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "credit-card":
      return <StripeConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "phone":
      return <SMSConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "git-branch":
      return <ConditionConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "clock":
      if (nodeType === "trigger") {
        return <TriggerConfig config={config} onChange={onChange} icon={iconLower} />;
      }
      return <DelayConfig config={config} onChange={onChange} />;
    case "shuffle":
      return <TransformConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "filter":
      return <FilterConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "repeat":
      return <LoopConfig config={config} onChange={onChange} nodeId={nodeId} loopType="foreach" />;
    case "users":
      return <TeamsConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "webhook":
      if (nodeType === "trigger") {
        return <TriggerConfig config={config} onChange={onChange} icon={iconLower} />;
      }
      return <WebhookConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }

  // --- Final fallback: match by nodeType ---

  switch (nodeType) {
    case "trigger":
      return <TriggerConfig config={config} onChange={onChange} icon={iconLower} />;
    case "condition":
      return <ConditionConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "delay":
      return <DelayConfig config={config} onChange={onChange} />;
    case "loop":
      return <LoopConfig config={config} onChange={onChange} nodeId={nodeId} loopType="foreach" />;
    case "filter":
      return <FilterConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "transform":
      return <TransformConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "switch":
      return <SwitchConfig config={config} onChange={onChange} nodeId={nodeId} />;
    case "action":
      // Action nodes without a specific match - show HTTP config as generic
      return <WebhookConfig config={config} onChange={onChange} nodeId={nodeId} />;
    default:
      return null;
  }
}
