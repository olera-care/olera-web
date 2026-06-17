"use client";

import type { ClaimTrustLevel } from "@/lib/claim-trust";

export type TrustScoreStatus = "idle" | "scoring" | ClaimTrustLevel;

interface TrustScoreBadgeProps {
  status: TrustScoreStatus;
  reason?: string;
  className?: string;
}

/**
 * Badge showing predicted trust level when provider claims with this email.
 * - idle: nothing shown
 * - scoring: spinner + "Checking trust..."
 * - high: High Trust (blue)
 * - medium: Medium Trust (amber)
 * - low: Low Trust (red)
 */
export default function TrustScoreBadge({
  status,
  reason,
  className = "",
}: TrustScoreBadgeProps) {
  if (status === "idle") return null;

  const config: Record<
    Exclude<TrustScoreStatus, "idle">,
    { icon: React.ReactNode; text: string; classes: string }
  > = {
    scoring: {
      icon: (
        <svg
          className="w-3 h-3 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ),
      text: "Checking trust...",
      classes: "text-gray-500",
    },
    high: {
      icon: <span>●</span>,
      text: "High Trust",
      classes: "text-blue-600",
    },
    medium: {
      icon: <span>●</span>,
      text: "Medium Trust",
      classes: "text-amber-600",
    },
    low: {
      icon: <span>●</span>,
      text: "Low Trust",
      classes: "text-red-600",
    },
  };

  const { icon, text, classes } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${classes} ${className}`}
      title={reason || undefined}
    >
      {icon} {text}
    </span>
  );
}
