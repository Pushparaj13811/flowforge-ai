/**
 * @file integrations/slack.ts
 * @description Slack integration using Slack Web API
 */

import { z } from "zod";

// Slack Block schema (explicit keys instead of z.record)
const slackTextObjectSchema = z.object({
  type: z.enum(["plain_text", "mrkdwn"]),
  text: z.string(),
  emoji: z.boolean().optional(),
});

const slackBlockSchema = z.object({
  type: z.enum(["header", "section", "divider", "context", "actions", "image"]),
  text: slackTextObjectSchema.optional(),
  block_id: z.string().optional(),
  accessory: z.object({
    type: z.string(),
    text: slackTextObjectSchema.optional(),
    value: z.string().optional(),
    action_id: z.string().optional(),
  }).optional(),
  elements: z.array(z.object({
    type: z.string(),
    text: slackTextObjectSchema.optional(),
    value: z.string().optional(),
    action_id: z.string().optional(),
  })).optional(),
  fields: z.array(slackTextObjectSchema).optional(),
  image_url: z.string().optional(),
  alt_text: z.string().optional(),
});

const slackAttachmentSchema = z.object({
  color: z.string().optional(),
  fallback: z.string().optional(),
  text: z.string().optional(),
  pretext: z.string().optional(),
  author_name: z.string().optional(),
  title: z.string().optional(),
  title_link: z.string().optional(),
  fields: z.array(z.object({
    title: z.string(),
    value: z.string(),
    short: z.boolean().optional(),
  })).optional(),
  footer: z.string().optional(),
  ts: z.number().optional(),
});

// Zod schema for Slack message
export const sendSlackMessageSchema = z.object({
  channel: z.string().min(1, "Channel is required (e.g., #general or C1234567890)"),
  text: z.string().min(1, "Message text is required"),
  blocks: z.array(slackBlockSchema).optional(),
  attachments: z.array(slackAttachmentSchema).optional(),
  threadTs: z.string().optional(),
  unfurlLinks: z.boolean().optional(),
  unfurlMedia: z.boolean().optional(),
});

export type SendSlackMessageInput = z.infer<typeof sendSlackMessageSchema>;

export interface SendSlackMessageResult {
  success: boolean;
  ts?: string; // Message timestamp (ID)
  channel?: string;
  error?: string;
}

/**
 * Send a message to Slack
 * Requires SLACK_BOT_TOKEN environment variable
 */
export async function sendSlackMessage(input: SendSlackMessageInput): Promise<SendSlackMessageResult> {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    return {
      success: false,
      error: "Slack not configured. Set SLACK_BOT_TOKEN environment variable.",
    };
  }

  try {
    const validated = sendSlackMessageSchema.parse(input);

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: validated.channel,
        text: validated.text,
        blocks: validated.blocks,
        attachments: validated.attachments,
        thread_ts: validated.threadTs,
        unfurl_links: validated.unfurlLinks,
        unfurl_media: validated.unfurlMedia,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return {
        success: false,
        error: data.error || "Failed to send Slack message",
      };
    }

    return {
      success: true,
      ts: data.ts,
      channel: data.channel,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending Slack message",
    };
  }
}

// Slack Block Kit builder helpers
export const SlackBlocks = {
  header: (text: string) => ({
    type: "header",
    text: { type: "plain_text", text, emoji: true },
  }),

  section: (text: string, accessory?: Record<string, unknown>) => ({
    type: "section",
    text: { type: "mrkdwn", text },
    ...(accessory && { accessory }),
  }),

  divider: () => ({ type: "divider" }),

  context: (elements: string[]) => ({
    type: "context",
    elements: elements.map((text) => ({ type: "mrkdwn", text })),
  }),

  actions: (elements: Array<{ type: string; text: string; value: string; style?: string }>) => ({
    type: "actions",
    elements: elements.map((el) => ({
      type: "button",
      text: { type: "plain_text", text: el.text, emoji: true },
      value: el.value,
      action_id: `action_${el.value}`,
      ...(el.style && { style: el.style }),
    })),
  }),
};

// Output schema for Tambo
export const sendSlackMessageOutputSchema = z.object({
  success: z.boolean(),
  ts: z.string().optional(),
  channel: z.string().optional(),
  error: z.string().optional(),
});
