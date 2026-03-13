"use client";

import { CARE_PREFERENCES } from "@/lib/types/benefits";
import type { BenefitsIntakeAnswers, BenefitMatch } from "@/lib/types/benefits";
import { getEstimatedSavings } from "@/lib/types/benefits";

interface BenefitsReportHeaderProps {
  programCount: number;
  answers: BenefitsIntakeAnswers;
  locationDisplay: string;
  matchedPrograms: BenefitMatch[];
  /** User's display name (first name) — null for anonymous */
  userName: string | null;
  onShare: () => void;
  shareLabel: "share" | "copied";
}

export default function BenefitsReportHeader({
  programCount,
  answers,
  locationDisplay,
  matchedPrograms,
  userName,
  onShare,
  shareLabel,
}: BenefitsReportHeaderProps) {
  // Build profile summary
  const parts: string[] = [];
  if (answers.age) parts.push(`age ${answers.age}`);
  if (locationDisplay) parts.push(locationDisplay);
  if (answers.carePreference && answers.carePreference !== "unsure") {
    const pref = CARE_PREFERENCES[answers.carePreference];
    parts.push(pref.displayTitle.toLowerCase());
  }
  const profileSummary = parts.length > 0 ? parts.join(", ") : null;

  // Compute total estimated savings (folded into subtitle)
  let totalMonthly = 0;
  for (const m of matchedPrograms) {
    const s = getEstimatedSavings(m.program.name);
    if (s) totalMonthly += s.monthly;
  }

  const title = userName
    ? `Great news, ${userName}`
    : "Great news";

  return (
    <div className="mb-10 print:mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-display-sm font-medium text-gray-900 mb-2 leading-snug tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {profileSummary && <>{profileSummary} &mdash; </>}
            you may qualify for <strong className="text-gray-700">{programCount} program{programCount !== 1 ? "s" : ""}</strong>
            {totalMonthly > 0 && (
              <> worth an estimated <strong className="text-gray-700">${totalMonthly.toLocaleString()}/mo</strong></>
            )}
            .
          </p>
        </div>

        {/* Quiet utility actions */}
        <div className="flex items-center gap-1 shrink-0 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-xs font-medium text-gray-300 hover:text-gray-600 bg-transparent border-none cursor-pointer transition-colors"
            aria-label="Print results"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 3.75H5.25" />
            </svg>
            Print
          </button>
          <button
            onClick={onShare}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-xs font-medium text-gray-300 hover:text-gray-600 bg-transparent border-none cursor-pointer transition-colors"
            aria-label="Share results"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {shareLabel === "copied" ? "Copied!" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
