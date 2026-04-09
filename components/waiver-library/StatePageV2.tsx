"use client";

import Link from "next/link";
import type { StateData, WaiverProgram } from "@/data/waiver-library";
import type { PipelineStateOverview } from "@/data/pipeline-drafts";
import { useState } from "react";

interface StatePageV2Props {
  state: StateData;
  overview: PipelineStateOverview;
}

// --- Hand-drawn SVG Illustrations ---

function HeaderBlobs() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-1/2 opacity-[0.12] pointer-events-none"
      viewBox="0 0 400 300"
      fill="none"
      aria-hidden="true"
    >
      {/* Large organic teal blob */}
      <path
        d="M280 60c45 12 90 55 85 105s-60 75-110 90-95-5-115-55S235 48 280 60Z"
        fill="#96c8c8"
      />
      {/* Smaller warm accent blob */}
      <path
        d="M320 180c30 15 55 50 40 80s-50 35-80 25-40-35-25-60 35-60 65-45Z"
        fill="#e9bd91"
      />
      {/* Small floating circle */}
      <circle cx="200" cy="45" r="18" fill="#96c8c8" opacity="0.5" />
      {/* Tiny dot cluster */}
      <circle cx="350" cy="80" r="5" fill="#e9bd91" opacity="0.6" />
      <circle cx="365" cy="95" r="3" fill="#96c8c8" opacity="0.4" />
      <circle cx="340" cy="100" r="4" fill="#e9bd91" opacity="0.3" />
    </svg>
  );
}

function WavyDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-full h-6 text-primary-200/40 ${className}`}
      viewBox="0 0 1200 24"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 12c100-8 200 8 300 0s200-8 300 0 200 8 300 0 200-8 300 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HandDrawnUnderline() {
  return (
    <svg
      className="absolute -bottom-2 left-0 w-full h-3 text-primary-300/60"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 8c30-4 60-6 100-5s70 3 96 1"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Need category icons — warm, organic SVG vignettes
const needIcons: Record<string, { emoji: string; svg: React.ReactNode }> = {
  home: {
    emoji: "🏠",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <path d="M8 22l12-11 12 11" stroke="#417272" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 20v11a1 1 0 001 1h5v-7h6v7h5a1 1 0 001-1V20" stroke="#417272" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="10" r="2" fill="#e9bd91" opacity="0.6" />
      </svg>
    ),
  },
  medical: {
    emoji: "💊",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <rect x="12" y="8" width="16" height="24" rx="8" stroke="#417272" strokeWidth="2.5" transform="rotate(-30 20 20)" />
        <line x1="10" y1="20" x2="30" y2="20" stroke="#417272" strokeWidth="2" strokeLinecap="round" transform="rotate(-30 20 20)" />
        <circle cx="33" cy="8" r="2.5" fill="#96c8c8" opacity="0.5" />
      </svg>
    ),
  },
  food: {
    emoji: "🍎",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <path d="M20 10c-6 0-11 5-11 12 0 8 6 14 11 14s11-6 11-14c0-7-5-12-11-12Z" stroke="#417272" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 4c0 3-2 6-2 6" stroke="#417272" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 8c3-1 5-3 5-3" stroke="#96c8c8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="15" r="2" fill="#e9bd91" opacity="0.5" />
      </svg>
    ),
  },
  advice: {
    emoji: "💬",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <path d="M8 12a4 4 0 014-4h16a4 4 0 014 4v10a4 4 0 01-4 4H16l-5 4v-4H12a4 4 0 01-4-4V12Z" stroke="#417272" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="17" r="1.5" fill="#417272" />
        <circle cx="22" cy="17" r="1.5" fill="#417272" />
        <circle cx="34" cy="7" r="2" fill="#e9bd91" opacity="0.5" />
      </svg>
    ),
  },
  money: {
    emoji: "💰",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <circle cx="20" cy="20" r="13" stroke="#417272" strokeWidth="2.5" />
        <path d="M20 12v16M16 16c0-2 2-3 4-3s4 1 4 3-2 3-4 3-4 1-4 3 2 3 4 3 4-1 4-3" stroke="#417272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="34" cy="8" r="2" fill="#96c8c8" opacity="0.4" />
      </svg>
    ),
  },
  work: {
    emoji: "💼",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <rect x="6" y="14" width="28" height="18" rx="3" stroke="#417272" strokeWidth="2.5" />
        <path d="M14 14V11a3 3 0 013-3h6a3 3 0 013 3v3" stroke="#417272" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="22" x2="34" y2="22" stroke="#417272" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="35" cy="10" r="2" fill="#e9bd91" opacity="0.5" />
      </svg>
    ),
  },
};

function getNeedIcon(need: string) {
  const lower = need.toLowerCase();
  if (lower.includes("home") || lower.includes("staying")) return needIcons.home;
  if (lower.includes("medical") || lower.includes("health") || lower.includes("coordinat")) return needIcons.medical;
  if (lower.includes("food") || lower.includes("utilit") || lower.includes("meal") || lower.includes("energy")) return needIcons.food;
  if (lower.includes("advice") || lower.includes("advocacy") || lower.includes("legal") || lower.includes("free")) return needIcons.advice;
  if (lower.includes("pay") || lower.includes("cost") || lower.includes("financial") || lower.includes("saving")) return needIcons.money;
  if (lower.includes("employ") || lower.includes("work") || lower.includes("income") || lower.includes("job")) return needIcons.work;
  return needIcons.advice; // fallback
}

// --- Program Card ---

function ProgramCard({ program, stateId }: { program: WaiverProgram; stateId: string }) {
  const type = program.programType || "benefit";
  const typeStyles: Record<string, string> = {
    benefit: "bg-emerald-50 text-emerald-700",
    resource: "bg-blue-50 text-blue-700",
    navigator: "bg-violet-50 text-violet-700",
    employment: "bg-amber-50 text-amber-700",
  };

  return (
    <Link
      href={`/waiver-library/${stateId}/${program.id}`}
      className="group block py-5 border-b border-gray-100 last:border-0 transition-colors hover:bg-vanilla-50/50 -mx-3 px-3 rounded-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-medium text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
            {program.name}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed mt-1 line-clamp-2">
            {program.tagline || program.description}
          </p>
          {program.savingsRange && (
            <p className="text-xs text-gray-400 mt-1.5">
              Saves up to <span className="font-semibold text-gray-600">{program.savingsRange}</span>
            </p>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-500 shrink-0 mt-1.5 transition-all group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// --- Type Group Labels ---

const typeLabels: Record<string, { label: string; description: string; emoji: string }> = {
  benefit: { label: "Benefits", description: "Programs that provide financial help or services", emoji: "✦" },
  resource: { label: "Resources", description: "Free guidance available to any senior", emoji: "◇" },
  navigator: { label: "Navigators", description: "Tools that help you find and apply for programs", emoji: "↗" },
  employment: { label: "Employment", description: "Job training and income support", emoji: "◆" },
};

// --- Main Component ---

export function StatePageV2({ state, overview }: StatePageV2Props) {
  const [showAll, setShowAll] = useState(false);
  const programs = state.programs;

  // Group programs by type
  const grouped = programs.reduce<Record<string, WaiverProgram[]>>((acc, p) => {
    const type = p.programType || "benefit";
    if (!acc[type]) acc[type] = [];
    acc[type].push(p);
    return acc;
  }, {});
  const groupOrder = ["benefit", "resource", "navigator", "employment"];
  const activeGroups = groupOrder.filter((t) => grouped[t]?.length);

  // Compute stats for the dark band
  const benefitCount = grouped.benefit?.length || 0;
  const resourceCount = (grouped.resource?.length || 0) + (grouped.navigator?.length || 0);
  const savingsPrograms = programs.filter((p) => p.savingsRange);
  const topSavings = savingsPrograms.length > 0
    ? savingsPrograms.reduce((best, p) => {
        const match = p.savingsRange?.match(/[\d,]+/g);
        const val = match ? Math.max(...match.map((n) => parseInt(n.replace(",", "")))) : 0;
        const bestMatch = best.savingsRange?.match(/[\d,]+/g);
        const bestVal = bestMatch ? Math.max(...bestMatch.map((n) => parseInt(n.replace(",", "")))) : 0;
        return val > bestVal ? p : best;
      })
    : null;

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Header — wider, bolder, with organic blobs */}
      <header className="relative pt-8 pb-14 md:pt-12 md:pb-20 overflow-hidden">
        <HeaderBlobs />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
            <Link href="/waiver-library" className="hover:text-gray-600 transition-colors">Benefits Hub</Link>
            <span>&#8250;</span>
            <span className="text-gray-600">{state.name}</span>
          </nav>

          <h1 className="text-display-md md:text-display-lg font-bold text-gray-900 font-serif leading-tight">
            Senior Benefits in{" "}
            <span className="relative inline-block">
              {state.name}
              <HandDrawnUnderline />
            </span>
          </h1>

          <p className="mt-4 text-lg text-gray-500">
            {programs.length} programs to help your family
          </p>
        </div>
      </header>

      <main className="pb-24">
        {/* Intro — prose width */}
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <div className="text-lg text-gray-600 leading-relaxed space-y-4">
            {overview.intro.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        <WavyDivider className="my-14 max-w-3xl mx-auto px-6" />

        {/* Where to start — horizontal cards */}
        {overview.startHere && overview.startHere.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-5">
              Where to start
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overview.startHere.map((pick, i) => {
                const program = programs.find((p) =>
                  p.id === pick.programId ||
                  p.name.toLowerCase().includes(pick.name.toLowerCase().slice(0, 20)) ||
                  pick.name.toLowerCase().includes(p.name.toLowerCase().slice(0, 20))
                );
                const href = program
                  ? `/waiver-library/${state.id}/${program.id}`
                  : `/waiver-library/${state.id}`;

                return (
                  <Link
                    key={i}
                    href={href}
                    className="group relative flex flex-col p-5 rounded-2xl bg-white border border-gray-150 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-vanilla-200 text-gray-500 text-sm font-semibold mb-3">
                      {i + 1}
                    </span>
                    <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
                      {pick.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed flex-1">
                      {pick.why}
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more
                      <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Quick facts — tucked in quietly */}
        {overview.quickFacts && overview.quickFacts.length > 0 && (
          <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-3">
              Good to know
            </p>
            <div className="space-y-2.5">
              {overview.quickFacts.map((fact, i) => (
                <p key={i} className="text-sm text-gray-500 leading-relaxed flex items-start gap-2.5">
                  <span className="text-primary-300 mt-0.5 shrink-0 text-lg leading-none">&#183;</span>
                  {fact}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Dark stat band — the bold moment */}
        <section className="mt-16 mb-16 bg-gray-900 py-10 md:py-12">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
              <div>
                <span className="text-display-sm md:text-display-md font-bold text-white font-serif">
                  {programs.length}
                </span>
                <span className="text-gray-400 text-sm ml-2">programs</span>
              </div>
              {topSavings?.savingsRange && (
                <div>
                  <span className="text-display-sm md:text-display-md font-bold text-white font-serif">
                    {topSavings.savingsRange.match(/\$[\d,]+/)?.[0] || topSavings.savingsRange}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">potential savings</span>
                </div>
              )}
              <div>
                <span className="text-display-sm md:text-display-md font-bold text-white font-serif">
                  {benefitCount}
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  {benefitCount === 1 ? "benefit" : "benefits"}
                </span>
              </div>
              {resourceCount > 0 && (
                <div>
                  <span className="text-display-sm md:text-display-md font-bold text-white font-serif">
                    {resourceCount}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">free resources</span>
                </div>
              )}
            </div>
            {overview.resourcesVsBenefits && (
              <p className="text-gray-400 text-sm leading-relaxed mt-5 max-w-2xl">
                {overview.resourcesVsBenefits.split(".").slice(0, 2).join(".") + "."}
              </p>
            )}
          </div>
        </section>

        {/* Browse by need — with illustrations */}
        {overview.byNeed && overview.byNeed.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-6">
              Browse by what you need
            </p>
            <div className="space-y-8">
              {overview.byNeed.map((group, i) => {
                const icon = getNeedIcon(group.need);
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100"
                  >
                    <div className="shrink-0 mt-0.5">
                      {icon.svg}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 leading-snug">{group.need}</p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{group.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {group.programs.map((name, j) => {
                          const program = programs.find((p) =>
                            p.name.toLowerCase().includes(name.toLowerCase().slice(0, 20)) ||
                            name.toLowerCase().includes(p.name.toLowerCase().slice(0, 20))
                          );
                          return program ? (
                            <Link
                              key={j}
                              href={`/waiver-library/${state.id}/${program.id}`}
                              className="text-xs font-medium text-primary-700 hover:text-primary-500 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-full transition-colors"
                            >
                              {program.shortName || program.name}
                            </Link>
                          ) : (
                            <span key={j} className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <WavyDivider className="my-16 max-w-3xl mx-auto px-6" />

        {/* All programs — grouped by type */}
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-6">
            All {programs.length} programs
          </p>
          <div className="space-y-10">
            {activeGroups.map((type) => {
              const group = grouped[type];
              const info = typeLabels[type] || typeLabels.benefit;
              const displayItems = showAll ? group : group.slice(0, type === "benefit" ? 6 : 4);
              const hasMore = !showAll && group.length > displayItems.length;

              return (
                <div key={type}>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-primary-400 text-sm">{info.emoji}</span>
                    <h2 className="text-base font-semibold text-gray-900">
                      {info.label}
                    </h2>
                    <span className="text-xs text-gray-400 font-medium">{group.length}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{info.description}</p>
                  <div className="bg-white rounded-xl border border-gray-100 px-3">
                    {displayItems.map((program) => (
                      <ProgramCard key={program.id} program={program} stateId={state.id} />
                    ))}
                  </div>
                  {hasMore && (
                    <button
                      onClick={() => setShowAll(true)}
                      className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    >
                      Show all {group.length} {info.label.toLowerCase()} &rarr;
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
