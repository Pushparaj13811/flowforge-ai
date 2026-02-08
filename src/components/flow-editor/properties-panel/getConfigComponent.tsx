"use client";

import type { WorkflowNodeType } from "../types";
import {
  SlackConfig,
  EmailConfig,
  DiscordConfig,
  TeamsConfig,
  SMSConfig,
  PushNotificationConfig,
  OpenAIConfig,
  ClaudeConfig,
  WebhookConfig,
  GoogleSheetsConfig,
  GoogleDriveConfig,
  DropboxConfig,
  GitHubConfig,
  HubSpotConfig,
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

  // Check for specific integrations by label or icon
  if (labelLower.includes("slack")) {
    return <SlackConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("email") || labelLower.includes("mail") || iconLower === "mail") {
    return <EmailConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("discord")) {
    return <DiscordConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("teams")) {
    return <TeamsConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("sms") || labelLower.includes("twilio")) {
    return <SMSConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("openai") || labelLower.includes("gpt")) {
    return <OpenAIConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("claude") || labelLower.includes("anthropic")) {
    return <ClaudeConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("google sheets") || labelLower.includes("sheets")) {
    return <GoogleSheetsConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("google drive") || labelLower.includes("drive")) {
    return <GoogleDriveConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("dropbox")) {
    return <DropboxConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("github")) {
    return <GitHubConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("hubspot") || labelLower.includes("crm")) {
    return <HubSpotConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("stripe") || labelLower.includes("payment")) {
    return <StripeConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("push") || labelLower.includes("notification") || iconLower === "bell") {
    return <PushNotificationConfig config={config} onChange={onChange} />;
  }
  if (labelLower.includes("transform") || labelLower.includes("map") || labelLower.includes("format")) {
    return <TransformConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("webhook") || labelLower.includes("http") || iconLower === "globe" || iconLower === "webhook") {
    if (nodeType === "trigger") {
      return <TriggerConfig config={config} onChange={onChange} icon={iconLower} />;
    }
    return <WebhookConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }

  // Logic nodes
  if (labelLower.includes("switch")) {
    return <SwitchConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("filter")) {
    return <FilterConfig config={config} onChange={onChange} nodeId={nodeId} />;
  }
  if (labelLower.includes("for each") || labelLower.includes("foreach")) {
    return <LoopConfig config={config} onChange={onChange} nodeId={nodeId} loopType="foreach" />;
  }
  if (labelLower.includes("repeat")) {
    return <LoopConfig config={config} onChange={onChange} nodeId={nodeId} loopType="repeat" />;
  }

  // Check by node type
  switch (nodeType) {
    case "trigger":
      return <TriggerConfig config={config} onChange={onChange} icon={iconLower} />;
    case "condition":
      return <ConditionConfig config={config} onChange={onChange} />;
    case "delay":
      return <DelayConfig config={config} onChange={onChange} />;
    case "loop":
      return <LoopConfig config={config} onChange={onChange} nodeId={nodeId} loopType="foreach" />;
    default:
      return null;
  }
}
