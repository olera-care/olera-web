import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getCronJob, isEmailJob } from "@/lib/crons/registry";

/**
 * GET /api/admin/automations/[id]
 *
 * Detail payload for one automation, for /admin/automations/[id]:
 *   - the registry entry (+ isEmail), pause state, the 30-day email rollup
 *   - the full recent run history (last 100)
 *   - a 4-week trend (sends / delivered / opened / clicked per ISO week) for email jobs
 *   - `previewTypes` — email_type(s) for which a rendered email body exists in email_log
 *
 * cron_runs / cron_config may be absent (migration 082 not applied) — fail soft.
 */

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const TREND_MS = 28 * 24 * 60 * 60 * 1000;

function isoWeek(d: Date): string {
  // YYYY-Www (Monday-start). Good enough for a 4-bar trend.
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (t.getUTCDay() + 6) % 7; // Mon=0
  t.setUTCDate(t.getUTCDate() - day);
  return t.toISOString().slice(0, 10);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { id } = await params;
  const job = getCronJob(id);
  if (!job) return NextResponse.json({ error: "Unknown automation" }, { status: 404 });

  const db = getServiceClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const trendSince = new Date(Date.now() - TREND_MS).toISOString();

  // ── run history (fail soft) ──
  let runs: Array<{ id: string; started_at: string; finished_at: string | null; status: string; summary: Record<string, unknown> | null; error: string | null; triggered_by: string }> = [];
  try {
    const { data } = await db
      .from("cron_runs")
      .select("id, started_at, finished_at, status, summary, error, triggered_by")
      .eq("job_id", id)
      .order("started_at", { ascending: false })
      .limit(100);
    runs = data ?? [];
  } catch {
    /* table not yet created */
  }

  // ── pause state (fail soft) ──
  let pause: { reason: string | null; by: string | null; at: string | null; until: string | null } | null = null;
  let paused = false;
  try {
    const { data } = await db
      .from("cron_config")
      .select("enabled, paused_at, paused_by, paused_reason, paused_until")
      .eq("job_id", id)
      .maybeSingle();
    if (data && data.enabled === false && (!data.paused_until || new Date(data.paused_until).getTime() > Date.now())) {
      paused = true;
      pause = { reason: data.paused_reason, by: data.paused_by, at: data.paused_at, until: data.paused_until };
    }
  } catch {
    /* table not yet created */
  }

  // ── 30-day rollup + 4-week trend (email jobs only) ──
  let rollup30d: { sent: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number } | null = null;
  let trend: Array<{ week: string; sent: number; delivered: number; opened: number; clicked: number }> = [];
  const previewTypes: string[] = [];
  if (job.emailTypes.length > 0) {
    rollup30d = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
    const weekMap = new Map<string, { sent: number; delivered: number; opened: number; clicked: number }>();
    try {
      const { data } = await db
        .from("email_log")
        .select("email_type, created_at, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at, html_body")
        .in("email_type", job.emailTypes)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100000);
      const seenPreviewTypes = new Set<string>();
      for (const e of (data ?? []) as Array<{ email_type: string; created_at: string; delivered_at: string | null; first_opened_at: string | null; first_clicked_at: string | null; bounced_at: string | null; complained_at: string | null; html_body: string | null }>) {
        rollup30d.sent += 1;
        if (e.delivered_at) rollup30d.delivered += 1;
        if (e.first_opened_at) rollup30d.opened += 1;
        if (e.first_clicked_at) rollup30d.clicked += 1;
        if (e.bounced_at) rollup30d.bounced += 1;
        if (e.complained_at) rollup30d.complained += 1;
        if (e.created_at >= trendSince) {
          const wk = isoWeek(new Date(e.created_at));
          const w = weekMap.get(wk) ?? { sent: 0, delivered: 0, opened: 0, clicked: 0 };
          w.sent += 1;
          if (e.delivered_at) w.delivered += 1;
          if (e.first_opened_at) w.opened += 1;
          if (e.first_clicked_at) w.clicked += 1;
          weekMap.set(wk, w);
        }
        if (e.html_body && !seenPreviewTypes.has(e.email_type)) seenPreviewTypes.add(e.email_type);
      }
      previewTypes.push(...seenPreviewTypes);
    } catch {
      rollup30d = null;
    }
    trend = [...weekMap.entries()].map(([week, v]) => ({ week, ...v })).sort((a, b) => a.week.localeCompare(b.week));
  }

  return NextResponse.json({
    job: {
      ...job,
      isEmail: isEmailJob(job),
    },
    paused,
    pause,
    rollup30d,
    trend,
    previewTypes,
    runs,
    windowDays: 30,
  });
}
