/**
 * @file auth/utils.ts
 * @description Authentication utility functions
 */

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db, sessions, users, workflows } from "@/db";
import { eq, and, gt } from "drizzle-orm";

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = "session_token";
const ANONYMOUS_COOKIE_NAME = "anonymous_id";
const SESSION_EXPIRY_DAYS = 30;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Generate anonymous ID for tracking workflows before login
 */
export function generateAnonymousId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return `anon_${Array.from(array, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")}`;
}

/**
 * Create a session for a user
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get or create anonymous ID cookie
 */
export async function getOrCreateAnonymousId(): Promise<string> {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(ANONYMOUS_COOKIE_NAME)?.value;

  if (existingId) {
    return existingId;
  }

  const newId = generateAnonymousId();
  cookieStore.set(ANONYMOUS_COOKIE_NAME, newId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: "/",
  });

  return newId;
}

/**
 * Get anonymous ID from cookie (without creating)
 */
export async function getAnonymousId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ANONYMOUS_COOKIE_NAME)?.value ?? null;
}

/**
 * Clear anonymous ID cookie (after linking to user)
 */
export async function clearAnonymousIdCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ANONYMOUS_COOKIE_NAME);
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const result = await db
    .select({
      user: users,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { user } = result[0];
  // Don't return password hash
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Link anonymous workflows to user after login/signup
 */
export async function linkAnonymousWorkflows(userId: string): Promise<number> {
  const anonymousId = await getAnonymousId();

  if (!anonymousId) {
    return 0;
  }

  const result = await db
    .update(workflows)
    .set({
      userId,
      anonymousId: null,
      updatedAt: new Date(),
    })
    .where(eq(workflows.anonymousId, anonymousId));

  // Clear the anonymous ID cookie after linking
  await clearAnonymousIdCookie();

  return result.rowCount ?? 0;
}

/**
 * Delete a session
 */
export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Get current session object (not user)
 */
export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return session || null;
}

/**
 * Alias for getCurrentUser (for backwards compatibility)
 */
export const getSession = getCurrentUser;
