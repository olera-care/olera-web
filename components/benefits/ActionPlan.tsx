"use client";

import type { BenefitMatch } from "@/lib/types/benefits";
import { getSavingsRange } from "@/lib/types/benefits";

interface ActionPlanProps {
  matchedPrograms: BenefitMatch[];
}

export default function ActionPlan({ matchedPrograms }: ActionPlanProps) {
  // Take top 5 programs sorted by score (already sorted from API)
  const topPrograms = matchedPrograms.slice(0, 5);

  if (topPrograms.length <= 1) return null; // Not useful for 1 program

  return (
    <div className="mb-10 print:mb-6">
      <h3 className="font-display text-display-xs font-medium text-gray-900 mb-1">
        Your Action Plan
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Start with the highest-value programs first.
      </p>

      <div className="space-y-3">
        {topPrograms.map((m, i) => {
          const { program } = m;
          const savings = getSavingsRange(program.name);
          const isFirst = i === 0;

          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                isFirst
                  ? "border-primary-200 bg-primary-50/40"
                  : "border-gray-100 bg-white"
              }`}
            >
              {/* Step number */}
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                  isFirst
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">
                    {program.short_name || program.name}
                  </p>
                  {isFirst && (
                    <span className="text-[11px] font-semibold text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">
                      Start Here
                    </span>
                  )}
                  {savings && (
                    <span className="text-[11px] text-emerald-700">
                      ~${savings.low.toLocaleString()}&ndash;${savings.high.toLocaleString()}/mo
                    </span>
                  )}
                </div>

                {/* One-line instruction */}
                <p className="text-xs text-gray-500 mt-0.5">
                  {program.phone
                    ? `Call ${program.phone}`
                    : program.application_url
                      ? "Apply online"
                      : program.website
                        ? "Visit website for details"
                        : "Contact your local agency"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
