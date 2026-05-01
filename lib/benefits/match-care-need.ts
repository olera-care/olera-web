/**
 * Care-need → program matching.
 *
 * Single source of truth for the regex-keyword matcher used by both:
 *   - components/providers/BenefitsDiscoveryModule.tsx (in-session)
 *   - /m/[token]/page.tsx via lib/benefits-token.ts (post-session)
 *
 * The matcher is intentionally simple: it looks at program name/shortName/
 * tagline and tests against a per-care-need keyword regex. This lets us
 * filter program lists fast without any LLM/scoring step. Trade: occasional
 * false positives (e.g., "Caregiver Support" matches `companionship` AND
 * `stayingAtHome` because of "support"-like keywords). Acceptable for v1
 * because the panel surface limits to ~8 matches and ranks by program
 * priority data downstream.
 */

export type CareNeed =
  | "stayingAtHome"
  | "payingForCare"
  | "memoryHealth"
  | "companionship";

/**
 * Minimal shape the matcher needs. Accepts both the lightweight
 * BenefitsProgram (embedded module) and the full WaiverProgram (server-side
 * resolver) via structural typing.
 */
export interface MatchableProgram {
  name: string;
  shortName?: string | null;
  tagline?: string | null;
}

const PATTERNS: Record<CareNeed, RegExp> = {
  stayingAtHome:
    /\b(home care|home.based|hcbs|community.based|in.home|attendant|adult day|waiver|personal care|daily|stay home)\b/,
  payingForCare:
    /\b(medicare savings|financial|cash|premium|snap|food|ssi|pension|assistance|qmb|slmb|pharmac|low.income|groceries|pay)\b/,
  memoryHealth:
    /\b(memory|alzheimer|dementia|medical|health|pace|medicaid|nursing|hospice|prescription)\b/,
  companionship:
    /\b(companion|support|caregiver|respite|social)\b/,
};

export function matchesCareNeed(
  program: MatchableProgram,
  careNeed: CareNeed | null,
): boolean {
  if (!careNeed) return true;
  const text = `${program.name} ${program.shortName ?? ""} ${program.tagline ?? ""}`.toLowerCase();
  return PATTERNS[careNeed].test(text);
}

/**
 * Map UI care-need to display label, used in copy like "Based on what you
 * shared — paying for care."
 */
export const CARE_NEED_LABEL: Record<CareNeed, string> = {
  stayingAtHome: "in-home care",
  payingForCare: "paying for care",
  memoryHealth: "memory & medical care",
  companionship: "caregiver & social support",
};
