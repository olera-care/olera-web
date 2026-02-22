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
    <div>
      {/* Header */}
      <p className="text-text-xs font-medium text-gray-400 mb-6 tracking-widest uppercase">
        Care Profile
      </p>

      {/* Milestone progress */}
      <div className="pb-2">
        <MilestoneProgress />
      </div>

      {/* Live preview (during intake) */}
      {pageState === "intake" && previewCount !== null && (
        <div className="mt-6 pt-5 border-t border-vanilla-200" aria-live="polite" aria-atomic="true">
          <p className="text-text-sm text-gray-500">
            <span
              ref={countRef}
              className="font-display text-display-xs font-medium text-gray-900"
            >
              {previewCount}
            </span>
            <br />
            program{previewCount !== 1 ? "s" : ""} may match
          </p>
        </div>
      )}

      {/* Results summary */}
      {pageState === "results" && matchCount > 0 && (
        <div className="mt-6 pt-5 border-t border-vanilla-200">
          <p className="text-text-sm text-gray-500">
            <span className="font-display text-display-xs font-medium text-gray-900">
              {matchCount}
            </span>
            <br />
            program{matchCount !== 1 ? "s" : ""} matched
          </p>
        </div>
      )}

      {/* Results actions */}
      {pageState === "results" && (
        <div className="mt-5 flex flex-col gap-1">
          <button
            onClick={() => goToStep(0)}
            className="w-full text-text-sm font-medium text-gray-500 hover:text-gray-900 rounded-lg py-2 min-h-[44px] transition-colors cursor-pointer bg-transparent border-none text-left"
            aria-label="Edit your care profile answers"
          >
            Edit answers
          </button>
          <button
            onClick={reset}
            className="w-full text-text-xs text-gray-400 hover:text-gray-600 rounded-lg py-1.5 min-h-[44px] transition-colors cursor-pointer bg-transparent border-none text-left"
            aria-label="Start over with a new care profile"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
