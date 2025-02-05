import { MessageSquare, Mail, Webhook } from "lucide-react";
import type { IntegrationType, NotificationSetting } from "./types";

export const integrationTypes: IntegrationType[] = [
  { id: "slack", label: "Slack", icon: MessageSquare, color: "text-purple-500", category: "messaging" },
  { id: "discord", label: "Discord", icon: MessageSquare, color: "text-indigo-500", category: "messaging" },
  { id: "teams", label: "Microsoft Teams", icon: MessageSquare, color: "text-blue-600", category: "messaging" },
  { id: "email", label: "Email (Resend)", icon: Mail, color: "text-blue-500", category: "email" },
  { id: "smtp", label: "Email (SMTP)", icon: Mail, color: "text-gray-500", category: "email" },
  { id: "sendgrid", label: "Email (SendGrid)", icon: Mail, color: "text-blue-400", category: "email" },
  { id: "openai", label: "OpenAI", icon: MessageSquare, color: "text-emerald-500", category: "ai" },
  { id: "anthropic", label: "Anthropic Claude", icon: MessageSquare, color: "text-orange-500", category: "ai" },
  { id: "webhook", label: "Custom Webhook", icon: Webhook, color: "text-green-500", category: "utilities" },
  { id: "twilio", label: "Twilio (SMS)", icon: MessageSquare, color: "text-red-500", category: "utilities" },
  { id: "stripe", label: "Stripe (Payments)", icon: MessageSquare, color: "text-violet-500", category: "utilities" },
];

export const defaultNotifications: NotificationSetting[] = [
  { id: "workflow-success", label: "Workflow completed", description: "When a workflow runs successfully", enabled: true, category: "workflow" },
  { id: "workflow-fail", label: "Workflow failed", description: "When a workflow encounters an error", enabled: true, category: "workflow" },
  { id: "workflow-summary", label: "Daily summary", description: "Daily digest of all workflow activity", enabled: false, category: "workflow" },
  { id: "account-login", label: "New login detected", description: "When someone logs into your account", enabled: true, category: "account" },
  { id: "account-password", label: "Password changed", description: "When your password is updated", enabled: true, category: "account" },
  { id: "marketing-updates", label: "Product updates", description: "New features and improvements", enabled: false, category: "marketing" },
  { id: "marketing-tips", label: "Tips & tutorials", description: "Learn how to use FlowForge better", enabled: false, category: "marketing" },
];
