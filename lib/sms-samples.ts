/**
 * SMS variant registry — the texting sibling of lib/email-samples.ts. Renders
 * every outbound SMS from the LIVE templates (lib/sms/templates.ts) with
 * canned, PII-free fixtures. Powers the "SMS messages" panel + drawer on
 * /admin/family-comms.
 *
 * Unlike the email registry this is pure strings with no server dependencies,
 * so the admin page imports it directly — no sample API route needed.
 *
 * Constraints: fixtures MUST be deterministic and PII-free (mirror the
 * email-samples cast: Maria / Evergreen Senior Care / Killeen).
 */
import {
  providerReachOutSms,
  connectionResponseSms,
  newInquirySms,
  pendingInquirySms,
  benefitsResultsSms,
  medjobsApplicationSms,
  verificationCodeSms,
  smsHelpReply,
} from "@/lib/sms/templates";

export interface SmsVariant {
  /** Stable slug. */
  id: string;
  /** Who the text goes to. */
  audience: "family" | "provider";
  /** Display grouping in the panel. */
  group: string;
  label: string;
  /**
   * Underlying email_type written to email_log (channel='sms') — or null when
   * the call site sends without one, meaning the send is NOT in the app log
   * (Twilio still has it; the delivery panel reads Twilio directly).
   */
  emailType: string | null;
  /** What fires it, in plain terms — most SMS are event-driven, not cron-driven. */
  trigger: string;
  /** Automations-registry id that owns this text (for the per-job preview), mirroring EmailVariant.cron. */
  cron?: string;
  /** Who receives this — the eligibility, in plain terms. */
  who?: string;
  /** Why we send it — the intent behind the copy. */
  why?: string;
  /** Gates the send path applies before the text goes out (shown in the drawer). */
  gates?: string[];
  /** Renders the LIVE template with sample fixtures → the exact body text. */
  render: () => string;
}

/** Approximate GSM-7 charset: printable ASCII + newline + the common accented set
 *  (our bodies are plain ASCII in practice — this only needs to catch emoji/smart
 *  quotes sneaking in and flipping the whole message to 70-char UCS-2 segments). */
const GSM7 = /^[ -~\n\r€£¥èéùìòÇØøÅåÆæßÉÄÖÑÜäöñüà]*$/;

/** Character / segment / encoding math for a body — how carriers will bill it. */
export function smsSegmentInfo(body: string): { chars: number; segments: number; encoding: "GSM-7" | "UCS-2" } {
  const gsm = GSM7.test(body);
  const chars = body.length;
  const perSegment = gsm ? (chars <= 160 ? 160 : 153) : chars <= 70 ? 70 : 67;
  return { chars, segments: Math.max(1, Math.ceil(chars / perSegment)), encoding: gsm ? "GSM-7" : "UCS-2" };
}

const REACTIVE_GATES = [
  "Quiet hours: outside 8am–8pm recipient-local, the text queues (sms_queue) and delivers at the next window open",
  "Daily safety cap: max 6 reactive texts to one number per day",
  "Hard-blocked if the family texted STOP (phone_validity = opted_out)",
  "Skipped silently when the profile has no usable US phone",
];

export const SMS_VARIANTS: SmsVariant[] = [
  // ─────────────── Family · Reply alerts (Tier 1 reactive) ───────────────
  {
    id: "sms_provider_reach_out",
    cron: "family-reply-alert-texts",
    audience: "family",
    group: "Family · Reply alerts",
    label: "Provider reached out",
    emailType: "provider_reach_out",
    trigger: "A provider sends a reach-out message to a family's care request (matches flow)",
    who: "The family, the moment a provider reaches out about their care needs. Transactional — the family initiated the search, so no express opt-in is required and it's exempt from the governed nudge cap.",
    why: "SMS is the reactive nervous system: this is the exact event the family is waiting on, and a text reaches them hours before an unopened email. The link is the stable inbox URL (guest-token aware), never a 1-hour magic link, because a quiet-hours-queued text can land the next morning.",
    gates: REACTIVE_GATES,
    render: () =>
      providerReachOutSms({
        providerName: "Evergreen Senior Care",
        providerCity: "Killeen",
        url: "https://olera.care/portal/inbox?id=sample",
      }),
  },
  {
    id: "sms_connection_response",
    cron: "family-reply-alert-texts",
    audience: "family",
    group: "Family · Reply alerts",
    label: "Provider responded to inquiry",
    emailType: "connection_response",
    trigger: "A provider ACCEPTS the family's inquiry (accept-only — a decline stays email-only)",
    who: "A family whose own inquiry just got a provider response. Same Tier-1 transactional lane as the reach-out alert.",
    why: "Closes the asymmetry: we already text providers on new inquiries, so the family should hear just as fast when the provider gets back to them. Accept-only because a decline is a poor first text.",
    gates: REACTIVE_GATES,
    render: () =>
      connectionResponseSms({
        providerName: "Evergreen Senior Care",
        url: "https://olera.care/portal/inbox?id=sample",
      }),
  },

  // ─────────────── Provider · New lead alerts ───────────────
  {
    id: "sms_new_inquiry",
    cron: "provider-lead-alert-texts",
    audience: "provider",
    group: "Provider · Lead alerts",
    label: "New care inquiry",
    emailType: null,
    trigger: "A family submits a connection request to the provider (guest and signed-in paths)",
    who: "The provider on the receiving end of a fresh family inquiry, at their business_profiles phone (falling back to the directory-scraped olera-providers number).",
    why: "Speed-to-lead: an inquiry answered within minutes converts at a different rate than one answered the next day. Respects the provider's new_leads notification preference.",
    gates: [
      "Respects the provider's new_leads notification preference",
      "Skipped when no phone can be found or normalized",
      "Directory-scraped fallback numbers are often landlines — the delivery panel's 'bad number' bucket is mostly these",
    ],
    render: () =>
      newInquirySms({ familyName: "Maria", url: "https://olera.care/provider/connections" }),
  },
  {
    id: "sms_pending_inquiry",
    cron: "provider-lead-alert-texts",
    audience: "provider",
    group: "Provider · Lead alerts",
    label: "Pending inquiry delivered",
    emailType: null,
    trigger: "A held/pending connection is released to the recipient's inbox (deliver-pending-connections)",
    who: "The recipient of a connection that was created while undeliverable (e.g. unclaimed profile) and has now been released.",
    why: "The inquiry is only now actionable for them, so the alert fires at release time, not creation time.",
    gates: ["Respects the recipient's new_leads notification preference", "Skipped when no phone normalizes"],
    render: () => pendingInquirySms({ fromName: "Maria G", url: "https://olera.care/portal/inbox" }),
  },
  {
    id: "sms_medjobs_application",
    cron: "provider-lead-alert-texts",
    audience: "provider",
    group: "Provider · Lead alerts",
    label: "New MedJobs application",
    emailType: null,
    trigger: "A student applies to the provider through MedJobs",
    who: "A provider with an open MedJobs presence, when a student submits an application.",
    why: "Applications go stale fast — the text links straight to the candidate profile so the provider can respond while the student is still looking.",
    render: () =>
      medjobsApplicationSms({
        studentName: "Jordan Lee",
        university: "Texas A&M University",
        url: "https://olera.care/medjobs/candidates/jordan-lee",
      }),
  },

  // ─────────────── Family · Benefits results ───────────────
  {
    id: "sms_benefits_match",
    cron: "benefits-results-texts",
    audience: "family",
    group: "Family · Benefits results",
    label: "Benefits results — matches found",
    emailType: null,
    trigger: "Benefits quiz completed with ≥1 program match and a phone provided (fires alongside the results email)",
    who: "A new family who finished the benefits quiz, matched at least one program, and gave a phone number (phone-as-optional V3 flow).",
    why: "The results link is the payoff of the quiz they just took — the magic-token URL (/m/…) signs them straight in. Relationship-aware phrasing ('your mom') within the 160-char budget. Carries 'Reply STOP to opt out' since it's their first text from us.",
    render: () =>
      benefitsResultsSms({ matchCount: 4, familyPhrase: "your mom", url: "https://olera.care/m/sample" }),
  },
  {
    id: "sms_benefits_saved",
    cron: "benefits-results-texts",
    audience: "family",
    group: "Family · Benefits results",
    label: "Benefits results — saved, no match yet",
    emailType: null,
    trigger: "Benefits quiz completed with zero program matches and a phone provided",
    who: "Same moment as the match text, for families whose answers matched no program yet.",
    why: "An honest zero-state: their search is saved and we keep looking, rather than silence after they handed us a phone number.",
    render: () =>
      benefitsResultsSms({ matchCount: 0, familyPhrase: "your mom", url: "https://olera.care/m/sample" }),
  },

  // ─────────────── Transactional & auto-replies ───────────────
  {
    id: "sms_claim_code",
    cron: "transactional-texts",
    audience: "provider",
    group: "Transactional & auto-replies",
    label: "Claim verification code",
    emailType: null,
    trigger: "A provider claiming their listing chooses SMS verification",
    who: "A provider mid-claim who picked 'text me a code' over email.",
    why: "Proves control of the listing's phone number. Pure transactional; expires in 10 minutes.",
    render: () => verificationCodeSms("482916"),
  },
  {
    id: "sms_help_reply",
    cron: "transactional-texts",
    audience: "family",
    group: "Transactional & auto-replies",
    label: "HELP auto-reply",
    emailType: null,
    trigger: "Anyone texts HELP or INFO to our number (Twilio webhook, TwiML reply)",
    who: "Any inbound sender — TCPA requires a HELP response describing the program and the STOP path.",
    why: "Compliance keyword handling; the copy here is also what carriers and 10DLC reviewers see as our help message.",
    render: () => smsHelpReply(),
  },
];

/** Some automations deliver texts owned by another entry (the queue flush drains
 *  the reply alerts) — alias them so their detail page previews the same bodies. */
const SMS_CRON_ALIASES: Record<string, string> = {
  "sms-queue-flush": "family-reply-alert-texts",
};

/** Texts sent by a given automations-registry id (for the per-job preview). */
export function smsVariantsForCron(cronId: string): SmsVariant[] {
  const target = SMS_CRON_ALIASES[cronId] ?? cronId;
  return SMS_VARIANTS.filter((v) => v.cron === target);
}

/** Display order for panel groups. */
export const SMS_GROUP_ORDER = [
  "Family · Reply alerts",
  "Provider · Lead alerts",
  "Family · Benefits results",
  "Transactional & auto-replies",
] as const;
