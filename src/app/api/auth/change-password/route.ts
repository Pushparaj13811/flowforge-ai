/**
 * @file route.ts
 * @description Change password endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/utils";
import { createErrorResponse } from "@/types/api";
import { z } from "zod";
import bcrypt from "bcryptjs";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

/**
 * POST /api/auth/change-password - Change user password
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();
    const result = ChangePasswordSchema.safeParse(body);

    if (!result.success) {
      return createErrorResponse("Invalid request body", 400, result.error.message);
    }

    const { currentPassword, newPassword } = result.data;

    // Get user with password hash
    const [dbUser] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) {
      return createErrorResponse("User not found", 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return createErrorResponse("Current password is incorrect", 400);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("[API] Change password error:", error);
    return createErrorResponse(
      "Failed to change password",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
