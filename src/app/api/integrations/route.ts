import { NextRequest, NextResponse } from "next/server";
import { db, integrations } from "@/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/utils";
import { storeIntegrationCredentials } from "@/lib/security/integration-credentials";
import { validateIntegrationCredentials } from "@/lib/integrations/validators";
import {
  CreateIntegrationRequestSchema,
  GetIntegrationsResponseSchema,
  parseRequestBody,
  createErrorResponse,
} from "@/types/api";
import type { IntegrationConfig } from "@/types/workflow";

// GET /api/integrations - List user integrations
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const result = await db
      .select({
        id: integrations.id,
        type: integrations.type,
        name: integrations.name,
        isActive: integrations.isActive,
        lastUsedAt: integrations.lastUsedAt,
        createdAt: integrations.createdAt,
        // Don't expose sensitive config data
      })
      .from(integrations)
      .where(eq(integrations.userId, user.id))
      .orderBy(desc(integrations.createdAt));

    const response = GetIntegrationsResponseSchema.parse({
      integrations: result.map((i) => ({
        id: i.id,
        name: i.name,
        type: i.type,
        isActive: i.isActive,
        lastUsedAt: i.lastUsedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
      })),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] Get integrations error:", error);
    return createErrorResponse(
      "Failed to fetch integrations",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// POST /api/integrations - Create a new integration
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const result = await parseRequestBody(request, CreateIntegrationRequestSchema);
    if (!result.success) {
      return createErrorResponse("Invalid request body", 400, result.error);
    }

    const { type, name, config } = result.data;

    // Validate credentials format before storing
    const validation = validateIntegrationCredentials(type, config as Record<string, string>);
    if (!validation.valid) {
      return createErrorResponse(
        "Invalid credentials format",
        400,
        validation.errors.join("; ")
      );
    }

    // Store credentials securely with encryption
    const integrationId = await storeIntegrationCredentials({
      userId: user.id,
      type,
      name,
      config: config as unknown as IntegrationConfig,
    });

    // Return the created integration (without sensitive data)
    const [newIntegration] = await db
      .select({
        id: integrations.id,
        type: integrations.type,
        name: integrations.name,
        isActive: integrations.isActive,
        createdAt: integrations.createdAt,
      })
      .from(integrations)
      .where(eq(integrations.id, integrationId))
      .limit(1);

    return NextResponse.json({
      integration: {
        id: newIntegration.id,
        name: newIntegration.name,
        type: newIntegration.type,
        isActive: newIntegration.isActive,
        createdAt: newIntegration.createdAt.toISOString(),
      },
      message: "Integration created successfully",
    });
  } catch (error) {
    console.error("[API] Create integration error:", error);
    return createErrorResponse(
      "Failed to create integration",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
