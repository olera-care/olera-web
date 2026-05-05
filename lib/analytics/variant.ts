// Deterministic variant assignment for the SBF intake A/B test on provider
// pages. Pure function: same sessionId always returns the same arm, so a user
// sees the same variant for the lifetime of their session cookie (30 days per
// lib/analytics/session.ts). No infra; no flag service; no admin UI.
//
// Hash: djb2. Cheap, no dep, well-distributed for short strings like UUIDs.
//
// ─── 5-arm IntakeVariant (canonical, since 2026-05-05) ──────────────────────
// Adds a "qa_email_capture" arm on top of the existing 4. The 20% in this arm
// see NO benefits / outreach module on the provider page; instead the Q&A
// section's post-submit guest enrichment prompt is enabled (it's normally
// suppressed when SBF is on the page) with an upgraded value-promise. Tests
// the hypothesis that the SBF on provider pages was cannibalizing Q&A's email
// capture instead of complementing it. See plans/family-acquisition-radical-ideas.md.
//
//   availability     — "There's help paying for care in {state}."   (benefits, positive)
//   loss             — "Most {state} families miss out on help…"     (benefits, loss)
//   empathic         — "Care is expensive."                          (benefits, shared-truth)
//   outreach         — "Have an AI agent contact the top providers." (H1 demand test)
//   qa_email_capture — Q&A enrichment ON, SBF / outreach OFF.        (qa-first email capture)
//
// Mod 5 → 0/1/2/3/4 mapped to availability/loss/empathic/outreach/qa_email_capture.
// Page-level routing decides which surface renders. BenefitsDiscoveryModule,
// AgentOutreachModule, and QASectionV2's enrichment prompt are mutually
// exclusive across the 5 arms.
//
// ─── 3-arm BenefitsVariant (legacy, kept for in-flight V3 caller) ───────────
// BenefitsDiscoveryModule still assigns its own variant via assignBenefitsVariant
// for the 3-arm V3 SBF copy A/B. Task 5 of the agent-outreach plan will lift
// variant assignment to the page (single source of truth) and remove the legacy
// 3-arm function. Until then, the two APIs coexist; routing logic that needs
// to choose between BenefitsDiscoveryModule, AgentOutreachModule, and the
// qa_email_capture path must call assignIntakeVariant (mod 5).
//
// V3 rename history (2026-04-30): replaced the old "control" | "money_loss"
// 2-arm copy A/B with the 3-arm test on the rebuilt 2-step embedded SBF. Each
// arm changes only the H2/sub copy on step 1; everything downstream is identical.
//
// Live copy strings + per-variant performance tracked in Notion:
//   https://app.notion.com/p/ec27110d1c6a4cc1a76bdf991344f63d

export type IntakeVariant =
  | "availability"
  | "loss"
  | "empathic"
  | "outreach"
  | "qa_email_capture";

/** Narrow alias for the 3 benefits-copy arms. Excludes the outreach arm
 *  because the BenefitsDiscoveryModule never legitimately renders for it,
 *  and qa_email_capture because it suppresses the SBF entirely. */
export type BenefitsVariant = Exclude<IntakeVariant, "outreach" | "qa_email_capture">;

const INTAKE_VARIANTS: IntakeVariant[] = [
  "availability",
  "loss",
  "empathic",
  "outreach",
  "qa_email_capture",
];
const BENEFITS_VARIANTS: BenefitsVariant[] = ["availability", "loss", "empathic"];

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // (hash * 33) + char, kept in 32-bit range via `| 0`
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // coerce to unsigned 32-bit
}

/** Canonical 5-arm assignment. Use this at the page-level routing point to
 *  choose between BenefitsDiscoveryModule, AgentOutreachModule, and the
 *  qa_email_capture path (no module; Q&A enrichment ON). gcd(3,5)=1 keeps
 *  the legacy mod-3 BenefitsDiscoveryModule copy A/B uncorrelated, so the
 *  3 benefits arms still distribute uniformly within their slice. */
export function assignIntakeVariant(sessionId: string): IntakeVariant {
  return INTAKE_VARIANTS[djb2(sessionId) % 5];
}

/** Legacy 3-arm assignment — kept for BenefitsDiscoveryModule's in-component
 *  variant state until Task 5 lifts variant routing to the page level. */
export function assignBenefitsVariant(sessionId: string): BenefitsVariant {
  return BENEFITS_VARIANTS[djb2(sessionId) % 3];
}
