/**
 * Gate for the "Your Market" experience (provider client-acquisition diagnostic).
 *
 * ROLLED OUT 2026-06-04: now enabled for every provider. Phase 2 (compute-on-visit,
 * PR #924) makes the diagnostic work for any city, validated on real markets
 * (College Station, Round Rock, Naperville, Scottsdale — ~$1/city, rich data), so the
 * dogfood gate is lifted.
 *
 * To RE-GATE (kill-switch): set `ROLLED_OUT` to `false` — the original
 * Aggie / TJ / `?market=1` dogfood logic is preserved below and takes over.
 */
const ROLLED_OUT = true; // full rollout 2026-06-04 — set false to fall back to dogfood gating

export function marketGateEnabled(opts: { displayName?: string | null; email?: string | null }): boolean {
  if (ROLLED_OUT) return true;

  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("market")) return true;
  const name = (opts.displayName || "").toLowerCase();
  const email = (opts.email || "").toLowerCase();
  return name.includes("aggie") || email === "tfalohun@gmail.com";
}
