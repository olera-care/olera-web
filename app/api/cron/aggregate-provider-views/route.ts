import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { getProviderDimensionsByIdentifiers } from "@/lib/providers";

/**
 * GET /api/cron/aggregate-provider-views
 *
 * Runs nightly at 8 AM UTC (3 AM ET). Rolls up the prior UTC day's
 * page_view events from provider_activity into:
 *
 *   - provider_page_view_stats         (per-provider per-day)
 *   - city_category_view_benchmarks    (peer aggregates per cohort)
 *
 * Idempotent: re-running for the same date overwrites prior values.
 *
 * Query params (for manual ops):
 *   ?date=YYYY-MM-DD   re-aggregate a specific UTC date (default: yesterday)
 *   ?dry_run=true      compute but skip writes; returns counts
 *
 * Auth: Bearer ${CRON_SECRET} (Vercel injects automatically; manual ops
 * must set the header).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("aggregate-provider-views", async () => {
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dry_run") === "true";
  const dateOverride = searchParams.get("date");

  try {
    const db = getServiceClient();

    const targetDate = resolveTargetDate(dateOverride);
    const windowStart = new Date(`${targetDate}T00:00:00.000Z`);
    const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);

    // 1. Fetch yesterday's anonymous page_view events. We filter by the
    // session_id presence in JS rather than Postgrest because the JSONB
    // operator syntax is fiddly and the volume is tractable.
    const { data: events, error: eventsErr } = await db
      .from("provider_activity")
      .select("provider_id, metadata, created_at")
      .eq("event_type", "page_view")
      .gte("created_at", windowStart.toISOString())
      .lt("created_at", windowEnd.toISOString());

    if (eventsErr) {
      console.error("[aggregate-provider-views] Fetch events failed:", eventsErr);
      return NextResponse.json({ error: "Fetch events failed" }, { status: 500 });
    }

    const eventList = events ?? [];
    const eventCount = eventList.length;

    // 2. Group per provider, counting raw + distinct sessions.
    type Agg = { raw: number; sessions: Set<string> };
    const byProvider = new Map<string, Agg>();
    let skippedNoSession = 0;
    for (const ev of eventList) {
      const meta = ev.metadata as Record<string, unknown> | null;
      const sid = typeof meta?.session_id === "string" ? meta.session_id : null;
      if (!sid) {
        skippedNoSession += 1;
        continue;
      }
      const pid = String(ev.provider_id);
      const entry = byProvider.get(pid) ?? { raw: 0, sessions: new Set<string>() };
      entry.raw += 1;
      entry.sessions.add(sid);
      byProvider.set(pid, entry);
    }

    // 3. Bulk-fetch city/state/category for these providers.
    const providerIds = [...byProvider.keys()];
    const dimensions = await getProviderDimensionsByIdentifiers(providerIds, db);

    // 4. Build the per-provider rows.
    const statsRows = [...byProvider.entries()].map(([providerId, agg]) => {
      const dims = dimensions.get(providerId) ?? {
        city: null,
        state: null,
        category: null,
      };
      return {
        provider_id: providerId,
        date: targetDate,
        raw_view_count: agg.raw,
        unique_view_count: agg.sessions.size,
        city: dims.city,
        state: dims.state,
        category: dims.category,
        updated_at: new Date().toISOString(),
      };
    });

    // 5. Group per (city, state, category) and compute peer benchmarks.
    type CohortKey = string;
    const cohortViews = new Map<CohortKey, number[]>();
    for (const row of statsRows) {
      const key = cohortKey(row.city, row.state, row.category);
      const arr = cohortViews.get(key) ?? [];
      arr.push(row.unique_view_count);
      cohortViews.set(key, arr);
    }

    const benchmarkRows = [...cohortViews.entries()].map(([key, views]) => {
      const [city, state, category] = decodeCohortKey(key);
      const sum = views.reduce((a, b) => a + b, 0);
      const avg = views.length ? sum / views.length : 0;
      return {
        date: targetDate,
        city,
        state,
        category,
        avg_views: Math.round(avg * 100) / 100,
        p50_views: percentile(views, 0.5),
        p90_views: percentile(views, 0.9),
        provider_count: views.length,
      };
    });

    // 6. Write (or report dry-run).
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dry_run: true,
        target_date: targetDate,
        events_fetched: eventCount,
        events_skipped_no_session: skippedNoSession,
        provider_stats_rows: statsRows.length,
        benchmark_rows: benchmarkRows.length,
      });
    }

    let statsWritten = 0;
    let benchmarksWritten = 0;

    if (statsRows.length > 0) {
      const { error: statsErr } = await db
        .from("provider_page_view_stats")
        .upsert(statsRows, { onConflict: "provider_id,date" });
      if (statsErr) {
        console.error("[aggregate-provider-views] Upsert stats failed:", statsErr);
        return NextResponse.json({ error: "Upsert stats failed" }, { status: 500 });
      }
      statsWritten = statsRows.length;
    }

    if (benchmarkRows.length > 0) {
      const { error: benchErr } = await db
        .from("city_category_view_benchmarks")
        .upsert(benchmarkRows, { onConflict: "date,city,state,category" });
      if (benchErr) {
        console.error("[aggregate-provider-views] Upsert benchmarks failed:", benchErr);
        return NextResponse.json({ error: "Upsert benchmarks failed" }, { status: 500 });
      }
      benchmarksWritten = benchmarkRows.length;
    }

    console.log(
      `[aggregate-provider-views] date=${targetDate} events=${eventCount} skipped=${skippedNoSession} ` +
      `providers=${statsWritten} cohorts=${benchmarksWritten}`
    );

    return NextResponse.json({
      ok: true,
      target_date: targetDate,
      events_fetched: eventCount,
      events_skipped_no_session: skippedNoSession,
      provider_stats_rows: statsWritten,
      benchmark_rows: benchmarksWritten,
    });
  } catch (err) {
    console.error("[aggregate-provider-views] Threw:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  });
}

function resolveTargetDate(override: string | null): string {
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
    return override;
  }
  // Default: yesterday in UTC.
  const now = new Date();
  const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return y.toISOString().slice(0, 10);
}

function cohortKey(city: string | null, state: string | null, category: string | null): string {
  return `${city ?? ""}\x1f${state ?? ""}\x1f${category ?? ""}`;
}

function decodeCohortKey(key: string): [string, string, string] {
  const [city, state, category] = key.split("\x1f");
  return [city, state, category];
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[idx];
}
