/**
 * @file route.ts
 * @description User profile management endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/utils";
import { createErrorResponse } from "@/types/api";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

/**
 * PATCH /api/user/profile - Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();
    const result = UpdateProfileSchema.safeParse(body);

    if (!result.success) {
      return createErrorResponse("Invalid request body", 400, result.error.message);
    }

    const { name } = result.data;

    // Update user profile
    const [updatedUser] = await db
      .update(users)
      .set({
        name: name ?? user.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    return NextResponse.json({
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("[API] Update profile error:", error);
    return createErrorResponse(
      "Failed to update profile",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * GET /api/user/profile - Get user profile
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Get profile error:", error);
    return createErrorResponse(
      "Failed to get profile",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
