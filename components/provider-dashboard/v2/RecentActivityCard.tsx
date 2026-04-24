"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Pillar E — Recent activity inbox.
 *
 * Two-part card that delivers both a pulse signal and a compact inbox:
 *
 *   1. Pulse row (LinkedIn-style): "N families viewed your page this month,
 *      ↑ X% vs. last month." One line, aggregated — not five identical rows.
 *      Clicks through to the full Traffic report.
 *
 *   2. Event rows: questions / leads / reviews. The things a provider might
 *      actually want to respond to. Capped at 3 by default with "Show all
 *      activity ↓" to expand inline — no route needed, and action items that
 *      fall past the cap are still reachable without scroll-locking the user
 *      into a separate page.
 *
 * Rationale: the analytics cluster sits *on top of* a profile editor. Keeping
 * the card compact (≈5 rows) lets the editor surface in the same viewport
 * while still delivering the "something's happening" hook that brings
 * providers back. The pulse aggregation is the hook; the event list is the
 * follow-through.
 */

interface Props {
  data: ProviderDashboardV2Data;
}

type ActivityItem = ProviderDashboardV2Data["recentActivity"][number];

const DEFAULT_VISIBLE = 3;

export default function RecentActivityCard({ data }: Props) {
  const events = data.recentActivity;
  const viewsThisPeriod = data.views.thisPeriod;
  const viewsPriorPeriod = data.views.priorPeriod;
  const deltaPct = data.views.deltaPct;
  const hasPulse = viewsThisPeriod > 0;
  const hasEvents = events.length > 0;

  const [expanded, setExpanded] = useState(false);

  if (!hasPulse && !hasEvents) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 px-6 py-5 mb-6">
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-3">
          Recent activity
        </p>
        <p className="text-sm text-gray-400">
          Nothing yet. As families interact with your page, you&apos;ll see it here.
        </p>
      </div>
    );
  }

  const visibleEvents = expanded ? events : events.slice(0, DEFAULT_VISIBLE);
  const hasMore = events.length > DEFAULT_VISIBLE;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-6 py-5 mb-6">
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-3">
        Recent activity
      </p>

      {hasPulse && (
        <PulseRow
          views={viewsThisPeriod}
          priorViews={viewsPriorPeriod}
          deltaPct={deltaPct}
          window={data.window}
        />
      )}

      {hasPulse && hasEvents && (
        <div className="h-px bg-gray-100 my-3" aria-hidden />
      )}

      {hasEvents && (
        <ul className="space-y-1">
          {visibleEvents.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          {expanded ? "Show less" : `Show all ${events.length} activity items`}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

function PulseRow({
  views,
  priorViews,
  deltaPct,
  window,
}: {
  views: number;
  priorViews: number;
  deltaPct: number | null;
  window: ProviderDashboardV2Data["window"];
}) {
  const periodLabel = windowPeriodLabel(window);
  const priorLabel = windowPriorLabel(window);
  const familyNoun = views === 1 ? "family" : "families";

  const showDelta = deltaPct !== null && priorViews > 0;
  const direction: "up" | "down" | "flat" =
    deltaPct === null || deltaPct === 0 ? "flat" : deltaPct > 0 ? "up" : "down";

  return (
    <Link
      href="/portal/analytics"
      className="flex items-start gap-3 -mx-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-50">
        <svg
          className="w-4 h-4 text-emerald-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 leading-snug">
          <span className="font-semibold tabular-nums">{views}</span>{" "}
          {familyNoun} viewed your page {periodLabel}
        </p>
        {showDelta && (
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            <span
              className={
                direction === "up"
                  ? "text-emerald-600"
                  : direction === "down"
                    ? "text-gray-500"
                    : "text-gray-400"
              }
            >
              {direction === "flat"
                ? "flat"
                : `${direction === "up" ? "↑" : "↓"} ${Math.abs(deltaPct ?? 0)}%`}
            </span>{" "}
            vs. {priorLabel}
          </p>
        )}
      </div>
      <svg
        className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-2 transition-colors"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </Link>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const icon = iconForKind(item.kind);
  const relative = formatRelative(item.timestamp);

  const body = (
    <div className="flex items-start gap-3 py-2 group">
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${icon.bg}`}>
        {icon.svg}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 leading-snug">
          {item.title}
          <span className="text-gray-400 font-normal"> · {relative}</span>
        </p>
        {item.detail && (
          <p className="text-sm text-gray-500 mt-0.5 leading-snug truncate">
            {item.kind === "question" || item.kind === "question_answered"
              ? `"${item.detail}"`
              : item.detail}
          </p>
        )}
      </div>
      {item.actionHref && (
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-2 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      )}
    </div>
  );

  return (
    <li>
      {item.actionHref ? (
        <Link href={item.actionHref} className="block hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

function iconForKind(kind: ActivityItem["kind"]): {
  bg: string;
  svg: React.ReactNode;
} {
  if (kind === "question" || kind === "question_answered") {
    return {
      bg: "bg-blue-50",
      svg: (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    };
  }
  if (kind === "lead") {
    return {
      bg: "bg-amber-50",
      svg: (
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    };
  }
  // review
  return {
    bg: "bg-yellow-50",
    svg: (
      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  };
}

function windowPeriodLabel(window: ProviderDashboardV2Data["window"]): string {
  if (window === "7d") return "this week";
  if (window === "90d") return "in the last 90 days";
  return "this month";
}

function windowPriorLabel(window: ProviderDashboardV2Data["window"]): string {
  if (window === "7d") return "last week";
  if (window === "90d") return "prior 90 days";
  return "last month";
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
