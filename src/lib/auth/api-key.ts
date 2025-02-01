/**
 * @file api-key.ts
 * @description API Key validation utilities
 */

import { db, apiKeys, users } from "@/db";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

/**
 * Hash an API key for comparison
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * API key validation result
 */
export interface ApiKeyValidationResult {
  valid: boolean;
  userId?: string;
  keyId?: string;
  scopes?: string[];
  error?: string;
}

/**
 * Validate an API key and return the associated user
 * @param apiKey - The full API key (e.g., ff_abc123...)
 * @param requiredScope - Optional scope that must be present
 */
export async function validateApiKey(
  apiKey: string,
  requiredScope?: string
): Promise<ApiKeyValidationResult> {
  try {
    // Check key format
    if (!apiKey || !apiKey.startsWith("ff_")) {
      return { valid: false, error: "Invalid API key format" };
    }

    // Hash the key for comparison
    const hashedKey = hashApiKey(apiKey);

    // Look up the key
    const [key] = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        isActive: apiKeys.isActive,
        scopes: apiKeys.scopes,
        expiresAt: apiKeys.expiresAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.hashedKey, hashedKey))
      .limit(1);

    if (!key) {
      return { valid: false, error: "API key not found" };
    }

    if (!key.isActive) {
      return { valid: false, error: "API key is disabled" };
    }

    // Check expiration
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return { valid: false, error: "API key has expired" };
    }

    // Check required scope
    const scopes = (key.scopes as string[]) || [];
    if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes("*")) {
      return { valid: false, error: `Missing required scope: ${requiredScope}` };
    }

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, key.id))
      .catch(console.error);

    return {
      valid: true,
      userId: key.userId,
      keyId: key.id,
      scopes,
    };
  } catch (error) {
    console.error("[API Key] Validation error:", error);
    return { valid: false, error: "Failed to validate API key" };
  }
}

/**
 * Extract API key from request headers
 * Supports: Authorization: Bearer <key> or X-API-Key: <key>
 */
export function extractApiKeyFromRequest(request: Request): string | null {
  // Check Authorization header first (preferred)
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1].startsWith("ff_")) {
      return match[1];
    }
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader && apiKeyHeader.startsWith("ff_")) {
    return apiKeyHeader;
  }

  return null;
}
