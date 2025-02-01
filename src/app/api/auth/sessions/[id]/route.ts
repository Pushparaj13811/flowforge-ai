/**
 * @file route.ts
 * @description Individual session management endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { db, sessions } from "@/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, getCurrentSession } from "@/lib/auth/utils";
import { createErrorResponse } from "@/types/api";

/**
 * DELETE /api/auth/sessions/:id - Revoke a specific session
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

    // Verify the session belongs to this user
    const [existingSession] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, user.id)))
      .limit(1);

    if (!existingSession) {
      return createErrorResponse("Session not found", 404);
    }

    // Check if trying to revoke current session
    const currentSession = await getCurrentSession();
    if (currentSession?.id === id) {
      return createErrorResponse("Cannot revoke current session", 400);
    }

    // Delete the session
    await db.delete(sessions).where(eq(sessions.id, id));

    return NextResponse.json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("[API] Revoke session error:", error);
    return createErrorResponse(
      "Failed to revoke session",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
