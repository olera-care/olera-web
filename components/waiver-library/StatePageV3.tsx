"use client";

import Link from "next/link";
import type { StateData, WaiverProgram } from "@/data/waiver-library";
import type { PipelineStateOverview } from "@/data/pipeline-drafts";
import { useState, useRef } from "react";
import { useSavedPrograms, type SaveProgramData } from "@/hooks/use-saved-programs";

// ═══════════════════════════════════════════════════════════════════════════════
// Archetypes — the conceptual backbone. Each archetype maps a family situation
// to the programs that help. The mapping uses keywords from program names,
// types, and content to stay data-driven rather than hardcoded per state.
// ═══════════════════════════════════════════════════════════════════════════════

type ArchetypeId = "home" | "paying" | "start" | "caregiver" | null;

interface Archetype {
  id: ArchetypeId;
  title: string;
  subtitle: string;
  keywords: string[]; // matched against program name + tagline + type
  needKeywords: string[]; // matched against byNeed group names
}

const ARCHETYPES: Archetype[] = [
  {
    id: "home",
    title: "Help staying home",
    subtitle: "My loved one needs care at home but we can't afford it",
    keywords: ["home", "waiver", "hcbs", "attendant", "personal care", "community", "pace", "choice", "alternatives"],
    needKeywords: ["home", "staying", "personal"],
  },
  {
    id: "paying",
    title: "Help paying for care",
    subtitle: "We need help covering medical or living costs",
    keywords: ["medicaid", "medicare", "savings", "snap", "food", "energy", "liheap", "weatherization", "financial"],
    needKeywords: ["pay", "cost", "financial", "food", "utilit", "saving"],
  },
  {
    id: "start",
    title: "I don't know where to start",
    subtitle: "My loved one needs help and I'm overwhelmed",
    keywords: ["ship", "shine", "navigator", "counseling", "information", "cafе", "micafe", "options"],
    needKeywords: ["advice", "navigation", "start", "free", "advocacy"],
  },
  {
    id: "caregiver",
    title: "Support for me as caregiver",
    subtitle: "I'm burning out and need help or a break",
    keywords: ["respite", "caregiver", "companion", "support", "ombudsman", "legal"],
    needKeywords: ["companion", "support", "caregiver", "legal"],
  },
];

// Archetype response messages — situation-specific, empathetic
const archetypeResponses: Record<string, string> = {
  home: "Your loved one wants to stay home. These programs help cover in-home care, personal assistance, and home modifications so they can age safely in place.",
  paying: "Paying for care is overwhelming. These programs help cover medical costs, prescriptions, food, utilities, and other essentials.",
  start: "It's okay not to know where to begin. These programs help you understand your options, navigate benefits, and get personalized guidance.",
  caregiver: "Caring for someone is hard work. These programs provide respite breaks, companionship for your loved one, legal guidance, and support for you.",
};

function programMatchesArchetype(program: WaiverProgram, archetype: Archetype): boolean {
  const haystack = `${program.name} ${program.tagline || ""} ${program.description} ${program.programType || ""}`.toLowerCase();
  return archetype.keywords.some((kw) => haystack.includes(kw));
}

function needMatchesArchetype(needName: string, archetype: Archetype): boolean {
  const lower = needName.toLowerCase();
  return archetype.needKeywords.some((kw) => lower.includes(kw));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Design atoms — organic SVG elements from the shared design language
// ═══════════════════════════════════════════════════════════════════════════════

function HeaderBlobs() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-1/2 opacity-[0.12] pointer-events-none"
      viewBox="0 0 400 300"
      fill="none"
      aria-hidden="true"
    >
      <path d="M280 60c45 12 90 55 85 105s-60 75-110 90-95-5-115-55S235 48 280 60Z" fill="#96c8c8" />
      <path d="M320 180c30 15 55 50 40 80s-50 35-80 25-40-35-25-60 35-60 65-45Z" fill="#e9bd91" />
      <circle cx="200" cy="45" r="18" fill="#96c8c8" opacity="0.5" />
      <circle cx="350" cy="80" r="5" fill="#e9bd91" opacity="0.6" />
      <circle cx="365" cy="95" r="3" fill="#96c8c8" opacity="0.4" />
      <circle cx="340" cy="100" r="4" fill="#e9bd91" opacity="0.3" />
    </svg>
  );
}

function WavyDivider({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-full h-6 text-primary-200/40 ${className}`} viewBox="0 0 1200 24" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path d="M0 12c100-8 200 8 300 0s200-8 300 0 200 8 300 0 200-8 300 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HandDrawnUnderline() {
  return (
    <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary-300/60" viewBox="0 0 200 12" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path d="M2 8c30-4 60-6 100-5s70 3 96 1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Archetype icons — organic, warm, hand-drawn feel
const archetypeIcons: Record<string, React.ReactNode> = {
  home: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden="true">
      <path d="M6 18l10-9 10 9" stroke="#417272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 16v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="#417272" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 12l-1-3" stroke="#e9bd91" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  paying: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden="true">
      <circle cx="16" cy="16" r="10" stroke="#417272" strokeWidth="2" />
      <path d="M16 10v12M13 13c0-1.5 1.5-2.5 3-2.5s3 .8 3 2.5-1.5 2.5-3 2.5-3 .8-3 2.5 1.5 2.5 3 2.5 3-1 3-2.5" stroke="#417272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  start: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden="true">
      <circle cx="16" cy="14" r="9" stroke="#417272" strokeWidth="2" />
      <path d="M16 23v4" stroke="#417272" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 10v2M16 15v1" stroke="#417272" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="7" r="1.5" fill="#e9bd91" opacity="0.6" />
    </svg>
  ),
  caregiver: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden="true">
      <path d="M16 26s-8-5.5-8-11a5 5 0 0110 0 5 5 0 0110 0c0 5.5-8 11-8 11z" stroke="#417272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25" cy="8" r="1.5" fill="#e9bd91" opacity="0.6" />
    </svg>
  ),
};

// Need category icons (from StatePageV2)
const needIcons: Record<string, React.ReactNode> = {
  home: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
      <path d="M8 22l12-11 12 11" stroke="#417272" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 20v11a1 1 0 001 1h5v-7h6v7h5a1 1 0 001-1V20" stroke="#417272" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="10" r="2" fill="#e9bd91" opacity="0.6" />
    </svg>
  ),
  medical: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
      <rect x="12" y="8" width="16" height="24" rx="8" stroke="#417272" strokeWidth="2.5" transform="rotate(-30 20 20)" />
      <line x1="10" y1="20" x2="30" y2="20" stroke="#417272" strokeWidth="2" strokeLinecap="round" transform="rotate(-30 20 20)" />
      <circle cx="33" cy="8" r="2.5" fill="#96c8c8" opacity="0.5" />
    </svg>
  ),
  food: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
      <path d="M20 10c-6 0-11 5-11 12 0 8 6 14 11 14s11-6 11-14c0-7-5-12-11-12Z" stroke="#417272" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 4c0 3-2 6-2 6" stroke="#417272" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="15" r="2" fill="#e9bd91" opacity="0.5" />
    </svg>
  ),
  advice: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
      <path d="M8 12a4 4 0 014-4h16a4 4 0 014 4v10a4 4 0 01-4 4H16l-5 4v-4H12a4 4 0 01-4-4V12Z" stroke="#417272" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="17" r="1.5" fill="#417272" />
      <circle cx="22" cy="17" r="1.5" fill="#417272" />
      <circle cx="34" cy="7" r="2" fill="#e9bd91" opacity="0.5" />
    </svg>
  ),
  money: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
      <circle cx="20" cy="20" r="13" stroke="#417272" strokeWidth="2.5" />
      <path d="M20 12v16M16 16c0-2 2-3 4-3s4 1 4 3-2 3-4 3-4 1-4 3 2 3 4 3 4-1 4-3" stroke="#417272" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34" cy="8" r="2" fill="#96c8c8" opacity="0.4" />
    </svg>
  ),
  work: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
      <rect x="6" y="14" width="28" height="18" rx="3" stroke="#417272" strokeWidth="2.5" />
      <path d="M14 14V11a3 3 0 013-3h6a3 3 0 013 3v3" stroke="#417272" strokeWidth="2" strokeLinecap="round" />
      <circle cx="35" cy="10" r="2" fill="#e9bd91" opacity="0.5" />
    </svg>
  ),
};

function getNeedIcon(need: string) {
  const lower = need.toLowerCase();
  if (lower.includes("home") || lower.includes("staying")) return needIcons.home;
  if (lower.includes("medical") || lower.includes("health") || lower.includes("coordinat")) return needIcons.medical;
  if (lower.includes("food") || lower.includes("utilit") || lower.includes("meal") || lower.includes("energy")) return needIcons.food;
  if (lower.includes("advice") || lower.includes("advocacy") || lower.includes("legal") || lower.includes("free")) return needIcons.advice;
  if (lower.includes("pay") || lower.includes("cost") || lower.includes("financial") || lower.includes("saving")) return needIcons.money;
  if (lower.includes("employ") || lower.includes("work") || lower.includes("income") || lower.includes("job")) return needIcons.work;
  return needIcons.advice;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared atoms
// ═══════════════════════════════════════════════════════════════════════════════

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-5">
      {children}
    </p>
  );
}

function SaveButton({ program, stateId }: { program: WaiverProgram; stateId: string }) {
  const { isSaved, toggleSave } = useSavedPrograms();
  const saved = isSaved(program.id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave({
          programId: program.id,
          stateId,
          name: program.name,
          shortName: program.shortName,
          programType: program.programType,
          savingsRange: program.savingsRange || undefined,
        });
      }}
      className="p-1.5 -m-1 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={saved ? "Saved" : "Save program"}
    >
      <svg
        className={`w-4 h-4 transition-colors ${saved ? "text-primary-600 fill-primary-600" : "text-gray-300 hover:text-gray-400"}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={saved ? 0 : 1.5}
        fill={saved ? "currentColor" : "none"}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    </button>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    benefit: "bg-emerald-50 text-emerald-600",
    resource: "bg-blue-50 text-blue-600",
    navigator: "bg-violet-50 text-violet-600",
    employment: "bg-amber-50 text-amber-600",
  };
  return (
    <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${styles[type] || "bg-gray-100 text-gray-500"}`}>
      {type}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════

interface StatePageV3Props {
  state: StateData;
  overview: PipelineStateOverview;
}

const typeLabels: Record<string, { label: string; description: string; emoji: string }> = {
  benefit: { label: "Benefits", description: "Programs that provide financial help or services", emoji: "✦" },
  resource: { label: "Resources", description: "Free guidance available to any senior", emoji: "◇" },
  navigator: { label: "Navigators", description: "Tools that help you find and apply for programs", emoji: "↗" },
  employment: { label: "Employment", description: "Job training and income support", emoji: "◆" },
};

export function StatePageV3({ state, overview }: StatePageV3Props) {
  const [activeArchetype, setActiveArchetype] = useState<ArchetypeId>(null);
  const [showAll, setShowAll] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);
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

  // Compute stats
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

  // Archetype filtering
  const selectedArchetype = ARCHETYPES.find((a) => a.id === activeArchetype) || null;

  function isProgramHighlighted(program: WaiverProgram): boolean {
    if (!selectedArchetype) return true;
    return programMatchesArchetype(program, selectedArchetype);
  }

  // (archetype toggle is inline in the button onClick)

  return (
    <div className="bg-vanilla-100 min-h-screen">

      {/* ─── Header ─── */}
      <header className="relative pt-8 pb-10 md:pt-12 md:pb-14 overflow-hidden">
        <HeaderBlobs />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
            <Link href="/senior-benefits" className="hover:text-gray-600 transition-colors">Benefits Hub</Link>
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

          <p className="mt-3 text-lg text-gray-500">
            {programs.length} programs to help your family
          </p>
        </div>
      </header>

      <main className="pb-24">

        {/* ─── Archetype Entry — "What's your situation?" ─── */}
        <section className="max-w-4xl mx-auto px-6 lg:px-8 -mt-2 mb-10">
          <p className="text-sm text-gray-500 mb-4">What brought you here?</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ARCHETYPES.map((arch) => {
              const isActive = activeArchetype === arch.id;
              return (
                <button
                  key={arch.id}
                  onClick={() => {
                    const newValue = activeArchetype === arch.id ? null : arch.id;
                    setActiveArchetype(newValue);
                    // Scroll response panel into view after a brief render delay
                    if (newValue) {
                      setTimeout(() => {
                        responseRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }, 50);
                    }
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 group ${
                    isActive
                      ? "bg-white border-primary-300 shadow-md ring-1 ring-primary-200"
                      : "bg-white/60 border-gray-200 hover:border-gray-300 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className={`mb-2.5 transition-opacity ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`}>
                    {archetypeIcons[arch.id!]}
                  </div>
                  <p className={`text-sm font-semibold leading-snug transition-colors ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                    {arch.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {arch.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ─── Archetype Response Panel — matching programs shown RIGHT HERE ─── */}
          <div ref={responseRef}>
            {selectedArchetype && (() => {
              const matchingPrograms = programs.filter((p) => programMatchesArchetype(p, selectedArchetype));
              const displayPrograms = matchingPrograms.slice(0, 4);

              return (
                <div className="mt-5 p-5 md:p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  {/* Response message */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-5">
                    {archetypeResponses[selectedArchetype.id!] || ""}
                  </p>

                  {/* Matching program cards */}
                  {displayPrograms.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {displayPrograms.map((program) => (
                        <Link
                          key={program.id}
                          href={`/senior-benefits/${state.id}/${program.id}`}
                          className="group flex items-start justify-between gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug truncate">
                                {program.shortName || program.name}
                              </p>
                              {program.programType && <TypeBadge type={program.programType} />}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {program.tagline || program.description}
                            </p>
                            {program.savingsRange && (
                              <p className="text-xs text-emerald-600 font-medium mt-1.5">
                                Saves up to {program.savingsRange}
                              </p>
                            )}
                          </div>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-400 shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No exact matches found. Browse all {programs.length} programs below.</p>
                  )}

                  {/* Footer: count + show all */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      {matchingPrograms.length} of {programs.length} programs match
                    </p>
                    <button
                      onClick={() => setActiveArchetype(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                      Show all programs
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* ─── Intro prose ─── */}
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <div className="text-lg text-gray-600 leading-relaxed space-y-4">
            {/* Show shortened intro when archetype is active */}
            {overview.intro.split("\n\n").slice(0, activeArchetype ? 1 : undefined).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        {/* ─── Quick orientation strip ─── */}
        <section className="max-w-3xl mx-auto px-6 lg:px-8 mt-10">
          <div className="flex flex-wrap gap-6 md:gap-10">
            {topSavings?.savingsRange && (
              <div>
                <p className="text-xl font-bold text-gray-900 font-serif">
                  {topSavings.savingsRange.match(/\$[\d,]+/)?.[0] || topSavings.savingsRange}+
                </p>
                <p className="text-xs text-gray-400 mt-0.5">potential savings</p>
              </div>
            )}
            <div>
              <p className="text-xl font-bold text-gray-900 font-serif">{programs.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">programs available</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 font-serif">Free</p>
              <p className="text-xs text-gray-400 mt-0.5">to apply for all</p>
            </div>
            {resourceCount > 0 && (
              <div>
                <p className="text-xl font-bold text-gray-900 font-serif">{resourceCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">free resources</p>
              </div>
            )}
          </div>
        </section>

        <WavyDivider className="my-12 max-w-3xl mx-auto px-6" />

        {/* ─── Where to start ─── */}
        {overview.startHere && overview.startHere.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 lg:px-8">
            <SectionLabel>Where to start</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overview.startHere.map((pick, i) => {
                const program = programs.find((p) =>
                  p.id === pick.programId ||
                  p.name.toLowerCase().includes(pick.name.toLowerCase().slice(0, 20)) ||
                  pick.name.toLowerCase().includes(p.name.toLowerCase().slice(0, 20))
                );
                const highlighted = !selectedArchetype || (program && isProgramHighlighted(program));
                const cardClasses = `group relative flex flex-col p-5 rounded-2xl bg-white border transition-all duration-200 ${
                  highlighted
                    ? "border-gray-200 hover:border-primary-300 hover:shadow-md"
                    : "border-gray-100 opacity-50"
                }`;

                const cardContent = (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-vanilla-200 text-gray-500 text-xs font-semibold">
                        {i + 1}
                      </span>
                      {program && (
                        <div className="flex items-center gap-1.5">
                          {program.programType && <TypeBadge type={program.programType} />}
                          <SaveButton program={program} stateId={state.id} />
                        </div>
                      )}
                    </div>
                    <p className={`font-semibold leading-snug transition-colors ${program ? "text-gray-900 group-hover:text-primary-700" : "text-gray-900"}`}>
                      {pick.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed flex-1">
                      {pick.why}
                    </p>
                    {program && (
                      <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Learn more
                        <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </>
                );

                // Only wrap in Link if the program has an actual page
                return program ? (
                  <Link key={i} href={`/senior-benefits/${state.id}/${program.id}`} className={cardClasses}>
                    {cardContent}
                  </Link>
                ) : (
                  <div key={i} className={`${cardClasses} cursor-default`}>
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Quick facts ─── */}
        {overview.quickFacts && overview.quickFacts.length > 0 && !activeArchetype && (
          <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-14">
            <SectionLabel>Good to know</SectionLabel>
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

        {/* ─── Mini benefits check ─── */}
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-14">
          <div className="rounded-2xl bg-vanilla-200/60 border border-vanilla-300/50 p-6 md:p-8">
            <p className="text-sm font-semibold text-gray-900 mb-1">Not sure which programs apply?</p>
            <p className="text-sm text-gray-500 mb-5">Answer a few questions to see what your loved one may qualify for.</p>
            <Link
              href="/benefits/finder"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Check eligibility
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ─── Dark stat band ─── */}
        <section className="mt-16 mb-16 bg-gray-900 py-10 md:py-12">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
              <div>
                <span className="text-display-sm md:text-display-md font-bold text-white font-serif">{programs.length}</span>
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
                <span className="text-display-sm md:text-display-md font-bold text-white font-serif">{benefitCount}</span>
                <span className="text-gray-400 text-sm ml-2">{benefitCount === 1 ? "benefit" : "benefits"}</span>
              </div>
              {resourceCount > 0 && (
                <div>
                  <span className="text-display-sm md:text-display-md font-bold text-white font-serif">{resourceCount}</span>
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

        {/* ─── Browse by what you need ─── */}
        {overview.byNeed && overview.byNeed.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 lg:px-8">
            <SectionLabel>Browse by what you need</SectionLabel>
            <div className="space-y-6">
              {overview.byNeed.map((group, i) => {
                const icon = getNeedIcon(group.need);
                const highlighted = !selectedArchetype || needMatchesArchetype(group.need, selectedArchetype);

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100 transition-opacity duration-200 ${
                      highlighted ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">{icon}</div>
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
                              href={`/senior-benefits/${state.id}/${program.id}`}
                              className="text-xs font-medium text-primary-700 hover:text-primary-500 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-full transition-colors"
                            >
                              {program.shortName || program.name}
                            </Link>
                          ) : (
                            <span key={j} className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">{name}</span>
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

        {/* ─── Provider bridge ─── */}
        <section className="max-w-3xl mx-auto px-6 lg:px-8 mb-16">
          <SectionLabel>Find care providers in {state.name}</SectionLabel>
          <p className="text-sm text-gray-500 mb-5 -mt-2">
            These programs pay for services. Here are providers who deliver them.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Home Care", desc: "Non-medical help at home", type: "home-care" },
              { label: "Home Health", desc: "Skilled nursing at home", type: "home-health" },
              { label: "Assisted Living", desc: "Residential care communities", type: "assisted-living" },
              { label: "Nursing Homes", desc: "24/7 skilled nursing", type: "nursing-homes" },
            ].map((cat) => (
              <Link
                key={cat.type}
                href={`/browse?type=${cat.type}&location=${encodeURIComponent(state.name)}`}
                className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{cat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-500 shrink-0 transition-all group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
          <Link
            href={`/browse?location=${encodeURIComponent(state.name)}`}
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            Browse all providers in {state.name}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </section>

        {/* ─── All programs directory ─── */}
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <SectionLabel>All {programs.length} programs</SectionLabel>
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
                    <h2 className="text-base font-semibold text-gray-900">{info.label}</h2>
                    <span className="text-xs text-gray-400 font-medium">{group.length}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{info.description}</p>
                  <div className="bg-white rounded-xl border border-gray-100 px-3">
                    {displayItems.map((program) => {
                      const highlighted = isProgramHighlighted(program);
                      return (
                        <Link
                          key={program.id}
                          href={`/senior-benefits/${state.id}/${program.id}`}
                          className={`group flex items-center gap-3 py-4 border-b border-gray-100 last:border-0 transition-all -mx-1 px-1 rounded-lg ${
                            highlighted ? "opacity-100 hover:bg-vanilla-50/50" : "opacity-35"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
                                {program.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed mt-0.5 line-clamp-1">
                              {program.tagline || program.description}
                            </p>
                            {program.savingsRange && (
                              <p className="text-xs text-emerald-600 font-medium mt-1">
                                Saves up to {program.savingsRange}
                              </p>
                            )}
                          </div>
                          <SaveButton program={program} stateId={state.id} />
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-500 shrink-0 transition-all group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      );
                    })}
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

        <WavyDivider className="my-16 max-w-3xl mx-auto px-6" />

        {/* ─── Footer elements ─── */}
        <section className="max-w-2xl mx-auto px-6 lg:px-8 space-y-8">
          {/* Share with family */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">Researching for someone else?</p>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `Senior Benefits in ${state.name}`, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share with a family member
            </button>
          </div>

          {/* Explore other states */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">Looking at other states?</p>
            <Link href="/senior-benefits" className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors">
              Explore all 50 states &rarr;
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
