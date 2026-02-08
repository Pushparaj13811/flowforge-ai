import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  createSession,
  setSessionCookie,
  linkAnonymousWorkflows,
} from "@/lib/auth/utils";
import {
  SignupRequestSchema,
  parseRequestBody,
  createErrorResponse,
} from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const result = await parseRequestBody(request, SignupRequestSchema);
    if (!result.success) {
      return createErrorResponse("Invalid request body", 400, result.error);
    }

    const { email, password, name } = result.data;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return createErrorResponse("Email already registered", 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
      })
      .returning();

    // Create session
    const token = await createSession(newUser.id);
    await setSessionCookie(token);

    // Link any anonymous workflows to the new user
    const linkedWorkflows = await linkAnonymousWorkflows(newUser.id);

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = newUser;

    return NextResponse.json({
      user: {
        id: safeUser.id,
        email: safeUser.email,
        name: safeUser.name,
      },
      linkedWorkflows,
      message:
        linkedWorkflows > 0
          ? `Account created and ${linkedWorkflows} workflow(s) linked to your account`
          : "Account created successfully",
    });
  } catch (error) {
    console.error("[API] Signup error:", error);
    return createErrorResponse(
      "Failed to create account",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
