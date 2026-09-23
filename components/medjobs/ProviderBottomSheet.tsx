"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import type { ProviderCard } from "@/app/api/medjobs/providers/route";

/**
 * ProviderBottomSheet — Mobile sheet for student "Find Jobs" board.
 * Shows provider details and "Request Interview" CTA.
 * Unlike CandidateBottomSheet, this does NOT embed a scheduling form;
 * it triggers onRequestInterview which opens ScheduleInterviewModal.
 */

const HOURS_LABELS: Record<string, string> = {
  "0_10": "Up to 10 hrs/wk",
  "10_20": "10–20 hrs/wk",
  "20_30": "20–30 hrs/wk",
  "30_plus": "30+ hrs/wk",
};

const COMMITMENT_LABELS: Record<string, string> = {
  one_term: "One semester",
  multiple_terms: "Multiple semesters",
};

interface ProviderBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderCard;
  campus?: string;
  /** Callback when user taps "Request Interview" */
  onRequestInterview: () => void;
  /** Whether this provider was already requested */
  isRequested?: boolean;
  /** Whether student can request (has profile) */
  canRequest?: boolean;
  /** Custom label for the CTA button */
  requestLabel?: string;
}

export default function ProviderBottomSheet({
  isOpen,
  onClose,
  provider,
  campus,
  onRequestInterview,
  isRequested = false,
  canRequest = true,
  requestLabel,
}: ProviderBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const opp = provider.opportunity;
  const hasOpportunity = !!(
    opp?.hours_per_week ||
    opp?.pay_min ||
    opp?.pay_max ||
    opp?.certifications?.length ||
    opp?.skills?.length ||
    opp?.commitment
  );

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

  // Scroll lock
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

  // Close sheet when viewport switches to desktop
  useEffect(() => {
    if (!isOpen) return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) onCloseRef.current();
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isOpen]);

  // Scroll content to top when provider changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [provider.id]);

  if (!isOpen || !mounted) return null;

  const ctaLabel =
    requestLabel ||
    (isRequested ? "Interview Requested" : canRequest ? "Request Interview" : "Sign in to apply");

  const providerUrl = `/provider/${provider.slug}${campus ? `?campus=${campus}` : ""}`;

  const sheetContent = (
    <div
      className="fixed inset-0 z-[60] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`${provider.name} profile`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-sheet-up flex flex-col"
        style={{ maxHeight: "92dvh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 shrink-0">
          <span className="text-sm font-medium text-gray-500">Provider Details</span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 py-5 space-y-6">
            {/* Identity Header */}
            <div className="flex items-start gap-4">
              {provider.image ? (
                <Image
                  src={provider.image}
                  alt={provider.name}
                  width={72}
                  height={72}
                  className="w-[72px] h-[72px] rounded-xl object-cover shadow-sm ring-1 ring-gray-100 shrink-0"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm ring-1 ring-gray-100 shrink-0">
                  <span className="text-2xl font-bold text-primary-600">
                    {provider.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-display font-bold text-gray-900 leading-tight">
                  {provider.name}
                </h2>
                {provider.address && (
                  <p className="text-sm text-gray-500 mt-0.5">{provider.address}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {provider.isProgram && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Claimed
                    </span>
                  )}
                  {provider.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {provider.description && (
              <Section title="About">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {provider.description.length > 500
                    ? `${provider.description.slice(0, 500)}...`
                    : provider.description}
                </p>
                <Link
                  href={providerUrl}
                  className="inline-block mt-3 text-sm font-medium text-primary-700 hover:text-primary-800"
                >
                  View full profile &rarr;
                </Link>
              </Section>
            )}

            {/* Care Types */}
            {provider.careTypes.length > 0 && (
              <Section title="Care Types">
                <div className="flex flex-wrap gap-1.5">
                  {provider.careTypes.map((type) => (
                    <span
                      key={type}
                      className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-semibold border border-primary-100"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Job Opportunity Details */}
            {hasOpportunity && (
              <Section title="Job Details">
                <div className="space-y-3">
                  {/* Hours */}
                  {opp?.hours_per_week && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Hours</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {HOURS_LABELS[opp.hours_per_week] || opp.hours_per_week}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pay Range */}
                  {(opp?.pay_min || opp?.pay_max) && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Pay Range</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {opp.pay_min && opp.pay_max
                            ? `$${opp.pay_min} – $${opp.pay_max}/hr`
                            : opp.pay_min
                            ? `From $${opp.pay_min}/hr`
                            : `Up to $${opp.pay_max}/hr`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Commitment */}
                  {opp?.commitment && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Commitment</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {COMMITMENT_LABELS[opp.commitment] || opp.commitment}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Required Certifications */}
                  {opp?.certifications && opp.certifications.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-2">
                        Required Certifications
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {opp.certifications.map((cert) => (
                          <span
                            key={cert}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-100"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Skills */}
                  {opp?.skills && opp.skills.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-2">Required Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {opp.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Highlights */}
            {provider.highlights.length > 0 && (
              <Section title="Highlights">
                <div className="space-y-2">
                  {provider.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* View Full Profile Link */}
            <div className="pt-2">
              <Link
                href={providerUrl}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
              >
                View Full Profile
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </Link>
            </div>

            {/* Bottom padding for scroll */}
            <div className="h-4" />
          </div>
        </div>

        {/* Sticky Footer CTA */}
        <div
          className="px-5 py-4 border-t border-gray-200 bg-white shrink-0"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            type="button"
            onClick={onRequestInterview}
            disabled={isRequested}
            className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 ${
              isRequested
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white"
            }`}
          >
            {isRequested ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {ctaLabel}
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
                {ctaLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}
