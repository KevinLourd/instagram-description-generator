import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({
  neon: () => mockSql,
}));

beforeEach(() => {
  mockSql.mockReset();
  vi.resetModules();
});

describe("ensureTables", () => {
  it("runs CREATE TABLE statements on first call", async () => {
    mockSql.mockResolvedValue([]);
    const { ensureTables } = await import("@/lib/db");

    await ensureTables();

    expect(mockSql).toHaveBeenCalledTimes(3); // 2 tables + 1 index
  });

  it("only runs migration once (idempotent)", async () => {
    mockSql.mockResolvedValue([]);
    const { ensureTables } = await import("@/lib/db");

    await ensureTables();
    await ensureTables();

    expect(mockSql).toHaveBeenCalledTimes(3); // still 3, not 6
  });
});
