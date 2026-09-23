"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import {
  getTrackLabel,
  formatHoursPerWeek,
  formatAvailability,
  getActualCertifications,
} from "@/lib/medjobs-helpers";

interface CandidateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateData;
  /** Open the schedule-interview flow for this candidate. */
  onSchedule: () => void;
}

/**
 * Mobile bottom sheet for candidate preview on the Hire Caregivers board.
 * Shows condensed student info with a sticky "Schedule interview" CTA footer.
 * Follows the established bottom sheet patterns from GuideBottomSheet, CompareBottomSheet, etc.
 */
export default function CandidateBottomSheet({
  isOpen,
  onClose,
  candidate,
  onSchedule,
}: CandidateBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const meta = candidate.metadata;
  const firstName = candidate.display_name.split(" ")[0];
  const trackLabel = getTrackLabel(meta);
  const hoursLabel = formatHoursPerWeek(meta);
  const availabilityLabel = formatAvailability(meta);
  const certs = getActualCertifications(meta.certifications);

  // Mount tracking for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onCloseRef.current();
    }
  }, []);

  // Scroll lock and escape handler
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      const storedScrollY = parseInt(document.body.style.top || "0", 10) * -1;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.removeEventListener("keydown", handleKeyDown);

      requestAnimationFrame(() => {
        window.scrollTo({ top: storedScrollY, behavior: "instant" });
      });
    };
  }, [isOpen, handleKeyDown]);

  // Close sheet when viewport switches to desktop (lg breakpoint)
  useEffect(() => {
    if (!isOpen) return;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        onCloseRef.current();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const sheetContent = (
    <div
      className="fixed inset-0 z-[60] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`${candidate.display_name} profile`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-sheet-up flex flex-col"
        style={{
          maxHeight: "85dvh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header with close and view profile link */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 shrink-0">
          <a
            href={`/medjobs/candidates/${candidate.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            View full profile &rarr;
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Identity */}
          <div className="flex items-start gap-4">
            {candidate.image_url ? (
              <Image
                src={candidate.image_url}
                alt={candidate.display_name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-white shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm ring-2 ring-white shrink-0">
                <span className="text-xl font-bold text-primary-600">
                  {candidate.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-display font-bold text-gray-900">{firstName}</h2>
              {meta.university && (
                <p className="text-sm text-gray-600 font-medium mt-0.5">{meta.university}</p>
              )}
              <p className="text-sm text-gray-500 mt-0.5">
                {[trackLabel, candidate.city && candidate.state ? `${candidate.city}, ${candidate.state}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {meta.seeking_status === "actively_looking" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ready to Start
                </span>
              )}
            </div>
          </div>

          {/* About */}
          {(meta.why_caregiving || candidate.description) && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                About {firstName}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                {meta.why_caregiving || candidate.description}
              </p>
            </div>
          )}

          {/* Availability */}
          {(hoursLabel || availabilityLabel) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Availability</h3>
              <div className="flex flex-wrap gap-2">
                {hoursLabel && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                    {hoursLabel}
                  </span>
                )}
                {availabilityLabel && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                    {availabilityLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certs.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Certifications</h3>
              <div className="flex flex-wrap gap-1.5">
                {certs.map((cert) => (
                  <span key={cert} className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-semibold border border-primary-100">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer CTA */}
        <div
          className="px-5 py-4 border-t border-gray-200 bg-white shrink-0"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            type="button"
            onClick={onSchedule}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Schedule interview
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
}
