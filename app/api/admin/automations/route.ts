import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { CRON_REGISTRY } from "@/lib/crons/registry";

/**
 * GET /api/admin/automations
 *
 * Powers /admin/automations. Returns the cron registry joined with, per job:
 *   - the latest run + a 30-day run count + error count (from cron_runs)
 *   - a 30-day email rollup (sends / delivered / opened / clicked / bounced /
 *     complained) for email jobs, derived from email_log's denormalized
 *     lifecycle columns keyed by email_type
 *   - pause state (from cron_config)
 *
 * cron_runs / cron_config may not exist yet (migration 082 not applied) — those
 * queries fail soft and the response just omits run/pause data.
 *
 * Open/click rates here come from Resend's tracking pixel + link wrapper, which
 * Apple Mail Privacy Protection inflates (prefetches the pixel and rewrites
 * links). Treat the absolute numbers as soft; the trend over time is the signal.
 *
 * POST /api/admin/automations  { job_id, action: "pause" | "resume", reason?, days? }
 *   Pause (default auto-expiry 30 days) or resume a job. Paused jobs still run on
 *   schedule and log a `skipped_paused` cron_runs row each cycle.
 */

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface RunRow {
  job_id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  summary: Record<string, unknown> | null;
  error: string | null;
  triggered_by: string;
}
interface ConfigRow {
  job_id: string;
  enabled: boolean;
  paused_at: string | null;
  paused_by: string | null;
  paused_reason: string | null;
  paused_until: string | null;
}
interface EmailLogRow {
  email_type: string;
  delivered_at: string | null;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const db = getServiceClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  // ── cron_runs (fail soft if table missing) ──
  const runsByJob = new Map<string, { latest: RunRow | null; count: number; errors: number }>();
  try {
    const { data } = await db
      .from("cron_runs")
      .select("job_id, started_at, finished_at, status, summary, error, triggered_by")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      // 30 days of all-cron volume is ~5–6k rows (the every-15-min job alone is
      // ~2.9k); 50k keeps low-frequency jobs from being starved of their data.
      .limit(50000);
    for (const r of (data ?? []) as RunRow[]) {
      const bucket = runsByJob.get(r.job_id) ?? { latest: null, count: 0, errors: 0 };
      if (!bucket.latest) bucket.latest = r; // rows are newest-first
      bucket.count += 1;
      if (r.status === "error") bucket.errors += 1;
      runsByJob.set(r.job_id, bucket);
    }
  } catch {
    /* table not yet created — leave runsByJob empty */
  }

  // ── cron_config (fail soft) ──
  const configByJob = new Map<string, ConfigRow>();
  try {
    const { data } = await db
      .from("cron_config")
      .select("job_id, enabled, paused_at, paused_by, paused_reason, paused_until");
    for (const c of (data ?? []) as ConfigRow[]) configByJob.set(c.job_id, c);
  } catch {
    /* table not yet created */
  }

  // ── 30-day email rollup, bucketed by email_type ──
  const byType = new Map<
    string,
    { sent: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number }
  >();
  try {
    const { data } = await db
      .from("email_log")
      .select("email_type, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at")
      .gte("created_at", since)
      .limit(200000);
    for (const e of (data ?? []) as EmailLogRow[]) {
      const t = e.email_type || "unknown";
      const b =
        byType.get(t) ?? { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
      b.sent += 1;
      if (e.delivered_at) b.delivered += 1;
      if (e.first_opened_at) b.opened += 1;
      if (e.first_clicked_at) b.clicked += 1;
      if (e.bounced_at) b.bounced += 1;
      if (e.complained_at) b.complained += 1;
      byType.set(t, b);
    }
  } catch {
    /* email_log missing the denormalized columns or unreadable — leave empty */
  }

  const now = Date.now();
  const jobs = CRON_REGISTRY.map((job) => {
    const runs = runsByJob.get(job.id);
    const cfg = configByJob.get(job.id);
    const pausedActive =
      !!cfg && cfg.enabled === false && (!cfg.paused_until || new Date(cfg.paused_until).getTime() > now);

    // Sum the rollup across this job's email types.
    let rollup: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      complained: number;
    } | null = null;
    if (job.emailTypes.length > 0) {
      rollup = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
      for (const t of job.emailTypes) {
        const b = byType.get(t);
        if (!b) continue;
        rollup.sent += b.sent;
        rollup.delivered += b.delivered;
        rollup.opened += b.opened;
        rollup.clicked += b.clicked;
        rollup.bounced += b.bounced;
        rollup.complained += b.complained;
      }
    }

    return {
      ...job,
      paused: pausedActive,
      pause: pausedActive
        ? { reason: cfg!.paused_reason, by: cfg!.paused_by, at: cfg!.paused_at, until: cfg!.paused_until }
        : null,
      lastRun: runs?.latest
        ? {
            startedAt: runs.latest.started_at,
            finishedAt: runs.latest.finished_at,
            status: runs.latest.status,
            summary: runs.latest.summary,
            error: runs.latest.error,
            triggeredBy: runs.latest.triggered_by,
          }
        : null,
      runs30d: runs?.count ?? 0,
      errors30d: runs?.errors ?? 0,
      rollup30d: rollup,
    };
  });

  return NextResponse.json({
    windowDays: 30,
    jobs,
    note: "Open/click rates are from Resend's pixel + link tracking, inflated by Apple Mail Privacy Protection — absolute numbers are soft, the trend is the signal.",
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let body: { job_id?: string; action?: string; reason?: string; days?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { job_id, action } = body;
  if (!job_id || !CRON_REGISTRY.some((j) => j.id === job_id)) {
    return NextResponse.json({ error: "Unknown job_id" }, { status: 400 });
  }
  if (action !== "pause" && action !== "resume") {
    return NextResponse.json({ error: "action must be 'pause' or 'resume'" }, { status: 400 });
  }

  const db = getServiceClient();
  const nowIso = new Date().toISOString();

  try {
    if (action === "pause") {
      const days = Number.isFinite(body.days) && (body.days as number) > 0 ? Math.min(body.days as number, 365) : 30;
      const pausedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await db.from("cron_config").upsert(
        {
          job_id,
          enabled: false,
          paused_at: nowIso,
          paused_by: user.email ?? "admin",
          paused_reason: (body.reason ?? "").slice(0, 500) || null,
          paused_until: pausedUntil,
          updated_at: nowIso,
        },
        { onConflict: "job_id" },
      );
      return NextResponse.json({ ok: true, job_id, paused: true, paused_until: pausedUntil });
    } else {
      await db.from("cron_config").upsert(
        {
          job_id,
          enabled: true,
          paused_at: null,
          paused_by: null,
          paused_reason: null,
          paused_until: null,
          updated_at: nowIso,
        },
        { onConflict: "job_id" },
      );
      return NextResponse.json({ ok: true, job_id, paused: false });
    }
  } catch (err) {
    console.error("[admin/automations] pause/resume failed:", err);
    return NextResponse.json(
      { error: "Failed to update — has migration 082 (cron_config) been applied?" },
      { status: 500 },
    );
  }
}
