import { describe, it, expect, vi, beforeEach } from "vitest";

describe("POST /api/auth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const callAuth = async (password: string) => {
    vi.stubEnv("APP_PASSWORD", "hasti");
    const { POST } = await import("@/app/api/auth/route");
    const request = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return POST(request);
  };

  it("returns 200 and sets cookie for correct password", async () => {
    const res = await callAuth("hasti");
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("auth=1");
  });

  it("is case-insensitive", async () => {
    const res = await callAuth("Hasti");
    expect(res.status).toBe(200);
  });

  it("returns 401 for wrong password", async () => {
    const res = await callAuth("wrong");
    expect(res.status).toBe(401);
  });

  it("returns 401 for empty password", async () => {
    const res = await callAuth("");
    expect(res.status).toBe(401);
  });
});
