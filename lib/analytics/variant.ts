// Deterministic variant assignment for the SBF intake A/B test on provider
// pages. Pure function: same sessionId always returns the same arm, so a user
// sees the same variant for the lifetime of their session cookie (30 days per
// lib/analytics/session.ts). No infra; no flag service; no admin UI.
//
// Hash: djb2. Cheap, no dep, well-distributed for short strings like UUIDs.
//
// ─── 5-arm IntakeVariant (canonical, since 2026-05-05) ──────────────────────
// Adds "inline_answer" arm to the existing 4-arm A/B. The 20% in the
// inline_answer arm see an inline Q&A experience: when tapping a suggested
// question, it expands with a template answer + email capture, without
// leaving the page. Tests inline conversion vs the benefits module handoff.
//
//   availability   — "There's help paying for care in {state}." (benefits, positive)
//   loss           — "Most {state} families miss out on help…"   (benefits, loss)
//   empathic       — "Care is expensive."                        (benefits, shared-truth)
//   outreach       — "Have an AI agent contact the top providers." (H1 demand test)
//   inline_answer  — Inline Q&A answer expansion with email capture (H2 inline UX test)
//
// Mod 5 → 0/1/2/3/4 mapped to availability/loss/empathic/outreach/inline_answer.
// Page-level routing decides which module to render; BenefitsDiscoveryModule,
// AgentOutreachModule, and the inline Q&A experience are mutually exclusive.
//
// ─── 3-arm BenefitsVariant (legacy, kept for in-flight V3 caller) ───────────
// BenefitsDiscoveryModule still assigns its own variant via assignBenefitsVariant
// for the 3-arm V3 SBF copy A/B. Task 5 of the agent-outreach plan will lift
// variant assignment to the page (single source of truth) and remove the legacy
// 3-arm function. Until then, the two APIs coexist; routing logic that needs
// to choose between BenefitsDiscoveryModule, AgentOutreachModule, and the
// inline answer experience must call assignIntakeVariant (mod 5).
//
// V3 rename history (2026-04-30): replaced the old "control" | "money_loss"
// 2-arm copy A/B with the 3-arm test on the rebuilt 2-step embedded SBF. Each
// arm changes only the H2/sub copy on step 1; everything downstream is identical.
//
// Live copy strings + per-variant performance tracked in Notion:
//   https://app.notion.com/p/ec27110d1c6a4cc1a76bdf991344f63d

export type IntakeVariant = "availability" | "loss" | "empathic" | "outreach" | "inline_answer";

/** Narrow alias for the 3 benefits-copy arms. Excludes the outreach arm and
 *  inline_answer arm because the BenefitsDiscoveryModule never legitimately
 *  renders for them. */
export type BenefitsVariant = Exclude<IntakeVariant, "outreach" | "inline_answer">;

const INTAKE_VARIANTS: IntakeVariant[] = ["availability", "loss", "empathic", "outreach", "inline_answer"];
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
 *  inline Q&A answer experience. */
export function assignIntakeVariant(sessionId: string): IntakeVariant {
  return INTAKE_VARIANTS[djb2(sessionId) % 5];
}

/** Legacy 3-arm assignment — kept for BenefitsDiscoveryModule's in-component
 *  variant state until Task 5 lifts variant routing to the page level. */
export function assignBenefitsVariant(sessionId: string): BenefitsVariant {
  return BENEFITS_VARIANTS[djb2(sessionId) % 3];
}
