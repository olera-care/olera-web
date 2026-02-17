"use client";

import { useState } from "react";
import { BENEFIT_CATEGORIES } from "@/lib/types/benefits";
import type { BenefitMatch } from "@/lib/types/benefits";

interface ProgramCardProps {
  match: BenefitMatch;
  isSaved?: boolean;
  onSave?: () => void;
}

const TIER_COLORS: Record<string, string> = {
  "Top Match": "bg-green-100 text-green-800",
  "Good Fit": "bg-blue-100 text-blue-800",
  "Worth Exploring": "bg-gray-100 text-gray-700",
};

export default function ProgramCard({ match, isSaved, onSave }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { program, matchScore, matchReasons, tierLabel } = match;
  const category = BENEFIT_CATEGORIES[program.category];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3 bg-white">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left cursor-pointer bg-transparent border-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm">{category?.icon}</span>
              <span className="text-xs font-medium text-gray-500">
                {category?.displayTitle}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  TIER_COLORS[tierLabel] || TIER_COLORS["Worth Exploring"]
                }`}
              >
                {tierLabel}
              </span>
            </div>
            <h4 className="text-base font-semibold text-gray-900 mb-1">
              {program.short_name || program.name}
            </h4>
            <p className="text-sm text-gray-500 line-clamp-1">
              {matchReasons[0]}
            </p>
          </div>
          <span className="text-gray-400 text-lg mt-1 shrink-0">
            {expanded ? "−" : "+"}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            {program.description}
          </p>

          {/* Match reasons */}
          {matchReasons.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Why this matches:
              </p>
              <ul className="list-none p-0 m-0 space-y-0.5">
                {matchReasons.map((r, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    ✓ {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What to say */}
          {program.what_to_say && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                What to say when you call:
              </p>
              <p className="text-sm text-gray-700 italic">
                &ldquo;{program.what_to_say}&rdquo;
              </p>
            </div>
          )}

          {/* Match score bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Match strength</span>
              <span className="text-xs font-medium text-gray-700">
                {matchScore}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${matchScore}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {program.phone && (
              <a
                href={`tel:${program.phone}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium no-underline hover:bg-primary-500 transition-colors"
              >
                Call
              </a>
            )}
            {program.website && (
              <a
                href={program.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3.5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium no-underline hover:bg-gray-50 transition-colors"
              >
                Website
              </a>
            )}
            {program.application_url && (
              <a
                href={program.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3.5 py-2 border border-primary-300 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium no-underline hover:bg-primary-100 transition-colors"
              >
                Apply Online
              </a>
            )}
            {onSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                className={`ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isSaved
                    ? "bg-primary-600 text-white border border-primary-600"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isSaved ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                ) : (
                  "Save"
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
