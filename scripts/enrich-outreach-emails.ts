#!/usr/bin/env tsx
/**
 * Email enrichment for MedJobs provider outreach.
 *
 * Closes the documented gap: the city pipeline never had an email finder. This
 * runs the scrape-first waterfall (lib/medjobs/outreach-enrichment.ts) over
 * providers missing an email, verifies each hit through ZeroBounce
 * (lib/email-verification.ts), and writes only deliverable addresses.
 *
 * Two modes:
 *   --city "<City>" <ST>   DIRECTORY run over olera-providers (writes olera-providers.email).
 *                          Pre-enriches the directory so providers carry an email
 *                          BEFORE they're materialized into the CRM.
 *   --outreach             OUTREACH run over student_outreach kind='provider' rows
 *                          missing general_contact.email (writes research_data.general_contact.email).
 *
 * Dry-run by DEFAULT — prints the target list + cost ceiling and exits. Pass
 * --apply to run the waterfall and write.
 *
 * Usage (run from a checkout with .env.local + node_modules):
 *   npx tsx scripts/enrich-outreach-emails.ts --city "College Station" TX
 *   npx tsx scripts/enrich-outreach-emails.ts --city "College Station" TX --apply --limit 25
 *   npx tsx scripts/enrich-outreach-emails.ts --outreach --apply
 *
 * Flags:
 *   --city "<City>" <ST>  directory-mode target (two positionals follow the flag)
 *   --outreach            outreach-mode (mutually exclusive with --city)
 *   --apply               run + write. Without it: dry-run (no network for the waterfall, no writes).
 *   --limit <n>           cap the batch (default: no cap)
 *   --concurrency <n>     parallel providers (default 4 — keep low, Places/Perplexity rate-limit)
 *   --no-verify           skip ZeroBounce (write whatever scraping/Perplexity found)
 *
 * Cost note: scraping is free; Perplexity Sonar (~$0.008/call) fires ONLY on
 * scrape misses; ZeroBounce (~$0.004/addr) only on hits. The dry-run prints an
 * upper bound (every target → Perplexity + verify).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  findEmail,
  normalizeWebsite,
  CostTracker,
  type ProviderContext,
} from "../lib/medjobs/outreach-enrichment";
import { verifyAndCache } from "../lib/email-verification";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const APPLY = process.argv.includes("--apply");
const OUTREACH = process.argv.includes("--outreach");
const NO_VERIFY = process.argv.includes("--no-verify");
const LIMIT = parseInt(arg("--limit") || "0", 10) || Infinity;
const CONCURRENCY = Math.max(1, parseInt(arg("--concurrency") || "4", 10));

// --city "College Station" TX  → the State positional is the token after the city value.
const CITY = arg("--city") || null;
const STATE = CITY ? process.argv[process.argv.indexOf("--city") + 2] || null : null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------------------------------------------------------------------------
// Target shape — a provider to enrich + how to write its email back.
// ---------------------------------------------------------------------------

interface Target {
  id: string; // provider_id (directory) or student_outreach.id (outreach)
  ctx: ProviderContext;
  /** Persist a found+verified email for this target. */
  write: (db: SupabaseClient, email: string) => Promise<void>;
}

function hasEmail(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

async function collectDirectoryTargets(db: SupabaseClient): Promise<Target[]> {
  if (!CITY || !STATE) {
    throw new Error('Directory mode needs: --city "<City>" <ST>');
  }
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, email, website, place_id, city, state")
      .ilike("city", CITY)
      .ilike("state", STATE)
      .or("deleted.is.null,deleted.eq.false")
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`olera-providers fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    offset += data.length;
  }

  return rows
    .filter((r) => !hasEmail(r.email) && normalizeWebsite(r.website as string))
    .map((r) => ({
      id: r.provider_id as string,
      ctx: {
        name: (r.provider_name as string) || null,
        website: (r.website as string) || null,
        place_id: (r.place_id as string) || null,
        city: (r.city as string) || null,
        state: (r.state as string) || null,
      },
      write: async (client, email) => {
        const { error } = await client
          .from("olera-providers")
          .update({ email })
          .eq("provider_id", r.provider_id);
        if (error) throw new Error(error.message);
      },
    }));
}

async function collectOutreachTargets(db: SupabaseClient): Promise<Target[]> {
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await db
      .from("student_outreach")
      .select("id, organization_name, research_data")
      .eq("kind", "provider")
      // Live-outreach statuses only (research + in_progress groups). Excludes the
      // "closed" group (not_interested / no_response_closed / do_not_contact /
      // wrong_contact / redirected) and active_partner — never enrich dead rows.
      .in("status", ["prospect", "researched", "outreach_sent", "engaged", "meeting_scheduled"])
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`student_outreach fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    offset += data.length;
  }

  return rows
    .map((r) => {
      const research = (r.research_data ?? {}) as {
        general_contact?: { email?: string | null; website?: string | null; city?: string | null; state?: string | null };
        website?: string | null;
      };
      const gc = research.general_contact ?? {};
      return { r, research, gc };
    })
    .filter(({ gc, research }) => !hasEmail(gc.email) && normalizeWebsite(gc.website ?? research.website))
    .map(({ r, research, gc }) => ({
      id: r.id as string,
      ctx: {
        name: (r.organization_name as string) || null,
        website: gc.website ?? research.website ?? null,
        place_id: null,
        city: gc.city ?? null,
        state: gc.state ?? null,
      },
      write: async (client, email) => {
        // Re-read to merge against the freshest research_data (G3: JSONB merge, no migration).
        const { data: fresh } = await client
          .from("student_outreach")
          .select("research_data")
          .eq("id", r.id)
          .single();
        const current = (fresh?.research_data ?? research ?? {}) as Record<string, unknown>;
        const currentGc = (current.general_contact ?? {}) as Record<string, unknown>;
        const next = { ...current, general_contact: { ...currentGc, email } };
        const { error } = await client
          .from("student_outreach")
          .update({ research_data: next })
          .eq("id", r.id);
        if (error) throw new Error(error.message);
      },
    }));
}

// ---------------------------------------------------------------------------
// Concurrency pool — N providers in flight at once.
// ---------------------------------------------------------------------------

async function pool<T>(items: T[], n: number, worker: (item: T, i: number) => Promise<void>): Promise<void> {
  let idx = 0;
  const runners = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  if (CITY && OUTREACH) {
    console.error("Pick one mode: --city OR --outreach, not both.");
    process.exit(1);
  }
  if (!CITY && !OUTREACH) {
    console.error('Pick a mode: --city "<City>" <ST>  OR  --outreach');
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);
  const mode = CITY ? `directory (${CITY}, ${STATE})` : "outreach (student_outreach, kind=provider)";
  console.log(`\nEmail enrichment — mode: ${mode}\n`);

  let targets = CITY ? await collectDirectoryTargets(db) : await collectOutreachTargets(db);
  const totalBeforeLimit = targets.length;
  if (Number.isFinite(LIMIT)) targets = targets.slice(0, LIMIT);

  console.log(`Targets (website present, no email): ${totalBeforeLimit}${
    targets.length !== totalBeforeLimit ? ` → capped to ${targets.length} via --limit` : ""
  }`);

  if (targets.length === 0) {
    console.log("Nothing to enrich. Done.");
    return;
  }

  // Sample for eyeballing.
  console.log("\nSample targets:");
  for (const t of targets.slice(0, 8)) {
    console.log(`  • ${t.ctx.name ?? "(unnamed)"} — ${t.ctx.website}`);
  }

  if (!APPLY) {
    const ceilPerplexity = (targets.length * 0.008).toFixed(2);
    const ceilVerify = (targets.length * 0.004).toFixed(2);
    console.log(
      `\n[DRY RUN] No network calls, no writes. Cost CEILING if every target ` +
        `missed scraping → Perplexity $${ceilPerplexity} + ZeroBounce $${ceilVerify}. ` +
        `Real cost is far lower (scraping is free and usually hits).\n` +
        `Re-run with --apply to enrich.\n`,
    );
    return;
  }

  // --- APPLY ---
  const cost = new CostTracker();
  const stats = { scrape: 0, perplexity: 0, verifiedValid: 0, verifiedRisky: 0, droppedInvalid: 0, empty: 0, written: 0 };
  let done = 0;

  await pool(targets, CONCURRENCY, async (t) => {
    try {
      const res = await findEmail(t.ctx, cost);
      if (!res.email) {
        stats.empty++;
      } else {
        if (res.source === "scrape") stats.scrape++;
        else if (res.source === "perplexity") stats.perplexity++;

        let ok = true;
        if (!NO_VERIFY) {
          const verdict = await verifyAndCache(res.email);
          if (verdict.status === "invalid") {
            ok = false;
            stats.droppedInvalid++;
          } else if (verdict.status === "valid") {
            stats.verifiedValid++;
          } else if (verdict.status === "risky") {
            stats.verifiedRisky++;
          }
          // 'unknown' (no key / couldn't check) → write anyway, don't block.
        }

        if (ok) {
          await t.write(db, res.email);
          stats.written++;
        }
      }
    } catch (err) {
      console.log(`  [error] ${t.ctx.name}: ${(err as Error).message}`);
    } finally {
      done++;
      if (done % 5 === 0 || done === targets.length) {
        process.stdout.write(
          `  ${done}/${targets.length} | written ${stats.written} | ${cost.summary()}\r`,
        );
      }
    }
  });

  console.log(`\n\nDone.`);
  console.log(`  Found via scrape:     ${stats.scrape}`);
  console.log(`  Found via Perplexity: ${stats.perplexity}`);
  console.log(`  Verified valid:       ${stats.verifiedValid}`);
  console.log(`  Verified risky (kept):${stats.verifiedRisky}`);
  console.log(`  Dropped invalid:      ${stats.droppedInvalid}`);
  console.log(`  No email found:       ${stats.empty}`);
  console.log(`  WRITTEN:              ${stats.written}`);
  console.log(`  ${cost.summary()}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
