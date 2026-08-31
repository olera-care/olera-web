/**
 * GET /api/admin/city-broadcasts
 *
 * Returns city broadcast events and statistics for the admin dashboard.
 *
 * Query params:
 *   - days: Number of days to look back (default: 7)
 *   - city: Filter by city
 *   - event_type: Filter by event type (question_asked, profile_published)
 *   - limit: Max events to return (default: 100)
 *   - offset: Pagination offset (default: 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

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
  const city = searchParams.get("city");
  const eventType = searchParams.get("event_type");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const db = getServiceClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  try {
    // Get stats
    const [todayStats, weekStats, allTimeStats] = await Promise.all([
      getStats(db, new Date().toISOString().split("T")[0] + "T00:00:00.000Z"),
      getStats(db, cutoffIso),
      getStats(db),
    ]);

    // Get events with filters
    let eventsQuery = db
      .from("city_broadcast_events")
      .select(`
        id,
        event_type,
        event_id,
        city,
        state,
        category,
        status,
        skip_reason,
        providers_eligible,
        providers_sent,
        processed_at,
        created_at
      `)
      .gte("created_at", cutoffIso)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (city) {
      eventsQuery = eventsQuery.ilike("city", `%${city}%`);
    }
    if (eventType) {
      eventsQuery = eventsQuery.eq("event_type", eventType);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error("[admin/city-broadcasts] Failed to fetch events:", eventsError);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = db
      .from("city_broadcast_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", cutoffIso);

    if (city) {
      countQuery = countQuery.ilike("city", `%${city}%`);
    }
    if (eventType) {
      countQuery = countQuery.eq("event_type", eventType);
    }

    const { count } = await countQuery;

    // Get top cities
    const { data: topCities } = await db
      .from("city_broadcast_events")
      .select("city")
      .gte("created_at", cutoffIso)
      .eq("status", "completed");

    const cityCounts: Record<string, number> = {};
    for (const row of topCities || []) {
      cityCounts[row.city] = (cityCounts[row.city] || 0) + 1;
    }
    const topCitiesList = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cityName, eventCount]) => ({ city: cityName, events: eventCount }));

    return NextResponse.json({
      stats: {
        today: todayStats,
        week: weekStats,
        allTime: allTimeStats,
      },
      topCities: topCitiesList,
      events: events || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        days,
      },
    });
  } catch (err) {
    console.error("[admin/city-broadcasts] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface Stats {
  events: number;
  completed: number;
  skipped: number;
  providersSent: number;
  providersEligible: number;
  deliveryRate: number;
}

async function getStats(
  db: ReturnType<typeof getServiceClient>,
  since?: string
): Promise<Stats> {
  let query = db
    .from("city_broadcast_events")
    .select("status, providers_sent, providers_eligible");

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      events: 0,
      completed: 0,
      skipped: 0,
      providersSent: 0,
      providersEligible: 0,
      deliveryRate: 0,
    };
  }

  const events = data.length;
  const completed = data.filter((e) => e.status === "completed").length;
  const skipped = data.filter((e) => e.status === "skipped").length;
  const providersSent = data.reduce((sum, e) => sum + (e.providers_sent || 0), 0);
  const providersEligible = data.reduce((sum, e) => sum + (e.providers_eligible || 0), 0);
  const deliveryRate = providersEligible > 0 ? (providersSent / providersEligible) * 100 : 0;

  return {
    events,
    completed,
    skipped,
    providersSent,
    providersEligible,
    deliveryRate: Math.round(deliveryRate * 10) / 10,
  };
}
