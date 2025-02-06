/**
 * @file route.ts
 * @description Individual API key management endpoints
 */

import { NextRequest } from "next/server";
import { db, apiKeys } from "@/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/utils";
import { createErrorResponse } from "@/types/api";

/**
 * DELETE /api/api-keys/:id - Delete an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const { id } = await params;

    // Verify the key belongs to this user before deleting
    const [existingKey] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)))
      .limit(1);

    if (!existingKey) {
      return createErrorResponse("API key not found", 404);
    }

    // Delete the key
    await db.delete(apiKeys).where(eq(apiKeys.id, id));

    return Response.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("[API] Delete API key error:", error);
    return createErrorResponse(
      "Failed to delete API key",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * PATCH /api/api-keys/:id - Update an API key (toggle active status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const { id } = await params;
    const body = await request.json();

    // Verify the key belongs to this user
    const [existingKey] = await db
      .select({ id: apiKeys.id, isActive: apiKeys.isActive })
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)))
      .limit(1);

    if (!existingKey) {
      return createErrorResponse("API key not found", 404);
    }

    // Update the key
    const updates: Partial<{ isActive: boolean; name: string }> = {};
    if (typeof body.isActive === "boolean") {
      updates.isActive = body.isActive;
    }
    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return createErrorResponse("No valid updates provided", 400);
    }

    const [updatedKey] = await db
      .update(apiKeys)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, id))
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        isActive: apiKeys.isActive,
      });

    return Response.json({
      key: updatedKey,
      message: "API key updated successfully",
    });
  } catch (error) {
    console.error("[API] Update API key error:", error);
    return createErrorResponse(
      "Failed to update API key",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
