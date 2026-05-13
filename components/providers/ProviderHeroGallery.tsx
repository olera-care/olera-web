"use client";

import { useState, useRef, useEffect } from "react";
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
  // Track hover/touch state for showing arrows on mobile
  const [showArrows, setShowArrows] = useState(false);
  const hideArrowsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validImages = images.filter((_, i) => !failedImages.has(i));
  const safeIndex = Math.min(currentIndex, Math.max(0, validImages.length - 1));
  const showFallback = !!fallbackImage && !fallbackFailed;
  const showRealImage = validImages.length > 0;
  const showGradient = !showFallback && !showRealImage;
  // Carousel UI only appears once a real image has actually rendered, so users
  // never see the counter cycle "1/6 → 1/5 → ..." during the onError cascade.
  const showCarouselUI = anyRealImageLoaded && validImages.length > 1;

  const goNext = () => setCurrentIndex((i) => (i + 1) % validImages.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + validImages.length) % validImages.length);

  // Show arrows on touch/click, hide after 2 seconds of inactivity
  const handleGalleryInteraction = () => {
    setShowArrows(true);
    if (hideArrowsTimer.current) clearTimeout(hideArrowsTimer.current);
    hideArrowsTimer.current = setTimeout(() => setShowArrows(false), 2000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideArrowsTimer.current) clearTimeout(hideArrowsTimer.current);
    };
  }, []);

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
    <div
      className="group relative w-full aspect-[3/2] rounded-none md:max-w-md md:rounded-2xl overflow-hidden bg-gray-100"
      onClick={handleGalleryInteraction}
      onTouchStart={handleGalleryInteraction}
    >
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
          {/* Left arrow - hidden by default on mobile, shows on hover (desktop) or tap (mobile) */}
          {safeIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
                handleGalleryInteraction();
              }}
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-opacity cursor-pointer md:opacity-0 md:group-hover:opacity-100 ${
                showArrows ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* Right arrow - hidden by default on mobile, shows on hover (desktop) or tap (mobile) */}
          {safeIndex < validImages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
                handleGalleryInteraction();
              }}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-opacity cursor-pointer md:opacity-0 md:group-hover:opacity-100 ${
                showArrows ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Next photo"
            >
              <svg className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {/* Photo count - centered at bottom */}
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {safeIndex + 1}/{validImages.length}
          </span>
        </>
      )}
    </div>
  );
}
