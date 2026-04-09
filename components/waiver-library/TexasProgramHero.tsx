import Link from "next/link";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
import { getCategory } from "@/lib/waiver-category";
import type { WaiverProgram } from "@/data/waiver-library";

const FEDERAL_KEYWORDS = [
  "snap", "calfresh", "liheap", "energy assistance", "weatherization",
  "ssi", "ssp", "medicare savings", "medicare patrol", "hicap", "ship",
  "ombudsman", "family caregiver", "scsep", "home-delivered meals",
  "congregate meals", "senior legal", "pace",
];

interface TexasProgramHeroProps {
  program: WaiverProgram;
  slug: string;
  currentPage?: "About" | "Eligibility" | "How to Apply" | "Resources";
}

export function TexasProgramHero({ program, slug, currentPage = "About" }: TexasProgramHeroProps) {
  const isFederal = FEDERAL_KEYWORDS.some((kw) =>
    `${program.name} ${program.id}`.toLowerCase().includes(kw)
  );

  const basePath = `/texas/benefits/${slug}`;
  const items: { label: string; href?: string; current?: boolean }[] = [
    { label: "Benefits Hub", href: "/waiver-library" },
    { label: "Texas", href: "/texas/benefits" },
    { label: program.shortName, href: basePath },
    { label: currentPage, current: true },
  ];

  return (
    <section className="relative bg-primary-50 border-b border-primary-100 overflow-hidden">
      {/* Soft decorative wash */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary-100/60 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-16 w-64 h-64 rounded-full bg-primary-200/40 blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 md:pt-8 md:pb-10">
        <div className="flex items-center gap-3">
          <Link
            href={`/texas/benefits?tab=${getCategory(program)}`}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-primary-100 text-primary-700 hover:bg-primary-100 hover:border-primary-200 transition-colors shadow-sm"
            aria-label="Back to Texas"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Breadcrumb items={items} />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="inline-flex items-center h-px w-8 bg-primary-700"></span>
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary-700">
            Texas · {isFederal ? "Federal Program" : "State Program"}
          </span>
        </div>
        <h1 className="mt-2 font-serif text-3xl md:text-5xl font-bold text-gray-900 leading-[1.05] tracking-tight max-w-4xl">
          {program.name}
        </h1>
      </div>
    </section>
  );
}
