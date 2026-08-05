import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/re-engage-list
 *
 * Returns all providers currently in the re_engage stage across ALL states.
 * Includes fax delivery tracking, claimed status, and enrichment data.
 * Used by the Alternative Channels tab to populate providers and analytics.
 */
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getServiceClient();

    // Get all tracking rows in re_engage stage — include fax delivery columns
    // Query tracking rows — use select("*") to avoid column-not-found errors
    // from unapplied migrations
    const { data: trackingRows, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("*")
      .eq("stage", "re_engage");

    if (trackingError) {
      console.error("[re-engage-list] Tracking query error:", trackingError);
      return NextResponse.json({ error: "Failed to fetch tracking data" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (trackingRows || []) as any[];

    if (rows.length === 0) {
      return NextResponse.json({ providers: [] });
    }
    const providerIds = rows.map((t) => t.provider_id as string);

    // Fetch provider details + check claimed status in parallel
    const [providerResult, claimedResult] = await Promise.all([
      db
        .from("olera-providers")
        .select("provider_id, provider_name, provider_category, city, state, phone, email, website, slug, place_id")
        .in("provider_id", providerIds),
      db
        .from("business_profiles")
        .select("source_provider_id, created_at")
        .in("source_provider_id", providerIds)
        .not("account_id", "is", null),
    ]);

    if (providerResult.error) {
      console.error("[re-engage-list] Provider query error:", providerResult.error);
      return NextResponse.json({ error: "Failed to fetch provider data" }, { status: 500 });
    }

    const providerMap = new Map(
      (providerResult.data || []).map((p) => [p.provider_id, p])
    );

    // Build claimed lookup: provider_id → claimed_at
    const claimedMap = new Map(
      (claimedResult.data || []).map((bp) => [bp.source_provider_id, bp.created_at])
    );

    // Join tracking + provider data
    const providers = rows
      .map((t) => {
        const pid = t.provider_id as string;
        const p = providerMap.get(pid);
        if (!p) return null;
        return {
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          provider_category: p.provider_category,
          city: p.city,
          state: p.state,
          phone: p.phone || null,
          email: p.email || null,
          website: p.website || null,
          slug: p.slug || null,
          place_id: p.place_id || null,
          stage: "re_engage",
          assigned_to: (t.assigned_to as string) || null,
          // Fax enrichment
          fax_number: (t.fax_number as string) || null,
          fax_source_url: (t.fax_source_url as string) || null,
          fax_confidence: (t.fax_confidence as string) || null,
          fax_found_at: (t.fax_found_at as string) || null,
          // Fax delivery tracking (from Telnyx webhook — may not exist yet)
          fax_sent_at: (t.fax_sent_at as string) || null,
          fax_status: (t.fax_status as string) || null,
          fax_delivered_at: (t.fax_delivered_at as string) || null,
          fax_failure_reason: (t.fax_failure_reason as string) || null,
          // Direct mail tracking (from PostGrid — may not exist yet)
          mail_sent_at: (t.mail_sent_at as string) || null,
          mail_status: (t.mail_status as string) || null,
          mail_postgrid_id: (t.mail_postgrid_id as string) || null,
          mail_delivered_at: (t.mail_delivered_at as string) || null,
          mail_address: (t.mail_address as string) || null,
          // LinkedIn enrichment
          linkedin_url: (t.linkedin_url as string) || null,
          linkedin_found_at: (t.linkedin_found_at as string) || null,
          // Re-engage sub-channel (which tab this provider is in)
          re_engage_channel: (t.re_engage_channel as string) || "re_engage",
          // Claimed status (from business_profiles)
          claimed: claimedMap.has(pid),
          claimed_at: claimedMap.get(pid) || null,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.provider_name.localeCompare(b.provider_name));

    return NextResponse.json({ providers });
  } catch (e) {
    console.error("[re-engage-list] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch re-engage providers" },
      { status: 500 },
    );
  }
}
