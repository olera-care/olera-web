"use client";

import { useCallback } from "react";

interface MatchesTabsProps {
  activeTab: "recommended" | "interested";
  onTabChange: (tab: "recommended" | "interested") => void;
  interestedCount: number;
}

export default function MatchesTabs({
  activeTab,
  onTabChange,
  interestedCount,
}: MatchesTabsProps) {
  // Handle keyboard navigation between tabs
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentTab: "recommended" | "interested") => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const nextTab = currentTab === "recommended" ? "interested" : "recommended";
        onTabChange(nextTab);
        // Focus the newly selected tab
        const tabId = nextTab === "recommended" ? "tab-recommended" : "tab-interested";
        document.getElementById(tabId)?.focus();
      }
    },
    [onTabChange]
  );

  return (
    <div
      role="tablist"
      aria-label="Match categories"
      className="flex gap-1 p-1.5 bg-warm-50/60 rounded-2xl border border-warm-100/60 mb-6"
    >
      <button
        id="tab-recommended"
        type="button"
        role="tab"
        aria-selected={activeTab === "recommended"}
        aria-controls="tabpanel-recommended"
        tabIndex={activeTab === "recommended" ? 0 : -1}
        onClick={() => onTabChange("recommended")}
        onKeyDown={(e) => handleKeyDown(e, "recommended")}
        className={[
          "flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-[14px] font-semibold transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
          activeTab === "recommended"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700 hover:bg-white/50",
        ].join(" ")}
      >
        Recommended
      </button>
      <button
        id="tab-interested"
        type="button"
        role="tab"
        aria-selected={activeTab === "interested"}
        aria-controls="tabpanel-interested"
        tabIndex={activeTab === "interested" ? 0 : -1}
        onClick={() => onTabChange("interested")}
        onKeyDown={(e) => handleKeyDown(e, "interested")}
        className={[
          "flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-[14px] font-semibold transition-all duration-200 flex items-center justify-center gap-2",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
          activeTab === "interested"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700 hover:bg-white/50",
        ].join(" ")}
      >
        Interested
        {interestedCount > 0 && (
          <span
            className={[
              "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold transition-colors duration-200",
              activeTab === "interested"
                ? "bg-primary-100 text-primary-700"
                : "bg-primary-500 text-white",
            ].join(" ")}
          >
            {interestedCount > 99 ? "99+" : interestedCount}
          </span>
        )}
      </button>
    </div>
  );
}
