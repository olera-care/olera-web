#!/usr/bin/env npx tsx

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { collectGrowthPageMetrics } from "../../lib/growth/collector.server";
import { saveGrowthPageMetrics } from "../../lib/growth/store.server";

function arg(name: string): string | null {
  const exact = process.argv.indexOf(name);
  if (exact >= 0) return process.argv[exact + 1] || null;
  const prefixed = process.argv.find((value) => value.startsWith(`${name}=`));
  return prefixed ? prefixed.slice(name.length + 1) : null;
}

const has = (name: string) => process.argv.includes(name);
config({ path: arg("--env-file") || ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  const from = arg("--from");
  const to = arg("--to");
  let query = db
    .from("growth_metric_snapshots")
    .select("week_start, week_end")
    .eq("source", "google_supabase")
    .order("week_start", { ascending: true });
  if (from) query = query.gte("week_start", from);
  if (to) query = query.lte("week_start", to);
  const { data: weeks, error } = await query;
  if (error) throw new Error(`Could not read live growth weeks: ${error.message}`);
  if (!weeks?.length) throw new Error("No Google-backed growth weeks matched this range.");

  for (const week of weeks) {
    process.stderr.write(`Collecting page metrics for ${week.week_start}...\n`);
    const metrics = await collectGrowthPageMetrics(week.week_start, week.week_end, has("--ga4-only"));
    if (!has("--dry-run")) await saveGrowthPageMetrics(db, metrics, has("--force"));
    const categories = metrics.reduce<Record<string, number>>((counts, row) => {
      counts[row.page_category] = (counts[row.page_category] || 0) + 1;
      return counts;
    }, {});
    process.stdout.write(
      `${week.week_start}: ${metrics.length} categorized pages ` +
      `(${categories.provider || 0} provider, ${categories.benefit || 0} benefit, ${categories.editorial || 0} editorial)` +
      `${has("--dry-run") ? " (dry run)" : ""}\n`,
    );
  }
}

main().catch((error) => {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
