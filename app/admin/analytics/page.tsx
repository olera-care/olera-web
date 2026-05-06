"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PulseHeader from "@/components/admin/PulseHeader";
import {
  resolveRange,
  rangeLabel,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";
import { useAnimatedCount } from "@/hooks/use-animated-count";
import VariantPreviewCard from "@/components/admin/VariantPreviewCard";
import VariantSessionsList from "@/components/admin/VariantSessionsList";
import { INTAKE_VARIANTS, type IntakeVariant } from "@/lib/analytics/variant";
import { variantSurfaceLabel, variantSubLabel } from "@/lib/analytics/variant-copy";

interface WindowedCounts {
  page_view: number;
  search_click: number;
  benefits_started: number;
  lead_received: number;
  review_received: number;
  question_received: number;
  provider_saved: number;
  benefits_completed: number;
  matches_activated: number;
}

interface ProviderDistinctCounts {
  qa_signins: number;
  page_claims: number;
  question_answerers: number;
  lead_engagers: number;
  teaser_clickers: number;
  qa_email_openers: number;
}

interface ProviderQaFunnel {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  signed_in: number;
  answered: number;
  qa_success_arrivals: number;
  clicked_dashboard: number;
  edited_profile: number;
  clicked_dashboard_by_source: {
    qa_teaser: number;
    hero: number;
  };
}

interface ProviderQaVariantRow {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  phi_filtered: number;
}

interface ProviderQaFunnelByVariant {
  A: ProviderQaVariantRow;
  B: ProviderQaVariantRow;
  unassigned: ProviderQaVariantRow;
}

interface QaEmailIssue {
  reason: string;
  count: number;
  type: "bounced" | "complained";
}

interface BenefitsFunnel {
  // Distinct sessions that saw the module render. Apples-to-apples top-of-
  // funnel for all four arms (benefits_entry_viewed for the 3 form arms,
  // outreach_module_impression for the outreach arm).
  impressions: number;
  started: number;
  care_need_completed: number;
  age_completed: number;
  financial_completed: number;
  saved: number;
}

interface BenefitsFunnelByVariant {
  // V3 active arms (post-cutover)
  availability: BenefitsFunnel;
  loss: BenefitsFunnel;
  empathic: BenefitsFunnel;
  // 4th arm — H1 demand-test surface, replaces SBF for 20% of provider-page
  // visitors. Populates impressions, started (card click), and saved (form
  // submission); middle "care need" step is N/A and renders as "—".
  outreach: BenefitsFunnel;
  // 5th arm (since 2026-05-05) — Q&A enrichment ON, SBF + outreach OFF.
  // Populates impressions (QASectionV2 mount in arm) and saved (post-question
  // email enrichment). Middle stages N/A → "—".
  qa_email_capture: BenefitsFunnel;
  // Legacy V2 arms — historical, retained for the rollup window when V2 data
  // exists. Frozen after cutover.
  control: BenefitsFunnel;
  money_loss: BenefitsFunnel;
  unassigned: BenefitsFunnel;
}

interface ReferrerBreakdown {
  ai_chat: number;
  search: number;
  social: number;
  olera_internal: number;
  direct: number;
  other: number;
}

// SBF submissions bucketed by entry source. Both editorial AND provider
// mounts now tag entrySource — editorial passes /caregiver-support/{slug},
// provider passes /provider/{slug}. The query filters to NOT NULL so non-
// SBF account creations (auth callback, claim flows, listing creation)
// don't pollute the counts. Pre-tagging-deploy provider SBF rows are NULL
// and therefore invisible until enough time passes for tagged inserts to
// dominate the window.
interface EntrySourceBreakdown {
  total: number;
  editorial_total: number;
  provider_total: number;
  other_total: number;
  top_editorial_articles: Array<{ slug: string; count: number }>;
}

interface SummaryResponse {
  windowed: {
    range: { from: string | null; to: string | null };
    counts: WindowedCounts;
    unique_sessions_page_view: number;
    provider_distinct_counts: ProviderDistinctCounts;
    qa_funnel: ProviderQaFunnel;
    qa_funnel_by_variant: ProviderQaFunnelByVariant;
    qa_email_issues: QaEmailIssue[];
    benefits_funnel: BenefitsFunnel;
    benefits_funnel_by_variant: BenefitsFunnelByVariant;
    referrer_breakdown: ReferrerBreakdown;
    entry_source_breakdown: EntrySourceBreakdown;
  };
  prior: {
    counts: WindowedCounts;
    unique_sessions_page_view: number;
    provider_distinct_counts: ProviderDistinctCounts;
    qa_funnel: ProviderQaFunnel;
    qa_funnel_by_variant: ProviderQaFunnelByVariant;
    qa_email_issues: QaEmailIssue[];
    benefits_funnel: BenefitsFunnel;
    benefits_funnel_by_variant: BenefitsFunnelByVariant;
    referrer_breakdown: ReferrerBreakdown;
    entry_source_breakdown: EntrySourceBreakdown;
  } | null;
  insight: string | null;
  botRejects: { count: number; date: string };
  topProviders: Array<{
    provider_id: string;
    provider_name: string | null;
    raw_views_7d: number;
    unique_sessions_7d: number;
    last_seen: string;
  }>;
  latestEvents: Array<{
    id: string;
    provider_id: string;
    event_type: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>;
}

const DEFAULT_RANGE: DateRangeValue = {
  preset: "7d",
  customFrom: "",
  customTo: "",
};

function rangeFromSearch(sp: ReturnType<typeof useSearchParams>): DateRangeValue {
  const preset = sp.get("preset");
  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  if (preset === "custom") return { preset: "custom", customFrom: from, customTo: to };
  const valid = ["all", "today", "yesterday", "7d", "30d", "90d", "1y"] as const;
  if (preset && (valid as readonly string[]).includes(preset)) {
    return { preset: preset as DateRangeValue["preset"], customFrom: "", customTo: "" };
  }
  return DEFAULT_RANGE;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const range = useMemo(() => rangeFromSearch(searchParams), [searchParams]);
  const setRange = useCallback(
    (next: DateRangeValue) => {
      // Merge into existing params so other URL state (notably ?variant=
      // for the Family Intake drill-in expansion) survives a date-range
      // change. Replacing the URLSearchParams wholesale would silently
      // collapse any open drill-in.
      const params = new URLSearchParams(searchParams.toString());
      params.delete("preset");
      params.delete("from");
      params.delete("to");
      params.set("preset", next.preset);
      if (next.preset === "custom") {
        if (next.customFrom) params.set("from", next.customFrom);
        if (next.customTo) params.set("to", next.customTo);
      }
      const qs = params.toString();
      router.replace(qs ? `/admin/analytics?${qs}` : "/admin/analytics", { scroll: false });
    },
    [router, searchParams],
  );

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const { from, to } = resolveRange(range);
    const params = new URLSearchParams();
    if (from) params.set("date_from", from);
    if (to) params.set("date_to", to);
    params.set("range_label", rangeLabel(range));
    fetch(`/api/admin/analytics/summary?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div>
      <PulseHeader
        title="Analytics"
        kpiSuffix="page views"
        statsPath="/api/admin/analytics/views/stats"
        range={range}
        onRangeChange={setRange}
      />

      <InsightStrip insight={summary?.insight ?? null} loading={loading} />

      <WindowedCard summary={summary} loading={loading} range={range} />
      <QaFunnelCard summary={summary} loading={loading} range={range} />
      <BenefitsFunnelCard summary={summary} loading={loading} range={range} />
      <EntrySourceCard summary={summary} loading={loading} range={range} />
      <TopProvidersCard summary={summary} loading={loading} />
      <LatestEventsCard summary={summary} loading={loading} />

      <FootNote summary={summary} />
    </div>
  );
}

// ── Insight strip ────────────────────────────────────────────────────────

function InsightStrip({ insight, loading }: { insight: string | null; loading: boolean }) {
  if (loading) return <div className="h-10 mb-6 rounded-xl bg-gray-50 animate-pulse" />;
  if (!insight) return null;
  return (
    <div className="mb-6 rounded-xl border border-gray-100 bg-gradient-to-br from-emerald-50/40 to-white px-5 py-3.5">
      <div className="flex items-start gap-2.5">
        <span className="text-emerald-700 text-sm leading-relaxed select-none">✦</span>
        <p className="text-sm text-gray-800 leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}

// ── Windowed (KPI strip) ─────────────────────────────────────────────────

function WindowedCard({
  summary,
  loading,
  range,
}: {
  summary: SummaryResponse | null;
  loading: boolean;
  range: DateRangeValue;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 mb-6">
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="text-base font-semibold text-gray-900">{rangeLabel(range)}</h2>
        {loading && summary && (
          <span className="text-[11px] text-gray-400 animate-pulse">refreshing…</span>
        )}
      </div>
      {loading && !summary ? (
        <div className="h-72 rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
      ) : !summary ? (
        <p className="text-sm text-gray-400">Failed to load.</p>
      ) : (
        <div className="space-y-8">
          <AudienceGroup label="Care seekers" tint="bg-amber-50/70">
            <SubRow label="Discovery">
              <Stat
                label="Page views"
                value={summary.windowed.counts.page_view}
                prior={summary.prior?.counts.page_view ?? null}
                tooltip="Total provider page views in the window. Bots filtered server-side."
              />
              <Stat
                label="Unique sessions"
                value={summary.windowed.unique_sessions_page_view}
                prior={summary.prior?.unique_sessions_page_view ?? null}
                tooltip="Distinct anonymous browser sessions that viewed at least one provider page."
              />
              <Stat
                label="Card clicks"
                value={summary.windowed.counts.search_click}
                prior={summary.prior?.counts.search_click ?? null}
                tooltip="Click-throughs from a provider card on a results/browse page (NOT home-page Search button)."
              />
            </SubRow>
            <SubRow label="Traffic source" cols={6}>
              <Stat
                label="AI chat"
                value={summary.windowed.referrer_breakdown.ai_chat}
                prior={summary.prior?.referrer_breakdown.ai_chat ?? null}
                tooltip="Page views referred from ChatGPT, Claude, Gemini, Perplexity, or Copilot. The H2 capture target — should grow as llms.txt + JSON-LD land."
              />
              <Stat
                label="Search"
                value={summary.windowed.referrer_breakdown.search}
                prior={summary.prior?.referrer_breakdown.search ?? null}
                tooltip="Page views referred from Google, Bing, DuckDuckGo, Yahoo, or Brave search."
              />
              <Stat
                label="Social"
                value={summary.windowed.referrer_breakdown.social}
                prior={summary.prior?.referrer_breakdown.social ?? null}
                tooltip="Page views referred from Facebook, X, LinkedIn, Reddit, YouTube, TikTok, Instagram, or Pinterest."
              />
              <Stat
                label="Internal"
                value={summary.windowed.referrer_breakdown.olera_internal}
                prior={summary.prior?.referrer_breakdown.olera_internal ?? null}
                tooltip="Page views from olera.care itself — same-tab navigation between Olera pages."
              />
              <Stat
                label="Direct"
                value={summary.windowed.referrer_breakdown.direct}
                prior={summary.prior?.referrer_breakdown.direct ?? null}
                tooltip="Page views with no referrer — typed URLs, bookmarks, app webviews, or referrer-stripping browsers."
              />
              <Stat
                label="Other"
                value={summary.windowed.referrer_breakdown.other}
                prior={summary.prior?.referrer_breakdown.other ?? null}
                tooltip="Page views from any other external host. Long tail."
              />
            </SubRow>
            <SubRow label="Engagement">
              <Stat
                label="Questions"
                value={summary.windowed.counts.question_received}
                prior={summary.prior?.counts.question_received ?? null}
                href="/admin/questions"
                tooltip="New questions submitted by care seekers on provider pages."
              />
              <Stat
                label="Leads"
                value={summary.windowed.counts.lead_received}
                prior={summary.prior?.counts.lead_received ?? null}
                href="/admin/leads"
                tooltip="New connection requests from care seekers to providers."
              />
              <Stat
                label="Reviews"
                value={summary.windowed.counts.review_received}
                prior={summary.prior?.counts.review_received ?? null}
                href="/admin/reviews"
                tooltip="New reviews submitted on provider pages."
              />
              <Stat
                label="Saved"
                value={summary.windowed.counts.provider_saved}
                prior={summary.prior?.counts.provider_saved ?? null}
                tooltip="Providers saved by care seekers (guest + authenticated)."
              />
            </SubRow>
            <SubRow label="Family funnel">
              <Stat
                label="Benefits started"
                value={summary.windowed.counts.benefits_started}
                prior={summary.prior?.counts.benefits_started ?? null}
                tooltip="Care seekers who began the benefits intake on a provider page."
              />
              <Stat
                label="Benefits finished"
                value={summary.windowed.counts.benefits_completed}
                prior={summary.prior?.counts.benefits_completed ?? null}
                href="/admin/activity?actor=families"
                tooltip="Care seekers who completed the benefits intake and saved results."
              />
              <Stat
                label="Profiles published"
                value={summary.windowed.counts.matches_activated}
                prior={summary.prior?.counts.matches_activated ?? null}
                href="/admin/care-seekers"
                tooltip="Care seeker profiles flipped to active — visible to providers via matches."
              />
            </SubRow>
          </AudienceGroup>

          <AudienceGroup label="Providers" tint="bg-sky-50/70">
            <SubRow cols={6}>
              <Stat
                label="Opened Q&A emails"
                value={summary.windowed.provider_distinct_counts.qa_email_openers}
                prior={summary.prior?.provider_distinct_counts.qa_email_openers ?? null}
                tooltip="Distinct providers whose question-notification email was opened in this window. Apple Mail Privacy Protection prefetches images on receipt, inflating opens 30-50% for that cohort — click-through (Sign-ins from Q&A) is the cleaner signal."
              />
              <Stat
                label="Sign-ins from Q&A"
                value={summary.windowed.provider_distinct_counts.qa_signins}
                prior={summary.prior?.provider_distinct_counts.qa_signins ?? null}
                href="/admin/activity?actor=providers"
                tooltip="Distinct providers who clicked through a question-notification email and auto-signed in."
              />
              <Stat
                label="Page-flow claims"
                value={summary.windowed.provider_distinct_counts.page_claims}
                prior={summary.prior?.provider_distinct_counts.page_claims ?? null}
                tooltip="Distinct providers who claimed their listing from a public provider page (not from email)."
              />
              <Stat
                label="Answered questions"
                value={summary.windowed.provider_distinct_counts.question_answerers}
                prior={summary.prior?.provider_distinct_counts.question_answerers ?? null}
                href="/admin/questions"
                tooltip="Distinct providers who responded to ≥1 question."
              />
              <Stat
                label="Engaged with leads"
                value={summary.windowed.provider_distinct_counts.lead_engagers}
                prior={summary.prior?.provider_distinct_counts.lead_engagers ?? null}
                href="/admin/leads"
                tooltip="Distinct providers who clicked through a lead-notification email."
              />
              <Stat
                label="Clicked dashboard CTA"
                value={summary.windowed.provider_distinct_counts.teaser_clickers}
                prior={summary.prior?.provider_distinct_counts.teaser_clickers ?? null}
                href="/admin/activity?actor=providers"
                tooltip="Distinct providers who clicked the analytics-teaser CTA on the welcome card."
              />
            </SubRow>
          </AudienceGroup>
        </div>
      )}
    </div>
  );
}

// ── Q&A Email Funnel ─────────────────────────────────────────────────────

function QaFunnelCard({
  summary,
  loading,
  range,
}: {
  summary: SummaryResponse | null;
  loading: boolean;
  range: DateRangeValue;
}) {
  if (loading && !summary) {
    return <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 mb-6 h-48 animate-pulse" />;
  }
  if (!summary) return null;

  const f = summary.windowed.qa_funnel;
  const pf = summary.prior?.qa_funnel ?? null;
  const issues = summary.windowed.qa_email_issues;

  // Funnel stages — `prev` is the count of the immediate prior stage, used
  // to compute step-to-step conversion. `Sent` has no prior stage.
  const stages: Array<{
    label: string;
    value: number;
    prior: number | null;
    prev: number | null;
    tooltip: string;
  }> = [
    {
      label: "Sent",
      value: f.sent,
      prior: pf?.sent ?? null,
      prev: null,
      tooltip:
        "Provider question_received emails dispatched in this window (cohort denominator). One row per send in email_log.",
    },
    {
      label: "Delivered",
      value: f.delivered,
      prior: pf?.delivered ?? null,
      prev: f.sent,
      tooltip:
        "Resend confirmed acceptance by recipient mailserver. % shown is delivery rate (delivered / sent).",
    },
    {
      label: "Opened",
      value: f.opened,
      prior: pf?.opened ?? null,
      prev: f.delivered,
      tooltip:
        "Provider opened the email (Resend webhook 'opened' event). Apple Mail Privacy Protection prefetches images on receipt, inflating opens 30-50% for that cohort — clicks are the cleaner signal. % shown is open rate (opened / delivered).",
    },
    {
      label: "Clicked",
      value: f.clicked,
      prior: pf?.clicked ?? null,
      prev: f.opened,
      tooltip:
        "Provider clicked a tracked link in the email. % shown is click-to-open rate (CTOR).",
    },
    {
      label: "Signed in",
      value: f.signed_in,
      prior: pf?.signed_in ?? null,
      prev: f.clicked,
      tooltip:
        "Distinct providers who auto-signed in via the email's one-click link (provider_activity event). Approximate attribution — anchored on activity time, not the email's send time, so for short windows this can diverge from the email cohort above.",
    },
    {
      label: "Answered",
      value: f.answered,
      prior: pf?.answered ?? null,
      prev: f.signed_in,
      tooltip:
        "Distinct providers who responded to ≥1 question in this window. Same approximate-attribution caveat as Signed in.",
    },
    {
      label: "Arrived (qa-success)",
      value: f.qa_success_arrivals,
      prior: pf?.qa_success_arrivals ?? null,
      prev: f.answered,
      tooltip:
        "Distinct providers who answered a question and were auto-redirected to /provider with ?from=qa-success. Diagnostic for the redirect mechanic — separates 'did they reach the dashboard?' (this column) from 'did the dashboard hero nudge them into action?' (Edited profile, below). Should be ≈ Answered when the redirect is healthy.",
    },
    {
      label: "Clicked dashboard",
      value: f.clicked_dashboard,
      prior: pf?.clicked_dashboard ?? null,
      prev: f.qa_success_arrivals,
      tooltip:
        `Distinct providers who clicked a dashboard CTA in this window — union of the analytics teaser on /onboard (${f.clicked_dashboard_by_source.qa_teaser}) + dashboard hero CTA, engagement OR completion tier (${f.clicked_dashboard_by_source.hero}). A provider counted once even if they used multiple paths. Activity-anchored, not strictly subset of Arrived.`,
    },
    {
      label: "Edited profile",
      value: f.edited_profile,
      prior: pf?.edited_profile ?? null,
      prev: f.clicked_dashboard,
      tooltip:
        "Distinct providers who saved an edit to any profile section in this window. Lagging activation indicator — measures whether dashboard nudges convert into real profile work.",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 mb-6">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-base font-semibold text-gray-900">Provider Q&A Email Funnel</h2>
        {loading && <span className="text-[11px] text-gray-400 animate-pulse">refreshing…</span>}
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Cohort: {`question_received`} emails sent {rangeLabel(range).toLowerCase()}. Step % is conversion from the previous step.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-4">
        {stages.map((s) => (
          <FunnelStat key={s.label} {...s} />
        ))}
      </div>

      <VariantSplit byVariant={summary.windowed.qa_funnel_by_variant} />

      <div className="mt-6 pt-5 border-t border-gray-100">
        <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Bounces & complaints
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          Counted by event time in window (may reference Q&A emails sent earlier).
        </p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-4 max-w-md">
          <Stat
            label="Bounced"
            value={f.bounced}
            prior={pf?.bounced ?? null}
            tooltip="Distinct Q&A emails that bounced (hard or soft) in this window. Hard bounces should be triaged — typo addresses, dead domains."
          />
          <Stat
            label="Complained"
            value={f.complained}
            prior={pf?.complained ?? null}
            tooltip="Distinct Q&A emails recipients marked as spam in this window. Hurts sender reputation across all email."
          />
        </div>
        {issues.length === 0 ? (
          <p className="text-sm text-gray-400">No bounces or complaints in window.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {issues.map((iss, i) => (
              <li key={i} className="flex items-baseline gap-3">
                <span
                  className={`inline-flex w-20 shrink-0 text-[10px] font-medium uppercase tracking-wide ${
                    iss.type === "bounced" ? "text-rose-600" : "text-amber-700"
                  }`}
                >
                  {iss.type}
                </span>
                <span
                  className="flex-1 truncate text-gray-700"
                  title={iss.reason}
                >
                  {iss.reason}
                </span>
                <span className="tabular-nums text-gray-500">×{iss.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function VariantSplit({ byVariant }: { byVariant: ProviderQaFunnelByVariant }) {
  const a = byVariant.A;
  const b = byVariant.B;
  const totalAssigned = a.sent + b.sent;
  const waitingForFirstSend = totalAssigned === 0;

  const rate = (num: number, den: number) =>
    den > 0 ? `${Math.round((num / den) * 100)}%` : "—";

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">
        A/B Test — subject + preheader
      </div>
      <p className="text-[11px] text-gray-400 mb-3">
        A = production control (generic subject, no preheader). B = real question as subject + Olera-attributed preheader. Random 50/50 at send. PHI-filtered B falls back to a non-question subject when the question text mentions a health condition.
      </p>
      {waitingForFirstSend && (
        <p className="text-[12px] text-emerald-700 bg-emerald-50/60 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
          Waiting for the first variant-tagged send. The numbers below populate once a new <code className="text-[11px] bg-white/60 px-1 rounded">question_received</code> email fires post-deploy.
        </p>
      )}
      <div className="overflow-x-auto -mx-1">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="px-3 py-2 font-medium">Variant</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Sent</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Delivered</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Opened</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Open rate</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Clicked</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">CTR (open→click)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="px-3 py-2 font-medium text-gray-700">A (control)</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-900">{a.sent}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-700">{a.delivered}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-700">{a.opened}</td>
              <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">{rate(a.opened, a.delivered)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-700">{a.clicked}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-500">{rate(a.clicked, a.opened)}</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium text-gray-700">
                B (question-as-subject)
                {b.phi_filtered > 0 && (
                  <span
                    className="ml-2 text-[10px] text-amber-600 font-normal"
                    title={`${b.phi_filtered} of ${b.sent} B emails fell back to non-question subject due to PHI keyword in question text`}
                  >
                    · {b.phi_filtered} PHI-filtered
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-900">{b.sent}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-700">{b.delivered}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-700">{b.opened}</td>
              <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">{rate(b.opened, b.delivered)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-700">{b.clicked}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-500">{rate(b.clicked, b.opened)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {byVariant.unassigned.sent > 0 && (
        <p className="text-[11px] text-gray-400 mt-3">
          {byVariant.unassigned.sent} pre-deploy emails in window with no variant assigned (sent before A/B was wired up).
        </p>
      )}
    </div>
  );
}

// ── Family Intake ────────────────────────────────────────────────────────

function BenefitsFunnelCard({
  summary,
  loading,
  range,
}: {
  summary: SummaryResponse | null;
  loading: boolean;
  range: DateRangeValue;
}) {
  if (loading && !summary) {
    return <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 mb-6 h-48 animate-pulse" />;
  }
  if (!summary) return null;

  const f = summary.windowed.benefits_funnel;
  const pf = summary.prior?.benefits_funnel ?? null;

  // Distinct sessions per stage. `impressions` is the cohort denominator (the
  // module rendered on a provider page). `started` is the first interactive
  // step (care-need card click). Each subsequent stage is a session that
  // fired benefits_step_completed for that step. The save step's completion
  // is the conversion event — it fires immediately before the save-results
  // POST in BenefitsDiscoveryModule.
  const stages: Array<{
    label: string;
    value: number;
    prior: number | null;
    prev: number | null;
    tooltip: string;
  }> = [
    {
      label: "Impressions",
      value: f.impressions,
      prior: pf?.impressions ?? null,
      prev: null,
      tooltip:
        "Distinct sessions that saw the intake module render on a provider page (cohort denominator). Mirrors the outreach module's impression event so the four A/B arms can be compared apples-to-apples.",
    },
    {
      label: "Started",
      value: f.started,
      prior: pf?.started ?? null,
      prev: f.impressions,
      tooltip:
        "Distinct sessions that took the first interactive action — clicked a care-need card on the benefits form, or clicked a recommended provider card on the outreach module. % shown is conversion from Impressions (engagement rate).",
    },
    {
      label: "Care need ✓",
      value: f.care_need_completed,
      prior: pf?.care_need_completed ?? null,
      prev: f.started,
      tooltip:
        "Distinct sessions that completed step 1 (care need). % shown is conversion from Started.",
    },
    {
      label: "Age ✓",
      value: f.age_completed,
      prior: pf?.age_completed ?? null,
      prev: f.care_need_completed,
      tooltip:
        "Distinct sessions that completed step 2 (age). % shown is conversion from Care need.",
    },
    {
      label: "Financial ✓",
      value: f.financial_completed,
      prior: pf?.financial_completed ?? null,
      prev: f.age_completed,
      tooltip:
        "Distinct sessions that completed step 3 (medicaid + income). % shown is conversion from Age.",
    },
    {
      label: "Submitted email",
      value: f.saved,
      prior: pf?.saved ?? null,
      prev: f.financial_completed,
      tooltip:
        "Distinct sessions that clicked submit on the final step with a valid email. Event fires immediately before the backend save POST, so a rare backend failure won't reduce this count. % shown is conversion from Financial.",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 mb-6">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-base font-semibold text-gray-900">Family Intake</h2>
        {loading && <span className="text-[11px] text-gray-400 animate-pulse">refreshing…</span>}
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Top-line tracks the embedded benefits-help form on a provider page {rangeLabel(range).toLowerCase()} — distinct sessions per step, with % showing conversion from the previous step. The 4-arm A/B comparison below adds the AI agent outreach module so all variants can be compared on a shared Impressions denominator.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-4">
        {stages.map((s) => (
          <FunnelStat key={s.label} {...s} />
        ))}
      </div>

      <TrafficAllocationControl />

      <BenefitsVariantSplit byVariant={summary.windowed.benefits_funnel_by_variant} range={range} />
    </div>
  );
}

// Live dial for the intake A/B traffic split. Reads the current weights
// + version from /api/admin/analytics/variant-weights on mount, lets
// the operator edit per-arm percentages, and POSTs back when sum is
// exactly 100. Saving bumps the version on the server side, which
// reshuffles returning sessions on their next visit (assignment hash
// is namespaced by version — see lib/analytics/variant.ts).
//
// Arm list is derived from INTAKE_VARIANTS so adding/removing a code-
// level arm flows into this UI automatically. Layout uses an auto-fit
// grid so 4 / 5 / 6+ arms all flow naturally without leaving a dangling
// last card.
//
// Use cases this supports cleanly:
//   - Even split (default).
//   - Two-arm head-to-head: zero out the others.
//   - Single-arm rollout: 100 on one, 0 elsewhere.
//   - Off-but-keep-the-code-path: any 0 leaves the variant assignable
//     in code without taking traffic.

function buildEqualSplit(): Record<IntakeVariant, number> {
  // Distribute 100 across N arms. Floor each share, then assign the
  // remainder (100 - N*floor) to the first arm so the sum stays at
  // exactly 100. With 4 arms this is 25/25/25/25; with 3 it's 34/33/33;
  // with 7 it's 16/14/14/14/14/14/14. Always lands on integers, always
  // sums to 100 — i.e. always passes the save validator without
  // additional fiddling.
  const n = INTAKE_VARIANTS.length;
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;
  const out = Object.fromEntries(
    INTAKE_VARIANTS.map((v, i) => [v, base + (i === 0 ? remainder : 0)]),
  ) as Record<IntakeVariant, number>;
  return out;
}

function TrafficAllocationControl() {
  const [loaded, setLoaded] = useState(false);
  const initial = useMemo(buildEqualSplit, []);
  const [weights, setWeights] = useState<Record<IntakeVariant, number>>(initial);
  // Saved snapshot. Used to detect "is the form dirty?" so Save is only
  // enabled when something has actually changed AND the new sum is 100.
  const [savedWeights, setSavedWeights] = useState<Record<IntakeVariant, number>>(initial);
  const [version, setVersion] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Always reach a loaded state — even on auth failure or 500 — so the
    // form isn't a dead zone. Show error feedback so the operator knows
    // why the inputs hold the equal-split fallback instead of the live row.
    fetch("/api/admin/analytics/variant-weights", { cache: "no-store" })
      .then(async (r) => {
        if (cancelled) return;
        if (!r.ok) {
          setFeedback({ kind: "err", msg: `Failed to load current allocation (${r.status}).` });
          setLoaded(true);
          return;
        }
        const data = await r.json().catch(() => null);
        if (!data) {
          setFeedback({ kind: "err", msg: "Failed to parse current allocation." });
          setLoaded(true);
          return;
        }
        const w = (data.weights ?? {}) as Partial<Record<IntakeVariant, number>>;
        // Mirror the server's coerceWeights semantics: missing keys mean
        // 0%. If a new arm has been added in code but the DB row doesn't
        // carry it yet, the dial shows the new arm at 0 (and the existing
        // arms still sum to 100). Operator deliberately turns it on by
        // re-balancing and saving.
        const merged = Object.fromEntries(
          INTAKE_VARIANTS.map((v) => [v, typeof w[v] === "number" ? (w[v] as number) : 0]),
        ) as Record<IntakeVariant, number>;
        setWeights(merged);
        setSavedWeights(merged);
        setVersion(typeof data.version === "number" ? data.version : 0);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setFeedback({ kind: "err", msg: "Network error loading allocation — try refreshing." });
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sum = INTAKE_VARIANTS.reduce((s, v) => s + (weights[v] || 0), 0);
  const sumIsValid = sum === 100;
  const isDirty = INTAKE_VARIANTS.some((v) => weights[v] !== savedWeights[v]);
  const canSave = loaded && sumIsValid && isDirty && !saving;

  const setArm = (arm: IntakeVariant, raw: string) => {
    // Allow empty string while editing; coerce to integer 0-100 on commit.
    const n = raw === "" ? 0 : parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    setWeights((prev) => ({ ...prev, [arm]: Math.max(0, Math.min(100, n)) }));
    if (feedback?.kind === "ok") setFeedback(null); // clear stale "Saved" once they edit again
  };

  const reset = () => {
    setWeights(savedWeights);
    setFeedback(null);
  };

  const equalize = () => {
    setWeights(buildEqualSplit());
    if (feedback?.kind === "ok") setFeedback(null);
  };

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/analytics/variant-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({ kind: "err", msg: body?.error || `Save failed (${res.status})` });
      } else {
        const w = (body?.weights ?? {}) as Partial<Record<IntakeVariant, number>>;
        const merged = { ...weights };
        for (const v of INTAKE_VARIANTS) {
          if (typeof w[v] === "number") merged[v] = w[v] as number;
        }
        setSavedWeights(merged);
        setWeights(merged);
        setVersion(typeof body?.version === "number" ? body.version : version + 1);
        setFeedback({ kind: "ok", msg: "Saved — returning sessions reshuffle on their next visit." });
      }
    } catch {
      setFeedback({ kind: "err", msg: "Network error — try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
          Traffic allocation
        </div>
        <div className="text-[11px] text-gray-400 tabular-nums">
          v{version}
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">
        Live dial for the {INTAKE_VARIANTS.length}-arm intake split. Set any arm to 0 to dark it out without removing the code path; concentrate to 100 on a single arm to ramp a winner. Saves apply to new + returning sessions on their next visit (version bump invalidates the prior assignment).
      </p>

      <div
        className="grid gap-3 mb-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        {INTAKE_VARIANTS.map((v) => (
          <label
            key={v}
            className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <span className="text-[11px] font-medium text-gray-700">{variantSurfaceLabel(v)}</span>
            <span className="text-[10px] text-gray-400 leading-tight">{variantSubLabel(v)}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                disabled={!loaded || saving}
                value={weights[v]}
                onChange={(e) => setArm(v, e.target.value)}
                className="w-16 text-right tabular-nums text-base font-medium text-gray-900 bg-transparent border-b border-gray-200 focus:border-gray-900 focus:outline-none disabled:opacity-50"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`text-[12px] tabular-nums px-2 py-0.5 rounded ${
            sumIsValid
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          Sum: {sum} / 100{sumIsValid ? "" : ` (${sum > 100 ? "+" : ""}${sum - 100})`}
        </span>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            canSave
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving…" : "Save allocation"}
        </button>
        <button
          type="button"
          onClick={equalize}
          disabled={!loaded || saving}
          className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 disabled:text-gray-300 disabled:no-underline"
        >
          Reset to equal split
        </button>
        {isDirty && !saving && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2"
          >
            Discard changes
          </button>
        )}
        {feedback && (
          <span
            className={`text-[11px] ${
              feedback.kind === "ok" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {feedback.msg}
          </span>
        )}
      </div>
    </div>
  );
}

type VariantKey = keyof BenefitsFunnelByVariant;
const DRILLABLE_VARIANTS: ReadonlySet<VariantKey> = new Set([
  "availability",
  "loss",
  "empathic",
  "outreach",
  "qa_email_capture",
  "control",
  "money_loss",
]);

function BenefitsVariantSplit({
  byVariant,
  range,
}: {
  byVariant: BenefitsFunnelByVariant;
  range: DateRangeValue;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read the expanded variant from the URL so the state survives reload
  // and is shareable via link. Validates against the known set so a stray
  // ?variant=foo doesn't try to render a missing arm.
  const expandedRaw = searchParams.get("variant");
  const expandedVariant: VariantKey | null =
    expandedRaw && DRILLABLE_VARIANTS.has(expandedRaw as VariantKey)
      ? (expandedRaw as VariantKey)
      : null;

  const toggleVariant = useCallback(
    (key: VariantKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (expandedVariant === key) {
        params.delete("variant");
      } else {
        params.set("variant", key);
      }
      const qs = params.toString();
      router.replace(qs ? `/admin/analytics?${qs}` : "/admin/analytics", { scroll: false });
    },
    [searchParams, expandedVariant, router],
  );

  const resolved = resolveRange(range);
  const dateFrom = resolved.from ?? null;
  const dateTo = resolved.to ?? null;

  const totalAssigned =
    byVariant.availability.impressions +
    byVariant.loss.impressions +
    byVariant.empathic.impressions +
    byVariant.outreach.impressions +
    byVariant.qa_email_capture.impressions +
    byVariant.control.impressions +
    byVariant.money_loss.impressions;
  const waitingForFirstImpression = totalAssigned === 0;

  const rate = (num: number, den: number) =>
    den > 0 ? `${Math.round((num / den) * 100)}%` : "—";

  // Active arms. Empty rows are still shown so the layout stays stable as
  // data trickles in. Narrow key types so VariantPreviewCard's prop
  // signature (IntakeVariant + legacy strings) accepts them without a cast.
  const activeArms = [
    { key: "availability" as const, label: "availability", description: "There's help paying for care in {state}." },
    { key: "loss" as const, label: "loss", description: "Most {state} families miss out on help paying for care." },
    { key: "empathic" as const, label: "empathic", description: "Care is expensive." },
    { key: "outreach" as const, label: "outreach", description: "Have an AI agent contact the top providers for you.", isOutreach: true },
    { key: "qa_email_capture" as const, label: "qa_email_capture", description: "No SBF / no outreach. Q&A enrichment ON with comparison-providers value-promise.", isOutreach: true },
  ];
  // Legacy V2 arms only render when they have data in the window — once the
  // historical window rolls past V2, these rows disappear automatically.
  const legacyCandidates = [
    { key: "control" as const, label: "control (legacy V2)" },
    { key: "money_loss" as const, label: "money_loss (legacy V2)" },
  ];
  // Legacy V2 rows predate the benefits_entry_viewed instrumentation, so
  // they'll have started > 0 but impressions == 0. Keep them visible while
  // any signal exists in either column so the historical funnel doesn't
  // disappear from the dashboard mid-window.
  const legacyArms = legacyCandidates.filter(
    (a) => byVariant[a.key].started > 0 || byVariant[a.key].impressions > 0,
  );

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">
        A/B Test — entry-point module (5-arm)
      </div>
      <p className="text-[11px] text-gray-400 mb-3">
        Deterministic split by session id (djb2 hash, weighted-bucket lookup against the live allocation set above) — 3 benefits-help copy arms + 1 AI agent outreach arm + 1 qa_email_capture arm (no SBF / no outreach; Q&A enrichment ON). Impressions = module rendered on a provider page; Started = first interactive action (care-need click for benefits, recommended-card click for outreach, N/A for qa_email_capture); Submitted = email/form submission (for qa_email_capture, post-question email enrichment). Conversion % = Submitted / Impressions, so all five arms compare on the same denominator. Variant copy strings + commentary live in the{" "}
        <a
          href="https://app.notion.com/p/ec27110d1c6a4cc1a76bdf991344f63d"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-600"
        >
          SBF Copy Variants Notion DB
        </a>
        .
      </p>
      {waitingForFirstImpression && (
        <p className="text-[12px] text-emerald-700 bg-emerald-50/60 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
          Waiting for the first variant-tagged impression. The numbers below populate once a new module impression fires in this window.
        </p>
      )}
      <div className="overflow-x-auto -mx-1">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="px-3 py-2 font-medium">Variant</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Impressions</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Started</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Care need ✓</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Submitted</th>
              <th className="px-3 py-2 font-medium tabular-nums text-right">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {activeArms.map(({ key, label, description, isOutreach }) => {
              const r = byVariant[key];
              const isExpanded = expandedVariant === key;
              return (
                <Fragment key={key}>
                  <tr
                    className={`border-b border-gray-50 cursor-pointer transition-colors ${
                      isExpanded ? "bg-gray-50/60" : "hover:bg-gray-50/40"
                    }`}
                    onClick={() => toggleVariant(key)}
                    aria-expanded={isExpanded}
                  >
                    <td className="px-3 py-2 font-medium text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          aria-hidden="true"
                        >
                          ›
                        </span>
                        <span>{label}</span>
                      </div>
                      <div className="text-[11px] font-normal text-gray-400 truncate max-w-[280px] pl-4">{description}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-900">{r.impressions}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">{r.started}</td>
                    {/* Outreach arm has no middle "care need" step — show — instead of 0. */}
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                      {isOutreach ? <span className="text-gray-300">—</span> : r.care_need_completed}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">{r.saved}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">{rate(r.saved, r.impressions)}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50/30">
                      <td colSpan={6} className="px-3 py-4">
                        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
                          <VariantPreviewCard variant={key} />
                          <VariantSessionsList variant={key} dateFrom={dateFrom} dateTo={dateTo} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {legacyArms.length > 0 && (
              <>
                <tr>
                  <td colSpan={6} className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-gray-400">
                    Legacy V2 (historical)
                  </td>
                </tr>
                {legacyArms.map(({ key, label }) => {
                  const r = byVariant[key];
                  const isExpanded = expandedVariant === key;
                  // Legacy V2 rows predate the benefits_entry_viewed event,
                  // so they have impressions=0 even when they have meaningful
                  // started/saved counts. Fall back to saved/started so the
                  // historical conversion rate stays visible until those
                  // rows roll out of the window entirely.
                  const legacyConversion =
                    r.impressions > 0 ? rate(r.saved, r.impressions) : rate(r.saved, r.started);
                  return (
                    <Fragment key={key}>
                      <tr
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          isExpanded ? "bg-gray-50/60" : "hover:bg-gray-50/40 opacity-60"
                        }`}
                        onClick={() => toggleVariant(key)}
                        aria-expanded={isExpanded}
                      >
                        <td className="px-3 py-2 font-medium text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              aria-hidden="true"
                            >
                              ›
                            </span>
                            <span>{label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-400">
                          {r.impressions > 0 ? r.impressions : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700">{r.started}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600">{r.care_need_completed}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600">{r.saved}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700">{legacyConversion}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/30">
                          <td colSpan={6} className="px-3 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
                              <VariantPreviewCard variant={key} />
                              <VariantSessionsList variant={key} dateFrom={dateFrom} dateTo={dateTo} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </>
            )}
          </tbody>
        </table>
      </div>
      {byVariant.unassigned.impressions > 0 && (
        <p className="text-[11px] text-gray-400 mt-3">
          {byVariant.unassigned.impressions} sessions in window with no variant assigned (events fired before any A/B was wired).
        </p>
      )}
    </div>
  );
}

// Submissions bucketed by entry source. The benefits funnel above is
// provider_activity-driven and editorial mounts emit zero provider_activity,
// so editorial submissions are invisible there. This card reads accounts
// directly so editorial conversions surface — and so we can answer
// "did /caregiver-support/ produce signups?" without a SQL detour.
function EntrySourceCard({
  summary,
  loading,
  range,
}: {
  summary: SummaryResponse | null;
  loading: boolean;
  range: DateRangeValue;
}) {
  if (loading && !summary) {
    return <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 mb-6 h-32 animate-pulse" />;
  }
  if (!summary) return null;

  const b = summary.windowed.entry_source_breakdown;
  const pb = summary.prior?.entry_source_breakdown ?? null;

  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");
  const delta = (curr: number, prior: number | null) => {
    if (prior === null) return null;
    if (prior === 0) return curr > 0 ? "new" : null;
    const change = Math.round(((curr - prior) / prior) * 100);
    return `${change >= 0 ? "+" : ""}${change}%`;
  };

  const editorialDelta = delta(b.editorial_total, pb?.editorial_total ?? null);
  const providerDelta = delta(b.provider_total, pb?.provider_total ?? null);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 mb-6">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-base font-semibold text-gray-900">Submissions by Entry Source</h2>
        {loading && <span className="text-[11px] text-gray-400 animate-pulse">refreshing…</span>}
      </div>
      <p className="text-xs text-gray-500 mb-5">
        SBF intake submissions {rangeLabel(range).toLowerCase()}, bucketed by{" "}
        <code className="text-[11px] bg-gray-50 px-1 rounded">accounts.signup_source</code>
        . Editorial mounts tag <code className="text-[11px] bg-gray-50 px-1 rounded">/caregiver-support/&#123;slug&#125;</code>; provider mounts tag <code className="text-[11px] bg-gray-50 px-1 rounded">/provider/&#123;slug&#125;</code>. Untagged accounts (auth callback, claim flows, etc.) are excluded. Provider SBF submissions made before the tagging deploy are also untagged → invisible until they roll out of the window.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-3 mb-5">
        <EntrySourceStat label="Total tagged" value={b.total} delta={null} />
        <EntrySourceStat
          label="Editorial"
          value={b.editorial_total}
          subLabel={pct(b.editorial_total, b.total)}
          delta={editorialDelta}
        />
        <EntrySourceStat
          label="Provider"
          value={b.provider_total}
          subLabel={pct(b.provider_total, b.total)}
          delta={providerDelta}
        />
        <EntrySourceStat label="Other" value={b.other_total} subLabel={pct(b.other_total, b.total)} delta={null} />
      </div>

      {b.top_editorial_articles.length > 0 ? (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2">
            Top editorial articles
          </div>
          <ul className="space-y-1.5">
            {b.top_editorial_articles.map(({ slug, count }) => (
              <li key={slug} className="flex items-baseline justify-between text-sm">
                <a
                  href={`/caregiver-support/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-gray-900 truncate mr-3 underline-offset-2 hover:underline"
                >
                  /caregiver-support/{slug}
                </a>
                <span className="tabular-nums text-gray-900 font-medium flex-shrink-0">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : b.editorial_total === 0 ? (
        <p className="text-[11px] text-gray-400 mt-3">
          No editorial submissions yet in this window. Top articles by submission count appear here once <code className="text-[10px] bg-gray-50 px-1 rounded">/caregiver-support/[slug]</code> mounts start producing tagged accounts.
        </p>
      ) : null}
    </div>
  );
}

function EntrySourceStat({
  label,
  value,
  subLabel,
  delta,
}: {
  label: string;
  value: number;
  subLabel?: string;
  delta: string | null;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-0.5">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-xl font-semibold tabular-nums text-gray-900">{value}</div>
        {subLabel && <div className="text-[12px] text-gray-500 tabular-nums">{subLabel}</div>}
      </div>
      {delta && <div className="text-[11px] text-gray-400 mt-0.5">{delta} vs prior</div>}
    </div>
  );
}

function FunnelStat({
  label,
  value,
  prior,
  prev,
  tooltip,
}: {
  label: string;
  value: number;
  prior: number | null;
  prev: number | null;
  tooltip: string;
}) {
  const animated = useAnimatedCount(value, 600);
  const isZero = value === 0;
  const stepPct = prev !== null && prev > 0 ? Math.round((value / prev) * 100) : null;
  const delta = computeDelta(value, prior);

  return (
    <div title={tooltip} className={`cursor-default ${isZero ? "opacity-50" : ""}`}>
      <div
        className={`text-[26px] font-semibold tabular-nums leading-none ${
          isZero ? "text-gray-400 font-medium" : "text-gray-900"
        }`}
      >
        {animated.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 mt-1.5 leading-tight">{label}</div>
      <div className="text-[10.5px] tabular-nums mt-1.5 leading-none">
        {stepPct !== null ? (
          <span className="text-gray-500 font-medium">{stepPct}% of prev</span>
        ) : delta.state === "noPrior" ? (
          <span className="invisible">.</span>
        ) : (
          <span
            className={
              delta.state === "up" || delta.state === "newSignal"
                ? "text-emerald-700 font-medium"
                : delta.state === "down"
                ? "text-rose-600 font-medium"
                : "text-gray-400 font-medium"
            }
          >
            {delta.pctText}
          </span>
        )}
      </div>
    </div>
  );
}

function AudienceGroup({
  label,
  tint,
  children,
}: {
  label: string;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl ${tint} p-5`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-4">
        {label}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function SubRow({
  label,
  cols = 3,
  children,
}: {
  label?: string;
  cols?: 3 | 5 | 6;
  children: React.ReactNode;
}) {
  const colsClass =
    cols === 6 ? "lg:grid-cols-6" : cols === 5 ? "lg:grid-cols-5" : "lg:grid-cols-3";
  return (
    <div>
      {label && (
        <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2.5">
          {label}
        </div>
      )}
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${colsClass} gap-x-5 gap-y-4`}>
        {children}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  prior,
  href,
  tooltip,
}: {
  label: string;
  value: number;
  prior: number | null;
  href?: string;
  tooltip?: string;
}) {
  const animated = useAnimatedCount(value, 600);
  const isZero = value === 0;
  const delta = computeDelta(value, prior);

  const inner = (
    <div className={isZero ? "opacity-50" : ""}>
      <div
        className={`text-[26px] font-semibold tabular-nums leading-none ${
          isZero ? "text-gray-400 font-medium" : "text-gray-900"
        }`}
      >
        {animated.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 mt-1.5 leading-tight">{label}</div>
      <DeltaLine delta={delta} />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        title={tooltip}
        className="block rounded-md -m-1 p-1 hover:bg-white/80 transition-colors"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div title={tooltip} className="cursor-default">
      {inner}
    </div>
  );
}

type DeltaState = "up" | "down" | "flat" | "newSignal" | "noPrior";

function computeDelta(
  value: number,
  prior: number | null,
): { state: DeltaState; pctText: string } {
  if (prior === null) return { state: "noPrior", pctText: "" };
  if (prior === 0 && value === 0) return { state: "flat", pctText: "no change" };
  if (prior === 0 && value > 0) return { state: "newSignal", pctText: "new" };
  const pct = ((value - prior) / prior) * 100;
  const rounded = Math.round(pct);
  if (Math.abs(rounded) < 1) return { state: "flat", pctText: "flat" };
  return {
    state: rounded > 0 ? "up" : "down",
    pctText: `${rounded > 0 ? "↑" : "↓"} ${Math.abs(rounded)}%`,
  };
}

function DeltaLine({ delta }: { delta: { state: DeltaState; pctText: string } }) {
  if (delta.state === "noPrior") return <div className="h-3.5 mt-1.5" />;
  const tone =
    delta.state === "up"
      ? "text-emerald-700"
      : delta.state === "down"
      ? "text-rose-600"
      : delta.state === "newSignal"
      ? "text-emerald-700"
      : "text-gray-400";
  return (
    <div className={`text-[10.5px] font-medium tabular-nums mt-1.5 ${tone} leading-none`}>
      {delta.pctText}
    </div>
  );
}

// ── Top providers ────────────────────────────────────────────────────────

type SortKey = "raw" | "unique" | "last";

function TopProvidersCard({
  summary,
  loading,
}: {
  summary: SummaryResponse | null;
  loading: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("unique");
  const sorted = useMemo(() => {
    if (!summary) return [];
    const rows = [...summary.topProviders];
    if (sortKey === "raw") rows.sort((a, b) => b.raw_views_7d - a.raw_views_7d);
    else if (sortKey === "unique") rows.sort((a, b) => b.unique_sessions_7d - a.unique_sessions_7d);
    else if (sortKey === "last") rows.sort((a, b) => (b.last_seen > a.last_seen ? 1 : -1));
    return rows;
  }, [summary, sortKey]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Top providers (last 7 days)</h2>
      {loading && !summary ? (
        <div className="h-32 rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
      ) : !summary || sorted.length === 0 ? (
        <p className="text-sm text-gray-400">No page views logged yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-6 py-2 font-medium">Provider</th>
                <SortableTh
                  current={sortKey}
                  k="unique"
                  setSort={setSortKey}
                  align="right"
                  label="Unique sessions"
                />
                <SortableTh
                  current={sortKey}
                  k="raw"
                  setSort={setSortKey}
                  align="right"
                  label="Raw views"
                />
                <SortableTh current={sortKey} k="last" setSort={setSortKey} label="Last seen" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.provider_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-6 py-2.5">
                    <a
                      href={`/provider/${p.provider_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline"
                    >
                      {p.provider_name || p.provider_id}
                    </a>
                    {p.provider_name && (
                      <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                        {p.provider_id}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-2.5 tabular-nums text-right text-gray-900">
                    {p.unique_sessions_7d.toLocaleString()}
                  </td>
                  <td className="px-6 py-2.5 tabular-nums text-right text-gray-500">
                    {p.raw_views_7d.toLocaleString()}
                  </td>
                  <td
                    className="px-6 py-2.5 text-gray-500 whitespace-nowrap"
                    title={new Date(p.last_seen).toLocaleString()}
                  >
                    {formatRelative(p.last_seen)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortableTh({
  current,
  k,
  setSort,
  label,
  align,
}: {
  current: SortKey;
  k: SortKey;
  setSort: (k: SortKey) => void;
  label: string;
  align?: "right";
}) {
  const isActive = current === k;
  return (
    <th
      className={`px-6 py-2 font-medium tabular-nums ${align === "right" ? "text-right" : ""}`}
    >
      <button
        onClick={() => setSort(k)}
        className={`inline-flex items-center gap-1 hover:text-gray-900 transition-colors ${
          isActive ? "text-gray-900" : "text-gray-500"
        }`}
      >
        {label}
        {isActive && <span className="text-[9px]">▼</span>}
      </button>
    </th>
  );
}

// ── Latest events ────────────────────────────────────────────────────────

function LatestEventsCard({
  summary,
  loading,
}: {
  summary: SummaryResponse | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Latest 50 events</h2>
      {loading && !summary ? (
        <div className="h-48 rounded-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse" />
      ) : !summary || summary.latestEvents.length === 0 ? (
        <p className="text-sm text-gray-400">No events yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-6 py-2 font-medium">When</th>
                <th className="px-6 py-2 font-medium">Event</th>
                <th className="px-6 py-2 font-medium">Provider</th>
              </tr>
            </thead>
            <tbody>
              {summary.latestEvents.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 last:border-0 align-top hover:bg-gray-50/60">
                  <td
                    className="px-6 py-2 text-gray-500 whitespace-nowrap"
                    title={new Date(e.created_at).toLocaleString()}
                  >
                    {formatRelative(e.created_at)}
                  </td>
                  <td className="px-6 py-2">
                    <EventBadge type={e.event_type} />
                  </td>
                  <td className="px-6 py-2 font-mono text-xs">
                    <a
                      href={`/provider/${e.provider_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline break-all"
                    >
                      {e.provider_id}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EventBadge({ type }: { type: string }) {
  const tone = EVENT_TONE[type] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tone}`}
    >
      {type}
    </span>
  );
}

const EVENT_TONE: Record<string, string> = {
  page_view: "bg-emerald-50 text-emerald-700",
  search_click: "bg-sky-50 text-sky-700",
  cta_click_public: "bg-violet-50 text-violet-700",
  benefits_started: "bg-teal-50 text-teal-700",
  claim_completed: "bg-indigo-50 text-indigo-700",
  lead_received: "bg-amber-50 text-amber-700",
  review_received: "bg-yellow-50 text-yellow-800",
  question_received: "bg-blue-50 text-blue-700",
  email_click: "bg-gray-100 text-gray-600",
  one_click_access: "bg-gray-100 text-gray-600",
  reviews_cta_clicked: "bg-pink-50 text-pink-700",
  contact_revealed: "bg-orange-50 text-orange-700",
  suspicious_claim: "bg-rose-50 text-rose-700",
  lead_opened: "bg-gray-100 text-gray-600",
  question_responded: "bg-gray-100 text-gray-600",
  review_viewed: "bg-gray-100 text-gray-600",
  provider_saved: "bg-pink-50 text-pink-700",
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Footer ───────────────────────────────────────────────────────────────

function FootNote({ summary }: { summary: SummaryResponse | null }) {
  return (
    <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
      <p>
        Phase 0 sanity-check view. Counts are raw — nightly aggregation tables run at 8 AM UTC.
      </p>
      {summary && (
        <span
          className="tabular-nums whitespace-nowrap"
          title="Per-instance counter (in-memory). Resets at UTC midnight. Undercounts across multi-region deploys."
        >
          Bot rejects today:{" "}
          <span className="font-medium text-gray-600">
            {summary.botRejects.count.toLocaleString()}
          </span>
        </span>
      )}
    </div>
  );
}
