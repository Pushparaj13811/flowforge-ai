import { NextRequest, NextResponse } from "next/server";
import { db, integrations } from "@/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/utils";
import { z } from "zod";
import { getIntegrationCredentials } from "@/lib/security/integration-credentials";
import { encryptCredentialJSON } from "@/lib/security/credential-vault";

// Schema for updating an integration
const updateIntegrationSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  config: z.object({
    botToken: z.string().optional(),
    defaultChannel: z.string().optional(),
    apiKey: z.string().optional(),
    fromEmail: z.string().email().optional(),
    fromName: z.string().optional(),
    webhookUrl: z.string().url().optional(),
    teamsWebhookUrl: z.string().url().optional(),
    url: z.string().url().optional(),
    headers: z.array(z.object({
      key: z.string(),
      value: z.string(),
    })).optional(),
  }).optional(),
});

// GET /api/integrations/[id] - Get a single integration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, user.id)))
      .limit(1);

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // Don't return encrypted config (credentials are encrypted and should not be exposed)
    return NextResponse.json({
      integration: {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        isActive: integration.isActive,
        lastUsedAt: integration.lastUsedAt,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get integration error:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}

// PATCH /api/integrations/[id] - Update an integration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check ownership
    const [existing] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateIntegrationSchema.parse(body);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }
    if (validatedData.config !== undefined) {
      // Get existing config, merge with new values, and re-encrypt
      const existingConfig = await getIntegrationCredentials(id);
      const mergedConfig = {
        ...existingConfig,
        ...validatedData.config,
      };
      updateData.encryptedConfig = encryptCredentialJSON(mergedConfig);
    }

    const [updatedIntegration] = await db
      .update(integrations)
      .set(updateData)
      .where(eq(integrations.id, id))
      .returning({
        id: integrations.id,
        type: integrations.type,
        name: integrations.name,
        isActive: integrations.isActive,
        updatedAt: integrations.updatedAt,
      });

    return NextResponse.json({
      integration: updatedIntegration,
      message: "Integration updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Update integration error:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/[id] - Delete an integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check ownership
    const [existing] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    await db.delete(integrations).where(eq(integrations.id, id));

    return NextResponse.json({ message: "Integration deleted successfully" });
  } catch (error) {
    console.error("Delete integration error:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}
