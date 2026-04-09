import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, activeStateIds } from "@/data/waiver-library";
import { ExpandableText } from "@/components/waiver-library/ExpandableText";
import { FaqAccordion } from "@/components/waiver-library/FaqAccordion";
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
  const title = `${enriched.name} | ${state.name} | Benefits Hub | Olera`;
  const description = `${enriched.tagline} Learn about eligibility, home care benefits, and how to apply for ${enriched.shortName} in ${state.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/waiver-library/${stateId}/${benefitId}` },
    openGraph: {
      title,
      description,
      url: `/waiver-library/${stateId}/${benefitId}`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function BenefitPage({ params }: Props) {
  const { state: stateId, benefit: benefitId } = await params;
  const state = getStateById(stateId);
  const enriched = getEnrichedProgram(stateId, benefitId);

  if (!state || !enriched) {
    notFound();
  }

  const basePath = `/waiver-library/${stateId}/${benefitId}`;
  const tabs = getAvailableTabs(enriched, basePath);
  const category = getCategory(enriched);

  const faqJsonLd = enriched.faqs && enriched.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": enriched.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  } : null;

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
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Overview + Eligibility side by side */}
      <section className="py-4 md:py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Program Overview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Program Overview
              </h2>
              <ExpandableText text={enriched.intro || enriched.description} />
              {enriched.savingsRange && (
                <div className="mt-4 flex items-center gap-2.5 p-3 bg-success-50 border border-success-100 rounded-xl">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-success-700">Estimated savings: {enriched.savingsRange}</p>
                </div>
              )}
              {enriched.sourceUrl && (
                <a
                  href={enriched.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Official program page
                </a>
              )}
            </div>

            {/* Eligibility Highlights */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Eligibility Highlights
              </h2>
              <ul className="space-y-3">
                {(enriched.structuredEligibility?.summary || enriched.eligibilityHighlights).map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center gap-4 p-4 bg-primary-50 border border-primary-100 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Not sure if you qualify?</p>
                  <p className="text-xs text-gray-600 mt-0.5">Get a personalized assessment in 2 minutes.</p>
                </div>
                <Link
                  href="/benefits/finder"
                  className="shrink-0 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-500 transition-colors"
                >
                  Find My Savings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documents preview — show top 5 if available */}
      {enriched.documentsNeeded && enriched.documentsNeeded.length > 0 && (
        <section className="py-3 md:py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary-50 rounded-xl border border-primary-100 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">What to Gather Before Applying</h2>
              <ul className="space-y-2">
                {enriched.documentsNeeded.slice(0, 5).map((doc) => (
                  <li key={doc} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {doc}
                  </li>
                ))}
              </ul>
              {enriched.documentsNeeded.length > 5 && (
                <Link
                  href={`/waiver-library/${stateId}/${benefitId}/apply`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  See all {enriched.documentsNeeded.length} documents needed
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Application steps summary */}
      {enriched.applicationGuide && (
        <section className="py-3 md:py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">How to Apply</h2>
              <p className="text-gray-600 mb-4">{enriched.applicationGuide.summary}</p>
              {enriched.applicationGuide.steps && enriched.applicationGuide.steps.length > 0 && (
                <div className="space-y-3">
                  {enriched.applicationGuide.steps.slice(0, 4).map((step) => (
                    <div key={step.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white font-bold text-xs">{step.step}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {enriched.applicationGuide.tip && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Tip:</span> {enriched.applicationGuide.tip}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Legacy application steps fallback (when no applicationGuide) */}
      {!enriched.applicationGuide && enriched.applicationSteps.length > 0 && (
        <section className="py-3 md:py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary-50 rounded-xl border border-primary-100 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">How to Apply for {enriched.shortName} in {state.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {enriched.applicationSteps.map((step) => (
                  <div key={step.step} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">{step.step}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {enriched.faqs && enriched.faqs.length > 0 && (
        <section className="py-3 md:py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Frequently Asked Questions
            </h2>
            <FaqAccordion faqs={enriched.faqs} columns={1} />
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white px-6 py-8 md:py-10 text-center shadow-[0_6px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200/60">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
              See How Much You Could Save on Care
            </h2>
            <p className="mt-2 text-gray-500 text-base md:text-lg">
              Free, no signup required. Just a few quick questions.
            </p>
            <div className="mt-5">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center justify-center px-6 py-3 text-base text-white font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200"
              >
                Find My Savings
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </BenefitPageShell>
  );
}
