import { describe, it, expect, vi, beforeEach } from "vitest";
import { scrapeSchema } from "@/lib/types";

describe("scrapeSchema", () => {
  it("validates valid input", () => {
    const result = scrapeSchema.safeParse({
      username: "hasti.salar1",
      resultsLimit: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = scrapeSchema.safeParse({
      username: "",
      resultsLimit: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects resultsLimit over 200", () => {
    const result = scrapeSchema.safeParse({
      username: "test",
      resultsLimit: 300,
    });
    expect(result.success).toBe(false);
  });

  it("defaults resultsLimit to 50", () => {
    const result = scrapeSchema.safeParse({ username: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resultsLimit).toBe(50);
    }
  });
});

describe("Instagram post filtering", () => {
  it("filters out posts without captions", () => {
    const rawPosts = [
      { caption: "Hello world", displayUrl: "https://img.com/1.jpg", likesCount: 10 },
      { caption: "", displayUrl: "https://img.com/2.jpg", likesCount: 5 },
      { caption: null, displayUrl: "https://img.com/3.jpg", likesCount: 3 },
      { displayUrl: "https://img.com/4.jpg", likesCount: 1 },
    ];

    const filtered = (rawPosts as Record<string, unknown>[]).filter(
      (p) => typeof p.caption === "string" && (p.caption as string).trim().length > 0
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].caption).toBe("Hello world");
  });
});
