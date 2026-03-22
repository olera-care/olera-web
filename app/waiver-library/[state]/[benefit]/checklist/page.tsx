import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateById, getProgramById, activeStateIds } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
import { ChecklistClient } from "@/components/waiver-library/ChecklistClient";

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
  const title = `${program.name} Document Checklist 2026 — 16 Documents to Apply | Olera`;
  const description = `Get the complete document checklist for applying for the ${program.name} in ${state.name} in 2026. 16 required documents across identity, income, medical, and residency. Email yourself the full list free.`;
  return {
    title,
    description,
    alternates: { canonical: `/waiver-library/${stateId}/${benefitId}/checklist` },
    openGraph: { title, description, siteName: "Olera", type: "website" },
  };
}

export default async function ChecklistPage({ params }: Props) {
  const { state: stateId, benefit: benefitId } = await params;
  const state = getStateById(stateId);
  const program = getProgramById(stateId, benefitId);

  if (!state || !program) {
    notFound();
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Header */}
      <section className="bg-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <Breadcrumb
            variant="dark"
            items={[
              { label: "Benefits Hub", href: "/waiver-library" },
              { label: state.name, href: `/waiver-library/${state.id}` },
              { label: program.shortName, href: `/waiver-library/${state.id}/${program.id}` },
              { label: "Document Checklist", current: true },
              { label: "Application Forms", href: `/waiver-library/${state.id}/${program.id}/forms` },
            ]}
          />
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white">
            {program.name} Document Checklist 2026
          </h1>
        </div>
      </section>

      {/* Checklist */}
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChecklistClient programName={program.name} programShortName={program.shortName} stateName={state.name} />
        </div>
      </section>
    </div>
  );
}
