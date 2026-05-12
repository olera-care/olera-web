"use client";

import { useCallback, useEffect, useState } from "react";

interface JobRollup {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}
interface JobLastRun {
  startedAt: string;
  finishedAt: string | null;
  status: string;
  summary: Record<string, unknown> | null;
  error: string | null;
  triggeredBy: string;
}
interface RunRow {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  summary: Record<string, unknown> | null;
  error: string | null;
  triggered_by: string;
}
interface Job {
  id: string;
  name: string;
  description: string;
  category: string;
  kind: "email" | "data-refresh" | "maintenance";
  schedule: string;
  humanSchedule: string;
  path: string;
  emailTypes: string[];
  successSignal?: string;
  paused: boolean;
  pause: { reason: string | null; by: string | null; at: string | null; until: string | null } | null;
  lastRun: JobLastRun | null;
  runs30d: number;
  errors30d: number;
  rollup30d: JobRollup | null;
}
interface ApiResponse {
  windowDays: number;
  jobs: Job[];
  note: string;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function pct(n: number, of: number): string {
  if (of <= 0) return "—";
  return `${Math.round((n / of) * 100)}%`;
}

function duration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`;
}

function runStatusCls(status: string): string {
  if (status === "error") return "text-red-600";
  if (status === "skipped_paused") return "text-amber-700";
  if (status === "running") return "text-blue-600";
  return "text-gray-600";
}

function statusBadge(job: Job): { label: string; cls: string } {
  if (job.paused) return { label: "Paused", cls: "bg-amber-100 text-amber-800 border border-amber-300" };
  if (job.lastRun?.status === "error" || job.errors30d > 0)
    return { label: "Errors", cls: "bg-red-100 text-red-800 border border-red-200" };
  return { label: "Active", cls: "bg-green-100 text-green-800 border border-green-200" };
}

function summaryLine(s: Record<string, unknown> | null): string {
  if (!s) return "";
  const parts: string[] = [];
  if (typeof s.processed === "number") parts.push(`processed ${s.processed}`);
  if (typeof s.sent === "number") parts.push(`sent ${s.sent}`);
  if (typeof s.skipped === "number") parts.push(`skipped ${s.skipped}`);
  if (s.skipped === "paused" || s.reason) parts.push(String(s.reason ?? "paused"));
  if (s.skipReasons && typeof s.skipReasons === "object") {
    const sr = Object.entries(s.skipReasons as Record<string, number>)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    if (sr) parts.push(`(${sr})`);
  }
  return parts.join(" · ");
}

export default function AutomationsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runsCache, setRunsCache] = useState<Record<string, RunRow[] | "loading" | "error">>({});

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

  // Lazy-load run history when a job is expanded (cached per job).
  useEffect(() => {
    if (!expanded || expanded in runsCache) return;
    const jobId = expanded;
    setRunsCache((c) => ({ ...c, [jobId]: "loading" }));
    fetch(`/api/admin/automations/runs?job=${encodeURIComponent(jobId)}&limit=20`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d) => setRunsCache((c) => ({ ...c, [jobId]: (d.runs ?? []) as RunRow[] })))
      .catch(() => setRunsCache((c) => ({ ...c, [jobId]: "error" })));
  }, [expanded, runsCache]);

  async function togglePause(job: Job) {
    if (job.paused) {
      if (!confirm(`Resume "${job.name}"? It will run on its normal schedule again.`)) return;
      setBusy(job.id);
      try {
        const r = await fetch("/api/admin/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: job.id, action: "resume" }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
        await load();
      } catch (e) {
        alert(`Failed to resume: ${e instanceof Error ? e.message : e}`);
      } finally {
        setBusy(null);
      }
    } else {
      const reason = prompt(
        `Pause "${job.name}"?\n\nIt will stop sending/running but still log a "skipped (paused)" entry each cycle. Auto-resumes in 30 days.\n\nReason (optional):`,
      );
      if (reason === null) return; // cancelled
      setBusy(job.id);
      try {
        const r = await fetch("/api/admin/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: job.id, action: "pause", reason, days: 30 }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
        await load();
      } catch (e) {
        alert(`Failed to pause: ${e instanceof Error ? e.message : e}`);
      } finally {
        setBusy(null);
      }
    }
  }

  const pausedCount = data?.jobs.filter((j) => j.paused).length ?? 0;
  const categories = data ? [...new Set(data.jobs.map((j) => j.category))] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
        <button onClick={load} className="text-sm text-gray-500 hover:text-gray-800">
          Refresh
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Every scheduled job in the codebase — what it does, when it runs, its last result, and the last 30 days of
        sends. {data?.note ? <span className="text-gray-400">{data.note}</span> : null}
      </p>

      {pausedCount > 0 && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ {pausedCount} automation{pausedCount === 1 ? "" : "s"} paused. They still log a skipped entry each cycle
          and auto-resume after 30 days unless resumed sooner.
        </div>
      )}

      {loading && <div className="text-gray-500">Loading…</div>}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      )}

      {data &&
        categories.map((cat) => (
          <div key={cat} className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{cat}</h2>
            <div className="space-y-2">
              {data.jobs
                .filter((j) => j.category === cat)
                .map((job) => {
                  const badge = statusBadge(job);
                  const open = expanded === job.id;
                  const r = job.rollup30d;
                  return (
                    <div key={job.id} className="rounded-lg border border-gray-200 bg-white">
                      <div className="px-4 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{job.name}</span>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                              <span className="text-xs text-gray-400">{job.humanSchedule}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                            <div className="text-xs text-gray-500 mt-1.5">
                              {job.lastRun ? (
                                <>
                                  Last run {timeAgo(job.lastRun.startedAt)} ·{" "}
                                  <span
                                    className={
                                      job.lastRun.status === "error"
                                        ? "text-red-600"
                                        : job.lastRun.status === "skipped_paused"
                                          ? "text-amber-700"
                                          : "text-gray-600"
                                    }
                                  >
                                    {job.lastRun.status}
                                  </span>
                                  {job.lastRun.triggeredBy !== "cron" ? ` · ${job.lastRun.triggeredBy}` : ""}
                                  {summaryLine(job.lastRun.summary) ? ` · ${summaryLine(job.lastRun.summary)}` : ""}
                                  {job.lastRun.error ? (
                                    <span className="text-red-600"> · {job.lastRun.error}</span>
                                  ) : null}
                                </>
                              ) : (
                                <span className="text-gray-400">No runs recorded yet (instrumentation pending)</span>
                              )}
                              {job.runs30d > 0 ? (
                                <span className="text-gray-400">
                                  {" "}
                                  · {job.runs30d} run{job.runs30d === 1 ? "" : "s"}/30d
                                  {job.errors30d > 0 ? `, ${job.errors30d} error${job.errors30d === 1 ? "" : "s"}` : ""}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <button
                              disabled={busy === job.id}
                              onClick={() => togglePause(job)}
                              className={`text-xs px-2.5 py-1 rounded border ${
                                job.paused
                                  ? "border-green-300 text-green-700 hover:bg-green-50"
                                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
                              } disabled:opacity-50`}
                            >
                              {busy === job.id ? "…" : job.paused ? "Resume" : "Pause"}
                            </button>
                            <button
                              onClick={() => setExpanded(open ? null : job.id)}
                              className="text-xs text-gray-400 hover:text-gray-700"
                            >
                              {open ? "Less" : "Details"}
                            </button>
                          </div>
                        </div>

                        {/* 30-day email rollup */}
                        {r && (
                          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">
                            <span><span className="font-semibold text-gray-900">{r.sent.toLocaleString()}</span> sent (30d)</span>
                            <span title="Delivered / sent">{pct(r.delivered, r.sent)} delivered</span>
                            <span title="Opened / sent — inflated by Apple Mail Privacy Protection">
                              {pct(r.opened, r.sent)} open
                            </span>
                            <span title="Clicked / sent — inflated by Apple Mail link prefetch">
                              {pct(r.clicked, r.sent)} click
                            </span>
                            {r.bounced > 0 && <span className="text-red-600">{r.bounced} bounced</span>}
                            {r.complained > 0 && <span className="text-red-600">{r.complained} complaints</span>}
                          </div>
                        )}
                        {!r && job.kind !== "email" && (
                          <div className="mt-2 text-xs text-gray-400">{job.kind === "data-refresh" ? "Data refresh job" : "Maintenance job"} — no email rollup.</div>
                        )}
                        {!r && job.kind === "email" && job.emailTypes.length === 0 && (
                          <div className="mt-2 text-xs text-gray-400">
                            Sends email via a helper; email_type not yet mapped in the registry — rollup unavailable.
                          </div>
                        )}
                      </div>

                      {open && (
                        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 space-y-1">
                          <div>
                            <span className="text-gray-400">Path:</span> <code>{job.path}</code> ·{" "}
                            <span className="text-gray-400">Cron:</span> <code>{job.schedule}</code>
                          </div>
                          {job.emailTypes.length > 0 && (
                            <div>
                              <span className="text-gray-400">Email types:</span>{" "}
                              {job.emailTypes.map((t) => (
                                <a key={t} href={`/admin/emails?type=${t}`} className="text-teal-700 hover:underline mr-2">
                                  {t}
                                </a>
                              ))}
                            </div>
                          )}
                          {job.successSignal && (
                            <div>
                              <span className="text-gray-400">Success signal:</span> {job.successSignal}
                            </div>
                          )}
                          {job.pause && (
                            <div className="text-amber-700">
                              Paused {timeAgo(job.pause.at)} by {job.pause.by ?? "—"}
                              {job.pause.reason ? ` — "${job.pause.reason}"` : ""}
                              {job.pause.until ? ` · auto-resumes ${new Date(job.pause.until).toLocaleDateString()}` : ""}
                            </div>
                          )}
                          <div className="pt-1">
                            <div className="text-gray-400 mb-1">Recent runs (last 20)</div>
                            {runsCache[job.id] === "loading" && <div className="text-gray-400">Loading…</div>}
                            {runsCache[job.id] === "error" && (
                              <div className="text-gray-400">Couldn&apos;t load run history.</div>
                            )}
                            {Array.isArray(runsCache[job.id]) && (runsCache[job.id] as RunRow[]).length === 0 && (
                              <div className="text-gray-400">No runs recorded yet — instrumentation lands once this deploys.</div>
                            )}
                            {Array.isArray(runsCache[job.id]) && (runsCache[job.id] as RunRow[]).length > 0 && (
                              <div className="space-y-0.5 font-mono text-[11px]">
                                {(runsCache[job.id] as RunRow[]).map((run) => (
                                  <div key={run.id} className="flex items-baseline gap-2 flex-wrap">
                                    <span
                                      className="text-gray-500 whitespace-nowrap"
                                      title={new Date(run.started_at).toLocaleString()}
                                    >
                                      {timeAgo(run.started_at)}
                                    </span>
                                    <span className={runStatusCls(run.status)}>{run.status}</span>
                                    <span className="text-gray-400">{duration(run.started_at, run.finished_at)}</span>
                                    {run.triggered_by !== "cron" && (
                                      <span className="text-gray-400">{run.triggered_by}</span>
                                    )}
                                    {summaryLine(run.summary) && (
                                      <span className="text-gray-600">{summaryLine(run.summary)}</span>
                                    )}
                                    {run.error && <span className="text-red-600">· {run.error}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-gray-400 pt-1">(Per-recipient drill-down lands in Phase 2.)</div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
    </div>
  );
}
