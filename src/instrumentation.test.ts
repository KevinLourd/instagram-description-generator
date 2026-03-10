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
