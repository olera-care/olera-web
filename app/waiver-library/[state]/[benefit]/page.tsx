import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, getProgramById, activeStateIds } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";

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
  const program = getProgramById(stateId, benefitId);
  if (!state || !program) return {};
  const title = `${program.name} | ${state.name} | Benefits Hub | Olera`;
  const description = `${program.tagline} Learn about eligibility, benefits, and how to apply for ${program.shortName} in ${state.name}.`;
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
  const program = getProgramById(stateId, benefitId);

  if (!state || !program) {
    notFound();
  }

  const FEDERAL_KEYWORDS = [
    "snap", "calfresh", "liheap", "energy assistance", "weatherization",
    "ssi", "ssp", "medicare savings", "medicare patrol", "hicap", "ship",
    "ombudsman", "family caregiver", "scsep", "home-delivered meals",
    "congregate meals", "senior legal", "pace",
  ];
  const isFederal = FEDERAL_KEYWORDS.some((kw) =>
    `${program.name} ${program.id}`.toLowerCase().includes(kw)
  );

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Program hero */}
      <section className="bg-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <Breadcrumb
            variant="dark"
            items={[
              { label: "Benefits Hub", href: "/waiver-library" },
              { label: state.name, href: `/waiver-library/${state.id}` },
              { label: program.shortName },
            ]}
          />
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              isFederal ? "bg-secondary-100 text-secondary-700" : "bg-primary-100 text-primary-700"
            }`}>
              {isFederal ? "Federal" : "State"}
            </span>
          </div>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-bold text-white leading-tight">
            {program.name}
          </h1>
        </div>
      </section>

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
              <p className="text-gray-700 leading-relaxed">{program.description}</p>
              {program.savingsRange && (
                <div className="mt-4 flex items-center gap-2.5 p-3 bg-success-50 border border-success-100 rounded-xl">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-success-700">Estimated savings: {program.savingsRange}</p>
                  </div>
                </div>
              )}
              {program.forms.length > 0 && (
                <a
                  href={program.forms[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Read more on official government site
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
                {program.eligibilityHighlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg
                        className="w-3.5 h-3.5 text-success-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
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

      {/* What You'll Need */}
      <section className="py-3 md:py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-50 rounded-xl border border-primary-100 shadow-sm p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What to Gather Before Applying</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-5">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Government-issued photo ID</p>
                  <p className="text-sm text-gray-500 mt-1">Driver&apos;s license, passport, or state ID</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-5">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Proof of income</p>
                  <p className="text-sm text-gray-500 mt-1">Pay stubs, tax return, or SSI letter</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-5">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Proof of residency</p>
                  <p className="text-sm text-gray-500 mt-1">Utility bill, lease, or state-issued document</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href={`/waiver-library/${state.id}/${program.id}/checklist`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                View full checklist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Application steps */}
      <section className="py-3 md:py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-50 rounded-xl border border-primary-100 shadow-sm p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
              </svg>
              How to Apply
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1: Check eligibility */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-3 min-h-[44px]">
                  <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-primary-600/25">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Check your eligibility</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-sm text-gray-600">See if you qualify using the eligibility highlights above.</p>
                </div>
                <div className="mt-auto pt-3">
                  <Link
                    href="/benefits/finder"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg border border-primary-200 shadow-md shadow-primary-200/50 hover:bg-primary-100 hover:shadow-lg hover:shadow-primary-200/60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Check if you qualify
                  </Link>
                </div>
              </div>

              {/* Step 2: Gather documents */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-3 min-h-[44px]">
                  <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-primary-600/25">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Gather required documents</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-sm text-gray-600">Collect proof of age, income, and residency.</p>
                </div>
                <div className="mt-auto pt-3">
                  <Link
                    href={`/waiver-library/${state.id}/${program.id}/checklist`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg border border-primary-200 shadow-md shadow-primary-200/50 hover:bg-primary-100 hover:shadow-lg hover:shadow-primary-200/60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    View full checklist
                  </Link>
                </div>
              </div>

              {/* Step 3: Download forms */}
              {program.forms.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-3 mb-3 min-h-[44px]">
                    <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-primary-600/25">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Download forms</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3">
                    <p className="text-sm text-gray-600">Download and submit by mail or at your local office.</p>
                  </div>
                  <div className="space-y-2 flex-1">
                    {program.forms.map((form) => (
                      <a
                        key={form.id}
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all group"
                      >
                        <div className="w-7 h-7 bg-error-50 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="flex-1 min-w-0 text-xs font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">{form.name}</p>
                        <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Submit application */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-3 min-h-[44px]">
                  <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-primary-600/25">
                    <span className="text-white font-bold text-sm">{program.forms.length > 0 ? "4" : "3"}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Submit your application</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-sm text-gray-600">Complete and submit the form. Processing takes 30–90 days.</p>
                </div>
                {program.forms.length > 0 && (
                  <div className="mt-auto pt-3">
                    <a
                      href={program.forms[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg border border-primary-200 shadow-md shadow-primary-200/50 hover:bg-primary-100 hover:shadow-lg hover:shadow-primary-200/60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7v4m0-4l-2 2m2-2l2 2" />
                      </svg>
                      Track your application
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Bottom CTA banner */}
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
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
