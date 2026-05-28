import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const PAGE = "/caregiver-support/young-caregivers";

/**
 * GET /api/admin/young-caregivers/stats?days=30
 *
 * Returns engagement funnel stats for the Young Caregivers page.
 */
export async function GET(request: NextRequest) {
  const days = Number(request.nextUrl.searchParams.get("days") || "30");
  const db = getServiceDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // Count by event type — gracefully handle missing table
  const { data: events, error } = await db
    .from("page_events")
    .select("event_type, metadata, created_at")
    .eq("page", PAGE)
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: true });

  // Table doesn't exist yet (migration not applied) — return empty data
  if (error) {
    return NextResponse.json({
      days,
      funnel: { page_views: 0, scroll_25: 0, scroll_50: 0, scroll_75: 0, scroll_100: 0, discord_clicks: 0 },
      sections: {},
      time_on_page: { avg_seconds: 0, median_seconds: 0, sample_size: 0 },
      daily: { views: {}, clicks: {} },
      _note: "page_events table not found — run migration 082 in Supabase dashboard",
    });
  }

  const allEvents = events || [];

  // Funnel counts
  const pageViews = allEvents.filter((e) => e.event_type === "page_view").length;
  const discordClicks = allEvents.filter((e) => e.event_type === "discord_join_clicked").length;

  // Scroll depth milestones
  const scrollEvents = allEvents.filter((e) => e.event_type === "scroll_depth");
  const scrollDepth: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
  for (const e of scrollEvents) {
    const depth = (e.metadata as Record<string, unknown>)?.depth as number;
    if (depth && scrollDepth[depth] !== undefined) {
      scrollDepth[depth]++;
    }
  }

  // Section visibility
  const sectionEvents = allEvents.filter((e) => e.event_type === "section_visible");
  const sections: Record<string, number> = {};
  for (const e of sectionEvents) {
    const section = (e.metadata as Record<string, unknown>)?.section as string;
    if (section) {
      sections[section] = (sections[section] || 0) + 1;
    }
  }

  // Time on page stats
  const timeEvents = allEvents.filter((e) => e.event_type === "time_on_page");
  const times = timeEvents
    .map((e) => (e.metadata as Record<string, unknown>)?.seconds as number)
    .filter((t) => typeof t === "number" && t > 0);
  const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const medianTime = times.length > 0
    ? times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
    : 0;

  // Daily breakdown of page views + clicks
  const dailyViews: Record<string, number> = {};
  const dailyClicks: Record<string, number> = {};
  for (const e of allEvents) {
    const day = new Date(e.created_at).toISOString().split("T")[0];
    if (e.event_type === "page_view") {
      dailyViews[day] = (dailyViews[day] || 0) + 1;
    }
    if (e.event_type === "discord_join_clicked") {
      dailyClicks[day] = (dailyClicks[day] || 0) + 1;
    }
  }

  return NextResponse.json({
    days,
    funnel: {
      page_views: pageViews,
      scroll_25: scrollDepth[25],
      scroll_50: scrollDepth[50],
      scroll_75: scrollDepth[75],
      scroll_100: scrollDepth[100],
      discord_clicks: discordClicks,
    },
    sections,
    time_on_page: {
      avg_seconds: avgTime,
      median_seconds: medianTime,
      sample_size: times.length,
    },
    daily: { views: dailyViews, clicks: dailyClicks },
  });
}
