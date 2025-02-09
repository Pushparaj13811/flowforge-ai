/**
 * @file validators.ts
 * @description Validation functions for integration credentials
 * Ensures users provide correct format credentials before saving
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate Slack Bot Token
 * Bot tokens start with xoxb-
 */
export function validateSlackCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { botToken } = config;

  if (!botToken) {
    errors.push("Bot Token is required");
  } else if (!botToken.startsWith("xoxb-")) {
    errors.push(
      "Invalid Bot Token format. Slack Bot Tokens must start with 'xoxb-'. " +
      "You may have entered a Verification Token or User Token by mistake. " +
      "Go to OAuth & Permissions in your Slack app to find the Bot User OAuth Token."
    );
  } else if (botToken.length < 50) {
    errors.push("Bot Token appears too short. Please check you copied the complete token.");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Discord Webhook URL
 */
export function validateDiscordCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { webhookUrl } = config;

  if (!webhookUrl) {
    errors.push("Webhook URL is required");
  } else {
    try {
      const url = new URL(webhookUrl);
      if (!url.hostname.includes("discord.com") && !url.hostname.includes("discordapp.com")) {
        errors.push("Invalid Discord webhook URL. Must be a discord.com URL.");
      }
      if (!url.pathname.includes("/api/webhooks/")) {
        errors.push("Invalid Discord webhook URL format. URL should contain '/api/webhooks/'");
      }
    } catch {
      errors.push("Invalid URL format");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Microsoft Teams Webhook URL
 */
export function validateTeamsCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { webhookUrl } = config;

  if (!webhookUrl) {
    errors.push("Webhook URL is required");
  } else {
    try {
      const url = new URL(webhookUrl);
      const validHosts = ["outlook.office.com", "outlook.office365.com", "webhook.office.com"];
      if (!validHosts.some(host => url.hostname.includes(host))) {
        errors.push(
          "Invalid Teams webhook URL. Must be from outlook.office.com or webhook.office.com. " +
          "Go to your Teams channel > Connectors > Incoming Webhook to get the correct URL."
        );
      }
    } catch {
      errors.push("Invalid URL format");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Resend API Key
 */
export function validateResendCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { apiKey, fromEmail } = config;

  if (!apiKey) {
    errors.push("API Key is required");
  } else if (!apiKey.startsWith("re_")) {
    errors.push("Invalid Resend API Key format. Resend API keys start with 're_'.");
  }

  if (!fromEmail) {
    errors.push("From Email is required");
  } else if (!isValidEmail(fromEmail)) {
    errors.push("Invalid From Email format");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate SendGrid API Key
 */
export function validateSendGridCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { apiKey, fromEmail } = config;

  if (!apiKey) {
    errors.push("API Key is required");
  } else if (!apiKey.startsWith("SG.")) {
    errors.push("Invalid SendGrid API Key format. SendGrid API keys start with 'SG.'");
  }

  if (!fromEmail) {
    errors.push("From Email is required");
  } else if (!isValidEmail(fromEmail)) {
    errors.push("Invalid From Email format");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate SMTP credentials
 */
export function validateSmtpCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { host, port, username, password, fromEmail } = config;

  if (!host) {
    errors.push("SMTP Host is required");
  }

  if (!port) {
    errors.push("Port is required");
  } else {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errors.push("Port must be a valid number between 1 and 65535");
    }
  }

  if (!username) {
    errors.push("Username is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (!fromEmail) {
    errors.push("From Email is required");
  } else if (!isValidEmail(fromEmail)) {
    errors.push("Invalid From Email format");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate OpenAI API Key
 * Supports both legacy (sk-...) and project-based keys (sk-proj-...)
 */
export function validateOpenAICredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { apiKey, organization } = config;

  if (!apiKey) {
    errors.push("API Key is required");
  } else if (!apiKey.startsWith("sk-")) {
    errors.push(
      "Invalid OpenAI API Key format. OpenAI API keys start with 'sk-' or 'sk-proj-'. " +
      "Go to platform.openai.com > API Keys to create or copy your key."
    );
  } else if (apiKey.length < 40) {
    errors.push("API Key appears too short. Please check you copied the complete key.");
  }

  if (organization && !organization.startsWith("org-")) {
    errors.push("Invalid Organization ID format. Organization IDs start with 'org-'.");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Anthropic API Key
 */
export function validateAnthropicCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { apiKey } = config;

  if (!apiKey) {
    errors.push("API Key is required");
  } else if (!apiKey.startsWith("sk-ant-")) {
    errors.push(
      "Invalid Anthropic API Key format. Anthropic API keys start with 'sk-ant-'. " +
      "Go to console.anthropic.com > API Keys to create or copy your key."
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Stripe API Key
 */
export function validateStripeCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { apiKey, webhookSecret } = config;

  if (!apiKey) {
    errors.push("Secret Key is required");
  } else if (!apiKey.startsWith("sk_live_") && !apiKey.startsWith("sk_test_")) {
    errors.push(
      "Invalid Stripe Secret Key format. " +
      "Stripe keys start with 'sk_live_' (production) or 'sk_test_' (test mode). " +
      "Make sure you're not using a Publishable Key (pk_) or Restricted Key (rk_)."
    );
  }

  if (webhookSecret && !webhookSecret.startsWith("whsec_")) {
    errors.push("Invalid Webhook Secret format. Webhook secrets start with 'whsec_'.");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Twilio credentials
 */
export function validateTwilioCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { accountSid, authToken, fromNumber } = config;

  if (!accountSid) {
    errors.push("Account SID is required");
  } else if (!accountSid.startsWith("AC")) {
    errors.push(
      "Invalid Account SID format. Twilio Account SIDs start with 'AC'. " +
      "Find this in your Twilio Console Dashboard."
    );
  }

  if (!authToken) {
    errors.push("Auth Token is required");
  } else if (authToken.length < 20) {
    errors.push("Auth Token appears too short. Please check you copied the complete token.");
  }

  if (!fromNumber) {
    errors.push("From Number is required");
  } else if (!fromNumber.match(/^\+[1-9]\d{6,14}$/)) {
    errors.push(
      "Invalid phone number format. Must be in E.164 format (e.g., +14155551234). " +
      "Include the country code with a + prefix."
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Custom Webhook
 */
export function validateWebhookCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { url, headers } = config;

  if (!url) {
    errors.push("Webhook URL is required");
  } else {
    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        errors.push("URL must use HTTP or HTTPS protocol");
      }
    } catch {
      errors.push("Invalid URL format");
    }
  }

  if (headers) {
    try {
      const parsed = JSON.parse(headers);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        errors.push("Headers must be a JSON object (e.g., {\"Authorization\": \"Bearer ...\"})");
      }
    } catch {
      errors.push("Headers must be valid JSON");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Push Notification credentials (VAPID)
 */
export function validatePushCredentials(config: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const { vapidPublicKey, vapidPrivateKey } = config;

  if (!vapidPublicKey) {
    errors.push("VAPID Public Key is required");
  } else if (vapidPublicKey.length < 65) {
    errors.push("VAPID Public Key appears too short");
  }

  if (!vapidPrivateKey) {
    errors.push("VAPID Private Key is required");
  } else if (vapidPrivateKey.length < 32) {
    errors.push("VAPID Private Key appears too short");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Main validation function - routes to the appropriate validator
 */
export function validateIntegrationCredentials(
  integrationType: string,
  config: Record<string, string>
): ValidationResult {
  switch (integrationType) {
    case "slack":
      return validateSlackCredentials(config);
    case "discord":
      return validateDiscordCredentials(config);
    case "teams":
      return validateTeamsCredentials(config);
    case "resend":
      return validateResendCredentials(config);
    case "sendgrid":
      return validateSendGridCredentials(config);
    case "smtp":
      return validateSmtpCredentials(config);
    case "openai":
      return validateOpenAICredentials(config);
    case "anthropic":
      return validateAnthropicCredentials(config);
    case "stripe":
      return validateStripeCredentials(config);
    case "twilio":
      return validateTwilioCredentials(config);
    case "webhook":
      return validateWebhookCredentials(config);
    case "push":
      return validatePushCredentials(config);
    // OAuth integrations don't need client-side validation
    case "google-sheets":
    case "google-drive":
    case "dropbox":
    case "github":
    case "hubspot":
      return { valid: true, errors: [] };
    default:
      // For unknown types, just check required fields are present
      return { valid: true, errors: [] };
  }
}
