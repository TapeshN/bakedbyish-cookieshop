import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  COOKIE_NAME_EXPORT,
  EXPIRES_IN_EXPORT,
  verifyPassword,
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
} from "@/lib/auth";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    const mins = Math.ceil(rl.resetIn / 60_000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${mins} min.` },
      { status: 429 }
    );
  }

  const { password } = await req.json();

  if (typeof password !== "string" || !verifyPassword(password)) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  clearAttempts(ip);

  const token = await createSession();
  const res = NextResponse.json({ ok: true });

  res.cookies.set(COOKIE_NAME_EXPORT, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   EXPIRES_IN_EXPORT,
    path:     "/",
  });

  return res;
}
