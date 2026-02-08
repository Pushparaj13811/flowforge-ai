/**
 * @file config-normalizer.ts
 * @description Middleware that normalizes node configurations before handler execution
 * Handles operator mapping, default values, and field type validation
 */

/**
 * Operator mapping from old UI values to handler-compatible values
 */
const OPERATOR_MAP: Record<string, string> = {
  // Old short form -> New standard form
  eq: "equals",
  ne: "not_equals",
  gt: "greater_than",
  gte: "greater_than_or_equal",
  lt: "less_than",
  lte: "less_than_or_equal",

  // Already correct - pass through
  equals: "equals",
  not_equals: "not_equals",
  greater_than: "greater_than",
  greater_than_or_equal: "greater_than_or_equal",
  less_than: "less_than",
  less_than_or_equal: "less_than_or_equal",
  contains: "contains",
  not_contains: "not_contains",
  starts_with: "starts_with",
  startsWith: "starts_with",
  ends_with: "ends_with",
  endsWith: "ends_with",
  is_empty: "is_empty",
  isEmpty: "is_empty",
  is_not_empty: "is_not_empty",
  isNotEmpty: "is_not_empty",

  // Symbol operators -> word form
  "==": "equals",
  "===": "equals",
  "!=": "not_equals",
  "!==": "not_equals",
  ">": "greater_than",
  ">=": "greater_than_or_equal",
  "<": "less_than",
  "<=": "less_than_or_equal",
};

/**
 * Normalize an operator value to handler-compatible format
 */
export function normalizeOperator(operator: string | undefined): string {
  if (!operator) return "equals";
  return OPERATOR_MAP[operator] || operator;
}

/**
 * Default values for various node types
 */
const NODE_DEFAULTS: Record<string, Record<string, unknown>> = {
  delay: {
    unit: "seconds",
    duration: 5,
  },
  condition: {
    operator: "equals",
  },
  filter: {
    operator: "equals",
  },
  "loop:foreach": {
    itemVariable: "item",
    maxIterations: 100,
  },
  "loop:repeat": {
    indexVariable: "index",
    count: 1,
  },
  "http:request": {
    method: "POST",
    timeout: 30000,
  },
  "openai:chat": {
    model: "gpt-4o-mini",
    maxTokens: 1000,
    temperature: 0.7,
  },
  "anthropic:claude": {
    model: "claude-3-5-sonnet-20241022",
    maxTokens: 1000,
    temperature: 0.7,
  },
  "stripe:create-payment-intent": {
    currency: "usd",
  },
  "trigger:webhook": {
    authentication: "none",
  },
  "trigger:schedule": {
    timezone: "UTC",
  },
};

/**
 * Fields that should be normalized to specific types
 */
const FIELD_TYPE_COERCIONS: Record<string, Record<string, "number" | "boolean" | "string" | "json">> = {
  delay: {
    duration: "number",
  },
  "loop:foreach": {
    maxIterations: "number",
  },
  "loop:repeat": {
    count: "number",
  },
  "http:request": {
    timeout: "number",
  },
  "openai:chat": {
    maxTokens: "number",
    temperature: "number",
  },
  "anthropic:claude": {
    maxTokens: "number",
    temperature: "number",
  },
  "stripe:create-payment-intent": {
    amount: "number",
  },
  "stripe:refund": {
    amount: "number",
  },
};

/**
 * Coerce a value to a specific type
 */
function coerceValue(value: unknown, targetType: "number" | "boolean" | "string" | "json"): unknown {
  if (value === undefined || value === null) return value;

  switch (targetType) {
    case "number":
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
      }
      return value;

    case "boolean":
      if (typeof value === "boolean") return value;
      if (value === "true" || value === "1") return true;
      if (value === "false" || value === "0") return false;
      return Boolean(value);

    case "string":
      if (typeof value === "string") return value;
      return String(value);

    case "json":
      if (typeof value === "object") return value;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;

    default:
      return value;
  }
}

/**
 * Normalize configuration for a specific node type
 */
export function normalizeConfig(
  nodeType: string,
  config: Record<string, unknown>
): Record<string, unknown> {
  if (!config) return {};

  // Create a copy to avoid mutating the original
  const normalized: Record<string, unknown> = { ...config };

  // Apply default values for missing fields
  const defaults = NODE_DEFAULTS[nodeType];
  if (defaults) {
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (normalized[key] === undefined || normalized[key] === null || normalized[key] === "") {
        normalized[key] = defaultValue;
      }
    }
  }

  // Normalize operators in condition-like nodes
  if (normalized.operator) {
    normalized.operator = normalizeOperator(normalized.operator as string);
  }

  // Handle conditions array (for multi-condition nodes)
  if (Array.isArray(normalized.conditions)) {
    normalized.conditions = normalized.conditions.map((condition: any) => ({
      ...condition,
      operator: condition.operator ? normalizeOperator(condition.operator) : "equals",
    }));
  }

  // Apply type coercions
  const coercions = FIELD_TYPE_COERCIONS[nodeType];
  if (coercions) {
    for (const [field, targetType] of Object.entries(coercions)) {
      if (normalized[field] !== undefined) {
        normalized[field] = coerceValue(normalized[field], targetType);
      }
    }
  }

  // Handle field/value -> left/right normalization for conditions
  if (nodeType === "condition" || nodeType === "filter") {
    // Handlers support both conventions, but we normalize for consistency
    if (normalized.field && !normalized.left) {
      normalized.left = normalized.field;
    }
    if (normalized.value !== undefined && normalized.right === undefined) {
      normalized.right = normalized.value;
    }
  }

  return normalized;
}

/**
 * Normalize all node configs in a workflow
 */
export function normalizeWorkflowConfigs(
  nodes: Array<{
    id: string;
    type: string;
    label?: string;
    icon?: string;
    data?: { config?: Record<string, unknown> };
    config?: Record<string, unknown>;
  }>
): Array<{
  id: string;
  type: string;
  label?: string;
  icon?: string;
  data?: { config?: Record<string, unknown> };
  config?: Record<string, unknown>;
}> {
  return nodes.map((node) => {
    // Get the config from either location
    const config = node.data?.config || node.config || {};

    // Determine the specific handler type
    const handlerType = determineNodeHandlerType(node);

    // Normalize the config
    const normalizedConfig = normalizeConfig(handlerType, config);

    // Return with normalized config in the same structure
    if (node.data?.config) {
      return {
        ...node,
        data: {
          ...node.data,
          config: normalizedConfig,
        },
      };
    } else {
      return {
        ...node,
        config: normalizedConfig,
      };
    }
  });
}

/**
 * Determine handler type from node metadata
 * Simplified version - for full implementation see handlers/index.ts
 */
function determineNodeHandlerType(node: {
  type: string;
  label?: string;
  icon?: string;
}): string {
  const { type, label, icon } = node;
  const labelLower = (label || "").toLowerCase();
  const iconLower = (icon || "").toLowerCase();

  if (type !== "action") {
    return type;
  }

  // Map common action types
  if (labelLower.includes("email") || iconLower === "mail") {
    return "email:resend";
  }
  if (labelLower.includes("slack") || iconLower === "slack") {
    return "slack:send-message";
  }
  if (labelLower.includes("discord")) {
    return "discord:webhook";
  }
  if (labelLower.includes("http") || labelLower.includes("webhook") || iconLower === "globe") {
    return "http:request";
  }
  if (labelLower.includes("openai") || labelLower.includes("gpt")) {
    return "openai:chat";
  }
  if (labelLower.includes("claude") || labelLower.includes("anthropic")) {
    return "anthropic:claude";
  }
  if (labelLower.includes("sheets") || iconLower === "table") {
    return "google-sheets:append";
  }
  if (labelLower.includes("stripe") || iconLower === "credit-card") {
    return "stripe:create-payment-intent";
  }
  if (labelLower.includes("sms") || labelLower.includes("twilio") || iconLower === "phone") {
    return "twilio:send-sms";
  }

  return type;
}

/**
 * Validate that a config has all required fields for a node type
 * Returns array of missing field names
 */
export function validateRequiredFields(
  nodeType: string,
  config: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  const missing: string[] = [];

  for (const field of requiredFields) {
    const value = config[field];
    if (value === undefined || value === null || value === "") {
      missing.push(field);
    }
  }

  return missing;
}

/**
 * Check if a config is complete (no missing required fields)
 */
export function isConfigComplete(
  nodeType: string,
  config: Record<string, unknown>,
  requiredFields: string[]
): boolean {
  return validateRequiredFields(nodeType, config, requiredFields).length === 0;
}
