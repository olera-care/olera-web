"use client";

import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Pillar A — Greeting + one primary action (Wispr-style dark moment).
 *
 * The dashboard has one dark card-sized moment per screen. This is it.
 * Modeled on Wispr Flow's "Hold down [fn] to dictate" panel — a warm photo
 * sits on the right side of the card; a left-to-right dark gradient keeps
 * the headline readable while letting the image show through on the right.
 * Greeting is serif italic for a personal-letter touch. Single light pill
 * CTA on the dark surface.
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

const HERO_IMAGE_URL = "/images/for-providers/dashboard-hero.jpg";

interface Props {
  firstName: string;
  data: ProviderDashboardV2Data;
}

export default function DashboardHero({ firstName, data }: Props) {
  const hook = resolveHook(data);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-warm-950 mb-6 md:min-h-[260px]">
      {/* Background image — warm photo behind the card. Hidden on mobile so
          the headline doesn't have to fight a busy backdrop at narrow widths.
          backgroundSize is `auto 150%` (not `cover`): the image is sized off
          the card's HEIGHT, not its width. With cover, wide cards stretched
          the image by width and over-cropped vertically — the face got bigger
          than the card and chin/hair got chopped. Sizing by height makes the
          face frame consistent at any card width: a contained portrait on the
          right, with empty warm-950 on the left blended out by the gradient. */}
      <div
        aria-hidden
        className="hidden md:block absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url('${HERO_IMAGE_URL}')`,
          backgroundSize: "auto 150%",
          backgroundPosition: "right 35%",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark gradient — keeps the headline readable while the image shows
          through on the right side. Stops are pixel-based (calc) measured
          from the right edge so the fade zone tracks the image position
          regardless of card width. On mobile the card is solid warm-950
          since there's no image. */}
      <div
        aria-hidden
        className="hidden md:block absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(42, 24, 16, 0.96) 0%, rgba(42, 24, 16, 0.96) calc(100% - 600px), rgba(42, 24, 16, 0.7) calc(100% - 440px), rgba(42, 24, 16, 0.25) calc(100% - 200px), rgba(42, 24, 16, 0.08) 100%)",
        }}
      />
      <div className="relative px-6 py-5 md:px-9 md:py-7 max-w-[560px]">
        {/* font-serif (not font-display) because DM Serif Display only loads
            the regular weight — italic on it would be a fake browser-synthesized
            slant. font-serif falls back to New York / Georgia, both of which
            have a real designed italic baked into the OS, no extra download. */}
        <p className="font-serif italic text-[15px] md:text-[16px] text-warm-200/85 leading-snug mb-2">
          Hey {firstName}
        </p>
        <p className="font-display text-[20px] md:text-[24px] font-semibold text-white leading-[1.2] tracking-tight">
          {hook.headline}
        </p>
        {hook.subline && (
          <p className="mt-2 text-sm text-warm-100/70 leading-relaxed">
            {hook.subline}
          </p>
        )}
        {hook.cta && (
          <Link
            href={hook.cta.href}
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full bg-vanilla-100 text-warm-950 text-sm font-medium hover:bg-white transition-colors group"
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
