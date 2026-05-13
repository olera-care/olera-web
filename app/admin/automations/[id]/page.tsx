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

type RecipientStatus = "all" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | "undelivered";
interface RecipientRow {
  id: string;
  recipient: string;
  recipient_type: string | null;
  provider_id: string | null;
  subject: string;
  email_type: string;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  delivered_at: string | null;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  last_event_type: string | null;
  last_event_at: string | null;
}
interface RecipientsResponse {
  run: { id: string; started_at: string; finished_at: string | null; status: string; summary: Record<string, unknown> | null; triggered_by: string } | null;
  rollup: Rollup;
  columnMissing: boolean;
  pageSize: number;
  page: number;
  status: string;
  total: number;
  recipients: RecipientRow[];
  note: string | null;
}

const RECIPIENT_FILTERS: { key: RecipientStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "opened", label: "Opened" },
  { key: "clicked", label: "Clicked" },
  { key: "bounced", label: "Bounced" },
  { key: "complained", label: "Complained" },
  { key: "undelivered", label: "Not delivered" },
];

function recipientLifecycle(e: RecipientRow): { label: string; cls: string } {
  if (e.complained_at) return { label: "complained", cls: "bg-red-100 text-red-700" };
  if (e.bounced_at) return { label: "bounced", cls: "bg-red-100 text-red-700" };
  if (e.status === "failed") return { label: "failed", cls: "bg-red-100 text-red-700" };
  if (e.first_clicked_at) return { label: "clicked", cls: "bg-emerald-100 text-emerald-700" };
  if (e.first_opened_at) return { label: "opened", cls: "bg-teal-100 text-teal-700" };
  if (e.delivered_at) return { label: "delivered", cls: "bg-gray-100 text-gray-600" };
  return { label: e.status || "sent", cls: "bg-gray-100 text-gray-500" };
}
function runOptionLabel(r: { started_at: string; status: string; summary: Record<string, unknown> | null }): string {
  const rawSent = r.summary?.sent;
  const sent = typeof rawSent === "number" ? rawSent : null;
  const when = new Date(r.started_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return `${when} · ${r.status}${sent != null ? ` · ${sent} sent` : ""}`;
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
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [recipientStatus, setRecipientStatus] = useState<RecipientStatus>("all");
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipients, setRecipients] = useState<RecipientsResponse | "loading" | "error" | null>(null);

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
      // Default the recipients view to the most recent run that actually sent something.
      const bestRun = d.runs.find((r) => { const s = r.summary?.sent; return typeof s === "number" && s > 0; }) ?? d.runs[0] ?? null;
      setSelectedRun((prev) => prev ?? bestRun?.id ?? null);
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

  // load the per-recipient table when the chosen run / filter / page changes
  useEffect(() => {
    if (!id || !selectedRun) {
      setRecipients(null);
      return;
    }
    setRecipients("loading");
    const p = new URLSearchParams({ run: selectedRun, status: recipientStatus, page: String(recipientPage) });
    let cancelled = false;
    fetch(`/api/admin/automations/${id}/recipients?${p.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => { if (!cancelled) setRecipients(d as RecipientsResponse); })
      .catch(() => { if (!cancelled) setRecipients("error"); });
    return () => { cancelled = true; };
  }, [id, selectedRun, recipientStatus, recipientPage]);

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

          {/* Per-recipient table for a chosen run */}
          {data.job.emailTypes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Recipients</div>
                {data.runs.length > 0 && (
                  <select
                    value={selectedRun ?? ""}
                    onChange={(e) => { setSelectedRun(e.target.value || null); setRecipientPage(1); setRecipientStatus("all"); }}
                    className="text-xs border border-gray-300 rounded px-1.5 py-0.5 max-w-[24rem]"
                  >
                    {data.runs.map((r) => <option key={r.id} value={r.id}>{runOptionLabel(r)}</option>)}
                  </select>
                )}
              </div>

              {data.runs.length === 0 && <div className="text-sm text-gray-400">No runs recorded yet — recipients show up once this deploys and a run fires.</div>}
              {recipients === "loading" && <div className="text-sm text-gray-400">Loading recipients…</div>}
              {recipients === "error" && <div className="text-sm text-gray-400">Couldn’t load recipients for this run.</div>}

              {recipients && typeof recipients === "object" && (
                recipients.columnMissing ? (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{recipients.note}</div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm bg-gray-50 rounded-lg px-3 py-2 mb-2">
                      <span><span className="font-semibold text-gray-900">{recipients.rollup.sent.toLocaleString()}</span> in this run</span>
                      <span title="Delivered / in run">{pct(recipients.rollup.delivered, recipients.rollup.sent)} delivered</span>
                      <span title="Opened / in run — inflated by Apple Mail Privacy Protection">{pct(recipients.rollup.opened, recipients.rollup.sent)} open</span>
                      <span title="Clicked / in run — inflated by Apple Mail link prefetch">{pct(recipients.rollup.clicked, recipients.rollup.sent)} click</span>
                      {recipients.rollup.bounced > 0 && <span className="text-red-600">{recipients.rollup.bounced} bounced</span>}
                      {recipients.rollup.complained > 0 && <span className="text-red-600">{recipients.rollup.complained} complaints</span>}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {RECIPIENT_FILTERS.map((f) => (
                        <button
                          key={f.key}
                          onClick={() => { setRecipientStatus(f.key); setRecipientPage(1); }}
                          className={`text-xs px-2 py-0.5 rounded-full border ${recipientStatus === f.key ? "border-gray-800 bg-gray-800 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {recipients.recipients.length === 0 ? (
                      (() => {
                        if (recipients.rollup.sent > 0) return <div className="text-sm text-gray-400">No recipients match this filter.</div>;
                        const runSent = recipients.run?.summary?.sent;
                        const reported = typeof runSent === "number" ? runSent : 0;
                        return reported > 0 ? (
                          <div className="text-sm text-gray-400">This run reported {reported.toLocaleString()} sent, but none are linked here — runs from before migration 083 / this deploy aren’t backfilled.</div>
                        ) : (
                          <div className="text-sm text-gray-400">No emails linked to this run.</div>
                        );
                      })()
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left px-3 py-1.5 font-medium text-gray-500">Recipient</th>
                                <th className="text-left px-3 py-1.5 font-medium text-gray-500">Sent</th>
                                <th className="text-center px-2 py-1.5 font-medium text-gray-500" title="Delivered">Del</th>
                                <th className="text-center px-2 py-1.5 font-medium text-gray-500" title="Opened">Open</th>
                                <th className="text-center px-2 py-1.5 font-medium text-gray-500" title="Clicked">Click</th>
                                <th className="text-left px-3 py-1.5 font-medium text-gray-500">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {recipients.recipients.map((e) => {
                                const lc = recipientLifecycle(e);
                                const rawVariant = e.metadata?.variant;
                                const variant = typeof rawVariant === "string" ? rawVariant : null;
                                return (
                                  <tr key={e.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-1.5">
                                      {e.provider_id ? (
                                        <Link href={`/admin/directory/${e.provider_id}`} className="text-teal-700 hover:underline">{e.recipient}</Link>
                                      ) : (
                                        <span className="text-gray-800">{e.recipient}</span>
                                      )}
                                      {(e.recipient_type || variant) && (
                                        <span className="text-[11px] text-gray-400 ml-1.5">{[e.recipient_type, variant].filter(Boolean).join(" · ")}</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-500" title={new Date(e.created_at).toLocaleString()}>{timeAgo(e.created_at)}</td>
                                    <td className="px-2 py-1.5 text-center" title={e.delivered_at ? new Date(e.delivered_at).toLocaleString() : "not delivered"}>{e.delivered_at ? <span className="text-emerald-600">✓</span> : <span className="text-gray-300">·</span>}</td>
                                    <td className="px-2 py-1.5 text-center" title={e.first_opened_at ? new Date(e.first_opened_at).toLocaleString() : "not opened"}>{e.first_opened_at ? <span className="text-emerald-600">✓</span> : <span className="text-gray-300">·</span>}</td>
                                    <td className="px-2 py-1.5 text-center" title={e.first_clicked_at ? new Date(e.first_clicked_at).toLocaleString() : "not clicked"}>{e.first_clicked_at ? <span className="text-emerald-600">✓</span> : <span className="text-gray-300">·</span>}</td>
                                    <td className="px-3 py-1.5 whitespace-nowrap"><span className={`text-[11px] px-1.5 py-0.5 rounded ${lc.cls}`}>{lc.label}</span>{e.error_message && <span className="text-red-600 text-[11px] ml-1">{e.error_message}</span>}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {(() => {
                          const from = (recipients.page - 1) * recipients.pageSize + 1;
                          const to = Math.min(recipients.page * recipients.pageSize, recipients.total);
                          const hasPrev = recipients.page > 1;
                          const hasNext = recipients.page * recipients.pageSize < recipients.total;
                          return (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <span>{from.toLocaleString()}–{to.toLocaleString()} of {recipients.total.toLocaleString()}</span>
                              <button disabled={!hasPrev} onClick={() => setRecipientPage((p) => Math.max(1, p - 1))} className="px-2 py-0.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                              <button disabled={!hasNext} onClick={() => setRecipientPage((p) => p + 1)} className="px-2 py-0.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Next →</button>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </>
                )
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
