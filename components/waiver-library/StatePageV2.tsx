"use client";

import Link from "next/link";
import type { StateData, WaiverProgram } from "@/data/waiver-library";
import type { PipelineStateOverview } from "@/data/pipeline-drafts";
import { useState } from "react";

interface StatePageV2Props {
  state: StateData;
  overview: PipelineStateOverview;
}

function ProgramCard({ program, stateId }: { program: WaiverProgram; stateId: string }) {
  const type = program.programType || "benefit";
  const typeStyles: Record<string, string> = {
    benefit: "bg-emerald-50 text-emerald-600",
    resource: "bg-blue-50 text-blue-600",
    navigator: "bg-violet-50 text-violet-600",
    employment: "bg-amber-50 text-amber-600",
  };

  return (
    <Link
      href={`/waiver-library/${stateId}/${program.id}`}
      className="group block py-4 border-b border-gray-100 last:border-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
              {program.name}
            </h3>
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ${typeStyles[type] || typeStyles.benefit}`}>
              {type}
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
            {program.tagline || program.description}
          </p>
          {program.savingsRange && (
            <p className="text-xs text-gray-400 mt-1">
              Estimated savings: <span className="font-medium text-gray-600">{program.savingsRange}</span>
            </p>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0 mt-1.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export function StatePageV2({ state, overview }: StatePageV2Props) {
  const [showAll, setShowAll] = useState(false);
  const programs = state.programs;
  const displayPrograms = showAll ? programs : programs.slice(0, 8);

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Header */}
      <header className="pt-6 pb-10 md:pt-8 md:pb-14">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <Link href="/waiver-library" className="hover:text-gray-600 transition-colors">Benefits Hub</Link>
            <span>&#8250;</span>
            <span className="text-gray-600">{state.name}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif leading-tight">
            Senior Benefits in {state.name}
          </h1>

          <p className="mt-2 text-gray-400 text-sm">
            {programs.length} programs available
          </p>
        </div>
      </header>

      <main className="pb-20">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 space-y-12">

          {/* Intro */}
          <section>
            <div className="text-lg text-gray-600 leading-relaxed space-y-4">
              {overview.intro.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {/* Start here */}
          {overview.startHere && overview.startHere.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-4">
                Where to start
              </p>
              <div className="space-y-3">
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
                      className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white transition-all"
                    >
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-semibold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                          {pick.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{pick.why}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0 mt-1.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Quick facts */}
          {overview.quickFacts && overview.quickFacts.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-3">
                Good to know
              </p>
              <div className="space-y-2">
                {overview.quickFacts.map((fact, i) => (
                  <p key={i} className="text-sm text-gray-600 leading-relaxed flex items-start gap-2.5">
                    <span className="text-gray-300 mt-0.5 shrink-0">&#8226;</span>
                    {fact}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Resources vs benefits explanation */}
          {overview.resourcesVsBenefits && (
            <section className="p-4 rounded-xl bg-blue-50/40 border border-blue-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                {overview.resourcesVsBenefits}
              </p>
            </section>
          )}

          {/* By need */}
          {overview.byNeed && overview.byNeed.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-4">
                Browse by what you need
              </p>
              <div className="space-y-4">
                {overview.byNeed.map((group, i) => (
                  <div key={i}>
                    <p className="font-medium text-gray-900">{group.need}</p>
                    <p className="text-sm text-gray-500 mt-0.5 mb-2">{group.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.programs.map((name, j) => {
                        const program = programs.find((p) =>
                          p.name.toLowerCase().includes(name.toLowerCase().slice(0, 20)) ||
                          name.toLowerCase().includes(p.name.toLowerCase().slice(0, 20))
                        );
                        return program ? (
                          <Link
                            key={j}
                            href={`/waiver-library/${state.id}/${program.id}`}
                            className="text-xs font-medium text-primary-600 hover:text-primary-500 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-full transition-colors"
                          >
                            {program.shortName || program.name}
                          </Link>
                        ) : (
                          <span key={j} className="text-xs text-gray-400 px-2.5 py-1">
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All programs */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
              All programs ({programs.length})
            </p>
            <div>
              {displayPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} stateId={state.id} />
              ))}
            </div>
            {!showAll && programs.length > 8 && (
              <button
                onClick={() => setShowAll(true)}
                className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Show all {programs.length} programs
              </button>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
