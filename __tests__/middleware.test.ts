import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

const createRequest = (path: string, hasAuthCookie = false) => {
  const url = `http://localhost${path}`;
  const req = new NextRequest(url);
  if (hasAuthCookie) {
    req.cookies.set("auth", "1");
  }
  return req;
};

describe("middleware", () => {
  it("allows access to /login without auth", () => {
    const res = middleware(createRequest("/login"));
    expect(res.status).not.toBe(307);
  });

  it("allows access to /api/auth without auth", () => {
    const res = middleware(createRequest("/api/auth"));
    expect(res.status).not.toBe(307);
  });

  it("redirects to /login when no auth cookie on /", () => {
    const res = middleware(createRequest("/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects to /login when no auth cookie on /posts", () => {
    const res = middleware(createRequest("/posts"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows access when auth cookie is present", () => {
    const res = middleware(createRequest("/", true));
    expect(res.status).not.toBe(307);
  });

  it("allows access to protected routes with auth cookie", () => {
    const res = middleware(createRequest("/posts", true));
    expect(res.status).not.toBe(307);
  });
});
