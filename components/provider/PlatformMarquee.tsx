"use client";

/**
 * Auto-scrolling strip of the ad platforms we run on — the "wherever families
 * look" visual. Shared by the boost-page pitch (`default`: logo + name pills)
 * and the dashboard Managed Ads card (`compact`: logo-only chips).
 *
 * Callers may pass their own `platforms` list. A platform marked `soon` renders
 * greyed with a tag, which is how /managed-ads keeps the strip without claiming
 * channels it has never bought.
 *
 * Uses the real full-color brand marks (local SVGs in
 * /public/images/platform-logos, sourced from vectorlogo.zone) rather than
 * monochrome icon-font glyphs — the genuine logos are far more recognizable
 * (the real 4-color Google "G", Instagram's gradient, etc.). Plain <img> so we
 * don't need next/image's dangerouslyAllowSVG, and the files are local so
 * there's no runtime CDN dependency on a provider-facing surface.
 */

export type MarqueePlatform = {
  name: string;
  slug: string;
  /**
   * A platform we have not bought media on yet. Rendered greyed with a "soon"
   * tag rather than omitted, so a surface that names what we actually run can
   * still show where it is going. Never mark a live platform muted to make the
   * strip look longer.
   */
  soon?: boolean;
};

const PLATFORMS: MarqueePlatform[] = [
  { name: "Google", slug: "google" },
  { name: "Facebook", slug: "facebook" },
  { name: "Instagram", slug: "instagram" },
  { name: "Nextdoor", slug: "nextdoor" },
  { name: "YouTube", slug: "youtube" },
  { name: "X", slug: "x" },
];

const MARQUEE_CSS = `
@keyframes boost-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.boost-marquee-track { animation: boost-marquee 28s linear infinite; }
.boost-marquee-track:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .boost-marquee-track { animation: none; } }
`;

const MARQUEE_FADE =
  "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)";

function Logo({ slug, name, size }: { slug: string; name: string; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/platform-logos/${slug}.svg`}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export default function PlatformMarquee({
  compact = false,
  platforms,
}: {
  compact?: boolean;
  /**
   * Override the strip's contents. Omit it and every caller keeps the full
   * default set. /managed-ads passes a narrowed list because that page states
   * outright which platforms we have and have not run, and a strip claiming
   * otherwise two screens above would contradict it.
   */
  platforms?: MarqueePlatform[];
}) {
  const source = platforms ?? PLATFORMS;
  // Duplicated so the translateX(-50%) loop is seamless (each item carries its
  // own trailing margin rather than a flex gap, so two copies = exactly 2×).
  // A short list is repeated more so the strip still fills a wide viewport.
  const reps = source.length >= 6 ? 2 : 4;
  const items = Array.from({ length: reps }, () => source).flat();
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
              className={`mr-2.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white ${
                p.soon ? "border-dashed border-gray-300 opacity-45 grayscale" : "border-gray-100"
              }`}
            >
              <Logo slug={p.slug} name={p.name} size={16} />
            </span>
          ) : (
            <span
              key={i}
              className={`mr-3 inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 ${
                p.soon
                  ? "border-dashed border-gray-300 bg-gray-50 text-gray-500"
                  : "border-gray-200/80 bg-white text-gray-700"
              }`}
            >
              <span className={p.soon ? "opacity-45 grayscale" : undefined}>
                <Logo slug={p.slug} name={p.name} size={18} />
              </span>
              <span className="text-sm font-medium">{p.name}</span>
              {p.soon && (
                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  soon
                </span>
              )}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
