import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProgramById } from "@/data/waiver-library";
import { TexasProgramHero } from "@/components/waiver-library/TexasProgramHero";
import { ChecklistClient } from "@/components/waiver-library/ChecklistClient";
import { TX_NEW_TO_OLD, TX_OLD_TO_NEW } from "@/lib/texas-slug-map";
import { isResourceProgram } from "@/lib/waiver-category";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.values(TX_OLD_TO_NEW).map((slug) => ({ slug }));
}

const PROGRAM_CHECKLIST_OVERRIDES: Record<string, { name: string; icon: string; items: string[] }[]> = {
  "senior-community-service-employment-program-scsep": [
    {
      name: "Identity & Personal",
      icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5M10 6l2-2m0 0l2 2m-2-2v8m-6 4h.01M18 20h.01",
      items: [
        "Government-issued photo ID (driver's license or passport)",
        "Social Security card",
        "Birth certificate",
        "Passport-size photo (optional)",
      ],
    },
    {
      name: "Income & Financial",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      items: [
        "Proof of all income (pay stubs, tax return, SSI letter)",
        "Bank statements from the past 3 months",
        "Documentation of assets (property, investments)",
      ],
    },
    {
      name: "Residency",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      items: [
        "Proof of Texas residency (utility bill or lease agreement)",
      ],
    },
    {
      name: "Medical & Other",
      icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
      items: [
        "Documentation of disability (if applicable)",
        "Health insurance card — Medicare or Medicaid (if applicable)",
        "DD-214 (if you are a veteran)",
      ],
    },
  ],
  "texas-medicaid-for-the-elderly-and-people-with-disabilities": [
    {
      name: "Identity & Residency",
      icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5M10 6l2-2m0 0l2 2m-2-2v8m-6 4h.01M18 20h.01",
      items: [
        "Government-issued photo ID",
        "Social Security card",
        "Proof of citizenship or qualified alien status",
        "Proof of Texas residency",
      ],
    },
    {
      name: "Income & Financial",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      items: [
        "Proof of income (pay stubs, award letters, pension statements)",
        "Bank statements for all accounts",
        "Investment documents (stocks, bonds, annuities, trust agreements)",
        "Loan or gift documentation (if applicable)",
        "Child support documentation (if applicable)",
      ],
    },
    {
      name: "Property & Insurance",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      items: [
        "Property documents (deeds, tax statements, royalty statements)",
        "Insurance policies (life and burial)",
        "Health insurance information",
        "Utility bills",
        "Rent or mortgage statements",
      ],
    },
    {
      name: "Legal & Representation",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      items: [
        "Power of attorney (if you have a representative)",
        "Guardianship order (if applicable)",
      ],
    },
  ],
  "texas-snap-food-benefits": [
    {
      name: "Identity & Immigration",
      icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5M10 6l2-2m0 0l2 2m-2-2v8m-6 4h.01M18 20h.01",
      items: [
        "Proof of identity",
        "Documents for immigration status",
      ],
    },
    {
      name: "Income & Financial",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      items: [
        "Proof of income",
        "Bank statements (2 months)",
      ],
    },
    {
      name: "Housing",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      items: [
        "Rent or mortgage information",
      ],
    },
    {
      name: "Expenses & Other",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      items: [
        "Medical costs",
        "Dependent care expenses",
        "Child support payments",
      ],
    },
  ],
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const oldId = TX_NEW_TO_OLD[slug];
  if (!oldId) return {};
  const program = getProgramById("texas", oldId);
  if (!program) return {};
  const title = `${program.name} Document Checklist 2026 | Texas | Olera`;
  return {
    title,
    description: `Complete document checklist for applying for ${program.shortName} in Texas. Check off items as you gather them and email the list to yourself.`,
    alternates: { canonical: `/texas/benefits/${slug}/checklist` },
  };
}

export default async function TexasChecklistPage({ params }: Props) {
  const { slug } = await params;
  const oldId = TX_NEW_TO_OLD[slug];
  if (!oldId) notFound();

  const program = getProgramById("texas", oldId);
  if (!program) notFound();
  if (isResourceProgram(program)) notFound();

  return (
    <div className="bg-vanilla-100 min-h-screen">
      <TexasProgramHero program={program} slug={slug} currentPage="How to Apply" />
      <section className="py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChecklistClient
            programName={program.name}
            programShortName={program.shortName}
            stateName="Texas"
            categories={PROGRAM_CHECKLIST_OVERRIDES[oldId]}
          />
        </div>
      </section>
      <div className="pb-16 md:pb-20" />
    </div>
  );
}
