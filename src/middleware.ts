import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Only protect API routes (pages are protected by AuthGate component)
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow auth endpoint without cookie
  if (pathname === "/api/auth") {
    return NextResponse.next();
  }

  const auth = request.cookies.get("auth");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/api/:path*"],
};
