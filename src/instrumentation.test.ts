import { describe, it, expect, vi, afterEach } from "vitest";

describe("instrumentation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("suppresses DEP0169 deprecation warning", async () => {
    const warningHandler = vi.fn();
    process.on("warning", warningHandler);

    const { register } = await import("./instrumentation");
    register();

    const warning = new Error("url.parse() is deprecated");
    Object.assign(warning, { name: "DeprecationWarning", code: "DEP0169" });
    process.emit("warning", warning as never);

    expect(warningHandler).not.toHaveBeenCalled();
    process.removeListener("warning", warningHandler);
  });

  it("does not throw when process.emit is not a function (Edge runtime)", async () => {
    const original = process.emit;
    // Simulate Edge runtime where process.emit is not a function
    // @ts-expect-error - testing edge runtime polyfill
    process.emit = false;

    const { register } = await import("./instrumentation");
    expect(() => register()).not.toThrow();

    process.emit = original;
  });

  it("does not suppress other warnings", async () => {
    const warningHandler = vi.fn();
    process.on("warning", warningHandler);

    const { register } = await import("./instrumentation");
    register();

    const warning = new Error("some other warning");
    Object.assign(warning, { name: "DeprecationWarning", code: "DEP0099" });
    process.emit("warning", warning as never);

    expect(warningHandler).toHaveBeenCalled();
    process.removeListener("warning", warningHandler);
  });
});
