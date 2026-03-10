import { describe, it, expect, vi, beforeEach } from "vitest";

const createRequest = (password: string) =>
  new Request("http://localhost/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

describe("POST /api/auth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 200 for correct password", async () => {
    vi.stubEnv("APP_PASSWORD", "secret123");
    const { POST } = await import("./route");
    const res = await POST(createRequest("secret123"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 for wrong password", async () => {
    vi.stubEnv("APP_PASSWORD", "secret123");
    const { POST } = await import("./route");
    const res = await POST(createRequest("wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 500 when APP_PASSWORD not set", async () => {
    vi.stubEnv("APP_PASSWORD", "");
    const { POST } = await import("./route");
    const res = await POST(createRequest("anything"));
    expect(res.status).toBe(500);
  });
});
