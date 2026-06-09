/**
 * POST /api/admin/medjobs/register-smartlead-webhooks
 *
 * One-click "Connect Smartlead replies" — registers our reply webhook on every
 * campus Smartlead campaign (cold + activation) so replies/opens/clicks/bounces
 * flow into the Emails tab. Uses the production SMARTLEAD_API_KEY; the admin
 * just pastes the webhook secret (the same value set as SMARTLEAD_WEBHOOK_SECRET
 * on the edge function).
 *
 * Auth: admin-only. GET = dry-run (lists the campaigns that would be wired).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import { createCampaignWebhook, isSmartleadConfigured } from "@/lib/smartlead";

export const maxDuration = 120;

// Smartlead's valid webhook event types are the EMAIL_* names (+ LEAD_*
// lifecycle). Confirmed by the API rejecting LEAD_REPLIED as invalid.
// EMAIL_BOUNCE is NOT a valid type, so it's omitted.
const EVENT_TYPES = [
  "EMAIL_SENT",
  "EMAIL_OPEN",
  "EMAIL_LINK_CLICK",
  "EMAIL_REPLY",
  "LEAD_UNSUBSCRIBED",
];

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
  if (apply && !isSmartleadConfigured()) {
    return NextResponse.json({ error: "SMARTLEAD_API_KEY is not set in this environment." }, { status: 500 });
  }

  let secret = "";
  if (apply) {
    try {
      const body = (await request.json()) as { secret?: string };
      secret = (body.secret ?? "").trim();
    } catch {
      // fall through to the empty-secret check
    }
    if (!secret) {
      return NextResponse.json(
        { error: "Paste your webhook secret (the same value you set in Supabase)." },
        { status: 400 },
      );
    }
  }

  const supabase = createServiceClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Collect every distinct Smartlead campaign id (cold + activation).
  const { data: rows, error } = await supabase
    .from("student_outreach")
    .select("research_data, campuses:campus_id (slug)");
  if (error) {
    return NextResponse.json({ error: `Supabase query failed: ${error.message}` }, { status: 500 });
  }

  const campaigns = new Map<number, string | null>(); // id -> campus slug (for display)
  for (const r of ((rows ?? []) as unknown) as Array<{
    research_data: Record<string, unknown> | null;
    campuses: { slug: string | null } | null;
  }>) {
    const cold = (r.research_data?.smartlead as { campaign_id?: number } | undefined)?.campaign_id;
    const act = (r.research_data?.smartlead_activation as { campaign_id?: number } | undefined)?.campaign_id;
    for (const cid of [cold, act]) {
      if (typeof cid === "number" && Number.isFinite(cid) && !campaigns.has(cid)) {
        campaigns.set(cid, r.campuses?.slug ?? null);
      }
    }
  }

  const webhookUrl = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/smartlead-webhook?secret=${encodeURIComponent(secret)}`;

  if (!apply) {
    return NextResponse.json({
      dry_run: true,
      campaigns: [...campaigns.entries()].map(([id, slug]) => ({ campaign_id: id, campus_slug: slug })),
      total: campaigns.size,
    });
  }

  const registered: number[] = [];
  const failed: { campaign_id: number; error?: string }[] = [];
  for (const [cid] of campaigns) {
    const res = await createCampaignWebhook(cid, {
      name: "MedJobs CRM",
      webhookUrl,
      eventTypes: EVENT_TYPES,
    });
    if (res.ok) registered.push(cid);
    else failed.push({ campaign_id: cid, error: res.error });
  }

  return NextResponse.json({ ok: failed.length === 0, total: campaigns.size, registered, failed });
}

export async function GET(request: Request) {
  return run(request, false);
}

export async function POST(request: Request) {
  return run(request, true);
}
