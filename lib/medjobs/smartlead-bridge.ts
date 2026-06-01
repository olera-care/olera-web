/**
 * Smartlead Bridge — pure helpers (build-order step 1 of
 * docs/medjobs/SMARTLEAD_BRIDGE_SPEC.md).
 *
 * Maps MedJobs CRM rows → Smartlead leads, builds the email-only drip
 * sequence from the existing provider cadence, and filters the eligible
 * set (state / suppression / verification / dedupe).
 *
 * NO network, NO DB. The live orchestration (`launchCampaign`) and the
 * `schedule_sequence` integration are later, separately-revertable steps.
 * Everything here is pure so it can be exercised without the Smartlead key.
 *
 * Channel split (the load-bearing invariant): Smartlead owns the EMAIL
 * drip only. The provider cadence interleaves phone days (0, 1, 5) which
 * stay as CRM `outreach_followup_call` tasks; only the email days
 * (0 `provider_intro`, 3 `provider_followup`, 7 `provider_final`) become
 * Smartlead sequence steps.
 */

import type { SmartleadLead, SmartleadSequenceStep } from "@/lib/smartlead";
import { OUTREACH_DAYS_BY_TYPE, type CadenceKey } from "@/lib/student-outreach/cadence";
import { CALENDLY_URL, PROGRAM_URL, getTemplate } from "@/lib/student-outreach/templates";
import type { Status } from "@/lib/student-outreach/types";

export type BridgeKind = "provider" | "student_org" | "advisor" | "dept_head" | "professor";

/**
 * The minimal per-row data the bridge needs, assembled by the caller from
 * the DrawerContext. Decoupled from the full CRM row shape on purpose —
 * mirrors how `planSequence` takes a `SequencerInput`, not raw DB rows —
 * so these helpers stay pure and the coupling lives in the (later)
 * route.ts integration step.
 */
export interface BridgeRow {
  outreach_id: string;
  kind: BridgeKind;
  status: Status;
  organization_name: string;
  city: string | null;
  /** Effective General Contact email (override ?? directory fallback), resolved by the caller. */
  email: string | null;
  first_name: string | null;
  /** `research_data.smartlead.campaign_id` already set → already enrolled. */
  already_enrolled: boolean;
  /** Cached pre-send verification verdict (lib/email-verification). */
  email_verdict?: "valid" | "invalid" | "risky" | "unknown" | null;
  /** In the shared bounce/complaint suppression set (same one Resend honors). */
  suppressed?: boolean;
}

export interface CampusContext {
  name: string;
  city: string | null;
}

export type SkipReason =
  | "terminal_status"
  | "already_in_flight"
  | "already_enrolled"
  | "no_email"
  | "suppressed"
  | "unverified_email"
  | "duplicate_in_batch";

export interface SelectionResult {
  eligible: BridgeRow[];
  /** Every exclusion is reported — no silent drops (spec §4). */
  skipped: { outreach_id: string; reason: SkipReason }[];
}

const TERMINAL: ReadonlySet<Status> = new Set<Status>([
  "not_interested",
  "do_not_contact",
  "wrong_contact",
  "redirected",
]);

const IN_FLIGHT: ReadonlySet<Status> = new Set<Status>([
  "engaged",
  "meeting_scheduled",
  "active_partner",
]);

/**
 * Filter rows down to those safe to enroll into a cold campaign, with a
 * reason for every exclusion. Order matters: the first failing check wins,
 * so a terminal row is reported as `terminal_status` even if it also lacks
 * an email. Dedupe is last and only over rows that passed every other gate.
 */
export function selectEligibleRows(rows: BridgeRow[]): SelectionResult {
  const eligible: BridgeRow[] = [];
  const skipped: { outreach_id: string; reason: SkipReason }[] = [];
  const seenEmails = new Set<string>();

  for (const row of rows) {
    let reason: SkipReason | null = null;

    if (TERMINAL.has(row.status)) reason = "terminal_status";
    else if (IN_FLIGHT.has(row.status)) reason = "already_in_flight";
    else if (row.already_enrolled) reason = "already_enrolled";
    else if (!row.email || !row.email.trim()) reason = "no_email";
    else if (row.suppressed) reason = "suppressed";
    else if (row.email_verdict === "invalid") reason = "unverified_email";
    else {
      const key = row.email.trim().toLowerCase();
      if (seenEmails.has(key)) reason = "duplicate_in_batch";
      else seenEmails.add(key);
    }

    if (reason) skipped.push({ outreach_id: row.outreach_id, reason });
    else eligible.push(row);
  }

  return { eligible, skipped };
}

/**
 * Map an eligible row to a Smartlead lead. `custom_fields.outreach_id` is
 * the join key the future D2 webhook uses to attribute Smartlead events
 * back to the CRM row — without it, inbound attribution is guesswork.
 */
export function rowToLead(row: BridgeRow, campus: CampusContext): SmartleadLead {
  return {
    email: (row.email ?? "").trim(),
    first_name: row.first_name?.trim() || "",
    company_name: row.organization_name,
    custom_fields: {
      campus: campus.name,
      catchment_city: row.city ?? campus.city ?? "",
      outreach_id: row.outreach_id,
    },
  };
}

/**
 * Smartlead merge tags for the per-lead fields. We pass these AS the
 * `organization_name`/`campus_name` context values to `getTemplate`, so the
 * rendered body carries the tags verbatim for Smartlead to fill per lead.
 */
const MERGE_COMPANY = "{{company_name}}";
const MERGE_CAMPUS = "{{campus}}";

export interface SequenceOptions {
  /** Sender first name woven into the copy. Defaults to "Graize". */
  adminFirstName?: string;
}

/**
 * Build the Smartlead email sequence from a cadence's EMAIL days only.
 * Delays are relative to the previous email step (Smartlead's model), so
 * the provider cadence's email days 0/3/7 become delays 0/3/4.
 *
 * One sequence covers every lead in the campaign: campus + company arrive
 * as Smartlead merge tags, so there is no per-row body baking (unlike the
 * Resend per-recipient path).
 */
export function buildEmailSequence(
  cadenceKey: CadenceKey = "provider",
  opts: SequenceOptions = {},
): SmartleadSequenceStep[] {
  const ctx = {
    // Provider template functions branch on `variant`, not `stakeholder_type`;
    // the value is inert for provider_* keys (see templates.ts).
    stakeholder_type: "student_org" as const,
    organization_name: MERGE_COMPANY,
    campus_name: MERGE_CAMPUS,
    admin_first_name: opts.adminFirstName ?? "Graize",
    // Org-level General Contact lead → general variant ("Hello,"), no per-name token.
    variant: "general" as const,
    contacts: [],
  };

  const days = OUTREACH_DAYS_BY_TYPE[cadenceKey];
  const steps: SmartleadSequenceStep[] = [];
  let prevEmailDay = 0;
  let seq = 0;

  for (const day of days) {
    for (const step of day.steps) {
      if (step.channel !== "email" || !step.template) continue;
      seq += 1;
      const draft = getTemplate(step.template, ctx);
      const adminFirstName = opts.adminFirstName ?? "Graize";
      steps.push({
        seq_number: seq,
        seq_delay_details: { delay_in_days: seq === 1 ? 0 : day.day - prevEmailDay },
        subject: finalizeTokens(draft.subject, adminFirstName),
        email_body: toSmartleadHtml(draft.body, adminFirstName),
      });
      prevEmailDay = day.day;
    }
  }

  return steps;
}

/**
 * Resolve the template tokens. `getTemplate` returns copy with tokens
 * UNSUBSTITUTED ({organization_name}, {campus_name}, {first_name}, URLs) —
 * the Resend path fills them at send time via substituteVars. We do the
 * same here, but the per-lead fields become Smartlead merge tags instead of
 * concrete values, and the URLs/admin name resolve to constants.
 * {first_name}/{salutation} shouldn't appear in the general variant, but if
 * a template emits them we degrade to a Smartlead tag / neutral greeting
 * rather than leak a raw `{token}`.
 */
function finalizeTokens(text: string, adminFirstName: string): string {
  return text
    .replace(/\{organization_name\}/g, MERGE_COMPANY)
    .replace(/\{campus_name\}/g, MERGE_CAMPUS)
    .replace(/\{admin_first_name\}/g, adminFirstName)
    .replace(/\{calendly_url\}/g, CALENDLY_URL)
    .replace(/\{program_url\}/g, PROGRAM_URL)
    .replace(/\{first_name\}/g, "{{first_name}}")
    .replace(/\{salutation\}/g, "Hello");
}

/**
 * First-pass Markdown → HTML for the Smartlead body, mirroring the
 * **bold** / [label](url) / paragraph semantics of
 * lib/student-outreach/email-send.ts:bodyToHtml.
 *
 * TODO(launch): unify with that renderer (export it from email-send.ts)
 * and bake the footer/signature once the cold-channel sender identity is
 * settled with Logan. The body here intentionally OMITS the Resend footer
 * (Graize + Dr. DuBose signatures, "Reply STOP") because the Smartlead
 * channel sends from logan@findmedjobs.co and uses Smartlead's own
 * unsubscribe — that's an open product decision, not a mechanical port.
 */
function toSmartleadHtml(body: string, adminFirstName: string): string {
  return finalizeTokens(body, adminFirstName)
    .split(/\n\s*\n/)
    .map((para) => {
      const html = para
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\n/g, "<br/>");
      return `<p>${html}</p>`;
    })
    .join("\n");
}
