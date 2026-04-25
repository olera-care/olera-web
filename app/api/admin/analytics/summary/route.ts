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

// Events counted as DISTINCT providers (not raw events) for the Providers
// section. Two of the buckets are sub-filters on one_click_access since
// those flows only differ by the email link they came from (action param):
//   one_click_access AND metadata.action='question'  → Q&A sign-ins
//   one_click_access AND metadata.action='lead'      → engaged with leads
//   claim_completed  AND metadata.source='page'      → page-flow claims
const PROVIDER_DISTINCT_EVENT_TYPES = [
  "one_click_access",
  "claim_completed",
  "question_responded",
  "analytics_teaser_cta_clicked",
] as const;

type ProviderEvent = (typeof PROVIDER_EVENT_TYPES)[number];
type SeekerEvent = (typeof SEEKER_EVENT_TYPES)[number];
type CountedEvent = ProviderEvent | SeekerEvent;

type WindowedCounts = Record<CountedEvent, number>;
type DistinctCounts = {
  qa_signins: number;
  page_claims: number;
  question_answerers: number;
  lead_engagers: number;
  teaser_clickers: number;
};
type WindowResult = {
  counts: WindowedCounts;
  unique_sessions_page_view: number;
  provider_distinct_counts: DistinctCounts;
};

const EMPTY_COUNTS = (): WindowedCounts => ({
  page_view: 0,
  search_click: 0,
  benefits_started: 0,
  lead_received: 0,
  review_received: 0,
  question_received: 0,
  benefits_completed: 0,
  matches_activated: 0,
});
const EMPTY_DISTINCT = (): DistinctCounts => ({
  qa_signins: 0,
  page_claims: 0,
  question_answerers: 0,
  lead_engagers: 0,
  teaser_clickers: 0,
});

/**
 * Pull all relevant events for one date window and bucket them into the
 * three count shapes (raw counts, unique sessions, distinct-provider counts).
 * `from`/`to` may be null — null means no bound on that side.
 */
async function fetchWindow(
  db: ReturnType<typeof getServiceClient>,
  from: string | null,
  to: string | null,
): Promise<WindowResult | { error: string }> {
  let providerQ = db
    .from("provider_activity")
    .select("event_type, metadata")
    .in("event_type", [...PROVIDER_EVENT_TYPES])
    .limit(50000);
  if (from) providerQ = providerQ.gte("created_at", from);
  if (to) providerQ = providerQ.lt("created_at", to);

  let seekerQ = db
    .from("seeker_activity")
    .select("event_type")
    .in("event_type", [...SEEKER_EVENT_TYPES])
    .limit(50000);
  if (from) seekerQ = seekerQ.gte("created_at", from);
  if (to) seekerQ = seekerQ.lt("created_at", to);

  let distinctQ = db
    .from("provider_activity")
    .select("provider_id, event_type, metadata")
    .in("event_type", [...PROVIDER_DISTINCT_EVENT_TYPES])
    .limit(50000);
  if (from) distinctQ = distinctQ.gte("created_at", from);
  if (to) distinctQ = distinctQ.lt("created_at", to);

  const [providerRes, seekerRes, distinctRes] = await Promise.all([
    providerQ,
    seekerQ,
    distinctQ,
  ]);

  if (providerRes.error) return { error: "provider window query failed" };
  if (seekerRes.error) return { error: "seeker window query failed" };
  if (distinctRes.error) return { error: "distinct window query failed" };

  const counts = EMPTY_COUNTS();
  const uniqueSessions = new Set<string>();
  for (const r of (providerRes.data ?? []) as Array<{
    event_type: string;
    metadata: Record<string, unknown> | null;
  }>) {
    if ((PROVIDER_EVENT_TYPES as readonly string[]).includes(r.event_type)) {
      counts[r.event_type as ProviderEvent] += 1;
    }
    if (r.event_type === "page_view") {
      const sid = r.metadata?.session_id;
      if (typeof sid === "string" && sid.length > 0) uniqueSessions.add(sid);
    }
  }
  for (const r of (seekerRes.data ?? []) as Array<{ event_type: string }>) {
    if ((SEEKER_EVENT_TYPES as readonly string[]).includes(r.event_type)) {
      counts[r.event_type as SeekerEvent] += 1;
    }
  }

  const distinct = EMPTY_DISTINCT();
  const sets = {
    qa_signins: new Set<string>(),
    page_claims: new Set<string>(),
    question_answerers: new Set<string>(),
    lead_engagers: new Set<string>(),
    teaser_clickers: new Set<string>(),
  };
  for (const r of (distinctRes.data ?? []) as Array<{
    provider_id: string | null;
    event_type: string;
    metadata: Record<string, unknown> | null;
  }>) {
    const pid = r.provider_id;
    if (!pid) continue;
    if (r.event_type === "one_click_access") {
      const action = r.metadata?.action;
      if (action === "question") sets.qa_signins.add(pid);
      else if (action === "lead") sets.lead_engagers.add(pid);
    } else if (r.event_type === "claim_completed") {
      if (r.metadata?.source === "page") sets.page_claims.add(pid);
    } else if (r.event_type === "question_responded") {
      sets.question_answerers.add(pid);
    } else if (r.event_type === "analytics_teaser_cta_clicked") {
      sets.teaser_clickers.add(pid);
    }
  }
  distinct.qa_signins = sets.qa_signins.size;
  distinct.page_claims = sets.page_claims.size;
  distinct.question_answerers = sets.question_answerers.size;
  distinct.lead_engagers = sets.lead_engagers.size;
  distinct.teaser_clickers = sets.teaser_clickers.size;

  return {
    counts,
    unique_sessions_page_view: uniqueSessions.size,
    provider_distinct_counts: distinct,
  };
}

/**
 * Pick the single most notable insight for the natural-language strip at
 * the top of the page. Looks across all metrics for the biggest swing
 * (absolute % change) and surfaces it. If nothing moved >= 25%, returns
 * a quieter "no major shifts" line so the strip never looks broken.
 *
 * Server-side so we can iterate the framing in one place without touching
 * the client.
 */
function pickInsight(
  current: WindowResult,
  prior: WindowResult,
  rangeLabel: string,
): string | null {
  type Candidate = { label: string; cur: number; prev: number; delta: number };
  const candidates: Candidate[] = [
    { label: "page views", cur: current.counts.page_view, prev: prior.counts.page_view, delta: 0 },
    { label: "unique sessions", cur: current.unique_sessions_page_view, prev: prior.unique_sessions_page_view, delta: 0 },
    { label: "card clicks", cur: current.counts.search_click, prev: prior.counts.search_click, delta: 0 },
    { label: "questions", cur: current.counts.question_received, prev: prior.counts.question_received, delta: 0 },
    { label: "leads", cur: current.counts.lead_received, prev: prior.counts.lead_received, delta: 0 },
    { label: "reviews", cur: current.counts.review_received, prev: prior.counts.review_received, delta: 0 },
    { label: "benefits intakes started", cur: current.counts.benefits_started, prev: prior.counts.benefits_started, delta: 0 },
    { label: "benefits intakes finished", cur: current.counts.benefits_completed, prev: prior.counts.benefits_completed, delta: 0 },
    { label: "providers signing in from Q&A", cur: current.provider_distinct_counts.qa_signins, prev: prior.provider_distinct_counts.qa_signins, delta: 0 },
    { label: "providers answering questions", cur: current.provider_distinct_counts.question_answerers, prev: prior.provider_distinct_counts.question_answerers, delta: 0 },
  ];
  for (const c of candidates) {
    if (c.prev === 0 && c.cur === 0) {
      c.delta = 0;
    } else if (c.prev === 0) {
      c.delta = Number.POSITIVE_INFINITY;
    } else {
      c.delta = ((c.cur - c.prev) / c.prev) * 100;
    }
  }
  const sorted = candidates
    .filter((c) => c.cur >= 5 || c.prev >= 5) // ignore noisy low-base swings
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const top = sorted[0];
  if (!top) return null;
  if (Math.abs(top.delta) < 25) {
    return `No major shifts ${rangeLabel.toLowerCase()} — platform looks stable.`;
  }
  const dir = top.delta >= 0 ? "up" : "down";
  const pctRaw = Math.abs(top.delta);
  const pct = Number.isFinite(pctRaw) ? `${Math.round(pctRaw)}%` : "from zero";
  return `${capitalize(top.label)} ${dir} ${pct} ${rangeLabel.toLowerCase()} (${top.cur.toLocaleString()} vs ${top.prev.toLocaleString()} prior).`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * GET /api/admin/analytics/summary
 *
 * Powers everything on /admin/analytics that ISN'T the pulse chart (the
 * chart has its own /views/stats endpoint).
 *
 * Query params:
 *   date_from (ISO, inclusive). Omit for all-time (no lower bound).
 *   date_to   (ISO, exclusive). Omit for "up to now" (no upper bound).
 *   range_label (free text, optional). Used inside the natural-language
 *               insight string for nicer copy ("this week" vs "this period").
 *
 * Returns:
 *   - windowed:    counts + distinct counts for the current window
 *   - prior:       same shape, computed for the equivalent prior window
 *                  (same length, immediately before windowFrom). Powers
 *                  per-tile delta lines on the page. Null when no
 *                  windowFrom (all-time can't have a prior).
 *   - insight:     single-sentence summary highlighting the biggest mover
 *   - botRejects:  today's in-memory bot reject count + UTC date label
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
    const rangeLabel = searchParams.get("range_label") || "this period";

    const db = getServiceClient();

    // Compute the prior window of equal length. Only meaningful when we
    // have a windowFrom (otherwise "prior to all-time" is undefined).
    let priorFrom: string | null = null;
    let priorTo: string | null = null;
    if (windowFrom) {
      const fromMs = new Date(windowFrom).getTime();
      const toMs = windowTo ? new Date(windowTo).getTime() : Date.now();
      const length = toMs - fromMs;
      if (length > 0) {
        priorFrom = new Date(fromMs - length).toISOString();
        priorTo = windowFrom;
      }
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [windowedRes, priorRes, last7dViewsRes, latestRes] = await Promise.all([
      fetchWindow(db, windowFrom, windowTo),
      priorFrom ? fetchWindow(db, priorFrom, priorTo) : Promise.resolve(null),
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

    if ("error" in windowedRes) {
      console.error("[admin/analytics/summary] windowed fetch failed:", windowedRes.error);
      return NextResponse.json({ error: "Failed to load windowed counts" }, { status: 500 });
    }
    if (priorRes && "error" in priorRes) {
      console.error("[admin/analytics/summary] prior fetch failed:", priorRes.error);
      // Non-fatal — page renders without deltas.
    }
    if (last7dViewsRes.error) {
      console.error("[admin/analytics/summary] 7d views query failed:", last7dViewsRes.error);
      return NextResponse.json({ error: "Failed to load top providers" }, { status: 500 });
    }
    if (latestRes.error) {
      console.error("[admin/analytics/summary] latest rows query failed:", latestRes.error);
      return NextResponse.json({ error: "Failed to load latest events" }, { status: 500 });
    }

    const prior: WindowResult | null = priorRes && !("error" in priorRes) ? priorRes : null;

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
    const topProviderIds = [...byProvider.values()]
      .sort((a, b) => b.raw - a.raw)
      .slice(0, 10);

    // Display-name lookup for the top-providers table — slugs alone aren't
    // human-readable. Best-effort; fall back to slug if the lookup fails.
    const slugs = topProviderIds.map((p) => p.provider_id);
    const nameBySlug = new Map<string, string>();
    if (slugs.length > 0) {
      const { data: nameRows } = await db
        .from("olera-providers")
        .select("slug, provider_name")
        .in("slug", slugs);
      if (nameRows) {
        for (const n of nameRows as Array<{ slug: string; provider_name: string | null }>) {
          if (n.slug && n.provider_name) nameBySlug.set(n.slug, n.provider_name);
        }
      }
    }

    const topProviders = topProviderIds.map((p) => ({
      provider_id: p.provider_id,
      provider_name: nameBySlug.get(p.provider_id) ?? null,
      raw_views_7d: p.raw,
      unique_sessions_7d: p.sessions.size,
      last_seen: p.lastSeen,
    }));

    const insight = prior ? pickInsight(windowedRes, prior, rangeLabel) : null;

    const botRejects = getBotRejectsToday();

    return NextResponse.json({
      windowed: {
        range: { from: windowFrom, to: windowTo },
        counts: windowedRes.counts,
        unique_sessions_page_view: windowedRes.unique_sessions_page_view,
        provider_distinct_counts: windowedRes.provider_distinct_counts,
      },
      prior: prior
        ? {
            counts: prior.counts,
            unique_sessions_page_view: prior.unique_sessions_page_view,
            provider_distinct_counts: prior.provider_distinct_counts,
          }
        : null,
      insight,
      botRejects,
      topProviders,
      latestEvents: latestRes.data ?? [],
    });
  } catch (err) {
    console.error("[admin/analytics/summary] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
