/**
 * Admin preview mode for the intake A/B test.
 *
 * When the URL carries `?preview_arm=<variant>` and the variant matches one
 * of the canonical INTAKE_VARIANTS, the provider page enters preview mode:
 *   - useIntakeVariant short-circuits to the chosen arm (skips the
 *     hash + weighted-bucket assignment).
 *   - Every variant component skips its event-firing path (impressions,
 *     clicks, conversions) so admin inspection can't pollute the funnel.
 *   - Form submissions are blocked client-side — the components stay in
 *     their initial state, which is enough for evaluating copy + layout.
 *
 * The check is deliberately permission-less. The only thing an outside
 * party could do with knowledge of `?preview_arm=...` is force themselves
 * into a specific arm — they can't write data, exfiltrate, or harm
 * other users. Event-suppression keeps even those self-inflicted views
 * out of the analytics. Keeping it open avoids middleware complexity
 * for a tool used by 2-3 internal product people.
 *
 * Triggered from /admin/analytics → "Preview ↗" links on each variant
 * row in the BenefitsVariantSplit table and each card in the traffic
 * allocation dial.
 */

import { INTAKE_VARIANTS, type IntakeVariant } from "./variant";

export const PREVIEW_PARAM = "preview_arm";

/**
 * Returns the preview arm from the current URL, or null. Validates the
 * raw value against the canonical variant list — an unknown arm is
 * treated as no-override rather than silently mis-rendering.
 *
 * SSR-safe: returns null on the server. Components that need the value
 * during the first client paint should call this in an effect or rely
 * on the existing `useIntakeVariant` short-circuit.
 */
export function getPreviewArm(): IntakeVariant | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(PREVIEW_PARAM);
  if (!raw) return null;
  return (INTAKE_VARIANTS as readonly string[]).includes(raw)
    ? (raw as IntakeVariant)
    : null;
}

/** Convenience boolean for fire-site suppression checks. */
export function isPreviewMode(): boolean {
  return getPreviewArm() !== null;
}
