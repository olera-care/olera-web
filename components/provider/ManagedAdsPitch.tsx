"use client";

import Link from "next/link";
import {
  GoogleLogo,
  FacebookLogo,
  InstagramLogo,
  YoutubeLogo,
  XLogo,
} from "@phosphor-icons/react";

/**
 * The Managed Ads pitch — shared between the boost page (above the gate/picker)
 * and the no-leads state of Find Families (the ~99.9% default), so there's one
 * source of truth for the value prop. Headline + platform marquee + the three
 * "you do nothing" pillars, with an optional CTA (Find Families passes one that
 * links to /provider/boost; the boost page omits it because the picker follows).
 */

const PLATFORMS: { name: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { name: "Google", Icon: GoogleLogo },
  { name: "Facebook", Icon: FacebookLogo },
  { name: "Instagram", Icon: InstagramLogo },
  { name: "Nextdoor", Icon: NextdoorGlyph },
  { name: "YouTube", Icon: YoutubeLogo },
  { name: "X", Icon: XLogo },
];

const MARQUEE_CSS = `
@keyframes boost-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.boost-marquee-track { animation: boost-marquee 28s linear infinite; }
.boost-marquee-track:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .boost-marquee-track { animation: none; } }
`;

const MARQUEE_FADE =
  "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)";

/** Phosphor has no Nextdoor logo — a simple monochrome house reads the same. */
function NextdoorGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M128 36 L228 124 H196 V220 H60 V124 H28 Z" />
    </svg>
  );
}

/** Auto-scrolling strip of the platforms we advertise on — "wherever families look." */
function PlatformMarquee() {
  const items = [...PLATFORMS, ...PLATFORMS];
  return (
    <div
      className="mt-10 overflow-hidden"
      style={{ maskImage: MARQUEE_FADE, WebkitMaskImage: MARQUEE_FADE }}
    >
      <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />
      {/* Each pill carries its own trailing margin (mr-3) rather than a flex
          `gap`, so the two duplicated copies total exactly 2× one copy's width
          and the translateX(-50%) loop is seamless (no half-gap jump). */}
      <div className="boost-marquee-track flex w-max items-center">
        {items.map((p, i) => (
          <span
            key={i}
            className="mr-3 inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200/80 px-4 py-2 text-gray-600"
          >
            <p.Icon className="h-[18px] w-[18px]" />
            <span className="text-sm font-medium">{p.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** The three reasons this is different from every DIY/agency alternative. */
function ValuePillars() {
  const pillars = [
    {
      title: "Targeted where families look",
      body: "Search, social, and local neighborhood feeds — wherever families are searching for care.",
    },
    {
      title: "Powered by your market",
      body: "We aim the spend at the high-private-pay ZIPs and local demand we already map for you.",
    },
    {
      title: "You do nothing",
      body: "No ad account, no keywords, no agency. We already have your page — we run all of it.",
    },
  ];
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-3">
      {pillars.map((p) => (
        <div key={p.title}>
          <h3 className="text-[15px] font-semibold text-gray-900">{p.title}</h3>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">{p.body}</p>
        </div>
      ))}
    </div>
  );
}

export default function ManagedAdsPitch({
  ctaHref,
  ctaLabel = "Get started",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div>
      <header className="max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50/60 border border-primary-100/60 mb-6">
          <span className="text-sm font-semibold text-primary-700">Managed Ads</span>
        </div>
        <h1 className="text-[clamp(2rem,4.5vw,2.75rem)] font-display font-bold text-gray-900 leading-[1.1] tracking-tight">
          We&apos;ll bring families<br />
          <span className="text-primary-600 italic">straight to you</span>.
        </h1>
        <p className="text-lg text-gray-500 mt-5 leading-relaxed">
          We run targeted ads where families are already looking — and point every
          one of them straight to your Olera page.
        </p>
      </header>

      <PlatformMarquee />
      <ValuePillars />

      {ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2.5 mt-10 px-9 py-3.5 bg-gray-900 hover:bg-gray-800 text-white text-[16px] font-semibold rounded-full active:scale-[0.98] transition-all duration-200"
        >
          {ctaLabel}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}
