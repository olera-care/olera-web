import type { SupabaseClient } from "@supabase/supabase-js";
import type { GrowthAnomaly, GrowthPageMetric, GrowthSnapshot } from "./types";

function percentChange(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null || previous === 0) return null;
  return (current - previous) / previous;
}

function anomaliesFor(current: GrowthSnapshot, previous: GrowthSnapshot | null): GrowthAnomaly[] {
  if (!previous) return [];
  const checks = [
    ["total_users", "Total users", current.ga4.overview.total_users, previous.ga4.overview.total_users, 0.2],
    ["organic_search_users", "Organic Search users", current.ga4.channels["Organic Search"], previous.ga4.channels["Organic Search"], 0.15],
    ["search_clicks", "Search clicks", current.gsc?.performance.clicks, previous.gsc?.performance.clicks, 0.2],
    ["inquiries", "Inquiries", current.marketplace.inquiries, previous.marketplace.inquiries, 0.25],
  ] as const;
  return checks.flatMap(([metric, label, value, prior, threshold]) => {
    const change = percentChange(value, prior);
    if (change == null || Math.abs(change) < threshold) return [];
    if (metric === "inquiries" && Math.min(value || 0, prior || 0) < 10) return [];
    return [{ metric, label, change, threshold }];
  });
}

export async function saveGrowthSnapshot(db: SupabaseClient, snapshot: GrowthSnapshot, force = false) {
  const { data: previousRow, error: previousError } = await db
    .from("growth_metric_snapshots")
    .select("*")
    .lt("week_start", snapshot.week_start)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousError) throw new Error(`Could not read the previous growth week: ${previousError.message}`);

  const enriched = { ...snapshot, anomalies: anomaliesFor(snapshot, previousRow as GrowthSnapshot | null) };
  const query = force
    ? db.from("growth_metric_snapshots").upsert(enriched, { onConflict: "week_start" })
    : db.from("growth_metric_snapshots").insert(enriched);
  const { data, error } = await query.select("*").single();
  if (error) {
    if (error.code === "23505") {
      throw new Error(`Growth week ${snapshot.week_start} already exists. Historical weeks are immutable; pass --force only for an intentional correction.`);
    }
    throw new Error(`Could not save growth week: ${error.message}`);
  }
  return data as GrowthSnapshot;
}

export async function saveGrowthPageMetrics(
  db: SupabaseClient,
  metrics: GrowthPageMetric[],
  force = false,
) {
  if (!metrics.length) return [];
  const weekStart = metrics[0].week_start;
  if (metrics.some((row) => row.week_start !== weekStart)) {
    throw new Error("Page metrics must contain exactly one reporting week.");
  }
  if (force) {
    const { error } = await db.from("growth_page_metrics").delete().eq("week_start", weekStart);
    if (error) throw new Error(`Could not replace page metrics for ${weekStart}: ${error.message}`);
  }

  // One insert statement keeps the page set all-or-nothing. The materiality
  // floor in the collector keeps the weekly payload comfortably bounded.
  const { error } = await db.from("growth_page_metrics").insert(metrics);
  if (error) throw new Error(`Could not save page metrics for ${weekStart}: ${error.message}`);
  return metrics;
}
