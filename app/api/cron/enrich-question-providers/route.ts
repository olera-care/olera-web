import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { CostTracker } from "@/lib/medjobs/outreach-enrichment";
import { collectQuestionTargets, enrichOneTarget } from "@/lib/provider-email-enrichment";

/**
 * GET /api/cron/enrich-question-providers
 *
 * Weekly top-up of provider contact data for the cohort War Room's
 * provider_contactability probe measures: providers holding an unanswered
 * question that we cannot email. Unanswered questions on an unreachable
 * provider cannot prompt a claim, so that demand is inert.
 *
 * WHY A CRON AND NOT A ONE-OFF. The 2026-08-17 manual run took the count from
 * 333 to 278, but roughly TEN new unreachable pages appear per day: 70 of the
 * 278 had their first question inside a week. The stock refills. A single run
 * buys about four days.
 *
 * Targets are ordered NEWEST QUESTION FIRST and capped per run, so each week
 * works the providers that just entered the cohort rather than re-burning
 * Perplexity credits on the long tail we already failed to find an address for.
 * Expect roughly 15% of attempts to yield a usable address — most of the
 * remainder are small operators with no web presence beyond a Google listing.
 *
 * On a successful write this also flushes the questions that were being held
 * BECAUSE the provider had no address, capped (DEFAULT_MAX_QUESTIONS) and
 * deduped by question text.
 *
 * Auth: `Bearer ${CRON_SECRET}` (Vercel scheduler) or a logged-in admin
 * session, so it is browser-triggerable past the bot challenge that blocks curl.
 *
 * Query overrides (manual runs):
 *   ?limit=N       max providers attempted this run (default 80, max 300)
 *   ?days=N        unanswered-question lookback (default 30)
 *   ?dry_run=1     report the target list and spend ceiling, change nothing
 *   ?no_notify=1   write the address but send no held questions
 */

export const runtime = "nodejs";
export const maxDuration = 300;

const DEADLINE_MS = 250_000; // headroom under maxDuration for the final writes
const DEFAULT_LIMIT = 80;
const DEFAULT_DAYS = 30;
const DEFAULT_MAX_QUESTIONS = 2;
const CONCURRENCY = 4; // Places / Perplexity rate-limit; matches the batch script

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const hasCronSecret =
    !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  let triggeredBy = "cron";
  if (!hasCronSecret) {
    let admin = null;
    let userEmail: string | null = null;
    try {
      const user = await getAuthUser();
      userEmail = user?.email ?? null;
      admin = user ? await getAdminUser(user.id) : null;
    } catch {
      admin = null;
    }
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    triggeredBy = userEmail ? `admin:${userEmail}` : "admin";
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    300,
  );
  const days = Math.max(
    parseInt(searchParams.get("days") || String(DEFAULT_DAYS), 10) || DEFAULT_DAYS,
    1,
  );
  const dryRun = searchParams.get("dry_run") === "1" || searchParams.get("dry_run") === "true";
  const notify = !(searchParams.get("no_notify") === "1" || searchParams.get("no_notify") === "true");

  return withCronRun(
    "enrich-question-providers",
    async () => {
      const db = getServiceClient();
      const { targets, totalUnreachable } = await collectQuestionTargets(db, { days, limit });

      if (dryRun) {
        return {
          dryRun: true,
          totalUnreachable,
          wouldAttempt: targets.length,
          noWebsiteOnFile: targets.filter((t) => !t.ctx.website).length,
          // Upper bound: every target missing the scrape and needing both a
          // Perplexity call and a verification. Real spend runs well under this.
          spendCeilingUsd: Number((targets.length * 0.012).toFixed(2)),
          sample: targets.slice(0, 8).map((t) => t.name ?? t.slug),
        };
      }

      const cost = new CostTracker();
      const deadline = Date.now() + DEADLINE_MS;
      const stats = {
        attempted: 0,
        found: 0,
        written: 0,
        droppedUndeliverable: 0,
        noEmailFound: 0,
        questionsSent: 0,
        duplicatesSuppressed: 0,
        errors: 0,
      };
      let hitDeadline = false;

      let cursor = 0;
      const worker = async () => {
        while (cursor < targets.length) {
          if (Date.now() > deadline) {
            hitDeadline = true;
            return;
          }
          const target = targets[cursor++];
          const out = await enrichOneTarget(db, target, {
            cost,
            notify,
            maxQuestions: DEFAULT_MAX_QUESTIONS,
          });
          stats.attempted++;
          if (out.error) {
            stats.errors++;
            console.error(`[enrich-question-providers] ${out.slug}: ${out.error}`);
            continue;
          }
          if (!out.found) stats.noEmailFound++;
          else {
            stats.found++;
            if (out.written) {
              stats.written++;
              stats.questionsSent += out.questionsSent;
              stats.duplicatesSuppressed += out.duplicatesSuppressed;
            } else {
              stats.droppedUndeliverable++;
            }
          }
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker()),
      );

      return {
        ok: true,
        totalUnreachable,
        ...stats,
        remainingAfterRun: Math.max(0, totalUnreachable - stats.written),
        hitDeadline,
        spendUsd: Number(cost.cost.toFixed(2)),
      };
    },
    { triggeredBy },
  );
}
