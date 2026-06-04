/**
 * POST /api/admin/medjobs/refresh-smartlead-leads
 *
 * Backfill `custom_fields.welcome_url` on every existing Smartlead lead
 * that predates the magic-link rollout. Companion to the sequence-refresh
 * endpoint (`refresh-smartlead-sequences`): that one updates the email
 * BODY templates; this one updates each LEAD'S merge-tag values.
 *
 * Why both are needed:
 *   - Smartlead sequence text contains `{{welcome_url}}` (merge tag)
 *   - Smartlead substitutes the tag from each lead's
 *     `custom_fields.welcome_url` at send time
 *   - Existing leads predate the field → tag has no value → empty/broken
 *     link in the email
 *   - `rowToLeads` now sets `welcome_url` automatically for NEW leads;
 *     this endpoint patches every EXISTING lead to match
 *
 * Workflow:
 *   1. List every (campus, kind, smartlead_campaign_id) from outreach rows
 *   2. For each campaign: page through Smartlead's leads endpoint
 *   3. For each lead: look up custom_fields.outreach_id, compute the
 *      per-recipient welcome_url via buildWelcomeUrl, push the update
 *
 * Idempotent — recomputing welcome_url for the same outreach + email
 * produces the same value (modulo the JTI which is random per token).
 * Note: re-running this endpoint REVOKES any previously-issued URLs by
 * generating new JTIs. That's deliberate — a refresh should produce a
 * fresh one-shot token; old emails still in inboxes won't work after.
 *
 * Auth: admin-only.
 *
 * Routes:
 *   GET  ...?dry_run=1  → preview without writing
 *   POST ...            → push updates
 *
 * Optional filters:
 *   ?campaign_id=<n>    → just one campaign
 *   ?campus=<slug>      → just one campus
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import {
  listCampaignLeads,
  updateLeadInCampaign,
  type SmartleadCampaignLead,
} from "@/lib/smartlead";
import { buildWelcomeUrl } from "@/lib/medjobs/welcome-token";

export const maxDuration = 300; // walking many leads across many campaigns is slow

interface CampaignJob {
  campaign_id: number;
  campus_slug: string | null;
}

interface LeadResult {
  campaign_id: number;
  lead_id: number | null;
  email: string | null;
  outreach_id: string | null;
  status: "updated" | "skipped" | "failed";
  reason?: string;
}

async function run(request: Request, apply: boolean): Promise<Response> {
  // ── Admin auth ───────────────────────────────────────────────────────
  const supaUser = await createClient();
  const {
    data: { user },
  } = await supaUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const admin = await isAdmin(user.id);
  if (!admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const url = new URL(request.url);
  const campaignFilter = url.searchParams.get("campaign_id");
  const campusFilter = url.searchParams.get("campus");

  // ── Env checks ───────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const smartleadKey = process.env.SMARTLEAD_API_KEY;
  const magicSecret = process.env.MEDJOBS_MAGIC_LINK_SECRET;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase env missing" },
      { status: 500 },
    );
  }
  if (apply && !smartleadKey) {
    return NextResponse.json(
      { error: "SMARTLEAD_API_KEY required when pushing" },
      { status: 500 },
    );
  }
  if (!magicSecret) {
    return NextResponse.json(
      {
        error:
          "MEDJOBS_MAGIC_LINK_SECRET not configured — set it on Vercel before backfilling leads",
      },
      { status: 500 },
    );
  }

  const supabase = createServiceClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 1. Collect campaigns to process ─────────────────────────────────
  const { data: rows, error: qErr } = await supabase
    .from("student_outreach")
    .select(
      "id, research_data, campuses:campus_id (slug)",
    )
    .not("research_data->smartlead->>campaign_id", "is", null);

  if (qErr) {
    return NextResponse.json(
      { error: `Supabase query failed: ${qErr.message}` },
      { status: 500 },
    );
  }

  const jobs = new Map<number, CampaignJob>();
  for (const r of ((rows ?? []) as unknown) as Array<{
    id: string;
    research_data: Record<string, unknown> | null;
    campuses: { slug: string | null } | null;
  }>) {
    const smartlead = (r.research_data?.smartlead ?? {}) as Record<string, unknown>;
    const cid = Number(smartlead.campaign_id);
    if (!Number.isFinite(cid)) continue;
    if (campaignFilter && String(cid) !== campaignFilter) continue;
    if (campusFilter && r.campuses?.slug !== campusFilter) continue;
    if (jobs.has(cid)) continue;
    jobs.set(cid, {
      campaign_id: cid,
      campus_slug: r.campuses?.slug ?? null,
    });
  }

  // ── 2. For each campaign: walk leads + backfill welcome_url ──────────
  const results: LeadResult[] = [];
  for (const job of jobs.values()) {
    let offset = 0;
    const LIMIT = 100;
    let pageCount = 0;
    while (true) {
      const list = await listCampaignLeads(job.campaign_id, {
        limit: LIMIT,
        offset,
      });
      if (!list.ok) {
        results.push({
          campaign_id: job.campaign_id,
          lead_id: null,
          email: null,
          outreach_id: null,
          status: "failed",
          reason: `listCampaignLeads failed: ${list.error}`,
        });
        break;
      }
      const leads = list.data?.data ?? [];
      if (leads.length === 0) break;

      for (const lead of leads) {
        await processLead(lead, job, apply, magicSecret, results);
      }

      offset += leads.length;
      pageCount++;
      // Defense: don't run forever on a misbehaving endpoint.
      if (pageCount > 100) {
        results.push({
          campaign_id: job.campaign_id,
          lead_id: null,
          email: null,
          outreach_id: null,
          status: "failed",
          reason: "Aborted after 100 pages — suspected pagination loop",
        });
        break;
      }
      if (leads.length < LIMIT) break;
    }
  }

  const updated = results.filter((r) => r.status === "updated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({
    dry_run: !apply,
    total_campaigns: jobs.size,
    summary: { updated, skipped, failed },
    results,
  });
}

async function processLead(
  lead: SmartleadCampaignLead,
  job: CampaignJob,
  apply: boolean,
  magicSecret: string,
  results: LeadResult[],
): Promise<void> {
  const leadId = (lead.lead_id ?? lead.id ?? null) as number | null;
  const email = (lead.email ?? null) as string | null;
  const outreachId =
    (lead.custom_fields?.outreach_id as string | undefined) ?? null;

  if (!leadId || !email || !outreachId) {
    results.push({
      campaign_id: job.campaign_id,
      lead_id: leadId,
      email,
      outreach_id: outreachId,
      status: "skipped",
      reason: "Missing lead_id / email / custom_fields.outreach_id",
    });
    return;
  }

  // Build the new welcome_url for this recipient.
  let welcomeUrl: string;
  try {
    welcomeUrl = buildWelcomeUrl(
      { outreach_id: outreachId, email },
      magicSecret,
    );
  } catch (e) {
    results.push({
      campaign_id: job.campaign_id,
      lead_id: leadId,
      email,
      outreach_id: outreachId,
      status: "failed",
      reason: `buildWelcomeUrl failed: ${e instanceof Error ? e.message : String(e)}`,
    });
    return;
  }

  if (!apply) {
    results.push({
      campaign_id: job.campaign_id,
      lead_id: leadId,
      email,
      outreach_id: outreachId,
      status: "skipped",
      reason: "dry-run",
    });
    return;
  }

  // Merge with existing custom_fields so other tags (campus, contact_id,
  // recipient_kind, role, salutation) survive the patch.
  const existing = (lead.custom_fields ?? {}) as Record<string, unknown>;
  const patch = {
    custom_fields: {
      ...existing,
      welcome_url: welcomeUrl,
    },
  };

  const upd = await updateLeadInCampaign(job.campaign_id, leadId, patch);
  if (upd.ok) {
    results.push({
      campaign_id: job.campaign_id,
      lead_id: leadId,
      email,
      outreach_id: outreachId,
      status: "updated",
    });
  } else {
    results.push({
      campaign_id: job.campaign_id,
      lead_id: leadId,
      email,
      outreach_id: outreachId,
      status: "failed",
      reason: `updateLeadInCampaign failed: ${upd.error}`,
    });
  }
}

export async function GET(request: Request) {
  return run(request, false);
}

export async function POST(request: Request) {
  return run(request, true);
}
