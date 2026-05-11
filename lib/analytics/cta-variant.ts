// Deterministic variant assignment for the CTA A/B test on provider pages.
// Pure function: same sessionId always returns the same arm, so a user sees
// the same variant for the lifetime of their session cookie (30 days per
// lib/analytics/session.ts).
//
// Hash: djb2. Cheap, no dep, well-distributed for short strings like UUIDs.
//
// ─── 1-arm CTAVariant (initial state) ────────────────────────────────────────
// Starts with "legacy" only — wraps the current CTA without modifying internals.
// Future arms can be added here (e.g., "compact", "social_proof", "urgency").
//
//   legacy — Current CTA (ConnectionCardWithRedirect + MobileStickyBottomCTA)
//
// Page-level routing decides which surface renders. The CTAVariantRouter
// component routes to the correct CTA implementation based on the assigned arm.

/**
 * Canonical list of CTA variant arms. The array is the source of truth —
 * CTAVariant derives from it via `as const`, and the weights helper, admin
 * UI, and assignment logic all iterate this list rather than hardcoding
 * individual arm names. Adding a new arm is a one-line append here (plus a
 * copy entry in cta-variant-copy.ts and an updated default-weights map
 * below — TypeScript will flag both).
 */
export const CTA_VARIANTS = ["legacy", "inbox_preview", "compare"] as const;

export type CTAVariant = (typeof CTA_VARIANTS)[number];

/** Default weights used when the experiment_weights row is missing or
 *  unreadable. Legacy starts at 100% since it's the only arm. */
export const CTA_VARIANT_DEFAULT_WEIGHTS: Record<CTAVariant, number> = {
  legacy: 100,
  inbox_preview: 0,
  compare: 0,
};

export type CTAWeightMap = Partial<Record<CTAVariant, number>>;

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // (hash * 33) + char, kept in 32-bit range via `| 0`
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // coerce to unsigned 32-bit
}

/** Equal-split assignment across the canonical arms. Kept for callers that
 *  haven't been wired to the weighted path yet. New code should use
 *  assignCTAVariantWeighted at the page-level routing point. */
export function assignCTAVariant(sessionId: string): CTAVariant {
  return CTA_VARIANTS[djb2(sessionId) % CTA_VARIANTS.length];
}

/**
 * Weighted assignment. Given a per-variant percentage map and a config
 * version, returns the arm this session falls into.
 *
 * `weights`: dict of variant → integer 0-100. Missing keys default to 0
 *   (arm is dark). Sum is expected to be 100 but the function is robust
 *   to drift — it normalizes against the actual sum, so e.g. {a:50,b:50}
 *   and {a:1,b:1} both yield a 50/50 split. If the sum is 0 (every arm
 *   zeroed out, malformed row, etc.) we fall back to equal split across
 *   the canonical arms rather than going dark.
 *
 * `version`: namespaced into the hash so a deliberate weight change
 *   reshuffles returning sessions in one cut. Same sessionId + same
 *   version always returns the same arm.
 */
export function assignCTAVariantWeighted(
  sessionId: string,
  weights: CTAWeightMap,
  version: number,
): CTAVariant {
  const total = CTA_VARIANTS.reduce((sum, v) => sum + Math.max(0, weights[v] ?? 0), 0);
  if (total <= 0) return CTA_VARIANTS[djb2(sessionId) % CTA_VARIANTS.length];

  // djb2 → unsigned 32-bit → [0, 1). Stable across runs of the same
  // (sessionId, version) input, which is what we need for stickiness.
  const r = djb2(`${sessionId}:cta:v${version}`) / 0x1_0000_0000;
  const target = r * total;

  let cumulative = 0;
  for (const v of CTA_VARIANTS) {
    cumulative += Math.max(0, weights[v] ?? 0);
    if (target < cumulative) return v;
  }
  // Floating-point pinhole — target landed on or past the last bucket
  // boundary. Pick the last variant with non-zero weight so the picked
  // arm is one the operator actually wants traffic in.
  for (let i = CTA_VARIANTS.length - 1; i >= 0; i--) {
    if ((weights[CTA_VARIANTS[i]] ?? 0) > 0) return CTA_VARIANTS[i];
  }
  return CTA_VARIANTS[0];
}
