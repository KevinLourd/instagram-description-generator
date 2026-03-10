import { describe, it, expect, vi, beforeEach } from "vitest";

const createRequest = (password: string) =>
  new Request("http://localhost/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

describe("POST /api/auth", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns 200 and sets cookie for correct password", async () => {
    vi.stubEnv("APP_PASSWORD", "hasti");
    const { POST } = await import("./route");
    const res = await POST(createRequest("hasti"));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("auth=1");
  });

  it("is case-insensitive", async () => {
    vi.stubEnv("APP_PASSWORD", "hasti");
    const { POST } = await import("./route");
    const res = await POST(createRequest("Hasti"));
    expect(res.status).toBe(200);
  });

  it("returns 401 for wrong password", async () => {
    vi.stubEnv("APP_PASSWORD", "hasti");
    const { POST } = await import("./route");
    const res = await POST(createRequest("wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 401 for empty password", async () => {
    vi.stubEnv("APP_PASSWORD", "hasti");
    const { POST } = await import("./route");
    const res = await POST(createRequest(""));
    expect(res.status).toBe(401);
  });

  it("defaults to 'hasti' when APP_PASSWORD not set", async () => {
    delete process.env.APP_PASSWORD;
    const { POST } = await import("./route");
    const res = await POST(createRequest("hasti"));
    expect(res.status).toBe(200);
  });
});
