"use client";

import { useState, useEffect, useRef } from "react";
import { BENEFIT_CATEGORIES } from "@/lib/types/benefits";
import type {
  BenefitsSearchResult,
  BenefitsIntakeAnswers,
  BenefitCategory,
  BenefitMatch,
} from "@/lib/types/benefits";
import AAACard from "./AAACard";
import ProgramCard from "./ProgramCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { syncBenefitsToProfile } from "@/lib/benefits-profile-sync";
import { useSavedBenefits } from "@/hooks/use-saved-benefits";

interface BenefitsResultsProps {
  result: BenefitsSearchResult;
  intakeAnswers: BenefitsIntakeAnswers | null;
  locationDisplay: string;
  onStartOver: () => void;
}

export default function BenefitsResults({
  result,
  intakeAnswers,
  locationDisplay,
  onStartOver,
}: BenefitsResultsProps) {
  const [activeFilter, setActiveFilter] = useState<BenefitCategory | "all">(
    "all"
  );
  const { activeProfile } = useAuth();
  const { isBenefitSaved, saveBenefit } = useSavedBenefits();
  const syncedRef = useRef(false);

  // Silently sync intake answers to profile (once, for logged-in users)
  useEffect(() => {
    if (syncedRef.current || !intakeAnswers || !activeProfile) return;
    syncedRef.current = true;
    syncBenefitsToProfile(intakeAnswers, locationDisplay, activeProfile.id);
  }, [intakeAnswers, locationDisplay, activeProfile]);

  const { matchedPrograms, localAAA } = result;

  // Get unique categories present in the results
  const presentCategories = Array.from(
    new Set(matchedPrograms.map((m) => m.program.category))
  );

  // Filter programs by selected category
  const filteredPrograms =
    activeFilter === "all"
      ? matchedPrograms
      : matchedPrograms.filter((m) => m.program.category === activeFilter);

  // Group filtered programs by category
  const grouped = filteredPrograms.reduce<Record<string, BenefitMatch[]>>(
    (acc, m) => {
      const cat = m.program.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    },
    {}
  );

  if (matchedPrograms.length === 0 && !localAAA) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-semibold text-gray-700 mb-2">
          We couldn&apos;t find matching programs
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Try adjusting your answers, or contact your local Area Agency on Aging
          for personalized help.
        </p>
        <button
          onClick={onStartOver}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:bg-primary-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Build browse link with location from intake
  const browseHref = locationDisplay
    ? `/browse?location=${encodeURIComponent(locationDisplay)}`
    : "/browse";

  return (
    <>
    <div className="w-full">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Your Benefits Results
        </h2>
        <p className="text-sm text-gray-600">
          Based on your answers, here are programs you may qualify for.
        </p>
      </div>

      {/* Category filter chips */}
      {presentCategories.length > 1 && (
        <div className="inline-flex flex-wrap gap-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 mb-4">
          <button
            onClick={() => setActiveFilter("all")}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFilter === "all"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
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
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeFilter === cat
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {info?.icon} {info?.displayTitle} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Program cards grouped by category, with AAA card after 3rd card */}
      {(() => {
        // Flatten all grouped cards into a sequential list
        const allCards: { cat: string; match: BenefitMatch; isFirst: boolean }[] = [];
        Object.entries(grouped).forEach(([cat, programs]) => {
          programs.forEach((m, i) => {
            allCards.push({ cat, match: m, isFirst: i === 0 });
          });
        });

        let aaaInserted = false;
        const insertIndex = Math.min(3, allCards.length);

        return (
          <>
            {allCards.map((card, idx) => {
              const info = BENEFIT_CATEGORIES[card.cat as BenefitCategory];
              const showAAA = localAAA && !aaaInserted && idx === insertIndex;
              if (showAAA) aaaInserted = true;

              return (
                <div key={card.match.id}>
                  {showAAA && <AAACard agency={localAAA} />}
                  {card.isFirst && (
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-5">
                      {info?.icon} {info?.displayTitle}
                    </h3>
                  )}
                  <ProgramCard
                    match={card.match}
                    isSaved={isBenefitSaved(card.match.program.name)}
                    onSave={() => saveBenefit(card.match.program.name)}
                  />
                </div>
              );
            })}
            {/* AAA card at end if fewer than 3 cards */}
            {localAAA && !aaaInserted && <AAACard agency={localAAA} />}
          </>
        );
      })()}

      {/* Start over */}
      <div className="text-center mt-6 pb-20">
        <button
          onClick={onStartOver}
          className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-none font-medium transition-colors"
        >
          &larr; Start over with different answers
        </button>
      </div>
    </div>

    {/* Sticky footer */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] z-50">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">What&apos;s next?</p>
          <p className="text-xs text-gray-500">
            You qualify for {matchedPrograms.length} programs. Take the next step.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={browseHref}
            className="inline-flex items-center gap-1 px-3.5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium no-underline hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Find providers &rarr;
          </a>
          <a
            href="/portal/matches?tab=carepost"
            className="inline-flex items-center gap-1 px-3.5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium no-underline hover:bg-primary-500 transition-colors whitespace-nowrap"
          >
            Let providers find you
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
