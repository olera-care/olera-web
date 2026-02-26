"use client";

import { useRef, useEffect } from "react";
import { useCareProfile } from "@/lib/benefits/care-profile-context";
import { useSavedPrograms } from "@/hooks/use-saved-programs";
import MilestoneProgress from "@/components/benefits/MilestoneProgress";

export default function CareProfileSidebar() {
  const { pageState, result, previewCount, goToStep, reset } = useCareProfile();
  const { savedCount } = useSavedPrograms();
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
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">
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
          {savedCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {savedCount} saved
            </p>
          )}
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

      {/* App download nudge */}
      <div className="mt-auto pt-8">
        <div className="border-t border-vanilla-200 pt-5">
          <p className="text-text-sm text-gray-500 leading-relaxed mb-3">
            Benefits on the go, plus voice&nbsp;mode.
          </p>
          <a
            href="https://apps.apple.com/us/app/olera/id6756663292"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-text-sm font-medium text-gray-900 hover:text-gray-600 no-underline transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Download for iPhone
          </a>
        </div>
      </div>
    </div>
  );
}
