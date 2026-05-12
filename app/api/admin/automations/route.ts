import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { CRON_REGISTRY, isEmailJob } from "@/lib/crons/registry";

/**
 * GET /api/admin/automations
 *
 * Powers the /admin/automations cockpit. Returns:
 *   - `summary`        — top-of-page health line (counts + 30-day deliverability)
 *   - `needsAttention` — auto-flagged issues (errored runs, paused jobs, 0-send
 *                        email jobs, low-delivered jobs, spam complaints)
 *   - `jobs[]`         — the registry joined with each job's latest run + 30-day
 *                        run count + 30-day email rollup + pause state
 *
 * cron_runs / cron_config may be absent (migration 082 not applied) — those
 * queries fail soft. Open/click come from Resend's pixel + link tracking, which
 * Apple Mail Privacy Protection inflates — absolute numbers soft, trend real.
 *
 * POST /api/admin/automations  { job_id, action: "pause" | "resume", reason?, days? }
 *   Pause (default auto-expiry 30 days) or resume a job. Paused jobs still run on
 *   schedule and log a `skipped_paused` cron_runs row each cycle.
 */

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const LOW_DELIVERED_BAR = 0.7; // <70% delivered on a meaningful volume → flag
const VOLUME_BAR = 20; // ...where "meaningful" = 20+ sends in 30d
const ERROR_RECENCY_MS = 7 * 24 * 60 * 60 * 1000; // an errored run only flags if within a week

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
type Rollup = { sent: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number };
const emptyRollup = (): Rollup => ({ sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 });

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const db = getServiceClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  // ── cron_runs (fail soft) ──
  const runsByJob = new Map<string, { latest: RunRow | null; count: number; errors: number }>();
  try {
    const { data } = await db
      .from("cron_runs")
      .select("job_id, started_at, finished_at, status, summary, error, triggered_by")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(50000);
    for (const r of (data ?? []) as RunRow[]) {
      const b = runsByJob.get(r.job_id) ?? { latest: null, count: 0, errors: 0 };
      if (!b.latest) b.latest = r; // newest-first
      b.count += 1;
      if (r.status === "error") b.errors += 1;
      runsByJob.set(r.job_id, b);
    }
  } catch {
    /* table not yet created */
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
  const byType = new Map<string, Rollup>();
  try {
    const { data } = await db
      .from("email_log")
      .select("email_type, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at")
      .gte("created_at", since)
      .limit(200000);
    for (const e of (data ?? []) as EmailLogRow[]) {
      const t = e.email_type || "unknown";
      const b = byType.get(t) ?? emptyRollup();
      b.sent += 1;
      if (e.delivered_at) b.delivered += 1;
      if (e.first_opened_at) b.opened += 1;
      if (e.first_clicked_at) b.clicked += 1;
      if (e.bounced_at) b.bounced += 1;
      if (e.complained_at) b.complained += 1;
      byType.set(t, b);
    }
  } catch {
    /* email_log unreadable */
  }

  const now = Date.now();

  const jobs = CRON_REGISTRY.map((job) => {
    const runs = runsByJob.get(job.id);
    const cfg = configByJob.get(job.id);
    const pausedActive =
      !!cfg && cfg.enabled === false && (!cfg.paused_until || new Date(cfg.paused_until).getTime() > now);

    let rollup: Rollup | null = null;
    if (job.emailTypes.length > 0) {
      rollup = emptyRollup();
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

    const lastRun = runs?.latest
      ? {
          startedAt: runs.latest.started_at,
          finishedAt: runs.latest.finished_at,
          status: runs.latest.status,
          summary: runs.latest.summary,
          error: runs.latest.error,
          triggeredBy: runs.latest.triggered_by,
        }
      : null;

    return {
      id: job.id,
      name: job.name,
      description: job.description,
      recipientCohort: job.recipientCohort,
      audience: job.audience,
      fn: job.fn,
      schedule: job.schedule,
      humanSchedule: job.humanSchedule,
      path: job.path,
      emailTypes: job.emailTypes,
      successSignal: job.successSignal ?? null,
      relatedAdminPath: job.relatedAdminPath ?? null,
      isEmail: isEmailJob(job),
      paused: pausedActive,
      pause: pausedActive
        ? { reason: cfg!.paused_reason, by: cfg!.paused_by, at: cfg!.paused_at, until: cfg!.paused_until }
        : null,
      lastRun,
      runs30d: runs?.count ?? 0,
      errors30d: runs?.errors ?? 0,
      rollup30d: rollup,
    };
  });

  // ── needs-attention ──
  const needsAttention: Array<{ jobId: string; name: string; severity: "error" | "warn"; message: string }> = [];
  for (const j of jobs) {
    if (j.lastRun?.status === "error" && now - new Date(j.lastRun.startedAt).getTime() < ERROR_RECENCY_MS) {
      needsAttention.push({ jobId: j.id, name: j.name, severity: "error", message: `Last run errored${j.lastRun.error ? `: ${j.lastRun.error}` : ""}` });
    }
    if (j.paused) {
      const until = j.pause?.until ? ` — auto-resumes ${new Date(j.pause.until).toLocaleDateString()}` : "";
      const why = j.pause?.reason ? ` ("${j.pause.reason}")` : "";
      needsAttention.push({ jobId: j.id, name: j.name, severity: "warn", message: `Paused${why}${until}` });
    }
    if (j.isEmail && j.emailTypes.length > 0 && j.rollup30d) {
      if (j.rollup30d.sent === 0) {
        needsAttention.push({ jobId: j.id, name: j.name, severity: "warn", message: "No sends in 30 days — expected some?" });
      } else if (j.rollup30d.sent >= VOLUME_BAR && j.rollup30d.delivered / j.rollup30d.sent < LOW_DELIVERED_BAR) {
        const p = Math.round((j.rollup30d.delivered / j.rollup30d.sent) * 100);
        needsAttention.push({ jobId: j.id, name: j.name, severity: "warn", message: `Only ${p}% delivered on ${j.rollup30d.sent} sends — deliverability or tracking gap?` });
      }
      if (j.rollup30d.complained > 0) {
        needsAttention.push({ jobId: j.id, name: j.name, severity: "warn", message: `${j.rollup30d.complained} spam complaint${j.rollup30d.complained === 1 ? "" : "s"} in 30 days — review the list.` });
      }
    }
  }

  // ── summary (cron-sent email only, summed over distinct types to avoid double-count) ──
  const cronEmailTypes = new Set(CRON_REGISTRY.flatMap((j) => j.emailTypes));
  let sends30d = 0;
  let bounces30d = 0;
  let complaints30d = 0;
  for (const [t, b] of byType) {
    if (!cronEmailTypes.has(t)) continue;
    sends30d += b.sent;
    bounces30d += b.bounced;
    complaints30d += b.complained;
  }
  const pausedCount = jobs.filter((j) => j.paused).length;
  const erroredCount = jobs.filter((j) => j.lastRun?.status === "error" && now - new Date(j.lastRun.startedAt).getTime() < ERROR_RECENCY_MS).length;

  return NextResponse.json({
    windowDays: 30,
    summary: {
      total: jobs.length,
      paused: pausedCount,
      errored: erroredCount,
      active: jobs.length - pausedCount - erroredCount,
      sends30d,
      bounces30d,
      complaints30d,
    },
    needsAttention,
    jobs,
    note: "Open/click rates come from Resend's pixel + link tracking, inflated by Apple Mail Privacy Protection — absolute numbers are soft, the trend is the signal.",
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
        { job_id, enabled: true, paused_at: null, paused_by: null, paused_reason: null, paused_until: null, updated_at: nowIso },
        { onConflict: "job_id" },
      );
      return NextResponse.json({ ok: true, job_id, paused: false });
    }
  } catch (err) {
    console.error("[admin/automations] pause/resume failed:", err);
    return NextResponse.json({ error: "Failed to update — has migration 082 (cron_config) been applied?" }, { status: 500 });
  }
}
