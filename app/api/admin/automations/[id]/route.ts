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

const ALLOWED_WINDOWS = [7, 30, 90];
const TREND_MS = 28 * 24 * 60 * 60 * 1000;

function isoWeek(d: Date): string {
  // YYYY-Www (Monday-start). Good enough for a 4-bar trend.
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (t.getUTCDay() + 6) % 7; // Mon=0
  t.setUTCDate(t.getUTCDate() - day);
  return t.toISOString().slice(0, 10);
}

// ── Per-variant breakdown (weekly digest sends three distinct templates under one email_type) ──
const VARIANT_LABELS: Record<string, string> = {
  family_question: "Family question",
  weekly_digest: "Weekly digest",
  completion: "Completion nudge",
  cold_rank: "Cold rank note",
};
const VARIANT_ORDER = ["family_question", "weekly_digest", "completion", "cold_rank"];

// ── Per-variant downstream CONVERSION ──
// Each variant maps to the one provider_activity event that means "this email worked".
// Because the cron router sends exactly ONE variant per provider per run, and each
// variant's conversion event is distinct, attribution is unambiguous: a question_responded
// can only belong to a family_question send, a claim_completed only to a cold_rank send, etc.
// weekly_digest is the soft one — a portal re-visit (one_click_access), re-engagement not a
// hard conversion, by design (it's the recurring engine, not a one-time ask).
const CONVERSION_EVENT: Record<string, string> = {
  family_question: "question_responded",
  completion: "profile_published",
  cold_rank: "claim_completed",
  weekly_digest: "one_click_access",
};
const CONVERSION_LABEL: Record<string, string> = {
  family_question: "Answered",
  completion: "Profile published",
  cold_rank: "Listing claimed",
  weekly_digest: "Re-visited portal",
};
// Last-touch attribution window: an action counts as driven by a send if it happens within
// 14 days AFTER that send. Last-touch (most recent preceding send wins) so the weekly cadence
// can't double-count a single action across two consecutive sends.
const ATTRIBUTION_DAYS = 14;

type VRow = {
  email_type: string; created_at: string; delivered_at: string | null; first_opened_at: string | null;
  first_clicked_at: string | null; bounced_at: string | null; complained_at: string | null;
  html_body: string | null; metadata: Record<string, unknown> | null; subject: string | null;
  provider_id: string | null;
};
type Send = { providerId: string | null; sentAt: number; delivered: boolean };
/**
 * Count delivered sends that converted, under last-touch N-day attribution.
 * For each conversion event, credit the most recent preceding send within the window; a send
 * credited by any event counts once. `eventTimes`: providerId -> sorted-asc event timestamps.
 */
function countConverted(sends: Send[], eventTimes: Map<string, number[]>, windowMs: number): number {
  const byProvider = new Map<string, number[]>();
  for (const s of sends) {
    if (!s.delivered || !s.providerId) continue;
    const arr = byProvider.get(s.providerId);
    if (arr) arr.push(s.sentAt);
    else byProvider.set(s.providerId, [s.sentAt]);
  }
  let converted = 0;
  for (const [pid, sentTimes] of byProvider) {
    const evs = eventTimes.get(pid);
    if (!evs || evs.length === 0) continue;
    sentTimes.sort((a, b) => a - b);
    const credited = new Set<number>();
    for (const evAt of evs) {
      let best = -1; // index of most recent send strictly before this event
      for (let i = 0; i < sentTimes.length && sentTimes[i] < evAt; i++) best = i;
      if (best >= 0 && evAt - sentTimes[best] <= windowMs) credited.add(best);
    }
    converted += credited.size;
  }
  return converted;
}
type VStat = { sent: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number };
const emptyVStat = (): VStat => ({ sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 });
function accVStat(s: VStat, e: VRow) {
  s.sent += 1;
  if (e.delivered_at) s.delivered += 1;
  if (e.first_opened_at) s.opened += 1;
  if (e.first_clicked_at) s.clicked += 1;
  if (e.bounced_at) s.bounced += 1;
  if (e.complained_at) s.complained += 1;
}
/**
 * Which digest variant a send is. Prefers the stamped metadata.variant (new sends); falls back to
 * subject-pattern inference so the breakdown also covers rows sent before instrumentation landed.
 */
function classifyVariant(subject: string | null, metadata: Record<string, unknown> | null): { variant: string; ledWithRank: boolean } {
  const mv = metadata?.variant;
  if (mv === "family_question" || mv === "weekly_digest" || mv === "cold_rank" || mv === "completion") {
    return { variant: mv, ledWithRank: metadata?.ledWithRank === true };
  }
  const s = subject ?? "";
  if (/^A family has a question/i.test(s)) return { variant: "family_question", ledWithRank: false };
  if (/^Families in .+ rank you/i.test(s)) return { variant: "cold_rank", ledWithRank: true };
  if (/^See what families see on /i.test(s)) return { variant: "completion", ledWithRank: false };
  const led = /^You're #\d+ of /i.test(s) || /^See where you rank/i.test(s);
  return { variant: "weekly_digest", ledWithRank: led };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { id } = await params;
  const daysParam = parseInt(new URL(req.url).searchParams.get("days") || "30", 10);
  const windowDays = ALLOWED_WINDOWS.includes(daysParam) ? daysParam : 30;
  const job = getCronJob(id);
  if (!job) return NextResponse.json({ error: "Unknown automation" }, { status: 404 });

  const db = getServiceClient();
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
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
  // Per-variant rollup (only meaningful when a job's one email_type fans out into templates, like
  // the weekly digest). `variants[].split` carries the rank-led vs plain breakdown for weekly_digest.
  // `converted`/`convRate`/`convEvent`/`convLabel` carry the downstream-conversion attribution.
  type VariantOut = VStat & {
    key: string; label: string; split?: { withRank: VStat; plain: VStat };
    converted?: number; convRate?: number; convEvent?: string; convLabel?: string;
  };
  let variants: VariantOut[] = [];
  if (job.emailTypes.length > 0) {
    rollup30d = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
    const weekMap = new Map<string, { sent: number; delivered: number; opened: number; clicked: number }>();
    const vAgg: Record<string, VStat> = {};
    const vSends: Record<string, Send[]> = {}; // per-variant delivered/undelivered sends for conversion attribution
    const wkWithRank = emptyVStat();
    const wkPlain = emptyVStat();
    const isDigestJob = id === "weekly-provider-digest";
    try {
      // Fetch the wider of (rollup window, trend window) so a short window (7d) doesn't starve the
      // fixed 4-week trend. The rollup + variants then gate to `since` per-row; the trend to trendSince.
      const fetchSince = since < trendSince ? since : trendSince;
      const { data } = await db
        .from("email_log")
        .select("email_type, created_at, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at, html_body, metadata, subject, provider_id")
        .in("email_type", job.emailTypes)
        .gte("created_at", fetchSince)
        .order("created_at", { ascending: false })
        .limit(100000);
      const seenPreviewTypes = new Set<string>();
      for (const e of (data ?? []) as VRow[]) {
        const inWindow = e.created_at >= since;
        if (inWindow) {
          rollup30d.sent += 1;
          if (e.delivered_at) rollup30d.delivered += 1;
          if (e.first_opened_at) rollup30d.opened += 1;
          if (e.first_clicked_at) rollup30d.clicked += 1;
          if (e.bounced_at) rollup30d.bounced += 1;
          if (e.complained_at) rollup30d.complained += 1;
        }
        if (e.created_at >= trendSince) {
          const wk = isoWeek(new Date(e.created_at));
          const w = weekMap.get(wk) ?? { sent: 0, delivered: 0, opened: 0, clicked: 0 };
          w.sent += 1;
          if (e.delivered_at) w.delivered += 1;
          if (e.first_opened_at) w.opened += 1;
          if (e.first_clicked_at) w.clicked += 1;
          weekMap.set(wk, w);
        }
        // Variant breakdown — only the weekly digest fans one email_type into multiple templates,
        // so classifyVariant's digest-specific patterns only make sense there. For any other job
        // the subjects wouldn't match and would all collapse into a bogus "weekly_digest" bucket.
        if (inWindow && isDigestJob) {
          const { variant, ledWithRank } = classifyVariant(e.subject, e.metadata);
          (vAgg[variant] ??= emptyVStat());
          accVStat(vAgg[variant], e);
          (vSends[variant] ??= []).push({ providerId: e.provider_id, sentAt: Date.parse(e.created_at), delivered: !!e.delivered_at });
          if (variant === "weekly_digest") accVStat(ledWithRank ? wkWithRank : wkPlain, e);
        }
        if (inWindow && e.html_body && !seenPreviewTypes.has(e.email_type)) seenPreviewTypes.add(e.email_type);
      }
      previewTypes.push(...seenPreviewTypes);
      // Show the full digest taxonomy (all three templates + the weekly-digest rank split), even
      // variants with no sends in this window — so the breakdown reflects what the digest *can*
      // send, not just what happened to fire. Empty ones render muted on the page.
      if (isDigestJob) {
        // Downstream conversion: fetch the mapped provider_activity events over the rollup window
        // (every event that could attribute to an in-window send falls at or after `since`), then
        // last-touch-attribute each to a send within the 14-day window. Fail-soft: if the table or
        // columns are absent, variants render without conversion (the page falls back gracefully).
        const eventTimesByType = new Map<string, Map<string, number[]>>(); // eventType -> providerId -> times
        try {
          const { data: acts } = await db
            .from("provider_activity")
            .select("provider_id, event_type, created_at")
            .in("event_type", Object.values(CONVERSION_EVENT))
            .gte("created_at", since)
            .limit(100000);
          for (const a of (acts ?? []) as Array<{ provider_id: string | null; event_type: string; created_at: string }>) {
            if (!a.provider_id) continue;
            const byProv = eventTimesByType.get(a.event_type) ?? new Map<string, number[]>();
            const arr = byProv.get(a.provider_id);
            if (arr) arr.push(Date.parse(a.created_at));
            else byProv.set(a.provider_id, [Date.parse(a.created_at)]);
            eventTimesByType.set(a.event_type, byProv);
          }
        } catch {
          /* provider_activity unavailable — skip conversion */
        }
        const windowMs = ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000;
        variants = VARIANT_ORDER.map((k) => {
          const stat = vAgg[k] ?? emptyVStat();
          const evType = CONVERSION_EVENT[k];
          const eventTimes = eventTimesByType.get(evType);
          const converted = eventTimes ? countConverted(vSends[k] ?? [], eventTimes, windowMs) : 0;
          return {
            key: k,
            label: VARIANT_LABELS[k],
            ...stat,
            ...(k === "weekly_digest" ? { split: { withRank: wkWithRank, plain: wkPlain } } : {}),
            converted,
            convRate: stat.delivered > 0 ? converted / stat.delivered : 0,
            convEvent: evType,
            convLabel: CONVERSION_LABEL[k],
          };
        });
      }
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
    variants,
    previewTypes,
    runs,
    windowDays,
  });
}
