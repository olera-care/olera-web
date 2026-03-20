"use client";

import { useState, useRef, useEffect } from "react";
import type { BenefitMatch } from "@/lib/types/benefits";
import { getSavingsRange } from "@/lib/types/benefits";
import MatchConfidenceBar from "./MatchConfidenceBar";

interface ProgramCardProps {
  match: BenefitMatch;
  isSaved: boolean;
  onToggleSave: () => void;
  defaultExpanded?: boolean;
}

export default function ProgramCard({ match, isSaved, onToggleSave, defaultExpanded = false }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const { program, matchScore, matchReasons, tierLabel } = match;
  const bookmarkRef = useRef<SVGSVGElement>(null);
  const prevSavedRef = useRef(isSaved);

  // Show toast when isSaved changes from false to true
  useEffect(() => {
    if (isSaved && !prevSavedRef.current) {
      setShowSavedToast(true);
      const timer = setTimeout(() => setShowSavedToast(false), 2500);
      return () => clearTimeout(timer);
    }
    prevSavedRef.current = isSaved;
  }, [isSaved]);

  const previewReasons = matchReasons.slice(0, 2);
  const hasMoreReasons = matchReasons.length > 2;

  function handleBookmarkClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isSaved && bookmarkRef.current) {
      bookmarkRef.current.classList.remove("animate-bookmark-pop");
      // Force reflow to restart animation (getBoundingClientRect works on SVG)
      bookmarkRef.current.getBoundingClientRect();
      bookmarkRef.current.classList.add("animate-bookmark-pop");
    }
    onToggleSave();
  }

  return (
    <div className="border-b border-vanilla-200 last:border-b-0">
      {/* Clickable header */}
      <div className="flex items-start gap-4 py-5">
        {/* Left content — expands on click */}
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="flex-1 min-w-0 text-left cursor-pointer bg-transparent border-none group"
        >
          {/* Program name + savings badge */}
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <h4 className="font-display text-lg font-medium text-gray-900 leading-snug">
              {program.short_name || program.name}
            </h4>
            {(() => {
              const range = getSavingsRange(program.name);
              if (!range) return null;
              return (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ${range.low.toLocaleString()}&ndash;${range.high.toLocaleString()}/mo
                </span>
              );
            })()}
          </div>

          {/* Confidence bar */}
          <div className="mb-3">
            <MatchConfidenceBar score={matchScore} tierLabel={tierLabel} />
          </div>

          {/* Top reasons */}
          <div className="space-y-1">
            {previewReasons.map((r, i) => (
              <p key={i} className="text-sm text-gray-500 flex items-start gap-2">
                <svg
                  className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {r}
              </p>
            ))}
          </div>
        </button>

        {/* Right side — bookmark + chevron */}
        <div className="flex items-center gap-1 shrink-0 mt-1 relative">
          {/* Saved toast */}
          <span
            className={`absolute right-full mr-2 text-xs font-medium text-primary-600 whitespace-nowrap transition-opacity duration-200 ${
              showSavedToast ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            Saved to profile
          </span>

          {/* Bookmark */}
          <button
            onClick={handleBookmarkClick}
            aria-label={isSaved ? "Remove bookmark" : "Bookmark program"}
            aria-pressed={isSaved}
            className="w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-lg hover:bg-vanilla-100 transition-colors"
          >
            <svg
              ref={bookmarkRef}
              className={`w-5 h-5 transition-colors ${
                isSaved ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
              }`}
              viewBox="0 0 24 24"
              fill={isSaved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
          </button>

          {/* Chevron */}
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Collapse details" : "Expand details"}
            className="w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer"
          >
            <svg
              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 hover:text-gray-600 ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-expand" : "grid-rows-collapse"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-6">
            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {program.description}
            </p>

            {/* All match reasons */}
            {hasMoreReasons && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-400 mb-2 tracking-wide uppercase">
                  Why you qualify
                </p>
                <ul className="list-none p-0 m-0 space-y-1">
                  {matchReasons.map((r, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-500 flex items-start gap-2"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What to say */}
            {program.what_to_say && (
              <div className="bg-vanilla-100 rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-gray-400 mb-1.5">
                  What to say when you call
                </p>
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  &ldquo;{program.what_to_say}&rdquo;
                </p>
              </div>
            )}

            {/* How to Apply steps */}
            {(program.phone || program.website || program.application_url) && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-400 mb-2 tracking-wide uppercase">
                  How to apply
                </p>
                <ol className="list-none p-0 m-0 space-y-2">
                  {program.application_url && (
                    <li className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-bold shrink-0 mt-0.5">1</span>
                      <span>Apply online at <a href={program.application_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">{new URL(program.application_url).hostname.replace("www.", "")}</a></span>
                    </li>
                  )}
                  {program.phone && (
                    <li className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-bold shrink-0 mt-0.5">{program.application_url ? "2" : "1"}</span>
                      <span>Call <a href={`tel:${program.phone}`} className="text-primary-600 hover:text-primary-700 font-medium no-underline">{program.phone}</a> to check your eligibility</span>
                    </li>
                  )}
                  {program.website && !program.application_url && (
                    <li className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-bold shrink-0 mt-0.5">{program.phone ? "2" : "1"}</span>
                      <span>Visit <a href={program.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">{new URL(program.website).hostname.replace("www.", "")}</a> for details</span>
                    </li>
                  )}
                </ol>
              </div>
            )}

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {program.phone && (
                <a
                  href={`tel:${program.phone}`}
                  aria-label={`Call ${program.short_name || program.name}`}
                  className="inline-flex items-center gap-2 px-5 py-2 min-h-[44px] bg-gray-900 text-white rounded-full text-sm font-medium no-underline hover:bg-gray-800 transition-colors"
                >
                  Call {program.phone}
                </a>
              )}
              {program.website && (
                <a
                  href={program.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${program.short_name || program.name} website`}
                  className="inline-flex items-center min-h-[44px] px-2 text-sm font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
                >
                  Website &rarr;
                </a>
              )}
              {program.application_url && (
                <a
                  href={program.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Apply online for ${program.short_name || program.name}`}
                  className="inline-flex items-center min-h-[44px] px-2 text-sm font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
                >
                  Apply online &rarr;
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
