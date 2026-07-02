"use client";

import { useState, useRef, useCallback } from "react";
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
      className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm hover:bg-white transition-colors flex items-center gap-1.5"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
      See all {totalCount} photos
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
  initialCategoryId?: string;
}

export default function PhotoTourModal({ groups, providerName, onClose, initialCategoryId }: PhotoTourModalProps) {
  const [activeGroupId, setActiveGroupId] = useState(initialCategoryId ?? groups[0]?.category.id ?? "");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const scrollToSection = useCallback((id: string) => {
    setActiveGroupId(id);
    const el = sectionRefs.current[id];
    if (el && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const offsetTop = el.offsetTop - container.offsetTop - 72;
      container.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  }, []);

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
            <h2 className="text-lg font-semibold text-gray-900 truncate">{providerName} — Photo Tour</h2>
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
                <div className={`w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden border-2 transition-colors ${
                  isActive ? "border-teal-600" : "border-transparent"
                }`}>
                  <Image
                    src={group.photos[0].src}
                    alt={group.category.label}
                    width={144}
                    height={96}
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
              <div className="max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.photos.map((photo, i) => (
                  <button
                    key={photo.src}
                    type="button"
                    onClick={() => setLightbox({
                      src: photo.src,
                      alt: photo.alt ?? `${providerName} — ${group.category.label} ${i + 1}`,
                    })}
                    className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt ?? `${providerName} — ${group.category.label} ${i + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Image
            src={lightbox.src}
            alt={lightbox.alt}
            width={1200}
            height={800}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
