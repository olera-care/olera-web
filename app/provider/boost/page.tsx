"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { trackProviderEvent } from "@/lib/analytics/track-provider-event";
import type {
  AdBoostEligibility,
  AdBoostMissingSection,
} from "@/lib/ad-boost/eligibility";

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
 */

interface BoostRequest {
  id: string;
  status: "pending_profile" | "requested" | "scheduled" | "live" | "ended" | "cancelled";
  requested_setup_week: string;
  channel: string | null;
  campaign_tag: string | null;
  created_at: string;
}

interface BoostStateResponse {
  eligibility: AdBoostEligibility;
  provider: { slug: string; displayName: string | null };
  request: BoostRequest | null;
  /** Families delivered so far by this provider's campaign. */
  delivered: number;
}

const CHANNELS = [
  { value: "both", label: "Google + Meta" },
  { value: "google", label: "Google only" },
  { value: "meta", label: "Meta only" },
] as const;

const OPEN_STATUSES = ["requested", "scheduled", "live"];

export default function ProviderBoostPage() {
  const { isLoading, user } = useAuth();
  const [state, setState] = useState<BoostStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [channel, setChannel] = useState<string>("both");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
  useEffect(() => {
    if (!state || hasTrackedView.current) return;
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
    });
  }, [state]);

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
        body: JSON.stringify({ setupWeek: selectedWeek, channel }),
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
      if (state) {
        trackProviderEvent(state.provider.slug, "managed_ads_requested", {
          provider_name: state.provider.displayName,
          setup_week: selectedWeek,
          channel,
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

  // Hard failure only. We deliberately do NOT full-page skeleton on load: the
  // apply hero + week/channel pickers are static (no fetch needed), so they
  // paint instantly and the transition feels snappy. Only the eligibility-
  // dependent bits (CTA label, summary status) wait on the fetch via `ready`.
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

  // "Ready" = auth resolved, fetch done, state present. Until then the hero +
  // pickers still render; only the CTA + summary status hold for `ready`.
  const ready = !isLoading && !loading && !!state;
  const openRequest =
    state?.request && OPEN_STATUSES.includes(state.request.status)
      ? state.request
      : null;
  const pendingRequest =
    state?.request?.status === "pending_profile" ? state.request : null;
  // Once they've committed (live campaign OR a queued standing order) we drop
  // the marketing and get them to the next action.
  const committed = openRequest || pendingRequest;

  // Committed states (queued / live) keep the focused single-column treatment.
  // The apply state is the one the redesign targets: a two-column flow — action
  // spine on the left, a live "your campaign" summary on the right (Airbnb-style
  // transactional split), so the eye runs headline → pick → confirm with one
  // resting point, instead of stacked pitch-then-form sections.
  if (state && committed) {
    return (
      <Shell>
        <div className="mt-2">
          {openRequest ? (
            <CampaignInMotion request={openRequest} delivered={state.delivered} />
          ) : (
            <PendingProfile request={pendingRequest!} eligibility={state.eligibility} />
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ApplyExperience
        ready={ready}
        eligible={state?.eligibility.eligible ?? false}
        weekOptions={weekOptions}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        channel={channel}
        setChannel={setChannel}
        submitting={submitting}
        submitError={submitError}
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
    requested: "Request received",
    scheduled: "Setup scheduled",
    live: "Your campaign is live",
  };
  const showDelivered = request.status === "live" && delivered > 0;
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        <span className="text-sm font-semibold text-primary-700">
          {label[request.status] ?? "In progress"}
        </span>
      </div>
      <h2 className="text-2xl font-display font-semibold text-gray-900">
        We&apos;re on it.
      </h2>
      <p className="text-gray-500 mt-3 leading-relaxed">
        Your campaign is set to go live the week of{" "}
        <span className="font-medium text-gray-900">{formatWeek(request.requested_setup_week)}</span>.
        We&apos;ll reach out before launch to confirm the details, and you&apos;ll
        see families arrive on your dashboard as they come in.
      </p>

      {showDelivered && (
        <div className="mt-8 rounded-2xl border border-primary-100/70 bg-primary-50/40 px-6 py-5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-4xl font-display font-bold text-gray-900 tabular-nums">
              {delivered}
            </span>
            <span className="text-gray-600">
              {delivered === 1 ? "family" : "families"} reached out so far
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1.5">
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
}: {
  request: BoostRequest;
  eligibility: AdBoostEligibility;
}) {
  const remaining = Math.max(0, eligibility.threshold - eligibility.overall);
  const topGap = eligibility.missingSections[0] ?? null;
  const restGaps = eligibility.missingSections.slice(1);

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
        Your campaign is queued.
      </h2>
      <p className="text-gray-500 mt-3 leading-relaxed">
        We&apos;ll launch it the week of{" "}
        <span className="font-medium text-gray-900">
          {formatWeek(request.requested_setup_week)}
        </span>{" "}
        — the moment your profile&apos;s ready to win the families we send.
        You&apos;re <span className="font-medium text-gray-900">{remaining}%</span> away.
      </p>

      {/* Progress toward launch */}
      <div className="mt-8 flex items-baseline gap-3">
        <span className="text-4xl font-display font-bold text-gray-900 tabular-nums">
          {eligibility.overall}%
        </span>
        <span className="text-gray-500">
          complete · {eligibility.threshold}% to launch
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-warm-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${Math.min(100, eligibility.overall)}%` }}
        />
      </div>

      {/* THE single next action — the highest-impact gap, as a real button. */}
      {topGap ? (
        <Link
          href={topGap.href}
          className="inline-flex items-center gap-2.5 mt-8 px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white text-[16px] font-semibold rounded-full active:scale-[0.98] transition-all duration-200"
        >
          Next: {topGap.label}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      ) : (
        <Link
          href="/provider"
          className="inline-flex items-center gap-2.5 mt-8 px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white text-[16px] font-semibold rounded-full active:scale-[0.98] transition-all duration-200"
        >
          Finish your profile
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}

      {/* Everything else — secondary, scannable, no longer the hero. */}
      {restGaps.length > 0 && (
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            What&apos;s left
          </p>
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {restGaps.map((s) => (
              <MissingRow key={s.id} section={s} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MissingRow({ section }: { section: AdBoostMissingSection }) {
  return (
    <li>
      <Link
        href={section.href}
        className="flex items-center justify-between gap-4 py-4 group"
      >
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{section.label}</p>
          <p className="text-sm text-gray-400">{section.percent}% done</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 group-hover:gap-2.5 transition-all">
          Improve
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </Link>
    </li>
  );
}

/** The three reasons managed ads beat any DIY/agency alternative — compressed
 *  to label-scale (icon + 2–3 words + a short tail), a scannable proof list, NOT
 *  the old competing 3-column paragraph grid. Lives in the support column. */
const VALUE_PROPS = [
  { title: "Targeted where families look", tail: "Search, social, and neighborhood feeds." },
  { title: "Powered by your market", tail: "Aimed at the high-demand ZIPs we map for you." },
  { title: "You do nothing", tail: "No ad account, no keywords, no agency." },
];

/**
 * The apply experience — two-column transactional split (Airbnb-leaning):
 *
 *   LEFT  (action spine):   one headline → pick a week → pick a channel → black
 *                           CTA. The eye runs straight down to the one button.
 *   RIGHT (support, sticky): a live "Your campaign" summary that fills in as they
 *                           choose (anticipates the next step, confirms choices),
 *                           with the value props as quiet proof beneath it.
 *
 * Clean white ground + one elevated summary card + teal as the single accent —
 * deliberately not a warm/cream treatment; this is a focused transaction, not an
 * editorial pitch. On mobile the columns stack and a one-line confirmation sits
 * right above the CTA so the summary still pays off without a sticky card.
 */
function ApplyExperience({
  ready,
  eligible,
  weekOptions,
  selectedWeek,
  setSelectedWeek,
  channel,
  setChannel,
  submitting,
  submitError,
  onSubmit,
}: {
  /** False while the eligibility fetch is still in flight. The hero + pickers
   *  render regardless (they're static); only the CTA + summary status wait. */
  ready: boolean;
  /** True when the provider already clears the 70% gate. False → the submit
   *  queues a standing order (pending_profile) that launches once they finish. */
  eligible: boolean;
  weekOptions: { value: string; label: string }[];
  selectedWeek: string | null;
  setSelectedWeek: (v: string) => void;
  channel: string;
  setChannel: (v: string) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const weekLabel = weekOptions.find((w) => w.value === selectedWeek)?.label ?? null;
  const channelLabel = CHANNELS.find((c) => c.value === channel)?.label ?? "Google + Meta";

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-start">
      {/* ─────────── LEFT: action spine ─────────── */}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-600">
          Managed Ads
        </p>
        <h1 className="mt-3 font-display font-bold text-[clamp(2.2rem,5vw,3.1rem)] text-gray-900 leading-[1.05] tracking-tight">
          Reach families<br />
          <span className="text-primary-600 italic">already searching for care</span>.
        </h1>
        <p className="mt-4 text-lg text-gray-500 leading-relaxed max-w-md">
          We run the ads where families are already looking — and send every one of
          them straight to your Olera page.
        </p>

        {/* Week picker */}
        <fieldset className="mt-10">
          <legend className="text-sm font-medium text-gray-900 mb-3">Pick your week</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {weekOptions.map((w) => {
              const active = selectedWeek === w.value;
              return (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setSelectedWeek(w.value)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/15 focus-visible:ring-offset-2 ${
                    active
                      ? "border-primary-500 bg-primary-50/60 text-primary-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Channel preference */}
        <fieldset className="mt-7">
          <legend className="text-sm font-medium text-gray-900 mb-3">
            Where we advertise
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {CHANNELS.map((c) => {
              const active = channel === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setChannel(c.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/15 focus-visible:ring-offset-2 ${
                    active
                      ? "border-primary-500 bg-primary-50/60 text-primary-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Mobile-only live confirmation — the summary card is desktop-only, so
            this single dynamic line gives the same payoff above the CTA. */}
        {selectedWeek && (
          <p className="lg:hidden mt-8 text-sm text-gray-500">
            {eligible ? "Launching" : "Queuing"} the week of{" "}
            <span className="font-medium text-gray-900">{weekLabel}</span> · {channelLabel}
          </p>
        )}

        {submitError && <p className="mt-6 text-sm text-red-600">{submitError}</p>}

        <button
          type="button"
          disabled={!ready || !selectedWeek || submitting}
          onClick={onSubmit}
          className="mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-2.5 px-9 py-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-full active:scale-[0.99] transition-all duration-200"
        >
          {submitting ? "Sending…" : eligible ? "Request my campaign" : "Queue my campaign"}
          {!submitting && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          )}
        </button>
        <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-md">
          {eligible
            ? "No charge yet — we'll confirm pricing and your ad budget with you before anything goes live."
            : "No charge to queue, and none until we confirm pricing and your ad budget with you before launch."}
        </p>
      </div>

      {/* ─────────── RIGHT: live summary + proof (sticky) ─────────── */}
      <aside className="lg:sticky lg:top-12 space-y-6">
        <CampaignSummary
          ready={ready}
          eligible={eligible}
          weekLabel={weekLabel}
          channelLabel={channelLabel}
        />

        {/* Value props — quiet, scannable proof. Not a competing grid. */}
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
      </aside>
    </div>
  );
}

/** The live "Your campaign" card — fills in as the provider picks. The single
 *  resting point of the page; updates make the choices feel real before commit. */
function CampaignSummary({
  ready,
  eligible,
  weekLabel,
  channelLabel,
}: {
  ready: boolean;
  eligible: boolean;
  weekLabel: string | null;
  channelLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(42,24,16,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
        Your campaign
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
      </dl>

      {/* min-h reserves space for the (taller, 2-line) non-eligible status so
          the sticky card doesn't grow when the shimmer resolves — no jump. */}
      <div className="mt-5 pt-5 border-t border-gray-100 min-h-[2.5rem]">
        {!ready ? (
          <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
        ) : eligible ? (
          <p className="flex items-center gap-2 text-sm text-primary-700">
            <CheckIcon className="w-4 h-4 shrink-0" />
            Ready to launch when you confirm.
          </p>
        ) : (
          <p className="text-sm text-gray-500 leading-relaxed">
            We&apos;ll <span className="font-medium text-gray-900">queue it now</span> and launch
            the moment your profile&apos;s ready for the families we send.
          </p>
        )}
      </div>
    </div>
  );
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
