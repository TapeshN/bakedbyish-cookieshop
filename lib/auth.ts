import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-in-production"
);
const COOKIE_NAME = "bbi_admin";
const EXPIRES_IN  = 60 * 60 * 24 * 7; // 7 days

/**
 * Constant-time password comparison — prevents timing attacks.
 * Compares the supplied password against ADMIN_PASSWORD env var.
 */
export function verifyPassword(supplied: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ── In-memory login rate limiter (per IP) ──────────────────────────────────
// 5 failed attempts per 10 minutes per IP.
type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 10 * 60 * 1000;

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.resetAt < now) {
    return { allowed: true, remaining: MAX_ATTEMPTS, resetIn: 0 };
  }
  return {
    allowed: a.count < MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - a.count),
    resetIn: Math.max(0, a.resetAt - now),
  };
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    a.count++;
  }
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

export async function createSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN}s`)
    .sign(SECRET);
  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
export const EXPIRES_IN_EXPORT  = EXPIRES_IN;
