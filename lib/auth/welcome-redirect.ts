/**
 * Whether a destination should skip the /welcome interstitial.
 *
 * /welcome is the care-seeker questionnaire: it asks what kind of care you
 * are looking for. That is the wrong question for anybody who is not a care
 * seeker, and when it appears between somebody and the page they clicked a
 * link to reach, it reads as the link being broken.
 *
 * This rule used to be written out three times — in AuthProvider, on the
 * magic-link page, and in the auth callback — each with a different idea of
 * what counted. AuthProvider exempted provider routes, the callback exempted
 * provider routes and a list of task URLs, and the magic-link page exempted
 * nothing at all. A student following a link to /portal/medjobs was sent to
 * the care-seeker questionnaire by two of the three, and fixing one of them
 * left the other two to keep doing it.
 *
 * One function, three callers. A new sign-in path gets the rule by importing
 * it, and scripts/check-welcome-redirect.ts fails the build if a fourth copy
 * is written by hand.
 */

/**
 * Destination prefixes belonging to somebody who is not a care seeker.
 *
 * Add a prefix here rather than at a call site.
 */
const NOT_A_CARE_SEEKER = [
  // A provider's own pages. Providers have their own onboarding.
  "/provider",
  // The MedJobs student portal — where a student finishes the application
  // they followed the link to finish.
  "/portal/medjobs",
] as const;

/**
 * True when this destination should be gone to directly, without /welcome.
 *
 * Takes a path, not a URL. A destination that is not a path — anything with a
 * scheme, or protocol-relative — is not ours to reason about and does not
 * skip anything.
 */
export function skipsWelcome(destination: string | null | undefined): boolean {
  if (typeof destination !== "string") return false;
  const path = destination.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return NOT_A_CARE_SEEKER.some(
    // Prefix match on a path boundary, so /providers-are-great does not pass
    // as /provider.
    (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`),
  );
}

/** The prefixes, for the check script. */
export const WELCOME_SKIP_PREFIXES: readonly string[] = NOT_A_CARE_SEEKER;
