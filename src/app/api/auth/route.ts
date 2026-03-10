import { NextResponse } from "next/server";

const APP_PASSWORD = process.env.APP_PASSWORD ?? "hasti";

export const POST = async (request: Request) => {
  const body = await request.json();
  const { password } = body as { password?: string };

  if (!password || password.toLowerCase() !== APP_PASSWORD.toLowerCase()) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
};
