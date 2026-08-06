import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * Provider self-report for a whole Ad Boost flight — the campaign-level twin of
 * /api/provider/lead-outcome.
 *
 * The per-lead sensor can only ask about campaigns that already produced an
 * attributed inquiry (sendDueLeadOutcomePings bails at
 * lib/ad-boost/outcome-pings.server.ts:108 when there are no lead rows), so the
 * flights most likely to be mis-measured are exactly the ones it never reaches.
 * Franchil is the proof: a $36.50 flight produced a real paying client who
 * phoned the office directly, and the platform reported zero families.
 *
 * This asks the provider directly, from the wrap-up email they're already
 * reading, and keys the answer on the campaign instead of a connection.
 *
 * Fired from the one-tap /provider/campaign-outcome landing page (no login),
 * keyed by the campaign request id. Same scanner-safe shape as the lead
 * sensor: this file exports ONLY POST, so a security scanner's GET 405s and
 * cannot record an answer.
 *
 * Last-write-wins, so a provider who taps "still talking" and later closes the
 * family can come back and upgrade it.
 *
 * POST /api/provider/campaign-outcome  body: { rid: string, value: 'client'|'talking'|'no' }
 */

const VALID_VALUES = ["client", "talking", "no"] as const;
type OutcomeValue = (typeof VALID_VALUES)[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rid: string | undefined = body.rid;
    const value = body.value as OutcomeValue | undefined;

    if (!rid || !value || !VALID_VALUES.includes(value)) {
      return NextResponse.json({ error: "rid and a valid value are required" }, { status: 400 });
    }

    const db = getServiceClient();

    const { data: campaign } = await db
      .from("ad_campaign_requests")
      .select("id, provider_id, provider_slug, display_name")
      .eq("id", rid)
      .maybeSingle();

    if (!campaign) {
      // Unknown id. No-op success so the page renders normally and we don't
      // leak which ids exist — same rule as the lead sensor.
      return NextResponse.json({ success: true, value, noop: "not_found" });
    }

    const { error: updErr } = await db
      .from("ad_campaign_requests")
      .update({
        provider_reported_outcome: value,
        provider_reported_outcome_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);
    if (updErr) {
      console.error("[provider/campaign-outcome] update failed:", updErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Analytics trail. Keyed by slug so it aggregates with the campaign's other
    // provider_activity rows; awaited because Vercel kills pending work after
    // the response. Logged on failure — the CHECK constraint rejects this
    // event_type until migration 164 is applied, and that must not be silent.
    const { error: eventErr } = await db.from("provider_activity").insert({
      provider_id: campaign.provider_slug || campaign.provider_id,
      event_type: "ad_campaign_outcome_reported",
      metadata: { value, request_id: campaign.id },
    });
    if (eventErr) {
      console.error(
        "[provider/campaign-outcome] activity insert failed (migration 164 applied?):",
        eventErr,
      );
    }

    return NextResponse.json({
      success: true,
      value,
      providerName: campaign.display_name || "your business",
    });
  } catch (err) {
    console.error("[provider/campaign-outcome] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
