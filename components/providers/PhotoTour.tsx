"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import type { PhotoGroup } from "@/lib/photo-categories";

// ============================================================
// PhotoTourButton — "See all N photos" trigger for the hero
// ============================================================

interface PhotoTourButtonProps {
  totalCount: number;
  onClick: () => void;
}

export function PhotoTourButton({ totalCount, onClick }: PhotoTourButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-3 left-3 z-10 bg-white hover:bg-gray-50 text-gray-800 text-sm font-medium px-5 py-2.5 rounded-full border border-gray-200 shadow-sm hover:shadow transition-all"
    >
      Photo Tour ({totalCount})
    </button>
  );
}

// ============================================================
// PhotoTourModal — full-screen grouped gallery
// ============================================================

interface PhotoTourModalProps {
  groups: PhotoGroup[];
  providerName: string;
  onClose: () => void;
  /** If set, scroll to this group on open */
  initialGroupId?: string;
}

export default function PhotoTourModal({ groups, providerName, onClose, initialGroupId }: PhotoTourModalProps) {
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId ?? groups[0]?.category.id ?? "");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Flatten all photos into a single ordered array for slideshow
  const allPhotos = useMemo(() => {
    const flat: { src: string; alt: string }[] = [];
    for (const group of groups) {
      for (let i = 0; i < group.photos.length; i++) {
        flat.push({
          src: group.photos[i].src,
          alt: group.photos[i].alt ?? `${providerName} ${group.category.label} ${i + 1}`,
        });
      }
    }
    return flat;
  }, [groups, providerName]);

  // Build a lookup from photo src to flat index for opening lightbox from grid
  const photoIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allPhotos.forEach((p, i) => map.set(p.src, i));
    return map;
  }, [allPhotos]);

  // Map each flat index to its category label for the lightbox
  const photoCategoryMap = useMemo(() => {
    const map = new Map<number, string>();
    let idx = 0;
    for (const group of groups) {
      for (let i = 0; i < group.photos.length; i++) {
        map.set(idx, group.category.label);
        idx++;
      }
    }
    return map;
  }, [groups]);

  const scrollToSection = useCallback((id: string) => {
    setActiveGroupId(id);
    const el = sectionRefs.current[id];
    if (el && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const offsetTop = el.offsetTop - container.offsetTop - 72;
      container.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  }, []);

  // Scroll to initial group on mount
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (initialGroupId && !initialScrollDone.current) {
      initialScrollDone.current = true;
      // Delay to allow refs to populate
      setTimeout(() => scrollToSection(initialGroupId), 100);
    }
  }, [initialGroupId, scrollToSection]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop + 80;
    let current = groups[0]?.category.id ?? "";
    for (const group of groups) {
      const el = sectionRefs.current[group.category.id];
      if (el) {
        const top = el.offsetTop - container.offsetTop;
        if (scrollTop >= top) current = group.category.id;
      }
    }
    setActiveGroupId(current);
  }, [groups]);

  return (
    <>
      {/* Full-screen photo tour */}
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Back to listing"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to listing
            </button>
            <span className="text-gray-300">|</span>
            <h2 className="text-xl font-semibold text-gray-900 truncate">{providerName} Photo Tour</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close photo tour"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category thumbnail nav — horizontal scrollable row */}
        <div className="flex gap-3 sm:gap-4 px-4 sm:px-6 py-4 overflow-x-auto border-b border-gray-100 shrink-0 scrollbar-hide">
          {groups.map((group) => {
            const isActive = activeGroupId === group.category.id;
            return (
              <button
                key={group.category.id}
                type="button"
                onClick={() => scrollToSection(group.category.id)}
                className={`shrink-0 flex flex-col items-center gap-2 transition-all ${
                  isActive ? "" : "opacity-60 hover:opacity-90"
                }`}
              >
                <div className={`w-40 h-28 sm:w-48 sm:h-32 rounded-xl overflow-hidden border-2 transition-colors ${
                  isActive ? "border-teal-600" : "border-transparent"
                }`}>
                  <Image
                    src={group.photos[0].src}
                    alt={group.category.label}
                    width={192}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-sm font-medium whitespace-nowrap ${
                  isActive ? "text-teal-700" : "text-gray-500"
                }`}>
                  {group.category.shortLabel ?? group.category.label}
                  <span className={`ml-1 ${isActive ? "text-teal-500" : "text-gray-400"}`}>{group.photos.length}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable photo sections */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 sm:px-12 lg:px-16 pb-8"
        >
          {groups.map((group) => (
            <div
              key={group.category.id}
              ref={(el) => { sectionRefs.current[group.category.id] = el; }}
              className="pt-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {group.category.label}
                <span className="text-base font-normal text-gray-400 ml-2">{group.photos.length}</span>
              </h3>
              <div className="max-w-6xl grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {group.photos.map((photo, i) => {
                  const flatIdx = photoIndexMap.get(photo.src) ?? 0;
                  return (
                    <button
                      key={photo.src}
                      type="button"
                      onClick={() => setLightboxIndex(flatIdx)}
                      className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt ?? `${providerName} ${group.category.label} ${i + 1}`}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox slideshow */}
      {lightboxIndex !== null && allPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Category label + counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
            {photoCategoryMap.get(lightboxIndex)} &middot; {lightboxIndex + 1} / {allPhotos.length}
          </div>

          {/* Previous button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : allPhotos.length - 1);
            }}
            className="absolute left-3 sm:left-6 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
            aria-label="Previous photo"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Image */}
          <Image
            key={allPhotos[lightboxIndex].src}
            src={allPhotos[lightboxIndex].src}
            alt={allPhotos[lightboxIndex].alt}
            width={1400}
            height={900}
            className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg select-none"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(lightboxIndex < allPhotos.length - 1 ? lightboxIndex + 1 : 0);
            }}
          />

          {/* Next button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(lightboxIndex < allPhotos.length - 1 ? lightboxIndex + 1 : 0);
            }}
            className="absolute right-3 sm:right-6 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
            aria-label="Next photo"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
