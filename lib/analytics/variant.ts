// Deterministic 3-way variant assignment for the benefits-intake A/B test.
// Pure function: same sessionId always returns the same arm, so a user sees
// the same variant for the lifetime of their session cookie (30 days per
// lib/analytics/session.ts). No infra; no flag service; no admin UI.
//
// V3 rename (2026-04-30): replaces the old "control" | "money_loss" 2-arm
// copy A/B with a 3-arm test on the rebuilt 2-step embedded SBF. Each arm
// changes only the H2/sub copy on step 1; everything downstream is identical.
//
//   availability — "There's help paying for care in {state}." (positive frame)
//   loss         — "Most {state} families miss out on help paying for care."
//                   "$400-$900/month often goes unclaimed." (loss frame)
//   empathic     — "Care is expensive." (shared-truth frame)
//
// Hash: djb2. Cheap, no dep, well-distributed for short strings like UUIDs.
// Mod 3 → 0/1/2 mapped to availability/loss/empathic.
//
// Live copy strings + per-variant performance tracked in Notion:
//   https://app.notion.com/p/ec27110d1c6a4cc1a76bdf991344f63d

export type BenefitsVariant = "availability" | "loss" | "empathic";

const VARIANTS: BenefitsVariant[] = ["availability", "loss", "empathic"];

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // (hash * 33) + char, kept in 32-bit range via `| 0`
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // coerce to unsigned 32-bit
}

export function assignBenefitsVariant(sessionId: string): BenefitsVariant {
  return VARIANTS[djb2(sessionId) % 3];
}
