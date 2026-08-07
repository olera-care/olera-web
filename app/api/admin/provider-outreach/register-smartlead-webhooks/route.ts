/**
 * POST /api/admin/provider-outreach/register-smartlead-webhooks
 *
 * Reconciles SmartLead webhooks for all provider outreach campaigns so that
 * opens/clicks/replies/bounces flow into our system. Idempotent: lists each
 * campaign's existing webhooks first and only creates/updates ours.
 *
 * New campaigns are wired automatically at creation (smartlead-bridge.ts);
 * this endpoint clears the backlog of campaigns created before webhooks were
 * configured, and heals any drift.
 *
 * Secret: taken from the request body when pasted, else from the server env
 * (SMARTLEAD_WEBHOOK_SECRET). It MUST equal the value set on the Supabase edge
 * function, since it's baked into the `?secret=` the function validates.
 *
 * Auth: admin-only.
 * - GET = dry-run — lists campaigns and whether webhook is registered
 * - POST = apply — registers/updates webhooks for all campaigns
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import {
  createCampaignWebhook,
  isSmartleadConfigured,
  listCampaignWebhooks,
  type EnsureWebhookResult,
} from "@/lib/smartlead";

export const maxDuration = 120;

// URL path for the provider-specific webhook (different from medjobs)
const PROVIDER_WEBHOOK_PATH = "/functions/v1/provider-smartlead-webhook";

function makeServiceClient(url: string, key: string) {
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
type ServiceClient = ReturnType<typeof makeServiceClient>;

/** Check if a webhook URL points to our provider outreach edge function. */
function isProviderOutreachWebhook(webhookUrl: string | undefined | null): boolean {
  if (!webhookUrl) return false;
  try {
    const url = new URL(webhookUrl);
    return url.pathname === PROVIDER_WEBHOOK_PATH;
  } catch {
    return false;
  }
}

/** Build the provider outreach webhook URL (uses provider-smartlead-webhook). */
function buildProviderWebhookUrl(secret: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !secret) return null;
  return `${base.replace(/\/+$/, "")}${PROVIDER_WEBHOOK_PATH}?secret=${encodeURIComponent(secret)}`;
}

// Webhook configuration
const PROVIDER_WEBHOOK_NAME = "Olera Provider Outreach";
const PROVIDER_WEBHOOK_EVENT_TYPES = [
  "EMAIL_SENT",
  "EMAIL_OPEN",
  "EMAIL_CLICK",
  "EMAIL_REPLY",
  "EMAIL_BOUNCE",
  "LEAD_UNSUBSCRIBED",
] as const;

/** Check if two event type sets are equivalent. */
function sameEventTypeSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a.map((e) => e.toUpperCase()));
  return b.every((e) => setA.has(e.toUpperCase()));
}

/** Check if webhook URL has the expected secret. */
function webhookSecretMatches(webhookUrl: string | undefined, expectedSecret: string): boolean {
  if (!webhookUrl || !expectedSecret) return false;
  try {
    const url = new URL(webhookUrl);
    return url.searchParams.get("secret") === expectedSecret;
  } catch {
    return false;
  }
}

/**
 * Provider-specific version of ensureCampaignWebhook.
 * Uses isProviderOutreachWebhook for matching instead of isMedjobsWebhook.
 */
async function ensureProviderCampaignWebhook(
  campaignId: number,
  webhookUrl: string,
): Promise<EnsureWebhookResult> {
  const list = await listCampaignWebhooks(campaignId);
  if (!list.ok) {
    return { ok: false, status: "error", error: list.error ?? "listCampaignWebhooks failed" };
  }

  let desiredSecret = "";
  try {
    desiredSecret = new URL(webhookUrl).searchParams.get("secret") ?? "";
  } catch {
    desiredSecret = "";
  }

  // Find existing provider outreach webhook (NOT medjobs webhook)
  const existing = (list.data ?? []).find((w) => isProviderOutreachWebhook(w.webhook_url));

  if (existing) {
    const upToDate =
      sameEventTypeSet(existing.event_types, PROVIDER_WEBHOOK_EVENT_TYPES) &&
      webhookSecretMatches(existing.webhook_url, desiredSecret);
    if (upToDate) return { ok: true, status: "exists" };

    // Update existing webhook
    const upd = await createCampaignWebhook(campaignId, {
      id: existing.id,
      name: PROVIDER_WEBHOOK_NAME,
      webhookUrl,
      eventTypes: PROVIDER_WEBHOOK_EVENT_TYPES,
    });
    return upd.ok
      ? { ok: true, status: "updated" }
      : { ok: false, status: "error", error: upd.error };
  }

  // Create new webhook
  const created = await createCampaignWebhook(campaignId, {
    name: PROVIDER_WEBHOOK_NAME,
    webhookUrl,
    eventTypes: PROVIDER_WEBHOOK_EVENT_TYPES,
  });
  return created.ok
    ? { ok: true, status: "created" }
    : { ok: false, status: "error", error: created.error };
}

/** Collect all distinct SmartLead campaign IDs from provider_outreach_tracking. */
async function collectCampaigns(
  supabase: ServiceClient,
): Promise<{ campaigns: Map<number, { state: string | null; name: string | null }>; error?: string }> {
  const { data: rows, error } = await supabase
    .from("provider_outreach_tracking")
    .select("state, smartlead_data")
    .not("smartlead_data", "is", null);

  if (error) return { campaigns: new Map(), error: error.message };

  const campaigns = new Map<number, { state: string | null; name: string | null }>();
  for (const row of (rows ?? []) as Array<{
    state: string | null;
    smartlead_data: { campaign_id?: number; campaign_name?: string } | null;
  }>) {
    const sd = row.smartlead_data;
    const cid = sd?.campaign_id;
    if (typeof cid === "number" && Number.isFinite(cid) && !campaigns.has(cid)) {
      campaigns.set(cid, {
        state: row.state,
        name: sd?.campaign_name ?? null,
      });
    }
  }
  return { campaigns };
}

async function run(request: Request, apply: boolean): Promise<Response> {
  const supaUser = await createClient();
  const { data: { user } } = await supaUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error (Supabase env)" }, { status: 500 });
  }
  if (!isSmartleadConfigured()) {
    return NextResponse.json({ error: "SMARTLEAD_API_KEY is not set in this environment." }, { status: 500 });
  }

  const supabase = makeServiceClient(supabaseUrl, serviceKey);

  const { campaigns, error: collectError } = await collectCampaigns(supabase);
  if (collectError) {
    return NextResponse.json({ error: `Supabase query failed: ${collectError}` }, { status: 500 });
  }

  if (campaigns.size === 0) {
    return NextResponse.json({
      ok: true,
      message: "No SmartLead campaigns found in provider_outreach_tracking",
      total: 0,
    });
  }

  // ── Dry-run: report campaigns + whether webhook is registered ──
  if (!apply) {
    const rows = await Promise.all(
      [...campaigns.entries()].map(async ([id, info]) => {
        const list = await listCampaignWebhooks(id);
        const registered = list.ok
          ? (list.data ?? []).some((w) => isProviderOutreachWebhook(w.webhook_url))
          : null; // null = couldn't check (API error)
        return {
          campaign_id: id,
          campaign_name: info.name,
          state: info.state,
          registered,
        };
      }),
    );
    return NextResponse.json({
      dry_run: true,
      campaigns: rows,
      total: campaigns.size,
      registered: rows.filter((r) => r.registered === true).length,
      missing: rows.filter((r) => r.registered === false).length,
    });
  }

  // ── Apply: secret from body (pasted) else server env ──
  let secret = "";
  try {
    const body = (await request.json()) as { secret?: string };
    secret = (body.secret ?? "").trim();
  } catch {
    // no body — fall through to env
  }
  if (!secret) secret = (process.env.SMARTLEAD_WEBHOOK_SECRET ?? "").trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Paste your webhook secret (the same value set in Supabase), or set SMARTLEAD_WEBHOOK_SECRET on this environment." },
      { status: 400 },
    );
  }

  const webhookUrl = buildProviderWebhookUrl(secret);
  if (!webhookUrl) {
    return NextResponse.json({ error: "Could not build webhook URL (Supabase URL unset)." }, { status: 500 });
  }

  const created: number[] = [];
  const updated: number[] = [];
  const exists: number[] = [];
  const failed: { campaign_id: number; error?: string }[] = [];

  for (const [cid] of campaigns) {
    const res = await ensureProviderCampaignWebhook(cid, webhookUrl);
    if (!res.ok) failed.push({ campaign_id: cid, error: res.error });
    else if (res.status === "created") created.push(cid);
    else if (res.status === "updated") updated.push(cid);
    else exists.push(cid);
  }

  return NextResponse.json({
    ok: failed.length === 0,
    total: campaigns.size,
    created,
    updated,
    exists,
    failed,
    wired: created.length + updated.length + exists.length,
  });
}

export async function GET(request: Request) {
  return run(request, false);
}

export async function POST(request: Request) {
  return run(request, true);
}
