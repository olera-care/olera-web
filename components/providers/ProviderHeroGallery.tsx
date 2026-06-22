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
  // Track which real-image URLs have finished loading, and which one is currently
  // held on screen, so navigation crossfades real→real instead of flashing the
  // stock fallback through during the incoming image's load.
  const [loadedSrcs, setLoadedSrcs] = useState<Set<string>>(new Set());
  const [displayedSrc, setDisplayedSrc] = useState<string | null>(null);
  // Track hover/touch state for showing arrows on mobile
  const [showArrows, setShowArrows] = useState(false);
  const hideArrowsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validImages = images.filter((_, i) => !failedImages.has(i));
  const safeIndex = Math.min(currentIndex, Math.max(0, validImages.length - 1));
  const showRealImage = validImages.length > 0;
  // The stock photo is a TRUE fallback, not a load placeholder: it only shows
  // when there are no usable real photos (none provided, or all failed). When
  // real photos exist, the first one fades in over the neutral container instead
  // of flashing the stock image on initial page load.
  const showFallback = !showRealImage && !!fallbackImage && !fallbackFailed;
  const showGradient = !showRealImage && !showFallback;
  const currentSrc = showRealImage ? validImages[safeIndex] : null;
  const currentLoaded = currentSrc != null && loadedSrcs.has(currentSrc);
  const anyRealImageLoaded = loadedSrcs.size > 0;
  // Carousel UI only appears once a real image has actually rendered, so users
  // never see the counter cycle "1/6 → 1/5 → ..." during the onError cascade.
  const showCarouselUI = anyRealImageLoaded && validImages.length > 1;

  // Layers to mount over the neutral container:
  //  • the held (previous) photo — visible only while the incoming one loads
  //  • the current photo — visible once loaded
  //  • the adjacent photos — invisible, preloaded after the current loads so
  //    tapping next/prev is an instant network-free crossfade (the snappy bit)
  const len = validImages.length;
  const layers: { src: string; visible: boolean }[] = [];
  const seen = new Set<string>();
  const addLayer = (src: string | null, visible: boolean) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    layers.push({ src, visible });
  };
  if (displayedSrc !== currentSrc) addLayer(displayedSrc, !currentLoaded);
  addLayer(currentSrc, currentLoaded);
  if (currentLoaded && len > 1) {
    addLayer(validImages[(safeIndex + 1) % len], false);
    addLayer(validImages[(safeIndex - 1 + len) % len], false);
  }

  // Before switching index, pin the current real image as the held layer so it
  // stays on screen during the next image's load. Only pin a loaded src — a still-
  // loading one would itself be transparent and let the fallback flash through.
  const navigate = (nextIndex: number) => {
    setDisplayedSrc((prev) => (currentLoaded ? currentSrc : prev));
    setCurrentIndex(nextIndex);
  };
  const goNext = () => navigate((safeIndex + 1) % validImages.length);
  const goPrev = () => navigate((safeIndex - 1 + validImages.length) % validImages.length);

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
      {/* Stock photo — only rendered when there are no usable real photos
          (none provided, or all failed). Never a load placeholder. */}
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

      {/* Real-photo layers over the neutral container. The held (previous) image
          stays at full opacity until the incoming one finishes loading, then they
          crossfade — so the first photo fades in cleanly on load and navigation
          never cuts to a blank frame. */}
      {layers.map(({ src, visible }) => {
        const isCurrent = src === currentSrc;
        return (
          <Image
            key={src}
            src={src}
            alt={isCurrent ? `${providerName} — photo ${safeIndex + 1}` : providerName}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            priority={isCurrent}
            className={`object-cover transition-opacity duration-200 ease-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() =>
              setLoadedSrcs((prev) => (prev.has(src) ? prev : new Set(prev).add(src)))
            }
            onError={() => {
              const origIndex = images.indexOf(src);
              if (origIndex >= 0) setFailedImages((prev) => new Set(prev).add(origIndex));
            }}
          />
        );
      })}

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
          {/* Photo count */}
          <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {safeIndex + 1}/{validImages.length}
          </span>
        </>
      )}
    </div>
  );
}
