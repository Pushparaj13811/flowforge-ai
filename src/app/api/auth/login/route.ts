import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  linkAnonymousWorkflows,
} from "@/lib/auth/utils";
import {
  LoginRequestSchema,
  parseRequestBody,
  createErrorResponse,
} from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const result = await parseRequestBody(request, LoginRequestSchema);
    if (!result.success) {
      return createErrorResponse("Invalid request body", 400, result.error);
    }

    const { email, password } = result.data;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return createErrorResponse("Invalid email or password", 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return createErrorResponse("Invalid email or password", 401);
    }

    // Create session
    const token = await createSession(user.id);
    await setSessionCookie(token);

    // Link any anonymous workflows to the user
    const linkedWorkflows = await linkAnonymousWorkflows(user.id);

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({
      user: {
        id: safeUser.id,
        email: safeUser.email,
        name: safeUser.name,
      },
      linkedWorkflows,
      message:
        linkedWorkflows > 0
          ? `Welcome back! ${linkedWorkflows} workflow(s) linked to your account`
          : "Login successful",
    });
  } catch (error) {
    console.error("[API] Login error:", error);
    return createErrorResponse(
      "Failed to login",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
