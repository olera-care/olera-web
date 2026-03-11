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
  const title = `${program.name} Forms & Documents | ${state.name} | Benefits Hub | Olera`;
  const description = `Download application forms and documents for ${program.name} in ${state.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/waiver-library/${stateId}/${benefitId}/forms` },
    openGraph: {
      title,
      description,
      url: `/waiver-library/${stateId}/${benefitId}/forms`,
      siteName: "Olera",
      type: "website",
    },
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
      {/* Sticky teal header */}
      <section className="bg-primary-800 text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <Breadcrumb
            variant="dark"
            items={[
              { label: "Benefits Hub", href: "/waiver-library" },
              { label: state.name, href: `/waiver-library/${state.id}` },
              { label: program.shortName, href: `/waiver-library/${state.id}/${program.id}` },
              { label: "Forms & Documents" },
            ]}
          />
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white">
            {program.name} Forms &amp; Documents
          </h1>
          <p className="mt-1 text-sm text-primary-200">
            {program.forms.length} form{program.forms.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </section>

      {/* Program forms card */}
      <section className="py-4 md:py-5 bg-vanilla-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-lg font-bold text-gray-900">{program.name}</h2>
              <Link
                href={`/waiver-library/${state.id}/${program.id}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors shrink-0"
              >
                View program details
              </Link>
            </div>

            <p className="text-sm text-gray-600 mb-3">{program.tagline}</p>

            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {program.forms.length} form{program.forms.length !== 1 ? "s" : ""} available
              </span>
              <span className="text-xs text-gray-400">
                Last updated Mar 2026
              </span>
            </div>

            {program.forms.map((form) => (
              <div
                key={form.id}
                className="flex items-center gap-4 bg-vanilla-50 rounded-xl p-4 mb-3 last:mb-0"
              >
                <div className="w-10 h-10 bg-error-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{form.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{form.description}</p>
                </div>
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-500 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            ))}

            {/* Check eligibility CTA */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 hover:bg-primary-500 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Check if I qualify
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-800 rounded-2xl py-10 md:py-12 px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-serif">
              Not sure where to start?
            </h2>
            <p className="mt-2 text-primary-200 text-sm md:text-base">
              Answer a few quick questions and we&apos;ll match you with the right programs and forms.
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
