"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useToast } from "@/components/admin/Toast";
import {
  RESEND_BOUNCE_LIMIT,
  RESEND_BOUNCE_WARN,
  RESEND_COMPLAINT_LIMIT,
  RESEND_COMPLAINT_WARN,
} from "@/lib/email-thresholds";
import { AUTOMATION_SYSTEMS, type AutomationSystem } from "@/lib/crons/systems";

type Fn = "nudge" | "alert" | "digest" | "outreach" | "event" | "refresh" | "maintenance";
type Lifecycle = "current" | "archived";
type Health = "healthy" | "attention" | "running" | "paused" | "event" | "archived";
type Filter = "all" | "attention" | "email" | "text" | "paused";
type View = "systems" | "all" | "archived";

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
  channels: Array<"email" | "sms">;
  lifecycle: Lifecycle;
  archivedAt: string | null;
  archiveReason: string | null;
  replacedBy: string | null;
  systemKey: string | null;
  health: Health;
  needsAttention: boolean;
  paused: boolean;
  lastRun: LastRun | null;
  runs30d: number;
  errors30d: number;
  rollup30d: Rollup | null;
  smsRollup30d: { sent: number } | null;
}
interface ApiResponse {
  windowDays: number;
  summary: {
    total: number;
    archived: number;
    active: number;
    paused: number;
    errored: number;
    needsAttention: number;
    sends30d: number;
    texts30d: number;
    complaintEvents30d: number;
    bounceEvents30d: number;
    deliveredAll30d: number;
    sentAll30d: number;
    complaintRate30d: number;
    bounceRate30d: number;
  };
  jobs: Job[];
  note: string;
}

const COLLAPSE_KEY = "automations:system-collapsed";

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtPct(rate: number, decimals: number): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

function healthLabel(job: Job): string {
  if (job.health === "attention") return "Needs attention";
  if (job.health === "running") return "Running";
  if (job.health === "paused") return "Paused";
  if (job.health === "event") return "Event-driven";
  if (job.health === "archived") return "Archived";
  return "Healthy";
}

function healthClasses(health: Health): string {
  if (health === "attention") return "bg-red-50 text-red-700 ring-red-200";
  if (health === "paused") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (health === "running") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (health === "event") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (health === "archived") return "bg-gray-100 text-gray-500 ring-gray-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function StatusBadge({ job }: { job: Job }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${healthClasses(job.health)}`}>
      {healthLabel(job)}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="mt-6 h-28 rounded-2xl bg-gray-100" />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 rounded-xl bg-gray-100" />)}
      </div>
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 rounded-2xl bg-gray-100" />)}
      </div>
    </div>
  );
}

function StatCard({ value, label, detail, tone = "default", onClick }: {
  value: ReactNode;
  label: string;
  detail: string;
  tone?: "default" | "danger" | "muted";
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className={`block text-2xl font-semibold leading-none tabular-nums ${tone === "danger" ? "text-red-600" : tone === "muted" ? "text-gray-400" : "text-gray-950"}`}>
        {value}
      </span>
      <span className="mt-2 block text-xs font-semibold text-gray-700">{label}</span>
      <span className="mt-0.5 block text-[11px] text-gray-400">{detail}</span>
    </>
  );
  const classes = "min-h-20 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${classes} transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2`}>
      {body}
    </button>
  ) : <div className={classes}>{body}</div>;
}

function JobRow({ job, busy, onTogglePause }: {
  job: Job;
  busy: string | null;
  onTogglePause: (job: Job) => void;
}) {
  const emailSent = job.rollup30d?.sent ?? 0;
  const textsSent = job.smsRollup30d?.sent ?? 0;
  const canPause = job.path.startsWith("/api/cron/");
  const activity = [
    emailSent > 0 ? `${emailSent.toLocaleString()} emails` : null,
    textsSent > 0 ? `${textsSent.toLocaleString()} texts` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="group relative px-4 py-3.5 transition-colors hover:bg-gray-50/70 sm:px-5">
      <Link href={`/admin/automations/${job.id}`} className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600" aria-label={`Open ${job.name}`} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900">{job.name}</span>
            <StatusBadge job={job} />
            {job.channels.includes("email") && <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Email</span>}
            {job.channels.includes("sms") && <span className="text-[10px] font-medium uppercase tracking-wide text-sky-600">Text</span>}
          </div>
          <p className="mt-1 truncate text-xs text-gray-500" title={job.description}>{job.description}</p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
          <div className="text-left text-[11px] text-gray-400 sm:w-36 sm:text-right">
            <span className="block font-medium text-gray-600">{activity || (job.fn === "event" ? "Triggered by activity" : "No messages · 30d")}</span>
            <span className="mt-0.5 block">{job.fn === "event" ? "Runs when activity occurs" : `Last run ${timeAgo(job.lastRun?.startedAt ?? null)}`}</span>
          </div>
          {canPause && (
            <button
              type="button"
              disabled={busy === `pause:${job.id}`}
              onClick={() => onTogglePause(job)}
              className={`relative z-10 inline-flex min-h-8 items-center rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:opacity-40 ${job.paused ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {busy === `pause:${job.id}` ? "…" : job.paused ? "Resume" : "Pause"}
            </button>
          )}
          <span className="text-gray-300 transition-colors group-hover:text-gray-600" aria-hidden="true">→</span>
        </div>
      </div>
    </div>
  );
}

function SystemSection({ system, jobs, collapsed, onToggle, busy, onTogglePause }: {
  system: AutomationSystem;
  jobs: Job[];
  collapsed: boolean;
  onToggle: () => void;
  busy: string | null;
  onTogglePause: (job: Job) => void;
}) {
  const attention = jobs.filter((job) => job.needsAttention).length;
  const paused = jobs.filter((job) => job.paused).length;
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 sm:px-6"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-gray-950">{system.label}</span>
            {attention > 0 ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">{attention} need attention</span>
            ) : paused > 0 ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{paused} paused</span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Healthy</span>
            )}
          </span>
          <span className="mt-1 block max-w-2xl text-xs leading-relaxed text-gray-500">{system.description}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-xs text-gray-400">
          <span>{jobs.length} automation{jobs.length === 1 ? "" : "s"}</span>
          <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
        </span>
      </button>
      {!collapsed && <div className="divide-y divide-gray-100 border-t border-gray-100">{jobs.map((job) => <JobRow key={job.id} job={job} busy={busy} onTogglePause={onTogglePause} />)}</div>}
    </section>
  );
}

export default function AutomationsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("systems");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ "platform-operations": true });
  const toast = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) setCollapsed({ "platform-operations": true, ...JSON.parse(raw) });
    } catch { /* local preference is best-effort */ }
  }, []);

  const persistCollapsed = (next: Record<string, boolean>) => {
    setCollapsed(next);
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const response = await fetch("/api/admin/automations");
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `HTTP ${response.status}`);
      setData(await response.json());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to load automations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function post(payload: Record<string, unknown>, busyKey: string) {
    setBusy(busyKey);
    try {
      const response = await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `HTTP ${response.status}`);
      await load();
    } catch (error) {
      toast(`Failed: ${error instanceof Error ? error.message : error}`, { variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function togglePause(job: Job) {
    if (job.paused) {
      if (!confirm(`Resume "${job.name}"? It will run on its normal schedule again.`)) return;
      await post({ job_id: job.id, action: "resume" }, `pause:${job.id}`);
      return;
    }
    const reason = prompt(`Pause "${job.name}"?\n\nIt will stop running and automatically resume in 30 days.\n\nReason (optional):`);
    if (reason === null) return;
    await post({ job_id: job.id, action: "pause", reason, days: 30 }, `pause:${job.id}`);
  }

  const matches = useCallback((job: Job) => {
    if (filter === "attention" && !job.needsAttention) return false;
    if (filter === "email" && !job.channels.includes("email")) return false;
    if (filter === "text" && !job.channels.includes("sms")) return false;
    if (filter === "paused" && !job.paused) return false;
    if (!q.trim()) return true;
    const haystack = `${job.name} ${job.description} ${job.recipientCohort} ${job.audience} ${job.fn} ${job.emailTypes.join(" ")}`.toLowerCase();
    return haystack.includes(q.trim().toLowerCase());
  }, [filter, q]);

  const currentJobs = useMemo(() => (data?.jobs ?? []).filter((job) => job.lifecycle === "current" && matches(job)), [data, matches]);
  const archivedJobs = useMemo(() => (data?.jobs ?? []).filter((job) => job.lifecycle === "archived" && (!q.trim() || `${job.name} ${job.archiveReason ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))), [data, q]);
  const systemGroups = useMemo(() => {
    const groups = AUTOMATION_SYSTEMS.map((system) => ({ system, jobs: currentJobs.filter((job) => job.systemKey === system.key) })).filter((group) => group.jobs.length > 0);
    const unmapped = currentJobs.filter((job) => !job.systemKey);
    if (unmapped.length > 0) groups.push({ system: { key: "other", label: "Other", description: "Current automations not yet assigned to an operating system.", jobIds: [] }, jobs: unmapped });
    return groups;
  }, [currentJobs]);
  const audienceGroups = useMemo(() => {
    const order: string[] = [];
    const byAudience = new Map<string, Job[]>();
    for (const job of currentJobs) {
      if (!byAudience.has(job.audience)) { byAudience.set(job.audience, []); order.push(job.audience); }
      byAudience.get(job.audience)!.push(job);
    }
    return order.map((audience) => ({ audience, jobs: byAudience.get(audience)! }));
  }, [currentJobs]);

  const complaintDanger = !!data && data.summary.complaintRate30d > RESEND_COMPLAINT_LIMIT;
  const complaintWarn = !!data && data.summary.complaintRate30d > RESEND_COMPLAINT_WARN;
  const bounceDanger = !!data && data.summary.bounceRate30d > RESEND_BOUNCE_LIMIT;
  const bounceWarn = !!data && data.summary.bounceRate30d > RESEND_BOUNCE_WARN;
  const deliveryDanger = complaintDanger || bounceDanger;
  const deliveryWarn = complaintWarn || bounceWarn;
  const deliverySignals = [
    complaintWarn ? `Complaint rate is ${Math.round((data!.summary.complaintRate30d / RESEND_COMPLAINT_LIMIT) * 100)}% of Resend’s account limit.` : null,
    bounceWarn ? `Bounce rate is ${Math.round((data!.summary.bounceRate30d / RESEND_BOUNCE_LIMIT) * 100)}% of Resend’s account limit.` : null,
  ].filter((signal): signal is string => Boolean(signal)).join(" ");
  const hasSearchOrFilter = Boolean(q.trim()) || filter !== "all";

  const selectAttention = () => { setView("all"); setFilter("attention"); };
  const selectPaused = () => { setView("all"); setFilter("paused"); };

  return (
    <div className="max-w-6xl pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Operations</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-gray-950">Automation control center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">See what is running, what needs attention, and how Olera&rsquo;s customer journeys fit together.</p>
        </div>
        <button type="button" disabled={loading} onClick={load} className="inline-flex min-h-9 items-center justify-center rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          {loading && data ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {loading && !data && <Skeleton />}
      {err && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Couldn&rsquo;t load automations: {err}</div>}

      {data && (
        <>
          <section className={`mt-6 rounded-2xl border px-5 py-5 sm:px-6 ${deliveryDanger ? "border-red-200 bg-red-50/70" : deliveryWarn ? "border-amber-200 bg-amber-50/70" : data.summary.needsAttention > 0 ? "border-red-200 bg-red-50/60" : "border-teal-200 bg-teal-50/60"}`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${deliveryDanger || data.summary.needsAttention > 0 ? "text-red-700" : deliveryWarn ? "text-amber-700" : "text-teal-700"}`}>Fleet health</p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-gray-950">
                  {deliveryDanger ? "Email delivery is at risk" : deliveryWarn ? "Deliverability needs watching" : data.summary.needsAttention > 0 ? `${data.summary.needsAttention} automation${data.summary.needsAttention === 1 ? "" : "s"} need attention` : data.summary.paused > 0 ? `${data.summary.paused} automation${data.summary.paused === 1 ? " is" : "s are"} paused` : "Automations are healthy"}
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600">
                  {deliveryWarn
                    ? `${deliverySignals} ${data.summary.needsAttention > 0 ? `${data.summary.needsAttention} runtime issue${data.summary.needsAttention === 1 ? " also needs" : "s also need"} review.` : "Runtime health is otherwise clear."}`
                    : data.summary.needsAttention > 0
                      ? "Open the affected automations below to review their latest run before the next scheduled fire."
                      : data.summary.paused > 0
                        ? "These are temporary holds. Review their reason and auto-resume date before changing them."
                        : "No paused jobs, unresolved run failures, or deliverability thresholds need action right now."}
                </p>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-3 text-sm sm:min-w-72">
                <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-inset ring-black/5">
                  <span className={`block text-lg font-semibold tabular-nums ${complaintDanger ? "text-red-600" : complaintWarn ? "text-amber-700" : "text-gray-950"}`}>{fmtPct(data.summary.complaintRate30d, 3)}</span>
                  <span className="mt-0.5 block text-[11px] text-gray-500">Complaints · cap 0.08%</span>
                </div>
                <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-inset ring-black/5">
                  <span className={`block text-lg font-semibold tabular-nums ${bounceDanger ? "text-red-600" : bounceWarn ? "text-amber-700" : "text-gray-950"}`}>{fmtPct(data.summary.bounceRate30d, 2)}</span>
                  <span className="mt-0.5 block text-[11px] text-gray-500">Bounces · cap 4%</span>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard value={data.summary.needsAttention} label="Needs attention" detail="Latest unresolved run state" tone={data.summary.needsAttention > 0 ? "danger" : "muted"} onClick={data.summary.needsAttention > 0 ? selectAttention : undefined} />
            <StatCard value={(data.summary.sends30d + data.summary.texts30d).toLocaleString()} label="Recorded messages · 30d" detail={`${data.summary.sends30d.toLocaleString()} email · ${data.summary.texts30d.toLocaleString()} text`} />
            <StatCard value={data.summary.total} label="Current automations" detail={`Across ${AUTOMATION_SYSTEMS.length} operating systems`} onClick={() => { setView("all"); setFilter("all"); }} />
            <StatCard value={data.summary.paused} label="Paused" detail="Temporary, auto-resuming holds" tone={data.summary.paused === 0 ? "muted" : "default"} onClick={data.summary.paused > 0 ? selectPaused : undefined} />
          </div>

          <details className="mt-3 text-xs text-gray-400">
            <summary className="cursor-pointer list-none font-medium text-gray-500 hover:text-gray-700 [&::-webkit-details-marker]:hidden">How delivery health is calculated +</summary>
            <p className="mt-2 max-w-3xl leading-relaxed">{data.note} Complaint and bounce rates are account-wide because Resend applies its limits to every email Olera sends.</p>
          </details>

          <div className="mt-8 border-b border-gray-200">
            <nav className="flex gap-6" aria-label="Automation views">
              {([
                ["systems", "Systems"],
                ["all", "All automations"],
                ["archived", `Archived (${data.summary.archived})`],
              ] as Array<[View, string]>).map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setView(value); setFilter("all"); }} aria-pressed={view === value} className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${view === value ? "border-gray-950 text-gray-950" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block flex-1 sm:max-w-sm">
              <span className="sr-only">Search automations</span>
              <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m12.5 12.5 4 4" /></svg>
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder={view === "archived" ? "Search archived automations…" : "Search by name, purpose, or audience…"} className="min-h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15" />
            </label>
            {view !== "archived" && (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter automations">
                {(["all", "attention", "email", "text", "paused"] as Filter[]).map((value) => (
                  <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-8 rounded-full border px-3 text-xs font-semibold transition-colors ${filter === value ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                    {value === "all" ? "All" : value === "attention" ? "Needs attention" : value === "email" ? "Email" : value === "text" ? "Text" : "Paused"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {view === "systems" && (
            <div className="mt-6 space-y-4">
              {systemGroups.map(({ system, jobs }) => (
                <SystemSection
                  key={system.key}
                  system={system}
                  jobs={jobs}
                  collapsed={hasSearchOrFilter ? false : (collapsed[system.key] ?? system.operational ?? false)}
                  onToggle={() => persistCollapsed({ ...collapsed, [system.key]: !(collapsed[system.key] ?? system.operational ?? false) })}
                  busy={busy}
                  onTogglePause={togglePause}
                />
              ))}
            </div>
          )}

          {view === "all" && (
            <div className="mt-6 space-y-7">
              {audienceGroups.map(({ audience, jobs }) => (
                <section key={audience}>
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{audience}</h2>
                    <span className="text-xs text-gray-300">{jobs.length}</span>
                  </div>
                  <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">{jobs.map((job) => <JobRow key={job.id} job={job} busy={busy} onTogglePause={togglePause} />)}</div>
                </section>
              ))}
            </div>
          )}

          {view === "archived" && (
            <div className="mt-6 space-y-3">
              {archivedJobs.map((job) => {
                const replacement = data.jobs.find((candidate) => candidate.id === job.replacedBy);
                return (
                  <article key={job.id} className="rounded-2xl border border-gray-200 bg-gray-50/60 px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-gray-800">{job.name}</h2>
                          <StatusBadge job={job} />
                          {job.archivedAt && <span className="text-xs text-gray-400">Archived {new Date(`${job.archivedAt}T00:00:00`).toLocaleDateString()}</span>}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{job.archiveReason}</p>
                        {replacement && <p className="mt-2 text-xs text-gray-500">Replaced by <Link href={`/admin/automations/${replacement.id}`} className="font-semibold text-teal-700 hover:text-teal-900">{replacement.name} →</Link></p>}
                      </div>
                      <div className="shrink-0 text-xs text-gray-400 sm:text-right">
                        <span className="block font-medium text-gray-600">{job.lastRun ? `Last ran ${timeAgo(job.lastRun.startedAt)}` : "No retained run found"}</span>
                        <span className="mt-1 block">History stays read-only</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {((view === "systems" && systemGroups.length === 0) || (view === "all" && audienceGroups.length === 0) || (view === "archived" && archivedJobs.length === 0)) && !loading && (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center">
              <p className="text-sm font-medium text-gray-600">No automations match this view.</p>
              <button type="button" onClick={() => { setQ(""); setFilter("all"); }} className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-900">Clear search and filters</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
