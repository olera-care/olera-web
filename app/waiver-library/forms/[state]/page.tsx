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
  if (!state) return {};
  const title = `${state.name} Medicaid Waiver Forms & Documents | Waiver Library | Olera`;
  const description = `Download all Medicaid waiver application forms and documents for ${state.name}. Official forms for every waiver program.`;
  return {
    title,
    description,
    alternates: { canonical: `/waiver-library/forms/${stateId}` },
    openGraph: {
      title,
      description,
      url: `/waiver-library/forms/${stateId}`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function StateFormsPage({ params }: Props) {
  const { state: stateId } = await params;
  const state = getStateById(stateId);

  if (!state) {
    notFound();
  }

  const totalForms = state.programs.reduce((sum, p) => sum + p.forms.length, 0);

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Breadcrumb
            items={[
              { label: "Waiver Library", href: "/waiver-library" },
              { label: "Forms & Documents", href: "/waiver-library/forms" },
              { label: state.name },
            ]}
          />
          <div className="mt-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {state.name} — Forms &amp; Documents
            </h1>
            <p className="mt-2 text-gray-600">
              {totalForms} form{totalForms !== 1 ? "s" : ""} across {state.programs.length} waiver program{state.programs.length !== 1 ? "s" : ""}.
              Download applications and supporting documents below.
            </p>
          </div>
        </div>
      </section>

      {/* Forms grouped by program */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {state.programs.map((program) => (
            <div key={program.id}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {program.shortName}
                </h2>
                <Link
                  href={`/waiver-library/${state.id}/${program.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  View program details
                </Link>
              </div>

              {program.forms.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    No forms currently listed. Check your state Medicaid agency for application materials.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {program.forms.map((form) => (
                    <div
                      key={form.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
                    >
                      <div className="flex items-start gap-4">
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
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">{form.name}</h3>
                              <p className="mt-1 text-sm text-gray-600">{form.description}</p>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-error-50 text-error-600 border border-error-100 shrink-0">
                              PDF
                            </span>
                          </div>
                          <div className="mt-3">
                            <a
                              href={form.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                            >
                              Download
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-12 md:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 rounded-xl bg-warning-50 border border-warning-200">
            <p className="text-sm text-warning-700">
              <span className="font-semibold">Note:</span> Links open official government websites.
              Form availability may change — always verify with your state Medicaid agency for the
              most current application materials.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
