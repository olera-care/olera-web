"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";
import type { ProfileCompleteness } from "@/lib/profile-completeness";
import type { ProfileCategory } from "@/lib/types";
import {
  pickNextAction,
  type NudgeSectionId,
} from "@/lib/next-best-action";

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
 * Prioritized signal stack (after the 2026-04-29 refactor that folded the
 * standalone smart-picker banner into this hero — one banner per surface):
 *
 *   1. Fresh leads this period   (highest intent — someone reaching out)
 *   2. Unanswered questions      (action needed)
 *   3. View spike vs. prior      (positive momentum, no CTA)
 *   4. Views ≥ 10                (engagement headline; if profile is
 *                                 incomplete, CTA opens the highest-impact
 *                                 section's edit modal — otherwise no CTA)
 *   5. Views < 10 + incomplete   (section-specific completion pick — the
 *                                 hero acts as the picker until engagement
 *                                 picks up)
 *   6. Views < 10 + complete     (informational fallback, no CTA)
 *
 * Rule: pick ONE headline signal. Never stack multiple "you have X, Y, and Z."
 * Tiers 1-3 navigate via Link (existing engagement funnel); tier 4-5 section
 * CTAs open an edit modal in place (new completion funnel — same metadata
 * shape as the deprecated SmartNextActionCard so the admin analytics rollup
 * keeps working with a `source: "hero"` bucket).
 */

const HERO_IMAGE_DEFAULT = "/images/for-providers/dashboard-hero.jpg";

// Per-section images for completion-tier picks (Tiers 4 + 5). When the picker
// lands on a section, the hero uses that section's dedicated image to give
// the nudge a context-specific visual mood. Sections without a custom image
// (or that get added later) fall back to HERO_IMAGE_DEFAULT.
const SECTION_IMAGES: Record<NudgeSectionId, string> = {
  gallery: "/images/for-providers/dashboard-hero-gallery.jpg",
  about: "/images/for-providers/dashboard-hero-about.jpg",
  pricing: "/images/for-providers/dashboard-hero-pricing.jpg",
  services: "/images/for-providers/dashboard-hero-services.jpg",
  screening: "/images/for-providers/dashboard-hero-screening.jpg",
  payment: "/images/for-providers/dashboard-hero-payment.jpg",
  overview: "/images/for-providers/dashboard-hero-overview.jpg",
};

// Per-tier images for engagement signals (Tiers 1, 2, 3) and the
// fully-complete fallback (Tier 6).
const TIER_LEADS_IMAGE = "/images/for-providers/dashboard-hero-leads.jpg";
const TIER_QUESTIONS_IMAGE = "/images/for-providers/dashboard-hero-questions.jpg";
const TIER_SPIKE_IMAGE = "/images/for-providers/dashboard-hero-spike.jpg";
const TIER_FALLBACK_IMAGE = "/images/for-providers/dashboard-hero-fallback.jpg";

const ENGAGEMENT_VIEW_THRESHOLD = 10;

interface Props {
  firstName: string;
  data: ProviderDashboardV2Data;
  /** Profile completeness — feeds the completion-tier picker. */
  completeness: ProfileCompleteness;
  /** Provider category — feeds category-aware copy (place vs service). */
  category: ProfileCategory | null;
  /** Open the relevant edit modal in place. Only fires for completion-tier CTAs. */
  onOpenSection: (sectionId: NudgeSectionId) => void;
  /** Slug used as provider_id for fire-and-forget activity events. */
  providerSlug: string;
}

interface NavCta {
  label: string;
  href: string;
}

interface SectionCta {
  label: string;
  sectionId: NudgeSectionId;
  weight: number;
}

interface Hook {
  headline: string;
  subline?: string;
  cta?: NavCta | SectionCta;
  /** Optional per-tier / per-section image. Falls back to HERO_IMAGE_DEFAULT. */
  imageUrl?: string;
}

function isSectionCta(cta: NavCta | SectionCta): cta is SectionCta {
  return "sectionId" in cta;
}

export default function DashboardHero({
  firstName,
  data,
  completeness,
  category,
  onOpenSection,
  providerSlug,
}: Props) {
  const hook = resolveHook(data, completeness, category);

  // Fire one provider_picker_impression per (provider visit, sectionId) so
  // the admin Q&A funnel can compute click-through on the hero. Engagement
  // tiers don't fire — they're a different funnel, tracked by their own
  // existing event types (question_responded, etc.).
  const firedImpression = useRef<string | null>(null);
  const sectionId =
    hook.cta && isSectionCta(hook.cta) ? hook.cta.sectionId : null;
  const sectionWeight =
    hook.cta && isSectionCta(hook.cta) ? hook.cta.weight : null;

  useEffect(() => {
    if (!sectionId || sectionWeight === null) return;
    if (firedImpression.current === sectionId) return;
    firedImpression.current = sectionId;
    track("provider_picker_impression", providerSlug, {
      source: "hero",
      section: sectionId,
      weight: sectionWeight,
    });
  }, [sectionId, sectionWeight, providerSlug]);

  const handleSectionClick = (cta: SectionCta) => {
    track("provider_picker_clicked", providerSlug, {
      source: "hero",
      section: cta.sectionId,
      weight: cta.weight,
    });
    onOpenSection(cta.sectionId);
  };

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
          backgroundImage: `url('${hook.imageUrl ?? HERO_IMAGE_DEFAULT}')`,
          backgroundSize: "auto 150%",
          backgroundPosition: "right 35%",
          backgroundRepeat: "no-repeat",
          // Soft-fade the image's left edge into the warm-950 background so
          // there's no hard rectangle line where the photo starts. Pixel-based
          // mask zone tracks the image's left edge (~693px wide at 260 height)
          // regardless of card width — the face sits well past the fade zone.
          maskImage:
            "linear-gradient(to right, transparent 0%, transparent calc(100% - 720px), black calc(100% - 460px), black 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, transparent calc(100% - 720px), black calc(100% - 460px), black 100%)",
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
          isSectionCta(hook.cta) ? (
            <button
              type="button"
              onClick={() => handleSectionClick(hook.cta as SectionCta)}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full bg-vanilla-100 text-warm-950 text-sm font-medium hover:bg-white transition-colors group"
            >
              {hook.cta.label}
              <CtaArrow />
            </button>
          ) : (
            <Link
              href={hook.cta.href}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full bg-vanilla-100 text-warm-950 text-sm font-medium hover:bg-white transition-colors group"
            >
              {hook.cta.label}
              <CtaArrow />
            </Link>
          )
        )}
      </div>
    </div>
  );
}

function CtaArrow() {
  return (
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
  );
}

function resolveHook(
  data: ProviderDashboardV2Data,
  completeness: ProfileCompleteness,
  category: ProfileCategory | null,
): Hook {
  const { greeting } = data;

  // Priority 1 — fresh leads this period. Highest intent: a family is
  // actively reaching out for placement. Beats info-gathering questions.
  if (greeting.newLeadsThisPeriod > 0) {
    const n = greeting.newLeadsThisPeriod;
    return {
      headline: `${n} new ${n === 1 ? "inquiry" : "inquiries"} this month.`,
      subline:
        "Families expect a response within a day — quick replies read as professional.",
      cta: { label: "View inquiries", href: "/provider/connections" },
      imageUrl: TIER_LEADS_IMAGE,
    };
  }

  // Priority 2 — unanswered questions. Real family on the other end.
  if (greeting.unansweredQuestions > 0) {
    const n = greeting.unansweredQuestions;
    return {
      headline: `${n} question${n === 1 ? "" : "s"} waiting for your answer.`,
      subline:
        "Under a minute each, and families feel like you're paying attention.",
      cta: { label: "Review questions", href: "/provider/qna" },
      imageUrl: TIER_QUESTIONS_IMAGE,
    };
  }

  // Priority 3 — meaningful view spike. Positive reinforcement, no CTA —
  // the headline IS the value.
  if (greeting.deltaPct !== null && greeting.deltaPct >= 25 && greeting.viewsThisPeriod >= 5) {
    return {
      headline: `Your page views are up ${greeting.deltaPct}% this month.`,
      subline: `${greeting.viewsThisPeriod} families found you — ${Math.max(0, greeting.viewsThisPeriod - greeting.viewsPriorPeriod)} more than last month.`,
      imageUrl: TIER_SPIKE_IMAGE,
    };
  }

  const next = pickNextAction(completeness, category);

  // Priority 4 — meaningful traffic (≥ 10 views) with a completion gap.
  // Engagement headline rewards the activity; section-specific CTA fills
  // the activation lever. If the profile is fully complete, the headline
  // alone — no CTA — keeps the moment recognition-only, no nag. Image
  // tracks the section the picker chose (gallery → photos image, about →
  // conversation image, etc.) so the visual mood matches the ask.
  if (greeting.viewsThisPeriod >= ENGAGEMENT_VIEW_THRESHOLD) {
    const n = greeting.viewsThisPeriod;
    if (next) {
      return {
        headline: `${n} families viewed your page this month.`,
        subline: next.copy.subline,
        cta: {
          label: next.copy.cta,
          sectionId: next.sectionId,
          weight: next.weight,
        },
        imageUrl: SECTION_IMAGES[next.sectionId],
      };
    }
    return {
      headline: `${n} families viewed your page this month.`,
      subline: "Questions and inquiries land here as families decide.",
    };
  }

  // Priority 5 — sparse traffic AND a completion gap. The hero takes over
  // the picker role: section-specific copy as the headline, opens the right
  // edit modal in place. Image matches the section being nudged.
  if (next) {
    return {
      headline: next.copy.headline,
      subline: next.copy.subline,
      cta: {
        label: next.copy.cta,
        sectionId: next.sectionId,
        weight: next.weight,
      },
      imageUrl: SECTION_IMAGES[next.sectionId],
    };
  }

  // Priority 6 — sparse traffic AND fully complete. Profile is dialed in;
  // we just don't have demand data yet. Informational, no CTA. (Better
  // than the old "Improve your listing" generic — there's nothing left to
  // improve and no need to manufacture a CTA.)
  return {
    headline: "Your page is live on Olera.",
    subline:
      "Families in your area are searching every day. Inquiries and questions will land here as they come in.",
    imageUrl: TIER_FALLBACK_IMAGE,
  };
}

/**
 * Fire-and-forget event capture. `keepalive: true` ensures the POST survives
 * a same-tab navigation. Mirrors the AnalyticsTeaserCard tracking pattern.
 */
function track(
  eventType: "provider_picker_impression" | "provider_picker_clicked",
  providerSlug: string,
  metadata: Record<string, unknown>,
): void {
  try {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        actor_type: "provider",
        provider_id: providerSlug,
        event_type: eventType,
        metadata,
      }),
    }).catch(() => {
      /* fire-and-forget */
    });
  } catch {
    /* fire-and-forget */
  }
}
