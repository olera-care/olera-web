"use client";

import { useState } from "react";
import Image from "next/image";

// ============================================================
// Types
// ============================================================

export interface UnitType {
  name: string;
  /** e.g. "$4,020" */
  price?: string;
  /** e.g. "566–694 Sq. Ft." */
  sqft?: string;
  /** Floor plan variants for this unit type */
  floorPlans?: { label: string; sqft: string; img: string }[];
  /** Room photos for this unit */
  photos?: { src: string; alt: string }[];
  /** Unit-specific features (beyond the shared ones) */
  features?: string[];
}

export interface AccommodationsSectionProps {
  units: UnitType[];
  /** Features shared across all units — shown once at top */
  sharedFeatures?: string[];
  /** Fallback overall price range when no per-unit pricing exists */
  overallPriceRange?: string;
  /** Pricing disclaimer shown at the bottom */
  disclaimer?: string;
  providerName?: string;
}

// ============================================================
// Component
// ============================================================

export default function AccommodationsSection({
  units: rawUnits,
  sharedFeatures = [],
  overallPriceRange,
  disclaimer,
  providerName,
}: AccommodationsSectionProps) {
  // Filter out units that only have a name and nothing else
  const units = rawUnits.filter(
    (u) => u.price || u.sqft || (u.floorPlans?.length ?? 0) > 0 || (u.photos?.length ?? 0) > 0 || (u.features?.length ?? 0) > 0,
  );

  const [activeUnit, setActiveUnit] = useState(0);
  const unit = units[activeUnit];

  // Combine floor plans + photos into one media array for the viewer
  const media: { src: string; alt: string; isFloorPlan?: boolean; planLabel?: string; planSqft?: string }[] = [];
  if (unit) {
    for (const fp of unit.floorPlans ?? []) {
      media.push({ src: fp.img, alt: `${fp.label} floor plan`, isFloorPlan: true, planLabel: fp.label, planSqft: fp.sqft });
    }
    for (const photo of unit.photos ?? []) {
      media.push({ src: photo.src, alt: photo.alt });
    }
  }

  const [activeMedia, setActiveMedia] = useState(0);
  // Reset media index when switching units
  const handleUnitChange = (idx: number) => {
    setActiveUnit(idx);
    setActiveMedia(0);
  };

  // If no units at all, show fallback or collapse
  if (units.length === 0 && !overallPriceRange && sharedFeatures.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 font-display mb-2">Accommodations</h2>
      <p className="text-sm text-gray-500 mb-6">
        {units.length > 0
          ? "Explore available unit types, floor plans, and pricing."
          : "Total monthly costs depend on room type, select services, and the level of care needed."}
      </p>

      {/* Shared features checklist */}
      {sharedFeatures.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Included with every unit</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2.5">
            {sharedFeatures.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No per-unit data — show overall price range fallback */}
      {units.length === 0 && overallPriceRange && (
        <div className="bg-blue-50 rounded-xl py-4 px-5">
          <span className="text-base font-semibold text-gray-900">Starting at </span>
          <span className="text-base font-bold text-gray-900">{overallPriceRange}</span>
        </div>
      )}

      {/* Unit selector tabs */}
      {units.length > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">
            {units.map((u, i) => (
              <button
                key={u.name}
                type="button"
                onClick={() => handleUnitChange(i)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                  activeUnit === i
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {u.name}
                {u.price && (
                  <span className={`ml-2 font-normal ${activeUnit === i ? "text-teal-100" : "text-gray-400"}`}>
                    from {u.price}/mo
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active unit detail card */}
          {unit && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
              {/* Media viewer — big image + thumbnails */}
              {media.length > 0 && (
                <div className="bg-gray-50">
                  {/* Main image */}
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-gray-100">
                    <Image
                      src={media[activeMedia].src}
                      alt={media[activeMedia].alt}
                      fill
                      className={media[activeMedia].isFloorPlan ? "object-contain p-4" : "object-cover"}
                      sizes="(max-width: 768px) 100vw, 60vw"
                    />
                    {/* Floor plan label overlay */}
                    {media[activeMedia].isFloorPlan && media[activeMedia].planLabel && (
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                        <p className="text-sm font-bold text-gray-900">{media[activeMedia].planLabel}</p>
                        {media[activeMedia].planSqft && (
                          <p className="text-xs text-gray-500">{media[activeMedia].planSqft}</p>
                        )}
                      </div>
                    )}
                    {/* Image counter */}
                    {media.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-md">
                        {activeMedia + 1} / {media.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {media.length > 1 && (
                    <div className="flex gap-1.5 px-3 py-3 overflow-x-auto scrollbar-hide">
                      {media.map((m, i) => (
                        <button
                          key={m.src}
                          type="button"
                          onClick={() => setActiveMedia(i)}
                          className={`shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                            activeMedia === i ? "border-teal-600" : "border-transparent opacity-60 hover:opacity-90"
                          }`}
                        >
                          <Image
                            src={m.src}
                            alt={m.alt}
                            width={80}
                            height={56}
                            className={`w-full h-full ${m.isFloorPlan ? "object-contain bg-white p-0.5" : "object-cover"}`}
                          />
                          {m.isFloorPlan && (
                            <span className="sr-only">Floor plan</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Unit info */}
              <div className="px-5 py-5">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{unit.name}</h3>
                  {unit.sqft && (
                    <span className="text-sm text-gray-500">{unit.sqft}</span>
                  )}
                </div>

                {unit.price && (
                  <p className="text-base text-gray-700 mb-4">
                    Starting at <span className="font-bold text-gray-900">{unit.price}</span>
                    <span className="text-gray-500">/mo</span>
                  </p>
                )}

                {/* Floor plan variants list (if multiple) */}
                {(unit.floorPlans?.length ?? 0) > 1 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Floor plan options</h4>
                    <div className="flex flex-wrap gap-2">
                      {unit.floorPlans!.map((fp, i) => {
                        // Find the index of this floor plan in the media array
                        const mediaIdx = media.findIndex((m) => m.src === fp.img);
                        return (
                          <button
                            key={fp.label}
                            type="button"
                            onClick={() => mediaIdx >= 0 && setActiveMedia(mediaIdx)}
                            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                              mediaIdx === activeMedia
                                ? "bg-teal-50 border-teal-200 text-teal-800"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {fp.label} <span className="text-gray-400 ml-1">{fp.sqft}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unit-specific features */}
                {unit.features && unit.features.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {unit.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">{feat}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Pricing disclaimer — only when pricing is actually shown */}
      {disclaimer && (units.some((u) => u.price) || overallPriceRange) && (
        <p className="text-xs text-gray-400 mt-4 leading-relaxed">*{disclaimer}</p>
      )}
    </div>
  );
}
