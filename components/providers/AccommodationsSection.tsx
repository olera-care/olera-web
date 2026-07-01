"use client";

import { useState, useMemo } from "react";
import Image from "next/image";

// ============================================================
// Types
// ============================================================

export interface UnitType {
  name: string;
  price?: string;
  sqft?: string;
  floorPlans?: { label: string; sqft?: string; img?: string }[];
  photos?: { src: string; alt: string }[];
  features?: string[];
}

export interface AccommodationsSectionProps {
  units?: UnitType[];
  sharedFeatures?: string[];
  /** Description paragraph shown under the heading */
  description?: string;
  overallPriceRange?: string;
  disclaimer?: string;
  providerName?: string;
}

// ============================================================
// Helpers
// ============================================================

interface FlatSlide {
  src: string;
  label: string;
  sqft?: string;
  unitPrice?: string;
}

function unitHasData(u: UnitType): boolean {
  return !!(
    u.price ||
    u.sqft ||
    (u.floorPlans?.some((fp) => fp.img)) ||
    (u.photos?.length) ||
    (u.features?.length)
  );
}

// ============================================================
// Component
// ============================================================

export default function AccommodationsSection({
  units: rawUnits = [],
  sharedFeatures: rawSharedFeatures = [],
  description,
  overallPriceRange,
  disclaimer,
  providerName,
}: AccommodationsSectionProps) {
  const units = useMemo(() => rawUnits.filter(unitHasData), [rawUnits]);
  const sharedFeatures = useMemo(() => rawSharedFeatures.filter((f) => f.trim()), [rawSharedFeatures]);

  // Units that have floor plans (for toggle buttons)
  const unitsWithPlans = useMemo(() => units.filter((u) => u.floorPlans?.some((fp) => fp.img)), [units]);

  const [activeUnitIdx, setActiveUnitIdx] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Slides for the currently selected unit type
  const visibleSlides = useMemo(() => {
    const unit = unitsWithPlans[activeUnitIdx];
    if (!unit) return [];
    const slides: FlatSlide[] = [];
    for (const fp of unit.floorPlans ?? []) {
      if (!fp.img) continue;
      slides.push({
        src: fp.img,
        label: fp.label,
        sqft: fp.sqft,
        unitPrice: unit.price,
      });
    }
    return slides;
  }, [unitsWithPlans, activeUnitIdx]);

  // All slides across all unit types (for lightbox navigation)
  const allSlides = useMemo(() => {
    const slides: FlatSlide[] = [];
    for (const u of unitsWithPlans) {
      for (const fp of u.floorPlans ?? []) {
        if (!fp.img) continue;
        slides.push({
          src: fp.img,
          label: fp.label,
          sqft: fp.sqft,
          unitPrice: u.price,
        });
      }
    }
    return slides;
  }, [unitsWithPlans]);

  // Map from visible slide index to allSlides index for opening lightbox
  const visibleToAllIndex = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < activeUnitIdx; i++) {
      offset += (unitsWithPlans[i]?.floorPlans?.filter((fp) => fp.img).length ?? 0);
    }
    return (visIdx: number) => offset + visIdx;
  }, [unitsWithPlans, activeUnitIdx]);

  // Reset slide index when switching unit type
  const selectUnit = (idx: number) => {
    setActiveUnitIdx(idx);
    setActiveSlide(0);
  };

  const slide = visibleSlides[activeSlide] ?? null;
  const lightboxSlide = lightboxIdx !== null ? allSlides[lightboxIdx] : null;
  const hasPricing = units.some((u) => u.price) || !!overallPriceRange;
  const hasFloorPlans = unitsWithPlans.length > 0;

  if (units.length === 0 && !overallPriceRange && sharedFeatures.length === 0) {
    return null;
  }

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 font-display mb-1 flex items-center gap-2.5">
          <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
          </svg>
          Accommodations
        </h2>
        {!description && (
          <p className="text-sm text-gray-500 mb-4">
            {hasFloorPlans
              ? "Explore unit types, floor plans, and pricing."
              : "Total monthly costs depend on room type, select services, and the level of care needed."}
          </p>
        )}

        {/* ── Floor plan carousel + features stacked ── */}
        {hasFloorPlans && (
          <div>
            {/* Top — Description + included features (full width) */}
            {sharedFeatures.length > 0 && (
              <div className="mb-5">
                {description && (
                  <p className="text-sm text-gray-600 mb-4">{description}</p>
                )}
                <h4 className="text-base font-semibold text-gray-800 mb-3">Included with every unit</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-2.5">
                  {sharedFeatures.map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[15px] text-gray-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floor plan carousel — shows 3 at a time, scrollable */}
            {allSlides.length > 0 && (<>
              <h4 className="text-base font-semibold text-gray-800 mb-3">Floor Plans</h4>
              <div className="relative">
                {/* Left arrow */}
                {allSlides.length > 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("fp-scroll");
                      if (el) el.scrollBy({ left: -(el.clientWidth * 0.75), behavior: "smooth" });
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Scroll left"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Right arrow */}
                {allSlides.length > 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("fp-scroll");
                      if (el) el.scrollBy({ left: el.clientWidth * 0.75, behavior: "smooth" });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Scroll right"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {/* Scrollable row */}
                <div
                  id="fp-scroll"
                  className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
                >
                  {allSlides.map((s, idx) => (
                    <div
                      key={s.src}
                      className="flex-shrink-0 w-[calc(33.333%-11px)] min-w-[240px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      {/* Floor plan image */}
                      <button
                        type="button"
                        onClick={() => setLightboxIdx(idx)}
                        className="relative aspect-[4/3] w-full bg-[#f0f7fa] cursor-zoom-in"
                      >
                        <Image
                          src={s.src}
                          alt={`${s.label} floor plan`}
                          fill
                          className="object-contain p-2"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        {/* Expand icon */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm rounded-full px-3 py-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                          </svg>
                          <span className="text-xs font-medium text-gray-700">Expand</span>
                        </div>
                      </button>
                      {/* Info */}
                      <div className="px-3 py-2.5">
                        <p className="text-base font-bold text-gray-900">{s.label}</p>
                        {s.sqft && (
                          <p className="text-sm text-gray-500 mt-0.5">{s.sqft}</p>
                        )}
                        {s.unitPrice && (
                          <p className="text-sm mt-0.5">
                            From <span className="font-bold text-gray-900">{s.unitPrice}</span>/mo
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}
          </div>
        )}

        {/* No floor plans — features + price fallback */}
        {!hasFloorPlans && (
          <>
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
            {overallPriceRange && (
              <div className="bg-blue-50 rounded-xl py-4 px-5">
                <span className="text-base font-semibold text-gray-900">Starting at </span>
                <span className="text-base font-bold text-gray-900">{overallPriceRange}</span>
              </div>
            )}
          </>
        )}

        {/* Pricing disclaimer */}
        {disclaimer && hasPricing && (
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">*{disclaimer}</p>
        )}
      </div>

      {/* Lightbox — cycles through ALL floor plans across all unit types */}
      {lightboxIdx !== null && lightboxSlide && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Slide info + counter */}
          <div className="absolute top-4 left-16 right-16 text-center z-10" onClick={(e) => e.stopPropagation()}>
            <p className="text-white text-xl font-bold">
              {lightboxSlide.label}
            </p>
            <div className="flex items-center justify-center gap-3 mt-0.5">
              {lightboxSlide.sqft && <span className="text-white/70 text-sm">{lightboxSlide.sqft}</span>}
              {lightboxSlide.sqft && lightboxSlide.unitPrice && <span className="text-white/40">·</span>}
              {lightboxSlide.unitPrice && (
                <span className="text-white/70 text-sm">
                  From <span className="text-white font-medium">{lightboxSlide.unitPrice}</span>/mo
                </span>
              )}
              {allSlides.length > 1 && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-white/50 text-sm">{lightboxIdx + 1} / {allSlides.length}</span>
                </>
              )}
            </div>
          </div>

          {/* Previous button */}
          {allSlides.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx > 0 ? lightboxIdx - 1 : allSlides.length - 1);
              }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 border border-white/20 transition-colors"
              aria-label="Previous floor plan"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <Image
            key={lightboxSlide.src}
            src={lightboxSlide.src}
            alt={`${lightboxSlide.label} floor plan`}
            width={1400}
            height={900}
            className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              if (allSlides.length > 1) {
                setLightboxIdx(lightboxIdx < allSlides.length - 1 ? lightboxIdx + 1 : 0);
              }
            }}
          />

          {/* Next button */}
          {allSlides.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx < allSlides.length - 1 ? lightboxIdx + 1 : 0);
              }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 border border-white/20 transition-colors"
              aria-label="Next floor plan"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
