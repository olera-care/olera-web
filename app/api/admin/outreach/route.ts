import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/outreach
 *
 * Returns provider outreach analytics for the Find Families feature:
 * - Funnel metrics: page views → card clicks → messages sent → accepted/declined
 * - AI usage stats
 * - Recent outreach list with provider/family details
 *
 * Query params:
 * - days: number of days to look back (default: 30)
 * - limit: max recent outreach to return (default: 50)
 * - offset: pagination offset (default: 0)
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getServiceClient();

    // Calculate date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffIso = cutoffDate.toISOString();

    // ── Fetch funnel metrics from provider_activity ──
    // Note: These are engagement counts (not unique users) to show activity volume.
    // A provider viewing the page 3 times = 3 views. This shows total engagement.
    const [
      pageViewsRes,
      cardClicksRes,
    ] = await Promise.all([
      // Page views (total engagement, not unique)
      db
        .from("provider_activity")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "matches_page_viewed")
        .gte("created_at", cutoffIso),

      // Card clicks (total engagement, not unique)
      db
        .from("provider_activity")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "matches_card_clicked")
        .gte("created_at", cutoffIso),
    ]);

    // ── Fetch outreach metrics from connections ──
    // Provider-initiated outreach = connections with type='request' and metadata->provider_initiated = true
    // AI usage is now tracked in connection metadata (used_ai: true) for accurate sent-message tracking
    const [
      outreachSentRes,
      outreachAcceptedRes,
      outreachDeclinedRes,
      aiAssistedRes,
    ] = await Promise.all([
      // Total outreach sent
      db
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("type", "request")
        .contains("metadata", { provider_initiated: true })
        .gte("created_at", cutoffIso),

      // Accepted
      db
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("type", "request")
        .eq("status", "accepted")
        .contains("metadata", { provider_initiated: true })
        .gte("created_at", cutoffIso),

      // Declined
      db
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("type", "request")
        .eq("status", "declined")
        .contains("metadata", { provider_initiated: true })
        .gte("created_at", cutoffIso),

      // AI-assisted outreach (messages where AI generation was used)
      db
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("type", "request")
        .contains("metadata", { provider_initiated: true, used_ai: true })
        .gte("created_at", cutoffIso),
    ]);

    // ── Fetch recent outreach with provider/family details ──
    const { data: recentOutreach, error: outreachError, count: totalOutreach } = await db
      .from("connections")
      .select(`
        id,
        status,
        message,
        metadata,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(id, display_name, slug, city, state, image_url),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, slug, city, state, image_url, metadata)
      `, { count: "exact" })
      .eq("type", "request")
      .contains("metadata", { provider_initiated: true })
      .gte("created_at", cutoffIso)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (outreachError) {
      console.error("[admin/outreach] Failed to fetch outreach:", outreachError);
      return NextResponse.json({ error: "Failed to fetch outreach data" }, { status: 500 });
    }

    // ── Calculate funnel metrics ──
    const funnel = {
      views: pageViewsRes.count ?? 0,
      clicks: cardClicksRes.count ?? 0,
      sent: outreachSentRes.count ?? 0,
      accepted: outreachAcceptedRes.count ?? 0,
      declined: outreachDeclinedRes.count ?? 0,
    };

    // Calculate conversion rates with one decimal precision for accuracy
    const calcRate = (numerator: number, denominator: number): number => {
      if (denominator === 0) return 0;
      const rate = (numerator / denominator) * 100;
      // Keep one decimal place for precision, round to integer if >= 10%
      return rate >= 10 ? Math.round(rate) : Math.round(rate * 10) / 10;
    };

    const rates = {
      viewToClick: calcRate(funnel.clicks, funnel.views),
      clickToSend: calcRate(funnel.sent, funnel.clicks),
      acceptRate: calcRate(funnel.accepted, funnel.sent),
      declineRate: calcRate(funnel.declined, funnel.sent),
    };

    // AI usage stats - based on actual sent messages that used AI (not generation attempts)
    const aiAssisted = aiAssistedRes.count ?? 0;
    const aiUsage = {
      generated: aiAssisted,
      percentOfSent: calcRate(aiAssisted, funnel.sent),
    };

    // Format recent outreach for response
    type ProfileData = {
      id: string;
      display_name: string;
      slug: string;
      city: string | null;
      state: string | null;
      image_url: string | null;
      metadata?: Record<string, unknown> | null;
    };

    const formattedOutreach = (recentOutreach ?? []).map((conn) => {
      // Supabase returns single objects for FK joins (not arrays)
      const fromProfile = conn.from_profile as unknown as ProfileData | null;
      const toProfile = conn.to_profile as unknown as ProfileData | null;

      return {
        id: conn.id,
        status: conn.status,
        message: conn.message,
        created_at: conn.created_at,
        provider: fromProfile ? {
          id: fromProfile.id,
          name: fromProfile.display_name,
          slug: fromProfile.slug,
          location: [fromProfile.city, fromProfile.state].filter(Boolean).join(", "),
          image_url: fromProfile.image_url,
        } : null,
        family: toProfile ? {
          id: toProfile.id,
          name: toProfile.display_name,
          slug: toProfile.slug,
          location: [toProfile.city, toProfile.state].filter(Boolean).join(", "),
          image_url: toProfile.image_url,
        } : null,
      };
    });

    return NextResponse.json({
      funnel,
      rates,
      aiUsage,
      recentOutreach: formattedOutreach,
      total: totalOutreach ?? 0,
      days,
    });
  } catch (err) {
    console.error("[admin/outreach] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
