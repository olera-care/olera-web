"use client";

import type { Health } from "@/lib/medjobs/funnel-health";

/**
 * The health pill. Colours come from the design system's own semantic scales
 * (success / warning / error in tailwind.config.ts), which is where every other
 * status in the product reads from, so this reads as part of the application
 * rather than a dashboard bolted onto it.
 */

const STYLE: Record<Health, { chip: string; dot: string; label: string }> = {
  green: { chip: "bg-success-50 text-success-700 border-success-200", dot: "bg-success-500", label: "Green" },
  yellow: { chip: "bg-warning-50 text-warning-700 border-warning-200", dot: "bg-warning-500", label: "Yellow" },
  red: { chip: "bg-error-50 text-error-700 border-error-200", dot: "bg-error-500", label: "Red" },
  unscored: { chip: "bg-gray-50 text-gray-500 border-gray-200", dot: "bg-gray-300", label: "Not scored" },
};

export default function HealthBadge({
  status,
  score,
  size = "sm",
  title,
}: {
  status: Health;
  /** Omit on a plain status chip. */
  score?: number;
  size?: "sm" | "lg";
  title?: string;
}) {
  const s = STYLE[status];
  const lg = size === "lg";
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-2 rounded-full border font-semibold ${s.chip} ${
        lg ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      <span className={`rounded-full ${s.dot} ${lg ? "h-2.5 w-2.5" : "h-2 w-2"}`} aria-hidden />
      {s.label}
      {score != null && status !== "unscored" ? (
        <span className="tabular-nums font-bold">{score}</span>
      ) : null}
    </span>
  );
}
