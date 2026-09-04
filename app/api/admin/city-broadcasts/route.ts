/**
 * GET /api/admin/city-broadcasts
 *
 * Returns provider-level data for the city broadcasts dashboard.
 * Shows broadcast_ready providers grouped by city with their broadcast history
 * and claim status.
 *
 * Query params:
 *   - days: Number of days to look back for broadcast stats (default: 7)
 *   - status: Filter by status (all, sent, waiting, done)
 *   - done_sub: Sub-filter when status=done (claimed, not_interested, archived)
 *   - city: Filter by city
 *   - search: Search provider name
 *   - page: Page number for pagination (default: 1)
 *   - per_page: Cities per page (default: 10, max: 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

interface ProviderBroadcast {
  provider_id: string;
  provider_name: string;
  category: string | null;
  city: string;
  state: string | null;
  phone: string | null;
  email: string | null;
  broadcasts_received: number;
  last_broadcast_at: string | null;
  last_broadcast_type: "question_asked" | "profile_published" | null;
  claimed: boolean;
  claimed_at: string | null;
  is_conversion: boolean; // True if claimed AFTER receiving first broadcast
  stage: "broadcast_ready" | "not_interested" | "archived";
}

interface CityGroup {
  city: string;
  state: string | null;
  pool_count: number;
  sent_count: number;
  claimed_count: number;
  conversion_count: number; // True conversions (claimed after broadcast)
  providers: ProviderBroadcast[];
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") || "7", 10), 90);
  const statusFilter = searchParams.get("status") || "all";
  const doneSubFilter = searchParams.get("done_sub") || "claimed"; // For status=done
  const cityFilter = searchParams.get("city") || "";
  const searchQuery = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("per_page") || "10", 10)));

  const db = getServiceClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  try {
    // Determine which stage(s) to query based on status filter
    // "done" tab shows terminal states: claimed (still broadcast_ready but linked), not_interested, archived
    let stageToQuery: string | string[] = "broadcast_ready";
    if (statusFilter === "done" && (doneSubFilter === "not_interested" || doneSubFilter === "archived")) {
      stageToQuery = doneSubFilter;
    }

    // Step 1: Get providers with their details
    let trackingQuery = db
      .from("provider_outreach_tracking")
      .select("provider_id, city, state, apollo_contact, stage")
      .eq("stage", stageToQuery);

    if (cityFilter) {
      trackingQuery = trackingQuery.ilike("city", `%${cityFilter}%`);
    }

    const { data: trackingRows, error: trackingError } = await trackingQuery;

    if (trackingError) {
      console.error("[city-broadcasts] Failed to fetch tracking:", trackingError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    if (!trackingRows || trackingRows.length === 0) {
      return NextResponse.json({
        stats: { pool: 0, sent: 0, claimed: 0, conversions: 0, conversion: 0 },
        cities: [],
        pagination: { page: 1, per_page: perPage, total_cities: 0, total_pages: 0 },
      });
    }

    const providerIds = trackingRows.map((r) => r.provider_id);

    // Step 2: Get provider details from olera-providers
    const { data: providers } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, phone, email")
      .in("provider_id", providerIds)
      .or("deleted.is.null,deleted.eq.false");

    const providerMap = new Map(
      (providers || []).map((p) => [p.provider_id, p])
    );

    // Step 3: Get broadcast recipients for these providers (within time range)
    const { data: recipients } = await db
      .from("city_broadcast_recipients")
      .select("provider_id, created_at, status, event_id")
      .in("provider_id", providerIds)
      .eq("status", "sent")
      .gte("created_at", cutoffIso)
      .order("created_at", { ascending: false });

    // Get event types for these recipients
    const eventIds = [...new Set((recipients || []).map((r) => r.event_id))];
    const { data: events } = eventIds.length > 0
      ? await db
          .from("city_broadcast_events")
          .select("id, event_type")
          .in("id", eventIds)
      : { data: [] };

    const eventTypeMap = new Map(
      (events || []).map((e) => [e.id, e.event_type])
    );

    // Group recipients by provider
    const recipientsByProvider = new Map<string, typeof recipients>();
    for (const r of recipients || []) {
      if (!recipientsByProvider.has(r.provider_id)) {
        recipientsByProvider.set(r.provider_id, []);
      }
      recipientsByProvider.get(r.provider_id)!.push(r);
    }

    // Step 4: Check which providers have claimed
    // We track claimed_at to calculate true conversion (claimed AFTER receiving broadcast)
    const { data: claimedBps } = await db
      .from("business_profiles")
      .select("source_provider_id, created_at")
      .in("source_provider_id", providerIds)
      .not("account_id", "is", null);

    const claimedMap = new Map(
      (claimedBps || []).map((bp) => [bp.source_provider_id, bp.created_at])
    );

    // Get first broadcast date for each provider (for true conversion calculation)
    const { data: firstBroadcasts } = await db
      .from("city_broadcast_recipients")
      .select("provider_id, created_at")
      .in("provider_id", providerIds)
      .eq("status", "sent")
      .order("created_at", { ascending: true });

    // Map provider to their first broadcast date
    const firstBroadcastMap = new Map<string, string>();
    for (const fb of firstBroadcasts || []) {
      if (!firstBroadcastMap.has(fb.provider_id)) {
        firstBroadcastMap.set(fb.provider_id, fb.created_at);
      }
    }

    // Step 5: Build provider broadcast data
    const providerBroadcasts: ProviderBroadcast[] = [];

    for (const tracking of trackingRows) {
      const provider = providerMap.get(tracking.provider_id);
      if (!provider) continue;

      // Apply search filter
      if (searchQuery && !provider.provider_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        continue;
      }

      const broadcasts = recipientsByProvider.get(tracking.provider_id) || [];
      const lastBroadcast = broadcasts[0]; // Already sorted by created_at desc
      const claimed = claimedMap.has(tracking.provider_id);
      const claimedAt = claimedMap.get(tracking.provider_id) || null;

      // Get email from apollo_contact or provider
      const apolloContact = tracking.apollo_contact as { email?: string } | null;
      const email = apolloContact?.email || provider.email;

      // Check if this is a "true conversion" - claimed AFTER receiving first broadcast
      const firstBroadcastAt = firstBroadcastMap.get(tracking.provider_id);
      const isConversion = !!(claimed && claimedAt && firstBroadcastAt &&
        new Date(claimedAt) > new Date(firstBroadcastAt));

      const providerData: ProviderBroadcast = {
        provider_id: tracking.provider_id,
        provider_name: provider.provider_name || "Unknown",
        category: provider.provider_category,
        city: tracking.city || provider.city || "Unknown",
        state: tracking.state || provider.state,
        phone: provider.phone,
        email,
        broadcasts_received: broadcasts.length,
        last_broadcast_at: lastBroadcast?.created_at || null,
        last_broadcast_type: lastBroadcast ? eventTypeMap.get(lastBroadcast.event_id) || null : null,
        claimed,
        claimed_at: claimedAt,
        // True conversion: claimed after receiving at least one broadcast
        is_conversion: isConversion,
        stage: tracking.stage as "broadcast_ready" | "not_interested" | "archived",
      };

      // Apply status filter
      // For "done" status with claimed sub-filter (or legacy "claimed" status), show only claimed
      if (((statusFilter === "done" && doneSubFilter === "claimed") || statusFilter === "claimed") && !claimed) continue;
      // For not_interested/archived sub-filters, we already filtered by stage, so show all
      if (statusFilter === "sent" && broadcasts.length === 0) continue;
      if (statusFilter === "waiting" && (claimed || broadcasts.length === 0)) continue;

      providerBroadcasts.push(providerData);
    }

    // Step 6: Group by city+state (to avoid merging different cities with same name)
    const cityGroups = new Map<string, CityGroup>();

    for (const p of providerBroadcasts) {
      // Use city+state as key to distinguish "Springfield, IL" from "Springfield, MO"
      const cityKey = p.state ? `${p.city}, ${p.state}` : p.city;
      if (!cityGroups.has(cityKey)) {
        cityGroups.set(cityKey, {
          city: p.city,
          state: p.state,
          pool_count: 0,
          sent_count: 0,
          claimed_count: 0,
          conversion_count: 0,
          providers: [],
        });
      }
      const group = cityGroups.get(cityKey)!;
      group.pool_count++;
      if (p.broadcasts_received > 0) group.sent_count++;
      if (p.claimed) group.claimed_count++;
      if (p.is_conversion) group.conversion_count++;
      group.providers.push(p);
    }

    // Sort cities by pool count descending
    const sortedCities = [...cityGroups.values()]
      .sort((a, b) => b.pool_count - a.pool_count);

    // Sort providers within each city by broadcasts received (desc), then name
    for (const city of sortedCities) {
      city.providers.sort((a, b) => {
        if (b.broadcasts_received !== a.broadcasts_received) {
          return b.broadcasts_received - a.broadcasts_received;
        }
        return a.provider_name.localeCompare(b.provider_name);
      });
    }

    // Step 7: Paginate cities
    const totalCities = sortedCities.length;
    const startIndex = (page - 1) * perPage;
    const paginatedCities = sortedCities.slice(startIndex, startIndex + perPage);

    // Step 8: Calculate overall stats (across ALL cities, not just paginated)
    const totalPool = providerBroadcasts.length;
    const totalSent = providerBroadcasts.filter((p) => p.broadcasts_received > 0).length;
    const totalClaimed = providerBroadcasts.filter((p) => p.claimed).length;
    // True conversion: only count providers who claimed AFTER receiving a broadcast
    const totalConversions = providerBroadcasts.filter((p) => p.is_conversion).length;
    const conversion = totalSent > 0 ? Math.round((totalConversions / totalSent) * 1000) / 10 : 0;

    return NextResponse.json({
      stats: {
        pool: totalPool,
        sent: totalSent,
        claimed: totalClaimed,
        conversions: totalConversions, // True conversions (claimed after broadcast)
        conversion, // Conversion rate percentage
      },
      cities: paginatedCities,
      pagination: {
        page,
        per_page: perPage,
        total_cities: totalCities,
        total_pages: Math.ceil(totalCities / perPage),
      },
      filters: {
        days,
        status: statusFilter,
        done_sub: statusFilter === "done" ? doneSubFilter : null,
        city: cityFilter,
        search: searchQuery,
      },
    });
  } catch (err) {
    console.error("[city-broadcasts] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
