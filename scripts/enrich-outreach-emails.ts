#!/usr/bin/env tsx
/**
 * Email enrichment for MedJobs provider outreach.
 *
 * Closes the documented gap: the city pipeline never had an email finder. This
 * runs the scrape-first waterfall (lib/medjobs/outreach-enrichment.ts) over
 * providers missing an email, verifies each hit through ZeroBounce
 * (lib/email-verification.ts), and writes only deliverable addresses.
 *
 * Three modes:
 *   --city "<City>" <ST>   DIRECTORY run over olera-providers (writes olera-providers.email).
 *                          Pre-enriches the directory so providers carry an email
 *                          BEFORE they're materialized into the CRM.
 *   --outreach             OUTREACH run over student_outreach kind='provider' rows
 *                          missing general_contact.email (writes research_data.general_contact.email).
 *   --questions            DEMAND run over the cohort War Room's provider_contactability
 *                          probe flags: providers holding unanswered questions we cannot
 *                          email. Writes olera-providers.email AND flushes the questions
 *                          that were held because the provider had no address — repeats
 *                          of the same question text are deduped to one send. Unlike
 *                          --city it does not require a website on file.
 *
 * Dry-run by DEFAULT — prints the target list + cost ceiling and exits. Pass
 * --apply to run the waterfall and write.
 *
 * Usage (run from a checkout with .env.local + node_modules):
 *   npx tsx scripts/enrich-outreach-emails.ts --city "College Station" TX
 *   npx tsx scripts/enrich-outreach-emails.ts --city "College Station" TX --apply --limit 25
 *   npx tsx scripts/enrich-outreach-emails.ts --outreach --apply
 *   npx tsx scripts/enrich-outreach-emails.ts --questions --apply --limit 25
 *
 * Flags:
 *   --city "<City>" <ST>  directory-mode target (two positionals follow the flag)
 *   --outreach            outreach-mode (mutually exclusive with --city)
 *   --questions           demand-mode: providers holding unanswered questions, no email
 *   --apply               run + write. Without it: dry-run (no network for the waterfall, no writes).
 *   --limit <n>           cap the batch (default: no cap)
 *   --concurrency <n>     parallel providers (default 4 — keep low, Places/Perplexity rate-limit)
 *   --no-verify           skip ZeroBounce (write whatever scraping/Perplexity found)
 *   --days <n>            --questions lookback for unanswered questions (default 30)
 *   --max-questions <n>   --questions: held questions to flush per provider (default 2)
 *   --no-notify           --questions: write the email but send nothing
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
  discoverWebsiteByName,
  CostTracker,
  type ProviderContext,
} from "../lib/medjobs/outreach-enrichment";
import { verifyAndCache, effectiveStatus } from "../lib/email-verification";
import { sendDeferredNotificationsForProvider } from "../lib/admin/send-deferred-notifications";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const APPLY = process.argv.includes("--apply");
const OUTREACH = process.argv.includes("--outreach");
const QUESTIONS = process.argv.includes("--questions");
const NO_VERIFY = process.argv.includes("--no-verify");
const NO_NOTIFY = process.argv.includes("--no-notify");
const LIMIT = parseInt(arg("--limit") || "0", 10) || Infinity;
const CONCURRENCY = Math.max(1, parseInt(arg("--concurrency") || "4", 10));
const QUESTION_DAYS = Math.max(1, parseInt(arg("--days") || "30", 10));
const MAX_QUESTIONS = Math.max(1, parseInt(arg("--max-questions") || "2", 10));

// --city "College Station" TX  → the State positional is the token after the city value.
const CITY = arg("--city") || null;
const STATE = CITY ? process.argv[process.argv.indexOf("--city") + 2] || null : null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------------------------------------------------------------------------
// Target shape — a provider to enrich + how to write its email back.
// ---------------------------------------------------------------------------

interface NotifyOutcome {
  summary: string;
  questionsSent: number;
  duplicatesSuppressed: number;
}

interface Target {
  id: string; // provider_id (directory) or student_outreach.id (outreach)
  ctx: ProviderContext;
  /** Persist a found+verified email for this target. */
  write: (db: SupabaseClient, email: string) => Promise<void>;
  /**
   * No website AND no place_id on file — the finder has nothing to resolve, so
   * look the business up by name first. Only set in --questions mode, where the
   * cohort is fixed by demand rather than by having a scrapeable site.
   */
  discover?: boolean;
  /**
   * Fires after a successful write. In --questions mode this flushes the
   * questions that were held BECAUSE the provider had no email — the whole
   * point of the run.
   */
  onWritten?: (db: SupabaseClient, email: string) => Promise<NotifyOutcome>;
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

/**
 * QUESTIONS mode — the cohort War Room's provider_contactability probe flags:
 * providers holding UNANSWERED questions that we cannot email. Unlike --city
 * this does NOT require a website on file; roughly half the cohort has only a
 * place_id, which resolveWebsite() turns into a site via Google Places, and the
 * handful with neither get a name lookup first.
 */
async function collectQuestionTargets(db: SupabaseClient): Promise<Target[]> {
  const from = new Date(Date.now() - QUESTION_DAYS * 86_400_000).toISOString();

  // Distinct provider pages holding a pending (unanswered) question.
  const slugs = new Set<string>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await db
      .from("provider_questions")
      .select("provider_id")
      .eq("status", "pending")
      .gte("created_at", from)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`provider_questions fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      const slug = (row as { provider_id: string | null }).provider_id;
      if (slug) slugs.add(slug);
    }
    if (data.length < PAGE) break;
    offset += data.length;
  }

  // Resolve to live directory rows, keeping only the unreachable ones.
  const slugList = Array.from(slugs);
  const rows: Record<string, unknown>[] = [];
  const CHUNK = 200;
  for (let i = 0; i < slugList.length; i += CHUNK) {
    const { data, error } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug, email, website, place_id, city, state, deleted")
      .in("slug", slugList.slice(i, i + CHUNK));
    if (error) throw new Error(`olera-providers fetch: ${error.message}`);
    rows.push(...(data ?? []));
  }

  return rows
    .filter((r) => !r.deleted && !hasEmail(r.email))
    .map((r) => {
      const slug = r.slug as string;
      const providerId = r.provider_id as string;
      const website = normalizeWebsite(r.website as string);
      return {
        id: slug,
        discover: !website && !r.place_id,
        ctx: {
          name: (r.provider_name as string) || null,
          website,
          place_id: (r.place_id as string) || null,
          city: (r.city as string) || null,
          state: (r.state as string) || null,
        },
        write: async (client: SupabaseClient, email: string) => {
          const { error } = await client
            .from("olera-providers")
            .update({ email })
            .eq("slug", slug);
          if (error) throw new Error(error.message);
          // Keep a claimed account's address in step with the directory, the
          // same way the admin directory edit does.
          await client
            .from("business_profiles")
            .update({ email })
            .eq("source_provider_id", providerId)
            .is("email", null);
        },
        onWritten: async (client: SupabaseClient, email: string): Promise<NotifyOutcome> => {
          if (NO_NOTIFY) return { summary: "notify skipped (--no-notify)", questionsSent: 0, duplicatesSuppressed: 0 };
          const { data: bp } = await client
            .from("business_profiles")
            .select("id, slug, metadata")
            .eq("source_provider_id", providerId)
            .limit(1)
            .maybeSingle();
          const profileMeta = ((bp?.metadata as Record<string, unknown>) || {});
          const providerSlug = (bp?.slug as string) || slug;
          // Questions can be filed under any of the provider's identifiers.
          const variants = [slug, providerId].filter((v) => v && v !== providerSlug) as string[];
          const res = await sendDeferredNotificationsForProvider({
            profileId: (bp?.id as string) || "",
            email,
            providerName: (r.provider_name as string) || "Provider",
            providerSlug,
            additionalSlugVariants: variants,
            leadsUnsubscribed: !!profileMeta.leads_unsubscribed,
            maxQuestions: MAX_QUESTIONS,
          });
          return {
            summary: `sent ${res.questionEmailsSent} question email(s), suppressed ${res.questionDuplicatesSuppressed} repeat(s)`,
            questionsSent: res.questionEmailsSent,
            duplicatesSuppressed: res.questionDuplicatesSuppressed,
          };
        },
      } satisfies Target;
    });
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
  const modes = [CITY ? "--city" : null, OUTREACH ? "--outreach" : null, QUESTIONS ? "--questions" : null].filter(Boolean);
  if (modes.length > 1) {
    console.error(`Pick one mode, not ${modes.join(" + ")}.`);
    process.exit(1);
  }
  if (modes.length === 0) {
    console.error('Pick a mode: --city "<City>" <ST>  OR  --outreach  OR  --questions');
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);
  const mode = CITY
    ? `directory (${CITY}, ${STATE})`
    : QUESTIONS
      ? `questions (providers holding unanswered questions, last ${QUESTION_DAYS}d)`
      : "outreach (student_outreach, kind=provider)";
  console.log(`\nEmail enrichment — mode: ${mode}\n`);

  let targets = CITY
    ? await collectDirectoryTargets(db)
    : QUESTIONS
      ? await collectQuestionTargets(db)
      : await collectOutreachTargets(db);
  const totalBeforeLimit = targets.length;
  if (Number.isFinite(LIMIT)) targets = targets.slice(0, LIMIT);

  const targetLabel = QUESTIONS ? "no email (website optional)" : "website present, no email";
  console.log(`Targets (${targetLabel}): ${totalBeforeLimit}${
    targets.length !== totalBeforeLimit ? ` → capped to ${targets.length} via --limit` : ""
  }`);
  if (QUESTIONS) {
    const noSite = targets.filter((t) => !t.ctx.website).length;
    console.log(
      `  of those, ${noSite} have no website on file (resolved via place_id / name lookup)\n` +
        `  on write: flush up to ${MAX_QUESTIONS} held question(s) each, repeats deduped` +
        `${NO_NOTIFY ? " — DISABLED via --no-notify" : ""}`,
    );
  }

  if (targets.length === 0) {
    console.log("Nothing to enrich. Done.");
    return;
  }

  // Sample for eyeballing.
  console.log("\nSample targets:");
  for (const t of targets.slice(0, 8)) {
    console.log(`  • ${t.ctx.name ?? "(unnamed)"} — ${t.ctx.website ?? (t.ctx.place_id ? "(via place_id)" : "(name lookup)")}`);
  }

  if (!APPLY) {
    const ceilPerplexity = (targets.length * 0.008).toFixed(2);
    const ceilVerify = (targets.length * 0.004).toFixed(2);
    console.log(
      `\n[DRY RUN] No network calls, no writes${QUESTIONS ? ", NO question emails" : ""}. Cost CEILING if every target ` +
        `missed scraping → Perplexity $${ceilPerplexity} + ZeroBounce $${ceilVerify}. ` +
        `Real cost is far lower (scraping is free and usually hits).\n` +
        `Re-run with --apply to enrich.\n`,
    );
    return;
  }

  // --- APPLY ---
  const cost = new CostTracker();
  const stats = { scrape: 0, perplexity: 0, verifiedValid: 0, verifiedRisky: 0, droppedInvalid: 0, empty: 0, written: 0, questionsSent: 0, duplicatesSuppressed: 0 };
  let done = 0;

  await pool(targets, CONCURRENCY, async (t) => {
    try {
      if (t.discover) {
        const found = await discoverWebsiteByName(t.ctx.name, t.ctx.city, t.ctx.state, cost);
        t.ctx = { ...t.ctx, website: found.website, place_id: found.placeId };
      }
      const res = await findEmail(t.ctx, cost);
      if (!res.email) {
        stats.empty++;
      } else {
        if (res.source === "scrape") stats.scrape++;
        else if (res.source === "perplexity") stats.perplexity++;

        let ok = true;
        if (!NO_VERIFY) {
          const raw = await verifyAndCache(res.email);
          // Judge on the EFFECTIVE verdict, not the raw one. ZeroBounce returns
          // status='invalid' sub_status='role_based' for info@ / admin@ — a
          // marketing-policy verdict, not an undeliverable mailbox — and role
          // addresses are exactly what a provider site publishes. Gating on the
          // raw status threw away ~70% of real finds. The send path applies the
          // same reinterpretation (lib/email.ts), so what we write here is what
          // it will accept.
          const status = effectiveStatus(raw.status, raw.subStatus);
          if (status === "invalid") {
            ok = false;
            stats.droppedInvalid++;
          } else if (status === "valid") {
            stats.verifiedValid++;
          } else if (status === "risky") {
            stats.verifiedRisky++;
          }
          // 'unknown' (no key / couldn't check) → write anyway, don't block.
        }

        if (ok) {
          await t.write(db, res.email);
          stats.written++;
          if (t.onWritten) {
            try {
              const outcome = await t.onWritten(db, res.email);
              stats.questionsSent += outcome.questionsSent;
              stats.duplicatesSuppressed += outcome.duplicatesSuppressed;
              console.log(`\n  [notify] ${t.ctx.name}: ${outcome.summary}`);
            } catch (notifyErr) {
              // The email is written and durable — a failed flush is recoverable
              // on the next run, so never fail the enrichment over it.
              console.log(`\n  [notify-failed] ${t.ctx.name}: ${(notifyErr as Error).message}`);
            }
          }
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
  if (QUESTIONS) {
    console.log(`  Question emails sent: ${stats.questionsSent}`);
    console.log(`  Repeat Qs suppressed: ${stats.duplicatesSuppressed}`);
  }
  console.log(`  ${cost.summary()}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
