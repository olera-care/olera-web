import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { syncSupportMailbox, type SupportMailboxRow } from "@/lib/support-email/sync.server";

export const maxDuration = 300;

/**
 * Resumable Gmail worker. Every run does two things in this order:
 *  1. drains bounded Gmail history chunks within a time budget
 *  2. imports one bounded full-history page until no page token remains
 *
 * Pub/Sub is the low-latency nudge, but this scheduled poll is also the recovery
 * path Google requires for delayed/dropped notifications.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withCronRun("support-email-sync", async () => {
    const db = getServiceClient();
    // Serverless timeouts cannot reach withCronRun's finalizer. Close abandoned
    // rows so Operations does not accumulate phantom "running" executions.
    const { error: staleRunError } = await db.from("cron_runs").update({
      status: "error",
      finished_at: new Date().toISOString(),
      error: "Worker timed out before completion",
    }).eq("job_id", "support-email-sync").eq("status", "running")
      .lt("started_at", new Date(Date.now() - 10 * 60 * 1_000).toISOString());
    if (staleRunError) console.error("[support-email] could not close stale cron runs:", staleRunError);
    // Snoozing is a promise to put the thread back, not a hidden terminal state.
    const { error: snoozeError } = await db.from("support_email_threads").update({
      state: "needs_reply",
      snoozed_until: null,
      updated_at: new Date().toISOString(),
    }).eq("state", "snoozed").lte("snoozed_until", new Date().toISOString());
    if (snoozeError) throw snoozeError;
    const { data: mailboxes, error } = await db
      .from("support_mailboxes")
      .select("*")
      .not("encrypted_refresh_token", "is", null);
    if (error) throw error;
    const summary = { historyChunks: 0, catchingUp: 0, mailboxes: 0, historyImported: 0, historyDeleted: 0, labelsUpdated: 0, skippedLocked: 0, backfillImported: 0, backfillsComplete: 0, errors: 0 };
    for (const raw of mailboxes ?? []) {
      const mailbox = raw as SupportMailboxRow;
      summary.mailboxes += 1;
      try {
        const result = await syncSupportMailbox(db, mailbox);
        summary.historyChunks += result.history.chunks;
        if (result.history.hasMore) summary.catchingUp += 1;
        summary.historyImported += result.history.imported;
        summary.historyDeleted += result.history.deleted;
        summary.labelsUpdated += result.history.labelsUpdated;
        if ("skipped" in result && result.skipped === "already_syncing") summary.skippedLocked += 1;
        summary.backfillImported += result.backfill.imported;
        if (result.backfill.complete) summary.backfillsComplete += 1;
        // Pub/Sub events are merely nudges. Keep them pending while a bounded
        // history chunk says more pages remain; acknowledging them early would
        // make a partial catch-up look complete after a later worker failure.
        if (!("skipped" in result) && !result.history.hasMore) {
          const { error: eventError } = await db.from("support_email_events").update({ processed_at: new Date().toISOString(), error: null })
            .eq("mailbox_email", mailbox.email).is("processed_at", null);
          if (eventError) throw eventError;
        }
      } catch (err) {
        summary.errors += 1;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[support-email] sync failed for ${mailbox.email}:`, err);
        await db.from("support_email_events").update({ error: message })
          .eq("mailbox_email", mailbox.email).is("processed_at", null);
      }
    }
    const result = { ok: summary.errors === 0, ...summary };
    // withCronRun records a returned object as a successful execution. Return
    // an error response when any mailbox failed so cron monitoring and Vercel
    // retries do not report a false-green run.
    return summary.errors > 0 ? NextResponse.json(result, { status: 500 }) : result;
  });
}
