"use client";

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
  return (
    <div className="flex items-center justify-between mb-5">
      <p className="text-xs text-gray-400">
        {matchCount} provider{matchCount !== 1 ? "s" : ""} matched to your
        profile
      </p>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSortChange(opt.value)}
            className={[
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border",
              sort === opt.value
                ? "border-primary-600 bg-primary-50 text-primary-600"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
