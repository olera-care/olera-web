import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, getProgramById, activeStateIds } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
import { DocumentChecklist } from "@/components/waiver-library/DocumentChecklist";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
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
          {program.savingsRange && (
            <span className="mt-2 inline-block text-xs font-semibold uppercase tracking-wide bg-white/15 text-primary-200 px-3 py-1 rounded-full">
              Save {program.savingsRange}
            </span>
          )}
        </div>
      </section>

      {/* Overview */}
      <section className="py-4 md:py-5 bg-vanilla-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Program Overview</h2>
            <p className="text-gray-700 leading-relaxed">{program.description}</p>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-4 md:py-5 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility Highlights</h2>
          <ul className="space-y-3 max-w-2xl">
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
          <div className="mt-5 flex items-center gap-4 p-4 bg-primary-50 border border-primary-100 rounded-xl max-w-2xl">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Not sure if you qualify?</p>
              <p className="text-xs text-gray-600 mt-0.5">Eligibility requirements may vary. Get a personalized assessment in 2 minutes.</p>
            </div>
            <Link
              href="/benefits/finder"
              className="shrink-0 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-500 transition-colors"
            >
              Check My Benefits
            </Link>
          </div>
        </div>
      </section>

      {/* Document Checklist */}
      <section className="py-4 md:py-5 bg-vanilla-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DocumentChecklist />
        </div>
      </section>

      {/* Application steps */}
      <section className="py-4 md:py-5 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">How to Apply</h2>
            <Link
              href="/benefits/finder"
              className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Check eligibility first →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {program.applicationSteps.map((step) => (
              <div
                key={step.step}
                className="bg-vanilla-50 rounded-xl border border-gray-200 p-5 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{step.step}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-sm text-gray-600 flex-1">{step.description}</p>
                {step.step === 1 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Link
                      href="/benefits/finder"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Check if you qualify
                    </Link>
                  </div>
                )}
                {step.step === 2 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {program.forms.length > 0 ? (
                      <Link
                        href={`/waiver-library/${state.id}/${program.id}/forms`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download forms ({program.forms.length})
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">See document checklist above</span>
                    )}
                  </div>
                )}
                {step.step === 3 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Typical processing: 30-90 days
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Forms */}
      {program.forms.length > 0 && (
        <section className="py-4 md:py-5 bg-vanilla-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Application Forms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {program.forms.map((form) => (
                <div
                  key={form.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-error-50 rounded-lg flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-error-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{form.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{form.description}</p>
                    <a
                      href={form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Helpful Resources */}
      <section className="py-4 md:py-5 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Helpful Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/benefits/finder"
              className="bg-vanilla-50 rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">Benefits Finder</p>
              <p className="text-sm text-gray-500 mt-1">Check what programs you qualify for</p>
            </Link>
            {program.forms.length > 0 && (
              <Link
                href={`/waiver-library/${state.id}/${program.id}/forms`}
                className="bg-vanilla-50 rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">Forms & Documents</p>
                <p className="text-sm text-gray-500 mt-1">Download application forms for this program</p>
              </Link>
            )}
            <a
              href="https://www.medicaid.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-vanilla-50 rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">Medicaid.gov</p>
              <p className="text-sm text-gray-500 mt-1">Official federal Medicaid information</p>
            </a>
          </div>
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-800 rounded-2xl py-10 md:py-12 px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-serif">
              Don&apos;t know what you qualify for?
            </h2>
            <p className="mt-2 text-primary-200 text-sm md:text-base">
              Answer a few quick questions and we&apos;ll show you every program available to you.
            </p>
            <div className="mt-5">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-900 font-semibold rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:bg-primary-50 transition-all"
              >
                Check My Benefits
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
