"use client";

import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Pillar A — Greeting + one primary action (Wispr-style dark moment).
 *
 * The dashboard has one dark card-sized moment per screen. This is it.
 * Modeled on Wispr Flow's "Hold down [fn] to dictate" panel — a deep warm
 * surface (warm-950 instead of pure black so it stays warm and on-brand),
 * a soft amber glow on the right that mimics the photo softening Wispr
 * uses, a serif headline in white, and a single light pill CTA. Everything
 * else on the page is quiet typography on cream — the dark card is the
 * only thing the eye lands on first.
 *
 * Prioritized signal stack, one line of copy + one CTA:
 *   1. Unanswered questions (action needed — most valuable)
 *   2. Fresh leads this period
 *   3. View spike vs. prior period
 *   4. Steady traffic, no urgent action
 *   5. Fallback: brand-new provider
 *
 * Rule: pick ONE headline signal. Never stack multiple "you have X, Y, and Z."
 */

interface Props {
  firstName: string;
  data: ProviderDashboardV2Data;
}

export default function DashboardHero({ firstName, data }: Props) {
  const hook = resolveHook(data);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-warm-950 mb-8">
      {/* Soft amber glow on the right — mimics the warm photo Wispr fades into the dark card */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/2 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 80% 50%, rgba(233, 189, 145, 0.22) 0%, rgba(214, 127, 66, 0.05) 45%, transparent 75%)",
        }}
      />
      <div className="relative px-6 py-7 md:px-9 md:py-9 max-w-[640px]">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-warm-300"
            aria-hidden
          />
          <p className="text-[11px] font-medium text-warm-200/80 tracking-wider uppercase">
            Hey {firstName}
          </p>
        </div>
        <p className="font-display text-[24px] md:text-[28px] font-semibold text-white leading-[1.2] tracking-tight">
          {hook.headline}
        </p>
        {hook.subline && (
          <p className="mt-3 text-sm md:text-[15px] text-warm-100/70 leading-relaxed">
            {hook.subline}
          </p>
        )}
        {hook.cta && (
          <Link
            href={hook.cta.href}
            className="inline-flex items-center gap-1.5 mt-6 px-4 py-2.5 rounded-full bg-vanilla-100 text-warm-950 text-sm font-medium hover:bg-white transition-colors group"
          >
            {hook.cta.label}
            <svg
              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        )}
      </div>
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
  // Count is questions, not families — one family can ask several, so the
  // noun "questions" is more honest than "families waiting."
  if (greeting.unansweredQuestions > 0) {
    const n = greeting.unansweredQuestions;
    return {
      headline: `${n} question${n === 1 ? "" : "s"} waiting for your answer.`,
      subline:
        "Under a minute each, and families feel like you're paying attention.",
      cta: { label: "Review questions", href: "/provider/qna" },
    };
  }

  // Priority 2 — fresh leads this period.
  if (greeting.newLeadsThisPeriod > 0) {
    const n = greeting.newLeadsThisPeriod;
    return {
      headline: `${n} new ${n === 1 ? "inquiry" : "inquiries"} this month.`,
      subline:
        "Families expect a response within a day — quick replies read as professional.",
      cta: { label: "View inquiries", href: "/provider/connections" },
    };
  }

  // Priority 3 — meaningful view spike.
  if (greeting.deltaPct !== null && greeting.deltaPct >= 25 && greeting.viewsThisPeriod >= 5) {
    return {
      headline: `Your page views are up ${greeting.deltaPct}% this month.`,
      subline: `${greeting.viewsThisPeriod} families found you — ${Math.max(0, greeting.viewsThisPeriod - greeting.viewsPriorPeriod)} more than last month.`,
      // No CTA — the headline is the value.
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

  // Fallback — brand-new provider, no data yet.
  return {
    headline: "Your page is live on Olera.",
    subline:
      "Families are searching in your area. The more complete your listing, the more likely they'll reach out.",
    cta: { label: "Improve your listing", href: "#overview" },
  };
}
