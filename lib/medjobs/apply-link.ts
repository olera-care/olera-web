/**
 * Canonical student apply link + attribution capture.
 *
 * Every student-facing path to the application — the flyer QR, the partner
 * portal "share" link, outreach emails — should route through ONE destination
 * (/medjobs/apply) carrying attribution so a partner-driven applicant can be
 * traced back to the campus (and, when known, the exact partner). This replaces
 * the prior 3-destination split (findmedjobs.co / /medjobs/apply / /medjobs).
 *
 * Params:
 *   campus = student_outreach_campuses.slug   (campus/university attribution)
 *   uni    = university display name          (pre-fills the form's University)
 *   pid    = the partner student_outreach id   (partner-level attribution; only
 *            portal links know this — the static flyer is campus-level only)
 *   src    = channel ("flyer" | "partner_share" | "outreach_email" | …)
 */

export interface StudentReferral {
  /** Campus slug (student_outreach_campuses.slug). */
  campus: string | null;
  /** The partner outreach row that drove this applicant, when known. */
  partner_outreach_id: string | null;
  /** Channel the applicant came through. */
  source: string | null;
}

export function studentApplyUrl(opts: {
  campusSlug?: string | null;
  universityName?: string | null;
  partnerOutreachId?: string | null;
  source?: string | null;
  siteUrl?: string;
}): string {
  const base = (opts.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://olera.care").replace(/\/+$/, "");
  const p = new URLSearchParams();
  if (opts.campusSlug) p.set("campus", opts.campusSlug);
  if (opts.universityName) p.set("uni", opts.universityName);
  if (opts.partnerOutreachId) p.set("pid", opts.partnerOutreachId);
  if (opts.source) p.set("src", opts.source);
  // The front door is now the eligibility screener on the families board.
  // screener=1 auto-opens it; attribution params ride along unchanged.
  p.set("screener", "1");
  return `${base}/medjobs/families?${p.toString()}`;
}

function clean(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t || null;
}

/** Sanitize a referral payload sent up from the apply form before storing it on
 *  the student profile. Returns null when there's nothing to attribute. */
export function sanitizeReferral(input: unknown): StudentReferral | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const campus = clean(o.campus, 80);
  const partner_outreach_id = clean(o.partner_outreach_id, 64);
  const source = clean(o.source, 40);
  if (!campus && !partner_outreach_id && !source) return null;
  return { campus, partner_outreach_id, source };
}
