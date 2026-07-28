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

/** Benefits results text — match/no-match branch lives here, next to the copy. */
export function benefitsResultsSms(p: { matchCount: number; familyPhrase: string; url: string }): string {
  const programWord = p.matchCount === 1 ? "program" : "programs";
  return p.matchCount > 0
    ? `Olera: We found ${p.matchCount} care benefit ${programWord} for ${p.familyPhrase}. View: ${p.url} Reply STOP to opt out.`
    : `Olera: Your care benefit search is saved. We'll keep looking. View: ${p.url} Reply STOP to opt out.`;
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
  return `Olera: Your first step for ${p.programShortName}: call ${p.phone}.${docLine} Guide: ${p.url} Reply STOP to opt out.`;
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
    ? `Olera: You started ${p.programShortName}. Your next step is ready on your plan: ${p.url} Reply STOP to opt out.`
    : `Olera: How's ${p.programShortName} going? Tell us with one tap and see your next step: ${p.url} Reply STOP to opt out.`;
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
