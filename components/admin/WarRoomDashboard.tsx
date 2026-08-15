"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  ExternalLink,
  GitPullRequest,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
} from "lucide-react";
import type {
  WarRoomIntegrationStatus,
  WarRoomProposal,
  WarRoomProposalStatus,
  WarRoomSupervisorPayload,
} from "@/lib/war-room/types";

function relative(iso: string | null) {
  if (!iso) return "never";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

const statusLabel: Record<WarRoomProposalStatus, string> = {
  proposed: "Needs your call",
  approved: "Approved",
  dispatching: "Dispatching",
  executing: "Agent working",
  review_ready: "Ready for review",
  rejected: "Rejected",
  completed: "Measuring outcome",
  failed: "Execution failed",
  superseded: "Superseded",
};

const statusTone: Record<WarRoomProposalStatus, string> = {
  proposed: "bg-rose-50 text-rose-700",
  approved: "bg-blue-50 text-blue-700",
  dispatching: "bg-blue-50 text-blue-700",
  executing: "bg-violet-50 text-violet-700",
  review_ready: "bg-emerald-50 text-emerald-700",
  rejected: "bg-gray-100 text-gray-600",
  completed: "bg-teal-50 text-teal-700",
  failed: "bg-amber-50 text-amber-800",
  superseded: "bg-gray-100 text-gray-500",
};

const sourceTone: Record<WarRoomIntegrationStatus["status"], string> = {
  live: "bg-emerald-500",
  stale: "bg-amber-500",
  missing: "bg-gray-300",
};

function ProposalCard({
  proposal,
  busy,
  onAction,
}: {
  proposal: WarRoomProposal;
  busy: boolean;
  onAction: (proposal: WarRoomProposal, action: "approve" | "retry" | "reject" | "complete") => Promise<void>;
}) {
  const isWaiting = proposal.status === "proposed";
  const isAwaitingExecutor = proposal.status === "approved" || (proposal.status === "failed" && Boolean(proposal.approved_at));
  const isActive = ["dispatching", "executing"].includes(proposal.status);
  const isReviewReady = proposal.status === "review_ready";
  return (
    <article className={`overflow-hidden rounded-[1.75rem] border bg-white shadow-sm ${isWaiting ? "border-gray-300" : "border-gray-200"}`}>
      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone[proposal.status]}`}>
              {statusLabel[proposal.status]}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
              {proposal.impact} impact · {proposal.effort} build
            </span>
            <span className="text-[11px] font-semibold text-gray-400">Priority {proposal.priority_score}</span>
          </div>
          <span className="text-xs text-gray-400">Found {relative(proposal.first_seen_at)}</span>
        </div>

        <h2 className="mt-5 max-w-4xl font-serif text-2xl font-bold leading-tight tracking-tight text-gray-950 sm:text-3xl">
          {proposal.title}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
          {proposal.finding}
        </p>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_0.72fr]">
          <div className="rounded-2xl bg-gray-950 p-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">What I propose</p>
            <p className="mt-2 text-sm leading-6 text-gray-200">{proposal.proposed_solution}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-600">Why now</p>
            <p className="mt-2 text-sm leading-6 text-gray-700">{proposal.why_now}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Approved execution plan</p>
          <ol className="mt-3 grid gap-3 lg:grid-cols-2">
            {proposal.execution_plan.map((step, index) => (
              <li key={`${step.label}:${index}`} className="flex gap-3 rounded-2xl border border-gray-200 p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-950 text-[11px] font-bold text-white">{index + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-950">{step.label}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <details className="group mt-5 rounded-2xl border border-gray-200 bg-gray-50/70">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-gray-700">
            Evidence, doubt, and safety
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-gray-200 px-5 py-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Evidence</p>
                <div className="mt-2 space-y-2">
                  {proposal.evidence.map((evidence) => {
                    const content = (
                      <div className="rounded-xl bg-white p-3 text-xs leading-5 text-gray-600">
                        <p className="font-semibold text-gray-800">{evidence.label}</p>
                        <p className="mt-0.5 line-clamp-3">{evidence.detail}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                          {evidence.source}{evidence.freshness ? ` · ${evidence.freshness}` : ""}
                        </p>
                      </div>
                    );
                    return evidence.href
                      ? <a key={evidence.id} href={evidence.href} target={evidence.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{content}</a>
                      : <div key={evidence.id}>{content}</div>;
                  })}
                </div>
              </div>
              <div className="space-y-4 text-xs leading-5 text-gray-600">
                <div><p className="font-semibold text-gray-900">Counter-evidence</p><p className="mt-1">{proposal.counter_evidence}</p></div>
                <div><p className="font-semibold text-gray-900">What success means</p><p className="mt-1">{proposal.success_measure}</p></div>
              </div>
              <div className="space-y-4 text-xs leading-5 text-gray-600">
                <div><p className="font-semibold text-gray-900">Risk</p><p className="mt-1">{proposal.risk}</p></div>
                <div><p className="font-semibold text-gray-900">Rollback</p><p className="mt-1">{proposal.rollback_plan}</p></div>
              </div>
            </div>
          </div>
        </details>

        {proposal.execution_error ? (
          <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {proposal.execution_error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4" />
            Branch + PR only. Never merge, deploy, send, spend, or touch production data.
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {proposal.admin_href ? (
              <Link href={proposal.admin_href} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-950">
                Related workspace <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            {isWaiting ? (
              <>
                <button
                  type="button"
                  onClick={() => onAction(proposal, "reject")}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ThumbsDown className="h-3.5 w-3.5" /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => onAction(proposal, "approve")}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  <Bot className="h-4 w-4" /> {busy ? "Authorizing…" : "Build this"}
                </button>
              </>
            ) : null}
            {isActive ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2.5 text-xs font-semibold text-violet-700">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> The agent owns this now
              </span>
            ) : null}
            {isAwaitingExecutor ? (
              <button
                type="button"
                onClick={() => onAction(proposal, "retry")}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} /> Retry executor
              </button>
            ) : null}
            {isReviewReady && proposal.execution_url ? (
              <>
                <a href={proposal.execution_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-gray-800">
                  <GitPullRequest className="h-4 w-4" /> Review PR <ExternalLink className="h-3 w-3" />
                </a>
                <button type="button" onClick={() => onAction(proposal, "complete")} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                  <Check className="h-4 w-4" /> Mark shipped
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function WarRoomDashboard() {
  const [payload, setPayload] = useState<WarRoomSupervisorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/admin/war-room/proposals", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "War Room failed to load");
      setPayload(data as WarRoomSupervisorPayload);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "War Room failed to load");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const shouldPoll = Boolean(
    payload?.latestDiscovery && ["queued", "running"].includes(payload.latestDiscovery.status)
    || payload?.proposals.some((proposal) => ["dispatching", "executing"].includes(proposal.status)),
  );
  useEffect(() => {
    if (!shouldPoll) return;
    const timer = window.setInterval(() => load(true), 5_000);
    return () => window.clearInterval(timer);
  }, [load, shouldPoll]);

  const groups = useMemo(() => {
    const proposals = payload?.proposals ?? [];
    return {
      waiting: proposals.filter((proposal) => proposal.status === "proposed").sort((a, b) => b.priority_score - a.priority_score),
      active: proposals.filter((proposal) =>
        ["approved", "dispatching", "executing"].includes(proposal.status)
        || (proposal.status === "failed" && Boolean(proposal.approved_at)),
      ),
      review: proposals.filter((proposal) => proposal.status === "review_ready"),
      recent: proposals.filter((proposal) =>
        ["completed", "rejected", "superseded"].includes(proposal.status)
        || (proposal.status === "failed" && !proposal.approved_at),
      ).slice(0, 6),
    };
  }, [payload?.proposals]);

  async function scan() {
    setScanBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/war-room/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discover" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start discovery");
      await load(true);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Could not start discovery");
    } finally {
      setScanBusy(false);
    }
  }

  async function act(proposal: WarRoomProposal, action: "approve" | "retry" | "reject" | "complete") {
    setBusyId(proposal.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/war-room/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, proposalId: proposal.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this decision");
      await load(true);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not save this decision");
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !payload) return <LoadingState />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-rose-600">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Company operating agent</p>
          </div>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">War Room</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            I find the work. You decide whether it gets done. I come back with a reviewable result.
          </p>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={scanBusy || Boolean(payload?.latestDiscovery && ["queued", "running"].includes(payload.latestDiscovery.status))}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${scanBusy || shouldPoll && payload?.latestDiscovery?.status !== "completed" ? "animate-spin" : ""}`} />
          {payload?.latestDiscovery && ["queued", "running"].includes(payload.latestDiscovery.status) ? "Investigating" : "Scan now"}
        </button>
      </header>

      {error ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div><p className="font-semibold">War Room hit a real blocker.</p><p className="mt-0.5 text-rose-800">{error}</p></div>
        </div>
      ) : null}

      {!error && payload?.latestDiscovery?.status === "failed" ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div><p className="font-semibold">The last discovery run failed honestly.</p><p className="mt-0.5">{payload.latestDiscovery.error_message || "No proposals were changed. Scan again after fixing the source or model failure."}</p></div>
        </div>
      ) : null}

      {payload ? (
        <>
          <section className="mt-7 grid gap-3 sm:grid-cols-3">
            {payload.integrations.map((integration) => (
              <div key={integration.key} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">{integration.label}</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${sourceTone[integration.status]}`} />
                </div>
                <p className="mt-1 text-xs leading-5 text-gray-500">{integration.detail}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {integration.status}{integration.updatedAt ? ` · ${relative(integration.updatedAt)}` : ""}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-[1.75rem] bg-gray-950 px-6 py-6 text-white sm:px-8">
            <div className="grid gap-5 sm:grid-cols-4">
              <Count label="Decisions waiting" value={payload.counts.waiting} />
              <Count label="Approved / working" value={payload.counts.working} />
              <Count label="Ready to review" value={payload.counts.reviewReady} />
              <Count label="Outcomes measuring" value={payload.counts.measuring} />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-gray-400">
              <span className="inline-flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Runs daily before the US workday</span>
              <span>
                {payload.latestDiscovery
                  ? `Last discovery ${payload.latestDiscovery.status} · ${relative(payload.latestDiscovery.completed_at || payload.latestDiscovery.created_at)}`
                  : "No discovery run yet"}
              </span>
            </div>
          </section>

          {groups.review.length ? <ProposalSection title="The work is back" detail="Review the PR. Shipping is still your decision." proposals={groups.review} busyId={busyId} onAction={act} /> : null}
          {groups.waiting.length ? <ProposalSection title="Needs your call" detail="These survived the evidence check and a separate skeptical review." proposals={groups.waiting} busyId={busyId} onAction={act} /> : null}
          {groups.active.length ? <ProposalSection title="Working" detail="You approved the scope. The agent owns the build until it returns or reports a blocker." proposals={groups.active} busyId={busyId} onAction={act} /> : null}

          {!groups.waiting.length && !groups.active.length && !groups.review.length ? (
            <section className="mt-8 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
              <Check className="mx-auto h-6 w-6 text-emerald-600" />
              <h2 className="mt-3 font-serif text-2xl font-bold text-gray-950">Nothing worth interrupting you for.</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
                Empty is a valid answer. War Room will look again tomorrow instead of manufacturing chores.
              </p>
            </section>
          ) : null}

          {groups.recent.length ? (
            <section className="mt-10">
              <h2 className="font-serif text-2xl font-bold text-gray-950">Memory</h2>
              <p className="mt-1 text-sm text-gray-500">Rejected work stays rejected. Completed work stays visible while its outcome is measured.</p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {groups.recent.map((proposal, index) => (
                  <div key={proposal.id} className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${index ? "border-t border-gray-100" : ""}`}>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{proposal.title}</p>
                      <p className="mt-1 text-xs text-gray-400">Last seen {relative(proposal.last_seen_at)} · {proposal.occurrence_count} observation{proposal.occurrence_count === 1 ? "" : "s"}</p>
                      {proposal.outcome_note ? <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-600">Outcome: {proposal.outcome_note}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {proposal.outcome_status ? <span className="self-start rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700">Outcome · {proposal.outcome_status}</span> : null}
                      <span className={`self-start rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone[proposal.status]}`}>{statusLabel[proposal.status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ProposalSection({
  title,
  detail,
  proposals,
  busyId,
  onAction,
}: {
  title: string;
  detail: string;
  proposals: WarRoomProposal[];
  busyId: string | null;
  onAction: (proposal: WarRoomProposal, action: "approve" | "retry" | "reject" | "complete") => Promise<void>;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-bold text-gray-950">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{detail}</p>
      <div className="mt-4 space-y-5">
        {proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} busy={busyId === proposal.id} onAction={onAction} />)}
      </div>
    </section>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return <div><p className="text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-gray-400">{label}</p></div>;
}

function LoadingState() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="h-12 w-56 animate-pulse rounded-xl bg-gray-100" />
      <div className="mt-8 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-gray-100" />)}</div>
      <div className="mt-5 h-40 animate-pulse rounded-[1.75rem] bg-gray-900" />
    </div>
  );
}
