"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { WaiverProgram } from "@/data/waiver-library";

function getMaxSavings(savingsRange: string): number {
  const match = savingsRange.match(/\$[\d,]+/g);
  if (!match) return 0;
  const last = match[match.length - 1];
  return parseInt(last.replace(/[$,]/g, ""), 10);
}

const FEDERAL_KEYWORDS = [
  "snap", "calfresh", "liheap", "energy assistance", "weatherization",
  "ssi", "ssp", "medicare savings", "medicare patrol", "hicap", "ship",
  "ombudsman", "family caregiver", "scsep", "home-delivered meals",
  "congregate meals", "senior legal", "pace",
];

function isFederalProgram(program: WaiverProgram): boolean {
  const text = `${program.name} ${program.id}`.toLowerCase();
  return FEDERAL_KEYWORDS.some((kw) => text.includes(kw));
}

interface ProgramListProps {
  programs: WaiverProgram[];
  stateId: string;
}

type SortOption = "savings" | "easiest" | "state" | "federal";

const SORT_OPTIONS: { value: SortOption; label: string; description: string }[] = [
  { value: "savings", label: "Highest Savings", description: "Biggest potential savings first" },
  { value: "easiest", label: "Easiest to Apply", description: "Fewest application steps first" },
  { value: "state", label: "State Programs First", description: "State-specific programs on top" },
  { value: "federal", label: "Federal Programs First", description: "Federal programs on top" },
];

export function ProgramList({ programs, stateId }: ProgramListProps) {
  const [sort, setSort] = useState<SortOption>("savings");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sorted = [...programs].sort((a, b) => {
    switch (sort) {
      case "savings":
        return getMaxSavings(b.savingsRange) - getMaxSavings(a.savingsRange);
      case "easiest":
        return a.applicationSteps.length - b.applicationSteps.length;
      case "state":
        return (isFederalProgram(a) ? 1 : 0) - (isFederalProgram(b) ? 1 : 0);
      case "federal":
        return (isFederalProgram(b) ? 1 : 0) - (isFederalProgram(a) ? 1 : 0);
      default:
        return 0;
    }
  });

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Available Programs</h2>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {currentLabel}
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setSort(option.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-vanilla-50 transition-colors ${
                    sort === option.value ? "bg-vanilla-100" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${sort === option.value ? "text-primary-600" : "text-gray-900"}`}>
                      {option.label}
                    </span>
                    {sort === option.value && (
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {sorted.length <= 5 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((program) => {
            const federal = isFederalProgram(program);
            return (
              <div
                key={program.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 p-6 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    federal ? "bg-secondary-100 text-secondary-700" : "bg-primary-100 text-primary-700"
                  }`}>
                    {federal ? "Federal" : "State"}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-snug">
                  {program.name}
                </h3>
                {program.savingsRange && (
                  <p className="mt-1 text-sm font-bold text-primary-600">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold mr-1">$</span>Save {program.savingsRange}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-600 flex-1">{program.tagline}</p>

                {program.eligibilityHighlights.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {program.eligibilityHighlights.slice(0, 3).map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <svg
                          className="w-4 h-4 text-success-500 mt-0.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5">
                  <Link
                    href={`/waiver-library/${stateId}/${program.id}`}
                    className="inline-flex items-center text-primary-600 font-medium text-sm hover:text-primary-500 transition-colors"
                  >
                    Learn more
                    <svg
                      className="ml-1 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {sorted.map((program) => {
            const federal = isFederalProgram(program);
            return (
              <div
                key={program.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-6 py-4 hover:bg-vanilla-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
                        federal ? "bg-secondary-100 text-secondary-700" : "bg-primary-100 text-primary-700"
                      }`}>
                        {federal ? "Federal" : "State"}
                      </span>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {program.name}
                      </h3>
                    </div>
                    {program.savingsRange && (
                      <span className="text-sm font-semibold text-primary-600 shrink-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold mr-1">$</span>Save {program.savingsRange}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
                    {program.tagline}
                  </p>
                </div>
                <Link
                  href={`/waiver-library/${stateId}/${program.id}`}
                  className="shrink-0 inline-flex items-center text-primary-600 font-medium text-sm hover:text-primary-500 transition-colors"
                >
                  Learn more
                  <svg
                    className="ml-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
