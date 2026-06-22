import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

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
 * POST /api/families/connection-outcome  body: { cid: string, value: 'yes'|'no'|'not_yet' }
 */

const VALID_VALUES = ["yes", "no", "not_yet"] as const;
type OutcomeValue = (typeof VALID_VALUES)[number];

interface ThreadMessage {
  from_profile_id: string;
  text?: string;
  is_auto_reply?: boolean;
}

interface RecommendedProvider {
  name: string;
  slug: string;
  url: string;
  priceRange: string | null;
}

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
        from_profile_id,
        to_profile_id,
        metadata,
        from_profile:business_profiles!connections_from_profile_id_fkey(care_types),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, city, state, care_types)
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
    meta.outcome = {
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
      console.error("[connection-outcome] update failed:", updErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Activity event (best-effort; constraint added in migration 115).
    await db.from("seeker_activity").insert({
      profile_id: conn.from_profile_id,
      event_type: "connection_outcome_reported",
      related_provider_id: conn.to_profile_id,
      metadata: { value, connection_id: conn.id },
    });

    // YES → real connection (per the family). Nothing more to surface.
    if (value === "yes") {
      return NextResponse.json({ success: true, value, providerName });
    }

    // ── CASCADE TRIGGER SEAM ────────────────────────────────────────────────
    // value is "no" / "not_yet": the provider went quiet. Surface the help
    // cascade. v1 = matched alternative providers + the benefits finder, returned
    // for inline rendering. Future: enqueue auto-outreach to the alternatives,
    // SMS/WhatsApp, concierge handoff, etc.
    const providerCity = toProfile?.city as string | undefined;
    const providerState = toProfile?.state as string | undefined;
    const providerCareTypes = (toProfile?.care_types as string[]) || [];
    const familyCareTypes = (fromProfile?.care_types as string[]) || providerCareTypes;

    const alternatives = await findAlternativeProviders(
      db,
      conn.to_profile_id,
      providerCity,
      providerState,
      providerCareTypes,
    );

    const browseParams = new URLSearchParams();
    if (familyCareTypes[0]) browseParams.set("care_type", familyCareTypes[0]);
    if (providerCity) browseParams.set("city", providerCity);
    if (providerState) browseParams.set("state", providerState);
    const browseUrl = browseParams.toString() ? `/browse?${browseParams.toString()}` : "/browse";

    return NextResponse.json({
      success: true,
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

/**
 * Find up to 3 alternative providers in the same area + care type. Prefers
 * providers that have actually responded to a lead in the last 60 days
 * ("responsive"), then fills remaining slots with other matching providers so the
 * mini-cascade is never empty when options exist.
 */
async function findAlternativeProviders(
  db: ReturnType<typeof getServiceClient>,
  excludeProfileId: string,
  city: string | undefined,
  state: string | undefined,
  careTypes: string[],
): Promise<RecommendedProvider[]> {
  if (!city || !state || careTypes.length === 0) return [];

  const { data: candidates } = await db
    .from("business_profiles")
    .select("id, display_name, slug, care_types, metadata")
    .eq("type", "organization")
    .eq("is_active", true)
    .eq("city", city)
    .eq("state", state)
    .neq("id", excludeProfileId)
    .limit(50);

  if (!candidates?.length) return [];

  const matching = candidates.filter((p) => {
    const cts = (p.care_types as string[]) || [];
    return cts.some((ct) => careTypes.includes(ct));
  });
  if (matching.length === 0) return [];

  // Responsiveness: who has a real (non-auto) provider reply in the last 60 days.
  const ids = matching.map((p) => p.id);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentConns } = await db
    .from("connections")
    .select("to_profile_id, metadata")
    .in("to_profile_id", ids)
    .gte("created_at", sixtyDaysAgo);

  const responsive = new Set<string>();
  for (const c of recentConns || []) {
    if (responsive.has(c.to_profile_id)) continue;
    const thread = ((c.metadata as Record<string, unknown> | null)?.thread as ThreadMessage[]) || [];
    if (thread.some((m) => m.from_profile_id === c.to_profile_id && !m.is_auto_reply && m.text?.trim())) {
      responsive.add(c.to_profile_id);
    }
  }

  const toCard = (p: (typeof matching)[number]): RecommendedProvider => ({
    name: p.display_name as string,
    slug: p.slug as string,
    url: `/provider/${p.slug}?rp=${p.slug}`,
    priceRange: ((p.metadata as Record<string, unknown> | null)?.price_range as string) || null,
  });

  const ranked = [
    ...matching.filter((p) => responsive.has(p.id)),
    ...matching.filter((p) => !responsive.has(p.id)),
  ];
  return ranked.slice(0, 3).map(toCard);
}
