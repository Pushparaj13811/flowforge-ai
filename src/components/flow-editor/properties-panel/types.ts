export interface ConfigComponentProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  nodeId?: string;
}

export interface PropertiesPanelProps {
  className?: string;
}

export interface ExpectedField {
  name: string;
  type: string;
  description: string;
}

export interface FormFieldInfo {
  name: string;
  type: string;
  required: boolean;
}

export interface SwitchCase {
  value: string;
  label: string;
}

export interface TriggerData {
  webhookUrl: string;
  webhookToken: string;
  bearerToken: string | null;
  hmacSecret: string | null;
  authMethod: string;
}
