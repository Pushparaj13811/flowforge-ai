/**
 * @file integrations/notifications.ts
 * @description Push notifications and alerts integration
 */

import { z } from "zod";

// Zod schema for push notification - using explicit structure instead of z.record
export const sendPushNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  userId: z.string().optional(),
  dataJson: z.string().optional().describe("JSON string of additional data"),
  icon: z.string().optional(),
  url: z.string().optional(),
  urgency: z.enum(["low", "normal", "high"]).optional().default("normal"),
});

export type SendPushNotificationInput = z.infer<typeof sendPushNotificationSchema>;

export interface SendPushNotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Send a push notification
 * Requires PUSH_NOTIFICATION_KEY environment variable
 */
export async function sendPushNotification(
  input: SendPushNotificationInput
): Promise<SendPushNotificationResult> {
  try {
    const validated = sendPushNotificationSchema.parse(input);

    // In a real implementation, you'd use a service like:
    // - Firebase Cloud Messaging (FCM)
    // - OneSignal
    // - Pusher Beams
    // - Custom web push with VAPID keys

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log notification for demo purposes
    console.log("Push notification:", {
      id: notificationId,
      ...validated,
    });

    return {
      success: true,
      notificationId,
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
      error: error instanceof Error ? error.message : "Unknown error sending notification",
    };
  }
}

// Discord webhook integration
export const sendDiscordWebhookSchema = z.object({
  webhookUrl: z.string().url("Invalid Discord webhook URL"),
  content: z.string().optional(),
  username: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  embeds: z
    .array(
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().url().optional(),
        color: z.number().optional(),
        fields: z
          .array(
            z.object({
              name: z.string(),
              value: z.string(),
              inline: z.boolean().optional(),
            })
          )
          .optional(),
        footer: z.object({ text: z.string() }).optional(),
        timestamp: z.string().optional(),
      })
    )
    .optional(),
});

export type SendDiscordWebhookInput = z.infer<typeof sendDiscordWebhookSchema>;

export interface SendDiscordWebhookResult {
  success: boolean;
  error?: string;
}

/**
 * Send a message via Discord webhook
 */
export async function sendDiscordWebhook(
  input: SendDiscordWebhookInput
): Promise<SendDiscordWebhookResult> {
  try {
    const validated = sendDiscordWebhookSchema.parse(input);

    const response = await fetch(validated.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: validated.content,
        username: validated.username,
        avatar_url: validated.avatarUrl,
        embeds: validated.embeds,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `Discord API error: ${response.status} - ${text}`,
      };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending Discord message",
    };
  }
}

// Microsoft Teams webhook integration
export const sendTeamsMessageSchema = z.object({
  webhookUrl: z.string().url("Invalid Teams webhook URL"),
  title: z.string().optional(),
  text: z.string().min(1, "Message text is required"),
  themeColor: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
  sections: z
    .array(
      z.object({
        activityTitle: z.string().optional(),
        activitySubtitle: z.string().optional(),
        activityImage: z.string().url().optional(),
        facts: z
          .array(
            z.object({
              name: z.string(),
              value: z.string(),
            })
          )
          .optional(),
        text: z.string().optional(),
      })
    )
    .optional(),
});

export type SendTeamsMessageInput = z.infer<typeof sendTeamsMessageSchema>;

/**
 * Send a message via Microsoft Teams webhook
 */
export async function sendTeamsMessage(
  input: SendTeamsMessageInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = sendTeamsMessageSchema.parse(input);

    const response = await fetch(validated.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: validated.themeColor || "0076D7",
        summary: validated.title || "FlowForge Notification",
        title: validated.title,
        text: validated.text,
        sections: validated.sections,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `Teams API error: ${response.status} - ${text}`,
      };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending Teams message",
    };
  }
}

// Output schemas for Tambo
export const sendPushNotificationOutputSchema = z.object({
  success: z.boolean(),
  notificationId: z.string().optional(),
  error: z.string().optional(),
});

export const sendDiscordWebhookOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export const sendTeamsMessageOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
