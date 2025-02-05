import type { LucideIcon } from "lucide-react";

export interface IntegrationCategory {
  id: string;
  label: string;
  description: string;
}

export interface IntegrationType {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  category: string;
  authType: "api_key" | "oauth" | "webhook" | "credentials";
  fields: IntegrationField[];
  docsUrl?: string;
  features?: string[];
}

export interface IntegrationField {
  key: string;
  label: string;
  type: "text" | "password" | "email" | "url" | "select" | "textarea";
  placeholder?: string;
  hint?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface Integration {
  id: string;
  type: string;
  name: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  config?: Record<string, unknown>;
}

export interface PlatformUsage {
  email?: number;
  sms?: number;
  ai?: number;
}

export interface PlatformLimits {
  email: number;
  sms: number;
  ai: number;
}
