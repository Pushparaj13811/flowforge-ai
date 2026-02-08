/**
 * @file error-messages.ts
 * @description User-friendly error message mapping
 * Converts technical errors to actionable guidance
 */

export interface UserFriendlyError {
  /** User-friendly error message */
  message: string;
  /** Suggested action to fix */
  action: string;
  /** Component to show (if applicable) */
  component?: string;
  /** Additional context or link */
  helpLink?: string;
  /** Whether this is recoverable */
  recoverable: boolean;
  /** Severity level */
  severity: "warning" | "error" | "info";
}

/**
 * Pattern-based error mappings
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  getError: (match: RegExpMatchArray, original: string) => UserFriendlyError;
}> = [
  // Integration errors
  {
    pattern: /Integration ID is required/i,
    getError: () => ({
      message: "Please connect your integration first",
      action: "Go to Settings → Integrations to connect the required service",
      component: "IntegrationPrompt",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /Integration credentials not found/i,
    getError: () => ({
      message: "Your integration connection has expired or was removed",
      action: "Reconnect your integration in Settings → Integrations",
      component: "IntegrationPrompt",
      recoverable: true,
      severity: "error",
    }),
  },
  {
    pattern: /Integration (\w+) not found/i,
    getError: (match) => ({
      message: `The ${match[1]} integration isn't connected`,
      action: `Connect ${match[1]} in Settings → Integrations`,
      component: "IntegrationPrompt",
      recoverable: true,
      severity: "warning",
    }),
  },

  // Authentication errors
  {
    pattern: /invalid_auth|account_inactive|unauthorized/i,
    getError: () => ({
      message: "Your account connection has expired",
      action: "Reconnect your account in Settings → Integrations",
      component: "IntegrationPrompt",
      recoverable: true,
      severity: "error",
    }),
  },
  {
    pattern: /Slack authentication error/i,
    getError: () => ({
      message: "Your Slack connection needs to be refreshed",
      action: "Reconnect Slack in Settings → Integrations",
      component: "IntegrationPrompt",
      recoverable: true,
      severity: "error",
    }),
  },

  // Missing configuration
  {
    pattern: /Channel is required/i,
    getError: () => ({
      message: "Please specify which channel to post to",
      action: "Enter a channel name like #general",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /Message( or blocks)? (is|are) required/i,
    getError: () => ({
      message: "Please provide a message to send",
      action: "Enter the message content",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /to (address|email|recipient) is required/i,
    getError: () => ({
      message: "Please specify who should receive this",
      action: "Enter an email address",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /subject is required/i,
    getError: () => ({
      message: "Please provide an email subject",
      action: "Enter the email subject line",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /URL is required/i,
    getError: () => ({
      message: "Please provide a URL to call",
      action: "Enter the webhook or API URL",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /Prompt is required/i,
    getError: () => ({
      message: "Please provide a prompt for the AI",
      action: "Enter what you want the AI to do",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /spreadsheet( id)? is required/i,
    getError: () => ({
      message: "Please specify which Google Sheet to use",
      action: "Enter the spreadsheet ID from the URL",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /Amount is required/i,
    getError: () => ({
      message: "Please specify the payment amount",
      action: "Enter the amount in cents (e.g., 1000 for $10.00)",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /phone (number|is) required/i,
    getError: () => ({
      message: "Please provide a phone number",
      action: "Enter a phone number with country code (e.g., +1234567890)",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /left value is required|field is required/i,
    getError: () => ({
      message: "Please specify what to check in the condition",
      action: "Enter a field name like $trigger.data.amount",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },
  {
    pattern: /Operator is required/i,
    getError: () => ({
      message: "Please select a comparison operator",
      action: "Choose how to compare the values (equals, greater than, etc.)",
      component: "NodeConfigurator",
      recoverable: true,
      severity: "warning",
    }),
  },

  // Rate limiting
  {
    pattern: /rate[_\s]?limit(ed)?/i,
    getError: () => ({
      message: "The service is temporarily limiting requests",
      action: "Wait a moment and try again. Consider adding a delay node.",
      recoverable: true,
      severity: "warning",
    }),
  },

  // API errors
  {
    pattern: /Slack API error: (\w+)/i,
    getError: (match) => ({
      message: `Slack returned an error: ${formatSlackError(match[1])}`,
      action: getSlackErrorAction(match[1]),
      recoverable: true,
      severity: "error",
    }),
  },
  {
    pattern: /HTTP (\d+)/i,
    getError: (match) => ({
      message: `The server returned an error (${match[1]})`,
      action: getHttpErrorAction(parseInt(match[1])),
      recoverable: parseInt(match[1]) >= 500,
      severity: "error",
    }),
  },

  // Timeout
  {
    pattern: /timeout|timed out/i,
    getError: () => ({
      message: "The operation took too long",
      action: "Try again. If it keeps happening, the external service may be slow.",
      recoverable: true,
      severity: "warning",
    }),
  },

  // Network errors
  {
    pattern: /network|connection|ECONNREFUSED|ENOTFOUND/i,
    getError: () => ({
      message: "Couldn't connect to the external service",
      action: "Check your internet connection and try again",
      recoverable: true,
      severity: "error",
    }),
  },

  // Variable resolution
  {
    pattern: /Cannot resolve variable|Variable .+ not found/i,
    getError: () => ({
      message: "A variable couldn't be found in the data",
      action: "Check that the variable path matches your trigger data. Use the variable picker to select valid fields.",
      component: "TriggerSchemaBuilder",
      recoverable: true,
      severity: "warning",
    }),
  },

  // JSON parsing
  {
    pattern: /JSON|parse error|syntax error/i,
    getError: () => ({
      message: "The data format is invalid",
      action: "Check that your JSON is properly formatted",
      recoverable: true,
      severity: "error",
    }),
  },
];

/**
 * Format Slack error codes to human-readable messages
 */
function formatSlackError(errorCode: string): string {
  const errorMap: Record<string, string> = {
    channel_not_found: "Channel not found",
    not_in_channel: "Bot is not in that channel",
    is_archived: "Channel is archived",
    msg_too_long: "Message is too long",
    no_text: "Message is empty",
    restricted_action: "Action is restricted",
    missing_scope: "Bot doesn't have permission",
  };
  return errorMap[errorCode] || errorCode;
}

/**
 * Get action for Slack errors
 */
function getSlackErrorAction(errorCode: string): string {
  const actionMap: Record<string, string> = {
    channel_not_found: "Check the channel name or ID. Make sure it exists.",
    not_in_channel: "Invite the Slack bot to the channel first.",
    is_archived: "The channel is archived. Use a different channel.",
    msg_too_long: "Shorten your message (max 40,000 characters).",
    no_text: "Add message content.",
    restricted_action: "Check your Slack workspace permissions.",
    missing_scope: "Reconnect Slack with the required permissions.",
  };
  return actionMap[errorCode] || "Check your Slack configuration and try again.";
}

/**
 * Get action for HTTP status codes
 */
function getHttpErrorAction(status: number): string {
  if (status === 400) return "Check your request parameters";
  if (status === 401) return "Check your authentication credentials";
  if (status === 403) return "You don't have permission for this action";
  if (status === 404) return "The endpoint or resource wasn't found. Check the URL.";
  if (status === 429) return "Too many requests. Wait a moment and try again.";
  if (status >= 500) return "The server had an error. Try again later.";
  return "Check your request and try again";
}

/**
 * Get user-friendly error from technical error message
 */
export function getUserFriendlyError(technicalError: string): UserFriendlyError {
  // Try each pattern
  for (const { pattern, getError } of ERROR_PATTERNS) {
    const match = technicalError.match(pattern);
    if (match) {
      return getError(match, technicalError);
    }
  }

  // Default fallback
  return {
    message: "Something went wrong",
    action: "Try again or check your configuration",
    recoverable: true,
    severity: "error",
  };
}

/**
 * Wrap an error with user-friendly message
 */
export function wrapError(error: Error | string): Error & { userFriendly: UserFriendlyError } {
  const message = error instanceof Error ? error.message : error;
  const userFriendly = getUserFriendlyError(message);

  const wrappedError = new Error(message) as Error & { userFriendly: UserFriendlyError };
  wrappedError.userFriendly = userFriendly;

  return wrappedError;
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: Error | string): {
  title: string;
  description: string;
  action: string;
  severity: "warning" | "error" | "info";
} {
  const message = error instanceof Error ? error.message : error;
  const friendly = getUserFriendlyError(message);

  return {
    title: friendly.message,
    description: message !== friendly.message ? `Technical: ${message}` : "",
    action: friendly.action,
    severity: friendly.severity,
  };
}
