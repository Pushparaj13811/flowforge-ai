/**
 * @file route.ts
 * @description User account management endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { db, users, sessions } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/utils";
import { createErrorResponse } from "@/types/api";
import { cookies } from "next/headers";

/**
 * DELETE /api/user - Delete user account and all associated data
 */
export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    // Delete all user sessions first
    await db.delete(sessions).where(eq(sessions.userId, user.id));

    // Delete the user (cascades will handle related data)
    await db.delete(users).where(eq(users.id, user.id));

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete("session");

    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("[API] Delete account error:", error);
    return createErrorResponse(
      "Failed to delete account",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
