#!/usr/bin/env tsx
/**
 * Pre-send email verification batch.
 *
 * Verifies a set of addresses against the configured provider (ZeroBounce) and
 * caches the verdicts in the email_verifications table. Once cached, sendEmail()
 * automatically suppresses any address verified 'invalid' — so running this
 * before launching an outreach campaign (or periodically over the provider
 * directory) stops bad addresses from ever bouncing.
 *
 * Requires ZEROBOUNCE_API_KEY in .env.local. Without it, verifyAndCache returns
 * 'unknown' and nothing is cached (no-op).
 *
 * Cost note: each new verification is a paid API call (~$0.004). Cached
 * verdicts fresher than --max-age-days are reused for free. Verify deliberately,
 * not on every run.
 *
 * Usage (run from the repo root that has .env.local):
 *   npx tsx scripts/verify-emails.ts --emails a@x.com,b@y.com
 *   npx tsx scripts/verify-emails.ts --file ./list.txt          # newline-separated
 *   npx tsx scripts/verify-emails.ts --email-type question_received --days 30
 *   npx tsx scripts/verify-emails.ts --email-type student_outreach --days 60 --concurrency 5
 *
 * Flags:
 *   --emails <csv>       explicit comma-separated addresses
 *   --file <path>        newline-separated addresses
 *   --email-type <type>  pull distinct recipients of this email_type from email_log
 *   --days <n>           lookback for --email-type (default 90)
 *   --concurrency <n>    parallel verifications (default 5)
 *   --max-age-days <n>   reuse cached verdicts younger than this (default 90)
 *   --apply              actually verify + cache. Without it, prints the target list and exits (dry run).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { verifyAndCache, type VerificationStatus } from "../lib/email-verification";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const apply = process.argv.includes("--apply");
const concurrency = parseInt(arg("--concurrency") || "5", 10);
const maxAgeDays = parseInt(arg("--max-age-days") || "90", 10);
const lookbackDays = parseInt(arg("--days") || "90", 10);

function normalize(e: string): string {
  return e.trim().toLowerCase();
}

async function collectTargets(): Promise<string[]> {
  const set = new Set<string>();

  const csv = arg("--emails");
  if (csv) csv.split(",").forEach((e) => e.trim() && set.add(normalize(e)));

  const file = arg("--file");
  if (file) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line) => line.trim() && set.add(normalize(line)));
  }

  const emailType = arg("--email-type");
  if (emailType) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
      process.exit(1);
    }
    const db = createClient(url, key);
    const since = new Date(Date.now() - lookbackDays * 86400000).toISOString();
    let from = 0;
    const PAGE = 1000;
    for (;;) {
      const { data, error } = await db
        .from("email_log")
        .select("recipient")
        .eq("email_type", emailType)
        .gte("created_at", since)
        .range(from, from + PAGE - 1);
      if (error) {
        console.error("email_log query failed:", error.message);
        process.exit(1);
      }
      if (!data || data.length === 0) break;
      for (const r of data) {
        // recipient may be a comma-joined list for multi-recipient sends
        String(r.recipient || "")
          .split(",")
          .forEach((e) => e.trim() && set.add(normalize(e)));
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }
  }

  return [...set];
}

async function runPool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let idx = 0;
  const workers = Array.from({ length: Math.max(1, n) }, async () => {
    while (idx < items.length) {
      const cur = items[idx++];
      await fn(cur);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const targets = await collectTargets();
  if (targets.length === 0) {
    console.log("No targets. Pass --emails, --file, or --email-type. See header for usage.");
    process.exit(0);
  }

  console.log(`Targets: ${targets.length} address(es). Provider: ${process.env.EMAIL_VERIFY_PROVIDER || "zerobounce"}.`);
  if (!process.env.ZEROBOUNCE_API_KEY) {
    console.log("⚠ ZEROBOUNCE_API_KEY not set — all results will be 'unknown' and nothing is cached.");
  }
  if (!apply) {
    console.log("\nDRY RUN (no verification, no writes). Re-run with --apply to verify + cache.\n");
    targets.slice(0, 20).forEach((e) => console.log("  " + e));
    if (targets.length > 20) console.log(`  … and ${targets.length - 20} more`);
    process.exit(0);
  }

  const tally: Record<VerificationStatus, number> = { valid: 0, invalid: 0, risky: 0, unknown: 0 };
  let done = 0;
  await runPool(targets, concurrency, async (email) => {
    const res = await verifyAndCache(email, maxAgeDays);
    tally[res.status]++;
    done++;
    if (done % 100 === 0) console.log(`  …${done}/${targets.length}`);
  });

  console.log("\n=== Verification summary ===");
  console.log(`  valid:   ${tally.valid}`);
  console.log(`  invalid: ${tally.invalid}   ← will now be suppressed at send`);
  console.log(`  risky:   ${tally.risky}   (catch-all; still sent)`);
  console.log(`  unknown: ${tally.unknown}   (not cached; re-checkable)`);
  console.log(`  total:   ${targets.length}`);
}

main().then(() => process.exit(0));
