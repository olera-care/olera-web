import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateById, getProgramById } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
import { ChecklistClient } from "@/components/waiver-library/ChecklistClient";
import { TX_NEW_TO_OLD, TX_OLD_TO_NEW } from "@/lib/texas-slug-map";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.values(TX_OLD_TO_NEW).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const oldId = TX_NEW_TO_OLD[slug];
  if (!oldId) return {};
  const program = getProgramById("texas", oldId);
  if (!program) return {};
  const title = `${program.name} Document Checklist 2026 — 16 Documents to Apply | Olera`;
  const description = `Get the complete document checklist for applying for the ${program.name} in Texas in 2026. 16 required documents across identity, income, medical, and residency. Email yourself the full list free.`;
  return {
    title,
    description,
    alternates: { canonical: `/texas/benefits/${slug}/checklist` },
    openGraph: { title, description, siteName: "Olera", type: "website" },
  };
}

export default async function TexasChecklistPage({ params }: Props) {
  const { slug } = await params;
  const oldId = TX_NEW_TO_OLD[slug];
  if (!oldId) notFound();

  const state = getStateById("texas");
  const program = getProgramById("texas", oldId);

  if (!state || !program) {
    notFound();
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      <section className="bg-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <Breadcrumb
            variant="dark"
            items={[
              { label: "Benefits Hub", href: "/senior-benefits" },
              { label: "Texas", href: "/texas/benefits" },
              { label: program.shortName, href: `/texas/benefits/${slug}` },
              { label: "Document Checklist", current: true },
              { label: "Application Forms", href: `/texas/benefits/${slug}/forms` },
            ]}
          />
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white">
            {program.name} Document Checklist 2026
          </h1>
        </div>
      </section>

      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChecklistClient programName={program.name} programShortName={program.shortName} stateName="Texas" />
        </div>
      </section>
    </div>
  );
}
