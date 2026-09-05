"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BrandLocation, BrandStateGroup } from "@/lib/brands";

/**
 * The brand hub's location directory: the state grid is the control, one
 * state's tiles show at a time.
 *
 * Every state's tiles are server-rendered into the page (the hidden ones with
 * the `hidden` attribute), so all 400+ location links reach crawlers whether or
 * not JavaScript runs. Without JavaScript the reader sees the default state and
 * can jump to any other via the chip anchors; with it, the chips swap panels
 * in place and the page stays the height of one state, whether the brand has
 * 15 locations or 560.
 */

const HASH_PREFIX = "#state-";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function pluralLocations(n: number): string {
  return n === 1 ? "location" : "locations";
}

/** One location as a two-line tile: city (and a name only when it adds something), then rating and rate. */
function LocationTile({ loc }: { loc: BrandLocation }) {
  return (
    <li>
      <Link
        href={`/provider/${loc.slug}`}
        className="group flex flex-col justify-center min-h-[56px] px-3 py-2 rounded-lg bg-gray-50 hover:bg-primary-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
          {loc.city || loc.name}
          {loc.city && loc.distinctName && (
            <span className="block text-xs font-normal text-gray-500 truncate">{loc.distinctName}</span>
          )}
        </span>
        <span className="mt-0.5 text-xs text-gray-500 tabular-nums flex items-center gap-1.5">
          {loc.rating != null ? (
            <>
              <StarIcon className="w-3 h-3 text-amber-400" />
              <span className="font-semibold text-gray-800">{loc.rating.toFixed(1)}</span>
              {loc.reviewCount != null && <span className="text-gray-400">({loc.reviewCount})</span>}
            </>
          ) : (
            <span className="text-gray-400">No reviews yet</span>
          )}
          {loc.priceRange && (
            <>
              <span className="text-gray-300">·</span>
              <span>{loc.priceRange}</span>
            </>
          )}
        </span>
      </Link>
    </li>
  );
}

export default function BrandStateDirectory({
  brandName,
  states,
  defaultState,
}: {
  brandName: string;
  states: BrandStateGroup[];
  /** Lowercase abbreviation of the state open on first render (the largest). */
  defaultState: string;
}) {
  const [selected, setSelected] = useState(defaultState);
  const [showAll, setShowAll] = useState(false);

  const known = (abbrev: string) => states.some((s) => s.abbrev.toLowerCase() === abbrev);

  // A link to #state-tx (from the hero, an email, a search result) opens Texas.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash;
      if (h.startsWith(HASH_PREFIX)) {
        const st = h.slice(HASH_PREFIX.length).toLowerCase();
        if (known(st)) setSelected(st);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (abbrev: string) => {
    setSelected(abbrev);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `${HASH_PREFIX}${abbrev}`);
      const el = document.getElementById(`state-${abbrev}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div>
      {/* State grid: the control */}
      <div id="states" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-7 scroll-mt-24">
        {states.map((s) => {
          const abbrev = s.abbrev.toLowerCase();
          const current = !showAll && abbrev === selected;
          return (
            <a
              key={s.abbrev}
              href={`${HASH_PREFIX}${abbrev}`}
              aria-current={current ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                pick(abbrev);
              }}
              className={
                current
                  ? "flex items-center justify-between min-h-[40px] px-3 py-2 text-sm rounded-lg bg-primary-600 text-white font-semibold"
                  : "flex items-center justify-between min-h-[40px] px-3 py-2 text-sm rounded-lg bg-gray-50 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              }
            >
              <span>{s.name}</span>
              <span className={current ? "text-xs text-white/80" : "text-xs text-gray-400"}>{s.locations.length}</span>
            </a>
          );
        })}
      </div>

      {/* Panels: all rendered, one visible */}
      <div className={showAll ? "space-y-10" : ""}>
        {states.map((s) => {
          const abbrev = s.abbrev.toLowerCase();
          const visible = showAll || abbrev === selected;
          return (
            <section key={s.abbrev} id={`state-${abbrev}`} hidden={!visible} className="scroll-mt-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {s.name}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  {s.locations.length} {pluralLocations(s.locations.length)}
                </span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {s.locations.map((loc) => (
                  <LocationTile key={loc.id} loc={loc} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {states.length > 1 && (
        <p className="mt-7 text-sm">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-primary-600 hover:text-primary-700 font-medium min-h-[40px]"
          >
            {showAll ? "Back to one state at a time" : `Show every ${brandName} location on one page`}
          </button>
        </p>
      )}
    </div>
  );
}
