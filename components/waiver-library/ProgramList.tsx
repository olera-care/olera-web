"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { WaiverProgram } from "@/data/waiver-library";

function getMaxSavings(savingsRange: string): number {
  const match = savingsRange.match(/\$[\d,]+/g);
  if (!match) return 0;
  const last = match[match.length - 1];
  return parseInt(last.replace(/[$,]/g, ""), 10);
}

const FEDERAL_KEYWORDS = [
  "snap", "calfresh", "liheap", "energy assistance", "weatherization",
  "ssi", "ssp", "medicare savings", "medicare patrol", "hicap", "ship",
  "ombudsman", "family caregiver", "scsep", "home-delivered meals",
  "congregate meals", "senior legal", "pace",
];

import { getCategory, type Category } from "@/lib/waiver-category";
export { getCategory };

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  financial: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5 1-2.5 2.25S10 12.5 12 13s2.5 1.25 2.5 2.25S13.5 17 12 17c-1 0-2-.5-2.5-1.5M12 6v1.5M12 16.5V18" />
    </svg>
  ),
  food: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  ),
  health: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  caregiver: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  resource: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
};

const CATEGORY_TABS: { value: Category; label: string }[] = [
  { value: "financial", label: "Financial Help" },
  { value: "food", label: "Food & Nutrition" },
  { value: "health", label: "Health Coverage" },
  { value: "caregiver", label: "Caregiver Support" },
  { value: "resource", label: "Free Resources" },
];

// Per-category color accents — drawn ONLY from Olera's brand palette
// (primary teal, secondary slate, warm terracotta) using shade variation
// to give each category a distinct but on-brand identity.
const CATEGORY_COLORS: Record<Category, { accent: string; chipBg: string; chipText: string; iconBg: string; iconText: string }> = {
  financial: {
    accent: "bg-primary-700",
    chipBg: "bg-primary-50",
    chipText: "text-primary-700",
    iconBg: "bg-primary-100",
    iconText: "text-primary-700",
  },
  food: {
    accent: "bg-warm-600",
    chipBg: "bg-warm-50",
    chipText: "text-warm-700",
    iconBg: "bg-warm-100",
    iconText: "text-warm-700",
  },
  health: {
    accent: "bg-secondary-600",
    chipBg: "bg-secondary-50",
    chipText: "text-secondary-700",
    iconBg: "bg-secondary-100",
    iconText: "text-secondary-700",
  },
  caregiver: {
    accent: "bg-warm-400",
    chipBg: "bg-warm-25",
    chipText: "text-warm-600",
    iconBg: "bg-warm-50",
    iconText: "text-warm-600",
  },
  resource: {
    accent: "bg-primary-400",
    chipBg: "bg-primary-25",
    chipText: "text-primary-600",
    iconBg: "bg-primary-50",
    iconText: "text-primary-600",
  },
};

const CATEGORY_LABELS: Record<Category, string> = {
  financial: "Financial",
  food: "Food",
  health: "Health",
  caregiver: "Caregiver",
  resource: "Resource",
};

function isFederalProgram(program: WaiverProgram): boolean {
  const text = `${program.name} ${program.id}`.toLowerCase();
  return FEDERAL_KEYWORDS.some((kw) => text.includes(kw));
}

const QUICK_APPLY_IDS = new Set([
  "texas-snap-food-benefits",
  "texas-meals-on-wheels",
  "texas-comprehensive-energy-assistance-program-ceap-liheap",
  "texas-weatherization-assistance-program",
  "texas-ship-medicare-counseling",
  "texas-legal-services-for-seniors",
  "texas-long-term-care-ombudsman",
  "texas-senior-companion-program",
]);

function getApplyType(program: WaiverProgram, stateId: string): "quick" | "plan" | null {
  if (stateId !== "texas") return null;
  if (QUICK_APPLY_IDS.has(program.id)) return "quick";
  return "plan";
}

interface ProgramListProps {
  programs: WaiverProgram[];
  stateId: string;
  /** Map of program.id → new slug for custom URL paths */
  slugMap?: Record<string, string>;
  /** Base path for program links (e.g. "/texas/benefits") */
  basePath?: string;
}

export function ProgramList({ programs, stateId, slugMap, basePath }: ProgramListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("financial");
  const [showAll, setShowAll] = useState(false);

  // Read ?tab= param on mount to restore the correct category
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as Category | null;
    if (tab && CATEGORY_TABS.some((t) => t.value === tab)) {
      setCategory(tab);
    }
  }, []);

  const hasSearch = search.trim().length > 0;

  const searchFiltered = hasSearch
    ? programs.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      })
    : programs;

  // When searching, show all matches regardless of category
  const filtered = hasSearch
    ? searchFiltered
    : searchFiltered.filter((p) => getCategory(p) === category);

  // Count programs per category (based on search-filtered list)
  const categoryCounts = CATEGORY_TABS.reduce((acc, tab) => {
    acc[tab.value] = searchFiltered.filter((p) => getCategory(p) === tab.value).length;
    return acc;
  }, {} as Record<Category, number>);

  const sorted = [...filtered].sort((a, b) =>
    getMaxSavings(b.savingsRange) - getMaxSavings(a.savingsRange)
  );

  const INITIAL_COUNT = 6;
  const displayed = showAll || hasSearch ? sorted : sorted.slice(0, INITIAL_COUNT);
  const hasMore = !hasSearch && sorted.length > INITIAL_COUNT && !showAll;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-8 bg-primary-700"></span>
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-primary-700">
              Browse by Need
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Available Programs
          </h2>
        </div>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs..."
            className="pl-10 pr-4 py-3 w-full sm:w-72 bg-white border border-gray-200 rounded-full text-base text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {CATEGORY_TABS.map((tab) => {
          const isActive = category === tab.value;
          const count = categoryCounts[tab.value];
          const colors = CATEGORY_COLORS[tab.value];
          return (
            <button
              key={tab.value}
              onClick={() => { setCategory(tab.value); setShowAll(false); }}
              className={`group inline-flex items-center px-5 py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-200 ${
                isActive
                  ? `${colors.accent} text-white shadow-lg shadow-gray-900/10 scale-[1.02]`
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <span className={`mr-2 ${isActive ? "opacity-100" : "opacity-80"}`}>{CATEGORY_ICONS[tab.value]}</span>
              {tab.label}
              <span className={`inline-flex items-center justify-center ml-2.5 min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold ${
                isActive
                  ? "bg-white/25 text-white"
                  : `${colors.chipBg} ${colors.chipText}`
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No programs found in this category.</p>
        </div>
      ) : (
        <div className={`grid gap-7 grid-cols-1 ${
          displayed.length === 1
            ? ""
            : displayed.length === 2 || displayed.length === 4
              ? "md:grid-cols-2"
              : "md:grid-cols-2 lg:grid-cols-3"
        }`}>
          {displayed.map((program) => {
            const federal = isFederalProgram(program);
            const applyType = getApplyType(program, stateId);
            const programCategory = getCategory(program);
            const colors = CATEGORY_COLORS[programCategory];
            const isWide = displayed.length === 1 || displayed.length === 2 || displayed.length === 4;
            return (
              <div
                key={program.id}
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Top color accent strip */}
                <div className={`h-1.5 w-full ${colors.accent}`}></div>

                <div className={`flex flex-1 flex-col ${isWide ? "p-7 md:p-8 lg:p-6" : "p-7 md:p-8"}`}>
                  {/* Top row: category icon + level chip */}
                  <div className={`flex items-center justify-between ${isWide ? "mb-4" : "mb-6"}`}>
                    <div className={`inline-flex items-center justify-center rounded-xl ${colors.iconBg} ${colors.iconText} ${isWide ? "w-10 h-10" : "w-12 h-12"}`}>
                      <span className={isWide ? "[&>svg]:w-5 [&>svg]:h-5" : "[&>svg]:w-6 [&>svg]:h-6"}>{CATEGORY_ICONS[programCategory]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${colors.chipBg} ${colors.chipText}`}>
                        {CATEGORY_LABELS[programCategory]}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-100 text-gray-600">
                        {federal ? "Federal" : "State"}
                      </span>
                    </div>
                  </div>

                  {/* Title — full width, straight across */}
                  <h3 className={`font-serif font-bold text-gray-900 leading-[1.2] tracking-tight ${isWide ? "text-xl" : "text-2xl"}`}>
                    {program.name}
                  </h3>

                  {/* Tagline — full width */}
                  <p className={`text-gray-600 leading-relaxed ${isWide ? "mt-2 text-sm" : "mt-4 text-base flex-1"}`}>{program.tagline}</p>

                  {/* Lower row: savings + CTA side by side on wide */}
                  <div className={isWide ? "lg:flex lg:items-end lg:gap-5 lg:mt-5" : ""}>
                    {/* Savings */}
                    {program.savingsRange && (
                      <div className={isWide ? "mt-6 pb-5 border-b border-gray-100 lg:mt-0 lg:pb-0 lg:border-b-0 lg:flex-1" : "mt-7 pb-6 border-b border-gray-100"}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1 whitespace-nowrap">Save up to</p>
                        <p className={`font-serif font-bold text-primary-700 leading-tight ${isWide ? "text-lg" : "text-2xl md:text-[1.625rem]"}`}>
                          {program.savingsRange}
                        </p>
                      </div>
                    )}

                  {/* Eligibility highlights */}
                  {program.eligibilityHighlights.length > 0 && (
                    <ul className={`lg:mt-0 ${isWide ? "mt-5 space-y-1.5 lg:hidden" : "mt-6 space-y-3"}`}>
                      {program.eligibilityHighlights.slice(0, 3).map((highlight) => (
                          <li
                            key={highlight}
                            className="flex items-start gap-3 text-[0.9375rem] text-gray-600 leading-relaxed"
                          >
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-success-100 shrink-0 mt-0.5">
                              <svg
                                className="w-3 h-3 text-success-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}

                  <div className={isWide ? "lg:w-40 lg:shrink-0" : ""}>
                    {/* Apply type badge — prominent + tooltip */}
                    {applyType && (
                      <div className={isWide ? "mt-4 lg:mt-0 lg:mb-2" : "mt-4"}>
                        <span
                          title={
                            applyType === "quick"
                              ? "Quick Apply: You can typically complete this application in one sitting."
                              : "Plan Ahead: This application requires gathering documents and may take time to complete."
                          }
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                            applyType === "quick"
                              ? "bg-success-50 text-success-700 border-success-200"
                              : "bg-warm-50 text-warm-700 border-warm-200"
                          }`}
                        >
                          {applyType === "quick" ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {applyType === "quick" ? "Quick Apply" : "Plan Ahead"}
                        </span>
                      </div>
                    )}

                    {/* CTA */}
                    <div className={isWide ? "mt-5 lg:mt-0" : "mt-5"}>
                      <Link
                        href={basePath && slugMap?.[program.id] ? `${basePath}/${slugMap[program.id]}` : `/waiver-library/${stateId}/${program.id}`}
                        className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-primary-700 rounded-xl hover:bg-primary-800 shadow-sm shadow-primary-700/20 transition-colors group/btn"
                      >
                        Learn more
                        <svg
                          className="ml-1.5 w-4 h-4 transition-transform group-hover/btn:translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            Show {sorted.length - INITIAL_COUNT} more programs
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
