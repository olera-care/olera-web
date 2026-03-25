"use client";

import { useRef, useEffect } from "react";
import { useCareProfile } from "@/lib/benefits/care-profile-context";
import { useSavedPrograms } from "@/hooks/use-saved-programs";
import { getEstimatedSavings } from "@/lib/types/benefits";
import MilestoneProgress from "@/components/benefits/MilestoneProgress";

export default function CareProfileSidebar() {
  const { pageState, result, previewCount, locationDisplay, goToStep, reset } = useCareProfile();
  const { savedCount } = useSavedPrograms();
  const prevCount = useRef(previewCount);
  const countRef = useRef<HTMLSpanElement>(null);

  const matchCount = result?.matchedPrograms?.length ?? 0;

  // Subtle pulse animation when preview count changes
  useEffect(() => {
    if (previewCount !== null && previewCount !== prevCount.current && countRef.current) {
      countRef.current.classList.remove("animate-count-pulse");
      void countRef.current.offsetWidth;
      countRef.current.classList.add("animate-count-pulse");
    }
    prevCount.current = previewCount;
  }, [previewCount]);

  // Compute savings for results state
  let totalAnnual = 0;
  if (pageState === "results" && result) {
    let totalMonthly = 0;
    for (const m of result.matchedPrograms) {
      const s = getEstimatedSavings(m.program.name);
      if (s) totalMonthly += s.monthly;
    }
    totalAnnual = totalMonthly * 12;
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">
      {/* Header */}
      <p className="text-xs font-medium text-gray-400 mb-6 tracking-widest uppercase">
        Care Profile
      </p>

      {/* Milestone progress (full steps during intake, compact summary during results) */}
      <div className="pb-2">
        <MilestoneProgress />
      </div>

      {/* Live preview (during intake) */}
      {pageState === "intake" && previewCount !== null && (
        <div className="mt-6 pt-5 border-t border-vanilla-200" aria-live="polite" aria-atomic="true">
          <div className="relative overflow-hidden rounded-xl bg-primary-50/60 border border-primary-100 p-4">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full animate-[sidebar-shimmer_2s_ease-in-out_infinite]" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)" }} />

            <div className="relative flex items-center gap-3 mb-3">
              <div className="relative flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary-400 animate-ping" />
              </div>
              <div>
                <span
                  ref={countRef}
                  className="font-display text-2xl font-bold text-gray-900 leading-none"
                >
                  {previewCount}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  program{previewCount !== 1 ? "s" : ""} may match
                </p>
              </div>
            </div>

            {/* Searching text with spinner */}
            <div className="relative flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-primary-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-[11px] text-gray-400">Searching for programs you qualify for</p>
            </div>
          </div>

          <style>{`
            @keyframes sidebar-shimmer {
              0% { transform: translateX(-100%); }
              60% { transform: translateX(100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}

      {/* ═══ Results sidebar ═══ */}
      {pageState === "results" && matchCount > 0 && (
        <div className="mt-5 pt-5 border-t border-vanilla-200">
          {/* Savings-first card */}
          <div className="rounded-2xl bg-white border border-primary-100 p-5 shadow-sm">
            {totalAnnual > 0 && (
              <p className="font-display text-3xl font-bold text-primary-600 leading-none mb-1">
                ${totalAnnual.toLocaleString()}/yr
              </p>
            )}
            <p className="text-sm text-gray-500">
              {matchCount} programs found
              {locationDisplay && <><br /><span className="whitespace-nowrap">in {locationDisplay}</span></>}
            </p>

            {savedCount > 0 && (
              <div className="flex items-center gap-1.5 mt-3">
                <svg className="w-3.5 h-3.5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-xs font-medium text-primary-600">{savedCount} saved</span>
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("benefits:switch-tab", { detail: "programs" }));
              const el = document.getElementById("benefits-report-tabs");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-700 text-white text-sm font-semibold rounded-xl border-none cursor-pointer hover:bg-primary-800 transition-colors shadow-sm min-h-[48px]"
          >
            View my programs
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          {/* Edit answers — small muted link */}
          <button
            onClick={() => goToStep(0)}
            className="mt-2 w-full text-xs text-gray-400 hover:text-primary-600 bg-transparent border-none cursor-pointer transition-colors py-1 text-center"
          >
            Edit answers
          </button>

          {/* Start over — smallest possible */}
          <button
            onClick={reset}
            className="mt-0.5 w-full text-[10px] text-gray-300 hover:text-gray-400 bg-transparent border-none cursor-pointer transition-colors py-0.5 text-center"
          >
            Start over
          </button>
        </div>
      )}

      {/* App download nudge */}
      <div className="mt-auto pt-8">
        <div className="border-t border-vanilla-200 pt-5">
          <p className="text-sm text-gray-500 leading-relaxed mb-3">
            Benefits on the go, plus voice&nbsp;mode.
          </p>
          <a
            href="https://apps.apple.com/us/app/olera/id6756663292"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <img
              src="/images/app-store-badge.png"
              alt="Download on the App Store"
              className="h-10 w-auto"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
