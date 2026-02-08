/**
 * @file route.ts
 * @description User sessions management endpoint
 */

import { NextResponse } from "next/server";
import { db, sessions } from "@/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser, getCurrentSession } from "@/lib/auth/utils";
import { createErrorResponse } from "@/types/api";

/**
 * GET /api/auth/sessions - List all active sessions for the user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const currentSession = await getCurrentSession();

    // Get all sessions for the user
    const userSessions = await db
      .select({
        id: sessions.id,
        createdAt: sessions.createdAt,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .orderBy(desc(sessions.createdAt));

    // Format sessions with additional info
    const formattedSessions = userSessions.map((session, index) => ({
      id: session.id,
      device: index === 0 ? "Current Device" : `Device ${index + 1}`,
      browser: "Web Browser",
      location: "Unknown",
      lastActive: session.createdAt.toISOString(),
      isCurrent: currentSession?.id === session.id,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("[API] Get sessions error:", error);
    return createErrorResponse(
      "Failed to get sessions",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
