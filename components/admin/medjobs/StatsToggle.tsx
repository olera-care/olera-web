"use client";

/**
 * Numbers off by default. The health dot on each stage is the summary an
 * operator reads first; the figures behind it are for when they have found the
 * stage they care about.
 */
export default function StatsToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
    >
      <span
        className={`relative h-4 w-7 rounded-full transition-colors ${
          on ? "bg-primary-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            on ? "left-3.5" : "left-0.5"
          }`}
        />
      </span>
      {on ? "Stats on" : "Stats off"}
    </button>
  );
}
