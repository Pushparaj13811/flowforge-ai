/**
 * @file integrations/webhook.ts
 * @description HTTP webhook integration for calling external APIs
 */

import { z } from "zod";

// Zod schema for webhook call - using explicit header structure instead of z.record
export const callWebhookSchema = z.object({
  url: z.string().url("Invalid URL format"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
  headers: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).optional().describe("Array of header key-value pairs"),
  bodyJson: z.string().optional().describe("JSON string body for the request"),
  timeout: z.number().min(1000).max(30000).optional(),
  retries: z.number().min(0).max(3).optional(),
});

export type CallWebhookInput = z.infer<typeof callWebhookSchema>;

export interface CallWebhookResult {
  success: boolean;
  statusCode?: number;
  dataJson?: string;
  headersJson?: string;
  duration?: number;
  error?: string;
}

/**
 * Call an external webhook/API
 */
export async function callWebhook(input: CallWebhookInput): Promise<CallWebhookResult> {
  try {
    const validated = callWebhookSchema.parse(input);
    const startTime = Date.now();
    const timeout = validated.timeout ?? 10000;
    const retries = validated.retries ?? 0;
    const method = validated.method ?? "POST";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Convert headers array to object
    const headersObj: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (validated.headers) {
      for (const header of validated.headers) {
        headersObj[header.key] = header.value;
      }
    }

    let lastError: Error | null = null;
    let attempts = 0;
    const maxAttempts = retries + 1;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const response = await fetch(validated.url, {
          method,
          headers: headersObj,
          body: validated.bodyJson || undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Try to parse response as JSON
        let data: unknown;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // Get response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        if (!response.ok) {
          return {
            success: false,
            statusCode: response.status,
            dataJson: JSON.stringify(data),
            headersJson: JSON.stringify(responseHeaders),
            duration,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        return {
          success: true,
          statusCode: response.status,
          dataJson: JSON.stringify(data),
          headersJson: JSON.stringify(responseHeaders),
          duration,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on abort
        if (controller.signal.aborted) {
          break;
        }

        // Wait before retry with exponential backoff
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 100));
        }
      }
    }

    clearTimeout(timeoutId);

    return {
      success: false,
      error: lastError?.message || "Request failed after retries",
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
      error: error instanceof Error ? error.message : "Unknown error calling webhook",
    };
  }
}

// Output schema for Tambo - using JSON string instead of z.record
export const callWebhookOutputSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
  dataJson: z.string().optional().describe("JSON string of response data"),
  headersJson: z.string().optional().describe("JSON string of response headers"),
  duration: z.number().optional(),
  error: z.string().optional(),
});
