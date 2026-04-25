import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getBotRejectsToday } from "@/lib/analytics/bot-filter";

const PROVIDER_EVENT_TYPES = [
  "page_view",
  "search_click",
  "benefits_started",
  "lead_received",
  "review_received",
  "question_received",
] as const;

const SEEKER_EVENT_TYPES = [
  "benefits_completed",
  "matches_activated",
] as const;

type ProviderEvent = (typeof PROVIDER_EVENT_TYPES)[number];
type SeekerEvent = (typeof SEEKER_EVENT_TYPES)[number];
type CountedEvent = ProviderEvent | SeekerEvent;

/**
 * GET /api/admin/analytics/summary
 *
 * Powers everything on /admin/analytics that ISN'T the pulse chart (the
 * chart has its own /views/stats endpoint).
 *
 * Query params:
 *   date_from (ISO, inclusive). Omit for all-time (no lower bound).
 *   date_to   (ISO, exclusive). Omit for "up to now" (no upper bound).
 *
 * Returns:
 *   - windowed:  counts of each tracked event type within the range,
 *                pulled from BOTH provider_activity and seeker_activity
 *   - botRejects: today's in-memory bot reject count + UTC date label
 *   - topProviders: top 10 providers by 7-day raw page_views (fixed window —
 *                   this card has its own semantics, not range-bound)
 *   - latestEvents: 50 most recent rows from provider_activity (fixed)
 *
 * NOTE: botRejects is per-Vercel-lambda-instance (in-memory). Numbers will
 * undercount across regions; acceptable for Phase 0 sanity-check.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const windowFrom = searchParams.get("date_from");
    const windowTo = searchParams.get("date_to");

    const db = getServiceClient();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let providerWindowedQuery = db
      .from("provider_activity")
      .select("event_type, metadata")
      .in("event_type", [...PROVIDER_EVENT_TYPES])
      .limit(50000);
    if (windowFrom) providerWindowedQuery = providerWindowedQuery.gte("created_at", windowFrom);
    if (windowTo) providerWindowedQuery = providerWindowedQuery.lt("created_at", windowTo);

    let seekerWindowedQuery = db
      .from("seeker_activity")
      .select("event_type")
      .in("event_type", [...SEEKER_EVENT_TYPES])
      .limit(50000);
    if (windowFrom) seekerWindowedQuery = seekerWindowedQuery.gte("created_at", windowFrom);
    if (windowTo) seekerWindowedQuery = seekerWindowedQuery.lt("created_at", windowTo);

    const [providerWindowedRes, seekerWindowedRes, last7dViewsRes, latestRes] = await Promise.all([
      providerWindowedQuery,
      seekerWindowedQuery,
      // Top providers: 7d page_views only, anonymous (session_id present).
      db
        .from("provider_activity")
        .select("provider_id, created_at, metadata")
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

    if (providerWindowedRes.error) {
      console.error("[admin/analytics/summary] provider windowed query failed:", providerWindowedRes.error);
      return NextResponse.json({ error: "Failed to load windowed counts" }, { status: 500 });
    }
    if (seekerWindowedRes.error) {
      console.error("[admin/analytics/summary] seeker windowed query failed:", seekerWindowedRes.error);
      return NextResponse.json({ error: "Failed to load family counts" }, { status: 500 });
    }
    if (last7dViewsRes.error) {
      console.error("[admin/analytics/summary] 7d views query failed:", last7dViewsRes.error);
      return NextResponse.json({ error: "Failed to load top providers" }, { status: 500 });
    }
    if (latestRes.error) {
      console.error("[admin/analytics/summary] latest rows query failed:", latestRes.error);
      return NextResponse.json({ error: "Failed to load latest events" }, { status: 500 });
    }

    const providerRows = (providerWindowedRes.data ?? []) as Array<{
      event_type: string;
      metadata: Record<string, unknown> | null;
    }>;
    const seekerRows = (seekerWindowedRes.data ?? []) as Array<{ event_type: string }>;

    const counts: Record<CountedEvent, number> = {
      page_view: 0,
      search_click: 0,
      benefits_started: 0,
      lead_received: 0,
      review_received: 0,
      question_received: 0,
      benefits_completed: 0,
      matches_activated: 0,
    };
    const uniqueSessions = new Set<string>();
    for (const r of providerRows) {
      if ((PROVIDER_EVENT_TYPES as readonly string[]).includes(r.event_type)) {
        counts[r.event_type as ProviderEvent] += 1;
      }
      if (r.event_type === "page_view") {
        const sid = r.metadata?.session_id;
        if (typeof sid === "string" && sid.length > 0) uniqueSessions.add(sid);
      }
    }
    for (const r of seekerRows) {
      if ((SEEKER_EVENT_TYPES as readonly string[]).includes(r.event_type)) {
        counts[r.event_type as SeekerEvent] += 1;
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
      windowed: {
        range: { from: windowFrom, to: windowTo },
        counts,
        unique_sessions_page_view: uniqueSessions.size,
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
