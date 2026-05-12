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
interface ApiResponse {
  windowDays: number;
  summary: { total: number; active: number; paused: number; errored: number; sends30d: number; bounces30d: number; complaints30d: number };
  needsAttention: Array<{ jobId: string; name: string; severity: "error" | "warn"; message: string }>;
  jobs: Job[];
  note: string;
}

const FN_CHIP: Record<Fn, { label: string; cls: string }> = {
  nudge: { label: "nudge", cls: "bg-blue-50 text-blue-700" },
  alert: { label: "alert", cls: "bg-purple-50 text-purple-700" },
  digest: { label: "digest", cls: "bg-teal-50 text-teal-700" },
  outreach: { label: "outreach", cls: "bg-indigo-50 text-indigo-700" },
  refresh: { label: "data refresh", cls: "bg-gray-100 text-gray-600" },
  maintenance: { label: "maintenance", cls: "bg-gray-100 text-gray-600" },
};

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
  if (j.paused) return { label: "Paused", cls: "bg-amber-100 text-amber-800 border border-amber-300" };
  if (j.lastRun?.status === "error" || j.errors30d > 0) return { label: "Errors", cls: "bg-red-100 text-red-800 border border-red-200" };
  return { label: "Active", cls: "bg-green-100 text-green-800 border border-green-200" };
}

const COLLAPSE_KEY = "automations:collapsed";
type Filter = "all" | "email" | "errored" | "paused";

export default function AutomationsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // restore collapse state
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

  async function togglePause(job: Job) {
    if (job.paused) {
      if (!confirm(`Resume "${job.name}"? It will run on its normal schedule again.`)) return;
      setBusy(job.id);
      try {
        const r = await fetch("/api/admin/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: job.id, action: "resume" }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
        await load();
      } catch (e) {
        alert(`Failed to resume: ${e instanceof Error ? e.message : e}`);
      } finally {
        setBusy(null);
      }
    } else {
      const reason = prompt(`Pause "${job.name}"?\n\nIt stops sending/running but still logs a "skipped (paused)" entry each cycle. Auto-resumes in 30 days.\n\nReason (optional):`);
      if (reason === null) return;
      setBusy(job.id);
      try {
        const r = await fetch("/api/admin/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: job.id, action: "pause", reason, days: 30 }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
        await load();
      } catch (e) {
        alert(`Failed to pause: ${e instanceof Error ? e.message : e}`);
      } finally {
        setBusy(null);
      }
    }
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
        <button onClick={load} className="text-sm text-gray-500 hover:text-gray-800">Refresh</button>
      </div>

      {data && (
        <div className="text-sm text-gray-600 mb-4">
          <span className="font-semibold text-gray-900">{data.summary.total}</span> automations ·{" "}
          <span className="text-green-700">{data.summary.active} active</span>
          {data.summary.paused > 0 && <> · <span className="text-amber-700">{data.summary.paused} paused</span></>}
          {data.summary.errored > 0 && <> · <span className="text-red-600">{data.summary.errored} errored (7d)</span></>}
          {" · "}
          <span className="text-gray-500">
            {data.summary.sends30d.toLocaleString()} sends / {data.summary.bounces30d} bounced
            {data.summary.complaints30d > 0 ? ` / ${data.summary.complaints30d} complaints` : ""} (30d)
          </span>
          <span className="text-gray-400"> — {data.note}</span>
        </div>
      )}

      {loading && <div className="text-gray-500">Loading…</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>}

      {data && data.needsAttention.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1.5">Needs attention</div>
          <ul className="space-y-1">
            {data.needsAttention.map((a, i) => (
              <li key={i} className="text-sm">
                <Link href={`/admin/automations/${a.jobId}`} className="font-medium text-amber-900 hover:underline">{a.name}</Link>
                <span className={a.severity === "error" ? "text-red-700" : "text-amber-800"}> — {a.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter automations…"
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md w-56"
          />
          {(["all", "email", "errored", "paused"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1 rounded-full border ${filter === f ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
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
            <div key={audience} className="mb-6">
              <button onClick={() => toggleCollapse(audience)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-700 mb-2">
                <span>{isCollapsed ? "▸" : "▾"}</span>
                <span>{audience}</span>
                <span className="text-gray-300 font-normal">({jobs.length})</span>
              </button>
              {!isCollapsed && (
                <div className="space-y-1.5">
                  {jobs.map((job) => {
                    const badge = statusBadge(job);
                    const chip = FN_CHIP[job.fn];
                    const r = job.rollup30d;
                    return (
                      <div key={job.id} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/admin/automations/${job.id}`} className="font-semibold text-gray-900 hover:underline">{job.name}</Link>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${chip.cls}`}>{chip.label}</span>
                              <span className="text-xs text-gray-400">{job.humanSchedule}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {job.lastRun ? (
                                <>
                                  Last run {timeAgo(job.lastRun.startedAt)} ·{" "}
                                  <span className={job.lastRun.status === "error" ? "text-red-600" : job.lastRun.status === "skipped_paused" ? "text-amber-700" : "text-gray-600"}>{job.lastRun.status}</span>
                                  {job.lastRun.triggeredBy !== "cron" ? ` · ${job.lastRun.triggeredBy}` : ""}
                                  {summaryLine(job.lastRun.summary) ? ` · ${summaryLine(job.lastRun.summary)}` : ""}
                                  {job.runs30d > 0 ? <span className="text-gray-400"> · {job.runs30d}/30d{job.errors30d > 0 ? `, ${job.errors30d} err` : ""}</span> : null}
                                </>
                              ) : (
                                <span className="text-gray-400">No runs recorded yet</span>
                              )}
                              {r ? (
                                <span className="text-gray-400">
                                  {" "}· {r.sent.toLocaleString()} sent · {pct(r.opened, r.sent)} open · {pct(r.clicked, r.sent)} click
                                  {r.bounced > 0 ? <span className="text-red-600"> · {r.bounced} bounced</span> : null}
                                  {r.complained > 0 ? <span className="text-red-600"> · {r.complained} complaints</span> : null}
                                  {" (30d)"}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              disabled={busy === job.id}
                              onClick={() => togglePause(job)}
                              className={`text-xs px-2 py-1 rounded border ${job.paused ? "border-green-300 text-green-700 hover:bg-green-50" : "border-gray-300 text-gray-600 hover:bg-gray-50"} disabled:opacity-50`}
                            >
                              {busy === job.id ? "…" : job.paused ? "Resume" : "Pause"}
                            </button>
                            <Link href={`/admin/automations/${job.id}`} className="text-xs text-teal-700 hover:underline whitespace-nowrap">Open →</Link>
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
