"use client";

import { useState } from "react";
import { BENEFIT_CATEGORIES } from "@/lib/types/benefits";
import type {
  BenefitsSearchResult,
  BenefitCategory,
  BenefitMatch,
} from "@/lib/types/benefits";
import { useCareProfile } from "@/lib/benefits/care-profile-context";
import AAACard from "./AAACard";
import ProgramCard from "./ProgramCard";

interface BenefitsResultsProps {
  result: BenefitsSearchResult;
}

export default function BenefitsResults({ result }: BenefitsResultsProps) {
  const [activeFilter, setActiveFilter] = useState<BenefitCategory | "all">(
    "all"
  );
  const { reset } = useCareProfile();

  const { matchedPrograms, localAAA } = result;

  // Unique categories in results
  const presentCategories = Array.from(
    new Set(matchedPrograms.map((m) => m.program.category))
  );

  // Filter + group
  const filteredPrograms =
    activeFilter === "all"
      ? matchedPrograms
      : matchedPrograms.filter((m) => m.program.category === activeFilter);

  const grouped = filteredPrograms.reduce<Record<string, BenefitMatch[]>>(
    (acc, m) => {
      const cat = m.program.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    },
    {}
  );

  // Stats
  const topMatchCount = matchedPrograms.filter(
    (m) => m.tierLabel === "Top Match"
  ).length;

  // Empty state
  if (matchedPrograms.length === 0 && !localAAA) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-700 mb-2">
          No matching programs found
        </p>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Try adjusting your answers, or contact your local Area Agency on Aging
          for personalized help.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:bg-primary-500 transition-colors min-h-[44px]"
        >
          Try Different Answers
        </button>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Results header + stats */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Your Benefits Results
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
            {matchedPrograms.length} program{matchedPrograms.length !== 1 ? "s" : ""}
          </span>
          {topMatchCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              {topMatchCount} top match{topMatchCount !== 1 ? "es" : ""}
            </span>
          )}
          {presentCategories.length > 0 && (
            <span className="text-sm text-gray-500">
              across {presentCategories.length} categor{presentCategories.length !== 1 ? "ies" : "y"}
            </span>
          )}
        </div>
      </div>

      {/* AAA — promoted banner */}
      {localAAA && (
        <div className="mb-6">
          <AAACard agency={localAAA} />
        </div>
      )}

      {/* Category filter chips */}
      {presentCategories.length > 1 && (
        <div
          className="flex flex-wrap gap-1.5 mb-5 sticky top-[72px] bg-gray-50 py-2 -mx-1 px-1 z-10"
          role="toolbar"
          aria-label="Filter by category"
        >
          <button
            onClick={() => setActiveFilter("all")}
            aria-pressed={activeFilter === "all"}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
              activeFilter === "all"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            All ({matchedPrograms.length})
          </button>
          {presentCategories.map((cat) => {
            const info = BENEFIT_CATEGORIES[cat];
            const count = matchedPrograms.filter(
              (m) => m.program.category === cat
            ).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                aria-pressed={activeFilter === cat}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                  activeFilter === cat
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {info?.icon} {info?.displayTitle} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Program cards — grouped by category, responsive grid */}
      {Object.entries(grouped).map(([cat, programs]) => {
        const info = BENEFIT_CATEGORIES[cat as BenefitCategory];
        return (
          <div key={cat} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>{info?.icon}</span>
              {info?.displayTitle}
              <span className="text-gray-400 font-normal normal-case tracking-normal">
                ({programs.length})
              </span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {programs.map((m, i) => (
                <div
                  key={m.id}
                  className="animate-card-enter"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <ProgramCard match={m} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
