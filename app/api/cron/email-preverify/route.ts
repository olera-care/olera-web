import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getAuthUser, getAdminUser } from "@/lib/admin";
import { verifyAndCache } from "@/lib/email-verification";
import { withCronRun } from "@/lib/crons/run";

/**
 * GET /api/cron/email-preverify
 *
 * Pre-verification cron — the proactive half of the deliverability system.
 *
 * The cold lanes (question_received alerts + the weekly digest's unclaimed
 * slice) go to scraped / directory addresses that bounce well above Resend's
 * <4% account-wide suspension threshold. lib/email.ts already verifies these
 * ON THE SPOT at send (verifyAndCache → suppress 'invalid'/cold-catch-all), but
 * during the weekly burst (~2k near-simultaneous sends) ZeroBounce trips its
 * Cloudflare rate limit, returns 'unknown', and the mail fails OPEN and sends.
 * So we verify LEAST reliably exactly when we send MOST — and ~58% of bounced
 * addresses were already known-invalid from a prior check that the burst
 * couldn't repeat.
 *
 * This job moves verification OFF the hot send path: it scans recent cold-lane
 * recipients, skips any already cached fresh, and verifies the uncached/stale
 * tail at a deliberate ≤1 req / 1.5s — slow enough to never trip the 429 wall.
 * It pre-populates email_verifications so the send path becomes a clean cache
 * read that reliably suppresses known-bad addresses. Each run is capped to fit
 * inside maxDuration; the backlog drains across runs and then steady-states to
 * just the daily delta.
 *
 * Audience (D2, 2026-06-17): the two cold pools first — question_received +
 * weekly_analytics_digest. Override with ?types=a,b. Widen to all
 * provider-notify types later if it proves out.
 *
 * Auth: `Bearer ${CRON_SECRET}` (the Vercel scheduler injects it) or a logged-in
 * admin session, so it's browser-triggerable past the Vercel bot challenge that
 * blocks plain curl.
 *
 * Query overrides (manual runs):
 *   ?types=question_received,weekly_analytics_digest   email_types to scan
 *   ?days=60      lookback window for recipients (default 60)
 *   ?limit=150    max NEW verifications this run (default 150; fits maxDuration)
 *   ?max_age_days=90   reuse cached verdicts younger than this (default 90)
 *   ?dry_run=true      collect + report the target list, verify nothing
 */
export const maxDuration = 300;

const DEFAULT_TYPES = ["question_received", "weekly_analytics_digest"];
const DEFAULT_LOOKBACK_DAYS = 60;
const DEFAULT_MAX_AGE_DAYS = 90;
// ≤1 request / 1.5s. The 429 wall is a burst limit; this deliberate pace clears
// it with margin. 150 × 1.5s = 225s, comfortably inside the 300s budget.
const THROTTLE_MS = 1500;
const DEFAULT_LIMIT = 150;
const COLLECT_CAP = 8000; // bound how many distinct recipients we load into memory
const PAGE = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(e: string): string {
  return e.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
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
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    triggeredBy = userEmail ? `admin:${userEmail}` : "admin";
  }

  const { searchParams } = new URL(request.url);
  const types = (searchParams.get("types") || DEFAULT_TYPES.join(","))
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const lookbackDays = Math.max(
    parseInt(searchParams.get("days") || String(DEFAULT_LOOKBACK_DAYS), 10) || DEFAULT_LOOKBACK_DAYS,
    1,
  );
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    400,
  );
  const maxAgeDays = Math.max(
    parseInt(searchParams.get("max_age_days") || String(DEFAULT_MAX_AGE_DAYS), 10) ||
      DEFAULT_MAX_AGE_DAYS,
    1,
  );
  const dryRun = searchParams.get("dry_run") === "true";

  return withCronRun(
    "email-preverify",
    async () => {
      if (!process.env.ZEROBOUNCE_API_KEY) {
        // Fail open / no-op: without a key, verifyAndCache only ever returns
        // 'unknown' (cached nothing). Surface it so the run isn't mistaken for
        // "all clean" in the Console.
        return {
          ok: true,
          skipped: "no_zerobounce_key",
          note: "ZEROBOUNCE_API_KEY not set — nothing to verify.",
        };
      }

      const db = getServiceClient();
      const since = new Date(Date.now() - lookbackDays * 86400000).toISOString();

      // 1. Collect distinct recent recipients of the cold-lane types. recipient
      //    may be a comma-joined list for multi-recipient sends — split it.
      const candidates = new Set<string>();
      for (const emailType of types) {
        let from = 0;
        for (;;) {
          const { data, error } = await db
            .from("email_log")
            .select("recipient")
            .eq("email_type", emailType)
            .gte("created_at", since)
            .range(from, from + PAGE - 1);
          if (error) throw new Error(`email_log query failed (${emailType}): ${error.message}`);
          if (!data || data.length === 0) break;
          for (const r of data) {
            String(r.recipient || "")
              .split(",")
              .forEach((e) => {
                const n = normalize(e);
                if (n) candidates.add(n);
              });
          }
          if (data.length < PAGE || candidates.size >= COLLECT_CAP) break;
          from += PAGE;
        }
        if (candidates.size >= COLLECT_CAP) break;
      }

      const allCandidates = [...candidates];

      // 2. Drop addresses already cached fresh (< maxAgeDays) — the per-run
      //    budget should go to genuinely uncached/stale addresses. Chunk the IN()
      //    so a few thousand candidates is a handful of queries.
      const freshSince = new Date(Date.now() - maxAgeDays * 86400000).toISOString();
      const fresh = new Set<string>();
      for (let i = 0; i < allCandidates.length; i += 500) {
        const chunk = allCandidates.slice(i, i + 500);
        const { data, error } = await db
          .from("email_verifications")
          .select("email")
          .in("email", chunk)
          .gte("checked_at", freshSince);
        if (error) throw new Error(`email_verifications query failed: ${error.message}`);
        for (const row of data || []) fresh.add(normalize(String(row.email)));
      }

      const targets = allCandidates.filter((e) => !fresh.has(e));
      const batch = targets.slice(0, limit);

      if (dryRun) {
        return {
          ok: true,
          dry_run: true,
          types,
          lookback_days: lookbackDays,
          candidates: allCandidates.length,
          already_fresh: fresh.size,
          uncached_or_stale: targets.length,
          would_verify: batch.length,
          capped: targets.length > batch.length,
          sample: batch.slice(0, 20),
        };
      }

      // 3. Verify the batch, throttled. Serial with a fixed pause keeps us at
      //    ≤1 req/1.5s. verifyAndCache caches every non-'unknown' verdict, so the
      //    send path then reads it from cache. Fails open per-address.
      const tally = { valid: 0, invalid: 0, risky: 0, unknown: 0 };
      for (let i = 0; i < batch.length; i++) {
        const res = await verifyAndCache(batch[i], maxAgeDays);
        tally[res.status]++;
        if (i < batch.length - 1) await sleep(THROTTLE_MS);
      }

      return {
        ok: true,
        types,
        lookback_days: lookbackDays,
        candidates: allCandidates.length,
        already_fresh: fresh.size,
        uncached_or_stale: targets.length,
        verified: batch.length,
        capped: targets.length > batch.length,
        remaining: targets.length - batch.length,
        tally,
      };
    },
    { triggeredBy },
  );
}
