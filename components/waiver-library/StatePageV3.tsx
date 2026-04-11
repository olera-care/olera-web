"use client";

import Link from "next/link";
import type { StateData, WaiverProgram } from "@/data/waiver-library";
import type { PipelineStateOverview } from "@/data/pipeline-drafts";
import { useState, useRef } from "react";
import { useSavedPrograms, type SaveProgramData } from "@/hooks/use-saved-programs";
import { getCategory, type Category } from "@/lib/waiver-category";
import { House, CurrencyDollar, Compass, HandHeart, BookmarkSimple, ShareNetwork, Calculator, ArrowRight, CaretRight } from "@phosphor-icons/react";
import { ProgramIcon } from "@/lib/program-icon";

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
}

const ARCHETYPES: Archetype[] = [
  {
    id: "home",
    title: "Help staying home",
    subtitle: "My loved one needs care at home but we can't afford it",
    keywords: ["home", "waiver", "hcbs", "attendant", "personal care", "community", "pace", "choice", "alternatives"],

  },
  {
    id: "paying",
    title: "Help paying for care",
    subtitle: "We need help covering medical or living costs",
    keywords: ["medicaid", "medicare", "savings", "snap", "food", "energy", "liheap", "weatherization", "financial"],

  },
  {
    id: "start",
    title: "I don't know where to start",
    subtitle: "My loved one needs help and I'm overwhelmed",
    keywords: ["ship", "shine", "navigator", "counseling", "information", "cafе", "micafe", "options"],

  },
  {
    id: "caregiver",
    title: "Support for me as caregiver",
    subtitle: "I'm burning out and need help or a break",
    keywords: ["respite", "caregiver", "companion", "support", "ombudsman", "legal"],

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

// Archetype icons — Phosphor icons in the Olera teal palette
const archetypeIcons: Record<string, React.ReactNode> = {
  home: <House size={32} weight="duotone" color="#417272" aria-hidden="true" />,
  paying: <CurrencyDollar size={32} weight="duotone" color="#417272" aria-hidden="true" />,
  start: <Compass size={32} weight="duotone" color="#417272" aria-hidden="true" />,
  caregiver: <HandHeart size={32} weight="duotone" color="#417272" aria-hidden="true" />,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Shared atoms
// ═══════════════════════════════════════════════════════════════════════════════

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 mb-4">
      {children}
    </h2>
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
      <BookmarkSimple
        className={`w-4 h-4 transition-colors ${saved ? "text-primary-600" : "text-gray-300 hover:text-gray-400"}`}
        weight={saved ? "fill" : "regular"}
      />
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
// Inline Benefits Check — the tool that turns readers into participants
// ═══════════════════════════════════════════════════════════════════════════════

function InlineBenefitsCheck({ programs, stateId, stateName }: { programs: WaiverProgram[]; stateId: string; stateName: string }) {
  const [age, setAge] = useState("");
  const [medicaid, setMedicaid] = useState<"yes" | "no" | "not-sure" | "">("");
  const [submitted, setSubmitted] = useState(false);

  // Simple client-side matching based on program eligibility data
  const matchingPrograms = submitted ? programs.filter((p) => {
    if (!age && !medicaid) return true;

    const ageNum = parseInt(age);
    const elig = p.structuredEligibility;

    // Age check
    if (ageNum && elig?.ageRequirement) {
      const ageReq = parseInt(elig.ageRequirement);
      if (ageReq && ageNum < ageReq) return false;
    }

    // Medicaid check — if "no", filter out programs that require Medicaid
    if (medicaid === "no") {
      const isMedicaid = `${p.name} ${p.tagline || ""}`.toLowerCase();
      if (isMedicaid.includes("medicaid") && !isMedicaid.includes("savings")) return false;
    }

    // Resources/navigators are available to everyone
    if (p.programType === "resource" || p.programType === "navigator") return true;

    return true;
  }) : [];

  const hasInput = age || medicaid;

  return (
    <div className="rounded-2xl bg-vanilla-200/60 border border-vanilla-300/50 p-6 md:p-8">
      <p className="text-xl font-bold text-gray-900 mb-5">See what you qualify for</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        {/* Age */}
        <div className="flex-1">
          <label className="text-sm text-gray-600 mb-1.5 block">Loved one&apos;s age</label>
          <input
            type="number"
            placeholder="e.g. 72"
            value={age}
            onChange={(e) => { setAge(e.target.value); setSubmitted(false); }}
            className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-primary-300 focus:ring-1 focus:ring-primary-200 outline-none transition-colors"
          />
        </div>

        {/* Medicaid */}
        <div className="flex-1">
          <label className="text-sm text-gray-600 mb-1.5 block">On Medicaid?</label>
          <select
            value={medicaid}
            onChange={(e) => { setMedicaid(e.target.value as typeof medicaid); setSubmitted(false); }}
            className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-primary-300 focus:ring-1 focus:ring-primary-200 outline-none transition-colors"
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="not-sure">Not sure</option>
          </select>
        </div>

        {/* Check button */}
        <div className="flex items-end">
          <button
            onClick={() => setSubmitted(true)}
            disabled={!hasInput}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              hasInput
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Check
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400">Rough estimate based on basic eligibility criteria.</p>

      {/* Results */}
      {submitted && hasInput && (
        <div className="pt-4 border-t border-vanilla-300/50">
          <p className="text-base text-gray-700">
            Your loved one may qualify for{" "}
            <span className="font-bold text-gray-900">{matchingPrograms.length} of {programs.length} programs</span>
            {" "}in {stateName}.
          </p>
          {matchingPrograms.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {matchingPrograms.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/senior-benefits/${stateId}/${p.id}`}
                  className="text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  {p.shortName}
                </Link>
              ))}
              {matchingPrograms.length > 5 && (
                <span className="text-xs text-gray-400 px-2 py-1.5">+{matchingPrograms.length - 5} more</span>
              )}
            </div>
          )}
          <Link
            href="/benefits/finder"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            Get a detailed assessment
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════

// Lightweight pipeline program reference for linking (avoids bundling full pipeline-drafts.ts)
interface PipelineProgramRef {
  id: string;
  name: string;
  shortName: string;
}

interface FamilyQuestion {
  question: string;
  answer: string;
  providerName: string;
  answeredAt: string;
  providerSlug?: string;
}

interface StatePageV3Props {
  state: StateData;
  overview: PipelineStateOverview;
  pipelinePrograms?: PipelineProgramRef[];
  familyQuestions?: FamilyQuestion[];
}


export function StatePageV3({ state, overview, pipelinePrograms = [], familyQuestions = [] }: StatePageV3Props) {
  const [activeArchetype, setActiveArchetype] = useState<ArchetypeId>(null);
  const [showAll, setShowAll] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const responseRef = useRef<HTMLDivElement>(null);
  const programs = state.programs;

  // Find a program by name — checks waiver-library first, then pipeline
  function findProgramByName(name: string): { id: string; program?: WaiverProgram } | null {
    const lower = name.toLowerCase().slice(0, 20);
    const wlMatch = programs.find((p) =>
      p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase().slice(0, 20))
    );
    if (wlMatch) return { id: wlMatch.id, program: wlMatch };

    const plMatch = pipelinePrograms.find((p) =>
      p.name.toLowerCase().includes(lower) || p.shortName.toLowerCase().includes(lower) ||
      lower.includes(p.name.toLowerCase().slice(0, 20))
    );
    if (plMatch) return { id: plMatch.id };

    return null;
  }


  // Compute stats
  const benefitCount = programs.filter((p) => (p.programType || "benefit") === "benefit").length;
  const resourceCount = programs.filter((p) => p.programType === "resource" || p.programType === "navigator").length;
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
          <p className="text-base text-gray-500 mb-4">What brought you here?</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
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
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 group flex flex-col ${
                    isActive
                      ? "bg-white border-primary-300 shadow-md ring-1 ring-primary-200"
                      : "bg-white/60 border-gray-200 hover:border-gray-300 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className={`mb-2.5 transition-opacity shrink-0 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`}>
                    {archetypeIcons[arch.id!]}
                  </div>
                  <p className={`text-base font-semibold leading-snug transition-colors ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                    {arch.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed flex-1">
                    {arch.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ─── Archetype Response Panel ─── */}
          <div ref={responseRef}>
            {selectedArchetype && (() => {
              const matchingPrograms = programs.filter((p) => programMatchesArchetype(p, selectedArchetype));
              // Sort by savings (highest first) so the most impactful program leads
              const sorted = [...matchingPrograms].sort((a, b) => {
                const aVal = parseInt(a.savingsRange?.match(/[\d,]+/)?.[0]?.replace(",", "") || "0");
                const bVal = parseInt(b.savingsRange?.match(/[\d,]+/)?.[0]?.replace(",", "") || "0");
                return bVal - aVal;
              });
              const displayPrograms = sorted.slice(0, 4);

              return (
                <div className="mt-5 pl-5 border-l-2 border-primary-300">
                  {/* Response message — warm, confident */}
                  <p className="text-lg text-gray-700 leading-relaxed font-serif mb-5">
                    {archetypeResponses[selectedArchetype.id!] || ""}
                  </p>

                  {/* Matching programs — clean list, not boxed cards */}
                  {displayPrograms.length > 0 && (
                    <div className="space-y-3 mb-5">
                      {displayPrograms.map((program, idx) => (
                        <Link
                          key={program.id}
                          href={`/senior-benefits/${state.id}/${program.id}`}
                          className="group block py-3 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-base font-semibold group-hover:text-primary-700 transition-colors leading-snug ${idx === 0 ? "text-gray-900" : "text-gray-700"}`}>
                                  {program.shortName || program.name}
                                </p>
                                {program.programType && <TypeBadge type={program.programType} />}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{program.tagline || program.description}</p>
                            </div>
                            {program.savingsRange ? (
                              <span className={`text-sm font-semibold shrink-0 ${idx === 0 ? "text-emerald-600" : "text-gray-500"}`}>
                                {program.savingsRange.match(/\$[\d,]+/)?.[0] || program.savingsRange}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 shrink-0">Free</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {displayPrograms.length === 0 && (
                    <p className="text-sm text-gray-400 mb-5">No exact matches found. Browse all {programs.length} programs below.</p>
                  )}

                  {/* Contextual tool — spend-down calculator for "paying" archetype */}
                  {selectedArchetype.id === "paying" && (
                    <Link
                      href="/benefits/spend-down-calculator"
                      className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 transition-colors group"
                    >
                      <Calculator className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                        <span className="font-medium">Spend-down calculator</span>
                        <span className="text-gray-400"> — check if assets affect eligibility</span>
                      </p>
                    </Link>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">
                      Showing {matchingPrograms.length} of {programs.length} programs
                    </span>
                    <button
                      onClick={() => setActiveArchetype(null)}
                      className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
                    >
                      See all {programs.length} →
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

        <WavyDivider className="my-12 max-w-3xl mx-auto px-6" />

        {/* ─── Where to start (hidden when archetype active — response panel already shows relevant programs) ─── */}
        {!activeArchetype && overview.startHere && overview.startHere.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 lg:px-8">
            <SectionLabel>Where to start</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overview.startHere.map((pick, i) => {
                // Find the program by name across waiver-library + pipeline
                const match = findProgramByName(pick.name);
                const program = match?.program;
                const href = match
                  ? `/senior-benefits/${state.id}/${match.id}`
                  : `/senior-benefits/${state.id}`;
                const highlighted = !selectedArchetype || !match || (program && isProgramHighlighted(program));

                return (
                  <Link
                    key={i}
                    href={href}
                    className={`group relative flex flex-col p-5 rounded-2xl bg-white border transition-all duration-200 ${
                      highlighted
                        ? "border-gray-200 hover:border-primary-300 hover:shadow-md"
                        : "border-gray-100 opacity-50"
                    }`}
                  >
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
                    <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
                      {pick.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed flex-1">
                      {pick.why}
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more
                      <CaretRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Quick facts ─── */}
        {!activeArchetype && overview.quickFacts && overview.quickFacts.length > 0 && (
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

        {/* ─── Inline benefits check ─── */}
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-14">
          <InlineBenefitsCheck programs={programs} stateId={state.id} stateName={state.name} />
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

        <WavyDivider className="my-14 max-w-3xl mx-auto px-6" />

        {/* ─── Provider bridge — minimal, Perena-style ─── */}
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mb-14">
          <p className="text-base text-gray-500 mb-4">
            These programs pay for care services.{" "}
            <Link
              href={`/browse?location=${encodeURIComponent(state.name)}`}
              className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
            >
              Find providers in {state.name} →
            </Link>
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Home Care", type: "home-care" },
              { label: "Home Health", type: "home-health" },
              { label: "Assisted Living", type: "assisted-living" },
              { label: "Nursing Homes", type: "nursing-homes" },
            ].map((cat) => (
              <Link
                key={cat.type}
                href={`/browse?type=${cat.type}&location=${encodeURIComponent(state.name)}`}
                className="text-sm font-medium text-gray-600 hover:text-primary-700 bg-white hover:bg-primary-50 border border-gray-200 hover:border-primary-200 px-3.5 py-2 rounded-full transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ─── Families are asking — clean, no card wrappers ─── */}
        {familyQuestions.length > 0 && (
          <section className="max-w-2xl mx-auto px-6 lg:px-8 mb-14">
            <SectionLabel>Families are asking</SectionLabel>
            <div className="space-y-6">
              {familyQuestions.slice(0, 3).map((q, i) => {
                const content = (
                  <>
                    <p className="text-base font-semibold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors">{q.question}</p>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">{q.answer}</p>
                    <p className="text-sm text-gray-400 mt-2">— {q.providerName}</p>
                  </>
                );

                return q.providerSlug ? (
                  <a
                    key={i}
                    href={`/provider/${q.providerSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block pb-6 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={i} className="group pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                    {content}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── All programs with category pills ─── */}
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <SectionLabel>All {programs.length} programs</SectionLabel>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {([
              { id: "all" as const, label: "All" },
              { id: "health" as const, label: "Health Coverage" },
              { id: "financial" as const, label: "Financial Help" },
              { id: "food" as const, label: "Food & Nutrition" },
              { id: "caregiver" as const, label: "Caregiver Support" },
            ] as const).map((cat) => {
              const isActive = categoryFilter === cat.id;
              const count = cat.id === "all"
                ? programs.length
                : programs.filter((p) => getCategory(p) === cat.id).length;

              if (cat.id !== "all" && count === 0) return null;

              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900"
                  }`}
                >
                  {cat.label}
                  {!isActive && <span className="text-gray-400 ml-1.5">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Filtered program list */}
          <div>
            {(() => {
              const filtered = categoryFilter === "all"
                ? programs
                : programs.filter((p) => getCategory(p) === categoryFilter);

              const displayed = showAll ? filtered : filtered.slice(0, 8);
              const hasMore = !showAll && filtered.length > 8;

              return (
                <>
                  {displayed.map((program) => {
                    const highlighted = isProgramHighlighted(program);
                    return (
                      <Link
                        key={program.id}
                        href={`/senior-benefits/${state.id}/${program.id}`}
                        className={`group flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0 transition-opacity ${
                          highlighted ? "opacity-100" : "opacity-30"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-base font-medium text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
                            {program.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                            {program.tagline || program.description}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-500 shrink-0 mt-0.5 tabular-nums">
                          {program.savingsRange ? program.savingsRange.match(/\$[\d,]+/)?.[0] || program.savingsRange : "Free"}
                        </span>
                      </Link>
                    );
                  })}
                  {hasMore && (
                    <button
                      onClick={() => setShowAll(true)}
                      className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    >
                      Show all {filtered.length} programs →
                    </button>
                  )}
                  {displayed.length === 0 && (
                    <p className="text-sm text-gray-400 py-4">No programs in this category.</p>
                  )}
                </>
              );
            })()}
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
              <ShareNetwork className="w-3.5 h-3.5" />
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
