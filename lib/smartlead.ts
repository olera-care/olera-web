/**
 * Smartlead outbound engine — the cold-outreach counterpart to the Resend
 * (transactional) path in lib/email.ts.
 *
 * Architecture (three-tier email plan, tier 2):
 *   - Tier 1 transactional/crown-jewel mail stays on olera.care via Resend
 *     (lib/email.ts). Zero cold ever.
 *   - Tier 2 cold MedJobs outreach runs through Smartlead on dedicated cousin
 *     domains (e.g. findmedjobs.co), built-in rotation + continuous warmup.
 *
 * This module is the API client that the MedJobs sequencer drives to create
 * campaigns, attach the warmed mailbox pool, push leads, save sequences, and
 * start/pause sends — mirroring how the app drives Resend today. It performs
 * NO CRM mutations: reply/bounce ingestion back into the student-outreach CRM
 * is a separate, deferred step (D2) gated on Logan's sign-off, and must route
 * through the existing route.ts action handlers per the G4 single-writer rule —
 * never through this module.
 *
 * Everything is env-gated and fails closed-but-explicit: with no
 * SMARTLEAD_API_KEY, every call returns { ok: false, error } rather than
 * throwing, so a missing key can never crash a request path. The feature is a
 * no-op until SMARTLEAD_API_KEY is set.
 *
 * NOTE: endpoint paths and payload shapes follow Smartlead's documented v1 REST
 * API. Verify them against the current Smartlead API docs before going live —
 * this module is dormant until the key is set, so shape drift is harmless until
 * then.
 */

const SMARTLEAD_BASE_URL =
  process.env.SMARTLEAD_BASE_URL || "https://server.smartlead.ai/api/v1";

/** Smartlead campaign lifecycle states. */
export type SmartleadCampaignStatus = "START" | "PAUSED" | "STOPPED";

export interface SmartleadResult<T> {
  ok: boolean;
  data?: T;
  /** Present when ok is false. Human-readable; safe to log. */
  error?: string;
  /** HTTP status when a request was actually made. */
  status?: number;
}

export interface SmartleadCampaign {
  id: number;
  name: string;
  status?: string;
}

export interface SmartleadEmailAccount {
  id: number;
  from_email: string;
  from_name?: string;
  /** Smartlead's warmup health score, when present. */
  warmup_details?: { warmup_reputation?: string; status?: string };
}

/** One step in a Smartlead drip sequence. */
export interface SmartleadSequenceStep {
  /** 1-based position in the sequence. */
  seq_number: number;
  /** Days to wait after the previous step before sending this one. */
  seq_delay_details: { delay_in_days: number };
  subject: string;
  /** HTML body. Supports Smartlead merge tags like {{first_name}}. */
  email_body: string;
}

/** A lead to push into a campaign. Smartlead dedupes on email. */
export interface SmartleadLead {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  /** Arbitrary merge fields available to sequence templates. */
  custom_fields?: Record<string, string>;
}

function getApiKey(): string | null {
  return process.env.SMARTLEAD_API_KEY || null;
}

/** True once SMARTLEAD_API_KEY is set. Cheap gate for callers. */
export function isSmartleadConfigured(): boolean {
  return !!getApiKey();
}

/**
 * Low-level request helper. Appends the api_key query param (Smartlead's auth
 * scheme), parses JSON, and normalizes every outcome into a SmartleadResult.
 * Never throws.
 */
async function smartleadRequest<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown
): Promise<SmartleadResult<T>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, error: "SMARTLEAD_API_KEY not configured" };
  }

  const separator = path.includes("?") ? "&" : "?";
  const url = `${SMARTLEAD_BASE_URL}${path}${separator}api_key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let parsed: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        // Non-JSON body (rare) — surface the raw text as the error/data below.
        parsed = text;
      }
    }

    if (!res.ok) {
      // Surface as much of Smartlead's error body as we can — different
      // endpoints return {message}, {error}, {errors:[...]}, or a bare string.
      // Falling back to the raw JSON keeps the real reason visible instead of
      // a useless "HTTP 400".
      let message: string;
      if (parsed && typeof parsed === "object") {
        const o = parsed as Record<string, unknown>;
        message =
          (typeof o.message === "string" && o.message) ||
          (typeof o.error === "string" && o.error) ||
          (Array.isArray(o.errors) ? o.errors.map(String).join("; ") : "") ||
          JSON.stringify(o);
      } else if (typeof parsed === "string" && parsed.trim()) {
        message = parsed;
      } else {
        message = `HTTP ${res.status}`;
      }
      message = `HTTP ${res.status}: ${message}`;
      console.error(`[smartlead] ${method} ${path} → ${message}`);
      return { ok: false, error: message, status: res.status };
    }

    return { ok: true, data: parsed as T, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[smartlead] ${method} ${path} failed:`, message);
    return { ok: false, error: message };
  }
}

/**
 * Create a campaign. Returns the new campaign id, which every other call needs.
 */
export async function createCampaign(
  name: string,
  clientId?: number
): Promise<SmartleadResult<SmartleadCampaign>> {
  return smartleadRequest<SmartleadCampaign>("POST", "/campaigns/create", {
    name,
    ...(clientId !== undefined ? { client_id: clientId } : {}),
  });
}

/**
 * Save (replace) the drip sequence for a campaign. Steps are sent in order;
 * each step's delay is relative to the previous one.
 */
export async function saveSequence(
  campaignId: number,
  steps: SmartleadSequenceStep[]
): Promise<SmartleadResult<{ ok?: boolean }>> {
  return smartleadRequest("POST", `/campaigns/${campaignId}/sequences`, {
    sequences: steps,
  });
}

/**
 * Attach warmed mailboxes (by Smartlead email-account id) to a campaign.
 * Smartlead rotates sends across all attached accounts automatically.
 */
export async function attachEmailAccounts(
  campaignId: number,
  emailAccountIds: number[]
): Promise<SmartleadResult<{ ok?: boolean }>> {
  return smartleadRequest("POST", `/campaigns/${campaignId}/email-accounts`, {
    email_account_ids: emailAccountIds,
  });
}

/**
 * Register a webhook on a campaign so Smartlead POSTs lifecycle events
 * (reply / open / click / bounce / unsubscribe) to our edge function. Called
 * once per campus campaign by the admin "Connect Smartlead replies" button.
 * Endpoint/shape follows Smartlead's documented create-webhook API — verify
 * against current docs before go-live (this module is dormant until the key
 * is set, so shape drift is harmless until then).
 */
export async function createCampaignWebhook(
  campaignId: number,
  webhook: { name: string; webhookUrl: string; eventTypes: string[] },
): Promise<SmartleadResult<{ id?: number }>> {
  return smartleadRequest("POST", `/campaigns/${campaignId}/webhooks`, {
    id: null,
    name: webhook.name,
    webhook_url: webhook.webhookUrl,
    event_types: webhook.eventTypes,
  });
}

/**
 * Push leads into a campaign. Smartlead caps the batch size per request
 * (currently ~100); callers with larger lists should chunk before calling.
 * `ignoreGlobalBlockList`/dedupe behavior is left at Smartlead defaults.
 */
export async function addLeads(
  campaignId: number,
  leads: SmartleadLead[]
): Promise<SmartleadResult<{ upload_count?: number; already_added_to_campaign?: number }>> {
  return smartleadRequest("POST", `/campaigns/${campaignId}/leads`, {
    lead_list: leads,
  });
}

/**
 * Set the sending schedule (timezone, days, window, throttle) for a campaign.
 * Shape is passed through verbatim to Smartlead — see their schedule docs.
 */
export async function setCampaignSchedule(
  campaignId: number,
  schedule: Record<string, unknown>
): Promise<SmartleadResult<{ ok?: boolean }>> {
  return smartleadRequest("POST", `/campaigns/${campaignId}/schedule`, schedule);
}

/**
 * Start, pause, or stop a campaign. Starting before the mailbox pool is warm
 * is the #1 way to torch domain reputation — gate this behind warmup checks at
 * the call site, not here.
 */
export async function setCampaignStatus(
  campaignId: number,
  status: SmartleadCampaignStatus
): Promise<SmartleadResult<{ ok?: boolean }>> {
  return smartleadRequest("POST", `/campaigns/${campaignId}/status`, { status });
}

/** List all connected email accounts (the mailbox pool) with warmup health. */
export async function listEmailAccounts(): Promise<SmartleadResult<SmartleadEmailAccount[]>> {
  return smartleadRequest<SmartleadEmailAccount[]>("GET", "/email-accounts");
}

/** Fetch a single campaign's current state. */
export async function getCampaign(
  campaignId: number
): Promise<SmartleadResult<SmartleadCampaign>> {
  return smartleadRequest<SmartleadCampaign>("GET", `/campaigns/${campaignId}`);
}

/**
 * Delete a campaign (and its leads/sequence). Used to tear down test
 * campaigns cleanly; irreversible on Smartlead's side, so gate call sites.
 */
export async function deleteCampaign(
  campaignId: number
): Promise<SmartleadResult<{ ok?: boolean }>> {
  return smartleadRequest("DELETE", `/campaigns/${campaignId}`);
}

/**
 * v10 Phase 2+3 Bullet 6 follow-up (2026-06-04): list all leads currently
 * enrolled in a Smartlead campaign. Used by the
 * /admin/medjobs/smartlead-refresh-leads page to walk every existing lead
 * and backfill `custom_fields.welcome_url` after the magic-link rollout.
 *
 * Smartlead paginates this endpoint; we fetch one page at a time. The
 * caller drives the offset/limit loop.
 */
export interface SmartleadCampaignLead {
  /** Smartlead-internal lead id (used by updateLead). */
  lead_id?: number;
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  custom_fields?: Record<string, unknown> | null;
}

export async function listCampaignLeads(
  campaignId: number,
  options: { limit?: number; offset?: number } = {}
): Promise<SmartleadResult<{ data?: SmartleadCampaignLead[]; total_leads?: number }>> {
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;
  return smartleadRequest(
    "GET",
    `/campaigns/${campaignId}/leads?limit=${limit}&offset=${offset}`
  );
}

/**
 * v10 Phase 2+3 Bullet 6 follow-up (2026-06-04): update a single lead's
 * fields inside a campaign. Used to backfill `custom_fields.welcome_url`
 * on existing leads after the magic-link rollout — new leads get it
 * automatically via `rowToLeads`; existing ones predate the field.
 *
 * Smartlead's update-lead-in-campaign endpoint accepts a partial lead
 * shape; only the fields you pass are updated. Smartlead-internal IDs
 * + email stay as-is.
 */
export async function updateLeadInCampaign(
  campaignId: number,
  leadId: number,
  patch: { custom_fields?: Record<string, unknown>; first_name?: string; last_name?: string }
): Promise<SmartleadResult<{ ok?: boolean }>> {
  return smartleadRequest(
    "POST",
    `/campaigns/${campaignId}/leads/${leadId}`,
    patch
  );
}
