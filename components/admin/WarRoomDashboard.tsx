"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDollarSign,
  Clock3,
  Crosshair,
  RefreshCw,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import type {
  WarRoomDecision,
  WarRoomMetric,
  WarRoomRun,
  WarRoomSnapshot,
  WarRoomSource,
} from "@/lib/war-room/types";

const RANGES = [7, 30, 90] as const;

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

const metricTone: Record<WarRoomMetric["tone"], string> = {
  good: "border-emerald-200 bg-emerald-50/50",
  warning: "border-amber-200 bg-amber-50/50",
  critical: "border-rose-200 bg-rose-50/60",
  neutral: "border-gray-200 bg-white",
};

const sourceTone: Record<WarRoomSource["status"], { dot: string; label: string }> = {
  live: { dot: "bg-emerald-500", label: "Live" },
  stale: { dot: "bg-amber-500", label: "Stale" },
  missing: { dot: "bg-gray-300", label: "Blind spot" },
};

const decisionLabels: Record<WarRoomDecision["decision"], string> = {
  backed: "Backed",
  rejected: "Rejected",
  completed: "Completed",
};

export default function WarRoomDashboard() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [snapshot, setSnapshot] = useState<WarRoomSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const loadRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++loadRequest.current;
    setLoading(true);
    setError(null);
    setRunError(null);
    setDecisionError(null);
    try {
      const response = await fetch(`/api/admin/war-room?days=${days}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "War Room failed to load");
      if (requestId === loadRequest.current) setSnapshot(payload as WarRoomSnapshot);
    } catch (loadError) {
      if (requestId === loadRequest.current) {
        setError(loadError instanceof Error ? loadError.message : "War Room failed to load");
      }
    } finally {
      if (requestId === loadRequest.current) setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    setSnapshot(null);
    load();
  }, [load]);

  const latestRun = snapshot?.latestRun ?? null;
  const latestRunId = latestRun?.id ?? null;
  const latestRunIsActive = Boolean(
    latestRun
    && ["queued", "running"].includes(latestRun.status)
    && Date.now() - new Date(latestRun.created_at).getTime() < 10 * 60_000,
  );
  const aiBriefing = latestRun?.status === "completed" ? latestRun.briefing : null;
  const aiRecommendation = aiBriefing?.recommendation ?? null;
  const recommendation = aiRecommendation ?? snapshot?.recommendation ?? null;
  const executionActions = aiRecommendation
    ? aiRecommendation.actions?.length
      ? aiRecommendation.actions
      : recommendation
        ? [{ label: "Open the recommended workspace", detail: recommendation.move, href: recommendation.href }]
        : []
    : snapshot?.recommendation.actions ?? [];
  const firstAction = executionActions[0] ?? null;
  const recommendationKey = aiBriefing && latestRun
    ? `ai:${latestRun.id}`
    : snapshot?.recommendation.key ?? "fallback";
  const citationById = useMemo(
    () => new Map((latestRun?.citations ?? []).map((citation) => [citation.id, citation])),
    [latestRun?.citations],
  );

  useEffect(() => {
    if (!latestRunId || !latestRunIsActive) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/admin/war-room?run_id=${latestRunId}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not check analysis progress");
        if (!cancelled) {
          setRunError(null);
          setSnapshot((current) => current ? { ...current, latestRun: payload.run as WarRoomRun } : current);
        }
      } catch (pollError) {
        if (!cancelled) setRunError(pollError instanceof Error ? pollError.message : "Could not check analysis progress");
      }
    };
    const timer = window.setInterval(poll, 2_500);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [latestRunId, latestRunIsActive]);

  const currentDecision = useMemo(() => snapshot?.decisions.find(
    (decision) => decision.recommendation_key === recommendationKey,
  ) ?? null, [recommendationKey, snapshot?.decisions]);

  async function runAnalysis() {
    if (latestRunIsActive) return;
    const requestedDays = days;
    setRunError(null);
    try {
      const response = await fetch("/api/admin/war-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", days: requestedDays }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not start War Room analysis");
      setSnapshot((current) => current?.windowDays === requestedDays
        ? { ...current, latestRun: payload.run as WarRoomRun }
        : current);
    } catch (analysisError) {
      setRunError(analysisError instanceof Error ? analysisError.message : "Could not start War Room analysis");
    }
  }

  async function decide(decision: WarRoomDecision["decision"]) {
    if (!snapshot || !recommendation || deciding) return;
    setDeciding(decision);
    setDecisionError(null);
    try {
      const response = await fetch("/api/admin/war-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationKey,
          recommendationTitle: recommendation.title,
          decision,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save decision");
      setSnapshot((current) => current ? {
        ...current,
        decisions: [payload.decision as WarRoomDecision, ...current.decisions],
      } : current);
    } catch (saveError) {
      setDecisionError(saveError instanceof Error ? saveError.message : "Could not save decision");
    } finally {
      setDeciding(null);
    }
  }

  return (
    <div className="pb-16">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
            <Crosshair className="h-3.5 w-3.5" />
            Company command center
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-950">War Room</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            The truth, the next move, and the work we should stop pretending matters.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runAnalysis}
            disabled={latestRunIsActive}
            className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-wait disabled:opacity-60"
          >
            <Crosshair className={`h-3.5 w-3.5 ${latestRunIsActive ? "animate-pulse" : ""}`} />
            {latestRunIsActive ? "Claude is investigating" : "Run War Room"}
          </button>
          <div className="flex rounded-full border border-gray-200 bg-white p-1">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === range ? "bg-gray-950 text-white" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh War Room"
            className="rounded-full border border-gray-200 bg-white p-2.5 text-gray-500 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {loading && !snapshot ? <WarRoomLoading /> : null}
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8">
          <p className="font-semibold text-gray-950">The evidence pipeline broke.</p>
          <p className="mt-1 text-sm text-gray-600">{error} Fix the source. Do not fill the gap with confidence.</p>
        </div>
      ) : null}

      {snapshot && recommendation ? (
        <>
          <section className="relative overflow-hidden rounded-[2rem] bg-gray-950 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-9">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-rose-600/20 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">
                  {recommendation.eyebrow}
                </p>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-gray-300">
                  {aiBriefing ? `${latestRun?.model} · AI + critic` : "Rule fallback"} · {recommendation.confidence} confidence · refreshed {relative(aiBriefing ? latestRun?.completed_at ?? snapshot.generatedAt : snapshot.generatedAt)}
                </span>
              </div>
              <h2 className="mt-4 max-w-4xl font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {recommendation.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
                {recommendation.verdict}
              </p>

              <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_0.78fr]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">Do this next</p>
                  <p className="mt-2 leading-6 text-white">{recommendation.move}</p>
                </div>
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-300">Kill list</p>
                  <p className="mt-2 leading-6 text-gray-200">{recommendation.kill}</p>
                </div>
              </div>

              {executionActions.length ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">Execution plan</p>
                      <p className="mt-1 text-sm text-gray-400">The exact place to act, the next step, and what moves this forward.</p>
                    </div>
                    {firstAction ? (
                      <Link href={firstAction.href} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-sky-300 px-4 py-2 text-xs font-bold text-gray-950 hover:bg-sky-200">
                        Start here <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                  <ol className="mt-5 grid gap-3 lg:grid-cols-3">
                    {executionActions.map((action, index) => (
                      <li key={`${action.href}:${action.label}`} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">{index + 1}</span>
                          <div>
                            <p className="text-sm font-semibold leading-5 text-white">{action.label}</p>
                            <p className="mt-1.5 text-xs leading-5 text-gray-400">{action.detail}</p>
                          </div>
                        </div>
                        <Link href={action.href} className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-sky-300 hover:text-sky-200">
                          Open workspace <ArrowRight className="h-3 w-3" />
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {(aiRecommendation ? aiRecommendation.evidenceIds : snapshot.recommendation.evidence).map((item: string) => {
                    const citation = aiRecommendation ? citationById.get(item) : null;
                    const chip = <span className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs text-gray-300">{citation?.label ?? item}</span>;
                    return citation?.href ? <Link key={item} href={citation.href}>{chip}</Link> : <span key={item}>{chip}</span>;
                  })}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {currentDecision ? (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-950">
                        <Check className="h-3.5 w-3.5" /> {decisionLabels[currentDecision.decision]}
                      </span>
                      {currentDecision.decision === "backed" ? (
                        <button
                          type="button"
                          onClick={() => decide("completed")}
                          disabled={Boolean(deciding) || latestRunIsActive}
                          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-50"
                        >
                          Mark complete
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => decide("rejected")}
                        disabled={Boolean(deciding) || latestRunIsActive}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-50"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => decide("backed")}
                        disabled={Boolean(deciding) || latestRunIsActive}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-950 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> Back this move
                      </button>
                    </>
                  )}
                  <Link href={recommendation.href} className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white" aria-label="Open recommended work">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              {decisionError ? <p className="mt-3 text-right text-xs text-rose-300">{decisionError}</p> : null}
              {aiRecommendation ? (
                <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Counter-evidence</p>
                    <p className="mt-1 leading-6 text-gray-300">{aiRecommendation.counterEvidence}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">What changes our mind</p>
                    <p className="mt-1 leading-6 text-gray-300">{aiRecommendation.whatWouldChangeOurMind}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {runError || latestRun?.status === "failed" ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <span className="font-semibold">AI analysis unavailable.</span>{" "}
              {runError || latestRun?.error_message || "The saved rule-based briefing remains active."}
            </div>
          ) : null}

          <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {snapshot.metrics.map((metric) => (
              <Link key={metric.key} href={metric.href} className={`rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 ${metricTone[metric.tone]}`}>
                <p className="text-xs font-medium text-gray-500">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{metric.display}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{metric.detail}</p>
              </Link>
            ))}
          </section>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-8">
              {aiBriefing ? (
                <section>
                  <SectionTitle icon={<Crosshair className="h-4 w-4" />} title="The read beneath the numbers" detail="Patterns from the analyst pass, corrected by a separate skeptic." />
                  <div className="mt-3 space-y-3">
                    {aiBriefing.observations.map((observation) => (
                      <div key={observation.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                        <p className="font-semibold text-gray-950">{observation.title}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-500">{observation.detail}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {observation.evidenceIds.map((id) => {
                            const citation = citationById.get(id);
                            return <span key={id} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-500">{citation?.label ?? id}</span>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              <section>
                <SectionTitle icon={<ShieldAlert className="h-4 w-4" />} title="What could hurt us" detail="Exceptions, bottlenecks, and lies the averages tell." />
                <div className="mt-3 space-y-3">
                  {snapshot.signals.length ? snapshot.signals.map((signal) => (
                    <Link key={signal.id} href={signal.href} className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300">
                      <span className={`mt-0.5 rounded-full p-2 ${signal.severity === "urgent" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-gray-950">{signal.title}</span>
                        <span className="mt-1 block text-sm leading-6 text-gray-500">{signal.detail}</span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 text-gray-300 group-hover:text-gray-700" />
                    </Link>
                  )) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                      No threshold breach. That is permission to focus, not permission to coast.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <SectionTitle icon={<Users className="h-4 w-4" />} title="What customers are saying" detail="Recent inbound email and care-seeker questions. Read the words, not just the count." />
                <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {snapshot.customerVoice.length ? snapshot.customerVoice.map((item, index) => (
                    <Link key={item.id} href={item.href} className={`block px-5 py-4 hover:bg-gray-50 ${index ? "border-t border-gray-100" : ""}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
                        <span className="shrink-0 text-[11px] text-gray-400">{relative(item.at)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-gray-500">{item.summary}</p>
                      <div className="mt-2 flex gap-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        <span>{item.category.replaceAll("_", " ")}</span><span>·</span><span>{item.priority}</span>
                      </div>
                    </Link>
                  )) : (
                    <p className="px-5 py-8 text-center text-sm text-gray-500">No recent customer voice is connected.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {aiBriefing ? (
                <section>
                  <SectionTitle icon={<ShieldAlert className="h-4 w-4" />} title="The skeptic's pass" detail="The memo had to survive an adversarial read before you saw it." />
                  <div className="mt-3 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-6">
                    <div><p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Challenge</p><p className="text-gray-700">{aiBriefing.critic.challenge}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Correction</p><p className="text-gray-700">{aiBriefing.critic.correction}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Still unresolved</p><p className="text-gray-700">{aiBriefing.critic.unresolvedRisk}</p></div>
                  </div>
                </section>
              ) : null}

              {aiBriefing?.questionsToResolve.length ? (
                <section>
                  <SectionTitle icon={<AlertTriangle className="h-4 w-4" />} title="Questions that would sharpen the call" detail="The next evidence to collect—not more dashboard furniture." />
                  <ol className="mt-3 space-y-2 rounded-2xl border border-gray-200 bg-white p-5">
                    {aiBriefing.questionsToResolve.map((question, index) => <li key={question} className="flex gap-3 text-sm leading-6 text-gray-600"><span className="font-semibold text-gray-400">{index + 1}.</span>{question}</li>)}
                  </ol>
                </section>
              ) : null}
              <section>
                <SectionTitle icon={<CircleDollarSign className="h-4 w-4" />} title="Evidence coverage" detail="What War Room can prove—and where it is still blind." />
                <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-2">
                  {snapshot.sources.map((source) => {
                    const tone = sourceTone[source.status];
                    const content = (
                      <div className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-gray-50">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-gray-900">{source.label}</p>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{tone.label}</span>
                          </div>
                          <p className="mt-0.5 text-xs leading-5 text-gray-500">{source.detail}</p>
                          {source.updatedAt ? <p className="text-[11px] text-gray-400">Updated {relative(source.updatedAt)}</p> : null}
                        </div>
                      </div>
                    );
                    return source.href ? <Link key={source.key} href={source.href}>{content}</Link> : <div key={source.key}>{content}</div>;
                  })}
                </div>
              </section>

              <section>
                <SectionTitle icon={<Clock3 className="h-4 w-4" />} title="Decision trail" detail="Memory prevents us from rewriting history." />
                <div className="mt-3 rounded-2xl border border-gray-200 bg-white">
                  {snapshot.decisions.length ? snapshot.decisions.map((decision, index) => (
                    <div key={decision.id} className={`px-4 py-4 ${index ? "border-t border-gray-100" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-5 text-gray-900">{decision.recommendation_title}</p>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                          decision.decision === "backed" ? "bg-emerald-50 text-emerald-700" : decision.decision === "completed" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                        }`}>{decisionLabels[decision.decision]}</span>
                      </div>
                      <p className="mt-2 text-[11px] text-gray-400">{decision.decided_by} · {relative(decision.created_at)}</p>
                    </div>
                  )) : (
                    <p className="px-5 py-8 text-center text-sm text-gray-500">No decisions recorded yet. The machine remembers once we choose.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SectionTitle({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-gray-950">{icon}<h2 className="font-serif text-xl font-bold">{title}</h2></div>
      <p className="mt-1 text-sm text-gray-500">{detail}</p>
    </div>
  );
}

function WarRoomLoading() {
  return (
    <div className="space-y-5">
      <div className="h-[420px] animate-pulse rounded-[2rem] bg-gray-900" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
    </div>
  );
}
