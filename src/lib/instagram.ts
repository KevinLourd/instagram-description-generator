/**
 * Extract an Instagram username from either a plain username or an Instagram URL.
 * Accepts formats like:
 *   - "hasti.salar1"
 *   - "@hasti.salar1"
 *   - "https://www.instagram.com/hasti.salar1/"
 *   - "https://instagram.com/hasti.salar1"
 *   - "instagram.com/hasti.salar1/"
 */
export const extractUsername = (input: string): string => {
  const trimmed = input.trim();

  // Try to extract from URL pattern
  const match = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)\/?/
  );
  if (match) return match[1];

  // Otherwise treat as plain username, strip @ prefix
  return trimmed.replace(/^@/, "");
};
