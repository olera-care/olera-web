"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, MagnifyingGlass, Coin, Heart } from "@phosphor-icons/react";

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

  return (
    <div className="rounded-2xl bg-vanilla-200/40 border border-vanilla-300/40 p-6 md:p-8">
      {/* ── Step 1: The Hook ── */}
      <div className="flex items-start gap-3 mb-5">
        <Heart className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" weight="duotone" />
        <div>
          <p className="text-xl font-bold text-gray-900">
            {stateName} families save on care
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Programs that could help cover services like {providerName}&apos;s
          </p>
        </div>
      </div>

      {/* Top programs by savings */}
      <div className="space-y-3 mb-6">
        {topPrograms.map((p) => (
          <Link
            key={p.id}
            href={programUrl(stateId, p.id)}
            className="flex items-center justify-between gap-4 rounded-xl bg-white border border-vanilla-300/50 px-4 py-3 hover:border-primary-200 hover:shadow-sm transition-all group"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
                {p.shortName || p.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {p.tagline}
              </p>
            </div>
            {p.savingsRange && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Coin className="w-4 h-4 text-amber-500" weight="duotone" />
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {p.savingsRange}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* ── Step 2: The Screener ── */}
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

          {/* ── Step 3: Results ── */}
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
