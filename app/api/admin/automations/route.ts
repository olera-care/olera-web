import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { CRON_REGISTRY, isEmailJob } from "@/lib/crons/registry";

/**
 * GET /api/admin/automations  — powers the /admin/automations cockpit:
 *   - `summary`        — top-of-page health line
 *   - `needsAttention` — auto-flagged issues, consolidated (the low-delivered ones
 *                        roll into one group item), with acks applied: snoozed ones
 *                        hide until snooze_until; acknowledged-indefinitely ones hide
 *                        unless the value degrades past value_at_ack
 *   - `acknowledged`   — the dismissed alerts (so the page can show "N acknowledged")
 *   - `jobs[]`         — registry + latest run + 30-day run count + 30-day email rollup + pause state
 *
 * Open/click come from Resend's pixel + link tracking, inflated by Apple Mail
 * Privacy Protection — absolute numbers soft, trend real. cron_runs / cron_config /
 * cron_alert_acks may be absent (migrations 082/083 not applied) — fail soft.
 *
 * POST /api/admin/automations:
 *   { job_id, action: "pause"|"resume", reason?, days? }                — pause/resume a job
 *   { job_id, alert_key, action: "ack_alert", snooze_days?, value_at_ack?, note? }  — dismiss an alert
 *   { job_id, alert_key, action: "unack_alert" }                       — un-dismiss it
 */

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const LOW_DELIVERED_BAR = 0.7;
const VOLUME_BAR = 20;
const ERROR_RECENCY_MS = 7 * 24 * 60 * 60 * 1000;

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
interface AckRow {
  job_id: string;
  alert_key: string;
  value_at_ack: number | null;
  snooze_until: string | null;
  acked_by: string;
  acked_at: string;
  note: string | null;
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

interface RawAlert {
  jobId: string; // registry id, or "group"
  alertKey: string;
  severity: "error" | "warn";
  message: string;
  value: number | null; // metric for the degradation comparison; null = no comparison
  worseIsHigher: boolean; // ignored if value is null
  details?: Array<{ jobId: string; name: string; detail: string }>; // grouped alerts only
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const db = getServiceClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const now = Date.now();

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
      if (!b.latest) b.latest = r;
      b.count += 1;
      if (r.status === "error") b.errors += 1;
      runsByJob.set(r.job_id, b);
    }
  } catch {
    /* table absent */
  }

  // ── cron_config (fail soft) ──
  const configByJob = new Map<string, ConfigRow>();
  try {
    const { data } = await db.from("cron_config").select("job_id, enabled, paused_at, paused_by, paused_reason, paused_until");
    for (const c of (data ?? []) as ConfigRow[]) configByJob.set(c.job_id, c);
  } catch {
    /* table absent */
  }

  // ── cron_alert_acks (fail soft) ──
  const acks = new Map<string, AckRow>();
  try {
    const { data } = await db.from("cron_alert_acks").select("job_id, alert_key, value_at_ack, snooze_until, acked_by, acked_at, note");
    for (const a of (data ?? []) as AckRow[]) acks.set(`${a.job_id}\x1f${a.alert_key}`, a);
  } catch {
    /* table absent */
  }

  // ── 30-day email rollup by email_type ──
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

  const jobs = CRON_REGISTRY.map((job) => {
    const runs = runsByJob.get(job.id);
    const cfg = configByJob.get(job.id);
    const pausedActive = !!cfg && cfg.enabled === false && (!cfg.paused_until || new Date(cfg.paused_until).getTime() > now);

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
      ? { startedAt: runs.latest.started_at, finishedAt: runs.latest.finished_at, status: runs.latest.status, summary: runs.latest.summary, error: runs.latest.error, triggeredBy: runs.latest.triggered_by }
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
      pause: pausedActive ? { reason: cfg!.paused_reason, by: cfg!.paused_by, at: cfg!.paused_at, until: cfg!.paused_until } : null,
      lastRun,
      runs30d: runs?.count ?? 0,
      errors30d: runs?.errors ?? 0,
      rollup30d: rollup,
    };
  });

  // ── compute raw alerts (paused jobs deliberately NOT flagged here — shown in the header count + row badge + admin-home banner already) ──
  const rawAlerts: RawAlert[] = [];
  const lowDelivered: Array<{ jobId: string; name: string; pct: number; sent: number }> = [];
  for (const j of jobs) {
    if (j.lastRun?.status === "error" && now - new Date(j.lastRun.startedAt).getTime() < ERROR_RECENCY_MS) {
      rawAlerts.push({ jobId: j.id, alertKey: `errored:${j.id}`, severity: "error", message: `Last run errored${j.lastRun.error ? `: ${j.lastRun.error}` : ""}`, value: null, worseIsHigher: false });
    }
    if (j.isEmail && j.emailTypes.length > 0 && j.rollup30d) {
      if (j.rollup30d.sent === 0) {
        rawAlerts.push({ jobId: j.id, alertKey: `no_sends:${j.id}`, severity: "warn", message: "No sends in 30 days — expected some?", value: 0, worseIsHigher: false });
      } else if (j.rollup30d.sent >= VOLUME_BAR && j.rollup30d.delivered / j.rollup30d.sent < LOW_DELIVERED_BAR) {
        lowDelivered.push({ jobId: j.id, name: j.name, pct: Math.round((j.rollup30d.delivered / j.rollup30d.sent) * 100), sent: j.rollup30d.sent });
      }
      if (j.rollup30d.complained > 0) {
        rawAlerts.push({ jobId: j.id, alertKey: `complaints:${j.id}`, severity: "warn", message: `${j.rollup30d.complained} spam complaint${j.rollup30d.complained === 1 ? "" : "s"} in 30 days — review the list.`, value: j.rollup30d.complained, worseIsHigher: true });
      }
    }
  }
  if (lowDelivered.length === 1) {
    const x = lowDelivered[0];
    rawAlerts.push({ jobId: x.jobId, alertKey: `low_delivered:${x.jobId}`, severity: "warn", message: `Only ${x.pct}% tracked delivery on ${x.sent} sends — likely a webhook-recording gap on older rows, not a deliverability problem.`, value: x.pct, worseIsHigher: false });
  } else if (lowDelivered.length > 1) {
    rawAlerts.push({
      jobId: "group",
      alertKey: "low_delivered:group",
      severity: "warn",
      message: `${lowDelivered.length} automations show <${Math.round(LOW_DELIVERED_BAR * 100)}% tracked delivery — likely a webhook-recording gap on older rows, not a deliverability problem.`,
      value: lowDelivered.length,
      worseIsHigher: true,
      details: lowDelivered.map((x) => ({ jobId: x.jobId, name: x.name, detail: `${x.pct}% delivered on ${x.sent} sends` })),
    });
  }

  // ── apply acks ──
  const needsAttention: Array<RawAlert & { worsened?: boolean }> = [];
  const acknowledged: Array<{ jobId: string; alertKey: string; message: string; ackedBy: string; ackedAt: string; snoozeUntil: string | null; note: string | null }> = [];
  for (const a of rawAlerts) {
    const ack = acks.get(`${a.jobId}\x1f${a.alertKey}`);
    if (!ack) {
      needsAttention.push(a);
      continue;
    }
    if (ack.snooze_until) {
      if (new Date(ack.snooze_until).getTime() > now) {
        acknowledged.push({ jobId: a.jobId, alertKey: a.alertKey, message: a.message, ackedBy: ack.acked_by, ackedAt: ack.acked_at, snoozeUntil: ack.snooze_until, note: ack.note });
        continue;
      }
      // snooze expired — surface it again (the stale ack will be overwritten on re-ack)
      needsAttention.push(a);
      continue;
    }
    // acknowledged indefinitely
    if (a.value === null || ack.value_at_ack === null) {
      acknowledged.push({ jobId: a.jobId, alertKey: a.alertKey, message: a.message, ackedBy: ack.acked_by, ackedAt: ack.acked_at, snoozeUntil: null, note: ack.note });
      continue;
    }
    const worsened = a.worseIsHigher ? a.value > Number(ack.value_at_ack) : a.value < Number(ack.value_at_ack);
    if (worsened) needsAttention.push({ ...a, worsened: true });
    else acknowledged.push({ jobId: a.jobId, alertKey: a.alertKey, message: a.message, ackedBy: ack.acked_by, ackedAt: ack.acked_at, snoozeUntil: null, note: ack.note });
  }

  // ── summary ──
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
    summary: { total: jobs.length, paused: pausedCount, errored: erroredCount, active: jobs.length - pausedCount - erroredCount, sends30d, bounces30d, complaints30d },
    needsAttention,
    acknowledged,
    jobs,
    note: "Open and click rates come from Resend's tracking pixel and link wrapper, which Apple Mail Privacy Protection inflates (it prefetches the pixel and rewrites links). The absolute numbers are soft; the trend over time is the signal.",
  });
}

function isRegistryJob(id: string): boolean {
  return CRON_REGISTRY.some((j) => j.id === id);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let body: { job_id?: string; action?: string; reason?: string; days?: number; alert_key?: string; snooze_days?: number; value_at_ack?: number; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { job_id, action } = body;
  if (!job_id) return NextResponse.json({ error: "job_id required" }, { status: 400 });

  const db = getServiceClient();
  const nowIso = new Date().toISOString();

  // ── alert ack / unack ──
  if (action === "ack_alert" || action === "unack_alert") {
    const { alert_key } = body;
    if (!alert_key) return NextResponse.json({ error: "alert_key required" }, { status: 400 });
    if (job_id !== "group" && !isRegistryJob(job_id)) return NextResponse.json({ error: "Unknown job_id" }, { status: 400 });
    try {
      if (action === "unack_alert") {
        await db.from("cron_alert_acks").delete().eq("job_id", job_id).eq("alert_key", alert_key);
        return NextResponse.json({ ok: true, unacked: true });
      }
      const snoozeDays = Number.isFinite(body.snooze_days) && (body.snooze_days as number) > 0 ? Math.min(body.snooze_days as number, 365) : null;
      const snoozeUntil = snoozeDays ? new Date(Date.now() + snoozeDays * 24 * 60 * 60 * 1000).toISOString() : null;
      const valueAtAck = Number.isFinite(body.value_at_ack) ? (body.value_at_ack as number) : null;
      await db.from("cron_alert_acks").upsert(
        { job_id, alert_key, value_at_ack: valueAtAck, snooze_until: snoozeUntil, acked_by: user.email ?? "admin", acked_at: nowIso, note: (body.note ?? "").slice(0, 500) || null },
        { onConflict: "job_id,alert_key" },
      );
      return NextResponse.json({ ok: true, acked: true, snooze_until: snoozeUntil });
    } catch (err) {
      console.error("[admin/automations] ack failed:", err);
      return NextResponse.json({ error: "Failed — has migration 083 (cron_alert_acks) been applied?" }, { status: 500 });
    }
  }

  // ── pause / resume ──
  if (action !== "pause" && action !== "resume") {
    return NextResponse.json({ error: "action must be pause, resume, ack_alert, or unack_alert" }, { status: 400 });
  }
  if (!isRegistryJob(job_id)) return NextResponse.json({ error: "Unknown job_id" }, { status: 400 });
  try {
    if (action === "pause") {
      const days = Number.isFinite(body.days) && (body.days as number) > 0 ? Math.min(body.days as number, 365) : 30;
      const pausedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await db.from("cron_config").upsert(
        { job_id, enabled: false, paused_at: nowIso, paused_by: user.email ?? "admin", paused_reason: (body.reason ?? "").slice(0, 500) || null, paused_until: pausedUntil, updated_at: nowIso },
        { onConflict: "job_id" },
      );
      return NextResponse.json({ ok: true, job_id, paused: true, paused_until: pausedUntil });
    }
    await db.from("cron_config").upsert({ job_id, enabled: true, paused_at: null, paused_by: null, paused_reason: null, paused_until: null, updated_at: nowIso }, { onConflict: "job_id" });
    return NextResponse.json({ ok: true, job_id, paused: false });
  } catch (err) {
    console.error("[admin/automations] pause/resume failed:", err);
    return NextResponse.json({ error: "Failed — has migration 082 (cron_config) been applied?" }, { status: 500 });
  }
}
