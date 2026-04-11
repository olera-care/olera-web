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
  stateId: string;
  stateName: string;
  topPrograms: BenefitsProgram[];
  allPrograms: BenefitsProgram[];
}

function benefitsUrl(stateId: string): string {
  if (stateId === "texas") return "/texas/benefits";
  return `/senior-benefits/${stateId}`;
}

function programUrl(stateId: string, programId: string): string {
  if (stateId === "texas") return `/texas/benefits/${programId}`;
  return `/senior-benefits/${stateId}/${programId}`;
}

function extractTopSavings(savingsRange?: string): string | null {
  if (!savingsRange) return null;
  const matches = savingsRange.match(/\$[\d,]+/g);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1];
}

function shortSavings(savingsRange?: string): string | null {
  const top = extractTopSavings(savingsRange);
  if (!top) return null;
  return `Up to ${top}/yr`;
}

/** Extract a short plain-language description from the tagline.
 *  Takes the first clause (before period or non-numeric comma), capped at ~55 chars. */
function plainDescription(tagline?: string): string | null {
  if (!tagline) return null;
  const firstClause = tagline.split(/\.\s|,\s(?![0-9])/)[0];
  if (firstClause.length <= 55) return firstClause;
  // Cut at last word boundary within 55 chars
  const trimmed = firstClause.slice(0, 55);
  const lastSpace = trimmed.lastIndexOf(" ");
  return lastSpace > 20 ? trimmed.slice(0, lastSpace) : trimmed;
}

export default function BenefitsDiscoveryModule({
  stateId,
  stateName,
  topPrograms,
  allPrograms,
}: BenefitsDiscoveryModuleProps) {
  const [showScreener, setShowScreener] = useState(false);
  const [age, setAge] = useState("");
  const [medicaid, setMedicaid] = useState<"yes" | "no" | "not-sure" | "">("");
  const [submitted, setSubmitted] = useState(false);

  const matchingPrograms = useMemo(() => {
    if (!submitted || (!age && !medicaid)) return [];
    return allPrograms.filter((p) => {
      const ageNum = parseInt(age);
      if (ageNum && p.structuredEligibility?.ageRequirement) {
        const ageReq = parseInt(p.structuredEligibility.ageRequirement);
        if (ageReq && ageNum < ageReq) return false;
      }
      if (medicaid === "no") {
        const nameAndTag = `${p.name} ${p.tagline || ""}`.toLowerCase();
        if (nameAndTag.includes("medicaid") && !nameAndTag.includes("savings")) return false;
      }
      if (p.programType === "resource" || p.programType === "navigator") return true;
      return true;
    });
  }, [submitted, age, medicaid, allPrograms]);

  if (topPrograms.length === 0) return null;

  const hasInput = age || medicaid;
  const heroSavings = extractTopSavings(topPrograms[0]?.savingsRange);

  return (
    <div>
      {/* ── Headline — like "Families are asking" ── */}
      <h2 className="text-2xl font-bold text-gray-900 font-display">
        Your family may qualify for help
      </h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        {stateName} has {allPrograms.length} programs — families save up to {heroSavings || "thousands"}/yr
      </p>

      {/* ── Program rows ── */}
      <div className="space-y-2 mb-6">
        {topPrograms.map((p) => {
          const savings = shortSavings(p.savingsRange);
          const desc = plainDescription(p.tagline);
          return (
            <Link
              key={p.id}
              href={programUrl(stateId, p.id)}
              className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 hover:bg-gray-100 px-4 py-3.5 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 truncate">
                  {p.shortName || p.name}
                </p>
                {desc && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>
                )}
              </div>
              <span className="flex items-center gap-2 shrink-0">
                {savings && (
                  <span className="text-sm text-gray-500">{savings}</span>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Screener ── */}
      {!showScreener ? (
        <button
          onClick={() => setShowScreener(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
        >
          <MagnifyingGlass className="w-4 h-4" weight="bold" />
          Check if your family qualifies
        </button>
      ) : (
        <div className="mt-2">
          <div className="flex flex-col sm:flex-row gap-3 mb-2">
            <div className="flex-1">
              <label htmlFor="benefits-age" className="text-xs text-gray-500 mb-1 block">Age</label>
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
              <label htmlFor="benefits-medicaid" className="text-xs text-gray-500 mb-1 block">On Medicaid?</label>
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
          <p className="text-xs text-gray-400">Rough estimate — not a guarantee.</p>

          {submitted && hasInput && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <p className="text-base text-gray-700">
                Your loved one may qualify for{" "}
                <span className="font-bold text-gray-900">{matchingPrograms.length} of {allPrograms.length} programs</span>
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

      {/* View all — quiet */}
      <Link
        href={benefitsUrl(stateId)}
        className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary-600 hover:text-primary-500 transition-colors"
      >
        View all {stateName} programs
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
