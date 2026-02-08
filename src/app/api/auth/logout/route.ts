import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, sessions } from "@/db";
import { eq } from "drizzle-orm";
import { clearSessionCookie } from "@/lib/auth/utils";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (token) {
      // Delete session from database
      await db.delete(sessions).where(eq(sessions.token, token));
    }

    // Clear the cookie
    await clearSessionCookie();

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
