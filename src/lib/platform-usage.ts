/**
 * @file platform-usage.ts
 * @description Track and manage platform-provided resource usage (email, AI tokens, etc.)
 */

import { db, platformUsage } from "@/db";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Get the current usage period (monthly)
 */
function getCurrentPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

/**
 * Get platform usage for a user and resource type in the current period
 */
export async function getPlatformUsage(
  userId: string,
  resourceType: string
): Promise<number> {
  const { start, end } = getCurrentPeriod();

  const [usage] = await db
    .select()
    .from(platformUsage)
    .where(
      and(
        eq(platformUsage.userId, userId),
        eq(platformUsage.resourceType, resourceType),
        gte(platformUsage.periodStart, start),
        lte(platformUsage.periodEnd, end)
      )
    )
    .limit(1);

  return usage?.usageCount || 0;
}

/**
 * Increment platform usage for a user and resource type
 */
export async function incrementPlatformUsage(
  userId: string,
  resourceType: string,
  amount: number = 1
): Promise<number> {
  const { start, end } = getCurrentPeriod();

  // Try to find existing usage record for this period
  const [existing] = await db
    .select()
    .from(platformUsage)
    .where(
      and(
        eq(platformUsage.userId, userId),
        eq(platformUsage.resourceType, resourceType),
        gte(platformUsage.periodStart, start),
        lte(platformUsage.periodEnd, end)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing record
    const newCount = existing.usageCount + amount;
    await db
      .update(platformUsage)
      .set({
        usageCount: newCount,
        updatedAt: new Date(),
      })
      .where(eq(platformUsage.id, existing.id));

    return newCount;
  } else {
    // Create new record for this period
    const [newUsage] = await db
      .insert(platformUsage)
      .values({
        userId,
        resourceType,
        usageCount: amount,
        periodStart: start,
        periodEnd: end,
      })
      .returning();

    return newUsage.usageCount;
  }
}

/**
 * Check if user has exceeded platform usage limit
 */
export async function checkPlatformUsageLimit(
  userId: string,
  resourceType: string,
  limit: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const current = await getPlatformUsage(userId, resourceType);

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

/**
 * Get all platform usage for a user (all resource types)
 */
export async function getAllPlatformUsage(userId: string): Promise<
  Array<{
    resourceType: string;
    usageCount: number;
    periodStart: Date;
    periodEnd: Date;
  }>
> {
  const { start, end } = getCurrentPeriod();

  const usageRecords = await db
    .select({
      resourceType: platformUsage.resourceType,
      usageCount: platformUsage.usageCount,
      periodStart: platformUsage.periodStart,
      periodEnd: platformUsage.periodEnd,
    })
    .from(platformUsage)
    .where(
      and(
        eq(platformUsage.userId, userId),
        gte(platformUsage.periodStart, start),
        lte(platformUsage.periodEnd, end)
      )
    );

  return usageRecords;
}
