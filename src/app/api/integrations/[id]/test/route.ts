/**
 * @file route.ts
 * @description Test integration endpoint - validates credentials work
 */

import { NextRequest, NextResponse } from "next/server";
import { db, integrations } from "@/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/utils";
import { getIntegrationCredentials } from "@/lib/security/integration-credentials";

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/[id]/test
 * Test an integration by attempting a basic operation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get integration
    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, user.id)))
      .limit(1);

    if (!integration) {
      return NextResponse.json(
        { success: false, message: "Integration not found" },
        { status: 404 }
      );
    }

    // Get decrypted credentials
    let config: Record<string, string>;
    try {
      config = await getIntegrationCredentials(id);
    } catch {
      return NextResponse.json({
        success: false,
        message: "Failed to decrypt credentials. The encryption key may have changed.",
      });
    }

    // Test based on integration type
    const result = await testIntegration(integration.type, config);

    // Update last used timestamp on success
    if (result.success) {
      await db
        .update(integrations)
        .set({ lastUsedAt: new Date(), updatedAt: new Date() })
        .where(eq(integrations.id, id));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test integration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      },
      { status: 500 }
    );
  }
}

async function testIntegration(
  type: string,
  config: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  switch (type) {
    case "slack": {
      if (!config.botToken) {
        return { success: false, message: "Bot token is missing" };
      }
      try {
        const response = await fetch("https://slack.com/api/auth.test", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.botToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        const data = await response.json();
        if (data.ok) {
          return { success: true, message: `Connected as ${data.user} to ${data.team}` };
        }
        return { success: false, message: `Slack error: ${data.error}` };
      } catch {
        return { success: false, message: "Failed to connect to Slack API" };
      }
    }

    case "discord": {
      if (!config.webhookUrl) {
        return { success: false, message: "Webhook URL is missing" };
      }
      try {
        // GET on a discord webhook URL returns webhook info without posting
        const response = await fetch(config.webhookUrl);
        if (response.ok) {
          const data = await response.json();
          return { success: true, message: `Connected to channel in ${data.guild_id ? 'guild' : 'DM'}` };
        }
        return { success: false, message: "Invalid webhook URL" };
      } catch {
        return { success: false, message: "Failed to connect to Discord" };
      }
    }

    case "resend": {
      if (!config.apiKey) {
        return { success: false, message: "API key is missing" };
      }
      try {
        const response = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (response.ok) {
          return { success: true, message: "Resend API key is valid" };
        }
        return { success: false, message: "Invalid Resend API key" };
      } catch {
        return { success: false, message: "Failed to connect to Resend API" };
      }
    }

    case "sendgrid": {
      if (!config.apiKey) {
        return { success: false, message: "API key is missing" };
      }
      try {
        const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (response.ok) {
          return { success: true, message: "SendGrid API key is valid" };
        }
        return { success: false, message: "Invalid SendGrid API key" };
      } catch {
        return { success: false, message: "Failed to connect to SendGrid" };
      }
    }

    case "openai": {
      if (!config.apiKey) {
        return { success: false, message: "API key is missing" };
      }
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (response.ok) {
          return { success: true, message: "OpenAI API key is valid" };
        }
        return { success: false, message: "Invalid OpenAI API key" };
      } catch {
        return { success: false, message: "Failed to connect to OpenAI" };
      }
    }

    case "anthropic": {
      if (!config.apiKey) {
        return { success: false, message: "API key is missing" };
      }
      // Anthropic doesn't have a lightweight validation endpoint, so check key format
      if (config.apiKey.startsWith("sk-ant-")) {
        return { success: true, message: "Anthropic API key format is valid" };
      }
      return { success: false, message: "Invalid Anthropic API key format (should start with sk-ant-)" };
    }

    case "teams": {
      if (!config.webhookUrl) {
        return { success: false, message: "Webhook URL is missing" };
      }
      try {
        const url = new URL(config.webhookUrl);
        const validHosts = ["outlook.office.com", "outlook.office365.com", "webhook.office.com"];
        if (validHosts.some(host => url.hostname.includes(host))) {
          return { success: true, message: "Teams webhook URL format is valid" };
        }
        return { success: false, message: "Invalid Teams webhook URL domain" };
      } catch {
        return { success: false, message: "Invalid webhook URL format" };
      }
    }

    case "stripe": {
      if (!config.apiKey) {
        return { success: false, message: "API key is missing" };
      }
      try {
        const response = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (response.ok) {
          return { success: true, message: "Stripe API key is valid" };
        }
        return { success: false, message: "Invalid Stripe API key" };
      } catch {
        return { success: false, message: "Failed to connect to Stripe" };
      }
    }

    case "webhook":
    case "http": {
      if (!config.url) {
        return { success: false, message: "URL is missing" };
      }
      try {
        const response = await fetch(config.url, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });
        return { success: true, message: `Endpoint reachable (HTTP ${response.status})` };
      } catch {
        return { success: false, message: "Endpoint is not reachable" };
      }
    }

    default:
      return { success: true, message: "Credentials saved. This integration type does not support automated testing." };
  }
}
