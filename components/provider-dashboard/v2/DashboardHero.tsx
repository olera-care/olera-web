"use client";

import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Pillar A — Greeting + one primary action.
 *
 * Prioritized signal stack, one line of copy + one CTA:
 *   1. Unanswered questions (action needed — most valuable)
 *   2. Fresh leads this period
 *   3. New reviews since last visit (not yet wired — TODO Phase 2B follow-up)
 *   4. View spike vs. prior period
 *   5. Fallback: generic "welcome back" with period summary
 *
 * Rule: pick ONE headline signal. Never stack multiple "you have X, Y, and Z."
 * The hero's job is to answer "why should I be here?" in one glance.
 */

interface Props {
  firstName: string;
  data: ProviderDashboardV2Data;
}

export default function DashboardHero({ firstName, data }: Props) {
  const hook = resolveHook(data);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-6 py-6 md:px-8 md:py-7 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"
          aria-hidden
        />
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">
          Good to see you, {firstName}
        </p>
      </div>
      <p className="text-[22px] md:text-[24px] font-display font-semibold text-gray-900 leading-snug tracking-tight">
        {hook.headline}
      </p>
      {hook.subline && (
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          {hook.subline}
        </p>
      )}
      {hook.cta && (
        <Link
          href={hook.cta.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 mt-4 group"
        >
          {hook.cta.label}
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}

interface Hook {
  headline: string;
  subline?: string;
  cta?: { label: string; href: string };
}

function resolveHook(data: ProviderDashboardV2Data): Hook {
  const { greeting } = data;

  // Priority 1 — unanswered questions. Highest-leverage action.
  if (greeting.unansweredQuestions > 0) {
    const n = greeting.unansweredQuestions;
    return {
      headline: `${n} ${n === 1 ? "family is" : "families are"} waiting for your reply.`,
      subline:
        "Answering usually takes under a minute and shows families you're paying attention.",
      cta: { label: "Review questions", href: "/provider/qna" },
    };
  }

  // Priority 2 — fresh leads this period.
  if (greeting.newLeadsThisPeriod > 0) {
    const n = greeting.newLeadsThisPeriod;
    return {
      headline: `${n} new ${n === 1 ? "inquiry" : "inquiries"} this month.`,
      subline: "Families expect a response within a day — quick replies read as professional.",
      cta: { label: "View inquiries", href: "/provider/connections" },
    };
  }

  // Priority 3 — meaningful view spike.
  if (greeting.deltaPct !== null && greeting.deltaPct >= 25 && greeting.viewsThisPeriod >= 5) {
    return {
      headline: `Your page views are up ${greeting.deltaPct}% this month.`,
      subline: `${greeting.viewsThisPeriod} families found you — ${Math.max(0, greeting.viewsThisPeriod - greeting.viewsPriorPeriod)} more than last month.`,
      // No CTA — the headline is the value. Forcing a "go somewhere"
      // action when there's nothing specific to do would feel hollow.
    };
  }

  // Priority 4 — steady traffic, no urgent action.
  if (greeting.viewsThisPeriod > 0) {
    const n = greeting.viewsThisPeriod;
    return {
      headline: `${n} ${n === 1 ? "family" : "families"} viewed your page this month.`,
      subline:
        "A complete profile with photos and reviews helps more of them reach out.",
      cta: { label: "Improve your listing", href: "#overview" },
    };
  }

  // Fallback — brand-new provider, no data yet. Patient framing.
  return {
    headline: "Your page is live on Olera.",
    subline:
      "Families are searching in your area. The more complete your listing, the more likely they'll reach out.",
    cta: { label: "Improve your listing", href: "#overview" },
  };
}
