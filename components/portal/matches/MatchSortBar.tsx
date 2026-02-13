"use client";

import { useState, useRef, useEffect } from "react";

type SortOption = "relevance" | "closest" | "highest_rated";

interface MatchSortBarProps {
  matchCount: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "closest", label: "Closest" },
  { value: "highest_rated", label: "Highest rated" },
];

export default function MatchSortBar({
  matchCount,
  sort,
  onSortChange,
}: MatchSortBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Relevance";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="flex items-center justify-between mb-5">
      <p className="text-sm text-gray-500">
        {matchCount} provider{matchCount !== 1 ? "s" : ""} matched to your
        profile
      </p>

      {/* Sort dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
        >
          Sort: {currentLabel}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-20">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSortChange(opt.value);
                  setOpen(false);
                }}
                className={[
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  sort === opt.value
                    ? "text-primary-600 bg-primary-50 font-medium"
                    : "text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
