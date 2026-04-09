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
    title: `Resources | ${enriched.name} | ${state.name} | Olera`,
    description: `Contact information, forms, and helpful links for ${enriched.name} in ${state.name}.`,
    alternates: { canonical: `/waiver-library/${stateId}/${benefitId}/resources` },
  };
}

export default async function ResourcesPage({ params }: Props) {
  const { state: stateId, benefit: benefitId } = await params;
  const state = getStateById(stateId);
  const enriched = getEnrichedProgram(stateId, benefitId);

  if (!state || !enriched) {
    notFound();
  }

  const basePath = `/waiver-library/${stateId}/${benefitId}`;
  const tabs = getAvailableTabs(enriched, basePath);
  const category = getCategory(enriched);
  const hasContacts = enriched.contacts && enriched.contacts.length > 0;
  const hasForms = enriched.forms && enriched.forms.length > 0;
  const hasLinks = enriched.applicationGuide?.urls && enriched.applicationGuide.urls.length > 0;
  const hasRelated = enriched.relatedPrograms && enriched.relatedPrograms.length > 0;

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Resources</h2>

          {/* Contact numbers */}
          {hasContacts && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-3">
                {enriched.contacts!.map((contact) => (
                  <div key={contact.phone} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{contact.label}</p>
                      {contact.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{contact.description}</p>
                      )}
                      {contact.hours && (
                        <p className="text-xs text-gray-400 mt-0.5">{contact.hours}</p>
                      )}
                    </div>
                    <a
                      href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phone fallback when no contacts but has phone */}
          {!hasContacts && enriched.phone && (
            <div className="mb-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{enriched.shortName} Help Line</p>
                  <p className="text-sm text-gray-500 mt-0.5">Call for questions about {enriched.shortName}</p>
                </div>
                <a
                  href={`tel:${enriched.phone.replace(/[^0-9+]/g, "")}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {enriched.phone}
                </a>
              </div>
            </div>
          )}

          {/* Application forms */}
          {hasForms && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Application Forms</h3>
              <div className="space-y-2">
                {enriched.forms.map((form) => (
                  <a
                    key={form.id}
                    href={form.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
                  >
                    <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{form.name}</p>
                      <p className="text-xs text-gray-500 truncate">{form.description}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* External links */}
          {(hasLinks || enriched.sourceUrl) && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Helpful Links</h3>
              <div className="space-y-2">
                {enriched.sourceUrl && (
                  <a
                    href={enriched.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
                  >
                    <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="text-sm font-medium text-primary-600">Official program page</span>
                  </a>
                )}
                {enriched.applicationGuide?.urls?.map((link) => (
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

          {/* Related programs */}
          {hasRelated && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Related Programs in {state.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enriched.relatedPrograms!.map((name) => {
                  // Try to find a matching program in this state for a link
                  const match = state.programs.find(
                    (p) =>
                      p.name.toLowerCase().includes(name.toLowerCase()) ||
                      p.shortName.toLowerCase() === name.toLowerCase()
                  );
                  return match ? (
                    <Link
                      key={name}
                      href={`/waiver-library/${stateId}/${match.id}`}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
                    >
                      <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{match.shortName}</p>
                        <p className="text-xs text-gray-500 truncate">{match.tagline}</p>
                      </div>
                    </Link>
                  ) : (
                    <div
                      key={name}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <p className="text-sm text-gray-600">{name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Service areas (moved from About page) */}
          {enriched.serviceAreas && enriched.serviceAreas.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Service Areas</h3>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
                  {enriched.serviceAreas.map((area) => (
                    <div key={area.name} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{area.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{area.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </BenefitPageShell>
  );
}
