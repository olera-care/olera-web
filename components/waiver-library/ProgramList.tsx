"use client";

import { useState } from "react";
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

type Category = "financial" | "food" | "health" | "caregiver";

const CATEGORY_TABS: { value: Category; label: string }[] = [
  { value: "financial", label: "Financial Help" },
  { value: "food", label: "Food & Nutrition" },
  { value: "health", label: "Health Coverage" },
  { value: "caregiver", label: "Caregiver Support" },
];

const FOOD_KEYWORDS = [
  "snap", "food", "nutrition", "meals", "calfresh", "congregate",
  "home-delivered meals", "senior nutrition",
];
const HEALTH_KEYWORDS = [
  "medicaid", "medicare", "health", "medical", "ship", "hicap",
  "pace", "insurance", "coverage", "waiver", "hcbs",
];
const CAREGIVER_KEYWORDS = [
  "caregiver", "respite", "ombudsman", "family caregiver",
];
const FINANCIAL_KEYWORDS = [
  "ssi", "ssp", "supplemental", "energy", "liheap", "weatherization",
  "property tax", "legal", "savings program", "cash assistance",
];

function getCategory(program: WaiverProgram): Category {
  const text = `${program.name} ${program.id} ${program.tagline}`.toLowerCase();
  if (CAREGIVER_KEYWORDS.some((kw) => text.includes(kw))) return "caregiver";
  if (FOOD_KEYWORDS.some((kw) => text.includes(kw))) return "food";
  if (FINANCIAL_KEYWORDS.some((kw) => text.includes(kw))) return "financial";
  return "health";
}

function isFederalProgram(program: WaiverProgram): boolean {
  const text = `${program.name} ${program.id}`.toLowerCase();
  return FEDERAL_KEYWORDS.some((kw) => text.includes(kw));
}

interface ProgramListProps {
  programs: WaiverProgram[];
  stateId: string;
}

export function ProgramList({ programs, stateId }: ProgramListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("financial");

  const searchFiltered = search.trim()
    ? programs.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      })
    : programs;

  const filtered = searchFiltered.filter((p) => getCategory(p) === category);

  // Count programs per category (based on search-filtered list)
  const categoryCounts = CATEGORY_TABS.reduce((acc, tab) => {
    acc[tab.value] = searchFiltered.filter((p) => getCategory(p) === tab.value).length;
    return acc;
  }, {} as Record<Category, number>);

  const sorted = [...filtered].sort((a, b) =>
    getMaxSavings(b.savingsRange) - getMaxSavings(a.savingsRange)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Available Programs</h2>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs..."
            className="pl-10 pr-4 py-2.5 w-64 bg-white border border-gray-200 rounded-xl text-base text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORY_TABS.map((tab) => {
          const isActive = category === tab.value;
          const count = categoryCounts[tab.value];
          return (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={`px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center ml-2 w-6 h-6 rounded-full text-xs font-bold ${
                isActive
                  ? "bg-white text-primary-600"
                  : "bg-primary-100 text-primary-800"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No programs found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((program) => {
            const federal = isFederalProgram(program);
            return (
              <div
                key={program.id}
                className="bg-white rounded-xl shadow-lg border border-gray-300 transition-all duration-200 p-6 flex flex-col"
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
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-success-50 border border-success-200 shrink-0 mt-0.5">
                          <svg
                            className="w-3 h-3 text-success-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5">
                  <Link
                    href={`/waiver-library/${stateId}/${program.id}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 text-base font-semibold text-primary-600 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors"
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
      )}
    </div>
  );
}
