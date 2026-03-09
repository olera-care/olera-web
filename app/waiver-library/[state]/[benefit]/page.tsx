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
  const title = `${program.name} | ${state.name} | Waiver Library | Olera`;
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

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Program hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Breadcrumb
            items={[
              { label: "Benefits Hub", href: "/waiver-library" },
              { label: state.name, href: `/waiver-library/${state.id}` },
              { label: program.shortName },
            ]}
          />
          <div className="mt-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {program.name}
            </h1>
            <p className="mt-3 text-lg text-gray-600">{program.tagline}</p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-10 md:py-14 bg-vanilla-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Program Overview</h2>
            <p className="text-gray-700 leading-relaxed">{program.description}</p>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-10 md:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Eligibility Highlights</h2>
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
          <p className="mt-6 text-sm text-gray-500">
            Eligibility requirements may vary. Use our{" "}
            <Link href="/benefits/finder" className="text-primary-600 hover:text-primary-500">
              Benefits Finder
            </Link>{" "}
            for a personalized assessment.
          </p>
        </div>
      </section>

      {/* Application steps */}
      <section className="py-10 md:py-14 bg-vanilla-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-8">How to Apply</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {program.applicationSteps.map((step) => (
              <div
                key={step.step}
                className="bg-white rounded-xl border border-gray-200 p-6 flex gap-4"
              >
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{step.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Forms preview */}
      {program.forms.length > 0 && (
        <section className="py-10 md:py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Forms &amp; Documents</h2>
              <Link
                href={`/waiver-library/${state.id}/${program.id}/forms`}
                className="text-sm text-primary-600 font-medium hover:text-primary-500 transition-colors"
              >
                View all forms →
              </Link>
            </div>
            <div className="space-y-3 max-w-2xl">
              {program.forms.slice(0, 2).map((form) => (
                <div
                  key={form.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200"
                >
                  <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-error-600"
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
                    <p className="font-medium text-gray-900 text-sm">{form.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{form.description}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error-50 text-error-600 shrink-0">
                    PDF
                  </span>
                </div>
              ))}
            </div>
            {program.forms.length > 2 && (
              <div className="mt-4">
                <Link
                  href={`/waiver-library/${state.id}/${program.id}/forms`}
                  className="text-sm text-primary-600 font-medium hover:text-primary-500 transition-colors"
                >
                  + {program.forms.length - 2} more form{program.forms.length - 2 !== 1 ? "s" : ""}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Benefits Finder CTA banner */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-secondary-900 text-white py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            See if you qualify for {program.shortName}
          </h2>
          <p className="mt-4 text-primary-100 text-lg">
            Our Benefits Finder asks a few questions about your situation and shows the programs
            you may be eligible for — including {program.shortName} and more.
          </p>
          <div className="mt-8">
            <Link
              href="/benefits/finder"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
            >
              Check My Benefits
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
