"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProfileSectionEditor } from "@/hooks/useProfileSectionEditor";
import type { SectionId } from "@/components/provider-dashboard/edit-modals/types";
import { trackProviderEvent } from "@/lib/analytics/track-provider-event";
import { managedAdsPitchCopy } from "@/lib/analytics/managed-ads-variant-copy";
import { useManagedAdsVariant, isManagedAdsPreviewMode } from "@/hooks/use-managed-ads-variant";
import type {
  AdBoostEligibility,
  AdBoostMissingSection,
} from "@/lib/ad-boost/eligibility";
import {
  cacheBoostState,
  getCachedBoostState,
  type BoostRequest,
  type BoostStateResponse,
} from "@/lib/ad-boost/boost-state";
import {
  BUDGET_STOPS,
  BUDGET_HONEST_LINE,
  BUDGET_ESTIMATE_CAVEAT,
  DEFAULT_BUDGET,
  budgetStop,
  budgetLabel,
  estimateSummary,
  type BudgetStop,
} from "@/lib/ad-boost/estimate";

/**
 * Provider Ad Boost — Managed Lead-Gen (concierge v1).
 *
 * Where a provider requests a done-for-you external ad campaign (Google/Meta)
 * that drives families to their Olera page. This is NOT internal search
 * placement — it's paid acquisition we run on their behalf. Gated on profile
 * completeness (>=70%) so we don't spend driving families to a thin profile.
 *
 * All eligibility + request state comes from GET /api/provider/ad-boost/request
 * (authoritative server compute — no client/server drift). Auth is gated by
 * the /provider layout, so by the time this renders the user is signed in.
 *
 * To avoid the wrong-page flash (apply form → queued/live snap), we never render
 * a sub-view until the fetch resolves — and entry points prefetch the state into
 * an in-memory cache so the common in-app path initializes from it and paints
 * the correct page on the first frame (no loader, no snap). See lib/ad-boost/
 * boost-state.ts.
 */

const CHANNELS = [
  { value: "both", label: "Google + Meta" },
  { value: "google", label: "Google only" },
  { value: "meta", label: "Meta only" },
] as const;

const OPEN_STATUSES = ["requested", "scheduled", "live"];

export default function ProviderBoostPage() {
  const { isLoading, user, refreshAccountData } = useAuth();
  const providerProfile = useProviderProfile();
  // Initialize from the prefetch cache so a warm in-app navigation paints the
  // correct page on the first frame (no loader, no wrong-page snap). Cold load
  // starts null → the loader holds until the fetch resolves.
  const [state, setState] = useState<BoostStateResponse | null>(() => getCachedBoostState());
  const [loading, setLoading] = useState(() => !getCachedBoostState());
  const [error, setError] = useState<string | null>(null);

  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [channel, setChannel] = useState<string>("both");
  // Pre-selected so the budget step opens with its estimate already visible
  // (anticipate the need, surface the payoff) — freely changeable.
  const [selectedBudget, setSelectedBudget] = useState<number | null>(DEFAULT_BUDGET);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const assignedVariant = useManagedAdsVariant(state?.provider.slug ?? null);

  const fetchState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/provider/ad-boost/request", {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          // Transient — session cookie may not be set yet; the user dep retries.
          return;
        }
        setError("Failed to load");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as BoostStateResponse;
      cacheBoostState(json); // keep the cache warm for the next in-app nav
      setState(json);
      setLoading(false);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState, user?.id]);

  // Fire one managed_ads_boost_viewed event per load, once state resolves —
  // tags which funnel state they landed in (gate / apply / in_motion).
  const hasTrackedView = useRef(false);
  const hasTrackedPitch = useRef(false);
  useEffect(() => {
    if (!state || !assignedVariant) return;
    if (isManagedAdsPreviewMode()) return;
    if (!hasTrackedPitch.current) {
      hasTrackedPitch.current = true;
      trackProviderEvent(state.provider.slug, "managed_ads_pitch_viewed", {
        provider_name: state.provider.displayName,
        source: "boost",
        managed_ads_variant: assignedVariant,
        city: state.provider.city,
        region: state.provider.state,
        category: state.provider.category,
        local_demand: state.demand.count,
        demand_scope: state.demand.scope,
      });
    }
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    const open = !!state.request && OPEN_STATUSES.includes(state.request.status);
    const pending = state.request?.status === "pending_profile";
    const viewState = open
      ? "in_motion"
      : pending
        ? "queued"
        : state.eligibility.eligible
          ? "apply"
          : "gate";
    trackProviderEvent(state.provider.slug, "managed_ads_boost_viewed", {
      provider_name: state.provider.displayName,
      state: viewState,
      completeness: state.eligibility.overall,
      city: state.provider.city,
      region: state.provider.state,
      category: state.provider.category,
      local_demand: state.demand.count,
      demand_scope: state.demand.scope,
      managed_ads_variant: assignedVariant,
    });
  }, [assignedVariant, state]);

  // Next four Mondays — "select next week to set up".
  const weekOptions = useMemo(() => nextMondays(4), []);

  const submit = async () => {
    if (!selectedWeek) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/provider/ad-boost/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setupWeek: selectedWeek,
          channel,
          intendedMonthlyBudget: selectedBudget,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 409 (already have a request) returns the existing one — fold it in.
        if (res.status === 409 && json.request) {
          setState((prev) => (prev ? { ...prev, request: json.request } : prev));
          return;
        }
        setSubmitError(json.error || "Something went wrong. Please try again.");
        return;
      }
      setState((prev) => (prev ? { ...prev, request: json.request } : prev));
      if (state && !isManagedAdsPreviewMode()) {
        trackProviderEvent(state.provider.slug, "managed_ads_requested", {
          provider_name: state.provider.displayName,
          setup_week: selectedWeek,
          channel,
          city: state.provider.city,
          region: state.provider.state,
          category: state.provider.category,
          local_demand: state.demand.count,
          demand_scope: state.demand.scope,
          managed_ads_variant: assignedVariant ?? "direct_reach",
          // Intended monthly budget (non-binding); null if not chosen.
          intended_monthly_budget: selectedBudget,
          // Queued under 70% (standing order) vs. an eligible, actionable request.
          queued: !!json.queued,
        });
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Inline section editing — finish a profile section without leaving the boost
  // flow. On save, refresh the profile + re-fetch boost state (recomputes
  // eligibility + auto-promotes the queued campaign if they just crossed 70%).
  const handleSectionSaved = useCallback(async () => {
    await refreshAccountData();
    fetchState();
  }, [refreshAccountData, fetchState]);
  const { openEditor, editorModals } = useProfileSectionEditor(providerProfile, {
    onSaved: handleSectionSaved,
  });

  if (error) {
    return (
      <Shell>
        <p className="text-gray-500">
          {error}{" "}
          <button onClick={fetchState} className="text-primary-600 font-medium underline-offset-2 hover:underline">
            Try again
          </button>
        </p>
      </Shell>
    );
  }

  // Hold on ONE calm loader until the fetch resolves, so we never flash a
  // guessed sub-view (the apply form) and then snap to another (queued / live).
  // A warm prefetch cache initializes `state` synchronously, so the common
  // in-app navigation skips this entirely and paints the right page instantly.
  if (isLoading || loading || !state) {
    return (
      <Shell>
        <div className="min-h-[55vh] flex items-center justify-center">
          <div className="animate-spin w-7 h-7 border-[3px] border-primary-500 border-t-transparent rounded-full" />
        </div>
      </Shell>
    );
  }

  // `state` is resolved below — pick exactly one view, once.
  const openRequest =
    state.request && OPEN_STATUSES.includes(state.request.status)
      ? state.request
      : null;
  const pendingRequest =
    state.request?.status === "pending_profile" ? state.request : null;

  // Committed states (queued / live) keep the focused single-column treatment.
  // The apply state is the redesign's two-column flow — action spine on the
  // left, a live "your campaign" summary on the right (Airbnb-style).
  if (openRequest) {
    return (
      <Shell>
        <div className="mt-2">
          <CampaignInMotion request={openRequest} delivered={state.delivered} />
        </div>
      </Shell>
    );
  }
  if (pendingRequest) {
    return (
      <Shell>
        <div className="mt-2">
          <PendingProfile
            request={pendingRequest}
            eligibility={state.eligibility}
            onEditSection={openEditor}
          />
        </div>
        {/* Inline section editors — finish a section without leaving this page. */}
        {editorModals}
      </Shell>
    );
  }

  return (
    <Shell>
      <ApplyExperience
        eligible={state.eligibility.eligible}
        weekOptions={weekOptions}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        channel={channel}
        setChannel={setChannel}
        selectedBudget={selectedBudget}
        setSelectedBudget={setSelectedBudget}
        submitting={submitting}
        submitError={submitError}
          provider={state.provider}
          demand={state.demand}
          managedAdsVariant={assignedVariant ?? "direct_reach"}
          onSubmit={submit}
        />
    </Shell>
  );
}

// ───────────────────────────────────────────────────────────── States

function CampaignInMotion({
  request,
  delivered,
}: {
  request: BoostRequest;
  delivered: number;
}) {
  const label: Record<string, string> = {
    requested: "Launch plan received",
    scheduled: "Setup scheduled",
    live: "Your campaign is live",
  };
  const isLive = request.status === "live";
  const showDelivered = isLive && delivered > 0;
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        <span className="text-sm font-semibold text-primary-700">
          {label[request.status] ?? "In progress"}
        </span>
      </div>
      <h2 className="text-2xl font-display font-semibold text-gray-900">
        {isLive ? "Your campaign is live." : "We’re on it."}
      </h2>
      <p className="text-gray-500 mt-3 leading-relaxed">
        {isLive
          ? "Families we send arrive on your dashboard as they come in."
          : "We’ll send over the launch plan before anything goes live, confirm the details, then families arrive on your dashboard as they come in."}
      </p>

      {/* The campaign they committed to — week, channel, budget. */}
      <CampaignFacts request={request} />

      {/* When live, real delivered families are THE focal point. */}
      {showDelivered && (
        <div className="mt-8 rounded-2xl border border-primary-100/70 bg-primary-50/40 px-6 py-6">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-display font-bold text-gray-900 tabular-nums leading-none">
              {delivered}
            </span>
            <span className="text-gray-600">
              {delivered === 1 ? "family" : "families"} reached out so far
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            From your managed ad campaign. Find them on your{" "}
            <Link href="/provider/connections" className="text-primary-600 font-medium hover:underline">
              leads
            </Link>
            .
          </p>
        </div>
      )}

      <Link
        href="/provider"
        className="inline-flex items-center gap-2 mt-8 text-primary-600 font-medium hover:gap-3 transition-all"
      >
        Back to dashboard
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}

/** The campaign the provider committed to — week · channel · budget — as a clean
 *  hairline 3-up (Robinhood/Wise stat-row feel). Shared by the queued + in-motion
 *  states so the choices they just made are always visible. */
function CampaignFacts({ request }: { request: BoostRequest }) {
  const channelLabel = CHANNELS.find((c) => c.value === request.channel)?.label ?? null;
  const budget = budgetLabel(request.intended_monthly_budget);
  const facts: { label: string; value: string }[] = [
    { label: "Launch", value: `Week of ${formatWeek(request.requested_setup_week)}` },
  ];
  if (channelLabel) facts.push({ label: "Advertising on", value: channelLabel });
  if (budget) facts.push({ label: "Budget", value: budget });

  // Flex + flex-1 (not a fixed grid) so 1, 2, or 3 facts always fill the width
  // evenly — older requests with no channel/budget never leave empty cells.
  return (
    <dl className="mt-7 flex flex-col divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200/80 sm:flex-row sm:divide-x sm:divide-y-0">
      {facts.map((f) => (
        <div key={f.label} className="flex-1 px-4 py-3.5">
          <dt className="text-xs text-gray-400">{f.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-900">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Standing order queued under 70%. This is the page that used to be the
 * dead-end "CompletenessGate" — a flat chore list with no forward action. Now
 * the provider has already committed (picked a week + channel), so the same
 * completion work is reframed as the LAST step to launch a campaign they own.
 * One prominent next action (the highest-impact gap), the rest as a quiet
 * "what's left" list. Momentum, not homework.
 */
function PendingProfile({
  request,
  eligibility,
  onEditSection,
}: {
  request: BoostRequest;
  eligibility: AdBoostEligibility;
  /** Opens the section editor inline on this page (no navigation). */
  onEditSection: (sectionId: SectionId) => void;
}) {
  const remaining = Math.max(0, eligibility.threshold - eligibility.overall);
  const topGap = eligibility.missingSections[0] ?? null;
  const restGaps = eligibility.missingSections.slice(1);
  const hasBoosters =
    eligibility.boosters.reviews === null || eligibility.boosters.responseRate === null;

  return (
    <div className="max-w-2xl">
      {/* Queued status — mirrors CampaignInMotion's pulse, distinct copy. */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        <span className="text-sm font-semibold text-primary-700">
          You&apos;re in the queue
        </span>
      </div>
      <h2 className="text-2xl font-display font-semibold text-gray-900">
        Your launch plan is queued.
      </h2>
      <p className="text-gray-500 mt-3 leading-relaxed">
        We’ll build around the timing and budget you picked, then launch once your page is ready to convert the families we send.
      </p>

      {/* The campaign they committed to — week · channel · budget. */}
      <CampaignFacts request={request} />

      {/* Progress toward launch — the actionable "to go" leads, big number
          matches the bar, target surfaced beneath (not buried in prose). */}
      <div className="mt-8 flex items-baseline gap-3">
        <span className="text-4xl font-display font-bold text-gray-900 tabular-nums leading-none">
          {eligibility.overall}%
        </span>
        <span className="text-gray-500">complete</span>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-warm-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${Math.min(100, eligibility.overall)}%` }}
        />
      </div>
      <p className="mt-2.5 text-sm text-gray-500">
        <span className="font-medium text-gray-900">{remaining}% to go</span> to launch
      </p>

      {/* THE single next action — the highest-impact gap. Opens the editor
          INLINE (no navigation), so they never leave the campaign-setup flow. */}
      {topGap && (
        <button
          type="button"
          onClick={() => onEditSection(topGap.id as SectionId)}
          className="inline-flex items-center gap-2.5 mt-8 px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white text-[16px] font-semibold rounded-full active:scale-[0.98] transition-all duration-200"
        >
          Next: {topGap.label}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}

      {/* Everything else — secondary, scannable, no longer the hero. */}
      {restGaps.length > 0 && (
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            What&apos;s left
          </p>
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {restGaps.map((s) => (
              <MissingRow key={s.id} section={s} onEdit={onEditSection} />
            ))}
          </ul>
        </div>
      )}

      {/* Boost your results — reviews / response rate as carrots, never gating.
          Asking for reviews to RUN ads would be circular, so we frame them as
          conversion lift, not requirements. */}
      {hasBoosters && (
        <div className="mt-10 rounded-2xl border border-primary-100/70 bg-primary-50/40 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900">Boost your results</p>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            Not required to launch — but providers with reviews and fast replies
            convert more of the families we send.
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {eligibility.boosters.reviews === null && (
              <Link
                href="/provider/reviews"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3.5 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50/60 transition-colors"
              >
                Ask for reviews
              </Link>
            )}
            {eligibility.boosters.responseRate === null && (
              <Link
                href="/provider/qna"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3.5 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50/60 transition-colors"
              >
                Answer questions fast
              </Link>
            )}
          </div>
        </div>
      )}

      <Link
        href="/provider"
        className="inline-flex items-center gap-2 mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

function MissingRow({
  section,
  onEdit,
}: {
  section: AdBoostMissingSection;
  onEdit: (sectionId: SectionId) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onEdit(section.id as SectionId)}
        aria-label={`${section.label}, ${section.percent}% done`}
        className="flex w-full items-center gap-3.5 py-3.5 text-left group"
      >
        {/* A quiet completion ring replaces the repeated "X% done" text. */}
        <ProgressRing percent={section.percent} />
        <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
          {section.label}
        </span>
        {/* The chevron is the only affordance — no repeated "Improve" label. */}
        <svg
          className="w-4 h-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </li>
  );
}

/** A tiny completion ring — calm visual status that replaces a repeated
 *  "X% done" text column. Empty track at 0%, a teal arc as the section fills. */
function ProgressRing({ percent }: { percent: number }) {
  const r = 8;
  const circ = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, percent));
  return (
    <svg className="w-[18px] h-[18px] shrink-0 -rotate-90" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r={r} fill="none" strokeWidth="2.5" stroke="currentColor" className="text-gray-200" />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        stroke="currentColor"
        className="text-primary-500"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - filled / 100)}
      />
    </svg>
  );
}

/** The three reasons managed ads beat any DIY/agency alternative — compressed
 *  to label-scale (icon + 2–3 words + a short tail), a scannable proof list, NOT
 *  the old competing 3-column paragraph grid. Lives in the support column. */
const VALUE_PROPS = [
  { title: "Market read first", tail: "We start with where families are already looking." },
  { title: "Plan before launch", tail: "Timing, channel, and budget get confirmed with you." },
  { title: "No ad chores", tail: "No ad account, no keywords, no agency handoff." },
];

const STEP_LABELS = ["Timing", "Budget", "Confirm"] as const;

/**
 * The apply experience — a light three-beat flow (Airbnb-leaning), one decision
 * per screen, on a two-column transactional split:
 *
 *   LEFT  (action spine):   breadcrumb → the current step's single decision →
 *                           Back / Continue (or the submit CTA on Confirm).
 *   RIGHT (support, sticky): a live "Your campaign" summary that accumulates as
 *                           they go (week → channel → budget + estimate), with
 *                           the value props as quiet proof beneath it.
 *
 * The honesty model lives in the Budget step: as the budget rises the estimate
 * shifts from reach language to lead language (see lib/ad-boost/estimate.ts), so
 * "real leads need real spend" lands structurally — one honest line + one caveat,
 * no warning paragraph. Clean white ground + one elevated summary card + teal as
 * the single accent — a focused transaction, not an editorial pitch. On mobile
 * the columns stack; the summary card stacks below and a one-line echo on each
 * step keeps the payoff visible.
 */
function ApplyExperience({
  eligible,
  weekOptions,
  selectedWeek,
  setSelectedWeek,
  channel,
  setChannel,
  selectedBudget,
  setSelectedBudget,
  submitting,
  submitError,
  provider,
  demand,
  managedAdsVariant,
  onSubmit,
}: {
  /** True when the provider already clears the 70% gate. False → the submit
   *  queues a standing order (pending_profile) that launches once they finish. */
  eligible: boolean;
  weekOptions: { value: string; label: string }[];
  selectedWeek: string | null;
  setSelectedWeek: (v: string) => void;
  channel: string;
  setChannel: (v: string) => void;
  selectedBudget: number | null;
  setSelectedBudget: (v: number) => void;
  submitting: boolean;
  submitError: string | null;
  provider: BoostStateResponse["provider"];
  demand: BoostStateResponse["demand"];
  managedAdsVariant: "direct_reach" | "local_plan";
  onSubmit: () => void;
}) {
  const [step, setStep] = useState(0); // 0 Timing · 1 Budget · 2 Confirm
  const weekLabel = weekOptions.find((w) => w.value === selectedWeek)?.label ?? null;
  const channelLabel = CHANNELS.find((c) => c.value === channel)?.label ?? "Google + Meta";
  const stop = budgetStop(selectedBudget);
  const copy = managedAdsPitchCopy(managedAdsVariant);

  const canAdvance = step === 0 ? !!selectedWeek : step === 1 ? !!stop : true;

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-start">
      {/* ─────────── LEFT: action spine ─────────── */}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-600">
          Managed Ads Launch Plan
        </p>

        {/* Breadcrumb — text, not a stepper widget. Past steps are tappable. */}
        <nav className="mt-3 flex items-center gap-2 text-sm" aria-label="Progress">
          {STEP_LABELS.map((label, i) => (
            <span key={label} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-300">·</span>}
              <button
                type="button"
                disabled={i >= step}
                onClick={() => i < step && setStep(i)}
                className={`${
                  i === step
                    ? "font-semibold text-gray-900"
                    : i < step
                      ? "text-gray-400 hover:text-gray-600"
                      : "text-gray-300 cursor-default"
                } transition-colors`}
              >
                <span className="tabular-nums">{i + 1}</span> {label}
              </button>
            </span>
          ))}
        </nav>

        {/* ── Step 0: Timing & channel ── */}
        {step === 0 && (
          <div>
            <h1 className="mt-5 font-display font-bold text-[clamp(2rem,5vw,2.9rem)] text-gray-900 leading-[1.06] tracking-tight">
              {copy.headline}<br />
              <span className="text-primary-600 italic">{copy.accent}</span>.
            </h1>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed max-w-md">
              {copy.body}
            </p>

            <DemandDiagnosis provider={provider} demand={demand} />

            <fieldset className="mt-9">
              <legend className="text-sm font-medium text-gray-900 mb-3">Pick your week</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {weekOptions.map((w) => {
                  const active = selectedWeek === w.value;
                  return (
                    <button
                      key={w.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedWeek(w.value)}
                      className={`rounded-2xl border px-3 py-4 text-center text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                        active
                          ? "border-primary-500 bg-primary-50/70 text-primary-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/70"
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="mt-7">
              <legend className="text-sm font-medium text-gray-900 mb-3">Where we advertise</legend>
              <div className="flex flex-wrap gap-2.5">
                {CHANNELS.map((c) => {
                  const active = channel === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setChannel(c.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                        active
                          ? "border-primary-500 bg-primary-50/70 text-primary-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/70"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}

        {/* ── Step 1: Budget ── */}
        {step === 1 && (
          <div>
            <h2 className="mt-5 text-2xl font-display font-semibold text-gray-900">
              Choose a starting budget
            </h2>
            <p className="mt-3 text-gray-500 leading-relaxed max-w-md">
              This is not a charge. It gives us a concrete plan to review with you
              before anything goes live. Your first $50 is on us.
            </p>

            <fieldset className="mt-8 pt-3">
              <legend className="sr-only">Monthly budget</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BUDGET_STOPS.map((b) => {
                  const active = selectedBudget === b.value;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedBudget(b.value)}
                      className={`relative flex min-h-[5.25rem] flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                        active
                          ? "border-primary-500 bg-primary-50/70"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/70"
                      }`}
                    >
                      {b.recommended && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm">
                          Recommended
                        </span>
                      )}
                      <span className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${active ? "text-primary-700" : "text-gray-900"}`}>
                        {b.amount}
                      </span>
                      <span className={`mt-1.5 text-xs ${active ? "text-primary-600/80" : "text-gray-400"}`}>
                        {b.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Estimate HERO — the payoff of this step, big and central. The
                range answers "what do I get?" right where the eye is; reach tier
                ($50) shows a phrase, no fake number. The caveat lives in the
                summary card (not duplicated here) to keep this bold. */}
            {stop && (
              <div key={stop.value} className="mt-9 animate-[fadeIn_180ms_ease-out]">
                {stop.kind === "leads" ? (
                  <div className="flex items-baseline gap-3">
                    <span className="font-display font-bold text-5xl text-gray-900 tabular-nums tracking-tight">
                      {stop.headline}
                    </span>
                    <span className="text-lg text-gray-500">{stop.unit}</span>
                  </div>
                ) : (
                  <p className="font-display font-bold text-3xl text-gray-900 tracking-tight">
                    {stop.headline}
                  </p>
                )}
                <p className="mt-2.5 text-gray-500 leading-relaxed max-w-md">{stop.estimate}</p>
              </div>
            )}

            {/* The one honest line — factual + social-proofed, not a warning. */}
            <p className="mt-7 text-sm text-gray-400 leading-relaxed max-w-md">
              {BUDGET_HONEST_LINE}
            </p>
          </div>
        )}

        {/* ── Step 2: Review & confirm ── */}
        {step === 2 && (
          <div>
            <h2 className="mt-5 text-2xl font-display font-semibold text-gray-900">
              Get your launch plan
            </h2>
            <p className="mt-3 text-gray-500 leading-relaxed max-w-md">
              {eligible
                ? "We'll review this, confirm the budget with you, and send the plan before anything goes live."
                : "We'll queue this now, help you get the page ready, and send the plan before anything goes live."}
            </p>

            <dl className="mt-7 overflow-hidden rounded-2xl border border-gray-200/80 divide-y divide-gray-100">
              <ReviewRow label="Launch" value={weekLabel ?? "—"} />
              <ReviewRow label="Advertising on" value={channelLabel} />
              <ReviewRow label="Starting budget" value={stop?.label ?? "—"} />
            </dl>

            <p className="mt-6 text-sm text-gray-500 leading-relaxed max-w-md">
              This starts a concierge review. Advertising can drive more local
              families to your page; it doesn&apos;t guarantee a set number of leads.{" "}
              <Link
                href="/managed-ads-terms"
                target="_blank"
                className="text-primary-600 font-medium hover:underline"
              >
                How it works &amp; what we measure
              </Link>
              .
            </p>
          </div>
        )}

        {/* ── Footer nav — shared across steps ── */}
        {step === 2 && submitError && (
          <p className="mt-6 text-sm text-red-600">{submitError}</p>
        )}
        <div className="mt-9 flex items-center gap-5">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => setStep(step + 1)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 px-9 py-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-full active:scale-[0.99] transition-all duration-200"
            >
              Continue
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={onSubmit}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 px-9 py-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-full active:scale-[0.99] transition-all duration-200"
            >
              {submitting ? "Sending…" : eligible ? "Get my launch plan" : "Queue my launch plan"}
              {!submitting && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              )}
            </button>
          )}
        </div>
        {step === 2 && (
          <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-md">
            {eligible
              ? "No charge yet. We confirm the budget with you before launch. Your first $50 is on us."
              : "No charge to queue, and none until we confirm the budget with you before launch. Your first $50 is on us."}
          </p>
        )}
      </div>

      {/* ─────────── RIGHT: live summary + proof (sticky) ─────────── */}
      <aside className="lg:sticky lg:top-12 space-y-6">
        <CampaignSummary
          eligible={eligible}
          weekLabel={weekLabel}
          channelLabel={channelLabel}
          stop={stop}
        />

        {/* Value props — quiet, scannable proof, only on the entry step. On the
            budget step the estimate hero is the focus; on confirm the review is
            self-contained — repeating the props there is dead column. */}
        {step === 0 && (
          <ul className="space-y-3.5 px-1">
            {VALUE_PROPS.map((p) => (
              <li key={p.title} className="flex gap-2.5">
                <CheckIcon className="mt-0.5 w-4 h-4 shrink-0 text-primary-500" />
                <span className="text-sm leading-snug">
                  <span className="font-medium text-gray-900">{p.title}</span>
                  <span className="text-gray-500"> — {p.tail}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3.5">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 text-right">{value}</dd>
    </div>
  );
}

function DemandDiagnosis({
  provider,
  demand,
}: {
  provider: BoostStateResponse["provider"];
  demand: BoostStateResponse["demand"];
}) {
  const category = humanCategoryLabel(provider.category);
  const place =
    demand.scope === "city" && provider.city
      ? provider.city
      : provider.state
        ? provider.state
        : "your area";
  const count = demand.count >= 5 ? demand.count : null;

  return (
    <div className="mt-8 rounded-2xl border border-primary-100/70 bg-primary-50/40 px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-600">
        Local diagnosis
      </p>
      <p className="mt-2 text-[17px] font-semibold leading-snug text-gray-900">
        {count
          ? `${count.toLocaleString()} families looked at ${category} options in ${place} in the last ${demand.windowDays} days.`
          : `Families in ${place} are searching for ${category} before they ever reach your page.`}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <PlanPoint title="Where they look" body="Google, Meta, and local feeds." />
        <PlanPoint title="Where they land" body="Your Olera page, not a broker form." />
        <PlanPoint title="What you get" body="A clear read on spend, clicks, and families delivered." />
      </div>
    </div>
  );
}

function PlanPoint({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm leading-snug text-gray-500">{body}</p>
    </div>
  );
}

/** The live "Your campaign" card — accumulates as the provider picks (week →
 *  channel → budget + estimate). The single resting point of the flow; the
 *  estimate's reach→lead shift carries the honesty, capped by one caveat. */
function CampaignSummary({
  eligible,
  weekLabel,
  channelLabel,
  stop,
}: {
  eligible: boolean;
  weekLabel: string | null;
  channelLabel: string;
  stop: BudgetStop | null;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(42,24,16,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
        Your launch plan
      </p>

      <dl className="mt-4 space-y-3.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-gray-500">Launch</dt>
          <dd className={`text-sm font-medium text-right ${weekLabel ? "text-gray-900" : "text-gray-300"}`}>
            {weekLabel ?? "Pick a week"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-gray-500">Advertising on</dt>
          <dd className="text-sm font-medium text-gray-900 text-right">{channelLabel}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-gray-500">Starting budget</dt>
          <dd className={`text-sm font-medium text-right ${stop ? "text-gray-900" : "text-gray-300"}`}>
            {stop?.label ?? "Pick a budget"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 pt-5 border-t border-gray-100">
        {stop ? (
          <>
            {/* Compact estimate (the big version lives in the left hero on the
                budget step). Cross-fades on selection (keyed) — calm, no jump. */}
            <p key={stop.value} className="text-sm font-medium text-gray-900 animate-[fadeIn_150ms_ease-out]">
              {estimateSummary(stop)}
            </p>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">{BUDGET_ESTIMATE_CAVEAT}</p>
            {!eligible && (
              <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                Queued now — plan first, launch once your profile&apos;s ready for the families we send.
              </p>
            )}
          </>
        ) : eligible ? (
          <p className="flex items-center gap-2 text-sm text-primary-700">
            <CheckIcon className="w-4 h-4 shrink-0" />
            Ready to launch when you confirm.
          </p>
        ) : (
          <p className="text-sm text-gray-500 leading-relaxed">
            We&apos;ll <span className="font-medium text-gray-900">queue the plan now</span> and launch
            only after your profile&apos;s ready for the families we send.
          </p>
        )}
      </div>
    </div>
  );
}

function humanCategoryLabel(category: string | null): string {
  const labels: Record<string, string> = {
    assisted_living: "assisted living",
    memory_care: "memory care",
    nursing_home: "nursing home",
    independent_living: "independent living",
    home_care_agency: "home care",
    home_health_agency: "home health care",
  };
  return category ? labels[category] ?? category.replace(/[_-]+/g, " ") : "senior care";
}

// ───────────────────────────────────────────────────────────── Chrome

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16 pb-24">
        {children}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

// ───────────────────────────────────────────────────────────── Date helpers

/** The next `count` Mondays, starting with the upcoming one (never today). */
function nextMondays(count: number): { value: string; label: string }[] {
  const today = new Date();
  const day = today.getDay(); // 0 Sun … 6 Sat
  const daysUntilNextMonday = (8 - day) % 7 || 7; // always 1–7 days out
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + daysUntilNextMonday + i * 7);
    out.push({ value: isoDate(d), label: `Week of ${shortDate(d)}` });
  }
  return out;
}

/** Local YYYY-MM-DD (avoids the UTC off-by-one toISOString would introduce). */
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Render a stored YYYY-MM-DD week back to "Mon D" without TZ drift. */
function formatWeek(isoDateStr: string): string {
  const [y, m, d] = isoDateStr.split("-").map(Number);
  if (!y || !m || !d) return isoDateStr;
  return shortDate(new Date(y, m - 1, d));
}
