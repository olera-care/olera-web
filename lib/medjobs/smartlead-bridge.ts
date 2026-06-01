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

import {
  addLeads,
  attachEmailAccounts,
  createCampaign,
  listEmailAccounts,
  saveSequence,
  setCampaignSchedule,
  setCampaignStatus,
  type SmartleadLead,
  type SmartleadSequenceStep,
} from "@/lib/smartlead";
import { OUTREACH_DAYS_BY_TYPE, type CadenceKey } from "@/lib/student-outreach/cadence";
import { bodyToHtml } from "@/lib/student-outreach/email-markdown";
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
 * Markdown → HTML for the Smartlead body. Uses the SHARED renderer
 * (`email-markdown.ts:bodyToHtml`) so the cold channel produces byte-identical
 * body HTML to the Resend path — one source of truth.
 *
 * TODO(launch): the body is unified, but the footer/signature is still NOT
 * appended here. The Resend footer (Graize + Dr. DuBose signatures, "Reply
 * STOP") is built for the olera.care identity; the Smartlead channel sends
 * from logan@findmedjobs.co with Smartlead's own unsubscribe. The cold-channel
 * footer + sender identity + unsubscribe mechanism are a product decision for
 * Logan — settle that, then append the footer here.
 */
function toSmartleadHtml(body: string, adminFirstName: string): string {
  return bodyToHtml(finalizeTokens(body, adminFirstName));
}

// ── Orchestration (network — drives lib/smartlead) ───────────────────────

/**
 * Smartlead Base plan TOTAL contact-storage cap. The real ceiling on how many
 * leads can live across all campaigns — not a send-rate limit. Lead admission
 * is budgeted against this so we never blow past it silently.
 */
export const SMARTLEAD_CONTACT_CAP = 2000;

/** Smartlead caps the per-request batch (~100); the caller must chunk. */
const LEAD_BATCH_SIZE = 100;

export interface MailboxPool {
  ids: number[];
  warnings: string[];
}

function envSenderEmails(): string[] {
  return (process.env.SMARTLEAD_SENDER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resolve the warmed mailbox pool to attach to a campaign. Reads the live
 * account, filters to the configured sender allowlist (SMARTLEAD_SENDER_EMAILS,
 * comma-separated), and warns for any mailbox whose warmup isn't ACTIVE. IDs
 * are resolved at runtime — never hardcoded (they're account state).
 */
export async function resolveMailboxPool(
  senderEmails?: string[],
): Promise<{ ok: boolean; pool: MailboxPool; error?: string }> {
  const res = await listEmailAccounts();
  if (!res.ok || !res.data) {
    return { ok: false, pool: { ids: [], warnings: [] }, error: res.error ?? "listEmailAccounts failed" };
  }

  const allow = (senderEmails ?? envSenderEmails()).map((e) => e.trim().toLowerCase()).filter(Boolean);
  const accounts = res.data;
  const selected = allow.length
    ? accounts.filter((a) => allow.includes((a.from_email ?? "").toLowerCase()))
    : accounts;

  const warnings: string[] = [];
  if (!allow.length) {
    warnings.push(`No SMARTLEAD_SENDER_EMAILS allowlist set; using all ${accounts.length} connected mailbox(es).`);
  }
  for (const a of selected) {
    const status = a.warmup_details?.status;
    if (status !== "ACTIVE") {
      warnings.push(`Mailbox ${a.from_email} warmup status is ${status ?? "unknown"} (not ACTIVE) — do not START until warm.`);
    }
  }

  if (!selected.length) {
    return { ok: false, pool: { ids: [], warnings }, error: "No mailboxes matched the sender allowlist." };
  }
  return { ok: true, pool: { ids: selected.map((a) => a.id), warnings } };
}

export interface LaunchInput {
  campaignName: string;
  campus: CampusContext;
  rows: BridgeRow[];
  cadenceKey?: CadenceKey;
  senderEmails?: string[];
  adminFirstName?: string;
  /** Existing total contacts already in the Smartlead account, for 2K-cap
   *  accounting. Caller supplies; defaults to 0. */
  existingContactCount?: number;
  /** Passed verbatim to setCampaignSchedule; defaults to weekday business hours. */
  schedule?: Record<string, unknown>;
}

export interface LaunchReport {
  ok: boolean;
  campaign_id?: number;
  enrolled: number;
  enrolled_outreach_ids: string[];
  skipped: { outreach_id: string; reason: SkipReason | "over_cap" }[];
  mailbox_warnings: string[];
  errors: { stage: string; message: string }[];
}

function defaultSchedule(): Record<string, unknown> {
  return {
    timezone: "America/Chicago",
    days_of_the_week: [1, 2, 3, 4, 5],
    start_hour: "09:00",
    end_hour: "17:00",
    min_time_btw_emails: 10,
    max_new_leads_per_day: 20,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type StageError = { stage: string; message: string };

/**
 * Provision a fresh campaign: create → attach mailboxes → save sequence.
 * Shared by the batch (`launchCampaign`) and per-row
 * (`enrollRowIntoCampusCampaign`) paths so campaign creation never diverges.
 * Returns the new id (or undefined if create failed) plus non-fatal errors.
 * Preserves the create→attach→saveSequence order validated against the live API.
 */
async function provisionCampaign(
  name: string,
  poolIds: number[],
  steps: SmartleadSequenceStep[],
): Promise<{ campaign_id?: number; errors: StageError[] }> {
  const errors: StageError[] = [];
  const created = await createCampaign(name);
  if (!created.ok || !created.data) {
    errors.push({ stage: "createCampaign", message: created.error ?? "no campaign id" });
    return { errors };
  }
  const campaignId = created.data.id;
  const attached = await attachEmailAccounts(campaignId, poolIds);
  if (!attached.ok) errors.push({ stage: "attachEmailAccounts", message: attached.error ?? "attach failed" });
  const saved = await saveSequence(campaignId, steps);
  if (!saved.ok) errors.push({ stage: "saveSequence", message: saved.error ?? "save failed" });
  return { campaign_id: campaignId, errors };
}

/**
 * Finalize a freshly provisioned campaign: set schedule, then leave it PAUSED.
 * NEVER START. Called after leads are pushed (the validated order).
 */
async function finalizeCampaign(
  campaignId: number,
  schedule: Record<string, unknown>,
): Promise<StageError[]> {
  const errors: StageError[] = [];
  const sched = await setCampaignSchedule(campaignId, schedule);
  if (!sched.ok) errors.push({ stage: "setCampaignSchedule", message: sched.error ?? "schedule failed" });
  const status = await setCampaignStatus(campaignId, "PAUSED");
  if (!status.ok) errors.push({ stage: "setCampaignStatus", message: status.error ?? "status failed" });
  return errors;
}

/**
 * Orchestrate a PAUSED Smartlead campaign from a batch of CRM rows.
 *
 * - NEVER calls START — there is no "START" literal in this module. A human
 *   starts the campaign in the Smartlead UI after warmup + Logan sign-off (§8).
 * - Does NOT write back to the CRM — that's the schedule_sequence integration
 *   (G4 single-writer).
 * - Aggregates errors into the report instead of throwing, so a partial
 *   failure is visible, not silent. The campaign id is captured before leads
 *   are pushed so a mid-flight failure leaves a recoverable PAUSED campaign.
 */
export async function launchCampaign(input: LaunchInput): Promise<LaunchReport> {
  const report: LaunchReport = {
    ok: false,
    enrolled: 0,
    enrolled_outreach_ids: [],
    skipped: [],
    mailbox_warnings: [],
    errors: [],
  };

  // 1. Resolve warmed mailboxes (fails closed if the key/account is unavailable).
  const mb = await resolveMailboxPool(input.senderEmails);
  report.mailbox_warnings = mb.pool.warnings;
  if (!mb.ok) {
    report.errors.push({ stage: "resolveMailboxPool", message: mb.error ?? "no mailboxes" });
    return report;
  }

  // 2. Filter eligible rows (reason for every exclusion).
  const { eligible, skipped } = selectEligibleRows(input.rows);
  report.skipped = [...skipped];

  // 3. Budget against the 2K storage cap — drop overflow and report it; no silent truncation.
  const available = Math.max(0, SMARTLEAD_CONTACT_CAP - (input.existingContactCount ?? 0));
  let admitted = eligible;
  if (eligible.length > available) {
    admitted = eligible.slice(0, available);
    for (const row of eligible.slice(available)) {
      report.skipped.push({ outreach_id: row.outreach_id, reason: "over_cap" });
    }
  }
  if (!admitted.length) {
    report.errors.push({ stage: "select", message: "No eligible rows to enroll (after filters + cap)." });
    return report;
  }

  // 4. Provision the campaign (create → attach → sequence); capture id immediately.
  const steps = buildEmailSequence(input.cadenceKey ?? "provider", { adminFirstName: input.adminFirstName });
  const prov = await provisionCampaign(input.campaignName, mb.pool.ids, steps);
  report.errors.push(...prov.errors);
  if (!prov.campaign_id) return report;
  report.campaign_id = prov.campaign_id;
  const campaignId = prov.campaign_id;

  // 5. Push leads in chunks of 100 (the engine doesn't chunk). A failed chunk
  //    is recorded and its rows are NOT counted as enrolled.
  for (const group of chunk(admitted, LEAD_BATCH_SIZE)) {
    const leads = group.map((row) => rowToLead(row, input.campus));
    const res = await addLeads(campaignId, leads);
    if (res.ok) {
      report.enrolled += res.data?.upload_count ?? leads.length;
      report.enrolled_outreach_ids.push(...group.map((r) => r.outreach_id));
    } else {
      report.errors.push({ stage: `addLeads[${group.length}]`, message: res.error ?? "addLeads failed" });
    }
  }

  // 6. Schedule + leave PAUSED (validated order: after leads).
  report.errors.push(...(await finalizeCampaign(campaignId, input.schedule ?? defaultSchedule())));

  report.ok = report.errors.length === 0;
  return report;
}

export interface EnrollInput {
  row: BridgeRow;
  campus: CampusContext;
  /** Used only when no campus campaign exists yet (this row is the first). */
  campaignName: string;
  /** The campus's existing Smartlead campaign id, looked up by the caller from
   *  a sibling row's `research_data.smartlead.campaign_id` (approach b). When
   *  present, the lead is added to it; when absent, a new campaign is provisioned. */
  existingCampaignId?: number;
  cadenceKey?: CadenceKey;
  senderEmails?: string[];
  adminFirstName?: string;
  schedule?: Record<string, unknown>;
}

export interface EnrollResult {
  ok: boolean;
  campaign_id?: number;
  /** True when this call provisioned a new campus campaign (the first row). */
  created: boolean;
  enrolled: boolean;
  /** Set when the row was filtered out before any API call (distinct from an error). */
  skipped_reason?: SkipReason;
  mailbox_warnings: string[];
  errors: StageError[];
}

/**
 * Enroll ONE CRM row into its campus's Smartlead campaign — the per-row path
 * the `schedule_sequence` integration drives. If `existingCampaignId` is given
 * (a sibling row already created the campus campaign), the lead is appended to
 * it; otherwise this row is the first and a new PAUSED campaign is provisioned.
 *
 * Like `launchCampaign`: never STARTs, never writes the CRM (the caller writes
 * the linkage + touchpoint through route.ts, G4), aggregates errors.
 */
export async function enrollRowIntoCampusCampaign(input: EnrollInput): Promise<EnrollResult> {
  const result: EnrollResult = { ok: false, created: false, enrolled: false, mailbox_warnings: [], errors: [] };

  // Single-row eligibility (reuses the same filters, incl. already-enrolled).
  const { eligible, skipped } = selectEligibleRows([input.row]);
  if (!eligible.length) {
    result.skipped_reason = skipped[0]?.reason;
    return result;
  }
  const lead = rowToLead(input.row, input.campus);

  // Existing campus campaign → just append this lead.
  if (input.existingCampaignId) {
    result.campaign_id = input.existingCampaignId;
    const added = await addLeads(input.existingCampaignId, [lead]);
    if (!added.ok) {
      result.errors.push({ stage: "addLeads", message: added.error ?? "addLeads failed" });
      return result;
    }
    result.enrolled = true;
    result.ok = true;
    return result;
  }

  // First row for this campus → provision a new PAUSED campaign.
  const mb = await resolveMailboxPool(input.senderEmails);
  result.mailbox_warnings = mb.pool.warnings;
  if (!mb.ok) {
    result.errors.push({ stage: "resolveMailboxPool", message: mb.error ?? "no mailboxes" });
    return result;
  }
  const steps = buildEmailSequence(input.cadenceKey ?? "provider", { adminFirstName: input.adminFirstName });
  const prov = await provisionCampaign(input.campaignName, mb.pool.ids, steps);
  result.errors.push(...prov.errors);
  if (!prov.campaign_id) return result;
  result.campaign_id = prov.campaign_id;
  result.created = true;

  const added = await addLeads(prov.campaign_id, [lead]);
  if (!added.ok) {
    result.errors.push({ stage: "addLeads", message: added.error ?? "addLeads failed" });
    return result;
  }
  result.enrolled = true;

  result.errors.push(...(await finalizeCampaign(prov.campaign_id, input.schedule ?? defaultSchedule())));
  result.ok = result.errors.length === 0;
  return result;
}
