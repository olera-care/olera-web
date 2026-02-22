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
      {/* Header — minimal, no container */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
          Care Profile
        </h2>
      </div>

      {/* Milestone progress */}
      <div className="pb-2">
        <MilestoneProgress />
      </div>

      {/* Live preview (during intake) */}
      {pageState === "intake" && previewCount !== null && (
        <div className="mt-4 pt-4 border-t border-gray-100" aria-live="polite" aria-atomic="true">
          <p className="text-sm text-gray-600">
            <span
              ref={countRef}
              className="text-gray-900 font-semibold tabular-nums"
            >
              {previewCount}
            </span>{" "}
            program{previewCount !== 1 ? "s" : ""} may match
          </p>
        </div>
      )}

      {/* Results summary */}
      {pageState === "results" && matchCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            <span className="text-gray-900 font-semibold">{matchCount}</span>{" "}
            program{matchCount !== 1 ? "s" : ""} matched
          </p>
        </div>
      )}

      {/* Results actions */}
      {pageState === "results" && (
        <div className="mt-4 flex flex-col gap-1">
          <button
            onClick={() => goToStep(0)}
            className="w-full text-sm font-medium text-primary-600 hover:text-primary-700 rounded-lg py-2 min-h-[44px] transition-colors cursor-pointer bg-transparent border-none text-left"
            aria-label="Edit your care profile answers"
          >
            Edit answers
          </button>
          <button
            onClick={reset}
            className="w-full text-xs text-gray-400 hover:text-gray-600 rounded-lg py-1.5 min-h-[44px] transition-colors cursor-pointer bg-transparent border-none text-left"
            aria-label="Start over with a new care profile"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
