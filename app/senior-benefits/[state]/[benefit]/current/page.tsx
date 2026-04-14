import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, getProgramById, activeStateIds } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
import { ExpandableText } from "@/components/waiver-library/ExpandableText";
import { FaqAccordion } from "@/components/waiver-library/FaqAccordion";
import { getCategory } from "@/lib/waiver-category";

/**
 * Legacy program page — always renders the old (pre-v3) layout.
 * Used by admin dashboard "Preview current" link for comparison.
 * Not indexed by search engines (noindex).
 */

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

export async function generateMetadata() {
  return { robots: { index: false, follow: false } };
}

export default async function LegacyBenefitPage({ params }: Props) {
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
      {/* Banner: this is the old version */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
        <p className="text-xs text-amber-700">
          Legacy view — <Link href={`/senior-benefits/${stateId}/${benefitId}`} className="underline font-medium">see v2 page</Link>
        </p>
      </div>

      {/* Program hero */}
      <section className="bg-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href={`/senior-benefits/${state.id}?tab=${getCategory(program)}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={`Back to ${state.name}`}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <Breadcrumb
              variant="dark"
              items={[
                { label: "Benefits Hub", href: "/senior-benefits" },
                { label: state.name, href: `/senior-benefits/${state.id}` },
                { label: program.shortName, current: true },
              ]}
            />
          </div>
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Program Overview</h2>
              <ExpandableText text={program.intro || program.description} />
              {program.savingsRange && (
                <div className="mt-4 flex items-center gap-2.5 p-3 bg-success-50 border border-success-100 rounded-xl">
                  <p className="text-sm font-bold text-success-700">Estimated savings: {program.savingsRange}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility Highlights</h2>
              <ul className="space-y-2.5">
                {program.eligibilityHighlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-emerald-500 mt-0.5 text-sm shrink-0">&#10003;</span>
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Application steps */}
      {program.applicationSteps.length > 0 && (
        <section className="py-4 md:py-5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How to Apply</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {program.applicationSteps.map((step) => (
                <div key={step.step} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      {program.faqs && program.faqs.length > 0 && (
        <section className="py-4 md:py-5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Common Questions</h2>
            <FaqAccordion faqs={program.faqs} />
          </div>
        </section>
      )}
    </div>
  );
}
