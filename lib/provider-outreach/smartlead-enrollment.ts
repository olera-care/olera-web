/**
 * Provider Outreach SmartLead Enrollment — dedicated sequence builder for
 * directory provider cold outreach (Option B: separate from MedJobs code).
 *
 * Uses the provider_claim cadence (Day 0/3/7 emails) to get unclaimed
 * providers to claim their Olera profiles. Each email carries a magic-link
 * claim URL that auto-authenticates into the claim flow.
 *
 * Key differences from lib/medjobs/smartlead-bridge.ts:
 *   - Data source: olera-providers table (not student_outreach)
 *   - Cadence: provider_claim (claim_intro → claim_followup → claim_final)
 *   - URLs: Claim token links (not MedJobs welcome links)
 *   - Tracking: provider_outreach_tracking table
 *   - Simpler model: one lead per provider (no General vs Named fan-out)
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
import { OUTREACH_DAYS_BY_TYPE } from "@/lib/student-outreach/cadence";
import { bodyToHtml } from "@/lib/student-outreach/email-markdown";
import { getTemplate } from "@/lib/student-outreach/templates";
import { buildClaimUrl } from "./claim-token";

/** Row from olera-providers that we're enrolling into SmartLead. */
export interface ProviderOutreachRow {
  provider_id: string;
  provider_name: string;
  email: string;
  city: string;
  state: string;
  slug: string | null;
  /** Links to provider_outreach_tracking.id for attribution. */
  tracking_id?: string | null;
  /** Already enrolled in SmartLead (campaign_id set). */
  already_enrolled?: boolean;
  /** Email is suppressed (bounce/complaint). */
  suppressed?: boolean;
}

export type SkipReason =
  | "no_email"
  | "already_enrolled"
  | "suppressed";

export interface SelectionResult {
  eligible: ProviderOutreachRow[];
  skipped: { provider_id: string; reason: SkipReason }[];
}

/**
 * Filter providers down to those eligible for cold enrollment.
 * Unlike MedJobs, we have no status-based terminal states — a provider
 * is either claimable (not_contacted, in_sequence) or not.
 */
export function selectEligibleProviders(rows: ProviderOutreachRow[]): SelectionResult {
  const eligible: ProviderOutreachRow[] = [];
  const skipped: { provider_id: string; reason: SkipReason }[] = [];

  for (const row of rows) {
    let reason: SkipReason | null = null;

    if (!row.email?.trim()) reason = "no_email";
    else if (row.already_enrolled) reason = "already_enrolled";
    else if (row.suppressed) reason = "suppressed";

    if (reason) {
      skipped.push({ provider_id: row.provider_id, reason });
    } else {
      eligible.push(row);
    }
  }

  return { eligible, skipped };
}

/**
 * Convert a provider row to a SmartLead lead.
 * One lead per provider — no fan-out (simpler than MedJobs).
 */
export function providerToLead(row: ProviderOutreachRow): SmartleadLead {
  const claimUrl = buildClaimUrl({
    provider_id: row.provider_id,
    provider_slug: row.slug || row.provider_id,
    email: row.email,
    city: row.city,
    tracking_id: row.tracking_id,
  });

  return {
    email: row.email.trim().toLowerCase(),
    first_name: "", // Provider orgs, not individuals
    company_name: row.provider_name,
    custom_fields: {
      provider_id: row.provider_id,
      tracking_id: row.tracking_id ?? "",
      city: row.city,
      state: row.state,
      claim_url: claimUrl,
      organization_name: row.provider_name,
    },
  };
}

/**
 * Batch providers to leads with dedupe.
 * Returns deduped leads + any duplicates found.
 */
export function providersToLeads(rows: ProviderOutreachRow[]): {
  leads: SmartleadLead[];
  duplicates: { provider_id: string; email: string }[];
} {
  const seen = new Set<string>();
  const leads: SmartleadLead[] = [];
  const duplicates: { provider_id: string; email: string }[] = [];

  for (const row of rows) {
    const key = row.email.trim().toLowerCase();
    if (seen.has(key)) {
      duplicates.push({ provider_id: row.provider_id, email: row.email });
      continue;
    }
    seen.add(key);
    leads.push(providerToLead(row));
  }

  return { leads, duplicates };
}

// Smartlead merge tags for per-lead substitution
const MERGE_COMPANY = "{{company_name}}";
const MERGE_CLAIM_URL = "{{claim_url}}";

/**
 * Build the SmartLead email sequence from the provider_claim cadence.
 *
 * @param city - The city name, baked into the sequence (one campaign per city).
 *   All providers in a campaign are in the same city, so city is static.
 */
export function buildClaimEmailSequence(city: string): SmartleadSequenceStep[] {
  const days = OUTREACH_DAYS_BY_TYPE.provider_claim;
  const steps: SmartleadSequenceStep[] = [];
  let prevEmailDay = 0;
  let seq = 0;

  // Minimal context for getTemplate — claim templates ignore most of it
  const ctx = {
    stakeholder_type: "student_org" as const,
    organization_name: MERGE_COMPANY,
    campus_name: "",
  };

  for (const day of days) {
    for (const step of day.steps) {
      if (step.channel !== "email" || !step.template) continue;
      seq += 1;

      const draft = getTemplate(step.template, ctx);
      const delay = seq === 1 ? 0 : day.day - prevEmailDay;

      steps.push({
        seq_number: seq,
        seq_delay_details: { delay_in_days: delay },
        subject: resolveClaimMergeTags(draft.subject, city),
        email_body: resolveClaimMergeTags(bodyToHtml(draft.body), city),
      });

      prevEmailDay = day.day;
    }
  }

  return steps;
}

/**
 * Replace template placeholders with SmartLead merge tags or static values.
 * - {city} → baked in (static per campaign, since one campaign per city)
 * - {organization_name} → {{company_name}} merge tag (per-lead)
 * - {claim_url} → {{claim_url}} merge tag (per-lead)
 */
function resolveClaimMergeTags(text: string, city: string): string {
  return text
    .replace(/\{city\}/g, city)
    .replace(/\{organization_name\}/g, MERGE_COMPANY)
    .replace(/\{claim_url\}/g, MERGE_CLAIM_URL);
}

// ── Orchestration ─────────────────────────────────────────────────────────

interface MailboxPool {
  ids: number[];
  warnings: string[];
}

function envSenderEmails(): string[] {
  // Reuse MedJobs sender allowlist — same mailbox pool for both
  return (process.env.SMARTLEAD_SENDER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resolve the mailbox pool for campaign attachment.
 * Reuses the same logic as MedJobs (shared Smartlead account).
 */
async function resolveMailboxPool(
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
      warnings.push(`Mailbox ${a.from_email} warmup status is ${status ?? "unknown"} (not ACTIVE).`);
    }
  }

  if (!selected.length) {
    return { ok: false, pool: { ids: [], warnings }, error: "No mailboxes matched the sender allowlist." };
  }
  return { ok: true, pool: { ids: selected.map((a) => a.id), warnings } };
}

function defaultSchedule(): Record<string, unknown> {
  return {
    timezone: "America/Chicago",
    days_of_the_week: [1, 2, 3, 4, 5], // Mon-Fri
    start_hour: "09:00",
    end_hour: "17:00",
    min_time_btw_emails: 10,
    max_new_leads_per_day: 20,
  };
}

function autoStartEnabled(): boolean {
  const v = (process.env.SMARTLEAD_AUTO_START_CAMPAIGNS ?? "").trim().toLowerCase();
  return v === "true" || v === "1";
}

type StageError = { stage: string; message: string };

/**
 * Provision a new campaign: create → attach mailboxes → save sequence.
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
  if (!attached.ok) {
    errors.push({ stage: "attachEmailAccounts", message: attached.error ?? "attach failed" });
  }

  const saved = await saveSequence(campaignId, steps);
  if (!saved.ok) {
    errors.push({ stage: "saveSequence", message: saved.error ?? "save failed" });
  }

  return { campaign_id: campaignId, errors };
}

/**
 * Finalize a campaign: set schedule + status.
 */
async function finalizeCampaign(
  campaignId: number,
  schedule: Record<string, unknown>,
): Promise<StageError[]> {
  const errors: StageError[] = [];

  const sched = await setCampaignSchedule(campaignId, schedule);
  if (!sched.ok) {
    errors.push({ stage: "setCampaignSchedule", message: sched.error ?? "schedule failed" });
  }

  const desiredStatus = autoStartEnabled() ? "START" : "PAUSED";
  const status = await setCampaignStatus(campaignId, desiredStatus);
  if (!status.ok) {
    errors.push({ stage: "setCampaignStatus", message: status.error ?? "status failed" });
  }

  return errors;
}

export interface EnrollInput {
  /** Provider to enroll. */
  provider: ProviderOutreachRow;
  /** Campaign name for a new campaign (used if no existing campaign). */
  campaignName: string;
  /** Existing campaign ID to reuse (from same city/state). */
  existingCampaignId?: number | null;
  /** Sender email allowlist (defaults to SMARTLEAD_SENDER_EMAILS). */
  senderEmails?: string[];
  /** Send schedule (defaults to weekday business hours). */
  schedule?: Record<string, unknown>;
}

export interface EnrollResult {
  ok: boolean;
  /** Campaign ID the provider was enrolled into. */
  campaign_id?: number;
  /** True if this call created a new campaign. */
  created: boolean;
  /** True if the provider was successfully enrolled. */
  enrolled: boolean;
  /** Set if the provider was skipped before API calls. */
  skipped_reason?: SkipReason;
  mailbox_warnings: string[];
  errors: StageError[];
}

/**
 * Enroll a single provider into the SmartLead claim campaign.
 *
 * If existingCampaignId is provided (e.g., from another provider in the
 * same city), the lead is added to that campaign. Otherwise, a new
 * campaign is provisioned.
 *
 * Status follows SMARTLEAD_AUTO_START_CAMPAIGNS (default: PAUSED).
 */
export async function enrollProviderIntoCampaign(input: EnrollInput): Promise<EnrollResult> {
  const result: EnrollResult = {
    ok: false,
    created: false,
    enrolled: false,
    mailbox_warnings: [],
    errors: [],
  };

  // Eligibility check
  const { eligible, skipped } = selectEligibleProviders([input.provider]);
  if (!eligible.length) {
    result.skipped_reason = skipped[0]?.reason;
    return result;
  }

  const lead = providerToLead(input.provider);

  // Try existing campaign first
  if (input.existingCampaignId) {
    const added = await addLeads(input.existingCampaignId, [lead]);
    if (added.ok) {
      result.campaign_id = input.existingCampaignId;
      result.enrolled = true;
      result.ok = true;
      return result;
    }
    // If 404, fall through to provision new. Otherwise, report error.
    if (added.status !== 404) {
      result.errors.push({ stage: "addLeads", message: added.error ?? "addLeads failed" });
      return result;
    }
    console.warn(`[provider-outreach] Campaign ${input.existingCampaignId} not found (404), provisioning new`);
  }

  // Provision new campaign
  const mb = await resolveMailboxPool(input.senderEmails);
  result.mailbox_warnings = mb.pool.warnings;
  if (!mb.ok) {
    result.errors.push({ stage: "resolveMailboxPool", message: mb.error ?? "no mailboxes" });
    return result;
  }

  const steps = buildClaimEmailSequence(input.provider.city);
  const prov = await provisionCampaign(input.campaignName, mb.pool.ids, steps);
  result.errors.push(...prov.errors);
  if (!prov.campaign_id) return result;

  result.campaign_id = prov.campaign_id;
  result.created = true;

  // Add the lead
  const added = await addLeads(prov.campaign_id, [lead]);
  if (!added.ok) {
    result.errors.push({ stage: "addLeads", message: added.error ?? "addLeads failed" });
    return result;
  }
  result.enrolled = true;

  // Finalize (schedule + status)
  result.errors.push(...(await finalizeCampaign(prov.campaign_id, input.schedule ?? defaultSchedule())));
  result.ok = result.errors.length === 0;

  return result;
}

/**
 * Generate a campaign name for a city.
 * Format: "Olera Providers - {City}, {State}"
 */
export function generateCampaignName(city: string, state: string): string {
  return `Olera Providers - ${city}, ${state}`;
}
