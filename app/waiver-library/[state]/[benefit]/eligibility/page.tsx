import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, activeStateIds } from "@/data/waiver-library";
import { BenefitPageShell } from "@/components/waiver-library/BenefitPageShell";
import { getEnrichedProgram, getAvailableTabs } from "@/lib/program-data";
import { getCategory } from "@/lib/waiver-category";

interface Props {
  params: Promise<{ state: string; benefit: string }>;
}

export async function generateStaticParams() {
  const params: { state: string; benefit: string }[] = [];
  for (const stateId of activeStateIds) {
    const state = getStateById(stateId);
    if (state) {
      for (const program of state.programs) {
        params.push({ state: stateId, benefit: program.id });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateId, benefit: benefitId } = await params;
  const state = getStateById(stateId);
  const enriched = getEnrichedProgram(stateId, benefitId);
  if (!state || !enriched) return {};
  return {
    title: `Eligibility | ${enriched.name} | ${state.name} | Olera`,
    description: `Who qualifies for ${enriched.name} in ${state.name}? Income limits, age requirements, and eligibility criteria.`,
    alternates: { canonical: `/waiver-library/${stateId}/${benefitId}/eligibility` },
  };
}

export default async function EligibilityPage({ params }: Props) {
  const { state: stateId, benefit: benefitId } = await params;
  const state = getStateById(stateId);
  const enriched = getEnrichedProgram(stateId, benefitId);

  if (!state || !enriched) {
    notFound();
  }

  const basePath = `/waiver-library/${stateId}/${benefitId}`;
  const tabs = getAvailableTabs(enriched, basePath);
  const category = getCategory(enriched);
  const elig = enriched.structuredEligibility;
  const highlights = elig?.summary || enriched.eligibilityHighlights;

  return (
    <BenefitPageShell
      stateId={stateId}
      stateName={state.name}
      programName={enriched.name}
      programShortName={enriched.shortName}
      programId={enriched.id}
      tabs={tabs}
      category={category}
    >
      {/* Eligibility summary */}
      <section className="py-4 md:py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Who Qualifies</h2>

          {/* Summary highlights */}
          <ul className="space-y-3 mb-6">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>

          {/* Age requirement */}
          {elig?.ageRequirement && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">Age Requirement</h3>
              <p className="text-gray-600">{elig.ageRequirement}</p>
            </div>
          )}

          {/* Income table */}
          {elig?.incomeTable && elig.incomeTable.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Income Limits</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-medium text-gray-500">Household Size</th>
                      <th className="text-left py-2 font-medium text-gray-500">Monthly Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elig.incomeTable.map((row) => (
                      <tr key={row.householdSize} className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-900">{row.householdSize} {row.householdSize === 1 ? "person" : "people"}</td>
                        <td className="py-2 font-medium text-gray-900">${row.monthlyLimit.toLocaleString()}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {elig.povertyLevelReference && (
                <p className="mt-2 text-xs text-gray-500">{elig.povertyLevelReference}</p>
              )}
            </div>
          )}

          {/* Asset limits */}
          {elig?.assetLimits && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Asset Limits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {elig.assetLimits.individual != null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Individual</p>
                    <p className="text-lg font-bold text-gray-900">${elig.assetLimits.individual.toLocaleString()}</p>
                  </div>
                )}
                {elig.assetLimits.couple != null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Couple</p>
                    <p className="text-lg font-bold text-gray-900">${elig.assetLimits.couple.toLocaleString()}</p>
                  </div>
                )}
              </div>
              {elig.assetLimits.countedAssets && elig.assetLimits.countedAssets.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1.5">What counts</h4>
                  <ul className="space-y-1">
                    {elig.assetLimits.countedAssets.map((item) => (
                      <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-red-400 shrink-0">+</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {elig.assetLimits.exemptAssets && elig.assetLimits.exemptAssets.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1.5">What doesn&apos;t count</h4>
                  <ul className="space-y-1">
                    {elig.assetLimits.exemptAssets.map((item) => (
                      <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-success-500 shrink-0">&minus;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {elig.assetLimits.homeEquityCap != null && (
                <p className="mt-3 text-xs text-gray-500">
                  Home equity cap: ${elig.assetLimits.homeEquityCap.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Functional requirement */}
          {elig?.functionalRequirement && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">Functional Requirement</h3>
              <p className="text-sm text-gray-700">{elig.functionalRequirement}</p>
            </div>
          )}

          {/* Other requirements */}
          {elig?.otherRequirements && elig.otherRequirements.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Other Requirements</h3>
              <ul className="space-y-2">
                {elig.otherRequirements.map((req) => (
                  <li key={req} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 shrink-0">&bull;</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 flex items-center gap-4 p-4 bg-primary-50 border border-primary-100 rounded-xl">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Not sure if you qualify?</p>
              <p className="text-xs text-gray-600 mt-0.5">Answer a few quick questions to find out.</p>
            </div>
            <Link
              href="/benefits/finder"
              className="shrink-0 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-500 transition-colors"
            >
              Check Now
            </Link>
          </div>
        </div>
      </section>
    </BenefitPageShell>
  );
}
