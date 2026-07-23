/**
 * Cron endpoint: auto-process providers in the re_engage stage.
 *
 * Triggered by Vercel Cron (daily at 6 AM UTC — see vercel.json) or by an
 * admin curling locally with the CRON_SECRET bearer token.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Fails closed
 * (401) if CRON_SECRET is unset OR doesn't match — never publicly callable.
 *
 * Behavior:
 *   - Find providers in re_engage stage for 30+ days
 *   - Cycle 1 providers: AUTOMATICALLY move to in_sequence and create email tasks
 *     (no manual re-launch needed - sequence starts automatically)
 *   - Cycle 2 providers: move to not_interested (soft terminal)
 *   - Providers without email are skipped
 *   - Log touchpoints for each transition
 *
 * Terminal States:
 *   - not_interested = soft terminal (stops outreach, questions/connections still flow)
 *   - archived = hard terminal (system-wide block, only set via explicit Archive action)
 *
 * Local testing:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/provider-outreach-auto-re-engage
 *
 *   # Dry run (preview only):
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "http://localhost:3000/api/cron/provider-outreach-auto-re-engage?dry_run=true"
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { processEligibleReEngageProviders, dryRunAutoReEngage } from "@/lib/provider-outreach/auto-re-engage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

async function runCron(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Support dry_run query param for testing
  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get("dry_run") === "true";

  return withCronRun("provider-outreach-auto-re-engage", async () => {
    const db = getServiceClient();

    if (dryRun) {
      // Dry run: return what would be processed without making changes
      const preview = await dryRunAutoReEngage(db as AnySupabaseClient);
      return NextResponse.json({
        dry_run: true,
        ...preview,
      });
    }

    // Process eligible providers (null = system action for audit logging)
    const result = await processEligibleReEngageProviders(db as AnySupabaseClient, null);

    return NextResponse.json({
      processed: result.processed,
      cycle_started: result.cycle_started,
      soft_terminal: result.soft_terminal,
      skipped: result.skipped,
      errors: result.errors,
      results: result.results,
    });
  });
}
