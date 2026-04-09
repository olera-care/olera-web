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
    title: `How to Apply | ${enriched.name} | ${state.name} | Olera`,
    description: `Step-by-step guide to applying for ${enriched.name} in ${state.name}. Documents needed, application steps, and processing times.`,
    alternates: { canonical: `/waiver-library/${stateId}/${benefitId}/apply` },
  };
}

export default async function ApplyPage({ params }: Props) {
  const { state: stateId, benefit: benefitId } = await params;
  const state = getStateById(stateId);
  const enriched = getEnrichedProgram(stateId, benefitId);

  if (!state || !enriched) {
    notFound();
  }

  const basePath = `/waiver-library/${stateId}/${benefitId}`;
  const tabs = getAvailableTabs(enriched, basePath);
  const category = getCategory(enriched);
  const guide = enriched.applicationGuide;

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
      <section className="py-4 md:py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Apply</h2>

          {/* Application summary */}
          {guide && (
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">{guide.summary}</p>
          )}

          {/* Application steps */}
          {guide?.steps && guide.steps.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Step by Step</h3>
              <div className="space-y-4">
                {guide.steps.map((step) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white font-bold text-sm">{step.step}</span>
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy steps fallback */}
          {!guide?.steps && enriched.applicationSteps.length > 0 && (
            <div className="mb-6">
              <div className="space-y-4">
                {enriched.applicationSteps.map((step) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white font-bold text-sm">{step.step}</span>
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing time & waitlist */}
          {(guide?.processingTime || guide?.waitlist) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {guide.processingTime && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Processing Time</p>
                  <p className="text-sm text-gray-900 font-medium">{guide.processingTime}</p>
                </div>
              )}
              {guide.waitlist && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                  <p className="text-xs text-amber-600 uppercase tracking-wide font-medium mb-1">Waitlist</p>
                  <p className="text-sm text-gray-900 font-medium">{guide.waitlist}</p>
                </div>
              )}
            </div>
          )}

          {/* Application notes */}
          {enriched.applicationNotes && enriched.applicationNotes.length > 0 && (
            <div className="mb-6 space-y-2">
              {enriched.applicationNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-700">{note}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          {guide?.tip && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Tip:</span> {guide.tip}
              </p>
            </div>
          )}

          {/* Documents needed */}
          {enriched.documentsNeeded && enriched.documentsNeeded.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Documents You Will Need</h3>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <ul className="space-y-2.5">
                  {enriched.documentsNeeded.map((doc) => (
                    <li key={doc} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {doc}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Link
                    href={`/waiver-library/${stateId}/${benefitId}/checklist`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Interactive checklist — track what you&apos;ve gathered
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Regional applications */}
          {enriched.regionalApplications && enriched.regionalApplications.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Regional Application Offices</h3>
              <div className="space-y-3">
                {enriched.regionalApplications.map((ra) => (
                  <div key={ra.region} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{ra.region}</p>
                        {ra.counties && ra.counties.length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Serving: {ra.counties.join(", ")}
                          </p>
                        )}
                      </div>
                      <a
                        href={ra.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors"
                      >
                        {ra.isPdf ? "Download PDF" : "Apply here"}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application links */}
          {guide?.urls && guide.urls.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Application Links</h3>
              <div className="space-y-2">
                {guide.urls.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
                  >
                    <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="text-sm font-medium text-primary-600">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </BenefitPageShell>
  );
}
