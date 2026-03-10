export function register() {
  // Suppress DEP0169 (url.parse) deprecation warning from Next.js internals.
  // Next.js uses url.parse() internally and there's no fix on their side yet.
  const originalEmit = process.emit.bind(process);
  // @ts-expect-error - overriding process.emit signature
  process.emit = function (event: string, ...args: unknown[]) {
    if (
      event === "warning" &&
      typeof args[0] === "object" &&
      args[0] !== null &&
      (args[0] as { name?: string }).name === "DeprecationWarning" &&
      (args[0] as { code?: string }).code === "DEP0169"
    ) {
      return false;
    }
    // @ts-expect-error - spreading args to original emit
    return originalEmit(event, ...args);
  };
}
