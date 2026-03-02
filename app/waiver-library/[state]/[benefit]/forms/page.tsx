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
  return {
    title: `${program.shortName} Forms & Documents | ${state.name} | Waiver Library | Olera`,
    description: `Download application forms and documents for ${program.name} in ${state.name}.`,
  };
}

export default async function FormsPage({ params }: Props) {
  const { state: stateId, benefit: benefitId } = await params;
  const state = getStateById(stateId);
  const program = getProgramById(stateId, benefitId);

  if (!state || !program) {
    notFound();
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Breadcrumb
            items={[
              { label: "Waiver Library", href: "/waiver-library" },
              { label: state.name, href: `/waiver-library/${state.id}` },
              { label: program.shortName, href: `/waiver-library/${state.id}/${program.id}` },
              { label: "Forms & Documents" },
            ]}
          />
          <div className="mt-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {program.shortName} — Forms &amp; Documents
            </h1>
            <p className="mt-2 text-gray-600">
              Official forms required to apply for and participate in {program.name} in {state.name}.
            </p>
          </div>
        </div>
      </section>

      {/* Forms list */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {program.forms.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-xl">
              <p className="text-gray-600">
                No forms are currently listed for this program. Check the state agency website
                directly for the most up-to-date application materials.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl">
              {program.forms.map((form) => (
                <div
                  key={form.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-error-50 rounded-xl flex items-center justify-center shrink-0">
                      <svg
                        className="w-6 h-6 text-error-500"
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
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{form.name}</h3>
                          <p className="mt-1 text-sm text-gray-600">{form.description}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-error-50 text-error-600 border border-error-100 shrink-0">
                          PDF
                        </span>
                      </div>
                      <div className="mt-4">
                        <a
                          href={form.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                        >
                          Open on government website
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-8 max-w-3xl p-4 rounded-xl bg-warning-50 border border-warning-200">
            <p className="text-sm text-warning-700">
              <span className="font-semibold">Note:</span> Links open official government websites.
              Form availability may change — always verify with your state Medicaid agency for the
              most current application materials.
            </p>
          </div>

          {/* Back link */}
          <div className="mt-8">
            <Link
              href={`/waiver-library/${state.id}/${program.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to {program.shortName} overview
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Finder CTA */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-8 md:p-10 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Not sure if you qualify?
            </h2>
            <p className="mt-3 text-gray-600">
              Use our Benefits Finder to get a personalized eligibility assessment for{" "}
              {program.shortName} and other programs.
            </p>
            <div className="mt-6">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-500 transition-colors"
              >
                Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
