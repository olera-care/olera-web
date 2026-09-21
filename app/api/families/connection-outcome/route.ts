import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { findAlternativeProviders } from "@/lib/family-comms/alternatives";

/**
 * Family self-report of a connection outcome — the dating-app
 * "Did you meet this person?" pattern.
 *
 * Fired from the one-click /connection-outcome landing page (no login), keyed by
 * the connection id. Records whether the provider got back to the family, which
 * is our ground-truth connection signal (the real outcome happens off-platform
 * and is otherwise invisible — connection.status sits 'pending' forever).
 *
 * IMPORTANT: this records into connections.metadata.outcome + a seeker_activity
 * event. It deliberately does NOT advance connections.status — 'accepted' means
 * "the provider engaged" and is load-bearing for isSuccessfulConnection() and the
 * admin funnel. A family's click is a self-report, not a provider action.
 *
 * On a "no" / "not yet", this is also the cascade trigger: it returns matched
 * alternative providers + the benefits finder for the landing page's mini-cascade.
 *
 * POST /api/families/connection-outcome  body: { cid, value }
 *   default question   value: 'yes' | 'no' | 'not_yet'
 *   question:'placement'   value: 'working' | 'switched' | 'looking'
 *   question:'satisfaction' value: 'good' | 'mixed' | 'bad'
 *
 * WHY A SECOND QUESTION EXISTS.
 *
 * "yes" means the provider GOT BACK TO THEM. It has never meant they got care,
 * and it has never meant they chose that provider — but it is treated as a
 * terminal success everywhere downstream: it is a permanent global stop on the
 * family-comms coordinator and it counts as "connected" in computeFamilyOutcome.
 * So the moment a family tells us the phone rang, we stop asking and start
 * counting them as a win. Placement is the question that was never asked, and
 * this is where it gets asked.
 *
 * Satisfaction is deliberately NOT in the same breath. It only has an answer
 * once someone is actually receiving care, so it is asked only of the families
 * who just said they are working with the provider, and it is asked on the page
 * after that tap rather than in the email. One question per message.
 */

const VALID_VALUES = ["yes", "no", "not_yet"] as const;
type OutcomeValue = (typeof VALID_VALUES)[number];

const PLACEMENT_VALUES = ["working", "switched", "looking"] as const;
const SATISFACTION_VALUES = ["good", "mixed", "bad"] as const;
type Question = "outcome" | "placement" | "satisfaction";

const VALUES_FOR: Record<Question, readonly string[]> = {
  outcome: VALID_VALUES,
  placement: PLACEMENT_VALUES,
  satisfaction: SATISFACTION_VALUES,
};

/** The metadata key each question writes. Siblings, never overwriting each other. */
const META_KEY: Record<Question, string> = {
  outcome: "outcome",
  placement: "placement",
  satisfaction: "satisfaction",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cid: string | undefined = body.cid;
    const question: Question = body.question === "placement" || body.question === "satisfaction" ? body.question : "outcome";
    const value = body.value as string | undefined;

    if (!cid || !value || !VALUES_FOR[question].includes(value)) {
      return NextResponse.json({ error: "cid and a valid value are required" }, { status: 400 });
    }

    const db = getServiceClient();

    const { data: conn } = await db
      .from("connections")
      .select(
        `
        id,
        from_profile_id,
        to_profile_id,
        metadata,
        from_profile:business_profiles!connections_from_profile_id_fkey(care_types, lat, lng),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, city, state, care_types, account_id, metadata)
      `,
      )
      .eq("id", cid)
      .eq("type", "inquiry")
      .maybeSingle();

    if (!conn) {
      // Unknown / non-inquiry id. No-op success so the page renders normally and
      // we don't leak which ids exist.
      return NextResponse.json({ success: true, value, noop: "not_found" });
    }

    const fromProfile = Array.isArray(conn.from_profile) ? conn.from_profile[0] : conn.from_profile;
    const toProfile = Array.isArray(conn.to_profile) ? conn.to_profile[0] : conn.to_profile;
    const providerName = (toProfile?.display_name as string) || "the provider";

    // Record the outcome in connection metadata (last-write-wins so a family can
    // change their mind). Never touch status.
    const meta = (conn.metadata as Record<string, unknown>) || {};
    const now = new Date().toISOString();
    meta[META_KEY[question]] = {
      self_reported: true,
      value,
      at: now,
      source: "email_link",
    };

    // If family confirms connection ("yes"), mark it as connected — BUT only if
    // the provider is claimed AND verified. Unclaimed/unverified providers can't
    // see family PII, so they couldn't have actually contacted the family.
    if (question === "outcome" && value === "yes") {
      const providerMeta = (toProfile?.metadata as Record<string, unknown>) || {};
      const isProviderClaimed = !!(toProfile?.account_id);
      const verificationState = providerMeta.verification_state as string | undefined;
      // Provider can see family PII if: verified, not_required, or no verification_state (legacy)
      const isProviderVerified = !verificationState ||
                                  verificationState === "verified" ||
                                  verificationState === "not_required";

      // Only set family_confirmed if provider could actually see family contact info
      if (isProviderClaimed && isProviderVerified) {
        meta.family_confirmed = true;
        meta.family_confirmed_at = now;
        // Only stop the sequence if it isn't already stopped
        // (provider may have already connected via phone/email/message)
        if (!meta.followup_stopped_at) {
          meta.followup_stopped_at = now;
          meta.followup_stopped_reason = "family_confirmed";
        }
      }
      // Note: outcome is still recorded in meta.outcome regardless — that's the
      // family's self-report. We just don't treat it as a confirmed connection
      // if the provider couldn't have seen their contact info.
    }

    const { error: updErr } = await db
      .from("connections")
      .update({ metadata: meta })
      .eq("id", conn.id);
    if (updErr) {
      console.error("[connection-outcome] update failed:", updErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Activity event (best-effort; constraint added in migration 115). All three
    // questions share the one allowed event_type and separate on metadata.question
    // — adding a new event_type would need a CHECK migration and buys nothing.
    await db.from("seeker_activity").insert({
      profile_id: conn.from_profile_id,
      event_type: "connection_outcome_reported",
      related_provider_id: conn.to_profile_id,
      metadata: { question, value, connection_id: conn.id },
    });

    // Satisfaction is the tail of the placement answer, asked and answered on
    // the same page. Nothing to surface back.
    if (question === "satisfaction") {
      return NextResponse.json({ success: true, question, value, providerName });
    }

    // Answers with nothing to offer: they connected, or they have already
    // chosen someone. Offering alternatives to a family who just told us they
    // found care reads as not listening.
    const settled = question === "placement" ? value === "working" || value === "switched" : value === "yes";
    if (settled) {
      return NextResponse.json({ success: true, question, value, providerName });
    }

    // ── CASCADE TRIGGER SEAM ────────────────────────────────────────────────
    // Still looking: either the provider went quiet ("no"/"not_yet") or they got
    // back and it did not work out ("looking"). Same need, so the same cascade. v1 = matched alternative providers + the benefits finder, returned
    // for inline rendering. Future: enqueue auto-outreach to the alternatives,
    // SMS/WhatsApp, concierge handoff, etc.
    const providerCity = toProfile?.city as string | undefined;
    const providerState = toProfile?.state as string | undefined;
    const providerCareTypes = (toProfile?.care_types as string[]) || [];
    const familyCareTypes = (fromProfile?.care_types as string[]) || providerCareTypes;

    const familyLat = typeof fromProfile?.lat === "number" ? fromProfile.lat : null;
    const familyLng = typeof fromProfile?.lng === "number" ? fromProfile.lng : null;
    const alternatives = await findAlternativeProviders(
      db,
      conn.to_profile_id,
      providerCity,
      providerState,
      providerCareTypes,
      familyLat,
      familyLng,
    );

    const browseParams = new URLSearchParams();
    if (familyCareTypes[0]) browseParams.set("care_type", familyCareTypes[0]);
    if (providerCity) browseParams.set("city", providerCity);
    if (providerState) browseParams.set("state", providerState);
    const browseUrl = browseParams.toString() ? `/browse?${browseParams.toString()}` : "/browse";

    return NextResponse.json({
      success: true,
      question,
      value,
      providerName,
      alternatives,
      browseUrl,
      benefitsUrl: "/benefits/finder",
    });
  } catch (err) {
    console.error("[connection-outcome] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
