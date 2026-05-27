import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-in-production"
);
const COOKIE_NAME = "bbi_admin";

// Public admin API routes (login + logout) don't require auth.
const PUBLIC_API_ROUTES = ["/api/admin/login", "/api/admin/logout"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public admin routes
  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectOrJson(req, pathname);
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return redirectOrJson(req, pathname);
  }
}

function redirectOrJson(req: NextRequest, pathname: string) {
  // API routes → JSON 401
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Pages → redirect to /login
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
