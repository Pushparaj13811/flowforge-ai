/**
 * @file route.ts
 * @description API Keys management endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { db, apiKeys } from "@/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/utils";
import { createErrorResponse } from "@/types/api";
import { createHash, randomBytes } from "crypto";

/**
 * Generate a secure API key
 * Format: ff_<32 random bytes in hex>
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomPart = randomBytes(32).toString("hex");
  const key = `ff_${randomPart}`;
  const prefix = `ff_${randomPart.slice(0, 8)}`;
  const hash = createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}


/**
 * GET /api/api-keys - List user's API keys
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const result = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        isActive: apiKeys.isActive,
        scopes: apiKeys.scopes,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.id))
      .orderBy(desc(apiKeys.createdAt));

    return NextResponse.json({
      keys: result.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        isActive: k.isActive,
        scopes: k.scopes,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        expiresAt: k.expiresAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API] Get API keys error:", error);
    return createErrorResponse(
      "Failed to fetch API keys",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * POST /api/api-keys - Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();
    const { name, scopes, expiresInDays } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return createErrorResponse("Name is required", 400);
    }

    // Generate the API key
    const { key, prefix, hash } = generateApiKey();

    // Calculate expiration if specified
    let expiresAt: Date | null = null;
    if (expiresInDays && typeof expiresInDays === "number" && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Insert the key
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId: user.id,
        name: name.trim(),
        keyPrefix: prefix,
        hashedKey: hash,
        scopes: scopes || ["workflow:trigger"],
        expiresAt,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        isActive: apiKeys.isActive,
        scopes: apiKeys.scopes,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      });

    // Return the full key ONLY on creation (it's never stored/returned again)
    return NextResponse.json({
      key: {
        id: newKey.id,
        name: newKey.name,
        keyPrefix: newKey.keyPrefix,
        // This is the ONLY time the full key is returned!
        fullKey: key,
        isActive: newKey.isActive,
        scopes: newKey.scopes,
        expiresAt: newKey.expiresAt?.toISOString() ?? null,
        createdAt: newKey.createdAt.toISOString(),
      },
      message: "API key created. Save it now - it won't be shown again!",
    });
  } catch (error) {
    console.error("[API] Create API key error:", error);
    return createErrorResponse(
      "Failed to create API key",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
