"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BOOST_CHANNELS,
  type BoostRequest,
} from "@/lib/ad-boost/boost-state";
import {
  BUDGET_STOPS,
  DEFAULT_BUDGET,
  budgetStop,
  budgetLabel,
  estimateSummary,
} from "@/lib/ad-boost/estimate";

/**
 * The campaign-in-motion building blocks + the Phase 2 money views, extracted
 * from app/provider/boost/page.tsx so the admin preview gallery
 * (/admin/ad-boost/preview) renders the EXACT provider-facing components with
 * sample data — what TJ sees there is what providers see, by construction.
 */

/** The campaign the provider committed to — week · channel · plan — as a clean
 *  hairline 3-up (Robinhood/Wise stat-row feel). Shared by the queued + in-motion
 *  states so the choices they just made are always visible. */
export function CampaignFacts({ request }: { request: BoostRequest }) {
  const channelLabel = BOOST_CHANNELS.find((c) => c.value === request.channel)?.label ?? null;
  // An active paid plan supersedes the (non-binding) signup intent.
  const budget =
    request.plan_status === "active" && request.plan_value != null
      ? (budgetLabel(request.plan_value) ?? `$${request.plan_value}/mo`)
      : budgetLabel(request.intended_monthly_budget);
  const facts: { label: string; value: string }[] = [
    { label: "Launch", value: `Week of ${formatWeek(request.requested_setup_week)}` },
  ];
  if (channelLabel) facts.push({ label: "Advertising on", value: channelLabel });
  if (budget) facts.push({ label: "Plan", value: budget });

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

/** Live campaign performance — the real story: who visited, who converted.
 *  Visitors + leads on the provider's page since launch (see getCampaignStats),
 *  conversion = leads/visitors. "—" until there's traffic, so day-one shows an
 *  honest empty state rather than a fake 0%. */
export function CampaignPerformance({
  stats,
}: {
  stats: { visitors: number; leads: number; since: string };
}) {
  // Cap at 100% — a lead can exist without a matching deduped page_view session
  // (bot-filtered load, tracker race, cross-session convert), which would
  // otherwise render a trust-eroding ">100%" to the provider.
  const conversion =
    stats.visitors > 0
      ? Math.min(100, Math.round((stats.leads / stats.visitors) * 100))
      : null;
  const cells: { label: string; value: string }[] = [
    { label: "Visitors", value: stats.visitors.toLocaleString() },
    { label: "Leads", value: stats.leads.toLocaleString() },
    { label: "Conversion", value: conversion === null ? "—" : `${conversion}%` },
  ];
  return (
    <div className="mt-8">
      <dl className="flex flex-col divide-y divide-gray-100 overflow-hidden rounded-2xl border border-primary-100/70 bg-primary-50/40 sm:flex-row sm:divide-x sm:divide-y-0 sm:divide-gray-100">
        {cells.map((c) => (
          <div key={c.label} className="flex-1 px-5 py-5">
            <dd className="text-4xl font-display font-bold text-gray-900 tabular-nums leading-none">
              {c.value}
            </dd>
            <dt className="mt-2 text-xs uppercase tracking-wide text-gray-500">
              {c.label}
            </dt>
          </div>
        ))}
      </dl>
      <p className="text-sm text-gray-500 mt-3">
        Since your campaign launched.{" "}
        {stats.leads > 0 ? (
          <>
            Find your leads on your{" "}
            <Link
              href="/provider/connections"
              className="text-primary-600 font-medium hover:underline"
            >
              leads page
            </Link>
            .
          </>
        ) : (
          <>Visitors and leads will appear here as families arrive.</>
        )}
      </p>
    </div>
  );
}

/**
 * Plan active — the celebration + steady state after checkout. `celebrate` is
 * the just-returned-from-Stripe moment (may render before the webhook lands,
 * so plan_value can still be null; copy degrades gracefully).
 */
export function PlanActive({
  request,
  campaignStats,
  celebrate,
}: {
  request: BoostRequest;
  campaignStats: { visitors: number; leads: number; since: string } | null;
  celebrate: boolean;
}) {
  const tier = budgetStop(request.plan_value);
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        <span className="text-sm font-semibold text-primary-700">Plan active</span>
      </div>
      <h2 className="text-2xl font-display font-semibold text-gray-900">
        {celebrate ? "You're all set." : "Your plan is running."}
      </h2>
      <p className="text-gray-500 mt-3 leading-relaxed">
        {tier
          ? `Your ${tier.name} plan (${tier.amount}/mo, all-in) is active. `
          : "Your monthly plan is active. "}
        We keep the ads running and manage everything; families arrive on your
        dashboard as they come in. A month with zero family inquiries is free.
      </p>

      <CampaignFacts request={request} />
      {campaignStats && <CampaignPerformance stats={campaignStats} />}

      <p className="mt-6 text-sm text-gray-500">
        Change or cancel anytime by replying to any campaign email, or{" "}
        <Link href="/managed-ads-terms" target="_blank" className="text-primary-600 font-medium hover:underline">
          read how the plan works
        </Link>
        .
      </p>

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
 * The wrap-up moment — the ONLY payment ask in the system. Arms on a value
 * event (3rd lead, or concierge marked the promo complete). Leads with the
 * provider's own numbers, then one calm plan choice -> Stripe Checkout.
 * Zero leads = the honest no-ask path: we re-run on us, nothing to pay.
 */
export function WrapUpMoment({
  request,
  campaignStats,
  onCheckout,
  submitting,
  error,
}: {
  request: BoostRequest;
  campaignStats: { visitors: number; leads: number; since: string } | null;
  onCheckout: (planValue: number) => void;
  submitting: boolean;
  error: string | null;
}) {
  const leads = campaignStats?.leads ?? 0;
  const paidStops = BUDGET_STOPS.filter((b) => b.sublabel !== "on us");
  // Default to what they said they intended at signup, else Starter.
  const [plan, setPlan] = useState<number>(() =>
    paidStops.some((b) => b.value === request.intended_monthly_budget)
      ? (request.intended_monthly_budget as number)
      : DEFAULT_BUDGET,
  );
  const selected = budgetStop(plan);

  // The honest no-ask path: a quiet intro window never gets a money ask.
  if (leads === 0) {
    return (
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-600 mb-2">
          Your first campaign, wrapped
        </p>
        <h2 className="text-2xl font-display font-semibold text-gray-900">
          Your market was quiet this time.
        </h2>
        <p className="text-gray-500 mt-3 leading-relaxed">
          No families reached out during your intro window. That&apos;s on us to
          improve, not on you to pay for: we&apos;ll tune your page, adjust the
          ads, and run another window on us. Nothing to pay today.
        </p>
        {campaignStats && campaignStats.visitors > 0 && (
          <CampaignPerformance stats={campaignStats} />
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

  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-600 mb-2">
        Your first campaign, wrapped
      </p>
      <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-display font-bold text-gray-900 leading-tight">
        {leads === 1 ? "A family reached out." : `${leads} families reached out.`}
      </h2>
      <p className="text-gray-500 mt-3 leading-relaxed max-w-lg">
        That&apos;s what your intro campaign delivered. Keep the ads running
        with a flat monthly plan: ad spend, setup, and management together, no
        contract.
      </p>

      {campaignStats && <CampaignPerformance stats={campaignStats} />}

      {/* The plan choice — same stacked radio-card grammar as the apply flow. */}
      <fieldset className="mt-8">
        <legend className="sr-only">Plan</legend>
        <div className="flex flex-col gap-3">
          {paidStops.map((b) => {
            const active = plan === b.value;
            return (
              <button
                key={b.value}
                type="button"
                aria-pressed={active}
                onClick={() => setPlan(b.value)}
                className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                  active
                    ? "border-primary-500 bg-primary-50/70"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/70"
                }`}
              >
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className={`min-w-0 text-base font-semibold ${active ? "text-primary-700" : "text-gray-900"}`}>
                    {b.name}
                    <span className="font-normal text-gray-300"> · </span>
                    <span className="tabular-nums">{b.amount}/mo</span>
                    {b.chip && (
                      <span
                        className={`ml-2 inline-flex translate-y-[-1px] rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          active ? "border-primary-400 text-primary-700" : "border-gray-300 text-gray-500"
                        }`}
                      >
                        {b.chip}
                      </span>
                    )}
                  </span>
                  <span className={`shrink-0 text-sm tabular-nums ${active ? "text-primary-600/80" : "text-gray-400"}`}>
                    {estimateSummary(b)}
                  </span>
                </span>
                <span className={`mt-1 block text-sm leading-relaxed ${active ? "text-primary-600/80" : "text-gray-500"}`}>
                  {b.blurb}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-4 text-sm text-gray-500">
        A month with zero family inquiries is free.{" "}
        <Link href="/managed-ads-terms" target="_blank" className="text-primary-600 font-medium hover:underline">
          How the guarantee works
        </Link>
        .
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={submitting}
        onClick={() => onCheckout(plan)}
        className="inline-flex items-center gap-2.5 mt-5 px-8 py-3.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-full active:scale-[0.98] transition-all duration-200"
      >
        {submitting ? "One moment…" : `Continue with ${selected?.name ?? "your plan"}`}
        {!submitting && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        )}
      </button>
      <p className="mt-3 text-xs text-gray-400 leading-relaxed max-w-md">
        You&apos;ll confirm payment on the next screen. Month to month, cancel
        anytime.
      </p>

      <div className="mt-8">
        <Link
          href="/provider"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Not now, back to dashboard
        </Link>
      </div>
    </div>
  );
}

/** Render a stored YYYY-MM-DD week back to "Mon D" without TZ drift. */
function formatWeek(isoDateStr: string): string {
  const [y, m, d] = isoDateStr.split("-").map(Number);
  if (!y || !m || !d) return isoDateStr;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
