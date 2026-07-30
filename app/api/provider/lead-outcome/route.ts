import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * Provider self-report of a lead outcome — the other half of the
 * connection-outcome sensor. The family side asks "did the provider get back
 * to you?"; this side asks the provider "did this family become a client?"
 *
 * Exists because of the Franchil lesson: a $36.50 flight produced a real
 * paying client and the platform recorded none of it, so the wrap-up ask was
 * unprovable. This is the receipt line that makes it provable.
 *
 * Fired from the one-tap /provider/lead-outcome landing page (no login), keyed
 * by the connection id. Records into connections.metadata.provider_outcome +
 * a provider_activity event (migration 149). Deliberately does NOT advance
 * connections.status — same rule as the family sensor: a self-report is not a
 * provider-engagement action.
 *
 * Last-write-wins so a provider can upgrade "still talking" to "client" from
 * the 21-day ping.
 *
 * POST /api/provider/lead-outcome  body: { cid: string, value: 'client'|'talking'|'no' }
 */

const VALID_VALUES = ["client", "talking", "no"] as const;
type OutcomeValue = (typeof VALID_VALUES)[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cid: string | undefined = body.cid;
    const value = body.value as OutcomeValue | undefined;

    if (!cid || !value || !VALID_VALUES.includes(value)) {
      return NextResponse.json({ error: "cid and a valid value are required" }, { status: 400 });
    }

    const db = getServiceClient();

    const { data: conn } = await db
      .from("connections")
      .select(
        `
        id,
        to_profile_id,
        metadata,
        to_profile:business_profiles!connections_to_profile_id_fkey(display_name, slug)
      `,
      )
      .eq("id", cid)
      .eq("type", "inquiry")
      .maybeSingle();

    if (!conn) {
      // Unknown / non-inquiry id. No-op success so the page renders normally
      // and we don't leak which ids exist.
      return NextResponse.json({ success: true, value, noop: "not_found" });
    }

    const toProfile = Array.isArray(conn.to_profile) ? conn.to_profile[0] : conn.to_profile;
    const providerName = (toProfile?.display_name as string) || "your business";

    const meta = (conn.metadata as Record<string, unknown>) || {};
    meta.provider_outcome = {
      self_reported: true,
      value,
      at: new Date().toISOString(),
      source: "email_link",
    };

    const { error: updErr } = await db
      .from("connections")
      .update({ metadata: meta })
      .eq("id", conn.id);
    if (updErr) {
      console.error("[provider/lead-outcome] update failed:", updErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Analytics trail. Keyed by slug so it aggregates with the campaign's other
    // provider_activity rows; awaited because Vercel kills pending work after
    // the response.
    await db.from("provider_activity").insert({
      provider_id: (toProfile?.slug as string) || conn.to_profile_id,
      event_type: "ad_lead_outcome_reported",
      metadata: { value, connection_id: conn.id },
    });

    return NextResponse.json({ success: true, value, providerName });
  } catch (err) {
    console.error("[provider/lead-outcome] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
