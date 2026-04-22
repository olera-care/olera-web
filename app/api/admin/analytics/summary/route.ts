import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getBotRejectsToday } from "@/lib/analytics/bot-filter";

const TRACKED_EVENT_TYPES = [
  "page_view",
  "search_click",
  "cta_click_public",
  "lead_received",
  "review_received",
  "question_received",
] as const;

type EventType = (typeof TRACKED_EVENT_TYPES)[number];

/**
 * GET /api/admin/analytics/summary
 *
 * Single endpoint that powers everything on /admin/analytics that ISN'T the
 * pulse chart (the chart has its own /views/stats endpoint).
 *
 * Returns:
 *   - last24h:    counts of each tracked event type in the past 24h
 *   - botRejects: today's in-memory bot reject count + UTC date label
 *   - topProviders: top 10 providers by 7-day raw page_views (with unique sessions)
 *   - latestEvents: 50 most recent rows from provider_activity
 *
 * NOTE: botRejects is per-Vercel-lambda-instance (in-memory). Numbers will
 * undercount across regions; acceptable for Phase 0 sanity-check. Phase 1
 * may promote to a KV-backed counter.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [last24hRes, last7dViewsRes, latestRes] = await Promise.all([
      // Pull a wide sweep for the 24h window so we can bucket by event_type
      // in memory (cheaper than 6 separate queries).
      db
        .from("provider_activity")
        .select("*")
        .gte("created_at", oneDayAgo)
        .in("event_type", [...TRACKED_EVENT_TYPES])
        .limit(50000),
      // Top providers: 7d page_views only, anonymous (session_id present).
      db
        .from("provider_activity")
        .select("*")
        .eq("event_type", "page_view")
        .gte("created_at", sevenDaysAgo)
        .limit(50000),
      // Latest rows table — broad fetch, all event types.
      db
        .from("provider_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (last24hRes.error) {
      console.error("[admin/analytics/summary] last24h query failed:", last24hRes.error);
      return NextResponse.json({ error: "Failed to load 24h counts" }, { status: 500 });
    }
    if (last7dViewsRes.error) {
      console.error("[admin/analytics/summary] 7d views query failed:", last7dViewsRes.error);
      return NextResponse.json({ error: "Failed to load top providers" }, { status: 500 });
    }
    if (latestRes.error) {
      console.error("[admin/analytics/summary] latest rows query failed:", latestRes.error);
      return NextResponse.json({ error: "Failed to load latest events" }, { status: 500 });
    }

    // 24h counts per event type, plus unique session count for page_views.
    const last24hRows = (last24hRes.data ?? []) as Array<{
      event_type: string;
      metadata: Record<string, unknown> | null;
    }>;
    const counts: Record<EventType, number> = {
      page_view: 0,
      search_click: 0,
      cta_click_public: 0,
      lead_received: 0,
      review_received: 0,
      question_received: 0,
    };
    const uniqueSessions24h = new Set<string>();
    for (const r of last24hRows) {
      if ((TRACKED_EVENT_TYPES as readonly string[]).includes(r.event_type)) {
        counts[r.event_type as EventType] += 1;
      }
      if (r.event_type === "page_view") {
        const sid = r.metadata?.session_id;
        if (typeof sid === "string" && sid.length > 0) uniqueSessions24h.add(sid);
      }
    }

    // Top providers by 7d raw page_views (anonymous events only).
    const last7dViews = (last7dViewsRes.data ?? []) as Array<{
      provider_id: string;
      created_at: string;
      metadata: Record<string, unknown> | null;
    }>;
    type ProviderAgg = {
      provider_id: string;
      raw: number;
      sessions: Set<string>;
      lastSeen: string;
    };
    const byProvider = new Map<string, ProviderAgg>();
    for (const r of last7dViews) {
      const sid = r.metadata?.session_id;
      if (typeof sid !== "string" || !sid) continue;
      const pid = String(r.provider_id);
      const entry = byProvider.get(pid) ?? {
        provider_id: pid,
        raw: 0,
        sessions: new Set<string>(),
        lastSeen: r.created_at,
      };
      entry.raw += 1;
      entry.sessions.add(sid);
      if (r.created_at > entry.lastSeen) entry.lastSeen = r.created_at;
      byProvider.set(pid, entry);
    }
    const topProviders = [...byProvider.values()]
      .sort((a, b) => b.raw - a.raw)
      .slice(0, 10)
      .map((p) => ({
        provider_id: p.provider_id,
        raw_views_7d: p.raw,
        unique_sessions_7d: p.sessions.size,
        last_seen: p.lastSeen,
      }));

    const botRejects = getBotRejectsToday();

    return NextResponse.json({
      last24h: {
        counts,
        unique_sessions_page_view: uniqueSessions24h.size,
      },
      botRejects,
      topProviders,
      latestEvents: latestRes.data ?? [],
    });
  } catch (err) {
    console.error("[admin/analytics/summary] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
