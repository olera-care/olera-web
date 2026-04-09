import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateById, getProgramById, activeStateIds } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
import { ChecklistClient } from "@/components/waiver-library/ChecklistClient";

const PROGRAM_CHECKLIST_OVERRIDES: Record<string, { name: string; icon: string; items: string[] }[]> = {
  "texas-weatherization-assistance-program": [
    {
      name: "Proof of Income",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      items: [
        "Recent pay stubs from the last 30 days (all adults)",
        "Social Security, disability, pension, or unemployment award letter",
        "TANF or workers compensation letter",
        "Notarized declaration of income (if no other proof is available)",
      ],
    },
    {
      name: "Household Information",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      items: [
        "Name of every person living in the home",
        "Date of birth for every person living in the home",
        "Government-issued photo ID",
      ],
    },
    {
      name: "Utility Bills",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      items: [
        "Electric bill with 12 months of billing and usage history",
        "Gas bill with 12 months of billing and usage history",
        "Propane bill (if applicable)",
      ],
    },
    {
      name: "Property Documents",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      items: [
        "Mortgage statement (if you own your home)",
        "Most recent tax bill (if you own your home)",
        "Signed Landlord Agreement (if you rent)",
      ],
    },
  ],
};

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
          <ChecklistClient
            programName={program.name}
            programShortName={program.shortName}
            stateName={state.name}
            categories={PROGRAM_CHECKLIST_OVERRIDES[program.id]}
          />
        </div>
      </section>
    </div>
  );
}
