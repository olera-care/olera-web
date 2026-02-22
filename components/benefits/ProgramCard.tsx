"use client";

import { useState } from "react";
import { BENEFIT_CATEGORIES } from "@/lib/types/benefits";
import type { BenefitMatch } from "@/lib/types/benefits";

interface ProgramCardProps {
  match: BenefitMatch;
}

const TIER_STYLES: Record<
  string,
  { badge: string; bar: string }
> = {
  "Top Match": {
    badge: "bg-green-100 text-green-800",
    bar: "bg-green-500",
  },
  "Good Fit": {
    badge: "bg-blue-100 text-blue-800",
    bar: "bg-blue-500",
  },
  "Worth Exploring": {
    badge: "bg-gray-100 text-gray-700",
    bar: "bg-gray-400",
  },
};

export default function ProgramCard({ match }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { program, matchScore, matchReasons, tierLabel } = match;
  const category = BENEFIT_CATEGORIES[program.category];
  const tier = TIER_STYLES[tierLabel] || TIER_STYLES["Worth Exploring"];

  // Show top 2 reasons in collapsed state
  const previewReasons = matchReasons.slice(0, 2);
  const hasMoreReasons = matchReasons.length > 2;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-sm transition-shadow">
      {/* Always-visible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full p-4 text-left cursor-pointer bg-transparent border-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Category + tier badge */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm">{category?.icon}</span>
              <span className="text-xs font-medium text-gray-500">
                {category?.displayTitle}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tier.badge}`}
              >
                {tierLabel}
              </span>
            </div>

            {/* Program name */}
            <h4 className="text-base font-semibold text-gray-900 mb-2">
              {program.short_name || program.name}
            </h4>

            {/* Match score bar — always visible */}
            <div className="mb-2.5">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${tier.bar}`}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 inline-block">
                {matchScore}% match
              </span>
            </div>

            {/* Why you qualify — top reasons always shown */}
            <div className="space-y-0.5">
              {previewReasons.map((r, i) => (
                <p key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {r}
                </p>
              ))}
            </div>
          </div>

          {/* Expand/collapse */}
          <span
            className={`text-gray-400 text-xs mt-1 shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              expanded ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
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
          </span>
        </div>
      </button>

      {/* Expanded detail — smooth reveal */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-expand" : "grid-rows-collapse"
        }`}
      >
        <div className="overflow-hidden">
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {/* Description */}
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            {program.description}
          </p>

          {/* Full match reasons (if more than preview) */}
          {hasMoreReasons && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                All qualifying factors
              </p>
              <ul className="list-none p-0 m-0 space-y-1">
                {matchReasons.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-600 flex items-start gap-1.5"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
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
            <div className="bg-vanilla-50 border border-vanilla-200 rounded-xl p-3.5 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                What to say when you call
              </p>
              <p className="text-sm text-gray-700 italic leading-relaxed">
                &ldquo;{program.what_to_say}&rdquo;
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {program.phone && (
              <a
                href={`tel:${program.phone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium no-underline hover:bg-primary-500 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                Call
              </a>
            )}
            {program.website && (
              <a
                href={program.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium no-underline hover:bg-gray-50 transition-colors"
              >
                Website
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
            {program.application_url && (
              <a
                href={program.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-primary-300 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium no-underline hover:bg-primary-100 transition-colors"
              >
                Apply Online
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>
        </div>{/* overflow-hidden */}
      </div>{/* grid transition wrapper */}
    </div>
  );
}
