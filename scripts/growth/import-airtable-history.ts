#!/usr/bin/env npx tsx

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import { addDays } from "../../lib/growth/dates";

config({ path: ".env.local", quiet: true });

const csvPath = process.argv[2];
if (!csvPath) {
  process.stderr.write("Usage: npm run metrics:import-airtable -- /absolute/path/to/airtable.csv [--dry-run]\n");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

type CsvRow = Record<string, string>;
const rows = parse(readFileSync(resolve(csvPath), "utf8"), {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true,
}) as CsvRow[];

function normalized(row: CsvRow) {
  return Object.fromEntries(Object.entries(row).map(([header, value]) => [header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(), value]));
}

function first(row: Record<string, string>, names: string[]) {
  for (const name of names) if (row[name] !== undefined && row[name] !== "") return row[name];
  return null;
}

function numeric(row: Record<string, string>, names: string[]) {
  const raw = first(row, names);
  if (raw == null) return null;
  const value = Number(raw.replace(/[,%$]/g, ""));
  return Number.isFinite(value) ? value : null;
}

function isoDate(value: string | null) {
  if (!value) return null;
  const direct = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  if (direct) return direct;
  const parts = value.split("/").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [month, day, rawYear] = parts;
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

async function main() {
  let inserted = 0;
  let skipped = 0;
  for (const original of rows) {
    const row = normalized(original);
    const weekStart = isoDate(first(row, ["start date", "week start", "date week"]));
    const weekEnd = isoDate(first(row, ["end date", "week end"])) || (weekStart ? addDays(weekStart, 6) : null);
    const totalUsers = numeric(row, ["total website visitors", "total visitors", "website visitors"]);
    if (!weekStart || !weekEnd || totalUsers == null) {
      process.stderr.write("Skipping an Airtable row without a usable start date, end date, or total visitors.\n");
      skipped += 1;
      continue;
    }

    const organicUsers = numeric(row, ["visitors by organic search", "organic search", "organic visitors"]);
    const inquiries = numeric(row, ["of organic leads", "organic leads", "weekly leads"]);
    const questions = numeric(row, ["of questions", "questions asked", "questions"]);
    const channels = {
      "Organic Search": organicUsers,
      Direct: numeric(row, ["visitors by direct", "direct"]),
      "Paid Social": numeric(row, ["paid social", "visitors by paid social"]),
      "Organic Social": numeric(row, ["visitors by organic social", "organic social"]),
      Display: numeric(row, ["users acquired by display", "display"]),
      Referral: numeric(row, ["referral"]),
      "Paid Other": numeric(row, ["paid other"]),
    };
    const payload = {
      week_start: weekStart,
      week_end: weekEnd,
      reporting_timezone: "America/Chicago",
      source: "airtable_legacy",
      definition_version: 1,
      ga4: {
        overview: {
          total_users: totalUsers,
          new_users: null,
          sessions: null,
          average_session_duration_seconds: numeric(row, ["avg engagement time", "avg engagement"]),
          engagement_rate: null,
          page_views: null,
        },
        channels,
      },
      gsc: null,
      marketplace: {
        inquiries,
        questions_asked: questions,
        benefits_completed: null,
        providers_answering_questions: null,
        organic_users_to_inquiry_rate_directional: inquiries != null && organicUsers ? inquiries / organicUsers : null,
      },
      source_status: { ga4: "airtable_legacy", gsc: "unavailable", supabase: "airtable_legacy" },
      anomalies: [],
      collected_at: new Date().toISOString(),
      legacy: {
        indexed_pages: numeric(row, ["of indexed pages", "indexed pages"]),
        providers_registered: numeric(row, ["providers registered"]),
        original: original,
      },
    };

    if (dryRun) {
      process.stdout.write(`${weekStart}: ${totalUsers} visitors\n`);
      continue;
    }
    const { error } = await db.from("growth_metric_snapshots").insert(payload);
    if (error?.code === "23505") {
      skipped += 1;
      continue;
    }
    if (error) throw new Error(`Import failed for ${weekStart}: ${error.message}`);
    inserted += 1;
  }
  process.stdout.write(dryRun ? `Validated ${rows.length - skipped} rows; skipped ${skipped}.\n` : `Imported ${inserted} legacy weeks; skipped ${skipped} duplicates or invalid rows.\n`);
}

main().catch((error) => {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
