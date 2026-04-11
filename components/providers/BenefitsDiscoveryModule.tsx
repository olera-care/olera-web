"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";

/** Minimal program shape passed from server — keeps client bundle small */
export interface BenefitsProgram {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  savingsRange?: string;
  programType?: string;
  structuredEligibility?: {
    ageRequirement?: string;
  };
}

interface BenefitsDiscoveryModuleProps {
  providerName: string;
  stateId: string;       // slug (e.g., "texas")
  stateName: string;     // display (e.g., "Texas")
  topPrograms: BenefitsProgram[];   // Top 3 by savings
  allPrograms: BenefitsProgram[];   // All programs for screener
}

/** Build the correct benefits URL for a state — Texas uses parallel routes */
function benefitsUrl(stateId: string): string {
  if (stateId === "texas") return "/texas/benefits";
  return `/senior-benefits/${stateId}`;
}

function programUrl(stateId: string, programId: string): string {
  if (stateId === "texas") return `/texas/benefits/${programId}`;
  return `/senior-benefits/${stateId}/${programId}`;
}

/** Extract the upper-bound dollar amount for display: "$20,000 – $50,000/year in 2026" → "$50,000" */
function extractTopSavings(savingsRange?: string): string | null {
  if (!savingsRange) return null;
  const matches = savingsRange.match(/\$[\d,]+/g);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1];
}

/** Shorten savings for compact display: "$20,000 – $50,000/year in 2026" → "Up to $50,000/yr" */
function shortSavings(savingsRange?: string): string | null {
  const top = extractTopSavings(savingsRange);
  if (!top) return null;
  return `Up to ${top}/yr`;
}

export default function BenefitsDiscoveryModule({
  providerName,
  stateId,
  stateName,
  topPrograms,
  allPrograms,
}: BenefitsDiscoveryModuleProps) {
  const [showScreener, setShowScreener] = useState(false);
  const [age, setAge] = useState("");
  const [medicaid, setMedicaid] = useState<"yes" | "no" | "not-sure" | "">("");
  const [submitted, setSubmitted] = useState(false);

  // Screener matching (same logic as InlineBenefitsCheck)
  const matchingPrograms = useMemo(() => {
    if (!submitted || (!age && !medicaid)) return [];
    return allPrograms.filter((p) => {
      const ageNum = parseInt(age);

      // Age check
      if (ageNum && p.structuredEligibility?.ageRequirement) {
        const ageReq = parseInt(p.structuredEligibility.ageRequirement);
        if (ageReq && ageNum < ageReq) return false;
      }

      // Medicaid check — if "no", exclude Medicaid-dependent programs
      if (medicaid === "no") {
        const nameAndTag = `${p.name} ${p.tagline || ""}`.toLowerCase();
        if (nameAndTag.includes("medicaid") && !nameAndTag.includes("savings")) return false;
      }

      // Resources/navigators available to everyone
      if (p.programType === "resource" || p.programType === "navigator") return true;

      return true;
    });
  }, [submitted, age, medicaid, allPrograms]);

  if (topPrograms.length === 0) return null;

  const hasInput = age || medicaid;
  const heroSavings = extractTopSavings(topPrograms[0]?.savingsRange);

  return (
    <div className="rounded-2xl bg-vanilla-200/40 border border-vanilla-300/40 p-6 md:p-8">
      {/* ── The Hook: headline with number ── */}
      <p className="text-xl md:text-2xl font-bold text-gray-900 font-serif">
        {stateName} families save up to {heroSavings || "thousands"}/yr on care
      </p>
      <p className="text-sm text-gray-500 mt-1.5 mb-6">
        {allPrograms.length} programs that could help with services like {providerName}&apos;s
      </p>

      {/* Top programs — first card is hero, rest are compact */}
      <div className="space-y-2.5 mb-6">
        {topPrograms.map((p, i) => {
          const savings = shortSavings(p.savingsRange);
          const isHero = i === 0;

          return (
            <Link
              key={p.id}
              href={programUrl(stateId, p.id)}
              className={`flex items-center justify-between gap-4 rounded-xl border px-4 transition-all group ${
                isHero
                  ? "bg-white border-primary-200 py-4 shadow-sm hover:shadow-md"
                  : "bg-white border-vanilla-300/50 py-3 hover:border-primary-200 hover:shadow-sm"
              }`}
            >
              <p className={`font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate ${
                isHero ? "text-base" : "text-sm"
              }`}>
                {p.shortName || p.name}
              </p>
              {savings && (
                <span className={`font-bold whitespace-nowrap ${
                  isHero ? "text-base text-primary-700" : "text-sm text-gray-600"
                }`}>
                  {savings}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── The Screener ── */}
      {!showScreener ? (
        <button
          onClick={() => setShowScreener(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
        >
          <MagnifyingGlass className="w-4 h-4" weight="bold" />
          See which programs your family qualifies for
        </button>
      ) : (
        <div className="border-t border-vanilla-300/50 pt-5">
          <p className="text-base font-semibold text-gray-900 mb-4">Quick eligibility check</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1">
              <label htmlFor="benefits-age" className="text-sm text-gray-600 mb-1.5 block">
                Loved one&apos;s age
              </label>
              <input
                id="benefits-age"
                type="number"
                placeholder="e.g. 72"
                value={age}
                onChange={(e) => { setAge(e.target.value); setSubmitted(false); }}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-primary-300 focus:ring-1 focus:ring-primary-200 outline-none transition-colors"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="benefits-medicaid" className="text-sm text-gray-600 mb-1.5 block">
                On Medicaid?
              </label>
              <select
                id="benefits-medicaid"
                value={medicaid}
                onChange={(e) => { setMedicaid(e.target.value as typeof medicaid); setSubmitted(false); }}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-primary-300 focus:ring-1 focus:ring-primary-200 outline-none transition-colors"
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="not-sure">Not sure</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setSubmitted(true)}
                disabled={!hasInput}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  hasInput
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Check
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400">Rough estimate based on basic eligibility criteria.</p>

          {/* ── Results ── */}
          {submitted && hasInput && (
            <div className="pt-4 mt-4 border-t border-vanilla-300/50">
              <p className="text-base text-gray-700">
                Your loved one may qualify for{" "}
                <span className="font-bold text-gray-900">{matchingPrograms.length} of {allPrograms.length} programs</span>
                {" "}in {stateName}.
              </p>
              {matchingPrograms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {matchingPrograms.slice(0, 5).map((p) => (
                    <Link
                      key={p.id}
                      href={programUrl(stateId, p.id)}
                      className="text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {p.shortName}
                    </Link>
                  ))}
                  {matchingPrograms.length > 5 && (
                    <span className="text-xs text-gray-400 px-2 py-1.5">+{matchingPrograms.length - 5} more</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* View all link */}
      <div className="mt-4 pt-4 border-t border-vanilla-300/50">
        <Link
          href={benefitsUrl(stateId)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
        >
          View all {stateName} benefits programs
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
