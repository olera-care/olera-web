"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Rollup {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
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
interface DetailResponse {
  job: {
    id: string;
    name: string;
    description: string;
    recipientCohort: string;
    audience: string;
    fn: string;
    schedule: string;
    humanSchedule: string;
    path: string;
    emailTypes: string[];
    successSignal: string | null;
    relatedAdminPath: string | null;
    isEmail: boolean;
  };
  paused: boolean;
  pause: { reason: string | null; by: string | null; at: string | null; until: string | null } | null;
  rollup30d: Rollup | null;
  trend: Array<{ week: string; sent: number; delivered: number; opened: number; clicked: number }>;
  previewTypes: string[];
  runs: RunRow[];
  windowDays: number;
}
interface PreviewResponse {
  type: string;
  html: string;
  recipient: string;
  subject: string;
  sentAt: string;
  metadata: Record<string, unknown> | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function duration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`;
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
  if (s.skipReasons && typeof s.skipReasons === "object") {
    const sr = Object.entries(s.skipReasons as Record<string, number>).map(([k, v]) => `${k}=${v}`).join(", ");
    if (sr) parts.push(`(${sr})`);
  }
  return parts.join(" · ");
}
function runStatusCls(status: string): string {
  if (status === "error") return "text-red-600";
  if (status === "skipped_paused") return "text-amber-700";
  if (status === "running") return "text-blue-600";
  return "text-gray-600";
}

export default function AutomationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | "loading" | "none" | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/automations/${id}`);
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      const d: DetailResponse = await r.json();
      setData(d);
      // Pick a default preview type, but don't clobber a selection the user already made.
      setPreviewType((prev) => prev ?? (d.previewTypes[0] ?? null));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  // load preview when type changes
  useEffect(() => {
    if (!id || !previewType) return;
    setPreview("loading");
    fetch(`/api/admin/automations/${id}/preview?type=${encodeURIComponent(previewType)}`)
      .then((r) => (r.ok ? r.json() : r.status === 404 ? Promise.resolve("none") : Promise.reject(new Error())))
      .then((d) => setPreview(d === "none" ? "none" : (d as PreviewResponse)))
      .catch(() => setPreview("none"));
  }, [id, previewType]);

  async function togglePause() {
    if (!data) return;
    const job = data.job;
    if (data.paused) {
      if (!confirm(`Resume "${job.name}"?`)) return;
      setBusy(true);
      try {
        const r = await fetch("/api/admin/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: job.id, action: "resume" }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
        await load();
      } catch (e) {
        alert(`Failed: ${e instanceof Error ? e.message : e}`);
      } finally {
        setBusy(false);
      }
    } else {
      const reason = prompt(`Pause "${job.name}"? It stops running but still logs a skipped entry each cycle; auto-resumes in 30 days.\n\nReason (optional):`);
      if (reason === null) return;
      setBusy(true);
      try {
        const r = await fetch("/api/admin/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: job.id, action: "pause", reason, days: 30 }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
        await load();
      } catch (e) {
        alert(`Failed: ${e instanceof Error ? e.message : e}`);
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/automations" className="text-sm text-gray-500 hover:text-gray-800">← Automations</Link>
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>}

      {data && (
        <>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{data.job.name}</h1>
                {data.paused && <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">Paused</span>}
              </div>
              <div className="text-sm text-gray-400 mt-0.5">
                {data.job.audience} · {data.job.fn} · {data.job.humanSchedule} · <code className="text-gray-500">{data.job.path}</code> · <code className="text-gray-500">{data.job.schedule}</code>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {data.job.relatedAdminPath && <Link href={data.job.relatedAdminPath} className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">Related queue →</Link>}
              <button disabled={busy} onClick={togglePause} className={`text-xs px-2.5 py-1 rounded border ${data.paused ? "border-green-300 text-green-700 hover:bg-green-50" : "border-gray-300 text-gray-600 hover:bg-gray-50"} disabled:opacity-50`}>
                {busy ? "…" : data.paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-1">{data.job.description}</p>
          <p className="text-sm text-gray-500 mb-1"><span className="text-gray-400">Who gets it:</span> {data.job.recipientCohort}</p>
          {data.job.successSignal && <p className="text-sm text-gray-500 mb-1"><span className="text-gray-400">Success signal:</span> {data.job.successSignal}</p>}
          {data.job.emailTypes.length > 0 && (
            <p className="text-sm text-gray-500 mb-1">
              <span className="text-gray-400">Email types:</span>{" "}
              {data.job.emailTypes.map((t) => <Link key={t} href={`/admin/emails?type=${t}`} className="text-teal-700 hover:underline mr-2">{t}</Link>)}
            </p>
          )}
          {data.paused && data.pause && (
            <p className="text-sm text-amber-700 mb-1">Paused {timeAgo(data.pause.at)} by {data.pause.by ?? "—"}{data.pause.reason ? ` — "${data.pause.reason}"` : ""}{data.pause.until ? ` · auto-resumes ${new Date(data.pause.until).toLocaleDateString()}` : ""}</p>
          )}

          {/* 30-day rollup */}
          {data.rollup30d ? (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm bg-gray-50 rounded-lg px-4 py-3">
              <span><span className="font-semibold text-gray-900">{data.rollup30d.sent.toLocaleString()}</span> sent (30d)</span>
              <span title="Delivered / sent">{pct(data.rollup30d.delivered, data.rollup30d.sent)} delivered</span>
              <span title="Opened / sent — inflated by Apple Mail Privacy Protection">{pct(data.rollup30d.opened, data.rollup30d.sent)} open</span>
              <span title="Clicked / sent — inflated by Apple Mail link prefetch">{pct(data.rollup30d.clicked, data.rollup30d.sent)} click</span>
              {data.rollup30d.bounced > 0 && <span className="text-red-600">{data.rollup30d.bounced} bounced</span>}
              {data.rollup30d.complained > 0 && <span className="text-red-600">{data.rollup30d.complained} complaints</span>}
            </div>
          ) : data.job.isEmail ? (
            <div className="mt-4 text-sm text-gray-400">Sends email via a helper; email_type not yet mapped in the registry — rollup unavailable.</div>
          ) : (
            <div className="mt-4 text-sm text-gray-400">{data.job.fn === "refresh" ? "Data refresh job" : "Maintenance job"} — no email rollup.</div>
          )}

          {/* 4-week trend */}
          {data.trend.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Last 4 weeks</div>
              <table className="text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs">
                    <th className="text-left pr-6 font-normal">Week of</th><th className="text-right pr-6 font-normal">Sent</th><th className="text-right pr-6 font-normal">Delivered</th><th className="text-right pr-6 font-normal">Open</th><th className="text-right font-normal">Click</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trend.map((w) => (
                    <tr key={w.week} className="text-gray-700">
                      <td className="pr-6">{new Date(w.week).toLocaleDateString()}</td>
                      <td className="text-right pr-6 tabular-nums">{w.sent}</td>
                      <td className="text-right pr-6 tabular-nums">{pct(w.delivered, w.sent)}</td>
                      <td className="text-right pr-6 tabular-nums">{pct(w.opened, w.sent)}</td>
                      <td className="text-right tabular-nums">{pct(w.clicked, w.sent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Email preview */}
          {data.previewTypes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Most recent email sent</div>
                {data.previewTypes.length > 1 && (
                  <select value={previewType ?? ""} onChange={(e) => setPreviewType(e.target.value)} className="text-xs border border-gray-300 rounded px-1.5 py-0.5">
                    {data.previewTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
                {previewType && <a href={`/api/admin/automations/${id}/preview?type=${encodeURIComponent(previewType)}&raw=1`} target="_blank" rel="noreferrer" className="text-xs text-teal-700 hover:underline">open in new tab ↗</a>}
              </div>
              {preview === "loading" && <div className="text-sm text-gray-400">Loading preview…</div>}
              {preview === "none" && <div className="text-sm text-gray-400">No rendered email on file yet for this type.</div>}
              {preview && typeof preview === "object" && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    To <code>{preview.recipient}</code> · &ldquo;{preview.subject}&rdquo; · {timeAgo(preview.sentAt)}
                  </div>
                  <iframe srcDoc={preview.html} title="Email preview" className="w-full h-[600px] border border-gray-200 rounded-lg bg-white" sandbox="" />
                </div>
              )}
            </div>
          )}

          {/* Run history */}
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Run history (last 100)</div>
            {data.runs.length === 0 ? (
              <div className="text-sm text-gray-400">No runs recorded yet — instrumentation lands once this deploys (and crons only fire on production, not preview deploys).</div>
            ) : (
              <div className="space-y-0.5 font-mono text-[11px]">
                {data.runs.map((run) => (
                  <div key={run.id} className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-gray-500 whitespace-nowrap" title={new Date(run.started_at).toLocaleString()}>{timeAgo(run.started_at)}</span>
                    <span className={runStatusCls(run.status)}>{run.status}</span>
                    <span className="text-gray-400">{duration(run.started_at, run.finished_at)}</span>
                    {run.triggered_by !== "cron" && <span className="text-gray-400">{run.triggered_by}</span>}
                    {summaryLine(run.summary) && <span className="text-gray-600">{summaryLine(run.summary)}</span>}
                    {run.error && <span className="text-red-600">· {run.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
