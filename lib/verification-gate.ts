/**
 * Verification Gate Utility
 *
 * Determines if a provider account is restricted based on verification_state.
 * Used for gating highly suspicious claims (Flow A, low trust).
 */

export type VerificationState =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected"
  | "pending_verification"; // New: low-trust claim, must complete verification

/**
 * Returns true if the account is in a restricted state
 * (low-trust claim that hasn't completed verification)
 */
export function isAccountRestricted(
  verificationState: string | null | undefined
): boolean {
  return verificationState === "pending_verification";
}

/**
 * Returns true if verification has been submitted but not yet approved
 */
export function isVerificationPending(
  verificationState: string | null | undefined
): boolean {
  return verificationState === "pending";
}

/**
 * Returns true if the account has full access (verified or normal unverified)
 */
export function hasFullAccess(
  verificationState: string | null | undefined
): boolean {
  // "unverified" is the default state for normal accounts (not low-trust)
  // "verified" is for approved accounts
  // Only "pending_verification" and "pending" are restricted
  return (
    verificationState === "verified" ||
    verificationState === "unverified" ||
    verificationState === null ||
    verificationState === undefined
  );
}

/**
 * Human-readable status for the banner
 */
export function getVerificationStatusMessage(
  verificationState: string | null | undefined
): {
  title: string;
  description: string;
  showVerificationCTA: boolean;
} {
  switch (verificationState) {
    case "pending_verification":
      return {
        title: "Verification Required",
        description:
          "Complete verification to unlock full access to your account.",
        showVerificationCTA: true,
      };
    case "pending":
      return {
        title: "Verification Under Review",
        description:
          "We're reviewing your submission. Most reviews complete within 1-2 business days.",
        showVerificationCTA: false,
      };
    default:
      return {
        title: "",
        description: "",
        showVerificationCTA: false,
      };
  }
}
