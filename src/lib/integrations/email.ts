/**
 * @file integrations/email.ts
 * @description Email integration using Resend API
 */

import { z } from "zod";

// Zod schema for email input
export const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  html: z.boolean().optional(),
  from: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend API
 * Requires RESEND_API_KEY environment variable
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "Email service not configured. Set RESEND_API_KEY environment variable.",
    };
  }

  try {
    const validated = sendEmailSchema.parse(input);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: validated.from || process.env.EMAIL_FROM || "FlowForge <noreply@flowforge.ai>",
        to: Array.isArray(validated.to) ? validated.to : [validated.to],
        subject: validated.subject,
        [validated.html ? "html" : "text"]: validated.body,
        reply_to: validated.replyTo,
        cc: validated.cc ? (Array.isArray(validated.cc) ? validated.cc : [validated.cc]) : undefined,
        bcc: validated.bcc ? (Array.isArray(validated.bcc) ? validated.bcc : [validated.bcc]) : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send email",
      };
    }

    return {
      success: true,
      messageId: data.id,
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
      error: error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
}

// Output schema for Tambo
export const sendEmailOutputSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  error: z.string().optional(),
});
