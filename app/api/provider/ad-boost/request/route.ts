import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { loadAdBoostEligibility } from "@/lib/ad-boost/eligibility.server";
import { sendSlackAlert, slackAdBoostRequested } from "@/lib/slack";

/**
 * Provider Paid Ad Boost (Managed Lead-Gen, concierge v1) — campaign request.
 *
 * POST: an eligibility-cleared provider submits a request to have us run a paid
 *   external ad campaign (Google/Meta) to their Olera page, choosing a setup
 *   week. Gated server-side on profile completeness (>=70%) so a client can't
 *   bypass the gate. Persists to `ad_campaign_requests` and pings the concierge
 *   team in Slack.
 * GET: returns the caller's current eligibility + their latest request (if any),
 *   so the Boost surface can render the gate / picker / "requested" state.
 *
 * Auth: authenticated provider only (handled by loadAdBoostEligibility).
 */

const OPEN_STATUSES = ["requested", "scheduled", "live"];
const VALID_CHANNELS = ["google", "meta", "both"];

export async function GET() {
  const elig = await loadAdBoostEligibility();
  if (!elig.ok) {
    return NextResponse.json({ error: elig.error }, { status: elig.status });
  }

  const db = getServiceClient();
  const { data: latest } = await db
    .from("ad_campaign_requests")
    .select("id, status, requested_setup_week, channel, campaign_tag, created_at")
    .eq("provider_id", elig.profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    eligibility: elig.eligibility,
    provider: { slug: elig.slug, displayName: elig.displayName },
    request: latest ?? null,
  });
}

export async function POST(request: NextRequest) {
  const elig = await loadAdBoostEligibility();
  if (!elig.ok) {
    return NextResponse.json({ error: elig.error }, { status: elig.status });
  }

  if (!elig.eligibility.eligible) {
    // Gate: don't spend ad budget driving families to a thin profile.
    return NextResponse.json(
      {
        error: "Profile not complete enough to request a campaign",
        eligibility: elig.eligibility,
      },
      { status: 403 },
    );
  }

  let body: { setupWeek?: unknown; channel?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validate setup week ──
  if (typeof body.setupWeek !== "string" || !body.setupWeek.trim()) {
    return NextResponse.json({ error: "setupWeek is required" }, { status: 400 });
  }
  const parsed = new Date(body.setupWeek);
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "setupWeek is not a valid date" }, { status: 400 });
  }
  // Must not be in the past (compare on the date, ignoring time-of-day).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) {
    return NextResponse.json({ error: "setupWeek cannot be in the past" }, { status: 400 });
  }
  const setupWeek = parsed.toISOString().slice(0, 10); // YYYY-MM-DD for the DATE column

  // ── Validate optional channel ──
  let channel: string | null = null;
  if (body.channel != null) {
    if (typeof body.channel !== "string" || !VALID_CHANNELS.includes(body.channel)) {
      return NextResponse.json(
        { error: `channel must be one of: ${VALID_CHANNELS.join(", ")}` },
        { status: 400 },
      );
    }
    channel = body.channel;
  }

  const db = getServiceClient();

  // ── Block duplicate open requests ──
  const { data: existing } = await db
    .from("ad_campaign_requests")
    .select("id, status, requested_setup_week, channel, campaign_tag, created_at")
    .eq("provider_id", elig.profileId)
    .in("status", OPEN_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already have an active campaign request", request: existing },
      { status: 409 },
    );
  }

  // ── Insert the request ──
  const { data: inserted, error: insertError } = await db
    .from("ad_campaign_requests")
    .insert({
      provider_id: elig.profileId,
      provider_slug: elig.slug,
      display_name: elig.displayName,
      requested_setup_week: setupWeek,
      completeness_at_submit: elig.eligibility.overall,
      channel,
      status: "requested",
    })
    .select("id, status, requested_setup_week, channel, campaign_tag, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("[ad-boost/request] insert failed:", insertError);
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
  }

  // ── Notify the concierge team ──
  // Awaited: Vercel's serverless runtime kills pending promises after the
  // response returns (memory feedback_serverless_fire_and_forget).
  const alert = slackAdBoostRequested({
    requestId: inserted.id,
    providerName: elig.displayName ?? elig.slug,
    providerSlug: elig.slug,
    city: elig.city,
    state: elig.state,
    category: elig.category,
    completeness: elig.eligibility.overall,
    setupWeek,
    channel,
  });
  await sendSlackAlert(alert.text, alert.blocks);

  return NextResponse.json({ ok: true, request: inserted });
}
