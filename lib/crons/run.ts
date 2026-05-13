/**
 * withCronRun — wraps a cron route handler so every execution is recorded in
 * cron_runs and the job's pause state (cron_config) is honored.
 *
 * Usage in a cron route:
 *
 *   export async function GET(request: NextRequest) {
 *     // ... auth check ...
 *     return withCronRun("weekly-provider-digest", async () => {
 *       // ... the work ...
 *       return { ok: true, processed, sent, skipped };  // -> HTTP body AND cron_runs.summary
 *     }, { triggeredBy: hasCronSecret ? "cron" : `admin:${email}` });
 *   }
 *
 * The inner fn returns a plain summary object on success and THROWS on failure
 * (no NextResponse, no try/catch inside — withCronRun owns the response and the
 * error path). A paused job (cron_config.enabled = false, not past paused_until)
 * short-circuits: the fn never runs, but a `skipped_paused` row is still written
 * so the pause is visible in run history. All cron_runs/cron_config writes are
 * best-effort — if the tables don't exist yet or a write fails, we log and keep
 * going rather than break the job because observability broke.
 */

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { getCronJob } from "@/lib/crons/registry";

type Summary = Record<string, unknown>;

interface CronRunOpts {
  /** Who triggered this run. Defaults to "cron" (the Vercel scheduler). Pass "admin:<email>" for manual fires. */
  triggeredBy?: string;
}

interface PauseState {
  paused: boolean;
  reason: string | null;
  pausedUntil: string | null;
}

async function readPauseState(jobId: string): Promise<PauseState> {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("cron_config")
      .select("enabled, paused_reason, paused_until")
      .eq("job_id", jobId)
      .maybeSingle();
    if (error || !data) return { paused: false, reason: null, pausedUntil: null };
    if (data.enabled !== false) return { paused: false, reason: null, pausedUntil: null };

    // Paused — but if paused_until has passed, auto-reenable.
    if (data.paused_until && new Date(data.paused_until) <= new Date()) {
      await db
        .from("cron_config")
        .update({
          enabled: true,
          paused_at: null,
          paused_by: null,
          paused_reason: null,
          paused_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", jobId);
      console.log(`[cron:${jobId}] pause expired — auto-reenabled`);
      return { paused: false, reason: null, pausedUntil: null };
    }
    return { paused: true, reason: data.paused_reason ?? null, pausedUntil: data.paused_until ?? null };
  } catch (err) {
    console.error(`[cron:${jobId}] failed to read pause state (treating as not paused):`, err);
    return { paused: false, reason: null, pausedUntil: null };
  }
}

async function insertRun(
  jobId: string,
  triggeredBy: string,
  status: "running" | "skipped_paused",
  summary: Summary = {},
): Promise<string | null> {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("cron_runs")
      .insert({
        job_id: jobId,
        status,
        triggered_by: triggeredBy,
        summary,
        ...(status === "skipped_paused" ? { finished_at: new Date().toISOString() } : {}),
      })
      .select("id")
      .single();
    if (error) {
      console.error(`[cron:${jobId}] failed to insert ${status} run row:`, error);
      return null;
    }
    return (data as { id: string }).id;
  } catch (err) {
    console.error(`[cron:${jobId}] failed to insert ${status} run row:`, err);
    return null;
  }
}

async function finishRun(
  jobId: string,
  runId: string | null,
  status: "ok" | "error",
  summary: Summary,
  error: string | null,
): Promise<void> {
  if (!runId) return;
  try {
    const db = getServiceClient();
    await db
      .from("cron_runs")
      .update({
        status,
        finished_at: new Date().toISOString(),
        summary,
        error,
      })
      .eq("id", runId);
  } catch (err) {
    console.error(`[cron:${jobId}] failed to finalize run ${runId}:`, err);
  }
}

/**
 * Link every email_log row this run produced back to the cron_runs row, so the
 * Console can show a per-recipient table for any run. We don't thread a run id
 * through sendEmail — instead, at run-end, we claim every email_log row whose
 * email_type is one this job sends, created since the run started, not already
 * claimed. Two overlapping runs of the same job (rare — Vercel doesn't re-enter
 * a running cron; manual double-fires are the only realistic case) would race
 * for the overlap and whoever finishes first wins — acceptable fuzz for an
 * observability surface. Best-effort: a failure here (incl. the column not
 * existing yet) is logged and swallowed, never breaks the job.
 */
async function stampEmails(jobId: string, runId: string | null, startedAt: string): Promise<void> {
  if (!runId) return;
  const job = getCronJob(jobId);
  if (!job || job.emailTypes.length === 0) return;
  try {
    const db = getServiceClient();
    const { error } = await db
      .from("email_log")
      .update({ cron_run_id: runId })
      .in("email_type", job.emailTypes)
      .gte("created_at", startedAt)
      .is("cron_run_id", null);
    if (error) console.error(`[cron:${jobId}] failed to stamp email_log rows for run ${runId}:`, error);
  } catch (err) {
    console.error(`[cron:${jobId}] failed to stamp email_log rows for run ${runId}:`, err);
  }
}

/**
 * Wrap a cron handler. `fn` may either:
 *   - return a plain summary object (the clean pattern — that object is both the
 *     HTTP body and the cron_runs.summary, and a thrown error marks the run as
 *     errored), or
 *   - return a NextResponse directly (the non-invasive retrofit pattern — the
 *     existing handler body stays untouched; we peek the JSON body for the
 *     summary and treat status >= 400 as an errored run).
 */
export async function withCronRun(
  jobId: string,
  fn: () => Promise<Summary | Response>,
  opts: CronRunOpts = {},
): Promise<Response> {
  const triggeredBy = opts.triggeredBy ?? "cron";

  const pause = await readPauseState(jobId);
  if (pause.paused) {
    await insertRun(jobId, triggeredBy, "skipped_paused", {
      reason: pause.reason,
      paused_until: pause.pausedUntil,
    });
    console.log(`[cron:${jobId}] paused — skipped (reason: ${pause.reason ?? "none"})`);
    return NextResponse.json({
      ok: true,
      skipped: "paused",
      job: jobId,
      paused_reason: pause.reason,
      paused_until: pause.pausedUntil,
    });
  }

  const startedAt = new Date().toISOString();
  const runId = await insertRun(jobId, triggeredBy, "running");

  try {
    const result = await fn();
    if (result instanceof Response) {
      let summary: Summary = {};
      try {
        summary = (await result.clone().json()) as Summary;
      } catch {
        /* non-JSON body — leave summary empty */
      }
      const isErr = result.status >= 400;
      await finishRun(
        jobId,
        runId,
        isErr ? "error" : "ok",
        summary,
        isErr ? (typeof summary?.error === "string" ? summary.error : `HTTP ${result.status}`) : null,
      );
      await stampEmails(jobId, runId, startedAt);
      return result;
    }
    const summary = (result ?? {}) as Summary;
    await finishRun(jobId, runId, "ok", summary, null);
    await stampEmails(jobId, runId, startedAt);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[cron:${jobId}] run failed:`, err);
    await finishRun(jobId, runId, "error", {}, message);
    await stampEmails(jobId, runId, startedAt); // partial sends before the throw still get linked
    return NextResponse.json({ error: "Internal server error", job: jobId }, { status: 500 });
  }
}
