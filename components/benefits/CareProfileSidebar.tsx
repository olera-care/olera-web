"use client";

import { useRef, useEffect } from "react";
import { useCareProfile } from "@/lib/benefits/care-profile-context";
import MilestoneProgress from "@/components/benefits/MilestoneProgress";

export default function CareProfileSidebar() {
  const { pageState, result, previewCount, goToStep, reset } = useCareProfile();
  const prevCount = useRef(previewCount);
  const countRef = useRef<HTMLSpanElement>(null);

  const matchCount = result?.matchedPrograms?.length ?? 0;

  // Subtle pulse animation when preview count changes
  useEffect(() => {
    if (previewCount !== null && previewCount !== prevCount.current && countRef.current) {
      countRef.current.classList.remove("animate-count-pulse");
      // Force reflow to restart animation
      void countRef.current.offsetWidth;
      countRef.current.classList.add("animate-count-pulse");
    }
    prevCount.current = previewCount;
  }, [previewCount]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-vanilla-50 px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900">Care Profile</h2>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          {pageState === "results"
            ? "Your completed care profile is shown below."
            : "Each answer helps us find the right programs for you."}
        </p>
      </div>

      {/* Milestone progress */}
      <div className="px-6 pt-5 pb-2">
        <MilestoneProgress />
      </div>

      {/* Live preview (during intake) */}
      {pageState === "intake" && previewCount !== null && (
        <div className="mx-6 mb-5" aria-live="polite" aria-atomic="true">
          <div className="bg-vanilla-100 rounded-xl px-4 py-3 border border-vanilla-200">
            <p className="text-sm font-medium text-gray-700">
              <span
                ref={countRef}
                className="text-primary-700 font-bold tabular-nums"
              >
                {previewCount}
              </span>{" "}
              program{previewCount !== 1 ? "s" : ""} may match
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              Complete all steps for personalized results
            </p>
          </div>
        </div>
      )}

      {/* Results summary */}
      {pageState === "results" && matchCount > 0 && (
        <div className="mx-6 mb-4">
          <div className="bg-primary-50 rounded-xl px-4 py-3 border border-primary-100">
            <p className="text-sm font-semibold text-primary-800">
              {matchCount} program{matchCount !== 1 ? "s" : ""} matched
            </p>
            <p className="text-[11px] text-primary-600 mt-0.5">
              Based on your completed care profile
            </p>
          </div>
        </div>
      )}

      {/* Results actions */}
      {pageState === "results" && (
        <div className="px-6 pb-5 pt-1 border-t border-gray-100 flex flex-col gap-2">
          <button
            onClick={() => goToStep(0)}
            className="w-full text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg py-2.5 min-h-[44px] transition-colors cursor-pointer bg-transparent border-none"
            aria-label="Edit your care profile answers"
          >
            Edit answers
          </button>
          <button
            onClick={reset}
            className="w-full text-xs text-gray-400 hover:text-gray-600 rounded-lg py-2 min-h-[44px] transition-colors cursor-pointer bg-transparent border-none"
            aria-label="Start over with a new care profile"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
