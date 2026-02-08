import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import { getApiUrl } from "../utils";

// Import real integrations
import {
  sendEmail,
  sendEmailSchema,
  sendEmailOutputSchema,
} from "@/lib/integrations/email";
import {
  sendSlackMessage,
  sendSlackMessageSchema,
  sendSlackMessageOutputSchema,
} from "@/lib/integrations/slack";
import {
  callWebhook,
  callWebhookSchema,
  callWebhookOutputSchema,
} from "@/lib/integrations/webhook";
import {
  sendDiscordWebhook,
  sendDiscordWebhookSchema,
  sendDiscordWebhookOutputSchema,
  sendTeamsMessage,
  sendTeamsMessageSchema,
  sendTeamsMessageOutputSchema,
} from "@/lib/integrations/notifications";

// Email Integration (Resend)
export const sendEmailTool: TamboTool = {
  name: "sendEmail",
  description: `Send an email using the Resend API.
Use this when a workflow needs to:
- Send notification emails
- Send welcome emails
- Send alerts or reports
- Communicate with users via email

Requires RESEND_API_KEY environment variable to be set.`,
  tool: sendEmail,
  inputSchema: sendEmailSchema,
  outputSchema: sendEmailOutputSchema,
};

// Slack Integration
export const sendSlackMessageTool: TamboTool = {
  name: "sendSlackMessage",
  description: `Send a message to a Slack channel or user.
Use this when a workflow needs to:
- Post notifications to Slack
- Alert team members
- Send workflow status updates
- Integrate with Slack-based teams

Requires SLACK_BOT_TOKEN environment variable to be set.
Channel can be a channel name (#general) or channel ID (C1234567890).`,
  tool: sendSlackMessage,
  inputSchema: sendSlackMessageSchema,
  outputSchema: sendSlackMessageOutputSchema,
};

// Webhook/HTTP Integration
export const callWebhookTool: TamboTool = {
  name: "callWebhook",
  description: `Call an external HTTP webhook or API endpoint.
Use this when a workflow needs to:
- Trigger external services
- Send data to third-party APIs
- Integrate with custom endpoints
- Call REST APIs

Supports GET, POST, PUT, PATCH, DELETE methods.
Includes retry logic with exponential backoff.`,
  tool: callWebhook,
  inputSchema: callWebhookSchema,
  outputSchema: callWebhookOutputSchema,
};

// Discord Integration
export const sendDiscordWebhookTool: TamboTool = {
  name: "sendDiscordWebhook",
  description: `Send a message via Discord webhook.
Use this when a workflow needs to:
- Post notifications to Discord
- Send alerts to Discord channels
- Integrate with Discord communities

Supports rich embeds with titles, descriptions, colors, and fields.`,
  tool: sendDiscordWebhook,
  inputSchema: sendDiscordWebhookSchema,
  outputSchema: sendDiscordWebhookOutputSchema,
};

// Microsoft Teams Integration
export const sendTeamsMessageTool: TamboTool = {
  name: "sendTeamsMessage",
  description: `Send a message to Microsoft Teams via webhook.
Use this when a workflow needs to:
- Post notifications to Teams
- Send alerts to Teams channels
- Integrate with enterprise Teams environments

Supports MessageCards with sections and facts.`,
  tool: sendTeamsMessage,
  inputSchema: sendTeamsMessageSchema,
  outputSchema: sendTeamsMessageOutputSchema,
};

/**
 * Check Required Integrations Tool
 * Checks if user has required integrations and handles multi-account selection
 */
export const checkRequiredIntegrationsTool: TamboTool = {
  name: "checkRequiredIntegrations",
  description: `Check if the user has the required integrations connected for a workflow.

Use this BEFORE creating workflows that need external services to:
- Verify the user has connected the necessary integrations (Slack, email, Stripe, etc.)
- Handle cases where the user has multiple accounts of the same type
- Identify which integrations need to be set up
- Check which services can use platform fallback (like email)

Returns:
- missing: Integrations that need to be connected
- available: Integrations that are ready to use
- multipleOptions: When user has multiple accounts of same type, lists options for selection
- platformFallback: List of integration types that can use platform defaults (no user setup needed)`,

  tool: async (input: { requiredTypes: string[] }) => {
    const { requiredTypes } = input;

    try {
      const response = await fetch(getApiUrl("/api/integrations"), {
        credentials: "include",
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Failed to fetch integrations",
          missing: requiredTypes,
          available: [],
          multipleOptions: {},
          platformFallback: ["email"], // Email can always use platform
        };
      }

      const data = await response.json();
      const userIntegrations: Array<{
        id: string;
        type: string;
        name: string;
        isActive: boolean;
      }> = data.integrations || [];

      // Track what's missing, available, and has multiple options
      const missing: string[] = [];
      const available: string[] = [];
      const multipleOptions: Record<string, Array<{ id: string; name: string }>> = {};

      // Platform fallback types - these don't require user integration
      const platformFallback = ["email"];

      for (const requiredType of requiredTypes) {
        const matchingIntegrations = userIntegrations.filter(
          (i) => i.type === requiredType && i.isActive
        );

        if (matchingIntegrations.length === 0) {
          // Check if platform fallback is available
          if (!platformFallback.includes(requiredType)) {
            missing.push(requiredType);
          }
        } else if (matchingIntegrations.length === 1) {
          available.push(requiredType);
        } else {
          // Multiple accounts - user needs to choose
          available.push(requiredType);
          multipleOptions[requiredType] = matchingIntegrations.map((i) => ({
            id: i.id,
            name: i.name,
          }));
        }
      }

      // Generate guidance message
      let guidance = "";
      if (missing.length > 0) {
        guidance = `Please connect these integrations first: ${missing.join(", ")}. Go to Settings → Integrations to set them up.`;
      } else if (Object.keys(multipleOptions).length > 0) {
        const types = Object.keys(multipleOptions);
        guidance = `You have multiple ${types.join(", ")} accounts. Please specify which one to use.`;
      } else {
        guidance = "All required integrations are ready!";
      }

      return {
        success: true,
        missing,
        available,
        multipleOptionsJson: JSON.stringify(multipleOptions),
        platformFallback,
        guidance,
        allAvailable: missing.length === 0,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to check integrations",
        missing: requiredTypes,
        available: [],
        multipleOptionsJson: "{}",
        platformFallback: ["email"],
      };
    }
  },

  inputSchema: z.object({
    requiredTypes: z.array(z.string()).describe(
      "Array of integration types needed (e.g., ['slack', 'stripe', 'google-sheets'])"
    ),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    missing: z.array(z.string()).describe("Integration types that are not connected"),
    available: z.array(z.string()).describe("Integration types that are ready to use"),
    multipleOptionsJson: z.string().describe("For types with multiple accounts, lists available options as JSON string"),
    platformFallback: z.array(z.string()).describe(
      "Integration types that can use platform defaults without user setup"
    ),
    guidance: z.string().optional().describe("Human-readable guidance message"),
    allAvailable: z.boolean().optional().describe("True if all required integrations are available"),
    error: z.string().optional(),
  }),
};

// List User Integrations Tool
export const listUserIntegrationsTool: TamboTool = {
  name: "listUserIntegrations",
  description: `List the user's connected integrations (Slack, email, Discord, etc).
Use this to see what integrations the user has configured before suggesting workflow actions.
Returns the list of active integrations the user can use in their workflows.`,
  tool: async () => {
    try {
      const response = await fetch(getApiUrl("/api/integrations"), {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to fetch integrations",
          integrations: [],
        };
      }

      return {
        success: true,
        integrations: data.integrations?.map((i: {
          id: string;
          type: string;
          name: string;
          isActive: boolean;
        }) => ({
          id: i.id,
          type: i.type,
          name: i.name,
          isActive: i.isActive,
        })) || [],
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch integrations",
        integrations: [],
      };
    }
  },
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    integrations: z.array(z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
      isActive: z.boolean(),
    })),
    error: z.string().optional(),
  }),
};
