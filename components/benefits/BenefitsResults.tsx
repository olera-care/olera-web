"use client";

import { useState } from "react";
import { BENEFIT_CATEGORIES } from "@/lib/types/benefits";
import type {
  BenefitsSearchResult,
  BenefitCategory,
  BenefitMatch,
} from "@/lib/types/benefits";
import { useCareProfile } from "@/lib/benefits/care-profile-context";
import { useSavedPrograms } from "@/hooks/use-saved-programs";
import AAACard from "./AAACard";
import ProgramCard from "./ProgramCard";

interface BenefitsResultsProps {
  result: BenefitsSearchResult;
}

function generateShareText(
  matchedPrograms: BenefitMatch[],
  stateCode: string | null,
  age: number | null
) {
  const locationPart = stateCode ? ` in ${stateCode}` : "";
  const agePart = age ? `, for someone ${age} years old` : "";
  const header = `Your Benefits Results — ${matchedPrograms.length} program${matchedPrograms.length !== 1 ? "s" : ""} found${locationPart}${agePart}`;

  // Group by category
  const grouped = matchedPrograms.reduce<Record<string, BenefitMatch[]>>(
    (acc, m) => {
      const cat = m.program.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    },
    {}
  );

  const sections = Object.entries(grouped)
    .map(([cat, programs]) => {
      const catInfo = BENEFIT_CATEGORIES[cat as BenefitCategory];
      const lines = programs.map((m) => {
        const name = m.program.short_name || m.program.name;
        const topReason = m.matchReasons[0] || "";
        return `  - ${name} (${m.tierLabel})${topReason ? ` — ${topReason}` : ""}`;
      });
      return `${catInfo?.displayTitle}\n${lines.join("\n")}`;
    })
    .join("\n\n");

  return `${header}\n\n${sections}\n\nFound with Olera Benefits Finder\nhttps://olera.care/benefits/finder`;
}

export default function BenefitsResults({ result }: BenefitsResultsProps) {
  const [activeFilter, setActiveFilter] = useState<BenefitCategory | "all">(
    "all"
  );
  const [shareLabel, setShareLabel] = useState<"share" | "copied">("share");
  const { reset, answers } = useCareProfile();
  const { isSaved, toggle } = useSavedPrograms();

  const { matchedPrograms, localAAA } = result;

  // Unique categories present in results
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

  async function handleShare() {
    const text = generateShareText(matchedPrograms, answers.stateCode, answers.age);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareLabel("copied");
      setTimeout(() => setShareLabel("share"), 2000);
    } catch {
      // Clipboard not available
    }
  }

  // Empty state
  if (matchedPrograms.length === 0 && !localAAA) {
    return (
      <div className="py-16">
        <p className="font-display text-display-xs font-medium text-gray-900 mb-2">
          No matching programs found
        </p>
        <p className="text-text-sm text-gray-500 mb-8 max-w-md">
          Try adjusting your answers, or contact your local Area Agency on Aging
          for personalized help.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-text-sm font-medium border-none cursor-pointer hover:bg-gray-800 transition-colors"
        >
          Try different answers
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header — serif with match count + share */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-display-sm font-medium text-gray-900 mb-1 leading-snug tracking-tight">
            {matchedPrograms.length} program{matchedPrograms.length !== 1 ? "s" : ""} matched
          </h2>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-text-sm font-medium text-gray-400 hover:text-gray-900 bg-transparent border-none cursor-pointer transition-colors shrink-0"
            aria-label="Share results"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {shareLabel === "copied" ? "Copied!" : "Share results"}
          </button>
        </div>
        <p className="text-text-sm text-gray-400">
          Based on your care profile
        </p>
      </div>

      {/* AAA card */}
      {localAAA && (
        <div className="mb-10">
          <AAACard agency={localAAA} />
        </div>
      )}

      {/* Filter tabs — quiet, text-style */}
      {presentCategories.length > 1 && (
        <div
          className="flex items-center gap-1 mb-6 border-b border-vanilla-200 -mx-1 px-1"
          role="toolbar"
          aria-label="Filter by category"
        >
          <button
            onClick={() => setActiveFilter("all")}
            aria-pressed={activeFilter === "all"}
            className={`px-3 py-2.5 text-text-sm font-medium border-none cursor-pointer transition-colors bg-transparent -mb-px ${
              activeFilter === "all"
                ? "text-gray-900 border-b-2 border-b-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
            style={activeFilter === "all" ? { borderBottom: "2px solid #111827" } : {}}
          >
            All
          </button>
          {presentCategories.map((cat) => {
            const info = BENEFIT_CATEGORIES[cat];
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                aria-pressed={isActive}
                className={`px-3 py-2.5 text-text-sm font-medium border-none cursor-pointer transition-colors bg-transparent -mb-px ${
                  isActive
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                style={isActive ? { borderBottom: "2px solid #111827" } : {}}
              >
                {info?.displayTitle}
              </button>
            );
          })}
        </div>
      )}

      {/* Program list — single column, divided by category */}
      {Object.entries(grouped).map(([cat, programs]) => {
        const info = BENEFIT_CATEGORIES[cat as BenefitCategory];
        return (
          <div key={cat} className="mb-8">
            <p className="text-text-xs font-medium text-gray-400 mb-1 tracking-widest uppercase">
              {info?.displayTitle}
            </p>
            <div>
              {programs.map((m, i) => (
                <div
                  key={m.id}
                  className="animate-card-enter"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <ProgramCard
                    match={m}
                    isSaved={isSaved(m.program.id)}
                    onToggleSave={() => toggle(m.program.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
