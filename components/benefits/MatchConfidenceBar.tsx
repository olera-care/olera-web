"use client";

import type { BenefitMatch } from "@/lib/types/benefits";

interface MatchConfidenceBarProps {
  score: number;
  tierLabel: BenefitMatch["tierLabel"];
}

export default function MatchConfidenceBar({ score, tierLabel }: MatchConfidenceBarProps) {
  const colorClass =
    score >= 75
      ? "bg-emerald-500"
      : score >= 50
        ? "bg-amber-400"
        : "bg-gray-300";

  const labelColor =
    score >= 75
      ? "text-emerald-700"
      : score >= 50
        ? "text-amber-700"
        : "text-gray-500";

  return (
    <div className="flex items-center gap-2.5 w-full">
      {/* Bar */}
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      {/* Label only — no percentage */}
      <span className={`text-xs font-medium whitespace-nowrap ${labelColor}`}>
        {tierLabel}
      </span>
    </div>
  );
}
