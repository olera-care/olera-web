"use client";

import type { BenefitMatch, AreaAgency } from "@/lib/types/benefits";

interface RecommendedFirstStepProps {
  /** The highest-scored program match */
  topMatch: BenefitMatch;
  /** Local Area Agency on Aging, if available */
  localAAA: AreaAgency | null;
}

export default function RecommendedFirstStep({ topMatch, localAAA }: RecommendedFirstStepProps) {
  // Show local AAA as the first step when available — they help navigate all programs
  // Fall back to the top program if no AAA found
  const showAAA = localAAA && localAAA.phone;

  const title = showAAA ? "Benefits Check-Up" : (topMatch.program.short_name || topMatch.program.name);
  const description = showAAA
    ? `Free one-on-one help to find and apply for all the benefits programs you may qualify for. Available through your local ${localAAA.name}.`
    : topMatch.program.description;
  const phone = showAAA ? localAAA.phone : topMatch.program.phone;
  const website = showAAA ? localAAA.website : (topMatch.program.application_url || topMatch.program.website);
  const whatToSay = showAAA
    ? "I\u2019m looking for help finding benefits programs I might qualify for. Can I schedule an appointment with a benefits counselor?"
    : topMatch.program.what_to_say;

  return (
    <div className="mb-12">
      <p className="text-xs font-medium text-gray-400 mb-4 tracking-widest uppercase">
        Recommended first step
      </p>

      <div className="border border-gray-200 rounded-2xl p-6 lg:p-8">
        <h3 className="font-display text-display-xs font-medium text-gray-900 mb-1">
          {title}
        </h3>

        <p className="text-sm text-gray-500 mb-5 leading-relaxed max-w-xl">
          {description}
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
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-[44px] px-3 text-sm font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
            >
              Visit website
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
