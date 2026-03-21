import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/matches
 *
 * Returns matches analytics: funnel metrics + recent activity.
 * Derives all data from business_profiles + connections tables.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getServiceClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    // ── Funnel metrics ──────────────────────────────────────────────

    // 1. Profiles created (all family profiles)
    const { count: profilesCreated } = await db
      .from("business_profiles")
      .select("id", { count: "exact", head: true })
      .eq("type", "family")
      .not("account_id", "is", null);

    // 2. Profiles with care_types + location (considered "complete enough")
    const { data: allFamilies } = await db
      .from("business_profiles")
      .select("id, metadata, care_types, city, state, created_at")
      .eq("type", "family")
      .not("account_id", "is", null)
      .limit(5000);

    let profilesCompleted = 0;
    let wentLive = 0;
    let skippedGoLive = 0;

    for (const f of allFamilies || []) {
      const hasCareTypes = f.care_types && (f.care_types as string[]).length > 0;
      const hasLocation = !!(f.city && f.state);
      if (hasCareTypes && hasLocation) profilesCompleted++;

      const meta = (f.metadata || {}) as Record<string, unknown>;
      const carePost = meta.care_post as { status?: string } | undefined;
      if (carePost?.status === "active") {
        wentLive++;
      } else if (hasCareTypes && hasLocation && !carePost?.status) {
        // Has complete profile but never went live
        skippedGoLive++;
      }
    }

    // 3. Provider interest events (connections of type 'request' from org → family)
    const { count: providerInterested } = await db
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("type", "request");

    // 4. Interest responded (accepted requests)
    const { count: interestResponded } = await db
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("type", "request")
      .eq("status", "accepted");

    // 5. Interest declined
    const { count: interestDeclined } = await db
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("type", "request")
      .eq("status", "declined");

    // 6. Conversations (connections with 2+ messages in metadata.thread)
    const { data: requestConnections } = await db
      .from("connections")
      .select("id, metadata")
      .eq("type", "request")
      .eq("status", "accepted")
      .limit(1000);

    let conversations = 0;
    for (const conn of requestConnections || []) {
      const meta = (conn.metadata || {}) as Record<string, unknown>;
      const thread = meta.thread as unknown[];
      if (thread && thread.length >= 2) {
        conversations++;
      }
    }

    // Compute rates
    const goLiveRate = profilesCompleted > 0
      ? Math.round((wentLive / profilesCompleted) * 100)
      : 0;
    const interestRate = wentLive > 0
      ? Math.round(((providerInterested || 0) / wentLive) * 100)
      : 0;
    const responseRate = (providerInterested || 0) > 0
      ? Math.round(((interestResponded || 0) / (providerInterested || 1)) * 100)
      : 0;
    const conversationRate = (interestResponded || 0) > 0
      ? Math.round((conversations / (interestResponded || 1)) * 100)
      : 0;

    // ── Recent activity (matches events) ────────────────────────────

    // Recent provider reach-outs (type='request')
    let recentQuery = db
      .from("connections")
      .select(`
        id,
        type,
        status,
        created_at,
        updated_at,
        from_profile:from_profile_id (id, display_name, city, state, type, category, source_provider_id),
        to_profile:to_profile_id (id, display_name, city, state, type, care_types, metadata)
      `)
      .eq("type", "request")
      .order("created_at", { ascending: false })
      .limit(50);

    if (search) {
      // Search by profile name — find matching IDs first
      const { data: matchingProfiles } = await db
        .from("business_profiles")
        .select("id")
        .ilike("display_name", `%${search}%`)
        .limit(200);

      const ids = (matchingProfiles ?? []).map((p) => p.id);
      if (ids.length === 0) {
        return NextResponse.json({
          metrics: {
            profilesCreated: profilesCreated || 0,
            profilesCompleted,
            wentLive,
            skippedGoLive,
            providerInterested: providerInterested || 0,
            interestResponded: interestResponded || 0,
            interestDeclined: interestDeclined || 0,
            conversations,
            goLiveRate,
            interestRate,
            responseRate,
            conversationRate,
          },
          events: [],
          total: 0,
        });
      }

      recentQuery = recentQuery.or(
        `from_profile_id.in.(${ids.join(",")}),to_profile_id.in.(${ids.join(",")})`
      );
    }

    const { data: events, count: totalEvents } = await recentQuery;

    return NextResponse.json({
      metrics: {
        profilesCreated: profilesCreated || 0,
        profilesCompleted,
        wentLive,
        skippedGoLive,
        providerInterested: providerInterested || 0,
        interestResponded: interestResponded || 0,
        interestDeclined: interestDeclined || 0,
        conversations,
        goLiveRate,
        interestRate,
        responseRate,
        conversationRate,
      },
      events: events || [],
      total: totalEvents || (events || []).length,
    });
  } catch (err) {
    console.error("[admin/matches] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
