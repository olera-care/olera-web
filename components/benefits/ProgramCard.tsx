"use client";

import { useState } from "react";
import type { BenefitMatch } from "@/lib/types/benefits";

interface ProgramCardProps {
  match: BenefitMatch;
}

export default function ProgramCard({ match }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { program, matchScore, matchReasons, tierLabel } = match;

  const previewReasons = matchReasons.slice(0, 2);
  const hasMoreReasons = matchReasons.length > 2;

  return (
    <div className="border-b border-vanilla-200 last:border-b-0">
      {/* Clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full py-5 text-left cursor-pointer bg-transparent border-none group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Program name — hero element */}
            <h4 className="font-display text-lg font-medium text-gray-900 mb-1 leading-snug">
              {program.short_name || program.name}
            </h4>

            {/* Tier + score as quiet metadata */}
            <p className="text-text-xs text-gray-400 mb-3">
              {tierLabel} · {matchScore}% match
            </p>

            {/* Top reasons */}
            <div className="space-y-1">
              {previewReasons.map((r, i) => (
                <p key={i} className="text-text-sm text-gray-500 flex items-start gap-2">
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
          </div>

          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-gray-300 shrink-0 mt-1 transition-transform duration-200 group-hover:text-gray-500 ${
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
        </div>
      </button>

      {/* Expanded detail */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-expand" : "grid-rows-collapse"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-6">
            {/* Description */}
            <p className="text-text-sm text-gray-600 leading-relaxed mb-4">
              {program.description}
            </p>

            {/* All match reasons */}
            {hasMoreReasons && (
              <div className="mb-4">
                <p className="text-text-xs font-medium text-gray-400 mb-2 tracking-wide uppercase">
                  Why you qualify
                </p>
                <ul className="list-none p-0 m-0 space-y-1">
                  {matchReasons.map((r, i) => (
                    <li
                      key={i}
                      className="text-text-sm text-gray-500 flex items-start gap-2"
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
                <p className="text-text-xs font-medium text-gray-400 mb-1.5">
                  What to say when you call
                </p>
                <p className="text-text-sm text-gray-600 italic leading-relaxed">
                  &ldquo;{program.what_to_say}&rdquo;
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {program.phone && (
                <a
                  href={`tel:${program.phone}`}
                  aria-label={`Call ${program.short_name || program.name}`}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-full text-text-sm font-medium no-underline hover:bg-gray-800 transition-colors"
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
                  className="text-text-sm font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
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
                  className="text-text-sm font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
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
