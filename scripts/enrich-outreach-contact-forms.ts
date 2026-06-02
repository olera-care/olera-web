#!/usr/bin/env tsx
/**
 * Contact-form-URL enrichment for MedJobs provider outreach.
 *
 * Most providers with a website have a contact form, but we never capture the
 * link — so that outreach channel sits unused. This finds the form URL
 * (lib/medjobs/outreach-enrichment.ts: scrape contact-ish pages → validate a
 * real contact <form>/embed → Perplexity fallback) and writes it where the UI
 * already reads it: research_data.general_contact.contact_form_url. Once set,
 * the ContactFormBanner + pre-flight item light up automatically — no wiring.
 *
 * Modes:
 *   --outreach             OUTREACH run over student_outreach kind='provider' rows
 *                          missing general_contact.contact_form_url. WRITES.
 *   --city "<City>" <ST>   DIRECTORY PREVIEW over olera-providers. Finds + prints
 *                          URLs but does NOT write — olera-providers has no
 *                          contact_form_url column (Option A: outreach rows only).
 *                          Use this to validate the finder / measure hit-rate.
 *
 * Dry-run by DEFAULT. --apply runs the finder (and, in --outreach mode, writes).
 * --city mode never writes regardless of --apply.
 *
 * Usage:
 *   npx tsx scripts/enrich-outreach-contact-forms.ts --city "College Station" TX --apply
 *   npx tsx scripts/enrich-outreach-contact-forms.ts --outreach --apply --limit 25
 *
 * Flags:
 *   --outreach            outreach-mode (writes)
 *   --city "<City>" <ST>  directory preview-mode (no writes)
 *   --apply               run the finder. Without it: prints targets + cost ceiling.
 *   --limit <n>           cap the batch (default: no cap)
 *   --concurrency <n>     parallel providers (default 4)
 *
 * Cost note: scraping is free; Perplexity Sonar (~$0.008/call) fires ONLY on
 * scrape misses. ZeroBounce is not used here (no email to verify).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  findContactFormUrl,
  normalizeWebsite,
  CostTracker,
  type ProviderContext,
} from "../lib/medjobs/outreach-enrichment";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const APPLY = process.argv.includes("--apply");
const OUTREACH = process.argv.includes("--outreach");
const LIMIT = parseInt(arg("--limit") || "0", 10) || Infinity;
const CONCURRENCY = Math.max(1, parseInt(arg("--concurrency") || "4", 10));

const CITY = arg("--city") || null;
const STATE = CITY ? process.argv[process.argv.indexOf("--city") + 2] || null : null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

interface Target {
  id: string;
  ctx: ProviderContext;
  /** null in --city preview mode (directory has no contact_form_url column). */
  write: ((db: SupabaseClient, url: string) => Promise<void>) | null;
}

function has(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

async function collectDirectoryPreviewTargets(db: SupabaseClient): Promise<Target[]> {
  if (!CITY || !STATE) throw new Error('Preview mode needs: --city "<City>" <ST>');
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, website, place_id, city, state")
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
    .filter((r) => normalizeWebsite(r.website as string))
    .map((r) => ({
      id: r.provider_id as string,
      ctx: {
        name: (r.provider_name as string) || null,
        website: (r.website as string) || null,
        place_id: (r.place_id as string) || null,
        city: (r.city as string) || null,
        state: (r.state as string) || null,
      },
      write: null, // preview only
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
        general_contact?: {
          contact_form_url?: string | null;
          website?: string | null;
          city?: string | null;
          state?: string | null;
        };
        website?: string | null;
      };
      const gc = research.general_contact ?? {};
      return { r, research, gc };
    })
    .filter(({ gc, research }) => !has(gc.contact_form_url) && normalizeWebsite(gc.website ?? research.website))
    .map(({ r, research, gc }) => ({
      id: r.id as string,
      ctx: {
        name: (r.organization_name as string) || null,
        website: gc.website ?? research.website ?? null,
        place_id: null,
        city: gc.city ?? null,
        state: gc.state ?? null,
      },
      write: async (client: SupabaseClient, url: string) => {
        const { data: fresh } = await client
          .from("student_outreach")
          .select("research_data")
          .eq("id", r.id)
          .single();
        const current = (fresh?.research_data ?? research ?? {}) as Record<string, unknown>;
        const currentGc = (current.general_contact ?? {}) as Record<string, unknown>;
        const next = { ...current, general_contact: { ...currentGc, contact_form_url: url } };
        const { error } = await client
          .from("student_outreach")
          .update({ research_data: next })
          .eq("id", r.id);
        if (error) throw new Error(error.message);
      },
    }));
}

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
    console.error('Pick a mode: --city "<City>" <ST> (preview)  OR  --outreach (writes)');
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);
  const preview = !!CITY;
  const mode = preview
    ? `directory PREVIEW (${CITY}, ${STATE}) — no writes`
    : "outreach (student_outreach, kind=provider) — writes";
  console.log(`\nContact-form enrichment — mode: ${mode}\n`);

  let targets = preview ? await collectDirectoryPreviewTargets(db) : await collectOutreachTargets(db);
  const totalBeforeLimit = targets.length;
  if (Number.isFinite(LIMIT)) targets = targets.slice(0, LIMIT);

  console.log(`Targets (website present${preview ? "" : ", no contact_form_url"}): ${totalBeforeLimit}${
    targets.length !== totalBeforeLimit ? ` → capped to ${targets.length} via --limit` : ""
  }`);
  if (targets.length === 0) {
    console.log("Nothing to enrich. Done.");
    return;
  }

  if (!APPLY) {
    const ceil = (targets.length * 0.008).toFixed(2);
    console.log(
      `\n[DRY RUN] No network, no writes. Cost CEILING if every target missed ` +
        `scraping → Perplexity $${ceil}. Re-run with --apply.\n`,
    );
    return;
  }

  const cost = new CostTracker();
  const stats = { scrape: 0, perplexity: 0, empty: 0, written: 0 };
  let done = 0;
  const found: { name: string; url: string; source: string }[] = [];

  await pool(targets, CONCURRENCY, async (t) => {
    try {
      const res = await findContactFormUrl(t.ctx, cost);
      if (!res.url) {
        stats.empty++;
      } else {
        if (res.source === "scrape") stats.scrape++;
        else if (res.source === "perplexity") stats.perplexity++;
        found.push({ name: t.ctx.name ?? "(unnamed)", url: res.url, source: res.source ?? "?" });
        if (t.write) {
          await t.write(db, res.url);
          stats.written++;
        }
      }
    } catch (err) {
      console.log(`  [error] ${t.ctx.name}: ${(err as Error).message}`);
    } finally {
      done++;
      if (done % 5 === 0 || done === targets.length) {
        process.stdout.write(`  ${done}/${targets.length} | found ${found.length} | ${cost.summary()}\r`);
      }
    }
  });

  console.log(`\n\nFound contact forms (${found.length}):`);
  for (const f of found) console.log(`  • ${f.name} → ${f.url} [${f.source}]`);

  console.log(`\nDone.`);
  console.log(`  Found via scrape:     ${stats.scrape}`);
  console.log(`  Found via Perplexity: ${stats.perplexity}`);
  console.log(`  No form found:        ${stats.empty}`);
  console.log(`  WRITTEN:              ${preview ? "0 (preview)" : stats.written}`);
  console.log(`  ${cost.summary()}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
