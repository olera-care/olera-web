import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/sequence-stats
 *
 * Returns real sequence stats for the in-basket Sequence tab.
 * Pulls from provider_outreach table, grouped by sequence_step.
 *
 * Response shape matches what the in-basket page expects:
 * {
 *   steps: [
 *     { step: 1, label: "Step 1 · Email one", sent: 90, here_now: 30,
 *       opened: 38, clicked: 9, replied: 2 },
 *     ...
 *   ],
 *   totals: { all: 120, step1: 30, ... },
 *   providers: [ { provider_id, provider_name, city, state, category,
 *                   email, phone, sequence_step, ... } ]
 * }
 */

const STEP_META: Record<number, { label: string; emailName: string; subtitle: string }> = {
  1: { label: "Step 1 · Email one", emailName: "Email one · What makes you special", subtitle: "Featured section prompt" },
  2: { label: "Step 2 · Email two", emailName: "Email two · Add photos", subtitle: "Photo prompt" },
  3: { label: "Step 3 · Email three", emailName: "Email three · Reviews you can't answer", subtitle: "Review reply prompt" },
  4: { label: "Step 4 · Email four", emailName: "Email four · No referral fees", subtitle: "Direct contact pitch" },
};

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();

  // Row shape from provider_outreach (columns added in migration 131)
  interface OutreachRow {
    provider_id: string;
    provider_name: string;
    provider_category: string | null;
    city: string | null;
    state: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    slug: string | null;
    status: string;
    sequence_step: number | null;
    sequence_status: string;
    lead_score: string | null;
    email_opens: number;
    email_clicks: number;
    email_replies: number;
    email_bounced: boolean;
    first_email_sent_at: string | null;
    last_open_at: string | null;
    last_click_at: string | null;
    last_reply_at: string | null;
    smartlead_campaign_id: number | null;
    smartlead_lead_id: number | null;
    updated_at: string;
  }

  // Fetch all providers in the sequence (active, paused, completed)
  const { data, error } = await db
    .from("provider_outreach")
    .select(
      "provider_id, provider_name, provider_category, city, state, email, phone, website, slug, " +
      "status, sequence_step, sequence_status, lead_score, " +
      "email_opens, email_clicks, email_replies, email_bounced, " +
      "first_email_sent_at, last_open_at, last_click_at, last_reply_at, " +
      "smartlead_campaign_id, smartlead_lead_id, updated_at"
    )
    .in("sequence_status", ["active", "paused", "completed", "opted_out"])
    .order("sequence_step", { ascending: true });

  const rows = data as unknown as OutreachRow[] | null;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({
      steps: [],
      totals: { all: 0 },
      providers: [],
    });
  }

  // Aggregate per step
  const stepAgg: Record<number, {
    sent: number;
    here_now: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
  }> = {};

  const totals: Record<string, number> = { all: rows.length };

  for (const row of rows) {
    const step = row.sequence_step || 1;
    if (!stepAgg[step]) {
      stepAgg[step] = { sent: 0, here_now: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 };
    }
    const agg = stepAgg[step];
    agg.sent++;
    if (row.sequence_status === "active") agg.here_now++;
    if (row.email_opens > 0) agg.opened++;
    if (row.email_clicks > 0) agg.clicked++;
    if (row.email_replies > 0) agg.replied++;
    if (row.email_bounced) agg.bounced++;

    // Totals by step key
    const stepKey = `step${step}`;
    totals[stepKey] = (totals[stepKey] || 0) + 1;
  }

  // Also count paused / unresolved
  totals.paused = rows.filter((r) => r.sequence_status === "paused").length;
  totals.unresolved = rows.filter((r) => r.email_bounced || r.sequence_status === "opted_out").length;

  // Build step summaries
  const steps = Object.entries(stepAgg).map(([stepNum, agg]) => {
    const s = Number(stepNum);
    const meta = STEP_META[s] || { label: `Step ${s}`, emailName: `Email ${s}`, subtitle: "" };
    return {
      step: s,
      key: `step${s}`,
      ...meta,
      ...agg,
    };
  }).sort((a, b) => a.step - b.step);

  // Provider list for the expanded step view
  const providers = rows.map((r) => ({
    provider_id: r.provider_id,
    provider_name: r.provider_name,
    category: r.provider_category,
    city: r.city,
    state: r.state,
    email: r.email,
    phone: r.phone,
    website: r.website,
    slug: r.slug,
    sequence_step: r.sequence_step,
    sequence_status: r.sequence_status,
    lead_score: r.lead_score,
    opens: r.email_opens,
    clicks: r.email_clicks,
    replies: r.email_replies,
    bounced: r.email_bounced,
    last_open_at: r.last_open_at,
    last_click_at: r.last_click_at,
    last_reply_at: r.last_reply_at,
    first_email_sent_at: r.first_email_sent_at,
  }));

  return NextResponse.json({ steps, totals, providers });
}
