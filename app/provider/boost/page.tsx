"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import ManagedAdsPitch from "@/components/provider/ManagedAdsPitch";
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
  status: "requested" | "scheduled" | "live" | "ended" | "cancelled";
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
    const viewState = open ? "in_motion" : state.eligibility.eligible ? "apply" : "gate";
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
        });
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) return <BoostSkeleton />;

  if (error || !state) {
    return (
      <Shell>
        <p className="text-gray-500">
          {error ?? "Couldn't load this page."}{" "}
          <button onClick={fetchState} className="text-primary-600 font-medium underline-offset-2 hover:underline">
            Try again
          </button>
        </p>
      </Shell>
    );
  }

  const openRequest =
    state.request && OPEN_STATUSES.includes(state.request.status)
      ? state.request
      : null;

  return (
    <Shell>
      {/* The pitch (headline + marquee + pillars) — shown while we're still
          selling it (gate / apply states). Once a campaign is in motion they've
          bought in, so we skip the marketing. The picker/gate follows below, so
          no CTA on the pitch here. */}
      {!openRequest && <ManagedAdsPitch />}

      {/* ── Body: one of three states ── */}
      <div className="mt-12">
        {openRequest ? (
          <CampaignInMotion request={openRequest} delivered={state.delivered} />
        ) : state.eligibility.eligible ? (
          <ApplyForm
            weekOptions={weekOptions}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            channel={channel}
            setChannel={setChannel}
            submitting={submitting}
            submitError={submitError}
            onSubmit={submit}
          />
        ) : (
          <CompletenessGate eligibility={state.eligibility} />
        )}
      </div>
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

function CompletenessGate({ eligibility }: { eligibility: AdBoostEligibility }) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-baseline gap-3">
        <span className="text-5xl font-display font-bold text-gray-900 tabular-nums">
          {eligibility.overall}%
        </span>
        <span className="text-gray-500">
          complete · {eligibility.threshold}% needed to start
        </span>
      </div>

      {/* progress hairline */}
      <div className="mt-4 h-1.5 w-full rounded-full bg-warm-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${Math.min(100, eligibility.overall)}%` }}
        />
      </div>

      <p className="text-gray-500 mt-6 leading-relaxed">
        Before we spend on ads, your profile needs to be ready to win the families
        we send. Finish these and you&apos;ll unlock managed ads:
      </p>

      <ul className="mt-6 divide-y divide-gray-100 border-t border-gray-100">
        {eligibility.missingSections.map((s) => (
          <MissingRow key={s.id} section={s} />
        ))}
      </ul>
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

function ApplyForm({
  weekOptions,
  selectedWeek,
  setSelectedWeek,
  channel,
  setChannel,
  submitting,
  submitError,
  onSubmit,
}: {
  weekOptions: { value: string; label: string }[];
  selectedWeek: string | null;
  setSelectedWeek: (v: string) => void;
  channel: string;
  setChannel: (v: string) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2.5 mb-1">
        <CheckIcon className="w-5 h-5 text-primary-600" />
        <span className="text-sm font-semibold text-primary-700">
          Your profile is ready
        </span>
      </div>
      <h2 className="text-2xl font-display font-semibold text-gray-900 mt-2">
        Pick a week to get set up.
      </h2>
      <p className="text-gray-500 mt-3 leading-relaxed">
        Choose when you&apos;d like us to launch. We&apos;ll build and run the
        campaign, then send the families it brings in straight to your dashboard.
      </p>

      {/* Week picker */}
      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-gray-900 mb-3">Setup week</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {weekOptions.map((w) => {
            const active = selectedWeek === w.value;
            return (
              <button
                key={w.value}
                type="button"
                onClick={() => setSelectedWeek(w.value)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
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
          Where should we advertise?
        </legend>
        <div className="flex flex-wrap gap-2.5">
          {CHANNELS.map((c) => {
            const active = channel === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setChannel(c.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
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

      {submitError && (
        <p className="mt-6 text-sm text-red-600">{submitError}</p>
      )}

      <button
        type="button"
        disabled={!selectedWeek || submitting}
        onClick={onSubmit}
        className="inline-flex items-center gap-2.5 mt-8 px-9 py-3.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-full active:scale-[0.98] transition-all duration-200"
      >
        {submitting ? "Sending…" : "Request my campaign"}
        {!submitting && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        )}
      </button>
      <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-md">
        No charge yet — we&apos;ll confirm pricing and your ad budget with you
        before anything goes live.
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────── Chrome

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {children}
      </div>
    </div>
  );
}

function BoostSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 animate-pulse">
        <div className="h-8 w-32 bg-warm-100 rounded-full mb-6" />
        <div className="h-10 w-80 bg-warm-100 rounded mb-3" />
        <div className="h-10 w-64 bg-warm-50 rounded mb-6" />
        <div className="h-5 w-full max-w-md bg-warm-50 rounded mb-12" />
        <div className="h-24 w-full bg-warm-50 rounded-xl" />
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
