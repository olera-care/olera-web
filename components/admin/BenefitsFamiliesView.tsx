"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  buildNavigatorReviewPrompt,
  type ReviewItem,
  type ReviewPick,
} from "@/lib/benefits/navigator-review-prompt";

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
  situation: string | null;
  situationComplete: boolean;
  reach: { hasPhone: boolean; textable: boolean };
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
  lifecycle: { status: LifecycleStatus; detail: string | null };
  navigator: { status: "pending" | "sent" | "dismissed"; composedAt: string | null } | null;
}

/** Full draft payload from the per-family GET (list rows carry status only). */
interface NavigatorDetail {
  status?: "pending" | "sent" | "dismissed";
  subject?: string;
  body?: string;
  /** TJ-voiced companion text; {link} placeholder is replaced at send. */
  sms?: string | null;
  composed_at?: string;
  sent_at?: string;
  /** Full pickSnapshot from metadata — the letter's verifiable claims. */
  pick?: ReviewPick;
}

type LifecycleStatus =
  | "needs_help"
  | "stalled"
  | "acting"
  | "returned"
  | "working"
  | "resolved"
  | "new"
  | "in_cascade";

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
    situationComplete: number;
    textable: number;
    wantsHelp: number;
    stuck: Record<string, number>;
    lifecycle: Record<string, number>;
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
  const [filter, setFilter] = useState<LifecycleStatus | "all" | "draft_ready">("all");
  const [exportState, setExportState] = useState<
    "idle" | "working" | "error" | { copied: number; failed: number; downloaded: boolean }
  >("idle");
  const [timelines, setTimelines] = useState<Record<string, TimelineEvent[] | "loading" | "error">>({});
  const [noteText, setNoteText] = useState("");
  const [caseBusy, setCaseBusy] = useState(false);
  const [caseError, setCaseError] = useState<string | null>(null);

  const [navigators, setNavigators] = useState<Record<string, NavigatorDetail | null>>({});

  const loadTimeline = useCallback(async (profileId: string) => {
    setTimelines((t) => ({ ...t, [profileId]: "loading" }));
    try {
      const res = await fetch(`/api/admin/benefits/families/${profileId}`);
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      setTimelines((t) => ({ ...t, [profileId]: d.events as TimelineEvent[] }));
      setNavigators((n) => ({ ...n, [profileId]: (d.navigator as NavigatorDetail) ?? null }));
    } catch {
      setTimelines((t) => ({ ...t, [profileId]: "error" }));
    }
  }, []);

  // Navigator letter: send (after TJ's read/edit) or dismiss the draft.
  // Send is outward-facing and irreversible — confirm first, surface the
  // server's reason on a block (governance cap, missing email).
  const navigatorAction = useCallback(
    async (
      profileId: string,
      action: "navigator_send" | "navigator_dismiss" | "navigator_test" | "navigator_recompose",
      subject?: string,
      letter?: string,
      sms?: string,
      testEmail?: string,
    ): Promise<boolean> => {
      setCaseBusy(true);
      setCaseError(null);
      try {
        const res = await fetch(`/api/admin/benefits/families/${profileId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, subject, body: letter, sms, testEmail }),
        });
        const d = await res.json().catch(() => null);
        if (!res.ok) {
          setCaseError(d?.error || "That didn't go through. Try again.");
          return false;
        }
        // Test sends change nothing server-side — skip the refetch churn.
        if (action !== "navigator_test") {
          await Promise.all([fetchData(), loadTimeline(profileId)]);
        }
        return true;
      } catch {
        setCaseError("That didn't go through. Try again.");
        return false;
      } finally {
        setCaseBusy(false);
      }
    },
    [fetchData, loadTimeline],
  );

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

  const deleteFamily = useCallback(
    async (profileId: string, label: string) => {
      const typed = window.prompt(
        `This permanently deletes ${label} — profile, account, sign-in, and all activity. Type "delete" to confirm.`,
      );
      if (typed?.trim().toLowerCase() !== "delete") return;
      setCaseBusy(true);
      setCaseError(null);
      try {
        const res = await fetch(`/api/admin/benefits/families/${profileId}`, { method: "DELETE" });
        // Optimistic removal either way: the intake events (which drive this
        // list) delete first in the chain, so the row is gone from the data
        // even when a later sub-step (e.g. auth user) reports an error. The
        // background refetch reconciles the truth.
        setExpanded(null);
        setData((d) =>
          d
            ? {
                ...d,
                families: d.families.filter((f) => f.profileId !== profileId),
                summary: { ...d.summary, uniqueFamilies: Math.max(0, d.summary.uniqueFamilies - 1) },
              }
            : d,
        );
        if (!res.ok) {
          setCaseError("Deleted, but some linked records may remain (check server logs).");
        }
        void fetchData();
      } catch {
        setCaseError("Delete request failed. Refresh to see its actual state.");
      } finally {
        setCaseBusy(false);
      }
    },
    [fetchData],
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
  const draftReadyCount = families.filter((f) => f.navigator?.status === "pending").length;

  /** Redacted review context for the AI fact-check prompt — never carries
   *  the family's name or email (the name is passed only so the builder can
   *  strip it from the letter text). */
  const reviewContextFor = (f: FamilyRow): Omit<ReviewItem, "draft" | "pick"> => {
    // "Care Seeker" is a stored placeholder, not a name — most benefits
    // profiles carry it. Redacting its "first name" would mangle prose.
    const name = f.displayName?.trim();
    const isPlaceholder = !name || name.toLowerCase() === "care seeker";
    return {
      state: f.state,
      careNeed: f.careNeed ? CARE_NEED_LABELS[f.careNeed] ?? f.careNeed : null,
      situation: f.situation,
      completedAt: f.completedAt,
      firstName: isPlaceholder ? null : name.split(/\s+/)[0] || null,
    };
  };

  /** Batch export: pull every pending draft via the existing per-family GET,
   *  build one paste-ready fact-check prompt, and copy it to the clipboard. */
  const exportPendingDrafts = async () => {
    setExportState("working");
    try {
      const pending = families.filter((f) => f.navigator?.status === "pending");
      const results = await Promise.all(
        pending.map(async (f) => {
          try {
            const res = await fetch(`/api/admin/benefits/families/${f.profileId}`);
            if (!res.ok) return null;
            const d = await res.json();
            const nav = d.navigator as NavigatorDetail | undefined;
            if (nav?.status !== "pending" || !nav.body) return null;
            return {
              ...reviewContextFor(f),
              draft: { subject: nav.subject ?? "", body: nav.body, sms: nav.sms ?? null },
              pick: nav.pick ?? null,
            } satisfies ReviewItem;
          } catch {
            return null;
          }
        }),
      );
      const items = results.filter((r): r is ReviewItem => r !== null);
      if (items.length === 0) throw new Error("no drafts loaded");
      const prompt = buildNavigatorReviewPrompt(items);
      let downloaded = false;
      try {
        await window.navigator.clipboard.writeText(prompt);
      } catch {
        // The fetches can outlive the click's transient user activation
        // (always in Safari, sometimes in Chromium), which voids clipboard
        // access. The prompt is built — deliver it as a file instead.
        const url = URL.createObjectURL(new Blob([prompt], { type: "text/markdown" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "navigator-draft-review.md";
        a.click();
        URL.revokeObjectURL(url);
        downloaded = true;
      }
      setExportState({ copied: items.length, failed: pending.length - items.length, downloaded });
      setTimeout(() => setExportState("idle"), 6000);
    } catch {
      setExportState("error");
    }
  };
  const matchesFilter = (f: FamilyRow) =>
    filter === "all"
      ? true
      : filter === "draft_ready"
        ? f.navigator?.status === "pending"
        : f.lifecycle.status === filter;
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
      {/* Caseload card removed (TJ, 2026-07-29 QA): stuck families already
          float to the top of the list with lifecycle chips — the card was a
          duplicate signal spending a KPI slot. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          detail={`${summary.enriched} answered something · ${summary.situationComplete ?? 0} gave the full picture`}
        />
        <StatCard
          label="Textable"
          value={summary.uniqueFamilies ? `${Math.round(((summary.textable ?? 0) / summary.uniqueFamilies) * 100)}%` : "0%"}
          detail={`${summary.textable ?? 0} of ${summary.uniqueFamilies} with phone + consent (SMS can reach them)`}
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

      {/* Lifecycle filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            ["all", "All"],
            ["draft_ready", "Draft ready"],
            ["needs_help", "Needs help"],
            ["stalled", "Stalled"],
            ["acting", "Acting"],
            ["returned", "Returned"],
            ["new", "New"],
            ["in_cascade", "In cascade"],
            ["working", "Working"],
            ["resolved", "Resolved"],
          ] as [LifecycleStatus | "all" | "draft_ready", string][]
        ).map(([key, label]) => {
          const count =
            key === "all" ? families.length
            : key === "draft_ready" ? draftReadyCount
            : summary.lifecycle?.[key] ?? 0;
          if (key !== "all" && count === 0 && filter !== key) return null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === key ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label} <span className={filter === key ? "text-gray-300" : "text-gray-400"}>{count}</span>
            </button>
          );
        })}
        {draftReadyCount > 0 && (
          <span className="ml-auto flex items-center gap-2">
            {typeof exportState === "object" && (
              <span className="text-[11px] font-medium text-emerald-700">
                {exportState.downloaded ? "Downloaded" : "Copied"} {exportState.copied} draft
                {exportState.copied === 1 ? "" : "s"} ✓{" "}
                {exportState.downloaded ? "open the .md file and paste it" : "paste into your AI of choice"}
                {exportState.failed > 0 ? ` (${exportState.failed} failed to load)` : ""}
              </span>
            )}
            {exportState === "error" && (
              <span className="text-[11px] font-medium text-red-600">
                Couldn&apos;t build the export. Try again.
              </span>
            )}
            <button
              onClick={exportPendingDrafts}
              disabled={exportState === "working"}
              title="Copies a fact-check prompt covering every pending draft — paste it into ChatGPT or Perplexity to verify phone numbers, program facts, and pick fit"
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {exportState === "working" ? "Building…" : `Copy AI review prompt (${draftReadyCount})`}
            </button>
          </span>
        )}
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
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {families.filter(matchesFilter).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                      No families in this status right now.
                    </td>
                  </tr>
                )}
                {families
                  .filter(matchesFilter)
                  .map((f) => (
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
                      {/* Reachability: how a human (or the SMS rungs) can
                          actually reach them. Nothing shown = email only. */}
                      {f.reach.textable ? (
                        <p className="text-[11px] font-medium text-emerald-700 mt-0.5">📱 Textable</p>
                      ) : f.reach.hasPhone ? (
                        <p className="text-[11px] text-gray-400 mt-0.5">📱 Phone on file, call only</p>
                      ) : null}
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
                      {/* Phase 3: the real situation, once the family gives it */}
                      {f.situation && (
                        <p className="text-xs text-gray-600 mt-0.5">{f.situation}</p>
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
                      <span className="inline-flex items-center gap-1.5">
                        <LifecycleChip lifecycle={f.lifecycle} noteCount={f.caseInfo.noteCount} />
                        {f.navigator?.status === "pending" && (
                          <span
                            className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                            title="A navigator letter is drafted and waiting for your review"
                          >
                            ✍ Draft ready
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(f.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                  {expanded === f.profileId && (
                    <tr className="bg-gray-50/60">
                      <td colSpan={5} className="px-6 py-4">
                        <CasePanel
                          timeline={timelines[f.profileId]}
                          caseInfo={f.caseInfo}
                          signals={f.signals}
                          reach={f.reach}
                          situationComplete={f.situationComplete}
                          noteText={noteText}
                          setNoteText={setNoteText}
                          busy={caseBusy}
                          error={caseError}
                          navigator={navigators[f.profileId]}
                          reviewContext={reviewContextFor(f)}
                          familyLabel={f.displayName || f.email || "this family"}
                          onNavigator={(action, subject, letter, sms, testEmail) =>
                            navigatorAction(f.profileId, action, subject, letter, sms, testEmail)
                          }
                          onAction={(action, text) => caseAction(f.profileId, action, text)}
                          onDelete={() => deleteFamily(f.profileId, f.displayName || f.email || "this family")}
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

/**
 * The navigator draft queue's editing surface: the AI-composed, TJ-signed
 * letter, editable in place. Nothing sends until the Send button — and every
 * edit made here is the concierge feedback loop the draft-queue design exists
 * to capture.
 */
function NavigatorDraftEditor({
  navigator,
  reviewContext,
  familyLabel,
  textable,
  busy,
  onNavigator,
}: {
  navigator: NavigatorDetail;
  reviewContext: Omit<ReviewItem, "draft" | "pick">;
  familyLabel: string;
  textable: boolean;
  busy: boolean;
  onNavigator: (
    action: "navigator_send" | "navigator_dismiss" | "navigator_test" | "navigator_recompose",
    subject?: string,
    letter?: string,
    sms?: string,
    testEmail?: string,
  ) => Promise<boolean>;
}) {
  const [subject, setSubject] = useState(navigator.subject ?? "");
  const [letter, setLetter] = useState(navigator.body ?? "");
  const [sms, setSms] = useState(navigator.sms ?? "");
  // Test-send: remember the reviewer's address across sessions; empty falls
  // back server-side to the signed-in admin's own email.
  const [testEmail, setTestEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem("olera.navigator.testEmail") || "";
    } catch {
      return "";
    }
  });
  const [testState, setTestState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  // Copy a single-draft fact-check prompt (with TJ's in-place edits) for
  // pasting into an external AI before sending.
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const copyReviewPrompt = async () => {
    try {
      const prompt = buildNavigatorReviewPrompt([
        {
          ...reviewContext,
          draft: { subject, body: letter, sms: sms.trim() || null },
          pick: navigator.pick ?? null,
        },
      ]);
      await window.navigator.clipboard.writeText(prompt);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 4000);
    } catch {
      setCopyState("error");
    }
  };
  const sendTest = async () => {
    setTestState("sending");
    try {
      window.localStorage.setItem("olera.navigator.testEmail", testEmail);
    } catch {
      /* private mode — remembering is best-effort */
    }
    const ok = await onNavigator("navigator_test", subject, letter, undefined, testEmail || undefined);
    setTestState(ok ? "sent" : "error");
    if (ok) setTimeout(() => setTestState("idle"), 4000);
  };
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
          ✍ Navigator letter — waiting for you
        </p>
        <p className="text-[11px] text-amber-700/70">
          {navigator.pick?.shortName ? `First step: ${navigator.pick.shortName} · ` : ""}
          drafted {navigator.composed_at ? new Date(navigator.composed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
        </p>
      </div>
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="mb-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        placeholder="Subject"
      />
      <textarea
        value={letter}
        onChange={(e) => setLetter(e.target.value)}
        rows={Math.min(14, Math.max(8, letter.split("\n").length + 2))}
        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400/40"
      />
      {textable ? (
        <div className="mt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700/80">
            Companion text — sends with the email ({"{link}"} becomes their plan link; STOP line added automatically)
          </p>
          <textarea
            value={sms}
            onChange={(e) => setSms(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            placeholder="No text drafted — the standard first-step text will be sent instead."
          />
          <p className="text-right text-[10px] tabular-nums text-amber-700/60">{sms.length} chars</p>
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] text-amber-700/60">
          No text message will go out: this family hasn&apos;t consented to texts.
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => {
            if (window.confirm(`Send this letter to ${familyLabel}? It goes out under your name; replies land in the reply-to inbox (support).`)) {
              onNavigator("navigator_send", subject, letter, sms.trim() || undefined);
            }
          }}
          disabled={busy || letter.trim().length < 40}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          Send as TJ
        </button>
        <button
          onClick={() => {
            if (window.confirm("Dismiss this draft? The family will not get a first-step letter unless you contact them another way.")) {
              onNavigator("navigator_dismiss");
            }
          }}
          disabled={busy}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40"
        >
          Dismiss
        </button>
        <button
          onClick={() => {
            if (window.confirm("Re-draft this letter from current program data? Your edits to this draft will be discarded.")) {
              onNavigator("navigator_recompose");
            }
          }}
          disabled={busy}
          title="Re-drafts the letter from today's program data — use after fact-check corrections deploy, so stale phone numbers and figures don't need hand-editing"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40"
        >
          {busy ? "Working…" : "Recompose"}
        </button>
        <p className="text-[11px] text-amber-700/70">Sends the email now{textable ? " plus the companion text" : ""}.</p>
      </div>
      {/* Test send: the exact email in a reviewer's inbox. Consumes nothing —
          no stamps, no text, no cap slot; the draft stays pending. */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-200/60 pt-3">
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="Test inbox (blank = your admin email)"
          className="w-64 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        />
        <button
          onClick={sendTest}
          disabled={busy || testState === "sending" || letter.trim().length < 40}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40"
        >
          {testState === "sending" ? "Sending…" : "Email me a test"}
        </button>
        <button
          onClick={copyReviewPrompt}
          title="Copies a fact-check prompt for this letter (with your edits) — paste into ChatGPT or Perplexity to verify the phone number, program facts, and fit"
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
        >
          {copyState === "copied" ? "Copied ✓" : "Copy AI review prompt"}
        </button>
        {copyState === "error" && (
          <span className="text-[12px] font-medium text-red-600">Copy failed — try again.</span>
        )}
        {testState === "sent" && (
          <span className="text-[12px] font-medium text-emerald-700">Test sent ✓ check your inbox</span>
        )}
        <p className="basis-full text-[11px] text-amber-700/60">
          Sends this letter (with your edits) as a real email to the test inbox. Nothing is
          recorded, no text goes out, and the draft stays here.
        </p>
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

const LIFECYCLE_CHIP: Record<LifecycleStatus, { label: string; className: string }> = {
  needs_help: { label: "Needs help", className: "bg-amber-100 text-amber-800" },
  stalled: { label: "Stalled", className: "bg-rose-50 text-rose-700" },
  acting: { label: "Acting", className: "bg-emerald-50 text-emerald-700" },
  returned: { label: "Returned", className: "bg-blue-50 text-blue-700" },
  working: { label: "Working", className: "bg-indigo-50 text-indigo-700" },
  resolved: { label: "Resolved", className: "bg-emerald-100 text-emerald-800" },
  new: { label: "New", className: "bg-gray-900 text-white" },
  in_cascade: { label: "In cascade", className: "bg-gray-100 text-gray-500" },
};

function LifecycleChip({
  lifecycle,
  noteCount,
}: {
  lifecycle: FamilyRow["lifecycle"];
  noteCount: number;
}) {
  const chip = LIFECYCLE_CHIP[lifecycle.status] ?? LIFECYCLE_CHIP.in_cascade;
  return (
    <div>
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${chip.className}`}>
        {chip.label}
      </span>
      {(lifecycle.detail || noteCount > 0) && (
        <p className="text-[11px] text-gray-400 mt-1 max-w-[160px]">
          {[lifecycle.detail, noteCount > 0 ? `${noteCount} note${noteCount === 1 ? "" : "s"}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
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
  sms_in: "💬",
  viewed: "👁",
  acted: "✓",
  docs: "☑",
  outcome: "✦",
  note: "✎",
  case: "★",
  navigator: "✍",
};

function CasePanel({
  timeline,
  caseInfo,
  signals,
  reach,
  situationComplete,
  noteText,
  setNoteText,
  busy,
  error,
  navigator,
  reviewContext,
  familyLabel,
  onNavigator,
  onAction,
  onDelete,
}: {
  timeline: TimelineEvent[] | "loading" | "error" | undefined;
  caseInfo: FamilyRow["caseInfo"];
  signals: FamilyRow["signals"];
  reach: FamilyRow["reach"];
  situationComplete: boolean;
  noteText: string;
  setNoteText: (v: string) => void;
  busy: boolean;
  error: string | null;
  navigator: NavigatorDetail | null | undefined;
  reviewContext: Omit<ReviewItem, "draft" | "pick">;
  familyLabel: string;
  onNavigator: (
    action: "navigator_send" | "navigator_dismiss" | "navigator_test" | "navigator_recompose",
    subject?: string,
    letter?: string,
    sms?: string,
    testEmail?: string,
  ) => Promise<boolean>;
  onAction: (action: string, text?: string) => void;
  onDelete: () => void;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      {navigator?.status === "pending" && navigator.body && (
        <NavigatorDraftEditor
          key={navigator.composed_at}
          navigator={navigator}
          reviewContext={reviewContext}
          familyLabel={familyLabel}
          textable={reach.textable}
          busy={busy}
          onNavigator={onNavigator}
        />
      )}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Case timeline</p>
        <div className="flex gap-1">
          <SignalChip active={signals.emailOpened} label="Opened" />
          <SignalChip active={signals.emailClicked} label="Clicked" />
          <SignalChip active={signals.resultsViewed} label="Viewed" />
          <SignalChip active={signals.enriched} label="Enriched" />
          <SignalChip active={situationComplete} label="Full picture" />
          <SignalChip active={reach.textable} label="Textable" />
        </div>
      </div>
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
        <button
          onClick={onDelete}
          disabled={busy}
          className="ml-auto rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          Delete family
        </button>
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
