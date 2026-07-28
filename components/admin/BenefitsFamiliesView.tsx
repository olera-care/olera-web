"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";

/**
 * Benefits Families — the queue-shaped view of benefits intake completions.
 * KPI strip + what's-working breakdown + one row per family, newest first.
 * Rows link to the care-seeker detail page where the full record lives.
 */

const CARE_NEED_LABELS: Record<string, string> = {
  stayingAtHome: "Staying at home",
  payingForCare: "Paying for care",
  memoryHealth: "Memory & health",
  companionship: "Companionship",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "ASAP",
  within_month: "Within a month",
  few_months: "Few months",
  researching: "Researching",
  exploring: "Exploring",
  // Care-timeline values from other intake flows share the same field.
  immediate: "ASAP",
  within_1_month: "Within a month",
  within_3_months: "Within 3 months",
};

interface FamilyRow {
  profileId: string;
  displayName: string | null;
  email: string | null;
  state: string | null;
  careNeed: string | null;
  matchCount: number | null;
  topProgram: string | null;
  entrySource: string | null;
  providerSlug: string | null;
  isNewUser: boolean;
  completedAt: string;
  enrichment: {
    relationship: string | null;
    timeline: string | null;
    payments: string[] | null;
  };
  signals: {
    emailOpened: boolean;
    emailClicked: boolean;
    resultsViewed: boolean;
    enriched: boolean;
  };
  cascade: {
    status: "matched" | "first_step_sent" | "moving" | "wants_help" | "wrong_program";
    firstStepProgram: string | null;
    firstStepSentAt: string | null;
    outcomeAt: string | null;
    outcomeReason: string | null;
  };
  caseStatus: "wants_help" | "silent_after_checkin" | "action_stall" | "attention_stall" | null;
  caseInfo: { noteCount: number; contactedAt: string | null; resolvedAt: string | null };
}

interface TimelineEvent {
  at: string;
  kind: string;
  label: string;
  detail?: string;
}

interface FamiliesData {
  days: number;
  summary: {
    completions: number;
    uniqueFamilies: number;
    prevCompletions: number;
    engaged: number;
    enriched: number;
    wantsHelp: number;
    stuck: Record<string, number>;
  };
  breakdown: {
    topSources: { label: string; path: string | null; count: number }[];
    topStates: { state: string; count: number }[];
    careNeeds: { careNeed: string; count: number }[];
  };
  families: FamilyRow[];
}

export default function BenefitsFamiliesView() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<FamiliesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/benefits/families?days=${days}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setData(await res.json());
    } catch (err) {
      console.error("Failed to load benefits families:", err);
      setError("Couldn't load benefits families. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Case drill-in state ─────────────────────────────────────────────
  const [expanded, setExpanded] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<Record<string, TimelineEvent[] | "loading" | "error">>({});
  const [noteText, setNoteText] = useState("");
  const [caseBusy, setCaseBusy] = useState(false);
  const [caseError, setCaseError] = useState<string | null>(null);

  const loadTimeline = useCallback(async (profileId: string) => {
    setTimelines((t) => ({ ...t, [profileId]: "loading" }));
    try {
      const res = await fetch(`/api/admin/benefits/families/${profileId}`);
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      setTimelines((t) => ({ ...t, [profileId]: d.events as TimelineEvent[] }));
    } catch {
      setTimelines((t) => ({ ...t, [profileId]: "error" }));
    }
  }, []);

  const toggleExpand = useCallback(
    (profileId: string) => {
      setCaseError(null);
      setNoteText("");
      if (expanded === profileId) {
        setExpanded(null);
        return;
      }
      setExpanded(profileId);
      if (!timelines[profileId] || timelines[profileId] === "error") void loadTimeline(profileId);
    },
    [expanded, timelines, loadTimeline],
  );

  const caseAction = useCallback(
    async (profileId: string, action: string, text?: string) => {
      setCaseBusy(true);
      setCaseError(null);
      try {
        const res = await fetch(`/api/admin/benefits/families/${profileId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, text }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setNoteText("");
        await Promise.all([fetchData(), loadTimeline(profileId)]);
      } catch {
        setCaseError("Couldn't save that. Try again.");
      } finally {
        setCaseBusy(false);
      }
    },
    [fetchData, loadTimeline],
  );

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-gray-400">Loading families…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary, breakdown, families } = data;
  const delta = summary.completions - summary.prevCompletions;
  const engagedPct = summary.uniqueFamilies ? Math.round((summary.engaged / summary.uniqueFamilies) * 100) : 0;
  const enrichedPct = summary.uniqueFamilies ? Math.round((summary.enriched / summary.uniqueFamilies) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Window toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Families who completed a benefits intake, newest first. Rows open the full care-seeker record.
        </p>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                days === d ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <StatCard
          label="Completions"
          value={summary.completions}
          detail={
            delta === 0
              ? `same as prior ${data.days}d`
              : `${delta > 0 ? "+" : ""}${delta} vs prior ${data.days}d`
          }
          detailTone={delta > 0 ? "up" : delta < 0 ? "down" : "flat"}
        />
        <StatCard
          label="Engaged"
          value={`${engagedPct}%`}
          detail={`${summary.engaged} of ${summary.uniqueFamilies} opened, clicked, or viewed results`}
        />
        <StatCard
          label="Enriched"
          value={`${enrichedPct}%`}
          detail={`${summary.enriched} of ${summary.uniqueFamilies} answered follow-up questions`}
        />
        <StatCard
          label="Caseload"
          value={Object.values(summary.stuck ?? {}).reduce((a, b) => a + b, 0)}
          detail={
            Object.keys(summary.stuck ?? {}).length
              ? [
                  summary.stuck.wants_help ? `${summary.stuck.wants_help} wants help` : null,
                  summary.stuck.silent_after_checkin ? `${summary.stuck.silent_after_checkin} silent after check-in` : null,
                  summary.stuck.action_stall ? `${summary.stuck.action_stall} stalled at the call` : null,
                  summary.stuck.attention_stall ? `${summary.stuck.attention_stall} never saw their plan` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "stuck families float to the top below as the cascade runs"
          }
          detailTone={Object.values(summary.stuck ?? {}).reduce((a, b) => a + b, 0) > 0 ? "down" : "flat"}
        />
      </div>

      {/* What's working */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <BreakdownCard title="Top entry pages">
          {breakdown.topSources.map((s) => (
            <BreakdownRow
              key={s.path ?? "direct"}
              label={
                s.path ? (
                  <a href={s.path} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition-colors">
                    {s.label}
                  </a>
                ) : (
                  s.label
                )
              }
              count={s.count}
              total={summary.uniqueFamilies}
            />
          ))}
        </BreakdownCard>
        <BreakdownCard title="Top states">
          {breakdown.topStates.map((s) => (
            <BreakdownRow key={s.state} label={s.state} count={s.count} total={summary.uniqueFamilies} />
          ))}
        </BreakdownCard>
        <BreakdownCard title="Care needs">
          {breakdown.careNeeds.map((c) => (
            <BreakdownRow
              key={c.careNeed}
              label={CARE_NEED_LABELS[c.careNeed] ?? c.careNeed}
              count={c.count}
              total={summary.uniqueFamilies}
            />
          ))}
        </BreakdownCard>
      </div>

      {/* Family queue */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {families.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No completions in this window</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Family</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Need</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Came from</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Signals</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Cascade</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Case</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {families.map((f) => (
                  <Fragment key={f.profileId}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(f.profileId)}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/care-seekers/${f.profileId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                      >
                        {f.displayName || "Unnamed family"}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {f.email || "no email"}
                        {f.isNewUser && <span className="text-emerald-600"> · new</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">
                        {f.careNeed ? CARE_NEED_LABELS[f.careNeed] ?? f.careNeed : "—"}
                        {f.state && <span className="text-gray-400"> · {f.state}</span>}
                      </p>
                      {(f.enrichment.timeline || f.enrichment.payments?.length) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[
                            f.enrichment.timeline ? TIMELINE_LABELS[f.enrichment.timeline] ?? f.enrichment.timeline : null,
                            f.enrichment.payments?.length ? f.enrichment.payments.join(", ") : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {f.entrySource
                        ? f.entrySource.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ")
                        : f.providerSlug
                          ? `provider: ${f.providerSlug}`
                          : "direct"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <SignalChip active={f.signals.emailOpened} label="Opened" />
                        <SignalChip active={f.signals.emailClicked} label="Clicked" />
                        <SignalChip active={f.signals.resultsViewed} label="Viewed" />
                        <SignalChip active={f.signals.enriched} label="Enriched" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CascadeChip cascade={f.cascade} />
                    </td>
                    <td className="px-4 py-3">
                      <CaseChip caseStatus={f.caseStatus} caseInfo={f.caseInfo} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(f.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                  {expanded === f.profileId && (
                    <tr className="bg-gray-50/60">
                      <td colSpan={7} className="px-6 py-4">
                        <CasePanel
                          timeline={timelines[f.profileId]}
                          caseInfo={f.caseInfo}
                          noteText={noteText}
                          setNoteText={setNoteText}
                          busy={caseBusy}
                          error={caseError}
                          onAction={(action, text) => caseAction(f.profileId, action, text)}
                        />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  detailTone,
}: {
  label: string;
  value: string | number;
  detail: string;
  detailTone?: "up" | "down" | "flat";
}) {
  const toneClass =
    detailTone === "up" ? "text-emerald-600" : detailTone === "down" ? "text-amber-600" : "text-gray-400";
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 font-serif mt-1">{value}</p>
      <p className={`text-xs mt-1 ${toneClass}`}>{detail}</p>
    </div>
  );
}

function BreakdownCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BreakdownRow({ label, count, total }: { label: React.ReactNode; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 flex-1 truncate">{label}</span>
      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
        <div className="h-full bg-gray-300 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right shrink-0">{count}</span>
    </div>
  );
}

const CASCADE_CHIP: Record<
  FamilyRow["cascade"]["status"],
  { label: string; className: string }
> = {
  matched: { label: "Matched", className: "bg-gray-50 text-gray-400" },
  first_step_sent: { label: "First step sent", className: "bg-blue-50 text-blue-700" },
  moving: { label: "Moving", className: "bg-emerald-50 text-emerald-700" },
  wants_help: { label: "Wants help", className: "bg-amber-100 text-amber-800" },
  wrong_program: { label: "Wrong program", className: "bg-rose-50 text-rose-700" },
};

const REASON_LABELS: Record<string, string> = {
  already_enrolled: "already enrolled",
  did_not_qualify: "didn't qualify",
  too_complicated: "too complicated",
  other: "something else",
};

function CascadeChip({ cascade }: { cascade: FamilyRow["cascade"] }) {
  const chip = CASCADE_CHIP[cascade.status] ?? CASCADE_CHIP.matched;
  const detail =
    cascade.status === "first_step_sent" && cascade.firstStepProgram
      ? cascade.firstStepProgram
      : cascade.status === "wrong_program" && cascade.outcomeReason
        ? REASON_LABELS[cascade.outcomeReason] ?? cascade.outcomeReason
        : null;
  return (
    <div>
      <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${chip.className}`}>
        {chip.label}
      </span>
      {detail && <p className="text-[11px] text-gray-400 mt-1 max-w-[140px] truncate">{detail}</p>}
    </div>
  );
}

const CASE_CHIP: Record<string, { label: string; className: string }> = {
  wants_help: { label: "Wants help", className: "bg-amber-100 text-amber-800" },
  silent_after_checkin: { label: "Silent after check-in", className: "bg-rose-50 text-rose-700" },
  action_stall: { label: "Stalled at the call", className: "bg-orange-50 text-orange-700" },
  attention_stall: { label: "Never saw plan", className: "bg-gray-100 text-gray-500" },
};

function CaseChip({
  caseStatus,
  caseInfo,
}: {
  caseStatus: FamilyRow["caseStatus"];
  caseInfo: FamilyRow["caseInfo"];
}) {
  if (caseInfo.resolvedAt) {
    return <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">Resolved</span>;
  }
  if (!caseStatus) {
    return caseInfo.contactedAt ? (
      <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 whitespace-nowrap">Working</span>
    ) : (
      <span className="text-[11px] text-gray-300">—</span>
    );
  }
  const chip = CASE_CHIP[caseStatus];
  return (
    <div>
      <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${chip.className}`}>{chip.label}</span>
      {caseInfo.noteCount > 0 && (
        <p className="text-[11px] text-gray-400 mt-1">{caseInfo.noteCount} note{caseInfo.noteCount === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}

const TIMELINE_ICON: Record<string, string> = {
  intake: "●",
  enriched: "✚",
  email: "✉",
  email_open: "👁",
  email_click: "↗",
  sms: "✆",
  viewed: "👁",
  acted: "✓",
  docs: "☑",
  outcome: "✦",
  note: "✎",
  case: "★",
};

function CasePanel({
  timeline,
  caseInfo,
  noteText,
  setNoteText,
  busy,
  error,
  onAction,
}: {
  timeline: TimelineEvent[] | "loading" | "error" | undefined;
  caseInfo: FamilyRow["caseInfo"];
  noteText: string;
  setNoteText: (v: string) => void;
  busy: boolean;
  error: string | null;
  onAction: (action: string, text?: string) => void;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">Case timeline</p>
      {timeline === "loading" || timeline === undefined ? (
        <p className="text-sm text-gray-400 py-2">Loading timeline…</p>
      ) : timeline === "error" ? (
        <p className="text-sm text-red-600 py-2">Couldn&apos;t load the timeline. Collapse and reopen to retry.</p>
      ) : timeline.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No recorded touches yet.</p>
      ) : (
        <ol className="space-y-1.5 mb-4">
          {timeline.map((e, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="w-9 shrink-0 text-right text-[11px] text-gray-400 pt-0.5">
                {new Date(e.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className="w-4 shrink-0 text-center text-gray-400">{TIMELINE_ICON[e.kind] || "·"}</span>
              <span className="min-w-0">
                <span className="text-gray-800">{e.label}</span>
                {e.detail && <span className="block text-[12px] text-gray-400">{e.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a case note…"
          className="flex-1 min-w-[220px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        />
        <button
          onClick={() => noteText.trim() && onAction("note", noteText.trim())}
          disabled={busy || !noteText.trim()}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          Save note
        </button>
        {caseInfo.resolvedAt ? (
          <button onClick={() => onAction("reopen")} disabled={busy} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40">
            Reopen case
          </button>
        ) : (
          <>
            <button onClick={() => onAction("contacted")} disabled={busy} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40">
              I contacted them
            </button>
            <button onClick={() => onAction("resolved")} disabled={busy} className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-40">
              Mark resolved
            </button>
          </>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}

function SignalChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-300"
      }`}
    >
      {label}
    </span>
  );
}
