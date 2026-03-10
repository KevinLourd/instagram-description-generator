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
  it("allows access to /api/auth without cookie", () => {
    const res = middleware(createRequest("/api/auth"));
    expect(res.status).toBe(200);
  });

  it("blocks API routes without auth cookie", () => {
    const res = middleware(createRequest("/api/posts"));
    expect(res.status).toBe(401);
  });

  it("allows API routes with auth cookie", () => {
    const res = middleware(createRequest("/api/posts", true));
    expect(res.status).toBe(200);
  });

  it("does not block page routes (handled by AuthGate)", () => {
    const res = middleware(createRequest("/"));
    expect(res.status).toBe(200);
  });

  it("does not block page routes without auth", () => {
    const res = middleware(createRequest("/posts"));
    expect(res.status).toBe(200);
  });
});
