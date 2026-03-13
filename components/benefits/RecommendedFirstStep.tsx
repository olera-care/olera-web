"use client";

import type { BenefitMatch, AreaAgency } from "@/lib/types/benefits";
import { getSavingsRange } from "@/lib/types/benefits";

interface RecommendedFirstStepProps {
  /** The highest-scored program match */
  topMatch: BenefitMatch;
  /** Local Area Agency on Aging, if available */
  localAAA: AreaAgency | null;
}

export default function RecommendedFirstStep({ topMatch, localAAA }: RecommendedFirstStepProps) {
  const { program } = topMatch;
  const savings = getSavingsRange(program.name);

  // Determine the best contact: program phone, AAA phone, or website
  const phone = program.phone || localAAA?.phone;
  const whatToSay = program.what_to_say;

  return (
    <div className="mb-12">
      <p className="text-xs font-medium text-gray-400 mb-4 tracking-widest uppercase">
        Recommended first step
      </p>

      <div className="border border-gray-200 rounded-2xl p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="font-display text-display-xs font-medium text-gray-900">
            {program.short_name || program.name}
          </h3>
          {savings && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded shrink-0">
              ${savings.low.toLocaleString()}&ndash;${savings.high.toLocaleString()}/mo
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-5 leading-relaxed max-w-xl">
          {program.description}
        </p>

        {/* What to say — the real magic */}
        {whatToSay && (
          <div className="bg-vanilla-50 rounded-xl p-4 mb-5">
            <p className="text-xs font-medium text-gray-400 mb-1.5">
              When you call, say this
            </p>
            <p className="text-sm text-gray-700 italic leading-relaxed">
              &ldquo;{whatToSay}&rdquo;
            </p>
          </div>
        )}

        {/* Primary action */}
        <div className="flex flex-wrap items-center gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-gray-900 text-white rounded-full text-sm font-medium no-underline hover:bg-gray-800 transition-colors"
            >
              Call {phone}
            </a>
          )}
          {program.application_url && (
            <a
              href={program.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-[44px] px-3 text-sm font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
            >
              Apply online &rarr;
            </a>
          )}
          {program.website && !program.application_url && (
            <a
              href={program.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-[44px] px-3 text-sm font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
            >
              Visit website &rarr;
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
