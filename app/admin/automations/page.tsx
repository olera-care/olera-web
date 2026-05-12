"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Fn = "nudge" | "alert" | "digest" | "outreach" | "refresh" | "maintenance";
interface Rollup {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}
interface LastRun {
  startedAt: string;
  finishedAt: string | null;
  status: string;
  summary: Record<string, unknown> | null;
  error: string | null;
  triggeredBy: string;
}
interface Job {
  id: string;
  name: string;
  description: string;
  recipientCohort: string;
  audience: string;
  fn: Fn;
  schedule: string;
  humanSchedule: string;
  path: string;
  emailTypes: string[];
  successSignal: string | null;
  relatedAdminPath: string | null;
  isEmail: boolean;
  paused: boolean;
  pause: { reason: string | null; by: string | null; at: string | null; until: string | null } | null;
  lastRun: LastRun | null;
  runs30d: number;
  errors30d: number;
  rollup30d: Rollup | null;
}
interface Alert {
  jobId: string;
  alertKey: string;
  severity: "error" | "warn";
  message: string;
  value: number | null;
  worseIsHigher: boolean;
  worsened?: boolean;
  details?: Array<{ jobId: string; name: string; detail: string }>;
}
interface AckedAlert {
  jobId: string;
  alertKey: string;
  message: string;
  ackedBy: string;
  ackedAt: string;
  snoozeUntil: string | null;
  note: string | null;
}
interface ApiResponse {
  windowDays: number;
  summary: { total: number; active: number; paused: number; errored: number; sends30d: number; bounces30d: number; complaints30d: number };
  needsAttention: Alert[];
  acknowledged: AckedAlert[];
  jobs: Job[];
  note: string;
}

const FN_LABEL: Record<Fn, string> = { nudge: "nudge", alert: "alert", digest: "digest", outreach: "outreach", refresh: "data refresh", maintenance: "maintenance" };

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function pct(n: number, of: number): string {
  return of <= 0 ? "—" : `${Math.round((n / of) * 100)}%`;
}
function summaryLine(s: Record<string, unknown> | null): string {
  if (!s) return "";
  const parts: string[] = [];
  if (typeof s.processed === "number") parts.push(`processed ${s.processed}`);
  if (typeof s.sent === "number") parts.push(`sent ${s.sent}`);
  if (typeof s.skipped === "number") parts.push(`skipped ${s.skipped}`);
  if (s.reason) parts.push(String(s.reason));
  return parts.join(" · ");
}
function statusBadge(j: Job): { label: string; cls: string } {
  if (j.paused) return { label: "Paused", cls: "bg-amber-100 text-amber-700" };
  if (j.lastRun?.status === "error" || j.errors30d > 0) return { label: "Errors", cls: "bg-red-100 text-red-700" };
  return { label: "Active", cls: "bg-emerald-50 text-emerald-700" };
}

const COLLAPSE_KEY = "automations:collapsed";
type Filter = "all" | "email" | "errored" | "paused";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? "rotate-90" : ""}`} fill="none">
      <path d="M3 1.5 L7 5 L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AutomationsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showAcked, setShowAcked] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  const toggleCollapse = (audience: string) => {
    setCollapsed((c) => {
      const next = { ...c, [audience]: !c[audience] };
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/automations");
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function post(payload: Record<string, unknown>, busyKey: string) {
    setBusy(busyKey);
    try {
      const r = await fetch("/api/admin/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      await load();
    } catch (e) {
      alert(`Failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(null);
    }
  }
  async function togglePause(job: Job) {
    if (job.paused) {
      if (!confirm(`Resume "${job.name}"? It will run on its normal schedule again.`)) return;
      await post({ job_id: job.id, action: "resume" }, `pause:${job.id}`);
    } else {
      const reason = prompt(`Pause "${job.name}"?\n\nIt stops sending/running but still logs a "skipped (paused)" entry each cycle. Auto-resumes in 30 days.\n\nReason (optional):`);
      if (reason === null) return;
      await post({ job_id: job.id, action: "pause", reason, days: 30 }, `pause:${job.id}`);
    }
  }
  async function ackAlert(a: Alert, snoozeDays: number | null) {
    const payload: Record<string, unknown> = { action: "ack_alert", job_id: a.jobId, alert_key: a.alertKey };
    if (snoozeDays) payload.snooze_days = snoozeDays;
    if (a.value !== null) payload.value_at_ack = a.value;
    await post(payload, `ack:${a.jobId}:${a.alertKey}`);
  }
  async function unackAlert(a: AckedAlert) {
    await post({ action: "unack_alert", job_id: a.jobId, alert_key: a.alertKey }, `ack:${a.jobId}:${a.alertKey}`);
  }

  const matches = useCallback(
    (j: Job): boolean => {
      if (filter === "email" && !j.isEmail) return false;
      if (filter === "errored" && !(j.lastRun?.status === "error" || j.errors30d > 0)) return false;
      if (filter === "paused" && !j.paused) return false;
      if (q.trim()) {
        const hay = `${j.name} ${j.description} ${j.recipientCohort} ${j.audience} ${j.fn} ${j.emailTypes.join(" ")}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    },
    [filter, q],
  );

  const groups = useMemo(() => {
    if (!data) return [];
    const order: string[] = [];
    const byAud = new Map<string, Job[]>();
    for (const j of data.jobs) {
      if (!matches(j)) continue;
      if (!byAud.has(j.audience)) {
        byAud.set(j.audience, []);
        order.push(j.audience);
      }
      byAud.get(j.audience)!.push(j);
    }
    return order.map((a) => ({ audience: a, jobs: byAud.get(a)! }));
  }, [data, matches]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Automations</h1>
          {data && data.needsAttention.length > 0 && <span className="text-xs text-amber-700">{data.needsAttention.length} need{data.needsAttention.length === 1 ? "s" : ""} attention</span>}
        </div>
        <button onClick={load} className="text-sm text-gray-400 hover:text-gray-700">Refresh</button>
      </div>

      {data && (
        <p className="text-sm text-gray-500 mb-4">
          {data.summary.total} automations · <span className="text-emerald-700">{data.summary.active} active</span>
          {data.summary.paused > 0 && <> · <span className="text-amber-700">{data.summary.paused} paused</span></>}
          {data.summary.errored > 0 && <> · <span className="text-red-600">{data.summary.errored} errored</span></>}
          {" · "}
          {data.summary.sends30d.toLocaleString()} sends / {data.summary.bounces30d} bounced{data.summary.complaints30d > 0 ? ` / ${data.summary.complaints30d} complaints` : ""} this month{" "}
          <span className="text-gray-300" title={data.note}>ⓘ</span>
        </p>
      )}

      {loading && <div className="text-gray-400 text-sm">Loading…</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>}

      {/* alerts */}
      {data && (data.needsAttention.length > 0 || data.acknowledged.length > 0) && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3">
          {data.needsAttention.length === 0 && data.acknowledged.length > 0 && <div className="text-sm text-gray-500">Nothing needs attention right now.</div>}
          {data.needsAttention.map((a) => {
            const k = `${a.jobId}\x1f${a.alertKey}`;
            const open = !!expandedAlerts[k];
            const ackBusy = busy === `ack:${a.jobId}:${a.alertKey}`;
            return (
              <div key={k} className="flex items-start gap-2.5 py-1.5 text-sm">
                <span className={`mt-0.5 ${a.severity === "error" ? "text-red-500" : "text-amber-500"}`}>{a.severity === "error" ? "●" : "▲"}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-gray-700">
                    {a.message}
                    {a.worsened && <span className="text-red-600"> (worsened since acknowledged)</span>}
                    {a.details && a.details.length > 0 && (
                      <button onClick={() => setExpandedAlerts((e) => ({ ...e, [k]: !open }))} className="ml-2 text-gray-400 hover:text-gray-600 text-xs">{open ? "hide" : `details (${a.details.length})`}</button>
                    )}
                  </div>
                  {open && a.details && (
                    <ul className="mt-1 ml-1 space-y-0.5">
                      {a.details.map((d) => (
                        <li key={d.jobId} className="text-xs text-gray-500">
                          <Link href={`/admin/automations/${d.jobId}`} className="text-gray-600 hover:underline">{d.name}</Link> — {d.detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {a.jobId !== "group" && <Link href={`/admin/automations/${a.jobId}`} className="text-xs text-gray-400 hover:text-gray-700">open ›</Link>}
                  <button disabled={ackBusy} onClick={() => ackAlert(a, 7)} className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-40">snooze 7d</button>
                  <button disabled={ackBusy} onClick={() => ackAlert(a, null)} className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-40">acknowledge</button>
                </div>
              </div>
            );
          })}
          {data.acknowledged.length > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-amber-200/60">
              <button onClick={() => setShowAcked((s) => !s)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <Chevron open={showAcked} /> {data.acknowledged.length} acknowledged
              </button>
              {showAcked && (
                <ul className="mt-1 space-y-1">
                  {data.acknowledged.map((a) => {
                    const ackBusy = busy === `ack:${a.jobId}:${a.alertKey}`;
                    return (
                      <li key={`${a.jobId}\x1f${a.alertKey}`} className="text-xs text-gray-500 flex items-start gap-2">
                        <span className="min-w-0 flex-1">
                          {a.message}{" "}
                          <span className="text-gray-400">— {a.snoozeUntil ? `snoozed until ${new Date(a.snoozeUntil).toLocaleDateString()}` : "acknowledged"} by {a.ackedBy} {timeAgo(a.ackedAt)}{a.note ? ` ("${a.note}")` : ""}</span>
                        </span>
                        <button disabled={ackBusy} onClick={() => unackAlert(a)} className="text-gray-400 hover:text-gray-700 disabled:opacity-40 shrink-0">un-acknowledge</button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* filter */}
      {data && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter automations…" className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg w-56 focus:border-gray-400 focus:outline-none" />
          {(["all", "email", "errored", "paused"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-2.5 py-1 rounded-full ${filter === f ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              {f === "all" ? "All" : f === "email" ? "Email" : f === "errored" ? "Errored" : "Paused"}
            </button>
          ))}
        </div>
      )}

      {data && groups.length === 0 && !loading && <div className="text-gray-400 text-sm">No automations match.</div>}

      {data &&
        groups.map(({ audience, jobs }) => {
          const isCollapsed = !!collapsed[audience];
          return (
            <div key={audience} className="mb-5">
              <button onClick={() => toggleCollapse(audience)} className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 hover:text-gray-600 mb-2">
                <Chevron open={!isCollapsed} />
                <span>{audience}</span>
                <span className="text-gray-300 font-normal normal-case">· {jobs.length}</span>
              </button>
              {!isCollapsed && (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                  {jobs.map((job) => {
                    const badge = statusBadge(job);
                    const r = job.rollup30d;
                    const hasRun = !!job.lastRun;
                    return (
                      <div key={job.id} className="group relative px-4 py-2.5 hover:bg-gray-50/70 transition-colors">
                        <Link href={`/admin/automations/${job.id}`} className="absolute inset-0" aria-label={`Open ${job.name}`} />
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">{job.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{FN_LABEL[job.fn]}</span>
                              <span className="text-xs text-gray-400">{job.humanSchedule}</span>
                            </div>
                            {(hasRun || r) && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {hasRun && (
                                  <>
                                    Last run {timeAgo(job.lastRun!.startedAt)} ·{" "}
                                    <span className={job.lastRun!.status === "error" ? "text-red-600" : job.lastRun!.status === "skipped_paused" ? "text-amber-600" : "text-gray-500"}>{job.lastRun!.status}</span>
                                    {job.lastRun!.triggeredBy !== "cron" ? ` · ${job.lastRun!.triggeredBy}` : ""}
                                    {summaryLine(job.lastRun!.summary) ? ` · ${summaryLine(job.lastRun!.summary)}` : ""}
                                    {job.runs30d > 0 ? ` · ${job.runs30d}/30d${job.errors30d > 0 ? `, ${job.errors30d} err` : ""}` : ""}
                                    {r ? " · " : ""}
                                  </>
                                )}
                                {r && <>{r.sent.toLocaleString()} sent · {pct(r.opened, r.sent)} open · {pct(r.clicked, r.sent)} click{r.bounced > 0 ? <span className="text-red-500"> · {r.bounced} bounced</span> : ""}{r.complained > 0 ? <span className="text-red-500"> · {r.complained} complaints</span> : ""} — 30d</>}
                              </div>
                            )}
                          </div>
                          <div className="relative z-10 flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button disabled={busy === `pause:${job.id}`} onClick={() => togglePause(job)} className={`text-xs px-2 py-0.5 rounded border ${job.paused ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-gray-200 text-gray-500 hover:bg-gray-100"} disabled:opacity-40`}>
                              {busy === `pause:${job.id}` ? "…" : job.paused ? "Resume" : "Pause"}
                            </button>
                            <span className="text-gray-300 text-sm">→</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
