import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, activeStateIds } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return activeStateIds.map((id) => ({ state: id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateId } = await params;
  const state = getStateById(stateId);
  if (!state || state.programs.length === 0) return {};
  return {
    title: `${state.name} Benefits | Waiver Library | Olera`,
    description: state.description,
  };
}

export default async function StatePage({ params }: Props) {
  const { state: stateId } = await params;
  const state = getStateById(stateId);

  if (!state || state.programs.length === 0) {
    notFound();
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Header */}
      <section className="bg-vanilla-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Breadcrumb
            items={[
              { label: "Waiver Library", href: "/waiver-library" },
              { label: state.name },
            ]}
          />
          <div className="mt-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {state.name} Benefits
            </h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl">{state.description}</p>
            <p className="mt-2 text-sm text-gray-500">
              {state.programs.length} program{state.programs.length !== 1 ? "s" : ""} available
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <p className="text-sm font-medium text-gray-700">
                Check which you&apos;re eligible for — most families save up to $10,000 a year.
              </p>
              <Link
                href="/benefits/finder"
                className="shrink-0 inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-500 transition-colors"
              >
                Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Programs grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Available Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 p-6 flex flex-col"
              >
                <h3 className="font-bold text-gray-900 text-lg leading-snug">
                  {program.name}
                </h3>
                {program.savingsRange && (
                  <p className="mt-1 text-sm font-bold text-primary-600">
                    Save {program.savingsRange}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-600 flex-1">{program.tagline}</p>

                {program.eligibilityHighlights.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {program.eligibilityHighlights.slice(0, 3).map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <svg
                          className="w-4 h-4 text-success-500 mt-0.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}

                {program.forms.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Forms &amp; Documents
                    </p>
                    <ul className="space-y-1.5">
                      {program.forms.slice(0, 3).map((form) => (
                        <li key={form.id}>
                          <a
                            href={form.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-500 transition-colors group"
                          >
                            <svg
                              className="w-3.5 h-3.5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                              />
                            </svg>
                            <span className="truncate">{form.name}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    {program.forms.length > 3 && (
                      <Link
                        href={`/waiver-library/${state.id}/${program.id}/forms`}
                        className="mt-2 inline-block text-xs text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        +{program.forms.length - 3} more
                      </Link>
                    )}
                  </div>
                )}

                <div className="mt-5">
                  <Link
                    href={`/waiver-library/${state.id}/${program.id}`}
                    className="inline-flex items-center text-primary-600 font-medium text-sm hover:text-primary-500 transition-colors"
                  >
                    Learn more
                    <svg
                      className="ml-1 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
