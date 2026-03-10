import { describe, it, expect } from "vitest";
import { extractUsername } from "@/lib/instagram";

describe("extractUsername", () => {
  it("returns plain username as-is", () => {
    expect(extractUsername("hasti.salar1")).toBe("hasti.salar1");
  });

  it("strips @ prefix", () => {
    expect(extractUsername("@hasti.salar1")).toBe("hasti.salar1");
  });

  it("trims whitespace", () => {
    expect(extractUsername("  hasti.salar1  ")).toBe("hasti.salar1");
  });

  it("extracts from full https URL", () => {
    expect(extractUsername("https://www.instagram.com/hasti.salar1/")).toBe("hasti.salar1");
  });

  it("extracts from URL without trailing slash", () => {
    expect(extractUsername("https://www.instagram.com/hasti.salar1")).toBe("hasti.salar1");
  });

  it("extracts from URL without www", () => {
    expect(extractUsername("https://instagram.com/hasti.salar1/")).toBe("hasti.salar1");
  });

  it("extracts from URL without protocol", () => {
    expect(extractUsername("instagram.com/hasti.salar1/")).toBe("hasti.salar1");
  });

  it("extracts from http URL", () => {
    expect(extractUsername("http://www.instagram.com/hasti.salar1")).toBe("hasti.salar1");
  });

  it("handles underscores in username", () => {
    expect(extractUsername("https://instagram.com/some_user_123/")).toBe("some_user_123");
  });
});
