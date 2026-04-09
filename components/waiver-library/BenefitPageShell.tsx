import Link from "next/link";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
import { ProgramTabs } from "@/components/waiver-library/ProgramTabs";
import type { ProgramTab } from "@/lib/program-data";

const FEDERAL_KEYWORDS = [
  "snap", "calfresh", "liheap", "energy assistance", "weatherization",
  "ssi", "ssp", "medicare savings", "medicare patrol", "hicap", "ship",
  "ombudsman", "family caregiver", "scsep", "home-delivered meals",
  "congregate meals", "senior legal", "pace",
];

interface BenefitPageShellProps {
  stateId: string;
  stateName: string;
  programName: string;
  programShortName: string;
  programId: string;
  tabs: ProgramTab[];
  category: string;
  children: React.ReactNode;
}

export function BenefitPageShell({
  stateId,
  stateName,
  programName,
  programShortName,
  programId,
  tabs,
  category,
  children,
}: BenefitPageShellProps) {
  const isFederal = FEDERAL_KEYWORDS.some((kw) =>
    `${programName} ${programId}`.toLowerCase().includes(kw)
  );

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Program hero */}
      <section className="bg-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href={`/waiver-library/${stateId}?tab=${category}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={`Back to ${stateName}`}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <Breadcrumb
              variant="dark"
              items={[
                { label: "Benefits Hub", href: "/waiver-library" },
                { label: stateName, href: `/waiver-library/${stateId}` },
                { label: programShortName, current: true },
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
            {programName}
          </h1>
        </div>
      </section>

      {/* Tab navigation */}
      {tabs.length > 1 && <ProgramTabs tabs={tabs} />}

      {/* Tab content */}
      {children}
    </div>
  );
}
