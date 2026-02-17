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
  completedAt?: string | null;
}

export default function BenefitsResults({
  result,
  intakeAnswers,
  locationDisplay,
  onStartOver,
  completedAt,
}: BenefitsResultsProps) {
  const [activeFilter, setActiveFilter] = useState<BenefitCategory | "all">(
    "all"
  );
  const { user, activeProfile, openAuth } = useAuth();
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

  // Map intake care preference + needs to browse page care type param
  const getBrowseCareType = (): string | null => {
    if (!intakeAnswers) return null;
    const needs = intakeAnswers.primaryNeeds || [];
    if (needs.includes("memoryCare")) return "memory-care";
    if (needs.includes("healthManagement")) return "home-health";
    if (intakeAnswers.carePreference === "exploringFacility") return "assisted-living";
    if (needs.includes("personalCare") || needs.includes("householdTasks") || needs.includes("companionship"))
      return "home-care";
    return null;
  };

  // Build browse link with location and care type from intake
  const browseParams = new URLSearchParams();
  if (locationDisplay) browseParams.set("location", locationDisplay);
  const careType = getBrowseCareType();
  if (careType) browseParams.set("type", careType);
  const browseHref = browseParams.toString() ? `/browse?${browseParams}` : "/browse";

  // Auth-gated handler for "Let providers find you"
  const handleLetProvidersFind = () => {
    if (!user) {
      openAuth({
        defaultMode: "sign-up",
        intent: "family",
        deferred: {
          action: "create_profile" as const,
          returnUrl: "/portal/matches?tab=carepost",
        },
      });
      return;
    }
    window.location.href = "/portal/matches?tab=carepost";
  };

  return (
    <>
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Your Benefits Results
        </h2>
        <p className="text-sm text-gray-600">
          Based on your answers, here are programs you may qualify for.
        </p>
        {completedAt && (
          <p className="text-xs text-gray-400 mt-1.5">
            Based on your answers from{" "}
            {new Date(completedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {" · "}
            <button
              type="button"
              onClick={onStartOver}
              className="text-primary-600 hover:text-primary-700 font-medium bg-transparent border-none cursor-pointer p-0 transition-colors"
            >
              Update your answers
            </button>
          </p>
        )}
      </div>

      {/* Category filter chips — horizontal scroll for narrow layout */}
      {presentCategories.length > 1 && (
        <div className="overflow-x-auto -mx-4 px-4 mb-4 scrollbar-hide">
          <div className="flex gap-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 w-max">
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-50">
      <div className="max-w-lg mx-auto px-5 py-4">
        <p className="text-base font-bold text-gray-900 mb-0.5">
          What&apos;s next?
        </p>
        <p className="text-sm text-gray-500 mb-3">
          You qualify for {matchedPrograms.length} programs. Take the next step.
        </p>
        <div className="flex gap-3">
          <a
            href={browseHref}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-sm font-semibold no-underline hover:bg-gray-50 transition-colors"
          >
            Find providers &rarr;
          </a>
          <button
            type="button"
            onClick={handleLetProvidersFind}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:bg-primary-500 transition-colors"
          >
            Let providers find you
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
