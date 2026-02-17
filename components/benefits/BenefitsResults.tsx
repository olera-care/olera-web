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

  return (
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

      {/* AAA Card — featured first */}
      {localAAA && <AAACard agency={localAAA} />}

      {/* Category filter chips */}
      {presentCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setActiveFilter("all")}
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

      {/* Program cards grouped by category */}
      {Object.entries(grouped).map(([cat, programs]) => {
        const info = BENEFIT_CATEGORIES[cat as BenefitCategory];
        return (
          <div key={cat} className="mb-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {info?.icon} {info?.displayTitle}
            </h3>
            {programs.map((m) => (
              <ProgramCard
                key={m.id}
                match={m}
                isSaved={isBenefitSaved(m.program.name)}
                onSave={() => saveBenefit(m.program.name)}
              />
            ))}
          </div>
        );
      })}

      {/* Start over */}
      <div className="text-center mt-6 pb-4">
        <button
          onClick={onStartOver}
          className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-none font-medium transition-colors"
        >
          &larr; Start over with different answers
        </button>
      </div>
    </div>
  );
}
