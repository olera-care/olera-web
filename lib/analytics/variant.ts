// Deterministic 50/50 variant assignment for the benefits-intake A/B test.
// Pure function: same sessionId always returns the same arm, so a user sees
// the same variant for the lifetime of their session cookie (30 days per
// lib/analytics/session.ts). No infra; no flag service; no admin UI.
//
// Hash: djb2. Cheap, no dep, well-distributed for short strings like UUIDs.
// Mod 2 → control if even, money_loss if odd.

export type BenefitsVariant = "control" | "money_loss";

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // (hash * 33) + char, kept in 32-bit range via `| 0`
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // coerce to unsigned 32-bit
}

export function assignBenefitsVariant(sessionId: string): BenefitsVariant {
  return djb2(sessionId) % 2 === 0 ? "control" : "money_loss";
}
