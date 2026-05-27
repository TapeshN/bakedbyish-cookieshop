import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE_NAME_EXPORT, EXPIRES_IN_EXPORT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

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
