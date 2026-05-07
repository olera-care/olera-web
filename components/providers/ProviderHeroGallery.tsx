"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProfileCategory } from "@/lib/types";

interface ProviderHeroGalleryProps {
  images: string[];
  providerName: string;
  category: ProfileCategory | null;
  fallbackImage?: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const categoryLabels: Partial<Record<ProfileCategory, string>> = {
  home_care_agency: "Home Care",
  home_health_agency: "Home Health",
  hospice_agency: "Hospice",
  independent_living: "Independent Living",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
  nursing_home: "Nursing Home",
};

export default function ProviderHeroGallery({ images, providerName, category, fallbackImage }: ProviderHeroGalleryProps) {
  const categoryLabel = category ? categoryLabels[category] ?? null : null;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [anyRealImageLoaded, setAnyRealImageLoaded] = useState(false);

  const validImages = images.filter((src, i) => src && !failedImages.has(i));
  const safeIndex = Math.min(currentIndex, Math.max(0, validImages.length - 1));
  const showFallback = !!fallbackImage && !fallbackFailed;
  const showRealImage = validImages.length > 0;
  const showGradient = !showFallback && !showRealImage;
  // Carousel UI only appears once a real image has actually rendered, so users
  // never see the counter cycle "1/6 → 1/5 → ..." during the onError cascade.
  const showCarouselUI = anyRealImageLoaded && validImages.length > 1;

  const goNext = () => setCurrentIndex((i) => (i + 1) % validImages.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + validImages.length) % validImages.length);

  if (showGradient) {
    return (
      <div className="w-full aspect-[3/2] rounded-none md:max-w-md md:rounded-2xl bg-gradient-to-br from-primary-100 via-primary-50 to-warm-50 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center mb-3 shadow-sm">
          <span className="text-3xl font-bold text-primary-400">
            {getInitials(providerName)}
          </span>
        </div>
        {categoryLabel && (
          <span className="text-sm font-medium text-primary-400">{categoryLabel}</span>
        )}
        <span className="text-xs text-primary-300 mt-1">No photos yet</span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[3/2] rounded-none md:max-w-md md:rounded-2xl overflow-hidden bg-gray-100">
      {/* Base layer: stock photo. Stays visible until a real image loads on top
          (or stays forever if all real images fail). */}
      {showFallback && (
        <Image
          src={fallbackImage}
          alt={providerName}
          fill
          sizes="(max-width: 768px) 100vw, 448px"
          priority
          className="object-cover"
          onError={() => setFallbackFailed(true)}
        />
      )}

      {/* Overlay: real image at currentIndex. While loading it's transparent,
          so the base fallback shows through — no flash, no jank. */}
      {showRealImage && (
        <Image
          key={validImages[safeIndex]}
          src={validImages[safeIndex]}
          alt={`${providerName} — photo ${safeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 448px"
          priority
          className="object-cover"
          onLoad={() => setAnyRealImageLoaded(true)}
          onError={() => {
            const origIndex = images.indexOf(validImages[safeIndex]);
            setFailedImages((prev) => new Set(prev).add(origIndex));
          }}
        />
      )}

      {showCarouselUI && (
        <>
          {/* Left arrow */}
          {safeIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
              aria-label="Previous photo"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* Right arrow */}
          {safeIndex < validImages.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
              aria-label="Next photo"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {/* Photo count */}
          <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {safeIndex + 1}/{validImages.length}
          </span>
        </>
      )}
    </div>
  );
}
