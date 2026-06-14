"use client";

import {
  GoogleLogo,
  FacebookLogo,
  InstagramLogo,
  YoutubeLogo,
  XLogo,
} from "@phosphor-icons/react";

/**
 * Auto-scrolling strip of the ad platforms we run on — the "wherever families
 * look" visual. Shared by the boost-page pitch (`default`: logo + name pills)
 * and the dashboard Managed Ads card (`compact`: logo-only chips, the quiet
 * motion that gives the card presence without more text).
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

export default function PlatformMarquee({ compact = false }: { compact?: boolean }) {
  // Duplicated once so the translateX(-50%) loop is seamless (each item carries
  // its own trailing margin rather than a flex gap, so two copies = exactly 2×).
  const items = [...PLATFORMS, ...PLATFORMS];
  return (
    <div
      className={compact ? "mt-4 overflow-hidden" : "mt-10 overflow-hidden"}
      style={{ maskImage: MARQUEE_FADE, WebkitMaskImage: MARQUEE_FADE }}
    >
      <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />
      <div className="boost-marquee-track flex w-max items-center">
        {items.map((p, i) =>
          compact ? (
            <span
              key={i}
              className="mr-2.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-100/70 bg-white text-gray-500"
            >
              <p.Icon className="h-[15px] w-[15px]" />
            </span>
          ) : (
            <span
              key={i}
              className="mr-3 inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200/80 px-4 py-2 text-gray-600"
            >
              <p.Icon className="h-[18px] w-[18px]" />
              <span className="text-sm font-medium">{p.name}</span>
            </span>
          ),
        )}
      </div>
    </div>
  );
}
