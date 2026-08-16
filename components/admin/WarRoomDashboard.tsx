"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  GitPullRequest,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
} from "lucide-react";
import type {
  WarRoomCompanyRead,
  WarRoomIntegrationStatus,
  WarRoomInvestigation,
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

function elapsedMilliseconds(startedAt: string | null, nowIso: string) {
  if (!startedAt) return 0;
  return Math.max(0, new Date(nowIso).getTime() - new Date(startedAt).getTime());
}

function discoveryFailureMessage(message: string | null) {
  if (!message) return "No proposals were changed. Scan again after fixing the source or model failure.";
  if (message.includes("war_room_incomplete_lens_coverage")) {
    return "The AI returned an incomplete company review, so War Room rejected it instead of inventing an all-clear. No decision or investigation was saved.";
  }
  if (message.includes("war_room_missing_submit_")) {
    return "The AI did not return the required structured review. War Room rejected the run, and nothing was saved.";
  }
  if (message.includes("invalid_request_error") || message.includes("tools.0.custom")) {
    return "The AI provider rejected the structured review contract before analysis began. Nothing was saved.";
  }
  return message;
}

function elapsed(startedAt: string | null, nowIso: string) {
  if (!startedAt) return "less than a minute";
  const seconds = Math.floor(elapsedMilliseconds(startedAt, nowIso) / 1_000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder.toString().padStart(2, "0")}s`;
}

function concise(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const sentences = clean.match(/.*?[.!?](?:\s|$)/g) ?? [];
  let result = "";
  for (const sentence of sentences) {
    const candidate = `${result} ${sentence.trim()}`.trim();
    if (candidate.length > maxLength) break;
    result = candidate;
  }
  if (result) return result;
  const clipped = clean.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, Math.max(lastSpace, maxLength - 40)).trim()}…`;
}

const discoveryStages: Record<string, { button: string; title: string; detail: string }> = {
  queued: {
    button: "Starting scan",
    title: "Starting the investigation",
    detail: "The run is queued and claiming its server worker.",
  },
  refreshing_sources: {
    button: "Reading evidence",
    title: "Reading the company evidence",
    detail: "Refreshing connected sources and separating current signals from stale context.",
  },
  building_operating_pack: {
    button: "Checking facts",
    title: "Cross-checking the facts",
    detail: "Combining product, customer, revenue, reliability, and source evidence into one frozen operating picture.",
  },
  forming_candidates: {
    button: "Forming cases",
    title: "Building private opportunity cases",
    detail: "The chief-of-staff pass is comparing customers, providers, growth, revenue, product, content, operations, market risk, and data without assuming the answer is code.",
  },
  challenging_candidates: {
    button: "Applying agenda gate",
    title: "Protecting your attention",
    detail: "The CEO council is checking materiality, causality, what already exists, alternative interventions, opportunity cost, and whether any decision deserves to interrupt you.",
  },
  saving_decisions: {
    button: "Saving the company read",
    title: "Separating decisions from watchlist",
    detail: "The review is recording private investigations and watchlist items. At most one case can enter the founder agenda.",
  },
};

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

const companyReadLabel: Record<WarRoomCompanyRead["stance"], string> = {
  decision_required: "Decision required",
  investigating: "Investigating",
  monitoring: "Monitoring",
  stable: "No decision today",
};

const companyReadTone: Record<WarRoomCompanyRead["stance"], string> = {
  decision_required: "bg-rose-50 text-rose-700",
  investigating: "bg-violet-50 text-violet-700",
  monitoring: "bg-amber-50 text-amber-800",
  stable: "bg-gray-100 text-gray-600",
};

const actionLabel: Record<WarRoomProposal["action_kind"], string> = {
  code: "Product / code",
  research: "Research",
  operations: "Operations",
  business_development: "Business development",
  content: "Content",
  decision: "Founder decision",
};

const approvalLabel: Record<WarRoomProposal["action_kind"], string> = {
  code: "Build this",
  research: "Approve research",
  operations: "Approve plan",
  business_development: "Approve BD plan",
  content: "Approve content plan",
  decision: "Back this decision",
};

function ProposalCard({
  proposal,
  busy,
  onAction,
  onPass,
}: {
  proposal: WarRoomProposal;
  busy: boolean;
  onAction: (proposal: WarRoomProposal, action: "approve" | "retry" | "reject" | "complete", note?: string) => Promise<void>;
  onPass?: () => void;
}) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const isWaiting = proposal.status === "proposed";
  const isCode = proposal.action_kind === "code";
  const isAwaitingExecutor = isCode && (proposal.status === "approved" || (proposal.status === "failed" && Boolean(proposal.approved_at)));
  const isHumanApproved = !isCode && proposal.status === "approved";
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
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
              {actionLabel[proposal.action_kind] ?? "Company action"}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
              {proposal.impact} impact · {proposal.effort} effort
            </span>
            <span className="text-[11px] font-semibold capitalize text-gray-400">{proposal.domain ?? "company"}</span>
          </div>
          <span className="text-xs text-gray-400">Found {relative(proposal.first_seen_at)}</span>
        </div>

        <h2 className="mt-5 max-w-4xl font-serif text-2xl font-bold leading-tight tracking-tight text-gray-950 sm:text-3xl">
          {proposal.title}
        </h2>
        <div className="mt-4 max-w-4xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600">Bottom line</p>
          <p className="mt-2 text-base font-medium leading-7 text-gray-800 sm:text-lg">
            {concise(proposal.finding, 360)}
          </p>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_0.72fr]">
          <div className="rounded-2xl bg-gray-950 p-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">My recommendation</p>
            <p className="mt-2 text-sm leading-6 text-gray-200">{concise(proposal.proposed_solution, 440)}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-600">Why this matters to Olera</p>
            <p className="mt-2 text-sm leading-6 text-gray-700">{concise(proposal.why_now, 360)}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Expected impact</p>
            <p className="mt-2 text-xs leading-5 text-gray-600">{concise(proposal.success_measure, 280)}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">Main risk</p>
            <p className="mt-2 text-xs leading-5 text-gray-700">{concise(proposal.risk, 280)}</p>
          </div>
        </div>

        <details className="group mt-5 rounded-2xl border border-gray-200 bg-gray-50/70">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-gray-700">
            See the detailed case and action plan
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-gray-200 px-5 py-5">
            <div className="grid gap-4 text-sm leading-6 text-gray-600 lg:grid-cols-3">
              <div><p className="font-semibold text-gray-950">The issue</p><p className="mt-1">{proposal.finding}</p></div>
              <div><p className="font-semibold text-gray-950">Proposed solution</p><p className="mt-1">{proposal.proposed_solution}</p></div>
              <div><p className="font-semibold text-gray-950">Why now</p><p className="mt-1">{proposal.why_now}</p></div>
            </div>

            {(proposal.why_better_than_alternatives || proposal.decision_required || proposal.cheapest_falsification) ? (
              <div className="mt-6 grid gap-4 border-t border-gray-200 pt-5 text-sm leading-6 text-gray-600 lg:grid-cols-3">
                <div><p className="font-semibold text-gray-950">Why this beats the alternatives</p><p className="mt-1">{proposal.why_better_than_alternatives || "Not recorded on this legacy proposal."}</p></div>
                <div><p className="font-semibold text-gray-950">Your decision</p><p className="mt-1">{proposal.decision_required || "Approve or reject the proposed direction."}</p></div>
                <div><p className="font-semibold text-gray-950">Cheapest way to prove it wrong</p><p className="mt-1">{proposal.cheapest_falsification || "Not recorded on this legacy proposal."}</p></div>
              </div>
            ) : null}

            {proposal.existing_capabilities?.length ? (
              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">What Olera already has</p>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-gray-700">
                  {proposal.existing_capabilities.map((capability) => <li key={capability}>• {capability}</li>)}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 border-t border-gray-200 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Action plan</p>
              <ol className="mt-3 grid gap-3 lg:grid-cols-2">
                {proposal.execution_plan.map((step, index) => (
                  <li key={`${step.label}:${index}`} className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-950 text-[11px] font-bold text-white">{index + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-950">{step.label}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="mt-6 border-t border-gray-200 pt-5">
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
              <div className="mt-6 space-y-4 border-t border-gray-200 pt-5 text-xs leading-5 text-gray-600">
                <div><p className="font-semibold text-gray-900">Counter-evidence</p><p className="mt-1">{proposal.counter_evidence}</p></div>
                <div><p className="font-semibold text-gray-900">What success means</p><p className="mt-1">{proposal.success_measure}</p></div>
              </div>
              <div className="mt-6 space-y-4 border-t border-gray-200 pt-5 text-xs leading-5 text-gray-600">
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

        {isWaiting && showRejectReason ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
            <label htmlFor={`reject-${proposal.id}`} className="text-sm font-semibold text-gray-950">
              What did War Room get wrong?
            </label>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              This becomes memory for later scans. Be blunt. “Already exists” is more useful than a polite rejection.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["This already exists", "The evidence is wrong or outdated", "This is not important enough"].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:border-rose-300"
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              id={`reject-${proposal.id}`}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              maxLength={1_000}
              rows={3}
              placeholder="What should the next scan understand?"
              className="mt-3 w-full resize-y rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-rose-400"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowRejectReason(false)} disabled={busy} className="rounded-full px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onAction(proposal, "reject", rejectReason.trim())}
                disabled={busy || !rejectReason.trim()}
                className="rounded-full bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Reject and teach War Room"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4" />
            {isCode
              ? "Branch + PR only. Never merge, deploy, send, spend, or touch production data."
              : "Approval records the direction. External action, sends, spend, and production changes remain human-controlled."}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {proposal.admin_href ? (
              <Link href={proposal.admin_href} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-950">
                Related workspace <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            {isWaiting ? (
              <>
                {onPass ? (
                  <button
                    type="button"
                    onClick={onPass}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950 disabled:opacity-50"
                  >
                    Pass for now <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowRejectReason((visible) => !visible)}
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
                  <Bot className="h-4 w-4" /> {busy ? "Authorizing…" : (approvalLabel[proposal.action_kind] ?? "Approve")}
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
            {isHumanApproved ? (
              <button
                type="button"
                onClick={() => onAction(proposal, "complete")}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Mark carried out
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
  const discoveryActive = Boolean(
    payload?.latestDiscovery && ["queued", "running"].includes(payload.latestDiscovery.status),
  );
  const discoveryStageKey = payload?.latestDiscovery?.status === "queued"
    ? "queued"
    : typeof payload?.latestDiscovery?.source_summary?.stage === "string"
      ? payload.latestDiscovery.source_summary.stage
      : "forming_candidates";
  const discoveryStage = discoveryStages[discoveryStageKey] ?? discoveryStages.forming_candidates;
  const discoveryStageAttempt = typeof payload?.latestDiscovery?.source_summary?.stage_attempt === "number"
    ? payload.latestDiscovery.source_summary.stage_attempt
    : 1;
  const discoveryStartedAt = payload?.latestDiscovery?.started_at || payload?.latestDiscovery?.created_at || null;
  const discoveryElapsedMs = payload ? elapsedMilliseconds(discoveryStartedAt, payload.generatedAt) : 0;
  useEffect(() => {
    if (!shouldPoll) return;
    const timer = window.setInterval(() => load(true), 5_000);
    return () => window.clearInterval(timer);
  }, [load, shouldPoll]);

  const groups = useMemo(() => {
    const proposals = payload?.proposals ?? [];
    const investigations = payload?.investigations ?? [];
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
      investigating: investigations.filter((investigation) => investigation.status === "investigating").slice(0, 6),
      watchlist: investigations.filter((investigation) => investigation.status === "watchlist").slice(0, 6),
    };
  }, [payload?.investigations, payload?.proposals]);

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

  async function act(proposal: WarRoomProposal, action: "approve" | "retry" | "reject" | "complete", note?: string) {
    setBusyId(proposal.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/war-room/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, proposalId: proposal.id, note }),
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
            I investigate the company. I interrupt you only when a decision can materially improve Olera&apos;s odds.
          </p>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={scanBusy || Boolean(payload?.latestDiscovery && ["queued", "running"].includes(payload.latestDiscovery.status))}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${scanBusy || shouldPoll && payload?.latestDiscovery?.status !== "completed" ? "animate-spin" : ""}`} />
          {discoveryActive ? discoveryStage.button : "Scan now"}
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
          <div className="min-w-0"><p className="font-semibold">The last discovery run failed honestly.</p><p className="mt-0.5 break-words">{discoveryFailureMessage(payload.latestDiscovery.error_message)}</p></div>
        </div>
      ) : null}

      {payload ? (
        <>
          <details className="group mt-7 rounded-2xl border border-gray-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-gray-700">
              <span className="flex items-center gap-3">
                Evidence coverage
                <span className="flex items-center gap-1.5">
                  {payload.integrations.map((integration) => <span key={integration.key} title={`${integration.label}: ${integration.status}`} className={`h-2 w-2 rounded-full ${sourceTone[integration.status]}`} />)}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-3 border-t border-gray-100 p-4 sm:grid-cols-3">
              {payload.integrations.map((integration) => (
                <div key={integration.key} className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{integration.label}</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${sourceTone[integration.status]}`} />
                  </div>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{integration.detail}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{integration.status}{integration.updatedAt ? ` · ${relative(integration.updatedAt)}` : ""}</p>
                </div>
              ))}
            </div>
          </details>

          <section className="mt-8 rounded-[1.75rem] bg-gray-950 px-6 py-6 text-white sm:px-8">
            <div className="grid gap-5 sm:grid-cols-4">
              <Count label="Decisions waiting" value={payload.counts.waiting} />
              <Count label="Approved / working" value={payload.counts.working} />
              <Count label="Open investigations" value={payload.counts.investigating ?? 0} />
              <Count label="Watchlist" value={payload.counts.watchlist ?? 0} />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-gray-400">
              <span className="inline-flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Investigates daily · maximum one founder interruption per scan</span>
              <span>
                {payload.latestDiscovery
                  ? `Last discovery ${payload.latestDiscovery.status} · ${relative(payload.latestDiscovery.completed_at || payload.latestDiscovery.created_at)}`
                  : "No discovery run yet"}
              </span>
            </div>
          </section>

          {payload.companyVerdict ? (
            <section className="mt-5 rounded-2xl border border-gray-200 bg-white px-5 py-5 sm:px-6">
              <div className="flex gap-3">
                <Layers3 className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Company read</p>
                    {payload.companyRead ? (
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${companyReadTone[payload.companyRead.stance]}`}>
                        {companyReadLabel[payload.companyRead.stance]}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-gray-800">{payload.companyVerdict}</p>
                  {payload.companyRead?.investigationFingerprints.length ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Following {payload.companyRead.investigationFingerprints.length} unresolved case{payload.companyRead.investigationFingerprints.length === 1 ? "" : "s"} below.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {groups.review.length ? <ProposalSection title="The work is back" detail="Review the PR. Shipping is still your decision." proposals={groups.review} busyId={busyId} onAction={act} /> : null}
          {groups.waiting.length ? <ProposalSection title="Needs your call" detail="One decision at a time. Pass leaves the proposal untouched so you can come back to it." proposals={groups.waiting} busyId={busyId} onAction={act} paged /> : null}
          {groups.active.length ? <ProposalSection title="Working" detail="You approved the direction. Code goes to the guarded executor; human plans remain human-controlled." proposals={groups.active} busyId={busyId} onAction={act} /> : null}

          {groups.investigating.length ? <InvestigationSection title="Active investigations" detail="These are unresolved company conditions, not tasks. Each case records what is known and the next read-only question that should advance it." investigations={groups.investigating} /> : null}
          {groups.watchlist.length ? <InvestigationSection title="Watchlist" detail="Real enough to remember; not important or proven enough to consume your attention yet." investigations={groups.watchlist} /> : null}

          {discoveryActive && payload?.latestDiscovery ? (
            <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-violet-200 bg-violet-50/70 px-6 py-8 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-950 text-white">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Still working</p>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-gray-950">{discoveryStage.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{discoveryStage.detail}</p>
                    {discoveryStageAttempt > 1 ? (
                      <p className="mt-2 text-xs font-semibold text-violet-700">
                        Durable retry {discoveryStageAttempt - 1} — completed stages were not repeated.
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 rounded-2xl border border-violet-200 bg-white/80 px-5 py-3 text-left sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Elapsed</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-gray-950">
                    {elapsed(discoveryStartedAt, payload.generatedAt)}
                  </p>
                </div>
              </div>
              <p className="mt-5 border-t border-violet-200/70 pt-4 text-xs leading-5 text-gray-500">
                {discoveryElapsedMs > 4 * 60_000
                  ? "Deep reasoning is taking longer than usual. It is safe to leave this page: the durable run will retry or resume from its last completed stage."
                  : "War Room uses two checkpointed deep-reasoning passes. You can leave this page; the result appears here automatically."}
              </p>
            </section>
          ) : null}

          {!discoveryActive
          && payload.latestDiscovery?.status !== "failed"
          && !groups.waiting.length
          && !groups.active.length
          && !groups.review.length ? (
            <section className="mt-8 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
              <Check className="mx-auto h-6 w-6 text-emerald-600" />
              <h2 className="mt-3 font-serif text-2xl font-bold text-gray-950">
                {groups.investigating.length || groups.watchlist.length
                  ? "No decision needed from you today."
                  : "No founder decision is supported today."}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
                {groups.investigating.length || groups.watchlist.length
                  ? "War Room is preserving the unresolved cases above and will interrupt only when one becomes decision-ready."
                  : "This scan did not preserve a sufficiently supported private investigation. That is an evidence limitation—not proof that Olera has nothing important to do."}
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
                      {proposal.rejection_note ? <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-600">Why we rejected it: {proposal.rejection_note}</p> : null}
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
  paged = false,
}: {
  title: string;
  detail: string;
  proposals: WarRoomProposal[];
  busyId: string | null;
  onAction: (proposal: WarRoomProposal, action: "approve" | "retry" | "reject" | "complete", note?: string) => Promise<void>;
  paged?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, proposals.length - 1)));
  }, [proposals.length]);
  const selectedIndex = Math.min(activeIndex, Math.max(0, proposals.length - 1));
  const visibleProposals = paged ? proposals.slice(selectedIndex, selectedIndex + 1) : proposals;
  const showPager = paged && proposals.length > 1;
  const previous = () => setActiveIndex((current) => (current - 1 + proposals.length) % proposals.length);
  const next = () => setActiveIndex((current) => (current + 1) % proposals.length);

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{detail}</p>
        </div>
        {showPager ? (
          <div className="flex items-center gap-2">
            <span className="mr-1 text-xs font-semibold tabular-nums text-gray-400">
              {selectedIndex + 1} of {proposals.length}
            </span>
            <button type="button" onClick={previous} aria-label="Previous proposal" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white hover:text-gray-950">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={next} aria-label="Next proposal" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white hover:text-gray-950">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-4 space-y-5">
        {visibleProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            busy={busyId === proposal.id}
            onAction={onAction}
            onPass={showPager ? next : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function InvestigationSection({
  title,
  detail,
  investigations,
}: {
  title: string;
  detail: string;
  investigations: WarRoomInvestigation[];
}) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-bold text-gray-950">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">{detail}</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {investigations.map((investigation, index) => (
          <details key={investigation.id} className={`group ${index ? "border-t border-gray-100" : ""}`}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50/70">
              <div className="flex min-w-0 gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{investigation.title}</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-gray-500">{investigation.domain}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{investigation.readiness_reason}</p>
                </div>
              </div>
              <ChevronDown className="mt-2 h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-5">
              <div className="grid gap-5 text-xs leading-5 text-gray-600 lg:grid-cols-3">
                <div><p className="font-semibold text-gray-900">What we see</p><p className="mt-1">{investigation.situation}</p></div>
                <div><p className="font-semibold text-gray-900">Current causal read</p><p className="mt-1">{investigation.likely_cause}</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{investigation.cause_confidence} confidence</p></div>
                <div><p className="font-semibold text-gray-900">Why it could matter</p><p className="mt-1">{investigation.why_it_matters}</p></div>
              </div>
              {investigation.unknowns?.length ? (
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">What War Room still needs to resolve</p>
                  <ul className="mt-2 grid gap-2 text-xs leading-5 text-gray-600 sm:grid-cols-2">
                    {investigation.unknowns.map((unknown) => <li key={unknown}>• {unknown}</li>)}
                  </ul>
                </div>
              ) : null}
              {investigation.next_probe ? (
                <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">Next read-only probe</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{investigation.next_probe.question}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">{investigation.next_probe.method}</p>
                  <p className="mt-2 text-[11px] leading-5 text-violet-800">Expected learning: {investigation.next_probe.expectedInformationGain}</p>
                </div>
              ) : null}
            </div>
          </details>
        ))}
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
