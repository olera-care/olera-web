/**
 * Shared validation utilities for user input.
 */

const MAX_DISPLAY_NAME_LENGTH = 100;

export interface ValidationResult {
  valid: boolean;
  value: string;
  error?: string;
}

/**
 * Validates and sanitizes a display name.
 *
 * - Trims whitespace
 * - Rejects empty/whitespace-only names
 * - Enforces max length of 100 characters
 *
 * @param name - The raw display name input
 * @returns ValidationResult with sanitized value or error message
 */
export function validateDisplayName(name: string | null | undefined): ValidationResult {
  if (!name) {
    return {
      valid: false,
      value: "",
      error: "Display name is required",
    };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      value: "",
      error: "Display name cannot be empty",
    };
  }

  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      valid: false,
      value: trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH),
      error: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`,
    };
  }

  return {
    valid: true,
    value: trimmed,
  };
}

/**
 * Sanitizes a display name without strict validation.
 * Used for fallback names derived from email or user metadata.
 *
 * - Trims whitespace
 * - Truncates to max length
 * - Returns fallback if empty
 *
 * @param name - The raw display name
 * @param fallback - Fallback value if name is empty (default: "User")
 * @returns Sanitized display name
 */
export function sanitizeDisplayName(
  name: string | null | undefined,
  fallback: string = "User"
): string {
  if (!name) return fallback;

  const trimmed = name.trim();
  if (trimmed.length === 0) return fallback;

  return trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

/**
 * Valid care type values accepted by the system.
 * Must match the CARE_TYPES arrays used in the frontend.
 */
export const VALID_CARE_TYPES = [
  "Home Care",
  "Home Health Care",
  "Assisted Living",
  "Memory Care",
  "Nursing Home",
  "Independent Living",
  "Hospice Care",
  "Adult Day Care",
  "Rehabilitation",
  "Private Caregiver",
  // Additional types from various sources
  "Personal Care",
  "Household Tasks",
  "Financial Help",
  "Medical Care",
  "Respite Care",
] as const;

export type ValidCareType = (typeof VALID_CARE_TYPES)[number];

/**
 * Validates and sanitizes a care types array.
 *
 * - Ensures input is an array (defaults to empty array if not)
 * - Filters out any values not in the accepted care types list
 * - Removes duplicates
 *
 * @param careTypes - The raw care types input (could be anything)
 * @returns Sanitized array of valid care types
 */
export function sanitizeCareTypes(
  careTypes: unknown
): string[] {
  // Default to empty array if null, undefined, or non-array
  if (!Array.isArray(careTypes)) {
    return [];
  }

  // Filter to only valid string values that are in the accepted list
  const validSet = new Set(VALID_CARE_TYPES as readonly string[]);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of careTypes) {
    if (typeof item === "string" && validSet.has(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }

  return result;
}

/**
 * Validates a return URL to prevent open redirect vulnerabilities.
 *
 * - Must be a relative path (starts with /)
 * - Cannot contain protocols (http://, https://, javascript:, etc.)
 * - Cannot contain encoded variants that could bypass validation
 * - Cannot contain // at the start (protocol-relative URLs)
 *
 * @param url - The return URL to validate
 * @param fallback - Fallback URL if validation fails (default: "/browse")
 * @returns Safe URL to redirect to
 */
export function validateReturnUrl(
  url: string | null | undefined,
  fallback: string = "/browse"
): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  const trimmed = url.trim();

  // Must start with a single forward slash (relative path)
  if (!trimmed.startsWith("/")) {
    return fallback;
  }

  // Reject protocol-relative URLs (//example.com)
  if (trimmed.startsWith("//")) {
    return fallback;
  }

  // Decode URL to catch encoded bypass attempts
  let decoded: string;
  try {
    // Double-decode to catch double-encoding attacks
    decoded = decodeURIComponent(decodeURIComponent(trimmed));
  } catch {
    // If decoding fails, the URL is malformed
    return fallback;
  }

  // Check decoded URL for dangerous patterns
  const dangerousPatterns = [
    /^\/\//,                    // Protocol-relative after decode
    /^\s*javascript:/i,         // JavaScript protocol
    /^\s*data:/i,               // Data protocol
    /^\s*vbscript:/i,           // VBScript protocol
    /^\s*file:/i,               // File protocol
    /:\/\//,                    // Any protocol indicator
    /@/,                        // Credentials in URL (user@host)
    /\\{2,}/,                   // Backslash sequences (IE quirk)
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(decoded) || pattern.test(trimmed)) {
      return fallback;
    }
  }

  // Additional check: ensure the path doesn't try to escape via encoded slashes
  if (decoded.includes("//") && decoded.indexOf("//") === 0) {
    return fallback;
  }

  return trimmed;
}
