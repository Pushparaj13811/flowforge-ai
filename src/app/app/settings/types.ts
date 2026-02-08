export type SettingsSection = "profile" | "integrations" | "notifications" | "appearance" | "security" | "api-keys" | "help";

export interface Integration {
  id: string;
  type: string;
  name: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  category: "workflow" | "account" | "marketing";
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string; // Only returned on creation
  isActive: boolean;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface IntegrationType {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  category: string;
}
