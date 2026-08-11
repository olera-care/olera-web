#!/usr/bin/env npx tsx

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { addDays, mostRecentCompleteWeek, validateCompleteWeek } from "../../lib/growth/dates";
import { collectGrowthSnapshot } from "../../lib/growth/collector.server";
import { saveGrowthSnapshot } from "../../lib/growth/store.server";
import type { GrowthSnapshot } from "../../lib/growth/types";

function arg(name: string): string | null {
  const exact = process.argv.indexOf(name);
  if (exact >= 0) return process.argv[exact + 1] || null;
  const prefixed = process.argv.find((value) => value.startsWith(`${name}=`));
  return prefixed ? prefixed.slice(name.length + 1) : null;
}

const has = (name: string) => process.argv.includes(name);

config({ path: arg("--env-file") || ".env.local", quiet: true });
const credentialsPath = arg("--credentials");
if (credentialsPath) process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function percent(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null || previous === 0) return null;
  return (current - previous) / previous;
}

function change(value: number | null) {
  return value == null ? "no comparison" : `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function report(current: GrowthSnapshot, previous: GrowthSnapshot | null): string {
  const lines = [
    `# Olera growth: ${current.week_start} to ${current.week_end}`,
    "",
    `Collected ${current.collected_at} from GA4, ${current.gsc ? "Search Console" : "GSC skipped"}, and Supabase.`,
    "",
    "| Metric | Current | Week over week |",
    "|---|---:|---:|",
    `| Total users | ${current.ga4.overview.total_users.toLocaleString()} | ${change(percent(current.ga4.overview.total_users, previous?.ga4.overview.total_users))} |`,
    `| Organic Search users | ${(current.ga4.channels["Organic Search"] || 0).toLocaleString()} | ${change(percent(current.ga4.channels["Organic Search"], previous?.ga4.channels["Organic Search"]))} |`,
    `| Search clicks | ${current.gsc?.performance.clicks.toLocaleString() ?? "Unavailable"} | ${change(percent(current.gsc?.performance.clicks, previous?.gsc?.performance.clicks))} |`,
    `| Search impressions | ${current.gsc?.performance.impressions.toLocaleString() ?? "Unavailable"} | ${change(percent(current.gsc?.performance.impressions, previous?.gsc?.performance.impressions))} |`,
    `| Inquiries | ${current.marketplace.inquiries.toLocaleString()} | ${change(percent(current.marketplace.inquiries, previous?.marketplace.inquiries))} |`,
    `| Questions asked | ${current.marketplace.questions_asked.toLocaleString()} | ${change(percent(current.marketplace.questions_asked, previous?.marketplace.questions_asked))} |`,
    `| Benefits completed | ${current.marketplace.benefits_completed.toLocaleString()} | ${change(percent(current.marketplace.benefits_completed, previous?.marketplace.benefits_completed))} |`,
    `| Providers answering | ${current.marketplace.providers_answering_questions.toLocaleString()} | ${change(percent(current.marketplace.providers_answering_questions, previous?.marketplace.providers_answering_questions))} |`,
    "",
    current.marketplace.organic_users_to_inquiry_rate_directional == null
      ? "Organic users to inquiry: unavailable"
      : `Organic users to inquiry (directional): ${(current.marketplace.organic_users_to_inquiry_rate_directional * 100).toFixed(2)}%`,
  ];
  if (current.anomalies.length) {
    lines.push("", "## Investigation prompts", "", ...current.anomalies.map((item) => `- ${item.label}: ${change(item.change)} week over week.`));
  }
  return lines.join("\n");
}

async function collectOne(db: ReturnType<typeof database>, weekStart: string, weekEnd: string) {
  validateCompleteWeek(weekStart, weekEnd);
  process.stderr.write(`Collecting ${weekStart} to ${weekEnd}...\n`);
  const snapshot = await collectGrowthSnapshot({ weekStart, weekEnd, ga4Only: has("--ga4-only"), db });
  if (has("--dry-run")) return snapshot;
  return saveGrowthSnapshot(db, snapshot, has("--force"));
}

async function main() {
  const db = database();
  const explicitStart = arg("--week-start");
  const explicitEnd = arg("--week-end");
  if (Boolean(explicitStart) !== Boolean(explicitEnd)) throw new Error("Provide both --week-start and --week-end.");

  if (has("--backfill")) {
    const latest = mostRecentCompleteWeek();
    const { data, error } = await db
      .from("growth_metric_snapshots")
      .select("*")
      .order("week_start", { ascending: true })
      .limit(1_000);
    if (error) throw new Error(`Could not read growth history: ${error.message}`);
    const fallback = arg("--from");
    const existingRows = (data || []) as GrowthSnapshot[];
    if (!existingRows.length && !fallback) throw new Error("The first backfill needs --from YYYY-MM-DD.");
    const existingByWeek = new Map(existingRows.map((row) => [row.week_start, row]));
    let start = fallback || existingRows[0].week_start;
    let previous: GrowthSnapshot | null = null;
    while (start <= latest.weekStart) {
      const existing = existingByWeek.get(start);
      if (existing) {
        previous = existing;
      } else {
        const saved = await collectOne(db, start, addDays(start, 6));
        process.stdout.write(`${report(saved, previous)}\n\n`);
        previous = saved;
      }
      start = addDays(start, 7);
    }
    return;
  }

  const bounds = explicitStart && explicitEnd
    ? { weekStart: explicitStart, weekEnd: explicitEnd }
    : mostRecentCompleteWeek();
  const { data: previous } = await db
    .from("growth_metric_snapshots")
    .select("*")
    .lt("week_start", bounds.weekStart)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  const saved = await collectOne(db, bounds.weekStart, bounds.weekEnd);
  process.stdout.write(`${report(saved, previous as GrowthSnapshot | null)}\n`);
}

main().catch((error) => {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
