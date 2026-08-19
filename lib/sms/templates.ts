/**
 * SMS body templates — the single source of truth for every outbound text.
 *
 * Extracted from the send call sites so the admin SMS preview
 * (lib/sms-samples.ts → /admin/family-comms) always renders the LIVE copy —
 * the same guarantee the email gallery gets from lib/email-templates.
 *
 * Rules for bodies:
 *   - Keep ≤160 GSM-7 chars where possible (one segment).
 *   - Deep links must be STABLE (a sign-in path or guest token), never a
 *     short-lived magic link — quiet-hours queueing can deliver a text the
 *     next morning.
 *   - Family-facing proactive bodies carry "Reply STOP to opt out."
 */

/** Reply-alert: a provider proactively reached out about the family's care request. */
export function providerReachOutSms(p: { providerName: string; providerCity: string; url: string }): string {
  return `Olera: ${p.providerName} in ${p.providerCity} reached out about your care needs. Read & reply: ${p.url}`;
}

/** Reply-alert: a provider accepted/responded to the family's own inquiry. */
export function connectionResponseSms(p: { providerName: string; url: string }): string {
  return `Olera: ${p.providerName} responded to your care inquiry. Read & reply: ${p.url}`;
}

/** Provider alert: a family sent a new care inquiry (guest + authed paths). */
export function newInquirySms(p: { familyName?: string | null; url: string }): string {
  return `New care inquiry on Olera from ${p.familyName || "a family"}. View and respond: ${p.url}`;
}

/** Alert for a previously-pending connection released to the recipient's inbox. */
export function pendingInquirySms(p: { fromName: string; url: string }): string {
  return `New inquiry on Olera from ${p.fromName}. View and respond: ${p.url}`;
}

/** Stable labels written to email_log.metadata.copy_version. They let us
 * compare this full-cohort rollout with later copy without inferring versions
 * from message text. */
export const BENEFITS_RESULTS_SMS_COPY_VERSION = "question_led_v1_2026_08_19";
export const BENEFITS_RESULTS_ZERO_MATCH_SMS_COPY_VERSION = "zero_match_v1";

/** Benefits results text — match/no-match branch lives here, next to the copy. */
export function benefitsResultsSms(p: { matchCount: number; url: string }): string {
  return p.matchCount > 0
    ? `Olera care team: Need help choosing, qualifying, or applying? Reply. Plan: ${p.url} Next step within 48h. STOP to opt out.`
    : `Olera: We created your private Olera plan. No strong match yet; we'll keep checking. See it here: ${p.url} Reply STOP to opt out.`;
}

/** Benefits Cascade B1 — the ten-minute first step, texted. Mirrors the
 *  email; sent only with stored sms_consent. Direct URLs (no magic links —
 *  length budget). */
export function benefitsFirstStepSms(p: {
  programShortName: string;
  phone: string;
  topDocs: string[];
  url: string;
}): string {
  const docs = p.topDocs
    .slice(0, 2)
    .map((d) => d.toLowerCase().replace(/^(a|an|the)\s+/, ""))
    .join(" + ");
  const docLine = docs ? ` Have nearby: ${docs}.` : "";
  return `Olera: Your first step for ${p.programShortName}: call ${p.phone}.${docLine} Plan: ${p.url} Reply CALLED, NO ANSWER, or STUCK. Reply STOP to opt out.`;
}

/** Benefits Cascade B2 — the check-in, texted. Links to the family's living
 *  plan page (/m/{token}) where taps are captured. `done` = the family
 *  already marked the call made, so congratulate instead of asking. */
export function benefitsCheckInSms(p: {
  programShortName: string;
  url: string;
  done: boolean;
}): string {
  return p.done
    ? `Olera: You started ${p.programShortName}. What's happening now? Reply APPLIED, NEED DOCS, WAITING, or STUCK. Plan: ${p.url} Reply STOP to opt out.`
    : `Olera: Were you able to call ${p.programShortName}? Reply CALLED, NO ANSWER, or STUCK. Your plan: ${p.url} Reply STOP to opt out.`;
}

/** Provider alert: a MedJobs student applied. */
export function medjobsApplicationSms(p: { studentName: string; university?: string | null; url: string }): string {
  return `New MedJobs application from ${p.studentName} (${p.university || "student"}). View: ${p.url}`;
}

/** Claim-flow verification code (proves phone control). */
export function verificationCodeSms(code: string): string {
  return `Your Olera verification code is: ${code}. It expires in 10 minutes.`;
}

/** Auto-reply to an inbound HELP/INFO keyword (TwiML response body). */
export function smsHelpReply(): string {
  return "Olera: We text care-search updates and provider replies. Reply STOP to opt out. Help: olera.care/contact";
}

/**
 * Acknowledgement for a free-form question from a family. The ONLY message in
 * the Family Answers flow that goes out without a human reading it first, which
 * is why it makes no claims of any kind: it promises attention, not an answer.
 *
 * It also carries the disclaimer for the whole conversation. A per-message
 * legal line would eat the 480-char reply budget every time, but this text is
 * always the first thing a family hears back, so the caveat rides along once
 * and every later reply stays clean. Full terms live on the /m/{token} plan
 * page, which has no length limit.
 *
 * No "Reply STOP" line: this is transactional, sent in direct response to a
 * message the family just sent us, and STOP is already handled at the carrier
 * and in the webhook.
 */
/**
 * The 7-day outcome check for a researched answer we sent.
 *
 * Proactive, so it carries the STOP line. It names two keywords because the
 * answer has to be machine-readable: prose would create another message needing
 * a human, which is the cost this system exists to reduce. HELPED and NOTYET
 * are used rather than YES/NO because YES is a TCPA opt-in keyword handled
 * earlier in the webhook and STUCK belongs to the benefits cascade.
 *
 * It says why we are asking. People answer a question that has a visible point
 * more often than one that looks like a survey, and it happens to be true.
 */
export function familyAnswerFollowupSms(): string {
  return "Olera: Following up on the benefits help we sent last week. Did it get you anywhere? Reply HELPED if you got assistance, or NOTYET if you're still stuck. Either answer helps us do better for the next family. Reply STOP to opt out.";
}

export function familyAnswerAckSms(): string {
  return "Thanks for reaching out. We're looking into this and will get back to you with what we find. We share free resources and can get things wrong, so please confirm anything important with the agency.";
}
