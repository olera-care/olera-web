"use client";

import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Pillar F — Traffic details (compact summary).
 *
 * Shows the at-a-glance traffic snapshot directly on the dashboard —
 * lifetime views, this-period views, delta vs prior period — and deep
 * links into the full analytics page for trend chart, sources, funnel.
 *
 * Kept compact intentionally. The /provider page is the home base; when
 * a provider wants to dig in, they click through to the full report.
 */

interface Props {
  data: ProviderDashboardV2Data;
}

export default function TrafficSummaryCard({ data }: Props) {
  const { views, window } = data;
  const windowLabel = window === "7d" ? "this week" : window === "90d" ? "last 90 days" : "this month";

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">
          Traffic
        </p>
        <Link
          href="/portal/analytics"
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
        >
          See full report →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[28px] font-display font-semibold text-gray-900 leading-none tabular-nums">
            {views.thisPeriod.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1.5">Views {windowLabel}</p>
        </div>
        <div>
          <p className="text-[28px] font-display font-semibold text-gray-900 leading-none tabular-nums">
            {views.lifetime.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1.5">Lifetime views</p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          vs prior period: <span className="tabular-nums">{views.priorPeriod.toLocaleString()}</span>
        </span>
        <DeltaBadge deltaPct={views.deltaPct} />
      </div>
    </div>
  );
}

function DeltaBadge({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct === null) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  if (deltaPct === 0) {
    return <span className="text-xs text-gray-500">flat</span>;
  }
  const up = deltaPct > 0;
  return (
    <span
      className={`text-xs font-medium ${up ? "text-emerald-700" : "text-gray-500"}`}
    >
      {up ? "↑" : "↓"} {Math.abs(deltaPct)}%
    </span>
  );
}
